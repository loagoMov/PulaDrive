import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { isGlobalAdmin, requireGlobalAdmin } from "./utils";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "./rateLimit";

// Helper to assert authentication
async function requireAuth(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized: You must be signed in.");
    return identity;
}

// ─── Apply for a featured listing (Dealers) ──────────────────────────────────
export const apply = mutation({
    args: {
        vehicleId: v.id("vehicles"),
        durationDays: v.union(v.literal(7), v.literal(14), v.literal(30)),
    },
    handler: async (ctx, args) => {
        const identity = await requireAuth(ctx);

        // CRIT-03 fix: rate limit featured applications (max 3 per 24h per user)
        await checkRateLimit(
            ctx,
            rateLimitKey("featured_apply", "user", identity.subject),
            RATE_LIMITS.FEATURED_APPLY
        );

        const vehicle = await ctx.db.get(args.vehicleId);
        if (!vehicle) throw new ConvexError("Vehicle not found.");

        // Verify dealer ownership
        const dealership = await ctx.db.get(vehicle.dealerId);
        if (!dealership) throw new ConvexError("Dealership not found.");
        const callerOrgId = identity.orgID ?? identity.orgId ?? identity.subject;
        if (dealership.clerkOrgId !== callerOrgId) {
            throw new ConvexError("Forbidden: You cannot apply for vehicles you do not own.");
        }

        // Determine pricing
        let price = 200;
        if (args.durationDays === 14) price = 450;
        if (args.durationDays === 30) price = 600;

        const now = Date.now();
        const activeFeatured = await ctx.db
            .query("vehicles")
            .withIndex("by_status_and_featured_until", (q) => q.eq("status", "available").gt("featuredUntil", now))
            .take(500);
        const activeCount = activeFeatured.length;

        const status = activeCount >= 10 ? "waitlisted" : "pending";

        const applicationId = await ctx.db.insert("featuredApplications", {
            vehicleId: args.vehicleId,
            dealerId: vehicle.dealerId,
            durationDays: args.durationDays,
            price,
            status,
            appliedAt: Date.now(),
        });

        // Push notification to admins
        await ctx.db.insert("notifications", {
            recipientId: "admin",
            type: "system",
            title: "New Promotion Request",
            message: `${dealership.name} requested featured slot for ${vehicle.year} ${vehicle.make} ${vehicle.model} (${args.durationDays} days).`,
            isRead: false,
            createdAt: Date.now(),
            actionUrl: "/admin?tab=promotions",
        });

        // Fire-and-forget: notify admins of the new promotion request
        await ctx.scheduler.runAfter(0, internal.email.sendAdminNotification, {
            type: "promotion",
            details: {
                applicationId,
                vehicleId:   args.vehicleId,
                dealerId:    vehicle.dealerId,
                vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                dealerName:  dealership.name,
                durationDays: args.durationDays,
                price,
                status,
            },
        });

        return { applicationId, status };
    },
});

// ─── List applications (Admin sees all, Dealer sees theirs) ───────────────────
export const list = query({
    args: {
        status: v.optional(v.union(
            v.literal("pending"), 
            v.literal("waitlisted"), 
            v.literal("approved"), 
            v.literal("rejected"),
            v.literal("expired"),
            v.literal("revoked")
        )),
    },
    handler: async (ctx, args) => {
        const identity = await requireAuth(ctx);
        const isAdmin = await isGlobalAdmin(ctx);

        if (isAdmin) {
            let apps = await ctx.db.query("featuredApplications").order("desc").collect();
            if (args.status) {
                apps = apps.filter((a) => a.status === args.status);
            }
            return Promise.all(
                apps.map(async (app) => {
                    const vehicle = await ctx.db.get(app.vehicleId);
                    const dealer = await ctx.db.get(app.dealerId);
                    return {
                        ...app,
                        vehicleName: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Unknown Vehicle",
                        vehicleImage: vehicle?.images?.[0] ? await ctx.storage.getUrl(vehicle.images[0]) : null,
                        dealerName: dealer?.name || "Unknown Dealer",
                        featuredUntil: vehicle?.featuredUntil,
                    };
                })
            );
        }

        // For regular dealer users, fetch applications by dealerId
        const callerOrgId = identity.orgID ?? identity.orgId ?? identity.subject;
        const dealership = await ctx.db
            .query("dealerships")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", callerOrgId))
            .first();

        if (!dealership) return [];

        let apps = await ctx.db
            .query("featuredApplications")
            .withIndex("by_dealer", (q) => q.eq("dealerId", dealership._id))
            .order("desc")
            .collect();

        if (args.status) {
            apps = apps.filter((a) => a.status === args.status);
        }

        return Promise.all(
            apps.map(async (app) => {
                const vehicle = await ctx.db.get(app.vehicleId);
                return {
                    ...app,
                    vehicleName: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Unknown Vehicle",
                    vehicleImage: vehicle?.images?.[0] ? await ctx.storage.getUrl(vehicle.images[0]) : null,
                    featuredUntil: vehicle?.featuredUntil,
                };
            })
        );
    },
});

// ─── Approve Application (Admins Only) ─────────────────────────────────────────
export const approve = mutation({
    args: { applicationId: v.id("featuredApplications") },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        const app = await ctx.db.get(args.applicationId);
        if (!app) throw new ConvexError("Application not found.");
        if (app.status === "approved") throw new ConvexError("Application is already approved.");

        const vehicle = await ctx.db.get(app.vehicleId);
        if (!vehicle) throw new ConvexError("Associated vehicle not found.");

        // Set/Extend featured status
        const currentFeaturedUntil = vehicle.featuredUntil ?? 0;
        const startTimestamp = Math.max(currentFeaturedUntil, Date.now());
        const featuredUntil = startTimestamp + app.durationDays * 24 * 60 * 60 * 1000;

        await ctx.db.patch(app.vehicleId, { featuredUntil });
        await ctx.db.patch(args.applicationId, { status: "approved" });

        return { success: true };
    },
});

// ─── Reject Application (Admins Only) ─────────────────────────────────────────
export const reject = mutation({
    args: { applicationId: v.id("featuredApplications") },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        const app = await ctx.db.get(args.applicationId);
        if (!app) throw new ConvexError("Application not found.");

        await ctx.db.patch(args.applicationId, { status: "rejected" });
        return { success: true };
    },
});

// ─── Revoke Active Featured Status (Admins Only) ──────────────────────────────
export const revoke = mutation({
    args: { applicationId: v.id("featuredApplications") },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        const app = await ctx.db.get(args.applicationId);
        if (!app) throw new ConvexError("Application not found.");
        if (app.status !== "approved") throw new ConvexError("Only approved active applications can be revoked.");

        await ctx.db.patch(app.vehicleId, { featuredUntil: undefined });
        await ctx.db.patch(args.applicationId, { status: "revoked" });

        return { success: true };
    },
});

// ─── Count Active Slots ───────────────────────────────────────────────────────
export const getActiveSlots = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        // Count active featured slots directly using the new index
        const activeFeatured = await ctx.db
            .query("vehicles")
            .withIndex("by_status_and_featured_until", (q) => q.eq("status", "available").gt("featuredUntil", now))
            .take(500);
        const activeCount = activeFeatured.length;

        return {
            activeCount,
            totalSlots: 10,
            remaining: Math.max(0, 10 - activeCount),
        };
    },
});

// ─── Internal: Auto-clear Expired Listings ────────────────────────────────────
import { internalMutation } from "./_generated/server";

export const clearExpired = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        
        // Find all approved applications
        const approvedApps = await ctx.db
            .query("featuredApplications")
            .withIndex("by_status", (q) => q.eq("status", "approved"))
            .collect();
            
        for (const app of approvedApps) {
            const vehicle = await ctx.db.get(app.vehicleId);
            if (vehicle && vehicle.featuredUntil && vehicle.featuredUntil <= now) {
                // Time limit reached
                await ctx.db.patch(vehicle._id, { featuredUntil: undefined });
                await ctx.db.patch(app._id, { status: "expired" });
            } else if (!vehicle) {
                // Vehicle was deleted but app was left behind
                await ctx.db.patch(app._id, { status: "expired" });
            }
        }
    },
});

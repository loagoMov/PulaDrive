import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { requireGlobalAdmin, isGlobalAdmin } from "./utils";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "./rateLimit";



// ─── Submit a report (any user, including guests) ────────────────────────────
export const submit = mutation({
    args: {
        vehicleId:     v.id("vehicles"),
        dealerId:      v.id("dealerships"),
        reason:        v.string(),
        customMessage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Validate reason length
        if (args.reason.length > 100) throw new ConvexError("Reason too long.");
        if (args.customMessage && args.customMessage.length > 1000) {
            throw new ConvexError("Message must be under 1000 characters.");
        }

        // CRIT-03 + HIGH-04 fix: Rate limit report submissions.
        // Authenticated users get a tighter personal limit; anonymous guests
        // share a global bucket so a bot wave can't flood the admin queue.
        const identity = await ctx.auth.getUserIdentity();
        if (identity) {
            await checkRateLimit(
                ctx,
                rateLimitKey("report", "user", identity.subject),
                RATE_LIMITS.REPORT_USER
            );
        } else {
            // Guest path — shared bucket keyed by vehicle so the same vehicle
            // can't be mass-reported by anonymous bots simultaneously.
            await checkRateLimit(
                ctx,
                rateLimitKey("report", "guest", String(args.vehicleId)),
                RATE_LIMITS.REPORT_GUEST
            );
        }

        // Verify vehicle + dealer exist
        const vehicle = await ctx.db.get(args.vehicleId);
        if (!vehicle) throw new ConvexError("Vehicle not found.");
        const dealer = await ctx.db.get(args.dealerId);
        if (!dealer) throw new ConvexError("Dealership not found.");

        const reportId = await ctx.db.insert("reports", {
            vehicleId:      args.vehicleId,
            dealerId:       args.dealerId,
            reason:         args.reason,
            customMessage:  args.customMessage,
            reporterUserId: identity?.subject,
            reporterEmail:  identity?.email,
            status:         "open",
            updatedAt: Date.now(),
        });

        // Push notification to admins
        await ctx.db.insert("notifications", {
            recipientId: "admin",
            type: "system",
            title: "New Vehicle Report Submitted",
            message: `A report has been submitted for ${vehicle.year} ${vehicle.make} ${vehicle.model} (Dealer: ${dealer.name}). Reason: ${args.reason}`,
            isRead: false,
            createdAt: Date.now(),
            actionUrl: "/admin?tab=reports",
        });

        // Fire-and-forget: notify admins via email without blocking the response
        await ctx.scheduler.runAfter(0, internal.email.sendAdminNotification, {
            type: "report",
            details: {
                reportId,
                vehicleId:     args.vehicleId,
                dealerId:      args.dealerId,
                vehicleName:   `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                dealerName:    dealer.name,
                reason:        args.reason,
                customMessage: args.customMessage,
                reporterEmail: identity?.email,
            },
        });

        return reportId;
    },
});

// ─── List all reports (admin only) ───────────────────────────────────────────
export const listAll = query({
    args: {
        status: v.optional(v.union(
            v.literal("open"),
            v.literal("reviewed"),
            v.literal("dismissed")
        )),
        dealerId: v.optional(v.id("dealerships")),
    },
    handler: async (ctx, args) => {
        const isAdmin = await isGlobalAdmin(ctx);
        if (!isAdmin) {
            return [];
        }

        let reports;
        if (args.dealerId) {
            reports = await ctx.db
                .query("reports")
                .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId!))
                .order("desc")
                .collect();
            if (args.status) {
                reports = reports.filter((r) => r.status === args.status);
            }
        } else if (args.status) {
            reports = await ctx.db
                .query("reports")
                .withIndex("by_status", (q) => q.eq("status", args.status!))
                .order("desc")
                .take(100);
        } else {
            reports = await ctx.db.query("reports").order("desc").take(100);
        }

        // Enrich with vehicle + dealer info
        return Promise.all(
            reports.map(async (report) => {
                const vehicle  = await ctx.db.get(report.vehicleId);
                const dealer   = await ctx.db.get(report.dealerId);
                const imageUrl = vehicle?.images?.[0]
                    ? await ctx.storage.getUrl(vehicle.images[0])
                    : null;

                return {
                    ...report,
                    vehicle: vehicle
                        ? { make: vehicle.make, model: vehicle.model, year: vehicle.year, price: vehicle.price, imageUrl }
                        : null,
                    dealer: dealer
                        ? { name: dealer.name, slug: dealer.slug, location: dealer.location }
                        : null,
                };
            })
        );
    },
});

// ─── Update report status / add admin note (admin only) ──────────────────────
export const updateStatus = mutation({
    args: {
        id:        v.id("reports"),
        status:    v.union(v.literal("open"), v.literal("reviewed"), v.literal("dismissed")),
        adminNote: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        const report = await ctx.db.get(args.id);
        if (!report) throw new ConvexError("Report not found.");
        await ctx.db.patch(args.id, {
            status:    args.status,
            adminNote: args.adminNote,
            updatedAt: Date.now(),
        });
    },
});

// ─── Delete a report (admin only) ────────────────────────────────────────────
export const remove = mutation({
    args: { id: v.id("reports") },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        await ctx.db.delete(args.id);
    },
});

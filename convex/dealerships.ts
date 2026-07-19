import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { isGlobalAdmin, requireGlobalAdmin } from "./utils";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "./rateLimit";

// MED-02 fix: server-side email format validation helper
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateEmail(email: string): void {
    if (email.length > 254) throw new ConvexError("Email address is too long (max 254 characters).");
    if (!EMAIL_REGEX.test(email)) throw new ConvexError(`"${email}" is not a valid email address.`);
}

export const list = query({
    handler: async (ctx) => {
        const rows = await ctx.db.query("dealerships").order("desc").take(50);
        // MED-06 fix: mask full phone in public listing — only show last 4 digits.
        // The full number is only exposed in authenticated dealer/admin contexts.
        return rows.map((d) => ({
            ...d,
            phone: d.phone ? `***${d.phone.slice(-4)}` : undefined,
        }));
    },
});

export const search = query({
    args: { queryText: v.string() },
    handler: async (ctx, args) => {
        const safeQuery = args.queryText.toLowerCase().trim();
        if (safeQuery === "") {
            return [];
        }
        const rows = await ctx.db.query("dealerships").collect();
        const filtered = rows.filter((d) => 
            d.name.toLowerCase().includes(safeQuery) ||
            d.location.toLowerCase().includes(safeQuery) ||
            (d.description && d.description.toLowerCase().includes(safeQuery))
        );
        return filtered.map((d) => ({
            ...d,
            phone: d.phone ? `***${d.phone.slice(-4)}` : undefined,
        }));
    },
});

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("dealerships")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .unique();
    },
});

export const getByClerkOrgId = query({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("dealerships")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
            .unique();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        location: v.string(),
        slug: v.string(),
        clerkOrgId: v.string(),
        logoUrl: v.optional(v.string()),
        authorizedEmails: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        // V-02 fix: require authentication
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized: You must be signed in to register a dealership.");
        }

        // CRIT-03 fix: rate limit dealership creation
        await checkRateLimit(
            ctx,
            rateLimitKey("create_dealer", "user", identity.subject),
            RATE_LIMITS.CREATE_DEALERSHIP
        );

        // V-03 fix: the caller can only register their own Clerk org as a dealership.
        const isAdmin = await isGlobalAdmin(ctx);
        if (!isAdmin) {
            const callerOrgId = identity.orgID ?? identity.orgId;
            if (!callerOrgId) {
                throw new ConvexError(
                    "Forbidden: Clerk organization context is missing in Convex authentication token. " +
                    "Please ensure you have selected an organization in the portal, or " +
                    "ensure the Clerk JWT template includes the 'org_id' custom claim."
                );
            }
            if (args.clerkOrgId !== callerOrgId) {
                throw new ConvexError("Forbidden: You can only register a dealership for your own organization.");
            }
        }

        // Input length limits
        if (args.name.length > 100) throw new ConvexError("Dealership name must be ≤ 100 characters.");
        if (args.location.length > 200) throw new ConvexError("Location must be ≤ 200 characters.");
        if (args.slug.length > 100) throw new ConvexError("Slug must be ≤ 100 characters.");

        // MED-02 fix: validate any provided authorized emails
        if (args.authorizedEmails) {
            for (const email of args.authorizedEmails) {
                validateEmail(email);
            }
        }

        const existing = await ctx.db
            .query("dealerships")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
            .first();

        const emailList = args.authorizedEmails ?? (identity.email ? [identity.email] : []);
        if (emailList.length === 0) {
            throw new ConvexError("At least one authorized email address is required.");
        }

        if (existing) {
            if (!existing.authorizedEmails) {
                await ctx.db.patch(existing._id, { authorizedEmails: emailList, updatedAt: Date.now() });
            }
            return existing._id;
        }

        return await ctx.db.insert("dealerships", {
            name: args.name,
            location: args.location,
            slug: args.slug,
            clerkOrgId: args.clerkOrgId,
            logoUrl: args.logoUrl,
            authorizedEmails: emailList,
            subscriptionTier: "starter",
            updatedAt: Date.now(),
        });
    },
});

export const updateAuthorizedEmails = mutation({
    args: {
        id: v.id("dealerships"),
        authorizedEmails: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized: You must be signed in.");
        }

        const dealership = await ctx.db.get(args.id);
        if (!dealership) {
            throw new ConvexError("Dealership not found.");
        }

        const callerOrgId = (identity as any).orgID ?? (identity as any).orgId ?? identity.subject;
        const isOrgMember = dealership.clerkOrgId === callerOrgId;
        const isGlobal = await isGlobalAdmin(ctx);
        const isCurrentDealerAdmin = identity.email && dealership.authorizedEmails?.includes(identity.email);

        if (!isGlobal && !isCurrentDealerAdmin && !isOrgMember) {
            throw new ConvexError("Forbidden: You are not authorized to update this dealership's admin emails.");
        }

        if (args.authorizedEmails.length < 1) {
            throw new ConvexError("At least 1 authorized email address must be registered.");
        }

        // MED-02 fix: validate all emails server-side before persisting
        for (const email of args.authorizedEmails) {
            validateEmail(email);
        }

        // CRIT-03 fix: rate limit contact updates
        await checkRateLimit(
            ctx,
            rateLimitKey("update_contact", "user", identity.subject),
            RATE_LIMITS.UPDATE_CONTACT
        );

        await ctx.db.patch(args.id, {
            authorizedEmails: args.authorizedEmails,
            updatedAt: Date.now(),
        });
    },
});

export const checkGlobalAdmin = query({
    args: {},
    handler: async (ctx) => {
        return await isGlobalAdmin(ctx);
    },
});

export const listAll = query({
    args: {},
    handler: async (ctx) => {
        await requireGlobalAdmin(ctx);
        return await ctx.db.query("dealerships").order("desc").collect();
    },
});

export const updateRating = mutation({
    args: {
        id: v.id("dealerships"),
        rating: v.number(),
    },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        if (args.rating < 0 || args.rating > 5) {
            throw new ConvexError("Rating must be between 0 and 5.");
        }
        await ctx.db.patch(args.id, { rating: args.rating, updatedAt: Date.now() });
    },
});

export const updatePhone = mutation({
    args: {
        id: v.id("dealerships"),
        phone: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized: You must be signed in.");
        }

        const dealership = await ctx.db.get(args.id);
        if (!dealership) {
            throw new ConvexError("Dealership not found.");
        }

        const callerOrgId = (identity as any).orgID ?? (identity as any).orgId ?? identity.subject;
        const isOrgMember = dealership.clerkOrgId === callerOrgId;
        const isGlobal = await isGlobalAdmin(ctx);
        const isCurrentDealerAdmin = identity.email && dealership.authorizedEmails?.includes(identity.email);

        if (!isGlobal && !isCurrentDealerAdmin && !isOrgMember) {
            throw new ConvexError("Forbidden: You are not authorized to update this dealership's contact phone.");
        }

        // CRIT-03 fix: rate limit contact updates
        await checkRateLimit(
            ctx,
            rateLimitKey("update_contact", "user", identity.subject),
            RATE_LIMITS.UPDATE_CONTACT
        );

        // Validate phone number format or just save clean version
        const cleanedPhone = args.phone.replace(/\D/g, "");
        if (cleanedPhone.length < 7 || cleanedPhone.length > 15) {
            throw new ConvexError("Invalid phone number. Must be 7–15 digits including country code.");
        }

        await ctx.db.patch(args.id, {
            phone: cleanedPhone,
            updatedAt: Date.now(),
        });
    },
});

export const updateDetails = mutation({
    args: {
        id: v.id("dealerships"),
        description: v.optional(v.string()),
        googleMapsUrl: v.optional(v.string()),
        contactEmail: v.optional(v.string()),
        contactPhone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized: You must be signed in.");
        }

        const dealership = await ctx.db.get(args.id);
        if (!dealership) {
            throw new ConvexError("Dealership not found.");
        }

        const callerOrgId = (identity as any).orgID ?? (identity as any).orgId ?? identity.subject;
        const isOrgMember = dealership.clerkOrgId === callerOrgId;
        const isGlobal = await isGlobalAdmin(ctx);
        const isCurrentDealerAdmin = identity.email && dealership.authorizedEmails?.includes(identity.email);

        if (!isGlobal && !isCurrentDealerAdmin && !isOrgMember) {
            throw new ConvexError("Forbidden: You are not authorized to update this dealership's details.");
        }

        // Rate limit profile details updates
        await checkRateLimit(
            ctx,
            rateLimitKey("update_contact", "user", identity.subject),
            RATE_LIMITS.UPDATE_CONTACT
        );

        if (args.description && args.description.length > 1000) {
            throw new ConvexError("Description must be <= 1000 characters.");
        }
        if (args.contactEmail) {
            validateEmail(args.contactEmail);
        }
        
        let cleanedPhone = args.contactPhone;
        if (cleanedPhone) {
            cleanedPhone = cleanedPhone.replace(/\D/g, "");
            if (cleanedPhone.length < 7 || cleanedPhone.length > 15) {
                throw new ConvexError("Invalid contact phone number. Must be 7-15 digits.");
            }
        }

        await ctx.db.patch(args.id, {
            description: args.description,
            googleMapsUrl: args.googleMapsUrl,
            contactEmail: args.contactEmail,
            contactPhone: cleanedPhone,
            updatedAt: Date.now(),
        });
    },
});


export const remove = mutation({
    args: { id: v.id("dealerships") },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);

        const dealership = await ctx.db.get(args.id);
        if (!dealership) {
            throw new ConvexError("Dealership not found.");
        }

        // 1. Find and delete all vehicles and their storage images
        const vehicles = await ctx.db
            .query("vehicles")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.id))
            .collect();

        for (const vehicle of vehicles) {
            if (vehicle.images) {
                for (const storageId of vehicle.images) {
                    try {
                        await ctx.storage.delete(storageId);
                    } catch (err) {
                        console.error(`Failed to delete storage image ${storageId}:`, err);
                    }
                }
            }
            // Delete reports for this vehicle
            const vehicleReports = await ctx.db
                .query("reports")
                .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
                .collect();
            for (const report of vehicleReports) {
                await ctx.db.delete(report._id);
            }

            // Delete featured applications for this vehicle
            const vehicleFeatured = await ctx.db
                .query("featuredApplications")
                .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
                .collect();
            for (const app of vehicleFeatured) {
                await ctx.db.delete(app._id);
            }

            // Delete listing analytics for this vehicle
            const vehicleAnalytics = await ctx.db
                .query("listingAnalytics")
                .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
                .collect();
            for (const analytics of vehicleAnalytics) {
                await ctx.db.delete(analytics._id);
            }

            // Finally delete the vehicle itself
            await ctx.db.delete(vehicle._id);
        }

        // 2. Delete all invoices for the dealership
        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.id))
            .collect();
        for (const invoice of invoices) {
            await ctx.db.delete(invoice._id);
        }

        // 3. Delete all notifications for the dealership
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_recipient", (q) => q.eq("recipientId", args.id))
            .collect();
        for (const notification of notifications) {
            await ctx.db.delete(notification._id);
        }

        // 4. Delete reports associated directly with the dealer (if any)
        const reports = await ctx.db
            .query("reports")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.id))
            .collect();
        for (const report of reports) {
            await ctx.db.delete(report._id);
        }

        // 5. Delete featured applications associated with the dealer (redundant but safe)
        const featuredApps = await ctx.db
            .query("featuredApplications")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.id))
            .collect();
        for (const app of featuredApps) {
            await ctx.db.delete(app._id);
        }

        // 6. Delete listing analytics associated with the dealer (redundant but safe)
        const analytics = await ctx.db
            .query("listingAnalytics")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.id))
            .collect();
        for (const analytic of analytics) {
            await ctx.db.delete(analytic._id);
        }

        // 7. Delete the dealership itself
        await ctx.db.delete(args.id);
    },
});

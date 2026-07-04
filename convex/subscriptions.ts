import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireGlobalAdmin, isGlobalAdmin } from "./utils";

// ── Tier configuration ────────────────────────────────────────────────────────

export const TIERS = {
    starter:   { label: "Starter",   priceMonthly: 150000, slotLimit: 50 },    // P 1,500 — 50 slots
    growth:    { label: "Growth",    priceMonthly: 250000, slotLimit: 150 },   // P 2,500 — 150 slots
    unlimited: { label: "Unlimited", priceMonthly: 350000, slotLimit: Infinity }, // P 3,500 — unlimited
} as const;

export type TierKey = keyof typeof TIERS;

/** Cost per extra slot (in cents): P 200 */
export const EXTRA_SLOT_UNIT_COST = 20000;

// ── Helper: resolve effective slot limit for a dealer ────────────────────────

function effectiveLimit(
    tier: TierKey,
    override: number | undefined
): number {
    const base = TIERS[tier].slotLimit;
    if (base === Infinity) return Infinity;
    return base + (override ?? 0);
}

// ── getSubscriptionStatus — dealer + admin ────────────────────────────────────

export const getSubscriptionStatus = query({
    args: { dealerId: v.id("dealerships") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("Unauthorized: You must be signed in.");

        const dealer = await ctx.db.get(args.dealerId);
        if (!dealer) throw new ConvexError("Dealership not found.");

        const adminCheck = await isGlobalAdmin(ctx);
        if (!adminCheck) {
            const callerOrgId = (identity as any).orgID ?? (identity as any).orgId ?? identity.subject;
            if (dealer.clerkOrgId !== callerOrgId) {
                throw new ConvexError("Forbidden: Access denied.");
            }
        }

        const tier: TierKey = (dealer.subscriptionTier as TierKey) ?? "starter";
        const override = dealer.listingSlotOverride ?? 0;
        const limit = effectiveLimit(tier, override);

        // Count only active (non-sold) vehicles
        const activeVehicles = await ctx.db
            .query("vehicles")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
            .filter((q) =>
                q.and(
                    q.neq(q.field("status"), "sold")
                )
            )
            .collect();

        const usedSlots = activeVehicles.length;
        const remainingSlots = limit === Infinity ? Infinity : Math.max(0, limit - usedSlots);
        const isAtLimit = limit !== Infinity && usedSlots >= limit;

        return {
            tier,
            tierConfig: TIERS[tier],
            slotLimit: limit,
            usedSlots,
            remainingSlots,
            isAtLimit,
            slotOverride: override,
        };
    },
});

// ── setDealerTier — admin only ────────────────────────────────────────────────

export const setDealerTier = mutation({
    args: {
        dealerId: v.id("dealerships"),
        tier: v.union(
            v.literal("starter"),
            v.literal("growth"),
            v.literal("unlimited")
        ),
    },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        const dealer = await ctx.db.get(args.dealerId);
        if (!dealer) throw new ConvexError("Dealership not found.");

        await ctx.db.patch(args.dealerId, {
            subscriptionTier: args.tier,
            subscriptionTierStartDate: Date.now(),
            subscriptionTierLastInvoiced: Date.now(),
        });

        // Notify the dealer
        await ctx.db.insert("notifications", {
            recipientId: args.dealerId,
            type: "account",
            title: "Subscription Tier Updated",
            message: `Your subscription has been updated to the ${TIERS[args.tier].label} plan (${args.tier === "unlimited" ? "Unlimited" : `${TIERS[args.tier].slotLimit} listing slots`}, P ${(TIERS[args.tier].priceMonthly / 100).toFixed(0)}/month).`,
            isRead: false,
            createdAt: Date.now(),
            actionUrl: "/dashboard/billing",
        });
    },
});

// ── setSlotOverride — admin only (grant extra slots) ─────────────────────────

export const setSlotOverride = mutation({
    args: {
        dealerId: v.id("dealerships"),
        extraSlots: v.number(), // total extra slots on top of tier (replaces existing override)
    },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        if (args.extraSlots < 0) throw new ConvexError("Extra slots cannot be negative.");
        const dealer = await ctx.db.get(args.dealerId);
        if (!dealer) throw new ConvexError("Dealership not found.");

        await ctx.db.patch(args.dealerId, { listingSlotOverride: args.extraSlots });
    },
});

// ── requestUpgrade — dealer only ─────────────────────────────────────────────

export const requestUpgrade = mutation({
    args: {
        dealerId: v.id("dealerships"),
        requestType: v.union(v.literal("upgrade_tier"), v.literal("extra_slots")),
        requestedTier: v.optional(v.union(v.literal("growth"), v.literal("unlimited"))),
        extraSlotsRequested: v.optional(v.number()),
        message: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("Unauthorized: You must be signed in.");

        const dealer = await ctx.db.get(args.dealerId);
        if (!dealer) throw new ConvexError("Dealership not found.");

        const callerOrgId = (identity as any).orgID ?? (identity as any).orgId ?? identity.subject;
        if (dealer.clerkOrgId !== callerOrgId) {
            throw new ConvexError("Forbidden: You cannot submit a request for another dealership.");
        }

        // Validate request type args
        if (args.requestType === "upgrade_tier" && !args.requestedTier) {
            throw new ConvexError("Please specify the tier you want to upgrade to.");
        }
        if (args.requestType === "extra_slots") {
            if (!args.extraSlotsRequested || args.extraSlotsRequested < 1) {
                throw new ConvexError("Please specify at least 1 extra slot.");
            }
            if (args.extraSlotsRequested > 500) {
                throw new ConvexError("Cannot request more than 500 extra slots at once.");
            }
        }

        const extraSlotsCost =
            args.requestType === "extra_slots" && args.extraSlotsRequested
                ? args.extraSlotsRequested * EXTRA_SLOT_UNIT_COST
                : undefined;

        const requestId = await ctx.db.insert("subscriptionUpgradeRequests", {
            dealerId: args.dealerId,
            requestType: args.requestType,
            requestedTier: args.requestedTier,
            extraSlotsRequested: args.extraSlotsRequested,
            extraSlotsCost,
            message: args.message,
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Notify admin
        const upgradeLabel =
            args.requestType === "upgrade_tier"
                ? `upgrade to ${args.requestedTier ? TIERS[args.requestedTier].label : "a higher tier"}`
                : `${args.extraSlotsRequested} extra listing slots (P ${((extraSlotsCost ?? 0) / 100).toFixed(0)})`;

        await ctx.db.insert("notifications", {
            recipientId: "admin",
            type: "billing",
            title: "Subscription Request",
            message: `${dealer.name} has requested ${upgradeLabel}.`,
            isRead: false,
            createdAt: Date.now(),
            actionUrl: "/admin",
        });

        // Confirm to dealer
        await ctx.db.insert("notifications", {
            recipientId: args.dealerId,
            type: "billing",
            title: "Request Submitted",
            message: `Your subscription request has been received and is pending review. We will get back to you shortly.`,
            isRead: false,
            createdAt: Date.now(),
            actionUrl: "/dashboard/billing",
        });

        return requestId;
    },
});

// ── listUpgradeRequests — admin only ─────────────────────────────────────────

export const listUpgradeRequests = query({
    args: {
        status: v.optional(v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("dismissed")
        )),
    },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);

        const requests = args.status
            ? await ctx.db
                .query("subscriptionUpgradeRequests")
                .withIndex("by_status", (q) => q.eq("status", args.status!))
                .order("desc")
                .collect()
            : await ctx.db
                .query("subscriptionUpgradeRequests")
                .order("desc")
                .collect();

        // Attach dealer names
        const dealerMap = new Map<string, string>();
        for (const req of requests) {
            if (!dealerMap.has(req.dealerId)) {
                const d = await ctx.db.get(req.dealerId);
                dealerMap.set(req.dealerId, d?.name ?? "Unknown Dealer");
            }
        }

        return requests.map((r) => ({
            ...r,
            dealerName: dealerMap.get(r.dealerId) ?? "Unknown",
        }));
    },
});

// ── resolveUpgradeRequest — admin only ───────────────────────────────────────

export const resolveUpgradeRequest = mutation({
    args: {
        requestId: v.id("subscriptionUpgradeRequests"),
        action: v.union(v.literal("approve"), v.literal("dismiss")),
        adminNote: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);

        const req = await ctx.db.get(args.requestId);
        if (!req) throw new ConvexError("Request not found.");
        if (req.status !== "pending") throw new ConvexError("This request has already been resolved.");

        const dealer = await ctx.db.get(req.dealerId);
        if (!dealer) throw new ConvexError("Dealership not found.");

        const newStatus = args.action === "approve" ? "approved" : "dismissed";
        await ctx.db.patch(args.requestId, {
            status: newStatus,
            adminNote: args.adminNote,
            resolvedAt: Date.now(),
            updatedAt: Date.now(),
        });

        if (args.action === "approve") {
            if (req.requestType === "upgrade_tier" && req.requestedTier) {
                // Apply the tier upgrade
                await ctx.db.patch(req.dealerId, {
                    subscriptionTier: req.requestedTier,
                    subscriptionTierStartDate: Date.now(),
                    subscriptionTierLastInvoiced: Date.now(),
                });

                await ctx.db.insert("notifications", {
                    recipientId: req.dealerId,
                    type: "account",
                    title: "Subscription Upgraded!",
                    message: `Great news! Your subscription has been upgraded to the ${TIERS[req.requestedTier].label} plan. You now have ${req.requestedTier === "unlimited" ? "unlimited" : TIERS[req.requestedTier].slotLimit} listing slots.`,
                    isRead: false,
                    createdAt: Date.now(),
                    actionUrl: "/dashboard/billing",
                });
            } else if (req.requestType === "extra_slots" && req.extraSlotsRequested) {
                // Add to existing override
                const currentOverride = dealer.listingSlotOverride ?? 0;
                await ctx.db.patch(req.dealerId, {
                    listingSlotOverride: currentOverride + req.extraSlotsRequested,
                    extraSlotsExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days timeline
                    extraSlotsLastInvoiced: Date.now(),
                });

                await ctx.db.insert("notifications", {
                    recipientId: req.dealerId,
                    type: "account",
                    title: "Extra Listing Slots Added!",
                    message: `${req.extraSlotsRequested} additional listing slots have been added to your account. An invoice for P ${((req.extraSlotsCost ?? 0) / 100).toFixed(0)} will be issued shortly.`,
                    isRead: false,
                    createdAt: Date.now(),
                    actionUrl: "/dashboard/billing",
                });
            }
        } else {
            // Dismissed
            await ctx.db.insert("notifications", {
                recipientId: req.dealerId,
                type: "billing",
                title: "Subscription Request Update",
                message: args.adminNote
                    ? `Your subscription request was not approved. Admin note: ${args.adminNote}`
                    : "Your subscription request was not approved at this time. Please contact us for more information.",
                isRead: false,
                createdAt: Date.now(),
                actionUrl: "/dashboard/billing",
            });
        }
    },
});

// ── getDealerUpgradeRequests — dealer view of their own requests ──────────────

export const getDealerUpgradeRequests = query({
    args: { dealerId: v.id("dealerships") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("Unauthorized: You must be signed in.");

        const dealer = await ctx.db.get(args.dealerId);
        if (!dealer) throw new ConvexError("Dealership not found.");

        const adminCheck = await isGlobalAdmin(ctx);
        if (!adminCheck) {
            const callerOrgId = (identity as any).orgID ?? (identity as any).orgId ?? identity.subject;
            if (dealer.clerkOrgId !== callerOrgId) {
                throw new ConvexError("Forbidden: Access denied.");
            }
        }

        return await ctx.db
            .query("subscriptionUpgradeRequests")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
            .order("desc")
            .collect();
    },
});

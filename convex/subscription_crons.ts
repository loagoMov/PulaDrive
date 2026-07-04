import { internalMutation } from "./_generated/server";
import { TIERS, TierKey } from "./subscriptions";

export const monitorSubscriptionCycles = internalMutation({
    handler: async (ctx) => {
        const now = Date.now();
        const dealers = await ctx.db.query("dealerships").collect();

        // 1 day in milliseconds
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        // 30 days cycle in milliseconds
        const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

        for (const dealer of dealers) {
            // ── A. Extra Slot Expiry (Suggest Repay 10 Days Before, Or Terminate) ──
            if (dealer.listingSlotOverride && dealer.listingSlotOverride > 0 && dealer.extraSlotsExpiresAt) {
                const timeLeft = dealer.extraSlotsExpiresAt - now;

                // Scenario A1: 10 days or fewer left, notify if we haven't warned recently
                if (timeLeft > 0 && timeLeft <= 10 * ONE_DAY_MS) {
                    const daysLeft = Math.ceil(timeLeft / ONE_DAY_MS);

                    // Check for recent notifications to avoid spamming
                    const lastWarning = await ctx.db.query("notifications")
                        .withIndex("by_recipient", (q) => q.eq("recipientId", dealer._id))
                        .filter((q) => q.eq(q.field("title"), "Extra Slots Expiring Soon"))
                        .order("desc")
                        .first();

                    if (!lastWarning || (now - lastWarning.createdAt) > 3 * ONE_DAY_MS) {
                        await ctx.db.insert("notifications", {
                            recipientId: dealer._id,
                            type: "billing",
                            title: "Extra Slots Expiring Soon",
                            message: `Your ${dealer.listingSlotOverride} extra listing slots will expire in ${daysLeft} days. Go to your Billing portal to repurchase or upgrade.`,
                            isRead: false,
                            createdAt: now,
                            actionUrl: "/dashboard/billing",
                        });
                    }
                }

                // Scenario A2: Past expiry, perform termination logic (strip extra slots)
                if (timeLeft <= 0) {
                    const currentOverride = dealer.listingSlotOverride;
                    
                    // Strip the extra slots
                    await ctx.db.patch(dealer._id, {
                        listingSlotOverride: 0,
                        extraSlotsExpiresAt: undefined,
                    });

                    // Notify the dealer
                    await ctx.db.insert("notifications", {
                        recipientId: dealer._id,
                        type: "account",
                        title: "Extra Slots Expired",
                        message: `Your ${currentOverride} extra listing slots have expired and been removed. Check your active listings to ensure slot limits are respected.`,
                        isRead: false,
                        createdAt: now,
                        actionUrl: "/dashboard/billing",
                    });
                }
            }

            // ── B. Main Subscription Cycle (Notify Admin for Invoicing/Renewal) ──
            const tier: TierKey = (dealer.subscriptionTier as TierKey) ?? "starter";
            const startDate = dealer.subscriptionTierStartDate ?? dealer._creationTime;
            
            // Check if current subscription duration is nearing a full month (30 days) since the last invoice
            const lastInvoiced = dealer.subscriptionTierLastInvoiced ?? startDate;
            const timeSinceLastInvoice = now - lastInvoiced;

            // Notify admin 3 days before the 30-day renewal cycle ends
            if (timeSinceLastInvoice >= (27 * ONE_DAY_MS)) {
                // Ensure we only notify the admin once per billing cycle
                const lastAdminNotification = await ctx.db.query("notifications")
                    .withIndex("by_recipient", (q) => q.eq("recipientId", "admin"))
                    .filter((q) => q.eq(q.field("title"), "Subscription Renewal Alert"))
                    .order("desc")
                    .first();

                const isAlreadyNotifiedThisCycle = lastAdminNotification && (now - lastAdminNotification.createdAt) < 20 * ONE_DAY_MS;

                if (!isAlreadyNotifiedThisCycle) {
                    const price = TIERS[tier]?.priceMonthly ?? 150000;
                    
                    await ctx.db.insert("notifications", {
                        recipientId: "admin",
                        type: "billing",
                        title: "Subscription Renewal Alert",
                        message: `${dealer.name} is approaching their renewal cycle. Click to generate a new invoice for their ${TIERS[tier]?.label} plan (P ${(price / 100).toFixed(0)}).`,
                        isRead: false,
                        createdAt: now,
                        actionUrl: `/admin/billing`,
                    });

                    // Mark subscription tier as invoiced for this period
                    await ctx.db.patch(dealer._id, {
                        subscriptionTierLastInvoiced: now
                    });
                }
            }
        }
    }
});

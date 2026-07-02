import { internalMutation } from "./_generated/server";

export const sweepInvoices = internalMutation({
    handler: async (ctx) => {
        const pendingInvoices = await ctx.db.query("invoices")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const now = new Date();
        const overdueThreshold = new Date(now);
        overdueThreshold.setDate(now.getDate() - 3); // 3 days ago

        // Batch fetch all unique dealer ids to avoid N+1 queries
        const dealerIds = Array.from(new Set(pendingInvoices.map(inv => inv.dealerId)));
        const dealers = await Promise.all(dealerIds.map(id => ctx.db.get(id)));
        const dealerMap = new Map(dealers.filter((d): d is NonNullable<typeof d> => d !== null).map(d => [d._id, d]));

        // Fetch recent warning notifications to prevent duplicates
        const recentNotifications = await ctx.db.query("notifications")
            .withIndex("by_created_at", (q) => q.gt("createdAt", Date.now() - 23 * 60 * 60 * 1000))
            .collect();

        for (const invoice of pendingInvoices) {
            const dueDate = new Date(invoice.dueDate);
            
            if (dueDate < now) {
                // If it's past due, mark it as overdue
                await ctx.db.patch(invoice._id, { status: "overdue" });
                
                // Deduplicate warnings (max 1 warning per dealer every 23h)
                const hasRecentWarning = recentNotifications.some(
                    n => n.recipientId === invoice.dealerId && 
                         n.type === "billing" && 
                         n.title === "Invoice Overdue Warning"
                );

                if (!hasRecentWarning) {
                    await ctx.db.insert("notifications", {
                        recipientId: invoice.dealerId,
                        type: "billing",
                        title: "Invoice Overdue Warning",
                        message: `Invoice ${invoice.invoiceNumber} for P ${(invoice.amount / 100).toFixed(2)} is now overdue. Please pay to avoid suspension.`,
                        isRead: false,
                        createdAt: Date.now(),
                        actionUrl: "/dashboard/billing",
                    });
                }
            }

            if (dueDate < overdueThreshold) {
                // It's more than 3 days overdue, freeze the dealer
                const dealer = dealerMap.get(invoice.dealerId);
                if (dealer && dealer.accountStatus !== "frozen") {
                    await ctx.db.patch(dealer._id, { accountStatus: "frozen" });
                    
                    await ctx.db.insert("notifications", {
                        recipientId: dealer._id,
                        type: "account",
                        title: "Account Suspended",
                        message: "Your account features have been suspended due to outstanding overdue invoices.",
                        isRead: false,
                        createdAt: Date.now(),
                        actionUrl: "/dashboard/billing",
                    });
                }
            }
        }
    }
});

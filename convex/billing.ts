import { mutation, query, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireGlobalAdmin, isGlobalAdmin } from "./utils";

export const generateInvoiceUrl = (dealerName: string, bursTin: string, invoiceNumber: string, amountPula?: number, dueDate?: string, description?: string, subDescription?: string) => {
    // Builds a fully-qualified URL to the CarPlace invoice renderer
    const base = `https://carplacebw.vercel.app/invoice?dealer=${encodeURIComponent(dealerName)}&tin=${encodeURIComponent(bursTin)}&inv=${encodeURIComponent(invoiceNumber)}&vat=0`;
    const withAmount  = amountPula     !== undefined ? `${base}&amount=${amountPula.toFixed(2)}` : base;
    const withDue     = dueDate        ? `${withAmount}&due=${encodeURIComponent(dueDate)}` : withAmount;
    const withDesc    = description    ? `${withDue}&desc=${encodeURIComponent(description)}` : withDue;
    return subDescription ? `${withDesc}&subdesc=${encodeURIComponent(subDescription)}` : withDesc;
};

/**
 * Generates a human-readable, sortable invoice number.
 *
 * Format: CP/{YYYY}/{MM}/{DEALER_CODE}/{SEQ}
 * Example: CP/2026/06/MAS/0001
 *
 * - CP      → CarPlace prefix
 * - YYYY/MM → year and month of issue (for easy chronological filtering)
 * - CODE    → 3-letter abbreviation of the dealer name (uppercased)
 * - SEQ     → 4-digit sequence of invoices issued this month for that dealer
 */
export function buildInvoiceNumber(dealerName: string, monthlySeq: number): string {
    const now    = new Date();
    const year   = now.getFullYear();
    const month  = String(now.getMonth() + 1).padStart(2, "0");
    // Take first 3 significant letters of the dealer name (strip common words)
    const code   = dealerName
        .replace(/\b(auto|cars|motors|dealership|group|the|and|&)\b/gi, "")
        .replace(/[^a-zA-Z]/g, "")
        .toUpperCase()
        .slice(0, 3)
        .padEnd(3, "X");  // pad if name is very short
    const seq    = String(monthlySeq).padStart(4, "0");
    return `CP/${year}/${month}/${code}/${seq}`;
}

// Common bank filler strings to strip for Tier 2 matching
const BANK_FILLERS = [/EFT/gi, /Deposit/gi, /FNB ATM/gi, /Immediate Pay/gi];

function normalizeReference(ref: string) {
    let normalized = ref;
    for (const filler of BANK_FILLERS) {
        normalized = normalized.replace(filler, "");
    }
    return normalized.trim().toLowerCase();
}

export const processBankStatement = mutation({
    args: {
        rows: v.array(v.object({
            amount: v.number(), // in cents
            referenceString: v.string(),
        }))
    },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        if (args.rows.length > 500) {
            throw new ConvexError("Cannot process more than 500 rows at once.");
        }
        const evaluatedTransactions = [];
        
        // Load dealers for matching
        const dealers = await ctx.db.query("dealerships").collect();
        const pendingInvoices = await ctx.db.query("invoices")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();
            
        for (const row of args.rows) {
            let matchedDealerId: Id<"dealerships"> | null = null;
            let confidence: "PERFECT" | "FUZZY" | "NONE" = "NONE";
            
            // Tier 1: RegEx Match for CP-\d{3}
            const cpMatch = row.referenceString.match(/CP-\d{3}/i);
            if (cpMatch) {
                const customId = cpMatch[0].toUpperCase();
                const dealer = dealers.find(d => d.clientCustomId === customId);
                if (dealer) {
                    matchedDealerId = dealer._id;
                    confidence = "PERFECT";
                }
            }
            
            // Tier 2: Fuzzy & Alias Match
            if (!matchedDealerId) {
                const normalizedRowRef = normalizeReference(row.referenceString);
                
                for (const dealer of dealers) {
                    const normalizedName = dealer.name.toLowerCase();
                    const aliases = (dealer.knownBankAliases || []).map(a => a.toLowerCase());
                    
                    if (normalizedRowRef.includes(normalizedName) || normalizedName.includes(normalizedRowRef)) {
                        matchedDealerId = dealer._id;
                        confidence = "FUZZY";
                        break;
                    }
                    
                    const aliasMatch = aliases.some(alias => 
                        normalizedRowRef.includes(alias) || alias.includes(normalizedRowRef)
                    );
                    
                    if (aliasMatch) {
                        matchedDealerId = dealer._id;
                        confidence = "FUZZY";
                        break;
                    }
                }
            }
            
            // Reconcile Invoice if matched
            let matchedInvoiceId: Id<"invoices"> | undefined = undefined;
            if (matchedDealerId) {
                // Find an invoice for this dealer with matching amount
                const matchingInvoice = pendingInvoices.find(
                    inv => inv.dealerId === matchedDealerId && inv.amount === row.amount && inv.status === "pending"
                );
                
                if (matchingInvoice) {
                    matchedInvoiceId = matchingInvoice._id;
                } else {
                    confidence = "NONE";
                    matchedDealerId = null;
                }
            }
            
            evaluatedTransactions.push({
                confidence,
                amount: row.amount,
                referenceString: row.referenceString,
                matchedDealerId,
                matchedInvoiceId
            });
        }
        
        return evaluatedTransactions;
    }
});

export const linkManualAliasToDealer = mutation({
    args: {
        dealerId: v.id("dealerships"),
        unmatchedReference: v.string(),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        const dealer = await ctx.db.get(args.dealerId);
        if (!dealer) throw new Error("Dealer not found");
        
        // Add to known bank aliases
        const aliases = dealer.knownBankAliases || [];
        if (!aliases.includes(args.unmatchedReference)) {
            await ctx.db.patch(args.dealerId, {
                knownBankAliases: [...aliases, args.unmatchedReference],
                updatedAt: Date.now(),
            });
        }
        
        // Find and pay invoice
        const invoice = await ctx.db.query("invoices")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .filter((q) => q.eq(q.field("amount"), args.amount))
            .first();
            
        if (invoice) {
            await ctx.db.patch(invoice._id, { status: "paid", updatedAt: Date.now() });
            return { success: true, invoiceId: invoice._id };
        }
        
        return { success: false, message: "Alias added but no matching pending invoice found for this amount." };
    }
});

export const markInvoiceAsPaid = mutation({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        await ctx.db.patch(args.invoiceId, { status: "paid", updatedAt: Date.now() });
    }
});

// Admin helper query to get all dealers
export const getAllDealers = query({
    handler: async (ctx) => {
        await requireGlobalAdmin(ctx);
        return await ctx.db.query("dealerships").collect();
    }
});

// Admin helper query to get pending invoices
export const getPendingInvoices = query({
    handler: async (ctx) => {
        await requireGlobalAdmin(ctx);
        return await ctx.db.query("invoices")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();
    }
});

// Dealer helper query to get their own active/pending/overdue invoices
export const getDealerInvoices = query({
    args: { dealerId: v.id("dealerships") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("Unauthorized: You must be signed in.");
        
        const dealer = await ctx.db.get(args.dealerId);
        if (!dealer) throw new ConvexError("Dealership not found");
        
        const isAdmin = await isGlobalAdmin(ctx);
        if (!isAdmin) {
            const callerOrgId = identity.orgID ?? identity.orgId ?? identity.subject;
            if (dealer.clerkOrgId !== callerOrgId) {
                throw new ConvexError("Forbidden: Access denied.");
            }
        }

        return await ctx.db.query("invoices")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
            .collect();
    }
});

// For system/cron use: create an invoice automatically
export const createMockInvoice = mutation({
    args: {
        dealerId: v.id("dealerships"),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        const dealer = await ctx.db.get(args.dealerId);
        if (!dealer) throw new Error("Dealer not found");

        // Count invoices issued this month for this dealer to get the monthly seq
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const monthlyCount = (await ctx.db
            .query("invoices")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
            .collect()
        ).filter(i => (i.issuedAt ?? 0) >= monthStart).length;

        const invoiceNumber  = buildInvoiceNumber(dealer.name, monthlyCount + 1);
        const description    = `PulaDrive Dealer Subscription — ${now.toLocaleString("en-BW", { month: "long", year: "numeric" })}`;
        const issuedAt       = Date.now();

        // Due 7 days from now
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        const tin            = dealer.bursTin || "000000000";
        const externalPdfUrl = generateInvoiceUrl(dealer.name, tin, invoiceNumber, args.amount / 100, dueDate.toISOString(), description);

        return await ctx.db.insert("invoices", {
            dealerId:    args.dealerId,
            invoiceNumber,
            dealerName:  dealer.name,
            description,
            amount:      args.amount,
            status:      "pending",
            issuedAt,
            dueDate:     dueDate.toISOString(),
            externalPdfUrl,
            updatedAt: Date.now(),
        });
    }
});

// Full billing summary for a single dealer (dealer portal)
export const getDealerBillingSummary = query({
    args: { dealerId: v.id("dealerships") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("Unauthorized: You must be signed in.");
        
        const dealer = await ctx.db.get(args.dealerId);
        if (!dealer) throw new ConvexError("Dealership not found");
        
        const isAdmin = await isGlobalAdmin(ctx);
        if (!isAdmin) {
            const callerOrgId = identity.orgID ?? identity.orgId ?? identity.subject;
            if (dealer.clerkOrgId !== callerOrgId) {
                throw new ConvexError("Forbidden: Access denied.");
            }
        }

        const invoices = await ctx.db.query("invoices")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
            .collect();

        const now = Date.now();
        const pending  = invoices.filter(i => i.status === "pending");
        const overdue  = invoices.filter(i => i.status === "overdue");
        const paid     = invoices.filter(i => i.status === "paid");

        const totalOwed = [...pending, ...overdue].reduce((s, i) => s + i.amount, 0);
        const totalPaid = paid.reduce((s, i) => s + i.amount, 0);

        // Next upcoming invoice = earliest pending due date
        const upcoming = pending
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] ?? null;

        return { invoices, pending, overdue, paid, totalOwed, totalPaid, upcoming };
    }
});

// Admin roster: every dealer with their billing health snapshot
export const getAllDealersBillingSummary = query({
    handler: async (ctx) => {
        await requireGlobalAdmin(ctx);
        const dealers = await ctx.db.query("dealerships").collect();
        const allInvoices = await ctx.db.query("invoices").collect();

        return dealers.map(dealer => {
            const dealerInvoices = allInvoices.filter(i => i.dealerId === dealer._id);
            const pending = dealerInvoices.filter(i => i.status === "pending");
            const overdue = dealerInvoices.filter(i => i.status === "overdue");
            const paid    = dealerInvoices.filter(i => i.status === "paid");

            const totalOwed = [...pending, ...overdue].reduce((s, i) => s + i.amount, 0);
            const totalPaid = paid.reduce((s, i) => s + i.amount, 0);

            // Next due invoice
            const nextInvoice = pending
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] ?? null;

            // Days until next invoice is due (negative = overdue)
            const daysUntilDue = nextInvoice
                ? Math.ceil((new Date(nextInvoice.dueDate).getTime() - Date.now()) / 86_400_000)
                : null;

            const health: "good" | "warning" | "critical" =
                overdue.length > 0 ? "critical" :
                (daysUntilDue !== null && daysUntilDue <= 7) ? "warning" : "good";

            return {
                dealer,
                pending,
                overdue,
                paid,
                totalOwed,
                totalPaid,
                nextInvoice,
                daysUntilDue,
                health,
            };
        });
    }
});

export const manualUpdateAccountStatus = mutation({
    args: {
        dealerId: v.id("dealerships"),
        status: v.union(v.literal("active"), v.literal("frozen")),
    },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        const dealer = await ctx.db.get(args.dealerId);
        if (!dealer) throw new ConvexError("Dealership not found");

        await ctx.db.patch(args.dealerId, { accountStatus: args.status, updatedAt: Date.now() });

        // Push notification to the dealer
        await ctx.db.insert("notifications", {
            recipientId: args.dealerId,
            type: "account",
            title: args.status === "frozen" ? "Account Paused Manually" : "Account Reactivated",
            message: `Your account status has been changed to ${args.status}.`,
            isRead: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            actionUrl: "/dashboard/billing",
        });
    }
});

export const createOfficialInvoice = mutation({
    args: {
        dealerId:    v.id("dealerships"),
        amount:      v.number(),
        dueDate:     v.string(),
        description: v.optional(v.string()), // admin can customise the line-item label
    },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        const dealer = await ctx.db.get(args.dealerId);
        if (!dealer) throw new ConvexError("Dealer not found");

        // Count invoices issued this month for this dealer → monthly sequence number
        const now        = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const monthlyCount = (await ctx.db
            .query("invoices")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
            .collect()
        ).filter(i => (i.issuedAt ?? 0) >= monthStart).length;

        const invoiceNumber  = buildInvoiceNumber(dealer.name, monthlyCount + 1);
        const description    = args.description ||
            `PulaDrive Dealer Subscription — ${now.toLocaleString("en-BW", { month: "long", year: "numeric" })}`;
        const issuedAt       = Date.now();
        const tin            = dealer.bursTin || "000000000";
        const externalPdfUrl = generateInvoiceUrl(dealer.name, tin, invoiceNumber, args.amount / 100, args.dueDate, description);

        const invoiceId = await ctx.db.insert("invoices", {
            dealerId:    args.dealerId,
            invoiceNumber,
            dealerName:  dealer.name,
            description,
            amount:      args.amount,
            status:      "pending",
            issuedAt,
            dueDate:     args.dueDate,
            externalPdfUrl,
            updatedAt: Date.now(),
        });

        // Notify the dealer
        await ctx.db.insert("notifications", {
            recipientId: args.dealerId,
            type:        "billing",
            title:       "New Invoice Issued",
            message:     `You have a new invoice (#${invoiceNumber}) for P${(args.amount / 100).toFixed(2)}. Due: ${args.dueDate}`,
            isRead:      false,
            createdAt:   Date.now(),
            updatedAt:   Date.now(),
            actionUrl:   "/dashboard/billing",
        });

        return invoiceId;
    }
});

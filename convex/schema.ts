import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    dealerships: defineTable({
        name: v.string(),
        location: v.string(),
        logoUrl: v.optional(v.string()),
        slug: v.string(),
        clerkOrgId: v.string(),
        rating: v.optional(v.number()),
        authorizedEmails: v.optional(v.array(v.string())),
        phone: v.optional(v.string()),
        clientCustomId: v.optional(v.string()),
        bursTin: v.optional(v.string()),
        accountStatus: v.optional(v.union(v.literal("active"), v.literal("frozen"))),
        knownBankAliases: v.optional(v.array(v.string())),
        subscriptionTier: v.optional(v.union(
            v.literal("starter"),
            v.literal("growth"),
            v.literal("unlimited")
        )),
        subscriptionTierStartDate: v.optional(v.number()), // epoch ms when current tier started/renewed
        subscriptionTierLastInvoiced: v.optional(v.number()), // epoch ms when last monthly subscription invoice was generated
        listingSlotOverride: v.optional(v.number()), // extra slots granted by admin on top of tier limit
        extraSlotsExpiresAt: v.optional(v.number()), // epoch ms when extra slots expire (typically 30 days from purchase)
        extraSlotsLastInvoiced: v.optional(v.number()), // epoch ms when extra slots were last invoiced
        updatedAt: v.optional(v.number()),
    })
        .index("by_slug", ["slug"])
        .index("by_clerk_org_id", ["clerkOrgId"])
        .index("by_custom_id", ["clientCustomId"])
        .index("by_account_status", ["accountStatus"])
        .index("by_updated_at", ["updatedAt"]),

    // ── Subscription upgrade / extra-slot requests ────────────────────────────
    subscriptionUpgradeRequests: defineTable({
        dealerId: v.id("dealerships"),
        requestType: v.union(
            v.literal("upgrade_tier"),   // requesting a higher tier
            v.literal("extra_slots")     // requesting N extra slots at P200/slot
        ),
        requestedTier: v.optional(v.union(
            v.literal("growth"),
            v.literal("unlimited")
        )),
        extraSlotsRequested: v.optional(v.number()),  // number of additional slots
        extraSlotsCost: v.optional(v.number()),        // total cost in cents (extraSlots * 20000)
        message: v.optional(v.string()),               // optional note from dealer
        status: v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("dismissed")
        ),
        adminNote: v.optional(v.string()),
        createdAt: v.number(),
        resolvedAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
    })
        .index("by_dealer", ["dealerId"])
        .index("by_status", ["status"])
        .index("by_created_at", ["createdAt"])
        .index("by_updated_at", ["updatedAt"]),

    invoices: defineTable({
        dealerId: v.id("dealerships"),
        invoiceNumber: v.string(),                 // e.g. CP/2026/06/MAS/0001
        dealerName: v.optional(v.string()),        // snapshot of dealer name at issue time (optional for legacy records)
        description: v.optional(v.string()),       // human-readable line-item summary (optional for legacy records)
        amount: v.number(),                        // in Pula cents
        status: v.union(v.literal("pending"), v.literal("paid"), v.literal("overdue")),
        issuedAt: v.optional(v.number()),          // epoch ms — when admin issued the invoice (optional for legacy records)
        dueDate: v.string(),                       // ISO date string
        externalPdfUrl: v.string(),
        updatedAt: v.optional(v.number()),
    })
        .index("by_dealer", ["dealerId"])
        .index("by_status", ["status"])
        .index("by_due_date", ["dueDate"])
        .index("by_updated_at", ["updatedAt"]),

    notifications: defineTable({
        recipientId: v.union(v.id("dealerships"), v.literal("admin")),
        type: v.union(
            v.literal("billing"),
            v.literal("account"),
            v.literal("system")
        ),
        title: v.string(),
        message: v.string(),
        isRead: v.boolean(),
        createdAt: v.number(),
        actionUrl: v.optional(v.string()),
        updatedAt: v.optional(v.number()),
    })
        .index("by_recipient", ["recipientId"])
        .index("by_status", ["isRead"])
        .index("by_recipient_and_status", ["recipientId", "isRead"])
        .index("by_created_at", ["createdAt"])
        .index("by_updated_at", ["updatedAt"]),

    vehicles: defineTable({
        dealerId: v.id("dealerships"),
        make: v.string(),
        model: v.string(),
        price: v.number(),
        year: v.number(),
        images: v.array(v.id("_storage")),
        status: v.union(
            v.literal("available"),
            v.literal("reserved"),
            v.literal("sold")
        ),
        description: v.optional(v.string()),
        mileage: v.optional(v.number()),
        fuelType: v.optional(v.string()),
        transmission: v.optional(v.string()),
        category: v.optional(v.union(
            v.literal("suv"),
            v.literal("sedan"),
            v.literal("hatchback"),
            v.literal("truck"),
            v.literal("coupe"),
            v.literal("wagon"),
            v.literal("van"),
            v.literal("luxury")
        )),
        engineSize: v.optional(v.string()),
        color: v.optional(v.string()),
        // Concatenated field for fuzzy search across make + model
        searchText: v.optional(v.string()),
        featuredUntil: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
    })
        .index("by_dealer", ["dealerId"])
        .index("by_status", ["status"])
        .index("by_status_and_category", ["status", "category"])
        .index("by_status_and_featured_until", ["status", "featuredUntil"])
        .index("by_updated_at", ["updatedAt"])
        .searchIndex("search_vehicles", {
            searchField: "searchText",
            filterFields: ["status"],
        }),

    // ── Search history ───────────────────────────────────────────────────────
    searchHistory: defineTable({
        userId: v.string(),          // Clerk user ID
        label: v.string(),           // Human-readable summary e.g. "Toyota SUV · P150k–300k"
        budgetMin:    v.optional(v.number()),
        budgetMax:    v.optional(v.number()),
        yearMin:      v.optional(v.number()),
        yearMax:      v.optional(v.number()),
        mileageMax:   v.optional(v.number()),
        fuelType:     v.optional(v.string()),
        transmission: v.optional(v.string()),
        category:     v.optional(v.string()),
        color:        v.optional(v.string()),
        makeModel:    v.optional(v.string()),
        updatedAt: v.optional(v.number()),
    })
        .index("by_user", ["userId"])
        .index("by_updated_at", ["updatedAt"]),

    // ── Reports ──────────────────────────────────────────────────────────────
    reports: defineTable({
        vehicleId:      v.id("vehicles"),
        dealerId:       v.id("dealerships"),
        reporterUserId: v.optional(v.string()),   // Clerk subject (null if guest)
        reporterEmail:  v.optional(v.string()),
        reason:         v.string(),               // predefined category
        customMessage:  v.optional(v.string()),   // free-text details
        status: v.union(
            v.literal("open"),
            v.literal("reviewed"),
            v.literal("dismissed")
        ),
        adminNote:      v.optional(v.string()),   // admin-only internal note
        updatedAt: v.optional(v.number()),
    })
        .index("by_vehicle",  ["vehicleId"])
        .index("by_dealer",   ["dealerId"])
        .index("by_status",   ["status"])
        .index("by_updated_at", ["updatedAt"]),

    featuredApplications: defineTable({
        vehicleId: v.id("vehicles"),
        dealerId: v.id("dealerships"),
        durationDays: v.number(), // 7, 14, 30
        price: v.number(), // 200, 450, 600
        status: v.union(
            v.literal("pending"),
            v.literal("waitlisted"),
            v.literal("approved"),
            v.literal("rejected"),
            v.literal("expired"),
            v.literal("revoked")
        ),
        appliedAt: v.number(),
        updatedAt: v.optional(v.number()),
    })
        .index("by_status", ["status"])
        .index("by_dealer", ["dealerId"])
        .index("by_vehicle", ["vehicleId"])
        .index("by_updated_at", ["updatedAt"]),

    // ── Rate limiting — token-bucket per user/action ──────────────────────────
    // CRIT-03 fix: Tracks request counts per (key, time window) to enforce
    // per-user rate limits on high-risk mutations without an external service.
    rateLimits: defineTable({
        key: v.string(),          // e.g. "report:user:abc123" or "upload:user:xyz"
        count: v.number(),        // requests in current window
        windowStart: v.number(),  // epoch ms when the current window opened
        updatedAt: v.optional(v.number()),
    })
        .index("by_key", ["key"])
        .index("by_updated_at", ["updatedAt"]),

    // ── Telemetry & Recommendation Pipeline ──────────────────────────────────
    telemetryLogs: defineTable({
        userId: v.optional(v.string()),
        anonymousSessionId: v.optional(v.string()),
        vehicleId: v.optional(v.id("vehicles")),
        eventType: v.string(),
        pageRoute: v.string(),
        metadata: v.optional(v.any()),
        timestamp: v.number(),
    })
        .index("by_timestamp", ["timestamp"])
        .index("by_user", ["userId"])
        .index("by_vehicle", ["vehicleId"]),

    homepageRecommendations: defineTable({
        targetId: v.string(), // userId or anonymousSessionId
        recommendedVehicleIds: v.array(v.id("vehicles")),
        calculatedAt: v.number(),
    })
        .index("by_targetId", ["targetId"]),

    listingAnalytics: defineTable({
        vehicleId: v.id("vehicles"),
        dealerId: v.id("dealerships"),
        views: v.number(),
        favorites: v.number(),
        shares: v.number(),
        clicks: v.number(),
        updatedAt: v.number(),
    })
        .index("by_vehicle", ["vehicleId"])
        .index("by_dealer", ["dealerId"]),
});

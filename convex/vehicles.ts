import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v, ConvexError } from "convex/values";
import { isGlobalAdmin } from "./utils";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "./rateLimit";

// ─── Input length constants ─────────────────────────────────────────────────
const MAX_SHORT = 50;
const MAX_DESCRIPTION = 2000;
const MAX_IMAGES = 10;
const MIN_YEAR = 1900;
const MAX_YEAR = 2030;

// ─── Auth helper ─────────────────────────────────────────────────────────────
async function requireAuth(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new ConvexError("Unauthorized: You must be signed in.");
    }
    return identity;
}

// ─── Ownership helper ────────────────────────────────────────────────────────
// Verifies the authenticated user's Clerk org matches the dealership that owns
// the given vehicle. Prevents any dealer from editing another dealer's stock.
async function requireVehicleOwnership(ctx: any, vehicleId: any) {
    const identity = await requireAuth(ctx);
    const vehicle = await ctx.db.get(vehicleId);
    if (!vehicle) throw new ConvexError("Vehicle not found.");

    const dealership = await ctx.db.get(vehicle.dealerId);
    if (!dealership) throw new ConvexError("Dealership not found.");

    // HIGH-01 fix: use the centralized isGlobalAdmin() from utils rather than
    // an inline hardcoded email list that was out-of-sync with the env var.
    const adminStatus = await isGlobalAdmin(ctx);
    if (adminStatus) {
        return { vehicle, dealership };
    }

    // Check dealership B2B email authorization
    if (dealership.authorizedEmails && identity.email) {
        if (!dealership.authorizedEmails.includes(identity.email)) {
            throw new ConvexError("Forbidden: Your email is not registered as an authorized administrator for this dealership.");
        }
    }

    // Clerk org ID is stored in the token under orgId (or orgID) claim, or falls back to
    // the user's subject token when acting as an individual (no org).
    const callerOrgId = identity.orgID ?? identity.orgId ?? identity.subject;
    if (dealership.clerkOrgId !== callerOrgId) {
        throw new ConvexError("Forbidden: You do not own this vehicle listing.");
    }
    return { vehicle, dealership };
}

// ─── Queries (public read — no auth needed) ──────────────────────────────────

export const listPaginated = query({
    args: {
        status: v.optional(v.union(v.literal("available"), v.literal("reserved"), v.literal("sold"))),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        let baseQuery = ctx.db.query("vehicles");
        let paginatedResults;

        if (args.status) {
            const currentStatus = args.status;
            paginatedResults = await baseQuery
                .withIndex("by_status", (q) => q.eq("status", currentStatus))
                .order("desc")
                .paginate(args.paginationOpts);
        } else {
            paginatedResults = await baseQuery.order("desc").paginate(args.paginationOpts);
        }

        const page = await Promise.all(
            paginatedResults.page.map(async (car) => ({
                ...car,
                imageUrls: (await Promise.all(
                    car.images.map(async (id) => await ctx.storage.getUrl(id))
                )).filter((url) => url !== null) as string[],
            }))
        );

        return {
            ...paginatedResults,
            page,
        };
    },
});

export const list = query({
    args: {
        status: v.optional(v.union(v.literal("available"), v.literal("reserved"), v.literal("sold"))),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const safeLimit = Math.min(args.limit ?? 50, 100);
        let results;
        if (args.status) {
            const currentStatus = args.status;
            results = await ctx.db.query("vehicles")
                .withIndex("by_status", (q) => q.eq("status", currentStatus))
                .order("desc")
                .take(safeLimit);
        } else {
            results = await ctx.db.query("vehicles").order("desc").take(safeLimit);
        }

        return Promise.all(
            results.map(async (car) => ({
                ...car,
                imageUrls: (await Promise.all(
                    car.images.map(async (id) => await ctx.storage.getUrl(id))
                )).filter((url) => url !== null) as string[],
            }))
        );
    },
});

export const getVehicle = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        const vehicleId = ctx.db.normalizeId("vehicles", args.id);
        if (!vehicleId) return null;
        const car = await ctx.db.get(vehicleId);
        if (!car) return null;
        const dealer = await ctx.db.get(car.dealerId);
        return {
            ...car,
            dealer: dealer ? { name: dealer.name, location: dealer.location, phone: dealer.phone ?? "" } : null,
            imageUrls: (await Promise.all(
                car.images.map(async (id) => await ctx.storage.getUrl(id))
            )).filter((url) => url !== null) as string[],
        };
    },
});

export const getByDealerId = query({
    args: { dealerId: v.id("dealerships") },
    handler: async (ctx, args) => {
        const results = await ctx.db
            .query("vehicles")
            .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
            .order("desc")
            .take(50);

        return Promise.all(
            results.map(async (car) => ({
                ...car,
                imageUrls: (await Promise.all(
                    car.images.map(async (id) => await ctx.storage.getUrl(id))
                )).filter((url) => url !== null) as string[],
            }))
        );
    },
});

export const search = query({
    args: {
        queryText: v.string(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Limit query text length to prevent abuse
        const safeQuery = args.queryText.slice(0, 100);

        let results;
        if (safeQuery === "") {
            let q = ctx.db.query("vehicles");
            if (args.category) {
                results = await q.order("desc").take(50);
                results = results.filter(v => v.category === args.category);
            } else {
                results = await q.order("desc").take(20);
            }
        } else {
            let q = ctx.db
                .query("vehicles")
                .withSearchIndex("search_vehicles", (q) =>
                    q.search("searchText", safeQuery)
                );

            results = await q.take(20);

            if (args.category) {
                results = results.filter(v => v.category === args.category);
            }
        }

        return Promise.all(
            results.map(async (car) => ({
                ...car,
                images: (await Promise.all(
                    car.images.map(async (id) => await ctx.storage.getUrl(id))
                )).filter((url) => url !== null) as string[],
            }))
        );
    },
});

// ─── Mutations (all require authentication) ───────────────────────────────────

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        // V-06 fix: require auth before issuing upload URLs
        // CRIT-03 fix: rate limit upload URL generation to prevent billing attacks
        const identity = await requireAuth(ctx);
        await checkRateLimit(
            ctx,
            rateLimitKey("upload", "user", identity.subject),
            RATE_LIMITS.UPLOAD_URL
        );
        return await ctx.storage.generateUploadUrl();
    },
});

export const create = mutation({
    args: {
        dealerId: v.id("dealerships"),
        make: v.string(),
        model: v.string(),
        price: v.number(),
        year: v.number(),
        images: v.array(v.id("_storage")),
        status: v.union(v.literal("available"), v.literal("reserved"), v.literal("sold")),
        description: v.optional(v.string()),
        mileage: v.optional(v.number()),
        fuelType: v.optional(v.string()),
        transmission: v.optional(v.string()),
        engineSize: v.optional(v.string()),
        color: v.optional(v.string()),
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
    },
    handler: async (ctx, args) => {
        // V-02 fix: require authentication
        // CRIT-03 fix: rate limit new vehicle creation
        const identity = await requireAuth(ctx);
        await checkRateLimit(
            ctx,
            rateLimitKey("create_vehicle", "user", identity.subject),
            RATE_LIMITS.CREATE_VEHICLE
        );

        // V-03 fix: verify the caller belongs to the dealership org
        const dealership = await ctx.db.get(args.dealerId);
        if (!dealership) throw new ConvexError("Dealership not found.");
        
        if (dealership.accountStatus === "frozen") {
            throw new ConvexError("Your account is currently frozen. Please settle any outstanding invoices or contact support to resume listing vehicles.");
        }

        const callerOrgId = identity.orgID ?? identity.orgId ?? identity.subject;
        if (dealership.clerkOrgId !== callerOrgId) {
            throw new ConvexError("Forbidden: You cannot create listings for another dealership.");
        }

        // V-08 fix: input length and range validation
        if (args.make.length > MAX_SHORT) throw new ConvexError(`Make must be ≤ ${MAX_SHORT} characters.`);
        if (args.model.length > MAX_SHORT) throw new ConvexError(`Model must be ≤ ${MAX_SHORT} characters.`);
        if (args.description && args.description.length > MAX_DESCRIPTION) throw new ConvexError(`Description must be ≤ ${MAX_DESCRIPTION} characters.`);
        if (args.color && args.color.length > MAX_SHORT) throw new ConvexError(`Color must be ≤ ${MAX_SHORT} characters.`);
        if (args.fuelType && args.fuelType.length > MAX_SHORT) throw new ConvexError(`Fuel type must be ≤ ${MAX_SHORT} characters.`);
        if (args.transmission && args.transmission.length > MAX_SHORT) throw new ConvexError(`Transmission must be ≤ ${MAX_SHORT} characters.`);
        if (args.engineSize && args.engineSize.length > MAX_SHORT) throw new ConvexError(`Engine size must be ≤ ${MAX_SHORT} characters.`);
        if (args.year < MIN_YEAR || args.year > MAX_YEAR) throw new ConvexError(`Year must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
        if (args.price <= 0) throw new ConvexError("Price must be a positive number.");
        if (args.mileage !== undefined && args.mileage < 0) throw new ConvexError("Mileage cannot be negative.");
        if (args.images.length > MAX_IMAGES) throw new ConvexError(`You may upload at most ${MAX_IMAGES} images.`);

        // ── Subscription slot enforcement ──────────────────────────────────────
        // Count non-sold vehicles (available + reserved) — sold listings do not use a slot.
        const TIER_LIMITS: Record<string, number> = { starter: 50, growth: 150, unlimited: Infinity };
        const tier = dealership.subscriptionTier ?? "starter";
        const baseLimit = TIER_LIMITS[tier] ?? 50;
        const override = (dealership as any).listingSlotOverride ?? 0;
        const slotLimit = baseLimit === Infinity ? Infinity : baseLimit + override;

        if (slotLimit !== Infinity) {
            const activeCount = await ctx.db
                .query("vehicles")
                .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
                .filter((q) => q.neq(q.field("status"), "sold"))
                .collect()
                .then((v) => v.length);

            if (activeCount >= slotLimit) {
                throw new ConvexError(
                    `Listing slot limit reached. Your ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan allows ${slotLimit} active listing${slotLimit === 1 ? "" : "s"}. ` +
                    `Please upgrade your subscription or request extra slots from your Billing page.`
                );
            }
        }
        // ── End slot enforcement ────────────────────────────────────────────────

        const searchText = `${args.make} ${args.model}`.toLowerCase();
        return await ctx.db.insert("vehicles", { ...args, searchText, updatedAt: Date.now() });
    },
});

export const update = mutation({
    args: {
        id: v.id("vehicles"),
        make: v.optional(v.string()),
        model: v.optional(v.string()),
        price: v.optional(v.number()),
        year: v.optional(v.number()),
        status: v.optional(v.union(v.literal("available"), v.literal("reserved"), v.literal("sold"))),
        description: v.optional(v.string()),
        mileage: v.optional(v.number()),
        fuelType: v.optional(v.string()),
        transmission: v.optional(v.string()),
        engineSize: v.optional(v.string()),
        color: v.optional(v.string()),
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
        images: v.optional(v.array(v.id("_storage"))),
    },
    handler: async (ctx, args) => {
        // V-02 + V-03 fix: require auth and ownership
        // CRIT-03 fix: rate limit vehicle updates
        const { vehicle: existing } = await requireVehicleOwnership(ctx, args.id);
        const identity = await ctx.auth.getUserIdentity();
        if (identity) {
            await checkRateLimit(
                ctx,
                rateLimitKey("update_vehicle", "user", identity.subject),
                RATE_LIMITS.UPDATE_VEHICLE
            );
        }

        // V-08 fix: validate lengths
        if (args.make && args.make.length > MAX_SHORT) throw new ConvexError(`Make must be ≤ ${MAX_SHORT} characters.`);
        if (args.model && args.model.length > MAX_SHORT) throw new ConvexError(`Model must be ≤ ${MAX_SHORT} characters.`);
        if (args.description && args.description.length > MAX_DESCRIPTION) throw new ConvexError(`Description must be ≤ ${MAX_DESCRIPTION} characters.`);
        if (args.color && args.color.length > MAX_SHORT) throw new ConvexError(`Color must be ≤ ${MAX_SHORT} characters.`);
        if (args.fuelType && args.fuelType.length > MAX_SHORT) throw new ConvexError(`Fuel type must be ≤ ${MAX_SHORT} characters.`);
        if (args.transmission && args.transmission.length > MAX_SHORT) throw new ConvexError(`Transmission must be ≤ ${MAX_SHORT} characters.`);
        if (args.engineSize && args.engineSize.length > MAX_SHORT) throw new ConvexError(`Engine size must be ≤ ${MAX_SHORT} characters.`);
        if (args.year !== undefined && (args.year < MIN_YEAR || args.year > MAX_YEAR)) throw new ConvexError(`Year must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
        if (args.price !== undefined && args.price <= 0) throw new ConvexError("Price must be a positive number.");
        if (args.mileage !== undefined && args.mileage < 0) throw new ConvexError("Mileage cannot be negative.");
        if (args.images && args.images.length > MAX_IMAGES) throw new ConvexError(`You may upload at most ${MAX_IMAGES} images.`);

        const { id, ...fields } = args;
        const updateData: any = { ...fields };
        if (fields.make || fields.model) {
            const make = fields.make ?? existing.make;
            const model = fields.model ?? existing.model;
            updateData.searchText = `${make} ${model}`.toLowerCase();
        }

        await ctx.db.patch(id, { ...updateData, updatedAt: Date.now() });
    },
});

export const remove = mutation({
    args: { id: v.id("vehicles") },
    handler: async (ctx, args) => {
        // V-02 + V-03 fix: require auth and ownership
        // CRIT-03: deletions counted against update quota to prevent rapid mass-delete abuse
        const { vehicle: existing } = await requireVehicleOwnership(ctx, args.id);
        const identity = await ctx.auth.getUserIdentity();
        if (identity) {
            await checkRateLimit(
                ctx,
                rateLimitKey("update_vehicle", "user", identity.subject),
                RATE_LIMITS.UPDATE_VEHICLE
            );
        }

        // Clean up images from storage
        for (const storageId of existing.images) {
            await ctx.storage.delete(storageId);
        }

        await ctx.db.delete(args.id);
    },
});

export const searchRanked = query({
    args: {
        queryText: v.string(),
        category: v.optional(v.string()),
        targetPrice: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const safeQuery = args.queryText.slice(0, 100);

        let results;
        if (safeQuery === "") {
            let q = ctx.db.query("vehicles");
            if (args.category) {
                results = await q.order("desc").take(100);
                results = results.filter(v => v.category === args.category);
            } else {
                results = await q.order("desc").take(100);
            }
        } else {
            let q = ctx.db
                .query("vehicles")
                .withSearchIndex("search_vehicles", (q) =>
                    q.search("searchText", safeQuery)
                );

            results = await q.take(100);

            if (args.category) {
                results = results.filter(v => v.category === args.category);
            }
        }

        // Fetch dealerships to avoid N+1 queries
        const dealerIds = Array.from(new Set(results.map((r) => r.dealerId)));
        const dealers = await Promise.all(dealerIds.map((id) => ctx.db.get(id)));
        const dealerMap = new Map(dealers.filter((d) => d !== null).map((d) => [d!._id, d!]));

        const scoredResults = await Promise.all(
            results.map(async (car) => {
                // 1. Relevance Score (50%)
                let relevanceScore = 1.0;
                if (safeQuery !== "") {
                    const queryLower = safeQuery.toLowerCase().trim();
                    const makeLower = car.make.toLowerCase();
                    const modelLower = car.model.toLowerCase();
                    if (makeLower === queryLower || modelLower === queryLower) {
                        relevanceScore = 1.0;
                    } else if (makeLower.includes(queryLower) || modelLower.includes(queryLower)) {
                        relevanceScore = 0.8;
                    } else {
                        relevanceScore = 0.5;
                    }
                }

                // 2. Dealer Trust (20%)
                const dealer = dealerMap.get(car.dealerId);
                const rating = dealer?.rating ?? 5.0;
                const dealerTrustScore = rating / 5.0;

                // 3. Price Proximity (20%)
                let priceProximityScore = 1.0;
                if (args.targetPrice && args.targetPrice > 0) {
                    const diff = Math.abs(car.price - args.targetPrice);
                    priceProximityScore = Math.max(0, 1 - diff / args.targetPrice);
                }

                // 4. Recency Boost (10%)
                const ageInMs = Date.now() - car._creationTime;
                const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
                const recencyScore = Math.max(0, 1 - ageInDays / 30);

                const totalScore =
                    relevanceScore * 0.5 +
                    dealerTrustScore * 0.2 +
                    priceProximityScore * 0.2 +
                    recencyScore * 0.1;

                const imageUrls = car.images
                    ? (await Promise.all(
                        car.images.map(async (id) => await ctx.storage.getUrl(id))
                    )).filter((url) => url !== null) as string[]
                    : [];

                return {
                    ...car,
                    imageUrls,
                    images: imageUrls,
                    totalScore,
                };
            })
        );

        scoredResults.sort((a, b) => b.totalScore - a.totalScore);
        return scoredResults;
    },
});

export const getFeatured = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        // Fetch active listings sorted by featuredUntil descending using index
        const results = await ctx.db
            .query("vehicles")
            .withIndex("by_status_and_featured_until", (q) => q.eq("status", "available").gt("featuredUntil", now))
            .order("desc")
            .take(100);

        const mapped = await Promise.all(
            results.map(async (car) => {
                const imageUrls = car.images
                    ? (await Promise.all(
                        car.images.map(async (id) => await ctx.storage.getUrl(id))
                      )).filter((url) => url !== null) as string[]
                    : [];
                return {
                    ...car,
                    imageUrls,
                    images: imageUrls,
                };
            })
        );

        // Sort deterministically to allow Convex reactive caching to function properly.
        // If shuffling is needed, it should be done client-side using a seed or randomizer.
        return mapped.slice(0, 10);
    },
});

export const updateFeaturedStatus = mutation({
    args: {
        vehicleId: v.id("vehicles"),
        timestamp: v.union(v.number(), v.null()),
    },
    handler: async (ctx, args) => {
        const { vehicle } = await requireVehicleOwnership(ctx, args.vehicleId);

        await ctx.db.patch(args.vehicleId, {
            featuredUntil: args.timestamp ?? undefined,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

export const advancedSearch = query({
    args: {
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
    },
    handler: async (ctx, args) => {
        let results;
        if (args.category) {
            results = await ctx.db
                .query("vehicles")
                .withIndex("by_status_and_category", (q) => q.eq("status", "available").eq("category", args.category as any))
                .take(300);
        } else {
            results = await ctx.db
                .query("vehicles")
                .withIndex("by_status", (q) => q.eq("status", "available"))
                .take(300);
        }

        const dealerIds = Array.from(new Set(results.map((r) => r.dealerId)));
        const dealers = await Promise.all(dealerIds.map((id) => ctx.db.get(id)));
        const dealerMap = new Map(
            dealers.filter((d) => d !== null).map((d) => [d!._id, d!])
        );

        const queryLower = (args.makeModel ?? "").toLowerCase().trim();

        const scored = await Promise.all(
            results.map(async (car) => {
                // Hard filters
                if (args.budgetMin  !== undefined && car.price < args.budgetMin)  return null;
                if (args.budgetMax  !== undefined && car.price > args.budgetMax)  return null;
                if (args.yearMin    !== undefined && car.year  < args.yearMin)    return null;
                if (args.yearMax    !== undefined && car.year  > args.yearMax)    return null;
                if (args.mileageMax !== undefined && (car.mileage ?? 0) > args.mileageMax) return null;
                if (args.fuelType     && car.fuelType?.toLowerCase()     !== args.fuelType.toLowerCase())     return null;
                if (args.transmission && car.transmission?.toLowerCase() !== args.transmission.toLowerCase()) return null;
                if (args.color && !car.color?.toLowerCase().includes(args.color.toLowerCase())) return null;

                // Soft scores
                let budgetScore = 1.0;
                if (args.budgetMin !== undefined && args.budgetMax !== undefined) {
                    const mid = (args.budgetMin + args.budgetMax) / 2;
                    const range = (args.budgetMax - args.budgetMin) || 1;
                    budgetScore = Math.max(0, 1 - Math.abs(car.price - mid) / range);
                } else if (args.budgetMax !== undefined) {
                    budgetScore = car.price / args.budgetMax;
                }

                let textScore = 0.5;
                if (queryLower) {
                    const ml = car.make.toLowerCase();
                    const mdl = car.model.toLowerCase();
                    if (ml === queryLower || mdl === queryLower)               textScore = 1.0;
                    else if (ml.includes(queryLower) || mdl.includes(queryLower)) textScore = 0.8;
                    else                                                           textScore = 0.3;
                }

                const dealer = dealerMap.get(car.dealerId);
                const dealerScore = (dealer?.rating ?? 5.0) / 5.0;

                const ageDays = (Date.now() - car._creationTime) / 86400000;
                const recencyScore = Math.max(0, 1 - ageDays / 60);

                const matchScore =
                    budgetScore  * 0.40 +
                    textScore    * 0.30 +
                    dealerScore  * 0.15 +
                    recencyScore * 0.15;

                const imageUrls = car.images
                    ? (await Promise.all(
                        car.images.map((id) => ctx.storage.getUrl(id))
                    )).filter((u) => u !== null) as string[]
                    : [];

                return { ...car, imageUrls, images: imageUrls, matchScore };
            })
        );

        const filtered = scored.filter((c) => c !== null) as NonNullable<(typeof scored)[number]>[];
        filtered.sort((a, b) => b.matchScore - a.matchScore);
        return filtered.slice(0, 60);
    },
});

export const getForYouFeed = query({
    args: {
        targetId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let vehicles: any[] = [];
        if (args.targetId) {
            const rec = await ctx.db
                .query("homepageRecommendations")
                .withIndex("by_targetId", (q) => q.eq("targetId", args.targetId!))
                .unique();

            if (rec && rec.recommendedVehicleIds.length > 0) {
                const docs = await Promise.all(rec.recommendedVehicleIds.map((id) => ctx.db.get(id)));
                vehicles = docs.filter((d): d is NonNullable<typeof d> => d !== null && d.status === "available");
            }
        }

        // Fallback if no targetId, or recommendation not found, or recommended list is empty
        if (vehicles.length === 0) {
            const defaultList = await ctx.db
                .query("vehicles")
                .withIndex("by_status", (q) => q.eq("status", "available"))
                .order("desc")
                .take(10);
            vehicles = defaultList;
        }

        return Promise.all(
            vehicles.map(async (car) => ({
                ...car,
                imageUrls: (await Promise.all(
                    car.images.map(async (id: any) => await ctx.storage.getUrl(id))
                )).filter((url) => url !== null) as string[],
            }))
        );
    },
});

export const getByIds = query({
    args: { ids: v.array(v.string()) },
    handler: async (ctx, args) => {
        const vehicles = [];
        for (const id of args.ids) {
            try {
                const vehicleId = ctx.db.normalizeId("vehicles", id);
                if (!vehicleId) continue;
                const car = await ctx.db.get(vehicleId);
                if (car) {
                    vehicles.push(car);
                }
            } catch {
                // ignore invalid IDs
            }
        }
        return Promise.all(
            vehicles.map(async (car) => ({
                ...car,
                imageUrls: (await Promise.all(
                    car.images.map(async (id) => await ctx.storage.getUrl(id))
                )).filter((url) => url !== null) as string[],
            }))
        );
    },
});



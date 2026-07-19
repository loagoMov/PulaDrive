import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "./rateLimit";
import { isGlobalAdmin } from "./utils";

export const logEvents = mutation({
  args: {
    events: v.array(
      v.object({
        anonymousSessionId: v.optional(v.string()),
        vehicleId: v.optional(v.id("vehicles")),
        eventType: v.string(),
        pageRoute: v.string(),
        metadata: v.optional(v.any()),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.events.length > 50) {
      throw new ConvexError("Cannot submit more than 50 events at once.");
    }
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject || undefined;
    
    // Rate limit per user or per session if anonymous
    const rateLimitId = userId || args.events[0]?.anonymousSessionId || "global";
    await checkRateLimit(
        ctx,
        rateLimitKey("telemetry", "user", rateLimitId),
        RATE_LIMITS.TELEMETRY_LOG
    );

    for (const event of args.events) {
      await ctx.db.insert("telemetryLogs", {
        userId,
        anonymousSessionId: event.anonymousSessionId,
        vehicleId: event.vehicleId,
        eventType: event.eventType,
        pageRoute: event.pageRoute,
        metadata: event.metadata,
        timestamp: event.timestamp,
      });
    }
  },
});

export const getLogsSince = internalQuery({
  args: {
    since: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("telemetryLogs")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", args.since))
      .collect();
  },
});

export const upsertRecommendationsBatch = internalMutation({
  args: {
    recommendations: v.array(
      v.object({
        targetId: v.string(),
        recommendedVehicleIds: v.array(v.id("vehicles")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const rec of args.recommendations) {
      // Find existing recommendation for this targetId
      const existing = await ctx.db
        .query("homepageRecommendations")
        .withIndex("by_targetId", (q) => q.eq("targetId", rec.targetId))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          recommendedVehicleIds: rec.recommendedVehicleIds,
          calculatedAt: now,
        });
      } else {
        await ctx.db.insert("homepageRecommendations", {
          targetId: rec.targetId,
          recommendedVehicleIds: rec.recommendedVehicleIds,
          calculatedAt: now,
        });
      }
    }
  },
});

export const upsertListingAnalytics = internalMutation({
  args: {
    analytics: v.array(
      v.object({
        vehicleId: v.id("vehicles"),
        views: v.number(),
        favorites: v.number(),
        shares: v.number(),
        clicks: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const data of args.analytics) {
      // Look up dealerId from the vehicle
      const vehicle = await ctx.db.get(data.vehicleId);
      if (!vehicle) {
        console.warn(`Vehicle not found for analytics: ${data.vehicleId}`);
        continue;
      }

      const existing = await ctx.db
        .query("listingAnalytics")
        .withIndex("by_vehicle", (q) => q.eq("vehicleId", data.vehicleId))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          views: data.views,
          favorites: data.favorites,
          shares: data.shares,
          clicks: data.clicks,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("listingAnalytics", {
          vehicleId: data.vehicleId,
          dealerId: vehicle.dealerId,
          views: data.views,
          favorites: data.favorites,
          shares: data.shares,
          clicks: data.clicks,
          updatedAt: now,
        });
      }
    }
  },
});

export const getListingAnalytics = query({
  args: {
    dealerId: v.id("dealerships"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("listingAnalytics")
      .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
      .collect();
  },
});

// ─── Trend Analysis Queries ──────────────────────────────────────────────────

/**
 * Returns daily event counts for a specific dealership's vehicles over the
 * last `days` days (7, 14, or 30).
 *
 * Security model:
 *   • Requires authentication.
 *   • The dealerId is fetched from DB and the caller's Clerk orgId must match
 *     OR the caller must be a global admin — no arbitrary dealer ID accepted.
 *   • Days is capped at 30 to prevent unbounded queries.
 */
export const getDealerTrendData = query({
  args: {
    dealerId: v.id("dealerships"),
    days: v.union(v.literal(7), v.literal(14), v.literal(30)),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized.");

    // Authorization: caller must own the dealership org or be a global admin.
    const adminStatus = await isGlobalAdmin(ctx);
    if (!adminStatus) {
      const dealership = await ctx.db.get(args.dealerId);
      if (!dealership) throw new ConvexError("Dealership not found.");
      const callerOrgId = identity.orgID ?? identity.orgId ?? identity.subject;
      if (dealership.clerkOrgId !== callerOrgId) {
        throw new ConvexError("Forbidden: You can only view analytics for your own dealership.");
      }
    }

    const daysMs = args.days * 24 * 60 * 60 * 1000;
    const since = Date.now() - daysMs;

    // Collect all vehicle IDs for the dealership.
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_dealer", (q) => q.eq("dealerId", args.dealerId))
      .collect();
    const vehicleIdSet = new Set(vehicles.map((v) => v._id));

    // Fetch recent logs and filter by dealer's vehicles.
    const logs = await ctx.db
      .query("telemetryLogs")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", since))
      .collect();

    const dealerLogs = logs.filter(
      (l) => l.vehicleId && vehicleIdSet.has(l.vehicleId) &&
             (!args.eventType || l.eventType === args.eventType)
    );

    // Bucket into daily counts.
    const buckets: Record<string, number> = {};
    const now = Date.now();
    for (let i = args.days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const log of dealerLogs) {
      const day = new Date(log.timestamp).toISOString().slice(0, 10);
      if (day in buckets) buckets[day]++;
    }

    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  },
});

/**
 * Returns platform-wide daily event counts over the last `days` days.
 *
 * Security model:
 *   • Global admin only.
 *   • Days capped at 30.
 */
export const getMarketplaceTrendData = query({
  args: {
    days: v.union(v.literal(7), v.literal(14), v.literal(30)),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminStatus = await isGlobalAdmin(ctx);
    if (!adminStatus) throw new ConvexError("Forbidden: Global administrators only.");

    const daysMs = args.days * 24 * 60 * 60 * 1000;
    const since = Date.now() - daysMs;

    const logs = await ctx.db
      .query("telemetryLogs")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", since))
      .collect();

    const filtered = args.eventType
      ? logs.filter((l) => l.eventType === args.eventType)
      : logs;

    // Bucket into daily counts.
    const buckets: Record<string, number> = {};
    const now = Date.now();
    for (let i = args.days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const log of filtered) {
      const day = new Date(log.timestamp).toISOString().slice(0, 10);
      if (day in buckets) buckets[day]++;
    }

    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  },
});

/**
 * Aggregates platform-wide metrics (by event type and by car category)
 * for the last `days` days. Protected to admin only.
 */
export const getMarketplaceMetricsOverview = query({
  args: {
    days: v.union(v.literal(7), v.literal(14), v.literal(30)),
  },
  handler: async (ctx, args) => {
    const adminStatus = await isGlobalAdmin(ctx);
    if (!adminStatus) throw new ConvexError("Forbidden: Global administrators only.");

    const daysMs = args.days * 24 * 60 * 60 * 1000;
    const since = Date.now() - daysMs;

    // Fetch logs
    const logs = await ctx.db
      .query("telemetryLogs")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", since))
      .collect();

    // Event Types buckets
    const events: Record<string, number> = {
      views: 0,
      favorites: 0,
      shares: 0,
      clicks: 0,
    };

    // Category buckets
    const categories: Record<string, number> = {};

    // Collect vehicle categories for mapping logs
    const vehicles = await ctx.db.query("vehicles").collect();
    const vehicleCategoryMap = new Map(vehicles.map((v) => [v._id, v.category || "other"]));

    for (const log of logs) {
      // Event Type counting
      const type = log.eventType;
      if (type in events) {
        events[type]++;
      } else if (type === "book_visit_clicked" || type === "search_history_selected") {
        events.clicks++;
      }

      // Category counting
      if (log.vehicleId) {
        const cat = vehicleCategoryMap.get(log.vehicleId) || "other";
        categories[cat] = (categories[cat] || 0) + 1;
      }
    }

    return {
      eventBreakdown: Object.entries(events).map(([name, value]) => ({ name, value })),
      categoryBreakdown: Object.entries(categories).map(([name, value]) => ({ name, value })),
    };
  },
});

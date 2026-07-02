import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "./rateLimit";

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

import { ConvexError } from "convex/values";
import { MutationCtx } from "./_generated/server";

// ─── Rate Limit Configuration Type ────────────────────────────────────────────
export interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    maxRequests: number;
    /** Window size in milliseconds */
    windowMs: number;
}

// ─── Pre-defined Limits for Each High-Risk Endpoint ───────────────────────────
// CRIT-03 fix: Token-bucket rate limits applied server-side in Convex.
// All thresholds are intentionally conservative for the initial rollout.
export const RATE_LIMITS = {
    // Unauthenticated report — highest abuse risk
    REPORT_GUEST:        { maxRequests: 2,  windowMs: 60 * 60_000 } satisfies RateLimitConfig,
    // Authenticated report
    REPORT_USER:         { maxRequests: 5,  windowMs: 60 * 60_000 } satisfies RateLimitConfig,
    // Storage upload URL generation — billing attack vector
    UPLOAD_URL:          { maxRequests: 20, windowMs: 60 * 60_000 } satisfies RateLimitConfig,
    // New vehicle listing creation
    CREATE_VEHICLE:      { maxRequests: 10, windowMs: 60 * 60_000 } satisfies RateLimitConfig,
    // Vehicle edits — more generous
    UPDATE_VEHICLE:      { maxRequests: 30, windowMs: 60 * 60_000 } satisfies RateLimitConfig,
    // Featured listing application — payment intent, so very low limit
    FEATURED_APPLY:      { maxRequests: 3,  windowMs: 60 * 60_000 } satisfies RateLimitConfig,
    // Search history saves
    SEARCH_SAVE:         { maxRequests: 30, windowMs: 60 * 60_000 } satisfies RateLimitConfig,
    // Dealership creation — very low; one org should only create once
    CREATE_DEALERSHIP:   { maxRequests: 3,  windowMs: 60 * 60_000 } satisfies RateLimitConfig,
    // Email/phone updates
    UPDATE_CONTACT:      { maxRequests: 10, windowMs: 60 * 60_000 } satisfies RateLimitConfig,
    // Telemetry submissions — high volume but still bounded
    TELEMETRY_LOG:       { maxRequests: 100, windowMs: 60_000 } satisfies RateLimitConfig,
} as const;

// ─── Core Rate Limit Enforcer ─────────────────────────────────────────────────
/**
 * Checks and increments a sliding-window rate limit for the given key.
 * Throws a ConvexError with a human-readable retry delay if the limit is exceeded.
 *
 * @param ctx    - Convex mutation context (needs DB read/write)
 * @param key    - Unique identifier e.g. "report:user:abc123"
 * @param config - { maxRequests, windowMs }
 */
export async function checkRateLimit(
    ctx: MutationCtx,
    key: string,
    config: RateLimitConfig
): Promise<void> {
    const now = Date.now();

    const existing = await ctx.db
        .query("rateLimits")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();

    if (!existing) {
        // First request ever for this key — create the window
        await ctx.db.insert("rateLimits", {
            key,
            count: 1,
            windowStart: now,
        });
        return;
    }

    const windowAge = now - existing.windowStart;

    if (windowAge > config.windowMs) {
        // Current window has expired — reset to a fresh window
        await ctx.db.patch(existing._id, {
            count: 1,
            windowStart: now,
        });
        return;
    }

    if (existing.count >= config.maxRequests) {
        const retryAfterMs  = config.windowMs - windowAge;
        const retryAfterSec = Math.ceil(retryAfterMs / 1000);
        const retryAfterMin = Math.ceil(retryAfterSec / 60);

        const timeLabel =
            retryAfterSec < 60
                ? `${retryAfterSec} second${retryAfterSec !== 1 ? "s" : ""}`
                : `${retryAfterMin} minute${retryAfterMin !== 1 ? "s" : ""}`;

        throw new ConvexError(
            `Too many requests. You have reached the limit of ${config.maxRequests} actions ` +
            `per ${Math.round(config.windowMs / 1000)}s window. ` +
            `Please wait ${timeLabel} before trying again.`
        );
    }

    // Increment count within the existing window
    await ctx.db.patch(existing._id, {
        count: existing.count + 1,
    });
}

// ─── Convenience: Build Rate Limit Key ────────────────────────────────────────
/**
 * Creates a namespaced rate limit key.
 * @example rateLimitKey("report", "user", userId)  → "report:user:abc123"
 * @example rateLimitKey("report", "guest")         → "report:guest"
 */
export function rateLimitKey(action: string, scope: string, id?: string): string {
    return id ? `${action}:${scope}:${id}` : `${action}:${scope}`;
}

import { internalMutation } from "./_generated/server";

export const cleanupExpiredRateLimits = internalMutation({
    args: {},
    handler: async (ctx) => {
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
        let processed = 0;
        while (processed < 1000) {
            const stale = await ctx.db.query("rateLimits")
                .collect(); // Scan all is acceptable in a cron job capped at 100 entries per loop
            
            // Filter stale entries in memory
            const staleEntries = stale.filter(item => item.windowStart < twoHoursAgo);
            if (staleEntries.length === 0) break;
            
            const chunk = staleEntries.slice(0, 100);
            for (const item of chunk) {
                await ctx.db.delete(item._id);
            }
            processed += chunk.length;
            if (staleEntries.length <= 100) break;
        }
    }
});

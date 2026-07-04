import { query } from "./_generated/server";
import { v } from "convex/values";

// Export changed rows from any table using the by_updated_at index (or fallback)
export const getExportData = query({
    args: {
        table: v.string(),
        since: v.number(),
        limit: v.optional(v.number()),
        cursor: v.optional(v.string()), // For pagination
    },
    handler: async (ctx, args) => {
        // We cast the table name to any to allow dynamic table queries.
        const tableName = args.table as any;
        const limit = args.limit || 1000;
        const paginationOpts = { cursor: args.cursor ?? null, numItems: limit };

        // withIndex() can only be called on a QueryInitializer (before narrowing), so we
        // branch here rather than reassigning `q` which would change its type.
        if (args.since > 0) {
            const results = await ctx.db
                .query(tableName)
                .withIndex("by_updated_at", (q: any) => q.gt("updatedAt", args.since))
                .paginate(paginationOpts);
            return results;
        }

        // Full table scan when no since timestamp is provided
        const results = await ctx.db
            .query(tableName)
            .paginate(paginationOpts);
        return results;
    }
});

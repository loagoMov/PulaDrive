import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

const http = httpRouter();

// Constant-time comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Perform dummy check anyway to match time signatures closer
    for (let i = 0; i < a.length; i++) {}
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

http.route({
  path: "/api/export-telemetry",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret") || "";
    const expectedSecret = process.env.MOTHERDUCK_SYNC_SECRET;
    if (!expectedSecret || !timingSafeEqual(secret, expectedSecret)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const sinceStr = url.searchParams.get("since") || "0";
    const since = parseInt(sinceStr, 10) || 0;

    const logs = await ctx.runQuery(internal.telemetry.getLogsSince, { since });
    return new Response(JSON.stringify(logs), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }),
});

http.route({
  path: "/api/import-recommendations",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const contentLength = parseInt(request.headers.get("Content-Length") || "0", 10);
    if (contentLength > 1 * 1024 * 1024) {
      return new Response("Payload Too Large", { status: 413 });
    }

    const url = new URL(request.url);
    // Support Authorization header or query param
    const authHeader = request.headers.get("Authorization");
    let secret = url.searchParams.get("secret") || "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      secret = authHeader.substring(7);
    }
    const expectedSecret = process.env.MOTHERDUCK_SYNC_SECRET;
    if (!expectedSecret || !timingSafeEqual(secret, expectedSecret)) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const recommendations = await request.json();
      if (!Array.isArray(recommendations)) {
        return new Response("Bad Request: Expected array of recommendations", { status: 400 });
      }
      await ctx.runMutation(internal.telemetry.upsertRecommendationsBatch, { recommendations });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err: any) {
      return new Response("Bad Request: " + err.message, { status: 400 });
    }
  }),
});

http.route({
  path: "/api/import-analytics",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const contentLength = parseInt(request.headers.get("Content-Length") || "0", 10);
    if (contentLength > 1 * 1024 * 1024) {
      return new Response("Payload Too Large", { status: 413 });
    }

    const url = new URL(request.url);
    const authHeader = request.headers.get("Authorization");
    let secret = url.searchParams.get("secret") || "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      secret = authHeader.substring(7);
    }
    const expectedSecret = process.env.MOTHERDUCK_SYNC_SECRET;
    if (!expectedSecret || !timingSafeEqual(secret, expectedSecret)) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const analytics = await request.json();
      if (!Array.isArray(analytics)) {
        return new Response("Bad Request: Expected array of analytics", { status: 400 });
      }
      await ctx.runMutation(internal.telemetry.upsertListingAnalytics, { analytics });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err: any) {
      return new Response("Bad Request: " + err.message, { status: 400 });
    }
  }),
});

http.route({
  path: "/api/export-table",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret") || "";
    const expectedSecret = process.env.MOTHERDUCK_SYNC_SECRET;
    if (!expectedSecret || !timingSafeEqual(secret, expectedSecret)) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    const table = url.searchParams.get("table");
    if (!table) {
      return new Response("Bad Request: table parameter required", { status: 400 });
    }

    const sinceStr = url.searchParams.get("since") || "0";
    const since = parseInt(sinceStr, 10) || 0;
    const limit = parseInt(url.searchParams.get("limit") || "1000", 10);
    const cursor = url.searchParams.get("cursor") || undefined;

    try {
      const data = await ctx.runQuery(api.sync.getExportData, { table, since, limit, cursor });
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response("Bad Request: " + err.message, { status: 400 });
    }
  }),
});

export default http;

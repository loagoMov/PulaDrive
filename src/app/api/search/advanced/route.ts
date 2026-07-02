import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filters
    const budgetMin = searchParams.get("budgetMin");
    const budgetMax = searchParams.get("budgetMax");
    const yearMin = searchParams.get("yearMin");
    const yearMax = searchParams.get("yearMax");
    const mileageMax = searchParams.get("mileageMax");
    const fuelType = searchParams.get("fuelType");
    const transmission = searchParams.get("transmission");
    const category = searchParams.get("category");
    const color = searchParams.get("color");
    const makeModel = searchParams.get("makeModel");

    const queryArgs = {
      budgetMin: budgetMin ? Math.max(0, Math.min(Number(budgetMin), 100_000_000)) : undefined,
      budgetMax: budgetMax ? Math.max(0, Math.min(Number(budgetMax), 100_000_000)) : undefined,
      yearMin: yearMin ? Math.max(1900, Math.min(Number(yearMin), 2100)) : undefined,
      yearMax: yearMax ? Math.max(1900, Math.min(Number(yearMax), 2100)) : undefined,
      mileageMax: mileageMax ? Math.max(0, Math.min(Number(mileageMax), 10_000_000)) : undefined,
      // Whitelist enum values to prevent cache-key injection
      fuelType: ["petrol", "diesel", "electric", "hybrid"].includes(fuelType || "") ? fuelType! : undefined,
      transmission: ["automatic", "manual"].includes(transmission || "") ? transmission! : undefined,
      category: ["suv", "sedan", "hatchback", "truck", "luxury", "coupe", "wagon", "van"].includes(category || "") ? category! : undefined,
      color: ["white", "black", "silver", "grey", "blue", "red", "gold", "brown"].includes(color || "") ? color! : undefined,
      // Sanitize free-text: strip characters that could cause injection, cap length
      makeModel: makeModel ? makeModel.replace(/[<>"'`;{}|\\^[\]]/g, "").trim().slice(0, 100) || undefined : undefined,
    };

    // Build a deterministic cache key
    const sortedArgs = Object.entries(queryArgs)
      .filter(([_, v]) => v !== undefined)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${k}:${v}`)
      .join("|");

    const cacheKey = `cache:search:advanced:${sortedArgs || "default"}`;

    // Guard against excessively long cache keys (basic injection protection)
    if (cacheKey.length > 512) {
      return NextResponse.json({ error: "Query parameters too long" }, { status: 400 });
    }

    // 1. Try to read from Upstash Redis
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          "X-Cache": "HIT",
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      });
    }

    // 2. Cache Miss: Fetch from Convex
    const vehicles = await convex.query(api.vehicles.advancedSearch, queryArgs);

    // 3. Store in Redis with a 5-minute TTL (300 seconds)
    await redis.setex(cacheKey, 300, vehicles);

    return NextResponse.json(vehicles, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error: any) {
    console.error("Advanced search caching route error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

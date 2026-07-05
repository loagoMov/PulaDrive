import { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://puladrive.com";

    // 1. Static URLs
    const staticUrls = [
        "",
        "/search",
        "/dealers",
        "/favorites",
        "/legal/privacy",
        "/legal/terms",
        "/legal/cookies",
        "/legal/compliance",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
        priority: route === "" ? 1.0 : 0.8,
    }));

    // 2. Fetch Dynamic Listings
    let listingUrls: any[] = [];
    try {
        const vehicles = await fetchQuery(api.vehicles.list, { status: "available", limit: 100 });
        if (vehicles) {
            listingUrls = vehicles.map((car) => ({
                url: `${baseUrl}/listings/${car._id}`,
                lastModified: new Date(car.updatedAt || Date.now()),
                changeFrequency: "daily" as const,
                priority: 0.7,
            }));
        }
    } catch (e) {
        console.error("Failed to fetch vehicles for sitemap", e);
    }

    // 3. Fetch Dynamic Dealers
    let dealerUrls: any[] = [];
    try {
        const dealers = await fetchQuery(api.dealerships.list);
        if (dealers) {
            dealerUrls = dealers.map((dealer) => ({
                url: `${baseUrl}/dealers/${dealer.slug}`,
                lastModified: new Date(dealer.updatedAt || Date.now()),
                changeFrequency: "weekly" as const,
                priority: 0.6,
            }));
        }
    } catch (e) {
        console.error("Failed to fetch dealerships for sitemap", e);
    }

    return [...staticUrls, ...listingUrls, ...dealerUrls];
}

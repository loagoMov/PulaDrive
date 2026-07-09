"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import FeaturedCarousel from "@/components/ui/FeaturedCarousel";

function FeaturedSkeleton() {
  return (
    <div className="flex gap-6 overflow-hidden py-4 px-4 sm:px-0">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex-none w-[280px] sm:w-[320px] card-premium animate-pulse">
          <div className="aspect-[4/3] bg-slate-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-200 rounded-md w-3/4" />
            <div className="h-6 bg-slate-200 rounded-md w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeaturedSection() {
  const featuredVehicles = useQuery(api.vehicles.getFeatured);

  if (featuredVehicles === undefined) {
    return <FeaturedSkeleton />;
  }

  if (featuredVehicles === null || featuredVehicles.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="flex justify-between items-end mb-6">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Featured Listings</h2>
        </div>
      </div>
      <div className="-mx-4 sm:mx-0">
        <FeaturedCarousel cars={featuredVehicles} />
      </div>
    </section>
  );
}

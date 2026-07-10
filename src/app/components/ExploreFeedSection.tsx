"use client";

import { useState, useEffect } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import CarCard from "@/components/ui/CarCard";
import { SkeletonGrid } from "@/components/ui/SkeletonLoader";

export default function ExploreFeedSection() {
  const { results: vehicles, status: paginationStatus, loadMore } = usePaginatedQuery(
    api.vehicles.listPaginated,
    {},
    { initialNumItems: 12 }
  );

  const [shuffledVehicles, setShuffledVehicles] = useState<any[]>([]);

  useEffect(() => {
    if (vehicles) {
      // 1. Get or create a session seed
      let seedStr = sessionStorage.getItem("puladrive_session_seed");
      if (!seedStr) {
        seedStr = Math.floor(Math.random() * 1000000).toString();
        sessionStorage.setItem("puladrive_session_seed", seedStr);
      }
      let seed = parseInt(seedStr, 10);
      if (isNaN(seed)) {
        seed = 123456; // Secure fallback
      }

      // 2. Simple LCG PRNG helper
      const pseudoRandom = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      // 3. Seeded Fisher-Yates shuffle
      const arr = [...vehicles];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(pseudoRandom() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setShuffledVehicles(arr);
    }
  }, [vehicles]);

  if (paginationStatus === "LoadingFirstPage") {
    return <SkeletonGrid />;
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 font-medium">
        No vehicles available at the moment.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shuffledVehicles.map((car: any, i: number) => (
          <CarCard key={car._id} car={car} priority={i === 0} />
        ))}
      </div>
      {paginationStatus === "CanLoadMore" && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => loadMore(12)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-primary-500 hover:text-primary-600 rounded-full font-bold text-sm text-slate-700 shadow-sm transition-all hover:shadow-md cursor-pointer"
          >
            Load More Vehicles
          </button>
        </div>
      )}
      {paginationStatus === "LoadingMore" && (
        <div className="flex justify-center pt-4">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary-600 animate-spin" />
        </div>
      )}
    </div>
  );
}

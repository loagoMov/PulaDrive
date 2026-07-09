"use client";

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
        {vehicles.map((car: any, i: number) => (
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

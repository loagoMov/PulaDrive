"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import CarCard from "@/components/ui/CarCard";
import { SkeletonGrid } from "@/components/ui/SkeletonLoader";
import { Sparkles, ArrowRight } from "lucide-react";

interface ForYouFeedSectionProps {
  targetId: string;
  onStartExploring: () => void;
}

export default function ForYouFeedSection({ targetId, onStartExploring }: ForYouFeedSectionProps) {
  const forYouVehicles = useQuery(api.vehicles.getForYouFeed, { targetId: targetId || undefined });

  if (forYouVehicles === undefined) {
    return <SkeletonGrid />;
  }

  if (forYouVehicles === null || forYouVehicles.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 px-6 text-center rounded-[2rem] bg-gradient-to-br from-indigo-50 via-violet-50 to-white border border-indigo-100 space-y-6">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-violet-400/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-xl border border-violet-400/20">
            <Sparkles size={36} className="text-white animate-pulse" />
          </div>
        </div>

        <div className="space-y-2 max-w-sm">
          <h3 className="text-xl font-black text-slate-900">Training your personal feed</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            Browse cars, heart listings, and search to help us tailor recommendations just for you.
          </p>
        </div>

        <div className="w-full max-w-sm grid grid-cols-1 gap-2 text-left">
          {[
            { step: "1", action: "View a few car listings", icon: "👀" },
            { step: "2", action: "Heart the ones you love", icon: "❤️" },
            { step: "3", action: "Use AI Deal Finder once", icon: "✨" },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-indigo-100 shadow-sm">
              <span className="text-xl">{item.icon}</span>
              <p className="text-xs font-bold text-slate-700 flex-1">{item.action}</p>
              <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] font-black text-indigo-600">{item.step}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onStartExploring}
          className="flex items-center gap-2 px-6 py-3 font-black text-sm text-white rounded-2xl shadow-lg shadow-indigo-200 transition-all cursor-pointer"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          <ArrowRight size={16} /> Start Exploring
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forYouVehicles.map((car: any, i: number) => (
          <CarCard key={car._id} car={car} priority={i === 0} />
        ))}
      </div>
      <div className="flex justify-center pt-4">
        <button
          onClick={onStartExploring}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-primary-500 hover:text-primary-600 rounded-full font-bold text-sm text-slate-700 shadow-sm transition-all hover:shadow-md cursor-pointer"
        >
          Explore More
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

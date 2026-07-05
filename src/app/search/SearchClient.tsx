"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import MobileNav from "@/components/navigation/MobileNav";
import CarCard from "@/components/ui/CarCard";
import { SkeletonGrid } from "@/components/ui/SkeletonLoader";
import { Search as SearchIcon, X, SlidersHorizontal, Car, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const CATEGORIES = [
    { id: "all", label: "All Vehicles" },
    { id: "suv", label: "SUVs" },
    { id: "sedan", label: "Sedans" },
    { id: "hatchback", label: "Hatchbacks" },
    { id: "truck", label: "Trucks / Bakkies" },
    { id: "luxury", label: "Luxury" },
    { id: "coupe", label: "Coupes" },
    { id: "van", label: "Vans" },
];

function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialQuery = searchParams.get("q") || "";
    const initialCategory = searchParams.get("category") || "all";
    const initialPrice = searchParams.get("price") ? Number(searchParams.get("price")) : "";

    const [queryText, setQueryText] = useState(initialQuery);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
    const [targetPrice, setTargetPrice] = useState<number | "">(initialPrice);
    const [debouncedTargetPrice, setDebouncedTargetPrice] = useState<number | undefined>(initialPrice || undefined);
    const [showFilters, setShowFilters] = useState(initialPrice !== "" || searchParams.get("filters") === "true");

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(queryText);
        }, 300);
        return () => clearTimeout(timer);
    }, [queryText]);

    // Debounce price input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTargetPrice(targetPrice === "" ? undefined : Number(targetPrice));
        }, 300);
        return () => clearTimeout(timer);
    }, [targetPrice]);

    // Update URL on search/filter changes
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set("q", debouncedQuery);
        if (selectedCategory !== "all") params.set("category", selectedCategory);
        if (debouncedTargetPrice) params.set("price", debouncedTargetPrice.toString());

        const queryString = params.toString();
        router.replace(queryString ? `/search?${queryString}` : "/search", { scroll: false });
    }, [debouncedQuery, selectedCategory, debouncedTargetPrice, router]);

    const vehicles = useQuery(api.vehicles.searchRanked, {
        queryText: debouncedQuery,
        category: selectedCategory === "all" ? undefined : selectedCategory,
        targetPrice: debouncedTargetPrice,
    });

    return (
        <>
            {/* Search Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by make, model..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold"
                                value={queryText}
                                onChange={(e) => setQueryText(e.target.value)}
                            />
                            {queryText && (
                                <button
                                    onClick={() => setQueryText("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-3 border rounded-2xl transition-colors shadow-sm ${showFilters ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-slate-200 text-slate-600 hover:text-primary-600'}`}
                        >
                            <SlidersHorizontal size={20} />
                        </button>
                    </div>

                    {/* ── AI Deal Finder CTA ── */}
                    <Link
                        href="/search/advanced"
                        id="ai-deal-finder-btn"
                        className="flex items-center justify-between w-full px-5 py-3 rounded-2xl text-white font-bold text-sm group relative overflow-hidden"
                        style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
                    >
                        {/* animated shimmer */}
                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{ background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)" }}
                        />
                        <span className="relative flex items-center gap-2">
                            {/* pulsing glow dot */}
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                            </span>
                            <Sparkles size={16} className="opacity-90" />
                            <span>AI Deal Finder</span>
                            <span className="text-white/60 font-normal text-xs ml-1">— tell us your budget & we'll find your perfect car</span>
                        </span>
                        <span className="relative text-white/70 text-xs font-black tracking-widest uppercase group-hover:text-white transition-colors">
                            Try it →
                        </span>
                    </Link>

                    {showFilters && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div>
                                <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">
                                    Target Price (Pula)
                                </label>
                                <div className="flex gap-3 items-center">
                                    <input
                                        type="number"
                                        placeholder="e.g., 150000"
                                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold"
                                        value={targetPrice}
                                        onChange={(e) => setTargetPrice(e.target.value === "" ? "" : Number(e.target.value))}
                                    />
                                    {targetPrice && (
                                        <button
                                            onClick={() => setTargetPrice("")}
                                            className="text-xs font-bold text-slate-400 hover:text-slate-600"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium mt-1">
                                    We rank vehicles matching your budget/price preference higher.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`whitespace-nowrap px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${selectedCategory === cat.id
                                    ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200"
                                    : "bg-white text-slate-500 border-slate-100 hover:border-primary-200 hover:text-primary-600"
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                        {vehicles ? `${vehicles.length} Results Found` : "Searching..."}
                    </h2>
                </div>

                {!vehicles ? (
                    <SkeletonGrid />
                ) : vehicles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-5">
                        <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                            <Car size={28} />
                        </div>
                        <div className="space-y-1.5 max-w-sm">
                            <h3 className="text-xl font-black text-slate-900">No vehicles found</h3>
                            <p className="text-slate-500 text-sm font-medium">
                                We couldn't find any matches. Try broadening your criteria or reset your options.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setQueryText("");
                                setSelectedCategory("all");
                                setTargetPrice("");
                                setShowFilters(false);
                            }}
                            className="bg-primary-600 hover:bg-primary-700 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-lg shadow-primary-200 transition-all cursor-pointer"
                        >
                            Reset all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vehicles.map((car: any) => (
                            <CarCard key={car._id} car={car} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default function SearchClient() {
    return (
        <Suspense fallback={<SkeletonGrid />}>
            <SearchContent />
        </Suspense>
    );
}

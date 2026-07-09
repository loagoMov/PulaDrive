"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Search, MapPin, SlidersHorizontal, Sparkles, Clock, ArrowRight, Heart } from "lucide-react";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useAuth } from "@clerk/nextjs";

// Import Error Boundary & Section Components
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import FeaturedSection from "./components/FeaturedSection";
import ExploreFeedSection from "./components/ExploreFeedSection";
import ForYouFeedSection from "./components/ForYouFeedSection";

// Dynamically import heavy UI elements to reduce bundle size and speed up FCP
const MobileNav = dynamic(() => import("@/components/navigation/MobileNav"), { ssr: false });

export default function Home() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"explore" | "foryou">("explore");
    const { userId, isSignedIn } = useAuth();
    const targetId = isSignedIn ? (userId || "") : (typeof window !== "undefined" ? localStorage.getItem("puladrive_anon_id") || "" : "");

    const { history } = useSearchHistory();
    const { trackEvent } = useTelemetry();

    useEffect(() => {
        trackEvent("page_view");
    }, [trackEvent]);

    return (
        <main className="min-h-screen pb-28 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header section */}
            <header className="mb-8 space-y-5">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            PulaDrive<span className="text-primary-600">.</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium flex items-center gap-1">
                            <MapPin size={14} className="text-primary-500" /> Gaborone, Botswana
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => router.push("/favorites")}
                            className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 hover:text-rose-500 transition-colors"
                            title="My Favorites"
                        >
                            <Heart size={20} className="text-slate-600 hover:text-rose-500 fill-transparent hover:fill-rose-500 transition-colors" />
                        </button>
                        <button 
                            onClick={() => router.push("/search?filters=true")}
                            className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 hover:text-primary-600 transition-colors"
                        >
                            <SlidersHorizontal size={20} />
                        </button>
                    </div>
                </div>

                {/* Search bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by make, model, or year..."
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900 placeholder:text-slate-400 cursor-pointer"
                        onFocus={() => router.push("/search")}
                        readOnly
                    />
                </div>

                {/* AI Deal Finder banner */}
                <Link
                    href="/search/advanced"
                    id="home-ai-deal-finder-btn"
                    className="flex items-center justify-between w-full px-5 py-4 rounded-2xl text-white font-bold text-sm group relative overflow-hidden shadow-xl"
                    style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)" }}
                >
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
                    />
                    <span className="absolute -top-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                    <span className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

                    <span className="relative flex items-center gap-3">
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                        </span>
                        <span className="flex flex-col text-left">
                            <span className="flex items-center gap-1.5 text-base font-black">
                                <Sparkles size={15} className="opacity-90" />
                                AI Deal Finder
                            </span>
                            <span className="text-white/60 font-normal text-xs">
                                Enter your budget &amp; specs — we'll rank the best deals for you
                            </span>
                        </span>
                    </span>
                    <span className="relative flex items-center gap-1 text-white/80 text-xs font-black tracking-widest uppercase group-hover:text-white transition-colors shrink-0 ml-2">
                        Try it <ArrowRight size={14} />
                    </span>
                </Link>

                {/* Recent searches strip */}
                {history.length > 0 && (
                    <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-slate-400">
                            <Clock size={11} /> Recent AI Searches
                        </p>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
                            {history.slice(0, 4).map((entry, i) => (
                                <Link
                                    key={entry._id ?? i}
                                    href="/search/advanced"
                                    className="flex-none flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:border-primary-300 hover:text-primary-600 transition-all shadow-sm whitespace-nowrap"
                                >
                                    <Sparkles size={11} className="text-violet-500 shrink-0" />
                                    {entry.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Categories / Quick filters */}
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {[
                        { id: "all", label: "All Cars" },
                        { id: "suv", label: "SUVs" },
                        { id: "sedan", label: "Sedans" },
                        { id: "hatchback", label: "Hatchbacks" },
                        { id: "luxury", label: "Luxury" },
                        { id: "truck", label: "Budget" }
                    ].map((tab, i) => (
                        <Link
                            key={tab.id}
                            href={tab.id === "all" ? "/search" : `/search?category=${tab.id}`}
                            className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold transition-all ${
                                i === 0 
                                    ? "bg-primary-600 text-white shadow-md shadow-primary-200" 
                                    : "bg-white text-slate-600 border border-slate-200 hover:border-primary-200 hover:bg-primary-50"
                            }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </header>

            {/* Featured Listings Horizontal Carousel (Error Isolated) */}
            <SectionErrorBoundary sectionName="Featured Listings">
                <FeaturedSection />
            </SectionErrorBoundary>

            {/* Feed Selector (Explore vs For You) */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                        <button
                            onClick={() => setActiveTab("explore")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                                activeTab === "explore"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            Explore
                        </button>
                        <button
                            onClick={() => setActiveTab("foryou")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                                activeTab === "foryou"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <Sparkles size={13} className="text-indigo-500 animate-pulse" />
                            For You
                        </button>
                    </div>
                    <button 
                        className="text-primary-600 text-sm font-bold hover:underline underline-offset-4" 
                        onClick={() => router.push("/search")}
                    >
                        See All
                    </button>
                </div>

                {activeTab === "explore" ? (
                    <SectionErrorBoundary sectionName="Explore Feed">
                        <ExploreFeedSection />
                    </SectionErrorBoundary>
                ) : (
                    <SectionErrorBoundary sectionName="For You Feed">
                        <ForYouFeedSection 
                            targetId={targetId} 
                            onStartExploring={() => setActiveTab("explore")} 
                        />
                    </SectionErrorBoundary>
                )}
            </section>

            <MobileNav />
        </main>
    );
}

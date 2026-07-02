"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useOrganization, useUser } from "@clerk/nextjs";
import MobileNav from "@/components/navigation/MobileNav";
import { Loader2, TrendingUp, BarChart, Eye, Heart, Share2, MousePointerClick, ArrowLeft } from "lucide-react";
import Link from "next/link";
import DealershipSelector from "@/components/dashboard/DealershipSelector";

export default function AnalyticsDashboard() {
    const { isLoaded } = useUser();
    const { organization } = useOrganization();

    const dealership = useQuery(api.dealerships.getByClerkOrgId, organization ? { clerkOrgId: organization.id } : "skip");
    const vehicles = useQuery(api.vehicles.getByDealerId, dealership && dealership !== null ? { dealerId: dealership._id } : "skip");
    const analytics = useQuery(api.telemetry.getListingAnalytics, dealership && dealership !== null ? { dealerId: dealership._id } : "skip");

    if (!isLoaded || dealership === undefined || vehicles === undefined || analytics === undefined) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (!organization || dealership === null) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dealer Setup Required</h2>
                <p className="text-slate-500 mt-2">You must have an active dealership to view analytics.</p>
                <Link href="/dashboard" className="mt-6 px-6 py-2 bg-primary-600 text-white font-bold rounded-xl">
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    // Merge vehicle info with analytics
    const vehicleStats = vehicles.map(vehicle => {
        const stats = analytics.find(a => a.vehicleId === vehicle._id) || {
            views: 0,
            favorites: 0,
            shares: 0,
            clicks: 0
        };
        return {
            ...vehicle,
            stats
        };
    }).sort((a, b) => b.stats.views - a.stats.views); // Sort by views descending

    const totalViews     = vehicleStats.reduce((sum, v) => sum + v.stats.views, 0);
    const totalFavorites = vehicleStats.reduce((sum, v) => sum + v.stats.favorites, 0);
    const totalShares    = vehicleStats.reduce((sum, v) => sum + v.stats.shares, 0);
    const totalClicks    = vehicleStats.reduce((sum, v) => sum + v.stats.clicks, 0);

    const statCards = [
        { icon: <Eye className="w-5 h-5 text-blue-500" />,              label: "Total Views",     value: totalViews,     accent: "border-l-blue-400" },
        { icon: <Heart className="w-5 h-5 text-rose-500" />,            label: "Total Favorites", value: totalFavorites, accent: "border-l-rose-400" },
        { icon: <Share2 className="w-5 h-5 text-green-500" />,          label: "Total Shares",    value: totalShares,    accent: "border-l-green-400" },
        { icon: <MousePointerClick className="w-5 h-5 text-amber-500" />, label: "Total Clicks", value: totalClicks,    accent: "border-l-amber-400" },
    ];

    return (
        <main className="min-h-screen bg-slate-50 pb-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="touch-target no-tap-highlight p-2 hover:bg-slate-200 rounded-full transition-colors flex-shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 leading-none">
                                <BarChart className="text-primary-500 w-6 h-6 sm:w-7 sm:h-7" /> Listing Analytics
                            </h1>
                            <div className="mt-0.5">
                                <DealershipSelector />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Aggregate Stat Cards ────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {statCards.map(({ icon, label, value, accent }) => (
                        <div key={label} className={`bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 ${accent} flex flex-col justify-center gap-2`}>
                            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs sm:text-sm">
                                {icon}
                                <span className="leading-tight">{label}</span>
                            </div>
                            <p className="text-2xl sm:text-3xl font-black text-slate-900">{value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Top Performing Listings ─────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                            <TrendingUp className="text-primary-500 w-5 h-5" /> Top Performing Listings
                        </h2>
                    </div>

                    {/* Desktop Table (md+) */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 font-black text-slate-400 text-xs uppercase tracking-widest">Vehicle</th>
                                    <th className="px-6 py-4 font-black text-slate-400 text-xs uppercase tracking-widest text-center">Views</th>
                                    <th className="px-6 py-4 font-black text-slate-400 text-xs uppercase tracking-widest text-center">Favorites</th>
                                    <th className="px-6 py-4 font-black text-slate-400 text-xs uppercase tracking-widest text-center">Shares</th>
                                    <th className="px-6 py-4 font-black text-slate-400 text-xs uppercase tracking-widest text-center">Clicks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {vehicleStats.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                            No listings found.
                                        </td>
                                    </tr>
                                )}
                                {vehicleStats.map((v) => (
                                    <tr key={v._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900">{v.year} {v.make} {v.model}</p>
                                            <p className="text-sm font-medium text-slate-500">P{v.price.toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700">{v.stats.views}</td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700">{v.stats.favorites}</td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700">{v.stats.shares}</td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700">{v.stats.clicks}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List (< md) */}
                    <div className="flex md:hidden flex-col divide-y divide-slate-100">
                        {vehicleStats.length === 0 && (
                            <p className="py-8 text-center text-slate-400 text-sm">No listings found.</p>
                        )}
                        {vehicleStats.map((v) => (
                            <div key={v._id} className="p-4 space-y-3">
                                {/* Vehicle name & price */}
                                <div>
                                    <p className="font-black text-slate-900 text-sm">{v.year} {v.make} {v.model}</p>
                                    <p className="text-xs font-medium text-slate-500">P{v.price.toLocaleString()}</p>
                                </div>
                                {/* Stats 2×2 grid */}
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { icon: <Eye className="w-3.5 h-3.5 text-blue-500" />,               label: "Views",     value: v.stats.views,     bg: "bg-blue-50" },
                                        { icon: <Heart className="w-3.5 h-3.5 text-rose-500" />,             label: "Favorites", value: v.stats.favorites, bg: "bg-rose-50" },
                                        { icon: <Share2 className="w-3.5 h-3.5 text-green-500" />,           label: "Shares",    value: v.stats.shares,    bg: "bg-green-50" },
                                        { icon: <MousePointerClick className="w-3.5 h-3.5 text-amber-500" />, label: "Clicks",   value: v.stats.clicks,    bg: "bg-amber-50" },
                                    ].map(({ icon, label, value, bg }) => (
                                        <div key={label} className={`${bg} rounded-xl px-3 py-2 flex items-center gap-2`}>
                                            {icon}
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">{label}</p>
                                                <p className="text-base font-black text-slate-900">{value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
            <MobileNav />
        </main>
    );
}

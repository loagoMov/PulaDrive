"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import MobileNav from "@/components/navigation/MobileNav";
import { Store, MapPin, ChevronRight } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function DealersClient() {
    const dealers = useQuery(api.dealerships.list);
    const { capture } = useAnalytics();

    return (
        <main className="min-h-screen pb-28 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="mb-8 mt-12">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    Dealerships
                </h1>
                <p className="text-slate-500 mt-2 font-medium">
                    Find trusted car dealers across Botswana
                </p>
            </div>

            {dealers === undefined ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="card-premium h-48 animate-pulse p-6 space-y-4 flex flex-col justify-center">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-slate-200 rounded-full shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : dealers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center rounded-[2.5rem] border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white space-y-6">
                    {/* Animated icon */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary-400/10 rounded-full blur-2xl animate-pulse" />
                        <div className="relative w-24 h-24 bg-gradient-to-br from-primary-500 to-violet-600 rounded-[2rem] flex items-center justify-center shadow-2xl border border-primary-400/20">
                            <Store className="text-white" size={44} />
                        </div>
                    </div>

                    {/* Text */}
                    <div className="space-y-2 max-w-sm">
                        <h3 className="text-2xl font-black text-slate-900">No Dealerships Yet</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                            PulaDrive is growing — dealerships are being onboarded. Check back soon or register your own showroom.
                        </p>
                    </div>

                    {/* Stats / badges */}
                    <div className="flex gap-3 flex-wrap justify-center">
                        {["Verified Dealers", "Secure Transactions", "Local Inventory"].map((badge) => (
                            <span key={badge} className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[11px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                                ✓ {badge}
                            </span>
                        ))}
                    </div>

                    {/* CTA */}
                    <Link
                        href="/search"
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-black text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-primary-200 transition-all"
                    >
                        Browse All Listings <ChevronRight size={16} />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dealers.map((dealer) => (
                        <Link
                            key={dealer._id}
                            href={`/dealers/${dealer.slug}`}
                            onClick={() =>
                                capture("dealer_profile_viewed", {
                                    dealer_id: dealer._id,
                                    dealer_slug: dealer.slug,
                                    dealer_name: dealer.name,
                                })
                            }
                            className="card-premium p-6 group hover:border-primary-300 transition-all flex flex-col justify-between"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-primary-200 overflow-hidden">
                                    {dealer.logoUrl ? (
                                        <Image src={dealer.logoUrl} alt={dealer.name} fill sizes="64px" className="object-cover" />
                                    ) : (
                                        <Store className="w-8 h-8 text-primary-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                                        {dealer.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1 font-medium">
                                        <MapPin size={14} className="text-primary-500" />
                                        <span className="truncate">{dealer.location}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center text-primary-600 text-sm font-bold mt-2 pt-4 border-t border-slate-100">
                                <span>View Inventory</span>
                                <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <MobileNav />
        </main>
    );
}

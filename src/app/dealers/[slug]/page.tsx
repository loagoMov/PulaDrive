"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MobileNav from "@/components/navigation/MobileNav";
import CarCard from "@/components/ui/CarCard";
import { SkeletonGrid } from "@/components/ui/SkeletonLoader";
import { Store, MapPin, ChevronLeft, Car, Mail, Phone, Globe, MessageSquare } from "lucide-react";

export default function DealerDetailsPage() {
    const params = useParams();
    const slug = params.slug as string;

    const dealer = useQuery(api.dealerships.getBySlug, { slug });
    const vehicles = useQuery(
        api.vehicles.getByDealerId,
        dealer ? { dealerId: dealer._id } : "skip"
    );

    if (dealer === undefined) {
        return (
            <main className="min-h-screen pb-28 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="animate-pulse space-y-8 mt-12">
                    <div className="h-8 bg-slate-200 rounded w-24 mb-8" />
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-slate-200 rounded-2xl" />
                        <div className="space-y-4">
                            <div className="h-10 bg-slate-200 rounded w-64" />
                            <div className="h-6 bg-slate-200 rounded w-48" />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (dealer === null) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md">
                    <Store className="w-20 h-20 text-slate-300 mx-auto" />
                    <h1 className="text-3xl font-black text-slate-900">Dealer Not Found</h1>
                    <p className="text-slate-500 font-medium pb-4">We couldn't find the dealership you're looking for.</p>
                    <Link href="/dealers" className="btn-primary">
                        Browse Dealerships
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pb-28 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <Link href="/dealers" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors mb-8 mt-4 group">
                <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Dealerships
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-8 md:mb-12">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center shrink-0 border-2 border-primary-200 shadow-xl shadow-primary-900/5 overflow-hidden">
                    {dealer.logoUrl ? (
                        <Image src={dealer.logoUrl} alt={dealer.name} fill sizes="(max-width: 640px) 96px, 128px" className="object-cover" />
                    ) : (
                        <Store className="w-12 h-12 sm:w-16 sm:h-16 text-primary-500" />
                    )}
                </div>
                <div className="pb-2 min-w-0">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight break-words">
                        {dealer.name}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-500 mt-3 font-medium text-lg min-w-0">
                        <MapPin size={20} className="text-primary-500 shrink-0" />
                        <span className="truncate">{dealer.location}</span>
                    </div>
                </div>
            </div>

            {/* ── Dealer Profile & Contact Information ── */}
            {((dealer as any).description || (dealer as any).contactEmail || (dealer as any).contactPhone || dealer.phone || (dealer as any).googleMapsUrl) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 md:mb-12 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-350">
                    {/* Public Description */}
                    <div className="space-y-4 min-w-0">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">About Dealership</h3>
                        {(dealer as any).description ? (
                            <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                                {(dealer as any).description}
                            </p>
                        ) : (
                            <p className="text-sm font-medium text-slate-400 italic">
                                No description provided yet.
                            </p>
                        )}
                        
                        {/* Contacts */}
                        <div className="pt-4 space-y-3 min-w-0">
                            <h4 className="text-xs uppercase font-black tracking-wider text-slate-400">Contact Details</h4>
                            <div className="space-y-2 min-w-0">
                                {(dealer as any).contactEmail && (
                                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-700 min-w-0">
                                        <Mail size={16} className="text-primary-500 shrink-0" />
                                        <a href={`mailto:${(dealer as any).contactEmail}`} className="hover:text-primary-600 transition-colors break-all truncate">
                                            {(dealer as any).contactEmail}
                                        </a>
                                    </div>
                                )}
                                {(dealer as any).contactPhone && (
                                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-700 min-w-0">
                                        <Phone size={16} className="text-primary-500 shrink-0" />
                                        <a href={`tel:${(dealer as any).contactPhone}`} className="hover:text-primary-600 transition-colors truncate">
                                            {(dealer as any).contactPhone}
                                        </a>
                                    </div>
                                )}
                                {dealer.phone && (
                                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-700 min-w-0">
                                        <MessageSquare size={16} className="text-emerald-500 fill-emerald-50 shrink-0" />
                                        <a href={`https://wa.me/${dealer.phone}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors flex items-center gap-1 min-w-0 truncate">
                                            <span className="truncate">WhatsApp Sales</span> <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0">Online</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Find Us / Directions */}
                    <div className="flex flex-col justify-between space-y-6 min-w-0">
                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Location &amp; Directions</h3>
                            <div className="flex items-start gap-2.5 text-slate-600 font-medium text-sm">
                                <MapPin size={18} className="text-primary-500 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800 break-words">{dealer.location}</p>
                                    <p className="text-xs text-slate-400 mt-1">Visit us at our dealership location.</p>
                                </div>
                            </div>
                        </div>

                        {(dealer as any).googleMapsUrl ? (
                            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col justify-between items-center text-center space-y-4">
                                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-500">
                                    <MapPin size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-slate-800">Find us on Google Maps</h4>
                                    <p className="text-xs text-slate-400 font-medium">Get real-time GPS directions to our dealership branch.</p>
                                </div>
                                <a
                                    href={(dealer as any).googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md hover:shadow-lg no-tap-highlight cursor-pointer"
                                >
                                    Get Directions ↗
                                </a>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-2">
                                <MapPin size={24} className="text-slate-300 animate-pulse" />
                                <p className="text-xs text-slate-400 font-medium">Google Maps directions not available.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900">Inventory</h2>

                {vehicles === undefined ? (
                    <SkeletonGrid />
                ) : vehicles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-[2.5rem] border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white space-y-5">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <div className="absolute inset-0 bg-amber-400/10 rounded-full blur-xl animate-pulse" />
                            <div className="relative w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl border border-amber-400/20">
                                <Car size={36} className="text-white" />
                            </div>
                        </div>

                        <div className="space-y-2 max-w-xs">
                            <h3 className="text-xl font-black text-slate-900">No Vehicles Listed</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                {dealer.name} hasn't added any cars yet. Check back soon or browse other dealers.
                            </p>
                        </div>

                        <div className="flex gap-3 flex-wrap justify-center">
                            <Link
                                href="/dealers"
                                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-lg shadow-primary-200 transition-all"
                            >
                                <ChevronLeft size={16} /> All Dealers
                            </Link>
                            <Link
                                href="/search"
                                className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 hover:border-primary-300 hover:text-primary-600 font-black text-sm px-6 py-3 rounded-2xl bg-white transition-all"
                            >
                                Browse All Cars
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {vehicles.map((car) => (
                            <CarCard key={car._id} car={car} />
                        ))}
                    </div>
                )}
            </div>

            <MobileNav />
        </main>
    );
}

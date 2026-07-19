"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Share2, Heart, MessageCircle, MapPin, Calendar, Gauge, Fuel, Zap, SlidersHorizontal, Flag, Check, Phone, ShieldCheck, Sparkles, HandshakeIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useWishlist } from "@/hooks/useWishlist";
import { useAnalytics } from "@/hooks/useAnalytics";
import NotFound from "@/app/not-found";

const ReportModal = dynamic(() => import("../../../components/ui/ReportModal"), { ssr: false });

export default function VehicleDetailsClient() {
    const params = useParams();
    const router = useRouter();
    const vehicle = useQuery(api.vehicles.getVehicle, { id: params.id as any });
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [shareSuccess, setShareSuccess] = useState(false);
    const { toggle, isWishlisted } = useWishlist();
    const { capture } = useAnalytics();
    // Track whether there's a browser history entry we can go back to.
    // When a listing is opened directly (e.g. via a shared link) there is no
    // previous page in session history, so router.back() would do nothing.
    const canGoBack = useRef(false);
    useEffect(() => {
        // If the page was already in the session's history stack, history.length > 1
        canGoBack.current = window.history.length > 1;
    }, []);

    const handleBack = () => {
        if (canGoBack.current) {
            router.back();
        } else {
            router.push("/listings");
        }
    };

    // Reset scroll position on mount — prevents the previous page's scroll
    // position from carrying over on mobile (common with Next.js client navigation).
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, []);

    // Track vehicle view on load
    useEffect(() => {
        if (vehicle) {
            capture("listing_viewed", {
                vehicle_id: vehicle._id,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                price: vehicle.price,
                dealer_id: vehicle.dealerId,
                dealer_name: vehicle.dealer?.name,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vehicle?._id]);

    if (vehicle === undefined) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (vehicle === null) {
        return <NotFound />;
    }

    const images = (vehicle.imageUrls && vehicle.imageUrls.length > 0) ? vehicle.imageUrls : ["/placeholder-car.jpg"];

    const dealerPhone = vehicle.dealer?.phone ?? "";
    // For private-seller listings under "PulaDrive Dealership", use the
    // listing-level custom fields rather than the dealership's global contact.
    const isPulaDriveListing = vehicle.dealer?.name === "PulaDrive Dealership" && !!(vehicle as any).customPhone;
    const effectivePhone = isPulaDriveListing ? (vehicle as any).customPhone : dealerPhone;
    const effectiveLocation = isPulaDriveListing
        ? ((vehicle as any).customLocation || vehicle.dealer?.location || "Gaborone")
        : (vehicle.dealer?.location || "Gaborone");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://puladrive.com";
    const listingUrl = typeof window !== "undefined"
        ? window.location.href
        : `${siteUrl}/listings/${params.id}`;
    const whatsappMessage = encodeURIComponent(
        `Hi ${vehicle.dealer?.name ?? "there"},\n\n` +
        `I'm interested in the *${vehicle.year} ${vehicle.make} ${vehicle.model}* listed on PulaDrive.\n\n` +
        `Price: *P ${vehicle.price.toLocaleString()}*\n` +
        `Location: *${effectiveLocation}*\n` +
        (vehicle.mileage ? `Mileage: *${vehicle.mileage.toLocaleString()} km*\n` : "") +
        `\nView Listing: ${listingUrl}\n\n` +
        `Could you please provide more information and arrange a viewing? Thank you!`
    );
    const whatsappUrl = effectivePhone ? `https://wa.me/${effectivePhone}?text=${whatsappMessage}` : null;

    const handleShare = async () => {
        const shareData = {
            title: `${vehicle.year} ${vehicle.make} ${vehicle.model} – P ${vehicle.price.toLocaleString()}`,
            text: `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} for P ${vehicle.price.toLocaleString()} on PulaDrive!`,
            url: listingUrl,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                capture("listing_shared", { vehicle_id: vehicle._id, method: "native_share" });
            } else {
                await navigator.clipboard.writeText(listingUrl);
                capture("listing_shared", { vehicle_id: vehicle._id, method: "clipboard" });
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 2500);
            }
        } catch {
            // user cancelled share — ignore
        }
    };

    const wishlisted = vehicle ? isWishlisted(vehicle._id) : false;

    const handleToggleWishlist = () => {
        if (vehicle) {
            toggle(vehicle._id);
            capture("listing_favorited", {
                vehicle_id: vehicle._id,
                action: wishlisted ? "remove" : "add",
            });
        }
    };

    const handleWhatsApp = () => {
        if (whatsappUrl) {
            capture("whatsapp_intent", {
                vehicle_id: vehicle._id,
                dealer_id: vehicle.dealerId,
                dealer_name: vehicle.dealer?.name,
            });
            window.open(whatsappUrl, "_blank");
        }
    };

    const contactPhone = isPulaDriveListing
        ? (vehicle as any).customPhone || ""
        : (vehicle.dealer?.contactPhone || vehicle.dealer?.phone || "");
    const handleCall = () => {
        if (contactPhone) {
            capture("book_visit_clicked", {
                vehicle_id: vehicle._id,
                dealer_id: vehicle.dealerId
            });
            window.location.href = `tel:${contactPhone}`;
        }
    };

    return (
        <main className="min-h-screen bg-white lg:bg-slate-50 pt-16 lg:pt-0">
            {/* Mobile Top Bar */}
            <div className="lg:hidden fixed top-0 inset-x-0 h-16 px-4 flex items-center justify-between z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
                <button
                    onClick={handleBack}
                    className="p-2 bg-white rounded-full shadow-sm text-slate-900 border border-slate-100"
                >
                    <ChevronLeft size={22} />
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={handleShare}
                        className="p-2 bg-white rounded-full shadow-sm border border-slate-100 transition-colors text-slate-600 hover:text-primary-600"
                        title="Share listing"
                    >
                        {shareSuccess ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
                    </button>
                    <button
                        onClick={handleToggleWishlist}
                        className={`p-2 rounded-full shadow-sm border transition-colors ${
                            wishlisted
                                ? "bg-rose-50 border-rose-200 text-rose-500"
                                : "bg-white border-slate-100 text-slate-400 hover:text-rose-500"
                        }`}
                        title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
                    >
                        <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto lg:mt-8 lg:px-8 pb-28 lg:pb-12">
                {/* Desktop Top Actions */}
                <div className="hidden lg:flex justify-between items-center mb-6">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <ChevronLeft size={16} /> Back
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 transition-colors text-slate-600 hover:text-primary-600 hover:border-primary-200 text-sm font-bold"
                        >
                            {shareSuccess ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
                            {shareSuccess ? "Copied!" : "Share"}
                        </button>
                        <button
                            onClick={handleToggleWishlist}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border transition-colors text-sm font-bold ${
                                wishlisted
                                    ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                                    : "bg-white border-slate-200 text-slate-600 hover:text-rose-500 hover:border-rose-200"
                            }`}
                        >
                            <Heart size={16} fill={wishlisted ? "currentColor" : "none"} />
                            {wishlisted ? "Saved" : "Save"}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 pb-24 lg:pb-0">
                    {/* Left Column: Gallery — sticky wrapper keeps entire image block pinned */}
                    <div className="lg:w-3/5 lg:sticky lg:top-8 lg:self-start">
                        <div
                            className="relative aspect-[4/3] lg:rounded-3xl lg:overflow-hidden lg:shadow-xl select-none"
                            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                            onTouchEnd={(e) => {
                                if (touchStartX === null) return;
                                const delta = touchStartX - e.changedTouches[0].clientX;
                                if (delta > 50) setActiveImage((p) => Math.min(p + 1, images.length - 1));
                                else if (delta < -50) setActiveImage((p) => Math.max(p - 1, 0));
                                setTouchStartX(null);
                            }}
                        >
                            {images.map((src, i) => {
                                // Only mount current, next, and previous images to optimize bandwidth for Botswana users
                                const shouldRender = i === activeImage || i === activeImage + 1 || i === activeImage - 1;
                                if (!shouldRender) return null;
                                return (
                                    <Image
                                        key={src}
                                        src={src}
                                        alt={`${vehicle.make} ${vehicle.model} – photo ${i + 1}`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 60vw"
                                        className={`object-cover transition-opacity duration-300 ${i === activeImage ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                                        priority={i === 0}
                                    />
                                );
                            })}

                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setActiveImage((p) => Math.max(p - 1, 0))}
                                        disabled={activeImage === 0}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 disabled:opacity-30 text-white p-2 rounded-full backdrop-blur-md transition-all"
                                        aria-label="Previous photo"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={() => setActiveImage((p) => Math.min(p + 1, images.length - 1))}
                                        disabled={activeImage === images.length - 1}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 disabled:opacity-30 text-white p-2 rounded-full backdrop-blur-md transition-all"
                                        aria-label="Next photo"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}

                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold ring-1 ring-white/20">
                                {activeImage + 1} / {images.length} Photos
                            </div>

                            {images.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {images.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveImage(i)}
                                            className={`h-1.5 rounded-full transition-all ${i === activeImage ? "bg-white w-4" : "bg-white/50 hover:bg-white/80 w-1.5"}`}
                                            aria-label={`Go to photo ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Thumbnail strip — lives inside the sticky wrapper so it pins with the main image */}
                        {images.length > 1 && (
                            <div className="hidden lg:flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
                                {images.map((src, i) => (
                                    <button
                                        key={src}
                                        onClick={() => setActiveImage(i)}
                                        className={`relative flex-none w-16 h-12 rounded-xl overflow-hidden ring-2 transition-all ${i === activeImage ? "ring-primary-500 shadow-md" : "ring-transparent opacity-60 hover:opacity-90"}`}
                                    >
                                        <Image src={src} alt={`Thumbnail ${i + 1}`} fill sizes="64px" className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details + CTAs */}
                    <div className="flex-1 px-4 lg:px-0 space-y-8 min-w-0">
                        <section className="space-y-4 pt-6 lg:pt-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {vehicle.year} Model
                                </span>
                                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-emerald-100">
                                    {vehicle.status}
                                </span>
                                {vehicle.negotiable && (
                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-amber-100">
                                        <HandshakeIcon size={11} /> Negotiable
                                    </span>
                                )}
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight break-words">
                                    {vehicle.make} <span className="text-primary-600">{vehicle.model}</span>
                                </h1>
                                <p className="text-sm font-medium text-slate-400 flex items-center gap-1 min-w-0">
                                    <MapPin size={14} className="shrink-0" /> <span className="truncate">Available at {vehicle.dealer?.name || "Broadway Motors"}, {effectiveLocation}</span>
                                </p>
                            </div>
                            <div className="pt-4 space-y-2">
                                <div className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter">
                                    P {vehicle.price.toLocaleString()}
                                    <span className="text-sm sm:text-base font-medium text-slate-400 ml-2 tracking-normal">VAT Incl.</span>
                                </div>
                                {vehicle.negotiable && (
                                    <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">
                                        <HandshakeIcon size={13} />
                                        <span className="text-xs font-black uppercase tracking-widest">Price Negotiable</span>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Quick Specs Grid */}
                        <section className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 hover:border-primary-200 transition-all">
                                <Calendar className="text-primary-600" size={20} />
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Year</p>
                                    <p className="text-sm font-bold text-slate-900">{vehicle.year}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 hover:border-primary-200 transition-all">
                                <Gauge className="text-primary-600" size={20} />
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Mileage</p>
                                    <p className="text-sm font-bold text-slate-900">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "N/A"}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 hover:border-primary-200 transition-all">
                                <Fuel className="text-primary-600" size={20} />
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Fuel</p>
                                    <p className="text-sm font-bold text-slate-900">{vehicle.fuelType || "Petrol"}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 hover:border-primary-200 transition-all">
                                <Zap className="text-primary-600" size={20} />
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Engine</p>
                                    <p className="text-sm font-bold text-slate-900">{vehicle.engineSize || "N/A"}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 hover:border-primary-200 transition-all">
                                <SlidersHorizontal className="text-primary-600" size={20} />
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Transmission</p>
                                    <p className="text-sm font-bold text-slate-900">{vehicle.transmission || "Automatic"}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 hover:border-primary-200 transition-all">
                                <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: vehicle.color || "#FFFFFF" }}></div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Color</p>
                                    <p className="text-sm font-bold text-slate-900">{vehicle.color || "Not Set"}</p>
                                </div>
                            </div>
                        </section>

                        {/* Description */}
                        <section className="space-y-4 border-t border-slate-100 pt-6">
                            <h2 className="text-xl font-black text-slate-900">Seller's Description</h2>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                {vehicle.description || "No description provided for this vehicle. Contact the dealer for more information about this premium listing."}
                            </p>
                        </section>

                        {/* AI Deal Finder Promo Banner */}
                        <section className="border-t border-slate-100 pt-6">
                            <Link
                                href="/search/advanced"
                                className="group block rounded-3xl p-5 text-white transition-all hover:scale-[1.01] active:scale-[0.99] bg-indigo-600 hover:bg-indigo-700"
                            >

                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2.5">
                                        {/* Live badge */}
                                        <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1">
                                            <span className="flex h-1.5 w-1.5 relative shrink-0">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-90">AI Deal Finder · Smart Search</span>
                                        </div>

                                        <div>
                                            <h3 className="text-base font-black leading-snug">
                                                Not sure this is the one?
                                            </h3>
                                            <p className="text-sm text-white/75 font-medium mt-0.5 leading-snug">
                                                Let our AI rank every listing by how well it matches <em>your</em> budget, lifestyle and preferences.
                                            </p>
                                        </div>

                                        {/* Trust signals */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/80">
                                                <SlidersHorizontal size={11} className="opacity-80" /> Personalised to you
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/80">
                                                <ShieldCheck size={11} className="opacity-80" /> Private &amp; secure
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/80">
                                                <Zap size={11} className="opacity-80" /> Instant results
                                            </span>
                                        </div>

                                        {/* CTA row */}
                                        <div className="flex items-center gap-1.5 text-sm font-black text-white group-hover:gap-2.5 transition-all">
                                            Find my perfect match
                                            <ChevronRight size={15} className="text-white/70 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>

                                    {/* Icon block */}
                                    <div className="shrink-0 w-14 h-14 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                        <Sparkles size={26} className="text-white" />
                                    </div>
                                </div>
                            </Link>
                        </section>

                        {/* CTA Buttons — inline at the bottom of the content */}
                        <section className="space-y-3 border-t border-slate-100 pt-6 pb-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={handleWhatsApp}
                                    disabled={!whatsappUrl}
                                    title={!whatsappUrl ? "This dealer hasn't added a WhatsApp number yet" : undefined}
                                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-emerald-100 text-sm w-full"
                                >
                                    <MessageCircle size={18} />
                                    WhatsApp Dealer
                                </button>
                                <button
                                    onClick={handleCall}
                                    disabled={!contactPhone}
                                    title={!contactPhone ? "This dealer hasn't registered a contact phone number yet" : undefined}
                                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-slate-200 text-sm w-full"
                                >
                                    <Phone size={18} />
                                    Book via Call
                                </button>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsReportOpen(true)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <Flag size={13} />
                                    Report fraudulent listing
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {isReportOpen && (
                <ReportModal
                    vehicleId={vehicle._id}
                    vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    dealerId={vehicle.dealerId}
                    onClose={() => setIsReportOpen(false)}
                />
            )}
        </main>
    );
}

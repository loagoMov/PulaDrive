"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Share2, Heart, MessageCircle, MapPin, Calendar, Gauge, Fuel, Zap, SlidersHorizontal, Flag, Check } from "lucide-react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useWishlist } from "@/hooks/useWishlist";
import { useTelemetry } from "@/hooks/useTelemetry";
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
    const { trackEvent } = useTelemetry();

    // Track vehicle view on load
    useEffect(() => {
        if (vehicle) {
            trackEvent("click_vehicle", vehicle._id, {
                make: vehicle.make,
                model: vehicle.model,
                price: vehicle.price,
            });
        }
    }, [vehicle, trackEvent]);

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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://puladrive.com";
    const listingUrl = typeof window !== "undefined"
        ? window.location.href
        : `${siteUrl}/listings/${params.id}`;
    const whatsappMessage = encodeURIComponent(
        `Hi ${vehicle.dealer?.name ?? "there"},\n\n` +
        `I'm interested in the *${vehicle.year} ${vehicle.make} ${vehicle.model}* listed on PulaDrive.\n\n` +
        `Price: *P ${vehicle.price.toLocaleString()}*\n` +
        `Dealer: *${vehicle.dealer?.name ?? "Your Dealership"}*${vehicle.dealer?.location ? `, ${vehicle.dealer.location}` : ""}\n` +
        (vehicle.mileage ? `Mileage: *${vehicle.mileage.toLocaleString()} km*\n` : "") +
        `\nView Listing: ${listingUrl}\n\n` +
        `Could you please provide more information and arrange a viewing? Thank you!`
    );
    const whatsappUrl = dealerPhone ? `https://wa.me/${dealerPhone}?text=${whatsappMessage}` : null;

    const handleShare = async () => {
        const shareData = {
            title: `${vehicle.year} ${vehicle.make} ${vehicle.model} – P ${vehicle.price.toLocaleString()}`,
            text: `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} for P ${vehicle.price.toLocaleString()} on PulaDrive!`,
            url: listingUrl,
        };
        trackEvent("click_share", vehicle._id);
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(listingUrl);
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
            trackEvent("click_favorite", vehicle._id, {
                wishlisted: !wishlisted,
            });
        }
    };

    return (
        <main className="min-h-screen bg-white lg:bg-slate-50 pt-16 lg:pt-0">
            {/* Mobile Top Bar */}
            <div className="lg:hidden fixed top-0 inset-x-0 h-16 px-4 flex items-center justify-between z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
                <button
                    onClick={() => router.back()}
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

            <div className="max-w-7xl mx-auto lg:mt-8 lg:px-8 pb-12">
                {/* Desktop Top Actions */}
                <div className="hidden lg:flex justify-between items-center mb-6">
                    <button
                        onClick={() => router.back()}
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

                <div className="flex flex-col lg:flex-row gap-8">
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
                            {images.map((src, i) => (
                                <Image
                                    key={src}
                                    src={src}
                                    alt={`${vehicle.make} ${vehicle.model} – photo ${i + 1}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 60vw"
                                    className={`object-cover transition-opacity duration-300 ${i === activeImage ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                                    priority={i === 0}
                                />
                            ))}

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
                    <div className="flex-1 px-4 lg:px-0 space-y-8">
                        <section className="space-y-4 pt-6 lg:pt-0">
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-primary-100">
                                    {vehicle.year} Model
                                </span>
                                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-emerald-100">
                                    {vehicle.status}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
                                    {vehicle.make} <span className="text-primary-600">{vehicle.model}</span>
                                </h1>
                                <p className="text-sm font-medium text-slate-400 flex items-center gap-1">
                                    <MapPin size={14} /> Available at {vehicle.dealer?.name || "Broadway Motors"}, {vehicle.dealer?.location || "Gaborone"}
                                </p>
                            </div>
                            <div className="text-5xl font-black text-slate-900 tracking-tighter pt-4">
                                P {vehicle.price.toLocaleString()}
                                <span className="text-base font-medium text-slate-400 ml-2 tracking-normal">VAT Incl.</span>
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

                        {/* CTA Buttons — inline at the bottom of the content */}
                        <section className="space-y-3 border-t border-slate-100 pt-6 pb-6">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => whatsappUrl && window.open(whatsappUrl, '_blank')}
                                    disabled={!whatsappUrl}
                                    title={!whatsappUrl ? "This dealer hasn't added a WhatsApp number yet" : undefined}
                                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-emerald-100 text-sm"
                                >
                                    <MessageCircle size={18} />
                                    WhatsApp Dealer
                                </button>
                                <button
                                    onClick={() => alert("Booking functionality coming soon! Please contact the dealer via WhatsApp to schedule a viewing.")}
                                    className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-slate-200 text-sm"
                                >
                                    Book a Visit
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

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Flame, Sparkles, AlertTriangle, Loader2, CheckCircle2, BadgeAlert, Hourglass, XCircle, Ban } from "lucide-react";
import Image from "next/image";

interface PromotionModalProps {
    vehicle: any;
    onClose: () => void;
}

export default function PromotionModal({ vehicle, onClose }: PromotionModalProps) {
    const applyFeatured  = useMutation(api.featured.apply);
    const cancelFeatured = useMutation(api.featured.cancelByDealer);
    const slots = useQuery(api.featured.getActiveSlots);
    const [selectedDays, setSelectedDays] = useState<7 | 14 | 30 | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [statusResult, setStatusResult] = useState<"pending" | "waitlisted" | "cancelled" | null>(null);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isCurrentlyFeatured = vehicle.featuredUntil && vehicle.featuredUntil > Date.now();
    const isWaitlistActive = slots ? slots.activeCount >= slots.totalSlots : false;
    const isSold = vehicle.status === "sold";

    const handleApply = async () => {
        if (!selectedDays) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await applyFeatured({
                vehicleId: vehicle._id,
                durationDays: selectedDays,
            });
            setStatusResult(res.status as "pending" | "waitlisted");
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err: any) {
            console.error(err);
            setError(err?.message ?? "Failed to submit promotion request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async () => {
        setIsCancelling(true);
        setError(null);
        try {
            await cancelFeatured({ vehicleId: vehicle._id });
            setStatusResult("cancelled");
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2500);
        } catch (err: any) {
            console.error(err);
            setError(err?.message ?? "Failed to cancel promotion.");
        } finally {
            setIsCancelling(false);
        }
    };

    if (success && statusResult) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
                    {statusResult === "cancelled" ? (
                        <>
                            <XCircle className="mx-auto text-rose-400" size={64} />
                            <h3 className="text-2xl font-black text-slate-900">Promotion Cancelled</h3>
                            <p className="text-slate-500 font-medium">Your featured promotion has been stopped. The listing has returned to organic results.</p>
                        </>
                    ) : statusResult === "waitlisted" ? (
                        <>
                            <Hourglass className="mx-auto text-amber-500 animate-bounce" size={64} />
                            <h3 className="text-2xl font-black text-slate-900">Added to Waitlist</h3>
                            <p className="text-slate-500 font-medium">All active slots are currently full. Your application has been waitlisted. Admin will review once a slot opens up.</p>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="mx-auto text-emerald-500 animate-pulse" size={64} />
                            <h3 className="text-2xl font-black text-slate-900">Application Submitted</h3>
                            <p className="text-slate-500 font-medium">Your request for featured status is pending admin approval and billing confirmation.</p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ── Guard: sold vehicle that is still actively featured → urge removal ──────
    if (isSold && isCurrentlyFeatured) {
        const diffMs   = vehicle.featuredUntil - Date.now();
        const daysLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const hoursLeft = Math.max(0, Math.floor((diffMs / (1000 * 60 * 60)) % 24));
        const timeLeft = daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`;

        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
                <div className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-rose-100 flex justify-between items-center bg-rose-50/60 rounded-t-[2rem] sm:rounded-t-[2.5rem]">
                        <div>
                            <h3 className="text-xl font-black text-rose-800 flex items-center gap-2">
                                <AlertTriangle className="text-rose-500" size={20} /> Vehicle Marked as Sold
                            </h3>
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1">Active promotion detected</p>
                        </div>
                        <button onClick={onClose} className="touch-target p-2 hover:bg-rose-100 rounded-full transition-colors">
                            <X size={20} className="text-rose-400" />
                        </button>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Vehicle preview */}
                        <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                                {vehicle.imageUrls?.[0] && (
                                    <Image src={vehicle.imageUrls[0]} alt={vehicle.make} fill sizes="56px" className="object-cover" />
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm leading-tight">{vehicle.make} {vehicle.model}</h4>
                                <p className="text-xs text-slate-400 font-medium pt-0.5">{vehicle.year} • P {vehicle.price.toLocaleString()}</p>
                                <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                                    Sold · Still promoted for {timeLeft}
                                </span>
                            </div>
                        </div>

                        {/* Warning body */}
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5">
                            <p className="text-sm font-black text-amber-800 flex items-center gap-2">
                                <Flame className="text-amber-500 fill-amber-400 shrink-0" size={16} /> Promotion still running on a sold vehicle
                            </p>
                            <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                This vehicle is using a featured slot even though it&apos;s sold. Buyers clicking through will see it&apos;s unavailable. We recommend removing the promotion to free the slot for an active listing.
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2 border-t border-slate-100">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm transition-all"
                            >
                                Keep for Now
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {isCancelling ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                                Remove Promotion
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Guard: hard block — sold vehicle, not featured ──────────────────────────
    if (isSold) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
                <div className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300 p-8 text-center space-y-5">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <Ban size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Can&apos;t Promote a Sold Vehicle</h3>
                        <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                            Promotions are only available for <span className="font-bold text-slate-700">Available</span> or <span className="font-bold text-slate-700">Reserved</span> listings. Mark this vehicle as available first if it&apos;s back in stock.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm transition-all"
                    >
                        Got it
                    </button>
                </div>
            </div>
        );
    }

    // ── Cancel-promotion view (vehicle is currently live and featured) ──────────
    if (isCurrentlyFeatured) {
        const diffMs   = vehicle.featuredUntil - Date.now();
        const daysLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const hoursLeft = Math.max(0, Math.floor((diffMs / (1000 * 60 * 60)) % 24));
        const timeLeft = daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`;

        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
                <div className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Flame className="text-amber-500 fill-amber-400 animate-pulse" size={20} /> Live Promotion
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage Featured Listing</p>
                        </div>
                        <button onClick={onClose} className="touch-target p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Vehicle preview */}
                        <div className="flex gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                                {vehicle.imageUrls?.[0] && (
                                    <Image src={vehicle.imageUrls[0]} alt={vehicle.make} fill sizes="64px" className="object-cover" />
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm leading-tight">{vehicle.make} {vehicle.model}</h4>
                                <p className="text-xs text-slate-400 font-medium pt-0.5">{vehicle.year} • P {vehicle.price.toLocaleString()}</p>
                                <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200">
                                    <Flame size={10} className="fill-indigo-500" /> Promoted — {timeLeft} remaining
                                </span>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                            <div className="text-xs text-rose-800 font-semibold leading-relaxed">
                                <p className="font-black mb-1">Stopping early does not issue a refund.</p>
                                <p>Cancelling will immediately remove this vehicle from the featured section and return it to standard organic results. The invoice for this promotion remains due.</p>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2 border-t border-slate-100">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm transition-all"
                            >
                                Keep Promotion
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCancelling ? (
                                    <><Loader2 className="animate-spin" size={16} /> Cancelling...</>
                                ) : (
                                    <><XCircle size={16} /> Cancel Promotion</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Apply-for-promotion view (vehicle is NOT currently featured) ─────────────
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Sparkles className="text-primary-500 fill-primary-100" size={20} /> Apply for Promotion
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Submit Premium Listing Request</p>
                    </div>
                    <button onClick={onClose} className="touch-target p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Slots counter status */}
                    {slots && (
                        <div className={`p-4 rounded-2xl flex items-start gap-3 border text-xs font-semibold leading-relaxed ${
                            isWaitlistActive 
                                ? "bg-amber-50 border-amber-200 text-amber-800" 
                                : "bg-emerald-50 border-emerald-200 text-emerald-800"
                        }`}>
                            {isWaitlistActive ? (
                                <>
                                    <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                                    <div>
                                        <span className="font-bold">Waitlist Active:</span> All {slots.totalSlots} promotion slots are full. Applications will be queueing in a waitlist.
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="text-emerald-600 shrink-0" size={18} />
                                    <div>
                                        <span className="font-bold">Slots Available:</span> {slots.remaining} of {slots.totalSlots} active premium featured listings remaining.
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Vehicle Preview Card */}
                    <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                            {vehicle.imageUrls?.[0] && (
                                <Image src={vehicle.imageUrls[0]} alt={vehicle.make} fill sizes="64px" className="object-cover" />
                            )}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm leading-tight">{vehicle.make} {vehicle.model}</h4>
                            <p className="text-xs text-slate-400 font-medium pt-0.5">{vehicle.year} • P {vehicle.price.toLocaleString()}</p>
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                Standard Organic Listing
                            </span>
                        </div>
                    </div>

                    {/* Promotion Packages */}
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Choose Feature Package</label>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {/* 7 Days Package */}
                            <button
                                onClick={() => setSelectedDays(7)}
                                className={`flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all ${
                                    selectedDays === 7
                                        ? "border-primary-500 bg-primary-50/30 text-primary-900"
                                        : "border-slate-100 hover:border-slate-200 bg-white"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                        <Flame size={20} className={selectedDays === 7 ? "fill-amber-500" : ""} />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-slate-900">7 Days Feature</p>
                                        <p className="text-xs text-slate-400 font-medium">Highlight listing for 1 week</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-black text-slate-900">P 200</span>
                                </div>
                            </button>

                            {/* 14 Days Package */}
                            <button
                                onClick={() => setSelectedDays(14)}
                                className={`flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all ${
                                    selectedDays === 14
                                        ? "border-primary-500 bg-primary-50/30 text-primary-900"
                                        : "border-slate-100 hover:border-slate-200 bg-white"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                        <Sparkles size={20} className={selectedDays === 14 ? "fill-blue-500" : ""} />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-slate-900">14 Days Feature</p>
                                        <p className="text-xs text-slate-400 font-medium">Highlight listing for 2 weeks</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-black text-slate-900">P 450</span>
                                </div>
                            </button>

                            {/* 30 Days Package */}
                            <button
                                onClick={() => setSelectedDays(30)}
                                className={`flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all ${
                                    selectedDays === 30
                                        ? "border-primary-500 bg-primary-50/30 text-primary-900"
                                        : "border-slate-100 hover:border-slate-200 bg-white"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Sparkles size={20} className={selectedDays === 30 ? "fill-indigo-500" : ""} />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-slate-900">30 Days Feature</p>
                                        <p className="text-xs text-slate-400 font-medium">Maximum exposure for a full month</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-black text-slate-900">P 600</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={isSubmitting || selectedDays === null}
                            className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Submitting...
                                </>
                            ) : (
                                isWaitlistActive ? "Join Waitlist" : "Submit Request"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

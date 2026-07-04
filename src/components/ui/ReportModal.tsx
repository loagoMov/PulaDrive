"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    AlertTriangle, X, Flag, ChevronRight, Check,
    ShieldAlert, DollarSign, Camera, MessageSquareWarning,
    Car, UserX, Loader2
} from "lucide-react";

// ─── Predefined report reasons ────────────────────────────────────────────────
const REASONS = [
    {
        id: "fraudulent_listing",
        icon: ShieldAlert,
        label: "Fraudulent Listing",
        description: "Vehicle doesn't exist or details are fabricated",
        color: "text-rose-600 bg-rose-50 border-rose-200",
        activeColor: "bg-rose-600 text-white border-rose-600",
    },
    {
        id: "price_scam",
        icon: DollarSign,
        label: "Price Scam / Bait & Switch",
        description: "Advertised price differs from actual asking price",
        color: "text-amber-600 bg-amber-50 border-amber-200",
        activeColor: "bg-amber-500 text-white border-amber-500",
    },
    {
        id: "fake_photos",
        icon: Camera,
        label: "Fake or Stolen Photos",
        description: "Images are stock photos or taken from another listing",
        color: "text-violet-600 bg-violet-50 border-violet-200",
        activeColor: "bg-violet-600 text-white border-violet-600",
    },
    {
        id: "wrong_condition",
        icon: Car,
        label: "Misrepresented Condition",
        description: "Vehicle condition is significantly worse than described",
        color: "text-orange-600 bg-orange-50 border-orange-200",
        activeColor: "bg-orange-500 text-white border-orange-500",
    },
    {
        id: "already_sold",
        icon: UserX,
        label: "Already Sold / Ghost Listing",
        description: "This vehicle has already been sold but listing is still active",
        color: "text-slate-600 bg-slate-50 border-slate-200",
        activeColor: "bg-slate-700 text-white border-slate-700",
    },
    {
        id: "suspicious_dealer",
        icon: MessageSquareWarning,
        label: "Suspicious Dealer Behaviour",
        description: "Dealer is requesting unusual payment methods or personal info",
        color: "text-red-600 bg-red-50 border-red-200",
        activeColor: "bg-red-600 text-white border-red-600",
    },
    {
        id: "other",
        icon: Flag,
        label: "Other",
        description: "Something else is wrong with this listing",
        color: "text-slate-500 bg-slate-50 border-slate-200",
        activeColor: "bg-slate-600 text-white border-slate-600",
    },
];

interface ReportModalProps {
    vehicleId: string;
    dealerId: string;
    vehicleName: string;
    onClose: () => void;
}

export default function ReportModal({ vehicleId, dealerId, vehicleName, onClose }: ReportModalProps) {
    const [submitted, setSubmitted] = useState(false);
    const [selectedReason, setSelectedReason] = useState<string>("");
    const [customMessage, setCustomMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitReport = useMutation(api.reports.submit);

    async function handleSubmit() {
        if (!selectedReason) return;
        if (selectedReason === "other" && !customMessage.trim()) return;
        setIsSubmitting(true);
        try {
            await submitReport({
                vehicleId:     vehicleId as any,
                dealerId:      dealerId as any,
                reason:        selectedReason,
                customMessage: customMessage.trim() || undefined,
            });
            setSubmitted(true);
        } catch (err) {
            console.error("Report failed", err);
        } finally {
            setIsSubmitting(false);
        }
    }

    const isSubmitDisabled = !selectedReason || isSubmitting || (selectedReason === "other" && !customMessage.trim());

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[100]">
                <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[85vh] w-full max-w-lg flex flex-col relative">

                    {/* Header */}
                    <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-900 text-lg leading-tight">Report Listing</h2>
                                <p className="text-xs text-slate-500 font-medium">{vehicleName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="overflow-y-auto flex-1 px-6 py-5">

                        {!submitted ? (
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-slate-600 mb-4">
                                    What's wrong with this listing? Select the best description:
                                </p>
                                <div className="space-y-3">
                                    {REASONS.map((reason) => {
                                        const Icon = reason.icon;
                                        const isSelected = selectedReason === reason.id;
                                        return (
                                            <button
                                                key={reason.id}
                                                onClick={() => setSelectedReason(reason.id)}
                                                className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                                                    isSelected ? reason.activeColor : `${reason.color} hover:opacity-80`
                                                }`}
                                            >
                                                <Icon size={20} className="shrink-0 mt-0.5" />
                                                <div>
                                                    <p className={`font-black text-sm ${isSelected ? "text-white" : ""}`}>
                                                        {reason.label}
                                                    </p>
                                                    <p className={`text-xs font-medium mt-0.5 ${isSelected ? "text-white/70" : "opacity-60"}`}>
                                                        {reason.description}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <Check size={16} className="ml-auto shrink-0 mt-0.5" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Conditionally render Custom Text for Other reason */}
                                {selectedReason === "other" && (
                                    <div className="space-y-2 pt-2 animate-fadeIn">
                                        <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400">
                                            Please Specify Reason <span className="text-rose-500">*</span>
                                        </label>
                                        <textarea
                                            rows={4}
                                            maxLength={1000}
                                            placeholder="Please describe the issue with this listing in detail..."
                                            className="w-full border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all resize-none text-slate-700 placeholder:text-slate-300"
                                            value={customMessage}
                                            onChange={(e) => setCustomMessage(e.target.value)}
                                        />
                                        <p className="text-[10px] text-slate-400 font-medium text-right">
                                            {customMessage.length}/1000
                                        </p>
                                    </div>
                                )}

                                <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 font-medium leading-relaxed mt-2">
                                    <strong className="text-slate-700">Your privacy:</strong> Reports are reviewed privately by PulaDrive administrators.
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center space-y-4">
                                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto text-emerald-600">
                                    <Check size={40} strokeWidth={3} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900">Report Submitted</h3>
                                    <p className="text-slate-500 font-medium text-sm max-w-xs mx-auto">
                                        Thank you. Our team will review this listing within 24–48 hours and take appropriate action.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <p className="text-xs text-slate-400 font-medium">
                                        Reference: <span className="font-black text-slate-600">{vehicleName}</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-5 border-t border-slate-100 shrink-0">
                        {!submitted ? (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitDisabled}
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={isSubmitDisabled ? { background: "#cbd5e1" } : { background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
                            >
                                {isSubmitting ? (
                                    <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                                ) : (
                                    <><Flag size={16} /> Submit Report</>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition-all"
                            >
                                Done
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import NotificationCenter from "../../components/NotificationCenter";
import {
    ChevronLeft, CreditCard, AlertTriangle, CheckCircle2,
    Clock, FileText, TrendingUp, Wallet, CalendarDays, ExternalLink, Loader2,
    Layers, Zap, ArrowUpCircle, Star, Infinity as InfinityIcon, X, ChevronRight
} from "lucide-react";
import DealershipSelector from "@/components/dashboard/DealershipSelector";
import { useState } from "react";

function StatusBadge({ status }: { status: "pending" | "paid" | "overdue" }) {
    const styles = {
        paid:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
        pending: "bg-amber-50  text-amber-700  border border-amber-200",
        overdue: "bg-red-50    text-red-700    border border-red-200",
    };
    const icons = {
        paid:    <CheckCircle2 size={11} />,
        pending: <Clock size={11} />,
        overdue: <AlertTriangle size={11} />,
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${styles[status]}`}>
            {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

function formatPula(cents: number) {
    return `P ${(cents / 100).toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function daysLabel(dueDate: string) {
    const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000);
    if (diff < 0)  return { text: `${Math.abs(diff)}d overdue`, color: "text-red-600" };
    if (diff === 0) return { text: "Due today",                color: "text-red-500" };
    if (diff <= 7)  return { text: `Due in ${diff}d`,          color: "text-amber-600" };
    return { text: `Due in ${diff}d`,                          color: "text-slate-500" };
}

const TIER_META = {
    starter:   { label: "Starter",   color: "text-slate-700",  bg: "bg-slate-100",  border: "border-slate-200", price: "P 1,500", slots: 50 },
    growth:    { label: "Growth",    color: "text-indigo-700", bg: "bg-indigo-50",  border: "border-indigo-200", price: "P 2,500", slots: 150 },
    unlimited: { label: "Unlimited", color: "text-emerald-700",bg: "bg-emerald-50", border: "border-emerald-200", price: "P 3,500", slots: Infinity },
} as const;

type TierKey = keyof typeof TIER_META;

// ── Upgrade / Extra Slot Request Modal ───────────────────────────────────────
function UpgradeModal({
    dealerId,
    currentTier,
    onClose,
}: {
    dealerId: string;
    currentTier: TierKey;
    onClose: () => void;
}) {
    const [tab, setTab] = useState<"upgrade" | "extra">("upgrade");
    const [selectedTier, setSelectedTier] = useState<"growth" | "unlimited">("growth");
    const [extraSlots, setExtraSlots] = useState(10);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const requestUpgrade = useMutation(api.subscriptions.requestUpgrade);
    const extraCost = extraSlots * 200; // P200 per slot (display amount in Pula)

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await requestUpgrade({
                dealerId: dealerId as any,
                requestType: tab === "upgrade" ? "upgrade_tier" : "extra_slots",
                requestedTier: tab === "upgrade" ? selectedTier : undefined,
                extraSlotsRequested: tab === "extra" ? extraSlots : undefined,
                message: message || undefined,
            });
            setDone(true);
        } catch (err: any) {
            alert(err?.message || "Failed to submit request.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
                            <ArrowUpCircle size={18} className="text-primary-600" />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 text-sm leading-none">Subscription Request</p>
                            <p className="text-xs text-slate-400 mt-0.5">Request an upgrade or extra listing slots</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <X size={16} className="text-slate-500" />
                    </button>
                </div>

                {done ? (
                    <div className="px-6 py-12 flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                            <CheckCircle2 size={32} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className="font-black text-slate-900">Request Submitted!</p>
                            <p className="text-sm text-slate-500 mt-1">We'll review your request and get back to you shortly.</p>
                        </div>
                        <button onClick={onClose} className="btn-primary px-6 py-2.5 text-sm font-bold rounded-xl">Done</button>
                    </div>
                ) : (
                    <div className="p-6 space-y-5">
                        {/* Tabs */}
                        <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
                            {(["upgrade", "extra"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                                        tab === t ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    {t === "upgrade" ? "🚀 Upgrade Tier" : "➕ Extra Slots"}
                                </button>
                            ))}
                        </div>

                        {tab === "upgrade" ? (
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select target tier</p>
                                {(["growth", "unlimited"] as const).filter(t => t !== currentTier && currentTier !== "unlimited").map((tier) => {
                                    const meta = TIER_META[tier];
                                    const isSelected = selectedTier === tier;
                                    return (
                                        <button
                                            key={tier}
                                            onClick={() => setSelectedTier(tier)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                                isSelected ? "border-primary-500 bg-primary-50" : "border-slate-100 hover:border-slate-200 bg-white"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${meta.bg}`}>
                                                    {tier === "unlimited" ? <InfinityIcon size={15} className={meta.color} /> : <Star size={15} className={meta.color} />}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-black text-slate-900 text-sm">{meta.label}</p>
                                                    <p className="text-xs text-slate-400">{tier === "unlimited" ? "Unlimited" : `${meta.slots} slots`} · {meta.price}/mo</p>
                                                </div>
                                            </div>
                                            {isSelected && <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"><CheckCircle2 size={12} className="text-white fill-white" /></div>}
                                        </button>
                                    );
                                })}
                                {currentTier === "unlimited" && (
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                                        <p className="text-sm font-black text-emerald-700">You&apos;re already on the Unlimited plan! 🎉</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Number of extra slots</label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setExtraSlots(Math.max(1, extraSlots - 1))}
                                            className="w-10 h-10 rounded-xl border border-slate-200 font-black text-slate-600 hover:bg-slate-50 transition-colors"
                                        >−</button>
                                        <input
                                            type="number"
                                            min={1}
                                            max={500}
                                            value={extraSlots}
                                            onChange={(e) => setExtraSlots(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                                            className="flex-1 text-center font-black text-slate-900 text-xl border border-slate-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        <button
                                            onClick={() => setExtraSlots(Math.min(500, extraSlots + 1))}
                                            className="w-10 h-10 rounded-xl border border-slate-200 font-black text-slate-600 hover:bg-slate-50 transition-colors"
                                        >+</button>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                                    <p className="text-xs font-bold text-slate-500">Cost (P 200 per slot)</p>
                                    <p className="text-lg font-black text-slate-900">P {extraCost.toLocaleString()}</p>
                                </div>
                                <p className="text-[11px] text-slate-400">An invoice will be issued once the request is approved.</p>
                            </div>
                        )}

                        {/* Optional message */}
                        <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Note to admin (optional)</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Any details about your request..."
                                rows={2}
                                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-slate-300"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting || (tab === "upgrade" && currentTier === "unlimited")}
                            className="w-full btn-primary py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpCircle size={16} />}
                            {submitting ? "Submitting…" : "Submit Request"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DealerBillingPage() {
    const router = useRouter();
    const { organization } = useOrganization();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const dealership = useQuery(
        api.dealerships.getByClerkOrgId,
        organization ? { clerkOrgId: organization.id } : "skip"
    );

    const billing = useQuery(
        api.billing.getDealerBillingSummary,
        dealership ? { dealerId: dealership._id } : "skip"
    );

    const slotStatus = useQuery(
        api.subscriptions.getSubscriptionStatus,
        dealership ? { dealerId: dealership._id } : "skip"
    );

    const upgradeRequests = useQuery(
        api.subscriptions.getDealerUpgradeRequests,
        dealership ? { dealerId: dealership._id } : "skip"
    );

    const isLoading = dealership === undefined || dealership === null || billing === undefined;

    if (!organization) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500">No dealership organisation found.</p>
            </div>
        );
    }

    if (isLoading || !dealership) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
        );
    }

    const { pending, overdue, paid, totalOwed, totalPaid, upcoming, invoices } = billing;
    const accountStatus = dealership.accountStatus ?? "active";
    const isFrozen = accountStatus === "frozen";

    const tier: TierKey = ((dealership as any).subscriptionTier ?? "starter") as TierKey;
    const tierMeta = TIER_META[tier];
    const pendingRequests = (upgradeRequests ?? []).filter((r: any) => r.status === "pending");

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <header className="bg-white border-b border-slate-200 px-4 py-4 lg:px-8 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="touch-target no-tap-highlight flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            <ChevronLeft size={18} />
                            <span className="hidden xs:inline">Back</span>
                        </button>
                        <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
                            <div>
                                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">Billing &amp; Payments</h1>
                                <div className="mt-0.5">
                                    <DealershipSelector />
                                </div>
                            </div>
                        </div>
                    </div>
                    <NotificationCenter recipientId={dealership._id} />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-28">

                {/* ── Frozen Account Banner ──────────────────────────────────── */}
                {isFrozen && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5">
                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-black text-red-800 text-sm">Account Suspended</p>
                            <p className="text-red-600 text-sm mt-0.5">
                                Your account has been frozen due to outstanding payments. Please settle your balance to restore full access.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Subscription & Listing Slots Card ─────────────────────── */}
                {slotStatus && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Card header */}
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers size={16} className="text-slate-400" />
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Subscription & Listing Slots</p>
                            </div>
                            {pendingRequests.length > 0 && (
                                <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                    {pendingRequests.length} pending request{pendingRequests.length > 1 ? "s" : ""}
                                </span>
                            )}
                        </div>

                        <div className="p-5 sm:p-6 space-y-5">
                            {/* Tier + Price */}
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tierMeta.bg} border ${tierMeta.border}`}>
                                    {tier === "unlimited"
                                        ? <InfinityIcon size={22} className={tierMeta.color} />
                                        : tier === "growth"
                                        ? <Zap size={22} className={tierMeta.color} />
                                        : <Star size={22} className={tierMeta.color} />
                                    }
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-black text-slate-900 text-lg leading-none">{tierMeta.label} Plan</p>
                                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${tierMeta.bg} ${tierMeta.color} border ${tierMeta.border}`}>
                                            {tier === "unlimited" ? "Unlimited slots" : `${TIER_META[tier].slots} slots`}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">{tierMeta.price} / month</p>
                                </div>
                                <button
                                    onClick={() => setShowUpgradeModal(true)}
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-black rounded-xl transition-colors"
                                >
                                    <ArrowUpCircle size={13} />
                                    {tier === "unlimited" ? "Extra Slots" : "Upgrade"}
                                </button>
                            </div>

                            {/* Slot progress */}
                            {slotStatus.slotLimit !== Infinity ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-500">Listing slots used</p>
                                        <p className={`text-xs font-black ${slotStatus.isAtLimit ? "text-red-600" : "text-slate-700"}`}>
                                            {slotStatus.usedSlots} / {slotStatus.slotLimit}
                                            {(slotStatus.slotLimit as number) > (TIER_META[tier].slots) && (
                                                <span className="text-slate-400 font-bold ml-1">
                                                    (incl. {(slotStatus.slotLimit as number) - TIER_META[tier].slots} extra)
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                slotStatus.isAtLimit
                                                    ? "bg-red-500"
                                                    : (slotStatus.usedSlots / (slotStatus.slotLimit as number)) > 0.8
                                                    ? "bg-amber-400"
                                                    : "bg-emerald-500"
                                            }`}
                                            style={{ width: `${Math.min(100, (slotStatus.usedSlots / (slotStatus.slotLimit as number)) * 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        {slotStatus.isAtLimit
                                            ? "⚠️ You've reached your slot limit. Upgrade or request extra slots to continue listing."
                                            : `${slotStatus.remainingSlots} slot${(slotStatus.remainingSlots as number) === 1 ? "" : "s"} remaining`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-100">
                                    <CheckCircle2 size={15} className="text-emerald-500" />
                                    <p className="text-xs font-bold text-emerald-700">Unlimited listing slots — list as many vehicles as you want!</p>
                                </div>
                            )}

                            {/* Tier comparison hint */}
                            {tier !== "unlimited" && (
                                <div className="grid grid-cols-3 gap-2">
                                    {(["starter", "growth", "unlimited"] as const).map((t) => {
                                        const m = TIER_META[t];
                                        const isCurrent = t === tier;
                                        return (
                                            <div key={t} className={`p-3 rounded-xl border text-center transition-all ${isCurrent ? `${m.bg} ${m.border}` : "bg-slate-50 border-slate-100"}`}>
                                                <p className={`text-[10px] font-black uppercase tracking-wider ${isCurrent ? m.color : "text-slate-400"}`}>{m.label}</p>
                                                <p className={`text-xs font-black mt-0.5 ${isCurrent ? "text-slate-900" : "text-slate-500"}`}>
                                                    {t === "unlimited" ? "∞" : `${m.slots}`}
                                                </p>
                                                <p className={`text-[10px] mt-0.5 ${isCurrent ? "text-slate-500" : "text-slate-400"}`}>{m.price}/mo</p>
                                                {isCurrent && <p className={`text-[9px] font-black mt-1 ${m.color}`}>CURRENT</p>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Recent requests */}
                        {upgradeRequests && upgradeRequests.length > 0 && (
                            <div className="border-t border-slate-100 px-5 py-4 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Recent Requests</p>
                                {upgradeRequests.slice(0, 3).map((req: any) => (
                                    <div key={req._id} className="flex items-center justify-between py-1.5">
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">
                                                {req.requestType === "upgrade_tier"
                                                    ? `Upgrade to ${req.requestedTier?.charAt(0).toUpperCase()}${req.requestedTier?.slice(1)}`
                                                    : `${req.extraSlotsRequested} extra slots`
                                                }
                                            </p>
                                            <p className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleDateString("en-BW")}</p>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                            req.status === "pending" ? "bg-amber-100 text-amber-700"
                                            : req.status === "approved" ? "bg-emerald-100 text-emerald-700"
                                            : "bg-slate-100 text-slate-500"
                                        }`}>
                                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── KPI Cards ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        {
                            icon: <Wallet className="text-amber-600" size={18} />, bg: "bg-amber-50",
                            label: "Balance Due",
                            value: <span className={`text-xl sm:text-2xl font-black pt-0.5 ${totalOwed > 0 ? "text-red-600" : "text-slate-900"}`}>{formatPula(totalOwed)}</span>,
                        },
                        {
                            icon: <TrendingUp className="text-emerald-600" size={18} />, bg: "bg-emerald-50",
                            label: "Total Paid",
                            value: <span className="text-xl sm:text-2xl font-black text-slate-900 pt-0.5">{formatPula(totalPaid)}</span>,
                        },
                        {
                            icon: <AlertTriangle className="text-red-500" size={18} />, bg: "bg-red-50",
                            label: "Overdue",
                            value: <span className={`text-xl sm:text-2xl font-black pt-0.5 ${overdue.length > 0 ? "text-red-600" : "text-slate-900"}`}>{overdue.length}</span>,
                        },
                        {
                            icon: <FileText className="text-blue-600" size={18} />, bg: "bg-blue-50",
                            label: "Pending",
                            value: <span className="text-xl sm:text-2xl font-black text-slate-900 pt-0.5">{pending.length}</span>,
                        },
                    ].map(({ icon, bg, label, value }) => (
                        <div key={label} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3">
                            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>{icon}</div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                                {value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Subscription / Account Status Card ────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isFrozen ? "bg-red-50" : "bg-primary-50"}`}>
                            <CreditCard className={isFrozen ? "text-red-500" : "text-primary-600"} size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${isFrozen ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
                                <p className={`text-lg font-black ${isFrozen ? "text-red-700" : "text-slate-900"}`}>
                                    {isFrozen ? "Frozen" : "Active"}
                                </p>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Client ID: <span className="font-bold text-slate-600">{dealership.clientCustomId ?? "—"}</span>
                            </p>
                        </div>
                    </div>

                    {upcoming && (
                        <div className="w-full sm:w-auto bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 text-left sm:text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 sm:justify-end">
                                <CalendarDays size={10} /> Next Payment
                            </p>
                            <p className="text-lg font-black text-slate-900 mt-0.5">{formatPula(upcoming.amount)}</p>
                            <p className={`text-xs font-bold mt-0.5 ${daysLabel(upcoming.dueDate).color}`}>
                                {daysLabel(upcoming.dueDate).text}
                            </p>
                            <p className="text-[10px] text-slate-400">{upcoming.invoiceNumber}</p>
                        </div>
                    )}
                </div>

                {/* ── Outstanding Invoices ───────────────────────────────────── */}
                {[...overdue, ...pending].length > 0 && (
                    <section>
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Outstanding Invoices</h2>
                        <div className="space-y-3">
                            {[...overdue, ...pending].map(inv => {
                                const dl = daysLabel(inv.dueDate);
                                return (
                                    <div
                                        key={inv._id}
                                        className={`bg-white rounded-2xl border shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                            inv.status === "overdue" ? "border-red-200" : "border-slate-100"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                inv.status === "overdue" ? "bg-red-50" : "bg-amber-50"
                                            }`}>
                                                <FileText size={16} className={inv.status === "overdue" ? "text-red-500" : "text-amber-600"} />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm">{inv.invoiceNumber}</p>
                                                <p className={`text-xs font-bold mt-0.5 ${dl.color}`}>{dl.text}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pl-12 sm:pl-0">
                                            <StatusBadge status={inv.status} />
                                            <span className="text-base sm:text-lg font-black text-slate-900">{formatPula(inv.amount)}</span>
                                            <a
                                                href={`/invoice?dealer=${encodeURIComponent(dealership?.name ?? "")}&tin=${encodeURIComponent(dealership?.bursTin ?? "000000000")}&inv=${encodeURIComponent(inv.invoiceNumber)}&vat=0&amount=${(inv.amount / 100).toFixed(2)}&due=${encodeURIComponent(inv.dueDate)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="touch-target no-tap-highlight flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline"
                                            >
                                                View <ExternalLink size={11} />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Payment History ────────────────────────────────────────── */}
                <section>
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Payment History</h2>

                    {invoices.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 sm:p-12 flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                <FileText className="text-slate-300" size={28} />
                            </div>
                            <div>
                                <p className="font-black text-slate-900">No invoices yet</p>
                                <p className="text-sm text-slate-400 mt-1">Your billing history will appear here once invoices are generated.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table (md+) */}
                            <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice</th>
                                            <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                                            <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                            <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                            <th className="px-5 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {[...invoices].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).map(inv => (
                                            <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-4 font-bold text-slate-800">{inv.invoiceNumber}</td>
                                                <td className="px-5 py-4 text-slate-500">{new Date(inv.dueDate).toLocaleDateString("en-BW", { day: "numeric", month: "short", year: "numeric" })}</td>
                                                <td className="px-5 py-4 font-black text-slate-900">{formatPula(inv.amount)}</td>
                                                <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                                                <td className="px-5 py-4 text-right">
                                                    <a
                                                        href={`/invoice?dealer=${encodeURIComponent(dealership?.name ?? "")}&tin=${encodeURIComponent(dealership?.bursTin ?? "000000000")}&inv=${encodeURIComponent(inv.invoiceNumber)}&vat=0&amount=${(inv.amount / 100).toFixed(2)}&due=${encodeURIComponent(inv.dueDate)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline"
                                                    >
                                                        Download <ExternalLink size={10} />
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List (< md) */}
                            <div className="flex md:hidden flex-col gap-2">
                                {[...invoices].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).map(inv => (
                                    <div
                                        key={inv._id}
                                        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3"
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                            inv.status === "paid" ? "bg-emerald-50" : inv.status === "overdue" ? "bg-red-50" : "bg-amber-50"
                                        }`}>
                                            <FileText size={15} className={
                                                inv.status === "paid" ? "text-emerald-600" : inv.status === "overdue" ? "text-red-500" : "text-amber-600"
                                            } />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-900 text-sm truncate">{inv.invoiceNumber}</p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(inv.dueDate).toLocaleDateString("en-BW", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                            <span className="font-black text-slate-900 text-sm">{formatPula(inv.amount)}</span>
                                            <StatusBadge status={inv.status} />
                                        </div>
                                        <a
                                            href={`/invoice?dealer=${encodeURIComponent(dealership?.name ?? "")}&tin=${encodeURIComponent(dealership?.bursTin ?? "000000000")}&inv=${encodeURIComponent(inv.invoiceNumber)}&vat=0&amount=${(inv.amount / 100).toFixed(2)}&due=${encodeURIComponent(inv.dueDate)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="touch-target no-tap-highlight text-primary-600 flex-shrink-0"
                                        >
                                            <ExternalLink size={15} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </main>

            {/* ── Upgrade Modal ──────────────────────────────────────────────── */}
            {showUpgradeModal && dealership && (
                <UpgradeModal
                    dealerId={dealership._id}
                    currentTier={tier}
                    onClose={() => setShowUpgradeModal(false)}
                />
            )}
        </div>
    );
}

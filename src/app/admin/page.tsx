"use client";

import { useQuery, useMutation } from "convex/react";
import Image from "next/image";
import { api } from "../../../convex/_generated/api";
import { useUser, UserButton } from "@clerk/nextjs";
import {
    Shield, Users, Building2, Star, Plus, Trash2, Check, Loader2,
    AlertTriangle, Flag, Eye, XCircle, ChevronDown, ChevronUp, MessageSquare, Sparkles, Car, CreditCard,
    Layers, Zap, Infinity as InfinityIcon, CheckCircle2, X
} from "lucide-react";
import { useState, Fragment, useEffect } from "react";
import Link from "next/link";
import MobileNav from "@/components/navigation/MobileNav";
import NotificationCenter from "../components/NotificationCenter";

const REASON_LABELS: Record<string, string> = {
    fraudulent_listing:   "🚨 Fraudulent Listing",
    price_scam:           "💰 Price Scam",
    fake_photos:          "📷 Fake Photos",
    wrong_condition:      "🚗 Misrepresented Condition",
    already_sold:         "👤 Ghost Listing",
    suspicious_dealer:    "⚠️ Suspicious Dealer",
    other:                "🏳 Other",
};

const getTimeLeftStr = (until: number) => {
    const diff = until - Date.now();
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    if (days > 0) return `${days}d ${hours}h`;
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    return `${hours}h ${mins}m`;
};

function DealershipDetailRow({ dealerId }: { dealerId: string }) {
    const vehicles = useQuery(api.vehicles.getByDealerId, { dealerId: dealerId as any });
    const reports = useQuery(api.reports.listAll, { dealerId: dealerId as any });

    return (
        <div className="bg-slate-50 p-6 border-t border-b border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
            {/* Active Listings */}
            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pl-1">
                    🚗 Active Stock ({vehicles?.length ?? 0})
                </h4>
                {vehicles === undefined ? (
                    <div className="flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-100">
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    </div>
                ) : vehicles.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                            <Car size={18} />
                        </div>
                        <p className="text-slate-800 font-bold text-xs">No active stock</p>
                        <p className="text-slate-400 text-[10px] max-w-[200px]">This dealership has not added any vehicles to their list yet.</p>
                    </div>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                        {vehicles.map((car) => (
                            <div key={car._id} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-slate-200 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                                        {car.imageUrls?.[0] && (
                                            <Image src={car.imageUrls[0]} alt={car.make} fill sizes="40px" className="object-cover" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 leading-none">{car.make} {car.model}</p>
                                        <p className="text-[10px] text-slate-400 font-bold pt-1">{car.year}</p>
                                        <span className={`inline-block px-1.5 py-0.5 mt-1.5 rounded text-[8px] font-black uppercase ${
                                            car.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {car.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs font-black text-slate-900">
                                    P {car.price.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reports */}
            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pl-1">
                    🚨 Associated Reports ({reports?.length ?? 0})
                </h4>
                {reports === undefined ? (
                    <div className="flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-100">
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    </div>
                ) : reports.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                            <Flag size={18} />
                        </div>
                        <p className="text-slate-800 font-bold text-xs">No reports associated</p>
                        <p className="text-slate-400 text-[10px] max-w-[200px]">No issues or reports have been submitted against this dealership.</p>
                    </div>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                        {reports.map((report) => (
                            <div key={report._id} className="bg-white p-3 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-800">
                                            {REASON_LABELS[report.reason] || report.reason}
                                        </span>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            Vehicle: {report.vehicle ? `${report.vehicle.make} ${report.vehicle.model}` : "Unknown"}
                                        </p>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                        report.status === 'open' ? 'bg-rose-50 text-rose-600' :
                                        report.status === 'reviewed' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {report.status}
                                    </span>
                                </div>
                                {report.customMessage && (
                                    <p className="text-[10px] text-slate-500 italic bg-slate-50 p-2 rounded-lg leading-relaxed">
                                        "{report.customMessage}"
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function GlobalAdminDashboard() {
    const { user, isLoaded } = useUser();
    const isGlobalAdmin     = useQuery(api.dealerships.checkGlobalAdmin);
    const dealerships      = useQuery(api.dealerships.listAll, isGlobalAdmin ? {} : "skip");
    const allReports       = useQuery(api.reports.listAll, isGlobalAdmin ? {} : "skip");
    const openReports      = useQuery(api.reports.listAll, isGlobalAdmin ? { status: "open" } : "skip");
    const featuredApps     = useQuery(api.featured.list, isGlobalAdmin ? {} : "skip");
    const updateRating     = useMutation(api.dealerships.updateRating);
    const updateAuthorizedEmails = useMutation(api.dealerships.updateAuthorizedEmails);
    const updateReportStatus     = useMutation(api.reports.updateStatus);
    const deleteReport           = useMutation(api.reports.remove);
    const approveFeatured        = useMutation(api.featured.approve);
    const rejectFeatured         = useMutation(api.featured.reject);
    const revokeFeatured         = useMutation(api.featured.revoke);
    const deleteDealership       = useMutation(api.dealerships.remove);

    const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
    const [editingRatingId,  setEditingRatingId]  = useState<string | null>(null);
    const [ratingValue,      setRatingValue]       = useState<number>(5);
    const [managingEmailsId, setManagingEmailsId]  = useState<string | null>(null);
    const [newEmail,         setNewEmail]           = useState("");
    const [isSubmitting,     setIsSubmitting]       = useState(false);
    const [reportFilter,     setReportFilter]       = useState<"all" | "open" | "reviewed" | "dismissed">("open");
    const [featuredFilter,   setFeaturedFilter]     = useState<"all" | "pending" | "waitlisted" | "approved" | "rejected" | "expired" | "revoked">("pending");
    const [expandedReport,   setExpandedReport]     = useState<string | null>(null);
    const [adminNoteInput,   setAdminNoteInput]     = useState<Record<string, string>>({});
    const [activeTab,        setActiveTab]          = useState<"dealerships" | "reports" | "promotions" | "subscriptions">("dealerships");
    const [tierUpdating,     setTierUpdating]       = useState<string | null>(null);
    const [reqAdminNote,     setReqAdminNote]       = useState<Record<string, string>>({});

    // Subscription queries + mutations
    const upgradeRequests   = useQuery(api.subscriptions.listUpgradeRequests, isGlobalAdmin ? {} : "skip");
    const setDealerTier     = useMutation(api.subscriptions.setDealerTier);
    const resolveRequest    = useMutation(api.subscriptions.resolveUpgradeRequest);

    const pendingUpgradeCount = upgradeRequests?.filter((r: any) => r.status === "pending").length ?? 0;

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get("tab");
            if (tab === "reports" || tab === "promotions" || tab === "dealerships" || tab === "subscriptions") {
                setActiveTab(tab as "dealerships" | "reports" | "promotions" | "subscriptions");
            }
        }
    }, []);

    if (!isLoaded || isGlobalAdmin === undefined) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
        );
    }

    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (!isGlobalAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-md w-full space-y-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                        <Shield size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans">Access Denied</h2>
                        <p className="text-slate-500 font-medium text-sm">
                            Only registered PulaDrive marketplace global administrators can access this control panel.
                        </p>
                    </div>
                    <div className="pt-2">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Signed in as: <span className="text-slate-600 lowercase">{userEmail || "Guest"}</span>
                        </p>
                    </div>
                </div>
                <MobileNav />
            </div>
        );
    }

    const handleSaveRating = async (id: any) => {
        try {
            await updateRating({ id, rating: ratingValue });
            setEditingRatingId(null);
        } catch (err) {
            console.error("Failed to update rating", err);
        }
    };

    const handleAddEmail = async (dealer: any) => {
        if (!newEmail || !newEmail.includes("@")) return;
        setIsSubmitting(true);
        try {
            const currentList = dealer.authorizedEmails || [userEmail];
            if (!currentList.includes(newEmail)) {
                await updateAuthorizedEmails({
                    id: dealer._id,
                    authorizedEmails: [...currentList, newEmail],
                });
            }
            setNewEmail("");
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveEmail = async (dealer: any, emailToRemove: string) => {
        const currentList = dealer.authorizedEmails || [];
        if (currentList.length <= 2) {
            alert("Dealership must have at least 2 registered admin emails.");
            return;
        }
        setIsSubmitting(true);
        try {
            await updateAuthorizedEmails({
                id: dealer._id,
                authorizedEmails: currentList.filter((email: string) => email !== emailToRemove),
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDealership = async (id: any) => {
        setIsSubmitting(true);
        try {
            await deleteDealership({ id });
            setManagingEmailsId(null);
        } catch (err) {
            console.error(err);
            alert("Failed to delete dealership: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen pb-32 bg-slate-50">
            {/* Admin Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center font-black">
                            PD
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                                Marketplace Admin <Shield className="text-primary-600" size={18} />
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none pt-1">
                                Global Control panel
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/billing"
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                            <CreditCard size={15} /> Billing Portal
                        </Link>
                        <NotificationCenter recipientId="admin" />
                        <UserButton />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Dealerships</p>
                            <p className="text-2xl font-black text-slate-900 pt-1">{dealerships?.length ?? 0}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <Star size={24} className="fill-amber-500 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Avg Trust Rating</p>
                            <p className="text-2xl font-black text-slate-900 pt-1">
                                {dealerships && dealerships.length > 0
                                    ? (dealerships.reduce((acc, curr) => acc + (curr.rating ?? 5.0), 0) / dealerships.length).toFixed(1)
                                    : "5.0"}
                            </p>
                        </div>
                    </div>
                    <div
                        className={`p-6 rounded-3xl shadow-sm border flex items-center gap-4 cursor-pointer transition-all ${
                            (openReports?.length ?? 0) > 0
                                ? "bg-rose-50 border-rose-200 hover:bg-rose-100"
                                : "bg-white border-slate-100"
                        }`}
                        onClick={() => setActiveTab("reports")}
                    >
                        <div className={`p-3 rounded-2xl ${
                            (openReports?.length ?? 0) > 0 ? "bg-rose-100 text-rose-600" : "bg-slate-50 text-slate-400"
                        }`}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Open Reports</p>
                            <p className={`text-2xl font-black pt-1 ${
                                (openReports?.length ?? 0) > 0 ? "text-rose-600" : "text-slate-900"
                            }`}>
                                {openReports?.length ?? 0}
                            </p>
                        </div>
                        {(openReports?.length ?? 0) > 0 && (
                            <span className="ml-auto text-xs font-black text-rose-500 animate-pulse">Review →</span>
                        )}
                    </div>
                </div>

                {/* Tab nav */}
                <div className="flex gap-2 flex-wrap">
                    {(["dealerships", "reports", "promotions", "subscriptions"] as const).map((tab) => {
                        const pendingAppsCount = featuredApps?.filter((a: any) => a.status === "pending").length ?? 0;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                                    activeTab === tab
                                        ? "bg-slate-900 text-white"
                                        : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                                }`}
                            >
                                {tab === "dealerships" ? <Building2 size={15} /> : tab === "reports" ? <Flag size={15} /> : tab === "promotions" ? <Sparkles className="text-amber-500 fill-amber-100" size={15} /> : <Layers size={15} />}
                                {tab === "dealerships" ? "Dealerships" : tab === "reports" ? "Reports" : tab === "promotions" ? "Promotions" : "Subscriptions"}
                                {tab === "reports" && (openReports?.length ?? 0) > 0 && (
                                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                        {openReports!.length}
                                    </span>
                                )}
                                {tab === "promotions" && pendingAppsCount > 0 && (
                                    <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                                        {pendingAppsCount}
                                    </span>
                                )}
                                {tab === "subscriptions" && pendingUpgradeCount > 0 && (
                                    <span className="bg-indigo-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                                        {pendingUpgradeCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Dealership Tab */}
                {activeTab === "dealerships" && (
                    <>
                        {/* Dealership Registry */}
                        <section className="space-y-6">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Dealership Registry</h2>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Dealership</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Slug & Location</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Trust Rating</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Subscription</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Admins</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {dealerships?.map((dealer: any) => (
                                    <Fragment key={dealer._id}>
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setSelectedDealerId(selectedDealerId === dealer._id ? null : dealer._id)}
                                                    className="flex items-center gap-2 text-left hover:text-primary-600 transition-colors focus:outline-none"
                                                >
                                                    {selectedDealerId === dealer._id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm hover:underline">{dealer.name}</div>
                                                        <div className="text-xs text-slate-400 font-medium pt-1">Clerk: {dealer.clerkOrgId.slice(0, 12)}...</div>
                                                    </div>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-slate-700">{dealer.slug}</div>
                                                <div className="text-xs text-slate-400 font-medium pt-0.5">{dealer.location}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {editingRatingId === dealer._id ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            max="5"
                                                            className="w-16 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold"
                                                            value={ratingValue}
                                                            onChange={(e) => setRatingValue(Number(e.target.value))}
                                                        />
                                                        <button
                                                            onClick={() => handleSaveRating(dealer._id)}
                                                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingRatingId(dealer._id);
                                                            setRatingValue(dealer.rating ?? 5.0);
                                                        }}
                                                        className="flex items-center gap-1 text-xs font-black text-amber-600 hover:bg-slate-100 px-2 py-1 rounded-lg transition-all"
                                                    >
                                                        <Star size={14} className="fill-amber-500 text-amber-500" />
                                                        {(dealer.rating ?? 5.0).toFixed(1)}
                                                    </button>
                                                )}
                                            </td>
                                            {/* Subscription tier column */}
                                            <td className="px-6 py-4">
                                                <select
                                                    value={dealer.subscriptionTier ?? "starter"}
                                                    disabled={tierUpdating === dealer._id}
                                                    onChange={async (e) => {
                                                        setTierUpdating(dealer._id);
                                                        try {
                                                            await setDealerTier({ dealerId: dealer._id, tier: e.target.value as any });
                                                        } catch (err) {
                                                            console.error(err);
                                                        } finally {
                                                            setTierUpdating(null);
                                                        }
                                                    }}
                                                    className="text-xs font-black border border-slate-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer disabled:opacity-50"
                                                >
                                                    <option value="starter">🌱 Starter — 50 slots</option>
                                                    <option value="growth">⚡ Growth — 150 slots</option>
                                                    <option value="unlimited">∞ Unlimited</option>
                                                </select>
                                                {tierUpdating === dealer._id && <Loader2 size={12} className="animate-spin inline ml-2 text-slate-400" />}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5 max-w-xs">
                                                    {(dealer.authorizedEmails || []).map((email: string) => (
                                                        <span key={email} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                                                            {email}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setManagingEmailsId(managingEmailsId === dealer._id ? null : dealer._id);
                                                    }}
                                                    className="text-xs font-bold text-primary-600 hover:underline"
                                                >
                                                    Emails & Admins
                                                </button>
                                            </td>
                                        </tr>
                                        {selectedDealerId === dealer._id && (
                                            <tr>
                                                <td colSpan={6} className="p-0">
                                                    <DealershipDetailRow dealerId={dealer._id} />
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Email Management Panel (expandable under/over the registry) */}
                {managingEmailsId && (
                    (() => {
                        const activeDealer = dealerships?.find((d) => d._id === managingEmailsId);
                        if (!activeDealer) return null;
                        return (
                            <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-xl space-y-4 animate-in slide-in-from-top-3 duration-250">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                                        Manage Admin Emails: <span className="text-primary-600">{activeDealer.name}</span>
                                    </h3>
                                    <p className="text-xs text-slate-400">At least 2 specific admin email addresses must remain authorized to maintain B2B portal access.</p>
                                </div>

                                <div className="space-y-2">
                                    {(activeDealer.authorizedEmails || []).map((email: string) => (
                                        <div key={email} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-xs font-bold text-slate-700">{email}</span>
                                            <button
                                                onClick={() => handleRemoveEmail(activeDealer, email)}
                                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Remove Access"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="Add administrator email..."
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                    <button
                                        onClick={() => handleAddEmail(activeDealer)}
                                        disabled={isSubmitting || !newEmail}
                                        className="btn-primary flex items-center gap-1 px-4 text-xs font-bold"
                                    >
                                        <Plus size={16} /> Add Email
                                    </button>
                                </div>

                                <div className="pt-6 mt-6 border-t border-rose-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                                            🚨 Danger Zone
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-bold max-w-md">
                                            Permanently delete this dealership registry. This cascades and deletes all associated listings, photos, analytics, and reports. This action is irreversible.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const confirmName = prompt(
                                                `To delete this dealership permanently, type its exact name:\n"${activeDealer.name}"`
                                            );
                                            if (confirmName === activeDealer.name) {
                                                handleDeleteDealership(activeDealer._id);
                                            } else if (confirmName !== null) {
                                                alert("Dealership name did not match. Deletion aborted.");
                                            }
                                        }}
                                        disabled={isSubmitting}
                                        className="px-4 py-2.5 border border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <Trash2 size={14} /> Delete Account Fully
                                    </button>
                                </div>
                            </div>
                        );
                    })()
                )}
                    </>
                )}

                {/* ── Promotions Tab ────────────────────────────────────── */}
                {activeTab === "promotions" && (
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Sparkles className="text-primary-600" size={20} /> Featured Listings Management
                            </h2>
                            <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto max-w-full no-scrollbar">
                                {(["all", "pending", "waitlisted", "approved", "expired", "revoked", "rejected"] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFeaturedFilter(f)}
                                        className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                                            featuredFilter === f
                                                ? f === "pending" ? "bg-amber-500 text-white"
                                                : f === "waitlisted" ? "bg-orange-500 text-white"
                                                : f === "approved" ? "bg-emerald-500 text-white"
                                                : f === "rejected" ? "bg-rose-500 text-white"
                                                : f === "expired" ? "bg-slate-500 text-white"
                                                : f === "revoked" ? "bg-slate-700 text-white"
                                                : "bg-slate-900 text-white"
                                                : "text-slate-500 hover:text-slate-900"
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* List applications */}
                        {(() => {
                            const source = featuredFilter === "all" ? featuredApps : featuredApps?.filter((a: any) => a.status === featuredFilter);
                            if (!source) return <div className="text-slate-400 font-bold text-sm">Loading…</div>;
                            if (source.length === 0) return (
                                <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-4">
                                    <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                        <Sparkles size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-900 font-black text-sm">No featured applications found</p>
                                        <p className="text-slate-400 text-xs font-bold">There are no listing applications currently under "{featuredFilter}" filter.</p>
                                    </div>
                                    {featuredFilter !== "all" && (
                                        <button
                                            onClick={() => setFeaturedFilter("all")}
                                            className="bg-primary-600 hover:bg-primary-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-primary-100 transition-all cursor-pointer"
                                        >
                                            Reset Filter
                                        </button>
                                    )}
                                </div>
                            );

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {source.map((app: any) => {
                                        const statusColors: Record<string, string> = {
                                            pending:    "bg-amber-50 text-amber-700 border-amber-200",
                                            waitlisted: "bg-orange-50 text-orange-700 border-orange-200",
                                            approved:   "bg-emerald-50 text-emerald-700 border-emerald-200",
                                            rejected:   "bg-rose-50 text-rose-700 border-rose-200",
                                        };

                                        return (
                                            <div key={app._id} className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col justify-between gap-4">
                                                <div className="flex gap-4">
                                                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                                        {app.vehicleImage ? (
                                                            <Image src={app.vehicleImage} alt={app.vehicleName} fill sizes="80px" className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <Sparkles size={24} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColors[app.status]}`}>
                                                            {app.status}
                                                        </span>
                                                        <h3 className="font-black text-slate-900 text-sm">{app.vehicleName}</h3>
                                                        <p className="text-xs text-slate-500 font-medium">{app.dealerName}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1">
                                                            {app.durationDays} Days • P {app.price}
                                                        </p>
                                                        {app.status === "approved" && app.featuredUntil && (
                                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                                Time Left: {getTimeLeftStr(app.featuredUntil)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {(app.status === "pending" || app.status === "waitlisted") && (
                                                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm("Approve this featured application and activate premium slots?")) {
                                                                    await approveFeatured({ applicationId: app._id });
                                                                }
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-black transition-all"
                                                        >
                                                            <Check size={13} /> Approve & Activate
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm("Reject this featured application?")) {
                                                                    await rejectFeatured({ applicationId: app._id });
                                                                }
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black transition-all"
                                                        >
                                                            <XCircle size={13} /> Reject
                                                        </button>
                                                    </div>
                                                )}

                                                {app.status === "approved" && (
                                                    <div className="flex pt-2 border-t border-slate-50">
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm("Are you sure you want to revoke this listing's featured status immediately? This cannot be undone.")) {
                                                                    await revokeFeatured({ applicationId: app._id });
                                                                }
                                                            }}
                                                            className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-black transition-all"
                                                        >
                                                            <XCircle size={13} /> Revoke Featured Status
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </section>
                )}

                {/* ── Reports Tab ──────────────────────────────────────── */}
                {activeTab === "reports" && (
                    <section className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Flag className="text-rose-500" size={20} /> Listing Reports
                            </h2>
                            {/* Filter tabs */}
                            <div className="flex gap-1.5">
                                {(["open", "reviewed", "dismissed", "all"] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setReportFilter(f)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black capitalize transition-all ${
                                            reportFilter === f
                                                ? f === "open" ? "bg-rose-500 text-white"
                                                : f === "reviewed" ? "bg-emerald-500 text-white"
                                                : f === "dismissed" ? "bg-slate-500 text-white"
                                                : "bg-slate-900 text-white"
                                                : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Report cards */}
                        {(() => {
                            const source = reportFilter === "all" ? allReports : allReports?.filter((r: any) => r.status === reportFilter);
                            if (!source) return <div className="text-slate-400 font-bold text-sm">Loading…</div>;
                            if (source.length === 0) return (
                                <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-4">
                                    <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                        <Flag size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-900 font-black text-sm">No reports found</p>
                                        <p className="text-slate-400 text-xs font-bold">There are no reports currently under "{reportFilter}" filter.</p>
                                    </div>
                                    {reportFilter !== "all" && (
                                        <button
                                            onClick={() => setReportFilter("all")}
                                            className="bg-primary-600 hover:bg-primary-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-primary-100 transition-all cursor-pointer"
                                        >
                                            Reset Filter
                                        </button>
                                    )}
                                </div>
                            );

                            return (
                                <div className="space-y-4">
                                    {source.map((report: any) => {
                                        const isExpanded = expandedReport === report._id;
                                        const statusColors: Record<string, string> = {
                                            open:      "bg-rose-100 text-rose-700 border-rose-200",
                                            reviewed:  "bg-emerald-100 text-emerald-700 border-emerald-200",
                                            dismissed: "bg-slate-100 text-slate-500 border-slate-200",
                                        };

                                        return (
                                            <div key={report._id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                                                {/* Report header row */}
                                                <div className="flex items-start gap-4 p-5">
                                                    {/* Vehicle thumbnail */}
                                                    {report.vehicle?.imageUrl ? (
                                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                                                            <Image
                                                                src={report.vehicle.imageUrl}
                                                                alt={`${report.vehicle?.make} ${report.vehicle?.model}`}
                                                                fill
                                                                sizes="64px"
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 shrink-0">
                                                            <Flag size={24} />
                                                        </div>
                                                    )}

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                                            <div>
                                                                <p className="font-black text-slate-900 text-sm">
                                                                    {report.vehicle
                                                                        ? `${report.vehicle.year} ${report.vehicle.make} ${report.vehicle.model}`
                                                                        : "Unknown Vehicle"}
                                                                </p>
                                                                <p className="text-xs text-slate-500 font-medium">
                                                                    {report.dealer?.name ?? "Unknown Dealer"} · {report.dealer?.location}
                                                                </p>
                                                            </div>
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                                statusColors[report.status]
                                                            }`}>
                                                                {report.status}
                                                            </span>
                                                        </div>

                                                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                                                            <span className="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                                {REASON_LABELS[report.reason] ?? report.reason}
                                                            </span>
                                                            {report.reporterEmail && (
                                                                <span className="text-xs text-slate-400 font-medium">
                                                                    Reporter: {report.reporterEmail}
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-slate-400 font-medium">
                                                                {new Date(report._creationTime).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => setExpandedReport(isExpanded ? null : report._id)}
                                                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors shrink-0"
                                                    >
                                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                    </button>
                                                </div>

                                                {/* Expanded detail */}
                                                {isExpanded && (
                                                    <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
                                                        {/* Reporter's message */}
                                                        {report.customMessage && (
                                                            <div className="bg-slate-50 rounded-xl p-4">
                                                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
                                                                    <MessageSquare size={11} /> Reporter's Message
                                                                </p>
                                                                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                                                    {report.customMessage}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Admin note */}
                                                        <div>
                                                            <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5">
                                                                Admin Note (internal)
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                placeholder="Add an internal note (only admins can see this)…"
                                                                className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                                                value={adminNoteInput[report._id] ?? report.adminNote ?? ""}
                                                                onChange={(e) => setAdminNoteInput((prev) => ({ ...prev, [report._id]: e.target.value }))}
                                                            />
                                                        </div>

                                                        {/* Action buttons */}
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                onClick={async () => {
                                                                    await updateReportStatus({ id: report._id, status: "reviewed", adminNote: adminNoteInput[report._id] ?? report.adminNote });
                                                                }}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black hover:bg-emerald-100 transition-all"
                                                            >
                                                                <Eye size={13} /> Mark Reviewed
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    await updateReportStatus({ id: report._id, status: "dismissed", adminNote: adminNoteInput[report._id] ?? report.adminNote });
                                                                }}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-black hover:bg-slate-100 transition-all"
                                                            >
                                                                <XCircle size={13} /> Dismiss
                                                            </button>
                                                            {report.status !== "open" && (
                                                                <button
                                                                    onClick={async () => {
                                                                        await updateReportStatus({ id: report._id, status: "open" });
                                                                    }}
                                                                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-black hover:bg-rose-100 transition-all"
                                                                >
                                                                    <AlertTriangle size={13} /> Re-open
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={async () => {
                                                                    if (confirm("Delete this report permanently?")) {
                                                                        await deleteReport({ id: report._id });
                                                                    }
                                                                }}
                                                                className="flex items-center gap-1.5 px-4 py-2 text-rose-500 hover:bg-rose-50 border border-transparent rounded-xl text-xs font-black transition-all ml-auto"
                                                            >
                                                                <Trash2 size={13} /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </section>
                )}
                {/* ── Subscriptions Tab ─────────────────────────────────── */}
                {activeTab === "subscriptions" && (
                    <section className="space-y-8">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Layers className="text-primary-600" size={20} /> Subscription Management
                        </h2>

                        {/* Dealer tier roster */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Dealer Tier Roster</p>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Dealer</th>
                                        <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Current Tier</th>
                                        <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Change Tier</th>
                                        <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Extra Slot Override</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(dealerships ?? []).map((dealer: any) => {
                                        const tier = dealer.subscriptionTier ?? "starter";
                                        const TIER_COLORS: Record<string, string> = {
                                            starter: "bg-slate-100 text-slate-600",
                                            growth: "bg-indigo-50 text-indigo-700",
                                            unlimited: "bg-emerald-50 text-emerald-700",
                                        };
                                        return (
                                            <tr key={dealer._id} className="hover:bg-slate-50">
                                                <td className="px-6 py-3">
                                                    <p className="font-bold text-slate-900 text-sm">{dealer.name}</p>
                                                    <p className="text-[10px] text-slate-400">{dealer.clientCustomId ?? "—"}</p>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${TIER_COLORS[tier]}`}>
                                                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <select
                                                        value={tier}
                                                        disabled={tierUpdating === dealer._id}
                                                        onChange={async (e) => {
                                                            setTierUpdating(dealer._id);
                                                            try { await setDealerTier({ dealerId: dealer._id, tier: e.target.value as any }); }
                                                            catch (err) { console.error(err); }
                                                            finally { setTierUpdating(null); }
                                                        }}
                                                        className="text-xs font-bold border border-slate-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <option value="starter">🌱 Starter — P1,500/mo · 50 slots</option>
                                                        <option value="growth">⚡ Growth — P2,500/mo · 150 slots</option>
                                                        <option value="unlimited">∞ Unlimited — P3,500/mo</option>
                                                    </select>
                                                    {tierUpdating === dealer._id && <Loader2 size={12} className="animate-spin inline ml-2 text-slate-400" />}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-600">+{dealer.listingSlotOverride ?? 0} extra</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Upgrade requests panel */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900">Upgrade &amp; Slot Requests</h3>
                                {pendingUpgradeCount > 0 && (
                                    <span className="text-xs font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                                        {pendingUpgradeCount} pending
                                    </span>
                                )}
                            </div>

                            {!upgradeRequests || upgradeRequests.length === 0 ? (
                                <div className="bg-white rounded-3xl border border-slate-100 p-12 flex flex-col items-center text-center gap-3">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                        <CheckCircle2 size={24} className="text-slate-300" />
                                    </div>
                                    <p className="font-black text-slate-900">All clear</p>
                                    <p className="text-sm text-slate-400">No subscription requests at this time.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upgradeRequests.map((req: any) => (
                                        <div
                                            key={req._id}
                                            className={`bg-white rounded-2xl border shadow-sm p-5 space-y-4 ${
                                                req.status === "pending" ? "border-indigo-200" : "border-slate-100"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-black text-slate-900 text-sm">{req.dealerName}</p>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                            req.status === "pending" ? "bg-indigo-100 text-indigo-700"
                                                            : req.status === "approved" ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-slate-100 text-slate-500"
                                                        }`}>
                                                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {req.requestType === "upgrade_tier"
                                                            ? `Requesting upgrade to ${req.requestedTier?.charAt(0).toUpperCase()}${req.requestedTier?.slice(1)} tier`
                                                            : `Requesting ${req.extraSlotsRequested} extra slots — P ${((req.extraSlotsCost ?? 0) / 100).toLocaleString()}`
                                                        }
                                                    </p>
                                                    {req.message && (
                                                        <p className="text-xs text-slate-400 italic mt-1 bg-slate-50 rounded-lg px-3 py-2">&ldquo;{req.message}&rdquo;</p>
                                                    )}
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        Submitted: {new Date(req.createdAt).toLocaleDateString("en-BW", { day: "numeric", month: "short", year: "numeric" })}
                                                    </p>
                                                </div>
                                            </div>

                                            {req.status === "pending" && (
                                                <div className="space-y-2">
                                                    <textarea
                                                        placeholder="Admin note (optional, shown to dealer on dismiss)..."
                                                        rows={2}
                                                        value={reqAdminNote[req._id] ?? ""}
                                                        onChange={(e) => setReqAdminNote(prev => ({ ...prev, [req._id]: e.target.value }))}
                                                        className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-slate-300"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await resolveRequest({
                                                                        requestId: req._id,
                                                                        action: "approve",
                                                                        adminNote: reqAdminNote[req._id] || undefined,
                                                                    });
                                                                } catch (err: any) { alert(err?.message); }
                                                            }}
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-colors"
                                                        >
                                                            <Check size={13} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await resolveRequest({
                                                                        requestId: req._id,
                                                                        action: "dismiss",
                                                                        adminNote: reqAdminNote[req._id] || undefined,
                                                                    });
                                                                } catch (err: any) { alert(err?.message); }
                                                            }}
                                                            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-50 transition-colors"
                                                        >
                                                            <X size={13} /> Dismiss
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {req.status !== "pending" && req.adminNote && (
                                                <p className="text-xs text-slate-400 italic bg-slate-50 rounded-lg px-3 py-2">
                                                    Admin note: &ldquo;{req.adminNote}&rdquo;
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>

            <MobileNav />
        </main>
    );
}

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserButton, useOrganization, useUser } from "@clerk/nextjs";
import MobileNav from "@/components/navigation/MobileNav";
import { Plus, TrendingUp, Car, Loader2, Flame, Users, Trash2, Phone, CreditCard, AlertCircle, Shield, Layers, MapPin, Mail, Globe, FileText, Store } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import NotificationCenter from "../components/NotificationCenter";
import AddVehicleForm from "@/components/dashboard/AddVehicleForm";
import EditVehicleForm from "@/components/dashboard/EditVehicleForm";
import PromotionModal from "@/components/dashboard/PromotionModal";
import Link from "next/link";
import DealershipSelector from "@/components/dashboard/DealershipSelector";

export default function DealerDashboard() {
    const { user } = useUser();
    const { organization } = useOrganization();
    
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [showFrozenModal, setShowFrozenModal] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<any>(null);
    const [promotingVehicle, setPromotingVehicle] = useState<any>(null);
    
    // Admin emails state
    const [newEmail, setNewEmail] = useState("");
    const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
    const [isSubmittingPhone, setIsSubmittingPhone] = useState(false);
    const [phoneInput, setPhoneInput] = useState("");

    // Details state
    const [descriptionInput, setDescriptionInput] = useState("");
    const [mapsUrlInput, setMapsUrlInput] = useState("");
    const [contactEmailInput, setContactEmailInput] = useState("");
    const [contactPhoneInput, setContactPhoneInput] = useState("");
    const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);

    const dealership = useQuery(api.dealerships.getByClerkOrgId, organization ? { clerkOrgId: organization.id } : "skip");
    const vehicles = useQuery(api.vehicles.getByDealerId, dealership && dealership !== null ? { dealerId: dealership._id } : "skip");
    const slotStatus = useQuery(api.subscriptions.getSubscriptionStatus, dealership ? { dealerId: dealership._id } : "skip");
    const isGlobalAdmin = useQuery(api.dealerships.checkGlobalAdmin);
    const updateAuthorizedEmails = useMutation(api.dealerships.updateAuthorizedEmails);
    const updatePhone = useMutation(api.dealerships.updatePhone);
    const updateDetails = useMutation(api.dealerships.updateDetails);
    const updateVehicle = useMutation(api.vehicles.update);
    const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

    useEffect(() => {
        if (dealership) {
            if (dealership.phone !== undefined) {
                setPhoneInput(dealership.phone || "");
            }
            setDescriptionInput((dealership as any).description || "");
            setMapsUrlInput((dealership as any).googleMapsUrl || "");
            setContactEmailInput((dealership as any).contactEmail || "");
            setContactPhoneInput((dealership as any).contactPhone || "");
        }
    }, [dealership]);

    // Countdown timer for active promotions
    const getCountdown = (featuredUntil: number) => {
        const diffMs = featuredUntil - Date.now();
        if (diffMs <= 0) return "Expired";
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h left`;
    };

    if (!organization || !dealership) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
        );
    }

    const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";

    const handleAddEmail = async () => {
        if (!newEmail || !newEmail.includes("@")) {
            alert("Please enter a valid email address.");
            return;
        }
        setIsSubmittingEmail(true);
        try {
            const currentList = (dealership.authorizedEmails || [userEmail]).filter((e): e is string => typeof e === "string");
            if (!currentList.includes(newEmail)) {
                await updateAuthorizedEmails({
                    id: dealership._id,
                    authorizedEmails: [...currentList, newEmail],
                });
            }
            setNewEmail("");
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to add email.");
        } finally {
            setIsSubmittingEmail(false);
        }
    };

    const handleRemoveEmail = async (emailToRemove: string) => {
        const currentList = (dealership.authorizedEmails || []).filter((e): e is string => typeof e === "string");
        if (currentList.length <= 1) {
            alert("Dealership must have at least 1 registered admin email.");
            return;
        }
        if (confirm(`Are you sure you want to remove ${emailToRemove}?`)) {
            setIsSubmittingEmail(true);
            try {
                await updateAuthorizedEmails({
                    id: dealership._id,
                    authorizedEmails: currentList.filter((email: string) => email !== emailToRemove),
                });
            } catch (err: any) {
                console.error(err);
                alert(err?.message || "Failed to remove email.");
            } finally {
                setIsSubmittingEmail(false);
            }
        }
    };

    const handleUpdatePhone = async () => {
        if (!dealership) return;
        setIsSubmittingPhone(true);
        try {
            await updatePhone({
                id: dealership._id,
                phone: phoneInput,
            });
            alert("WhatsApp contact number updated successfully!");
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to update contact phone number.");
        } finally {
            setIsSubmittingPhone(false);
        }
    };

    const handleUpdateDetails = async () => {
        if (!dealership) return;
        setIsSubmittingDetails(true);
        try {
            await updateDetails({
                id: dealership._id,
                description: descriptionInput || undefined,
                googleMapsUrl: mapsUrlInput || undefined,
                contactEmail: contactEmailInput || undefined,
                contactPhone: contactPhoneInput || undefined,
            });
            alert("Public dealership details updated successfully!");
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to update details.");
        } finally {
            setIsSubmittingDetails(false);
        }
    };


    const vehicleList = vehicles ?? [];
    const activeListings = vehicleList.filter((v: any) => v.status === "available").length;
    const soldListings   = vehicleList.filter((v: any) => v.status === "sold").length;
    const totalValue     = vehicleList.reduce((sum: number, v: any) => sum + (v.price ?? 0), 0);
    const formatValue    = (val: number) =>
        val >= 1_000_000
            ? `P ${(val / 1_000_000).toFixed(1)}M`
            : val >= 1_000
            ? `P ${(val / 1_000).toFixed(0)}K`
            : `P ${val.toLocaleString()}`;

    const STATUS_STYLES = {
        available: { active: "bg-emerald-500 text-white", idle: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200" },
        reserved:  { active: "bg-amber-400 text-white",   idle: "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200" },
        sold:      { active: "bg-rose-500 text-white",    idle: "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200" },
    } as const;

    return (
        <main className="min-h-screen pb-32 bg-slate-50">
            {/* ── Dashboard Header ───────────────────────────────────────────── */}
            <header className="bg-white border-b border-slate-200 px-4 py-4 lg:px-8 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto">
                    {/* Top row: title + user actions */}
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">Dealer Portal</h1>
                            <DealershipSelector />
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Billing & Analytics collapsed to icons on very small screens */}
                            <Link
                                href="/dashboard/billing"
                                className="touch-target no-tap-highlight flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors"
                            >
                                <CreditCard size={14} />
                                <span className="hidden xs:inline">Billing</span>
                            </Link>
                            <Link
                                href="/dashboard/analytics"
                                className="touch-target no-tap-highlight hidden sm:flex px-3 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
                            >
                                Analytics
                            </Link>
                            <NotificationCenter recipientId={dealership._id} />
                            <UserButton />
                        </div>
                    </div>
                    {/* Mobile-only second row: Analytics link */}
                    <div className="flex sm:hidden gap-2 mt-3">
                        <Link
                            href="/dashboard/analytics"
                            className="flex-1 text-center py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-xs no-tap-highlight"
                        >
                            View Analytics
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6 sm:space-y-8">
                {/* ── Stats Cards ────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        { icon: <TrendingUp className="text-primary-600" size={20} />, label: "Total Stock Value", value: vehicles === undefined ? "…" : formatValue(totalValue), accent: "border-l-primary-400" },
                        { icon: <Car className="text-emerald-500" size={20} />,        label: "Available",          value: vehicles === undefined ? "…" : activeListings,         accent: "border-l-emerald-400" },
                        { icon: <Car className="text-rose-400" size={20} />,           label: "Sold",               value: vehicles === undefined ? "…" : soldListings,            accent: "border-l-rose-400" },
                        { icon: <TrendingUp className="text-slate-400" size={20} />,   label: "Total Listings",     value: vehicles === undefined ? "…" : vehicleList.length,      accent: "border-l-slate-300" },
                    ].map(({ icon, label, value, accent }) => (
                        <div key={label} className={`bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 ${accent} space-y-3`}>
                            {icon}
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">{label}</p>
                                <p className="text-xl sm:text-2xl font-black text-slate-900 pt-1">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Inventory Section ──────────────────────────────────────── */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Vehicle Inventory</h2>
                        <div className="flex items-center gap-2">
                            {/* Slot usage pill */}
                            {slotStatus && (
                                <Link
                                    href="/dashboard/billing"
                                    className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                                        slotStatus.isAtLimit
                                            ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                                            : slotStatus.remainingSlots !== Infinity && (slotStatus.remainingSlots as number) <= 5
                                            ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                    <Layers size={12} />
                                    {slotStatus.slotLimit === Infinity
                                        ? `${slotStatus.usedSlots} listings`
                                        : `${slotStatus.usedSlots} / ${slotStatus.slotLimit} slots`
                                    }
                                </Link>
                            )}
                            <button
                                onClick={() => {
                                    if (dealership?.accountStatus === "frozen") {
                                        setShowFrozenModal(true);
                                    } else if (slotStatus?.isAtLimit) {
                                        alert(`You've reached your ${slotStatus.slotLimit}-slot limit on the ${slotStatus.tier.charAt(0).toUpperCase() + slotStatus.tier.slice(1)} plan. Go to Billing to request more slots or upgrade.`);
                                    } else {
                                        setShowAddVehicle(true);
                                    }
                                }}
                                disabled={slotStatus?.isAtLimit === true}
                                title={slotStatus?.isAtLimit ? `Slot limit reached (${slotStatus.slotLimit}). Upgrade to add more.` : "Add a new vehicle"}
                                className={`btn-primary touch-target no-tap-highlight flex items-center gap-2 py-2 px-4 text-sm ${
                                    slotStatus?.isAtLimit ? "opacity-60 cursor-not-allowed" : ""
                                }`}
                            >
                                <Plus size={16} /> <span className="hidden xs:inline">Add Vehicle</span><span className="xs:hidden">Add</span>
                            </button>
                        </div>
                    </div>
                    {/* Slot limit warning banner */}
                    {slotStatus?.isAtLimit && (
                        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                            <AlertCircle size={16} className="text-amber-600 shrink-0" />
                            <p className="text-xs font-bold text-amber-800">
                                You've used all {slotStatus.slotLimit} listing slots on your {slotStatus.tier.charAt(0).toUpperCase() + slotStatus.tier.slice(1)} plan.{" "}
                                <Link href="/dashboard/billing" className="underline hover:text-amber-900">Request more slots or upgrade →</Link>
                            </p>
                        </div>
                    )}
                    {/* Low slot warning */}
                    {slotStatus && !slotStatus.isAtLimit && slotStatus.slotLimit !== Infinity && (slotStatus.remainingSlots as number) <= 5 && (slotStatus.remainingSlots as number) > 0 && (
                        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                            <AlertCircle size={16} className="text-amber-500 shrink-0" />
                            <p className="text-xs font-bold text-amber-700">
                                Only {slotStatus.remainingSlots} listing slot{(slotStatus.remainingSlots as number) === 1 ? "" : "s"} remaining.{" "}
                                <Link href="/dashboard/billing" className="underline hover:text-amber-800">Upgrade or request more →</Link>
                            </p>
                        </div>
                    )}

                    {/* ── Desktop Table (md+) ─────────────────────────────────── */}
                    <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Vehicle</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Price</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vehicles?.map((car: any) => (
                                    <tr key={car._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                                                    {car.imageUrls[0] && (
                                                        <Image src={car.imageUrls[0]} alt={car.make} fill sizes="64px" className="object-cover" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm leading-none">{car.make} {car.model}</p>
                                                    <p className="text-xs text-slate-400 font-medium pt-1">{car.year}</p>
                                                    {car.featuredUntil && car.featuredUntil > Date.now() && (
                                                        <div className="flex items-center gap-1 mt-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-600">
                                                            <Flame size={12} className="text-amber-500 fill-amber-500 animate-pulse" />
                                                            <span>Promo ({getCountdown(car.featuredUntil)})</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900 text-sm">P {car.price.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${car.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                                                car.status === 'reserved' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {car.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                {/* Quick status buttons */}
                                                <div className="flex items-center gap-1.5">
                                                    {(["available", "reserved", "sold"] as const).map((value) => (
                                                        <button
                                                            key={value}
                                                            disabled={statusUpdating === car._id}
                                                            onClick={async () => {
                                                                if (car.status === value) return;
                                                                setStatusUpdating(car._id);
                                                                try {
                                                                    await updateVehicle({ id: car._id, status: value });
                                                                } finally {
                                                                    setStatusUpdating(null);
                                                                }
                                                            }}
                                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 ${
                                                                car.status === value ? STATUS_STYLES[value].active : STATUS_STYLES[value].idle
                                                            }`}
                                                        >
                                                            {statusUpdating === car._id && car.status !== value ? "…" : value.charAt(0).toUpperCase() + value.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>
                                                {/* Row actions */}
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => setEditingVehicle(car)} className="text-primary-600 font-bold text-xs hover:underline no-tap-highlight">Edit</button>
                                                    <button onClick={() => setPromotingVehicle(car)} className="text-indigo-600 font-bold text-xs hover:underline no-tap-highlight">Promote</button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {vehicles && vehicles.length === 0 && <EmptyInventory onAdd={() => {
                            if (dealership?.accountStatus === "frozen") {
                                setShowFrozenModal(true);
                            } else {
                                setShowAddVehicle(true);
                            }
                        }} />}
                    </div>

                    {/* ── Mobile Card List (< md) ─────────────────────────────── */}
                    <div className="flex md:hidden flex-col gap-3">
                        {vehicles && vehicles.length === 0 && (
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <EmptyInventory onAdd={() => {
                                    if (dealership?.accountStatus === "frozen") {
                                        setShowFrozenModal(true);
                                    } else {
                                        setShowAddVehicle(true);
                                    }
                                }} />
                            </div>
                        )}
                        {vehicles?.map((car: any) => (
                            <div key={car._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                {/* Card top: image + info */}
                                <div className="flex gap-3 p-4">
                                    <div className="w-16 h-16 relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                                        {car.imageUrls[0] && (
                                            <Image src={car.imageUrls[0]} alt={car.make} fill sizes="80px" className="object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-black text-slate-900 text-sm leading-tight">{car.make} {car.model}</p>
                                                <p className="text-xs text-slate-400 font-medium">{car.year}</p>
                                            </div>
                                            <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${car.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                                                car.status === 'reserved' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {car.status}
                                            </span>
                                        </div>
                                        <p className="text-base font-black text-slate-900 mt-1">P {car.price.toLocaleString()}</p>
                                        {car.featuredUntil && car.featuredUntil > Date.now() && (
                                            <div className="flex items-center gap-1 mt-1 text-[10px] font-black uppercase tracking-wider text-indigo-600">
                                                <Flame size={11} className="text-amber-500 fill-amber-500 animate-pulse" />
                                                <span>Promo — {getCountdown(car.featuredUntil)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card bottom: actions */}
                                <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-3 bg-slate-50/60">
                                    {/* Status toggle */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {(["available", "reserved", "sold"] as const).map((value) => (
                                            <button
                                                key={value}
                                                disabled={statusUpdating === car._id}
                                                onClick={async () => {
                                                    if (car.status === value) return;
                                                    setStatusUpdating(car._id);
                                                    try {
                                                        await updateVehicle({ id: car._id, status: value });
                                                    } finally {
                                                        setStatusUpdating(null);
                                                    }
                                                }}
                                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 no-tap-highlight ${
                                                    car.status === value ? STATUS_STYLES[value].active : STATUS_STYLES[value].idle
                                                }`}
                                            >
                                                {statusUpdating === car._id && car.status !== value ? "…" : value.charAt(0).toUpperCase() + value.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Edit / Promote */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <button onClick={() => setEditingVehicle(car)} className="text-primary-600 font-bold text-xs no-tap-highlight touch-target">Edit</button>
                                        <button onClick={() => setPromotingVehicle(car)} className="text-indigo-600 font-bold text-xs no-tap-highlight touch-target">Promote</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Contact & Access Section ───────────────────────────────── */}
                <section className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 sm:space-y-8">
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Shield className="text-primary-600" size={20} /> Contact &amp; Access
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Manage which email addresses are authorized to view and list stock for this dealership. Must contain at least 1 email.</p>
                    </div>

                    {/* ── Registered Admin Emails ── */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={15} className="text-primary-500" />
                                <p className="text-sm font-black text-slate-800 tracking-tight">Registered Admin Emails</p>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full ring-1 ring-primary-100">
                                {(dealership.authorizedEmails || []).length} registered
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(dealership.authorizedEmails || []).map((email: string, idx: number) => (
                                <div
                                    key={email}
                                    className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-black text-primary-700 uppercase">{email[0]}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">{email}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {email === userEmail ? "You" : `Admin ${idx + 1}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full ring-1 ring-emerald-100">
                                            Active
                                        </span>
                                        {email !== userEmail && (
                                            <button
                                                onClick={() => handleRemoveEmail(email)}
                                                className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all touch-target no-tap-highlight"
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add new email */}
                        <div className="flex flex-col xs:flex-row gap-2 pt-1">
                            <input
                                type="email"
                                placeholder="Add administrator email…"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            />
                            <button
                                onClick={handleAddEmail}
                                disabled={isSubmittingEmail || !newEmail}
                                className="btn-primary px-4 py-3 text-xs font-bold whitespace-nowrap rounded-xl disabled:opacity-50 disabled:cursor-not-allowed no-tap-highlight"
                            >
                                + Add Email
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* ── WhatsApp Contact ── */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Phone size={15} className="text-emerald-500" />
                                <p className="text-sm font-black text-slate-800 tracking-tight">WhatsApp Contact Number</p>
                            </div>
                            {dealership.phone ? (
                                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full ring-1 ring-emerald-100">
                                    ✓ Active
                                </span>
                            ) : (
                                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full ring-1 ring-amber-100">
                                    ⚠ Not set
                                </span>
                            )}
                        </div>

                        {/* Current number display */}
                        {dealership.phone ? (
                            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                    <Phone size={18} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600">Registered WhatsApp Number</p>
                                    <p className="text-base font-black text-slate-900 tracking-tight">+{dealership.phone}</p>
                                </div>
                                <a
                                    href={`https://wa.me/${dealership.phone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 underline underline-offset-2 flex-shrink-0"
                                >
                                    Test ↗
                                </a>
                            </div>
                        ) : (
                            <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
                                <p className="text-xs font-bold text-amber-700">No WhatsApp number set — buyers will see a disabled button on your listings.</p>
                            </div>
                        )}

                        {/* Update input */}
                        <div className="flex flex-col xs:flex-row gap-2">
                            <input
                                type="tel"
                                placeholder="Update number e.g. 26771234567"
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleUpdatePhone()}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                            />
                            <button
                                onClick={handleUpdatePhone}
                                disabled={isSubmittingPhone || !phoneInput}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap no-tap-highlight"
                            >
                                {isSubmittingPhone ? "Saving…" : "Save Number"}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium pl-1">Digits only with country code — no spaces or dashes. e.g. <strong>26771234567</strong> for +267 71 234 567</p>
                    </div>
                </section>

                {/* ── Dealership Profile Section ───────────────────────────────── */}
                <section className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 sm:space-y-8">
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Store className="text-primary-600" size={20} /> Dealership Profile Details
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Configure your dealership's public profile description, Google Maps directions, and additional contact details.</p>
                    </div>

                    <div className="space-y-6">
                        {/* Description input */}
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                                <FileText size={15} className="text-primary-500" /> Public Description
                            </label>
                            <textarea
                                placeholder="Describe your dealership, history, types of stock you offer, services, etc..."
                                value={descriptionInput}
                                onChange={(e) => setDescriptionInput(e.target.value)}
                                rows={4}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none font-sans"
                                maxLength={1000}
                            />
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium px-1">
                                <span>Write a short bio for buyers to see.</span>
                                <span>{descriptionInput.length} / 1000</span>
                            </div>
                        </div>

                        {/* Contact details grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                                    <Mail size={15} className="text-primary-500" /> Public Contact Email
                                </label>
                                <input
                                    type="email"
                                    placeholder="e.g. sales@yourdealership.com"
                                    value={contactEmailInput}
                                    onChange={(e) => setContactEmailInput(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                                    <Phone size={15} className="text-primary-500" /> Public Contact Phone (General)
                                </label>
                                <input
                                    type="tel"
                                    placeholder="e.g. 2673900000"
                                    value={contactPhoneInput}
                                    onChange={(e) => setContactPhoneInput(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Google Maps Directions input */}
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                                <MapPin size={15} className="text-primary-500" /> Google Maps Directions Link
                            </label>
                            <input
                                type="url"
                                placeholder="Paste Google Maps share link or directions URL..."
                                value={mapsUrlInput}
                                onChange={(e) => setMapsUrlInput(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            />
                            <p className="text-[10px] text-slate-400 font-medium pl-1">Go to Google Maps, search your business location, click "Share" or "Directions", and copy the link here.</p>
                        </div>

                        {/* Save button */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleUpdateDetails}
                                disabled={isSubmittingDetails}
                                className="btn-primary px-6 py-3 text-xs font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap no-tap-highlight"
                            >
                                {isSubmittingDetails ? "Saving Profile..." : "Save Profile Details"}
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {showAddVehicle && (
                <AddVehicleForm
                    dealerId={dealership._id}
                    onClose={() => setShowAddVehicle(false)}
                />
            )}

            {editingVehicle && (
                <EditVehicleForm
                    vehicle={editingVehicle}
                    onClose={() => setEditingVehicle(null)}
                />
            )}

            {promotingVehicle && (
                <PromotionModal
                    vehicle={promotingVehicle}
                    onClose={() => setPromotingVehicle(null)}
                />
            )}

            {showFrozenModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
                            <AlertCircle size={40} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Account Frozen</h3>
                            <p className="text-slate-500 font-medium text-sm">You need to balance your overdue invoices before you can add new listings.</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/dashboard/billing"
                                className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all no-tap-highlight"
                            >
                                Go to Billing Portal
                            </Link>
                            <button
                                onClick={() => setShowFrozenModal(false)}
                                className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all no-tap-highlight"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MobileNav />
        </main>
    );
}

/** Shared empty-state component for inventory */
function EmptyInventory({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <Car size={22} />
            </div>
            <div className="space-y-1">
                <p className="text-slate-900 font-black text-base">No vehicles listed yet</p>
                <p className="text-slate-400 text-xs font-bold">Start selling by adding your first vehicle to the inventory.</p>
            </div>
            <button
                onClick={onAdd}
                className="bg-primary-600 hover:bg-primary-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-primary-100 transition-all cursor-pointer flex items-center gap-1.5 no-tap-highlight"
            >
                <Plus size={14} /> Add Vehicle
            </button>
        </div>
    );
}

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft, Car, Tag, CheckCircle2,
    ChevronRight, Pencil, X, Loader2, MessageCircle
} from "lucide-react";

export default function MyCarPage() {
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const vehicles = useQuery(api.vehicles.getSellerVehicles);
    const updateListing = useMutation(api.vehicles.updateSellerVehicle);

    // Selected vehicle state for editing
    const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [priceInput, setPriceInput] = useState("");
    const [negotiableInput, setNegotiableInput] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isSignedIn) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                        <Car size={28} className="text-slate-400" />
                    </div>
                    <h1 className="text-xl font-black text-slate-900">Sign in to view your listings</h1>
                    <p className="text-sm text-slate-500">You need to be signed in to access your private seller portal.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold text-sm rounded-2xl hover:bg-primary-700 transition-colors">
                        Back to Home
                    </Link>
                </div>
            </main>
        );
    }

    if (vehicles === undefined) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-slate-400" />
            </main>
        );
    }

    if (!vehicles || vehicles.length === 0) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <Car size={28} className="text-slate-400" />
                </div>
                <h1 className="text-xl font-black text-slate-900">No active listings found</h1>
                <p className="text-sm text-slate-500 max-w-xs">
                    Your account doesn&apos;t have any active private listings yet. Chat with us on WhatsApp to get started.
                </p>
                <a
                    href={`https://wa.me/26773429759?text=${encodeURIComponent("Hi PulaDrive! I'd like to sell my car privately and get listed.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold text-sm rounded-2xl hover:bg-emerald-600 transition-colors"
                >
                    <MessageCircle size={17} /> Chat on WhatsApp
                </a>
                <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 font-semibold underline">
                    Back to Home
                </Link>
            </main>
        );
    }

    function openEdit(car: any) {
        setSelectedVehicle(car);
        setPriceInput(car.price.toLocaleString());
        setNegotiableInput(car.negotiable ?? false);
        setError(null);
        setSuccess(false);
        setIsEditing(true);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedVehicle) return;
        const parsed = parseInt(priceInput.replace(/[^0-9]/g, ""));
        if (!parsed || parsed <= 0) {
            setError("Please enter a valid price.");
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            await updateListing({ id: selectedVehicle._id, price: parsed, negotiable: negotiableInput });
            setSuccess(true);
            setIsEditing(false);
            setSelectedVehicle(null);
        } catch (err: any) {
            setError(err?.data?.message ?? err?.message ?? "Something went wrong.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <main className="min-h-screen pb-28 pt-6 px-4 max-w-xl mx-auto">
            {/* Back nav */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => router.back()} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-primary-600 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <h1 className="text-lg font-black text-slate-900">My Listings ({vehicles.length})</h1>
            </div>

            {success && (
                <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 font-semibold text-sm">
                    <CheckCircle2 size={16} /> Listing updated successfully!
                </div>
            )}

            <div className="space-y-4">
                {vehicles.map((car: any) => {
                    const coverImg = car.imageUrls?.[0] || "/placeholder-car.jpg";
                    return (
                        <div key={car._id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                            <div className="flex gap-4">
                                <img
                                    src={coverImg}
                                    alt={`${car.make} ${car.model}`}
                                    className="w-24 h-18 object-cover rounded-2xl border border-slate-100 shadow-sm shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Active Listing</p>
                                    <h2 className="text-lg font-black text-slate-900 truncate">{car.year} {car.make} {car.model}</h2>
                                    <p className="text-base font-black text-slate-800 pt-1">
                                        P {car.price.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => openEdit(car)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
                                >
                                    <Pencil size={13} /> Edit Price
                                </button>
                                <Link
                                    href={`/listings/${car._id}`}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all"
                                >
                                    <Tag size={13} /> Public Listing
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Support section */}
            <div className="mt-6 border-t border-slate-100 pt-6">
                <a
                    href={`https://wa.me/26773429759?text=${encodeURIComponent("Hi PulaDrive! I have a question about my private car listings.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full bg-emerald-500 text-white rounded-2xl px-5 py-4 text-sm font-bold hover:bg-emerald-600 transition-all shadow-md"
                >
                    <div className="flex items-center gap-2">
                        <MessageCircle size={16} />
                        Contact PulaDrive Support
                    </div>
                    <ChevronRight size={16} className="text-white/70" />
                </a>
            </div>

            {/* Edit modal */}
            {isEditing && selectedVehicle && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4">
                    <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Update Your Price</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
                            </div>
                            <button onClick={() => { setIsEditing(false); setSelectedVehicle(null); }} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Price (BWP)</label>
                                <input
                                    type="text"
                                    value={priceInput}
                                    onChange={(e) => {
                                        const clean = e.target.value.replace(/\D/g, "");
                                        if (!clean) {
                                            setPriceInput("");
                                            return;
                                        }
                                        setPriceInput(parseInt(clean, 10).toLocaleString());
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setNegotiableInput(!negotiableInput)}
                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border transition-all text-sm font-bold ${negotiableInput ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                            >
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${negotiableInput ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                                    {negotiableInput && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                                Price is negotiable
                            </button>

                            {error && (
                                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setSelectedVehicle(null); }}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-2xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white font-bold text-sm rounded-2xl hover:bg-primary-700 transition-colors disabled:opacity-60"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MobileNav from "@/components/navigation/MobileNav";
import CarCard from "@/components/ui/CarCard";
import { useSearchHistory, SearchEntry } from "@/hooks/useSearchHistory";
import { motion } from "framer-motion";
import {
    ChevronRight, ChevronLeft, Search, Sparkles, Car,
    Gauge, Fuel, Settings2, Palette, BadgeDollarSign, CalendarRange,
    X, Clock, Trash2, ArrowRight, MapPin,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Filters {
    budgetMin:    number | "";
    budgetMax:    number | "";
    yearMin:      number | "";
    yearMax:      number | "";
    mileageMax:   number | "";
    fuelType:     string;
    transmission: string;
    category:     string;
    color:        string;
    makeModel:    string;
}

const EMPTY: Filters = {
    budgetMin: "", budgetMax: "", yearMin: "", yearMax: "",
    mileageMax: "", fuelType: "", transmission: "", category: "",
    color: "", makeModel: "",
};

// ─── Option sets ─────────────────────────────────────────────────────────────
const CATEGORIES = [
    { value: "",          label: "Any" },
    { value: "suv",       label: "SUV" },
    { value: "sedan",     label: "Sedan" },
    { value: "hatchback", label: "Hatchback" },
    { value: "truck",     label: "Bakkie / Truck" },
    { value: "luxury",    label: "Luxury" },
    { value: "coupe",     label: "Coupe" },
    { value: "wagon",     label: "Wagon" },
    { value: "van",       label: "Van" },
];

const FUELS = [
    { value: "",         label: "Any" },
    { value: "petrol",   label: "⛽ Petrol" },
    { value: "diesel",   label: "🛢 Diesel" },
    { value: "electric", label: "⚡ Electric" },
    { value: "hybrid",   label: "🌿 Hybrid" },
];

const TRANSMISSIONS = [
    { value: "",           label: "Any" },
    { value: "automatic",  label: "Automatic" },
    { value: "manual",     label: "Manual" },
];

const COLORS = [
    { value: "",       label: "Any" },
    { value: "white",  label: "⬜ White" },
    { value: "black",  label: "⬛ Black" },
    { value: "silver", label: "🩶 Silver" },
    { value: "grey",   label: "🩶 Grey" },
    { value: "blue",   label: "🔵 Blue" },
    { value: "red",    label: "🔴 Red" },
    { value: "gold",   label: "🟡 Gold" },
    { value: "brown",  label: "🟤 Brown" },
];

// ─── Build a human-readable label ────────────────────────────────────────────
function buildLabel(f: Filters): string {
    const parts: string[] = [];
    if (f.makeModel)    parts.push(f.makeModel);
    if (f.category)     parts.push(CATEGORIES.find(c => c.value === f.category)?.label ?? f.category);
    if (f.budgetMax !== "") {
        const min = f.budgetMin !== "" ? `P${Number(f.budgetMin).toLocaleString()}` : "Any";
        parts.push(`${min}–P${Number(f.budgetMax).toLocaleString()}`);
    }
    if (f.fuelType)     parts.push(f.fuelType);
    if (f.transmission) parts.push(f.transmission);
    return parts.length ? parts.join(" · ") : "Custom Search";
}

// ─── Pill selector ────────────────────────────────────────────────────────────
function PillGroup({ options, value, onChange }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                        value === opt.value
                            ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-100"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50"
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

// ─── Steps ───────────────────────────────────────────────────────────────────
const STEPS = [
    { id: "budget",  label: "Budget",  icon: BadgeDollarSign },
    { id: "specs",   label: "Vehicle", icon: Car },
    { id: "details", label: "Details", icon: Settings2 },
    { id: "results", label: "Results", icon: Sparkles },
];

// ─── Results panel ────────────────────────────────────────────────────────────
function Results({ filters, onReset }: { filters: Filters; onReset: () => void }) {
    const args = {
        budgetMin:    filters.budgetMin    !== "" ? Number(filters.budgetMin)    : undefined,
        budgetMax:    filters.budgetMax    !== "" ? Number(filters.budgetMax)    : undefined,
        yearMin:      filters.yearMin      !== "" ? Number(filters.yearMin)      : undefined,
        yearMax:      filters.yearMax      !== "" ? Number(filters.yearMax)      : undefined,
        mileageMax:   filters.mileageMax   !== "" ? Number(filters.mileageMax)   : undefined,
        fuelType:     filters.fuelType     || undefined,
        transmission: filters.transmission || undefined,
        category:     filters.category     || undefined,
        color:        filters.color        || undefined,
        makeModel:    filters.makeModel    || undefined,
    };

    const [vehicles, setVehicles] = useState<any[] | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);

        const params = new URLSearchParams();
        Object.entries(args).forEach(([k, v]) => {
            if (v !== undefined) params.append(k, String(v));
        });

        fetch(`/api/search/advanced?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (active) {
                    setVehicles(Array.isArray(data) ? data : []);
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error(err);
                if (active) {
                    setVehicles([]);
                    setLoading(false);
                }
            });

        return () => { active = false; };
    }, [JSON.stringify(args)]);

    if (loading || vehicles === undefined) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[340px] flex flex-col items-center justify-center text-center space-y-6 p-10">
                <div className="relative w-20 h-20 flex items-center justify-center">
                    <motion.div
                        className="absolute inset-0 bg-primary-500/15 rounded-full blur-xl"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />
                    <div className="relative w-16 h-16 bg-gradient-to-tr from-primary-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg text-white">
                        <Sparkles className="animate-pulse" size={32} />
                    </div>
                </div>
                <div className="space-y-2 max-w-sm">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        Analyzing Match Criteria...
                    </h3>
                    <p className="text-sm font-medium text-slate-500">
                        Searching dealerships for matching cars and ranking the best deals for you.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                        Scanning database live
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">
                            {vehicles.length} {vehicles.length === 1 ? "Deal" : "Deals"} Found
                        </h2>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">Ranked by best match to your preferences</p>
                    </div>
                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 border border-primary-200 rounded-xl px-4 py-2 hover:bg-primary-50 transition-all"
                    >
                        <X size={14} /> New Search
                    </button>
                </div>
            </div>

            {vehicles.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center py-14 px-6 text-center space-y-6">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <div className="absolute inset-0 bg-rose-500/10 rounded-full blur-xl animate-pulse" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                            <Car size={30} className="text-white" />
                        </div>
                    </div>
                    <div className="space-y-2 max-w-sm">
                        <h3 className="text-xl font-black text-slate-900">No exact matches found</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                            Your criteria are very specific — try widening your budget or relaxing one or two filters.
                        </p>
                    </div>
                    <div className="w-full max-w-sm grid grid-cols-1 gap-2 text-left">
                        {[
                            { icon: "💰", tip: "Increase your max budget by 10–20%." },
                            { icon: "📅", tip: "Expand your model year range." },
                            { icon: "🔄", tip: "Remove the transmission or colour preference." },
                        ].map((t) => (
                            <div key={t.tip} className="flex items-start gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-lg shrink-0">{t.icon}</span>
                                <p className="text-xs font-bold text-slate-600">{t.tip}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 flex-wrap justify-center">
                        <button
                            onClick={onReset}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-white shadow-lg transition-all cursor-pointer bg-primary-600 hover:bg-primary-700"
                        >
                            <X size={16} /> Adjust & Retry
                        </button>
                        <button
                            onClick={onReset}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600 bg-white transition-all cursor-pointer"
                        >
                            Start Over
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                        {[
                            { label: "Best Match",    color: "bg-emerald-500" },
                            { label: "Good Match",    color: "bg-amber-400" },
                            { label: "Partial Match", color: "bg-slate-300" },
                        ].map((b) => (
                            <div key={b.label} className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-slate-500">
                                <span className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
                                {b.label}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {vehicles.map((car: any) => (
                            <div key={car._id} className="relative">
                                <div className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${
                                    car.matchScore >= 0.75 ? "bg-emerald-500" :
                                    car.matchScore >= 0.50 ? "bg-amber-400" : "bg-slate-400"
                                }`}>
                                    {Math.round(car.matchScore * 100)}% match
                                </div>
                                <CarCard car={car} />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Recent Searches ──────────────────────────────────────────────────────────
function RecentSearches({ onRerun }: { onRerun: (e: SearchEntry) => void }) {
    const { history, remove, clear } = useSearchHistory();
    if (history.length === 0) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-700">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Recent Searches</span>
                </div>
                <button
                    onClick={() => clear()}
                    className="text-xs text-slate-400 hover:text-rose-500 font-bold transition-colors flex items-center gap-1"
                >
                    <Trash2 size={12} /> Clear all
                </button>
            </div>
            <div className="space-y-1.5">
                {history.slice(0, 5).map((entry, i) => (
                    <div
                        key={entry._id ?? i}
                        className="flex items-center justify-between group bg-slate-50 hover:bg-primary-50 border border-slate-100 hover:border-primary-200 rounded-xl px-4 py-2.5 transition-all"
                    >
                        <button
                            onClick={() => onRerun(entry)}
                            className="flex-1 text-left flex items-center gap-2 text-slate-700 text-sm font-bold group-hover:text-primary-700 transition-colors"
                        >
                            <Search size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{entry.label}</span>
                        </button>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                                onClick={() => onRerun(entry)}
                                className="p-1.5 rounded-lg bg-slate-200 hover:bg-primary-100 text-slate-600 hover:text-primary-700 transition-all"
                                title="Re-run this search"
                            >
                                <ArrowRight size={12} />
                            </button>
                            <button
                                onClick={() => remove(entry)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all"
                                title="Remove"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdvancedSearchPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [filters, setFilters] = useState<Filters>(EMPTY);
    const [submitted, setSubmitted] = useState(false);
    const { save } = useSearchHistory();

    const set = (key: keyof Filters, val: any) =>
        setFilters((prev) => ({ ...prev, [key]: val }));

    const currentYear = new Date().getFullYear();

    async function handleSubmit() {
        const label = buildLabel(filters);
        await save({
            label,
            budgetMin:    filters.budgetMin    !== "" ? Number(filters.budgetMin)    : undefined,
            budgetMax:    filters.budgetMax    !== "" ? Number(filters.budgetMax)    : undefined,
            yearMin:      filters.yearMin      !== "" ? Number(filters.yearMin)      : undefined,
            yearMax:      filters.yearMax      !== "" ? Number(filters.yearMax)      : undefined,
            mileageMax:   filters.mileageMax   !== "" ? Number(filters.mileageMax)   : undefined,
            fuelType:     filters.fuelType     || undefined,
            transmission: filters.transmission || undefined,
            category:     filters.category     || undefined,
            color:        filters.color        || undefined,
            makeModel:    filters.makeModel    || undefined,
        });
        setSubmitted(true);
        setStep(3);
    }

    function handleReset() {
        setFilters(EMPTY);
        setSubmitted(false);
        setStep(0);
    }

    function handleRerun(entry: SearchEntry) {
        setFilters({
            budgetMin:    entry.budgetMin    ?? "",
            budgetMax:    entry.budgetMax    ?? "",
            yearMin:      entry.yearMin      ?? "",
            yearMax:      entry.yearMax      ?? "",
            mileageMax:   entry.mileageMax   ?? "",
            fuelType:     entry.fuelType     ?? "",
            transmission: entry.transmission ?? "",
            category:     entry.category     ?? "",
            color:        entry.color        ?? "",
            makeModel:    entry.makeModel    ?? "",
        });
        setSubmitted(true);
        setStep(3);
    }

    return (
        <main className="min-h-screen pb-32 bg-slate-50">

            {/* ── Header ──────────────────────────────────────────────── */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                                PulaDrive<span className="text-primary-600">.</span>
                            </h1>
                            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-primary-600 to-violet-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                                <Sparkles size={9} /> AI Deal Finder
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-primary-400" /> Gaborone, Botswana
                        </p>
                    </div>
                    {/* Step indicator mini */}
                    <div className="flex items-center gap-1.5">
                        {STEPS.map((s, i) => (
                            <div
                                key={s.id}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    i === step ? "bg-primary-600 w-5" :
                                    i < step   ? "bg-emerald-500" :
                                                 "bg-slate-200"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 pt-6 space-y-5">

                {/* ── AI accent banner ─────────────────────────────────── */}
                {!submitted && (
                    <div
                        className="relative overflow-hidden rounded-3xl px-6 py-5 text-white"
                        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)" }}
                    >
                        {/* glow orbs */}
                        <span className="absolute -top-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <span className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                        <div className="relative flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 relative shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                                    </span>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Smart Deal Finder · AI Powered</p>
                                </div>
                                <h2 className="text-xl font-black leading-snug">Find Your Perfect Match</h2>
                                <p className="text-sm text-white/70 font-medium">
                                    Tell us your budget & preferences — we rank the best deals from every dealership.
                                </p>
                            </div>
                            <div className="shrink-0 w-14 h-14 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center">
                                <Sparkles size={26} className="text-white" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Steps progress bar ────────────────────────────────── */}
                {!submitted && (
                    <div className="flex items-center gap-2">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const active = i === step;
                            const done   = i < step;
                            return (
                                <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        active ? "bg-primary-600 text-white shadow-md shadow-primary-100" :
                                        done   ? "bg-emerald-500 text-white" :
                                                 "bg-slate-200 text-slate-400"
                                    }`}>
                                        <Icon size={12} />
                                        <span className="hidden sm:block">{s.label}</span>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className={`flex-1 h-0.5 rounded-full transition-all ${done ? "bg-emerald-400" : "bg-slate-200"}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Recent searches ────────────────────────────────────── */}
                {!submitted && <RecentSearches onRerun={handleRerun} />}

                {/* ── Applied filter chips ───────────────────────────────── */}
                {!submitted && (filters.budgetMax !== "" || filters.category || filters.fuelType || filters.transmission) && (
                    <div className="flex flex-wrap gap-2">
                        {filters.budgetMax !== "" && (
                            <span className="bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full border border-primary-100">
                                Up to P{Number(filters.budgetMax).toLocaleString()}
                            </span>
                        )}
                        {filters.category && (
                            <span className="bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full border border-primary-100">
                                {CATEGORIES.find(c => c.value === filters.category)?.label}
                            </span>
                        )}
                        {filters.fuelType && (
                            <span className="bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full border border-primary-100">
                                {filters.fuelType}
                            </span>
                        )}
                        {filters.transmission && (
                            <span className="bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full border border-primary-100">
                                {filters.transmission}
                            </span>
                        )}
                    </div>
                )}

                {/* ── Form / Results ─────────────────────────────────────── */}
                {!submitted ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

                        {/* Step 0 — Budget */}
                        {step === 0 && (
                            <div className="p-6 sm:p-8 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                        <BadgeDollarSign className="text-primary-600" size={26} />
                                        What&apos;s your budget?
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">Set a price range in Pula (BWP)</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5">Minimum (BWP)</label>
                                        <input type="number" placeholder="e.g. 50,000"
                                            className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            value={filters.budgetMin}
                                            onChange={(e) => set("budgetMin", e.target.value === "" ? "" : Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5">Maximum (BWP)</label>
                                        <input type="number" placeholder="e.g. 250,000"
                                            className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            value={filters.budgetMax}
                                            onChange={(e) => set("budgetMax", e.target.value === "" ? "" : Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Quick Select</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: "Under P100k",  min: 0,      max: 100000  },
                                            { label: "P100k–200k",   min: 100000, max: 200000  },
                                            { label: "P200k–400k",   min: 200000, max: 400000  },
                                            { label: "P400k–700k",   min: 400000, max: 700000  },
                                            { label: "P700k+",       min: 700000, max: 9999999 },
                                        ].map((chip) => (
                                            <button key={chip.label}
                                                onClick={() => { set("budgetMin", chip.min); set("budgetMax", chip.max); }}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                                                    filters.budgetMin === chip.min && filters.budgetMax === chip.max
                                                        ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-100"
                                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-primary-300 hover:bg-primary-50"
                                                }`}
                                            >
                                                {chip.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
                                        <CalendarRange size={12} /> Year Range
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="number" placeholder="From (e.g. 2015)" min={1990} max={currentYear}
                                            className="border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            value={filters.yearMin}
                                            onChange={(e) => set("yearMin", e.target.value === "" ? "" : Number(e.target.value))}
                                        />
                                        <input type="number" placeholder={`To (e.g. ${currentYear})`} min={1990} max={currentYear + 1}
                                            className="border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            value={filters.yearMax}
                                            onChange={(e) => set("yearMax", e.target.value === "" ? "" : Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 1 — Vehicle */}
                        {step === 1 && (
                            <div className="p-6 sm:p-8 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                        <Car className="text-primary-600" size={26} />
                                        What kind of vehicle?
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">Choose a body type and any make/model preference</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Body Type</label>
                                    <PillGroup options={CATEGORIES} value={filters.category} onChange={(v) => set("category", v)} />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5">Make or Model (optional)</label>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" placeholder="e.g. Toyota, BMW 3 Series, Polo…"
                                            className="w-full border border-slate-200 rounded-xl py-3 pl-9 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            value={filters.makeModel}
                                            onChange={(e) => set("makeModel", e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                                        <Gauge size={12} /> Max Mileage (km)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: "Any",     val: "" },
                                            { label: "< 30k",  val: 30000 },
                                            { label: "< 60k",  val: 60000 },
                                            { label: "< 100k", val: 100000 },
                                            { label: "< 150k", val: 150000 },
                                        ].map((chip) => (
                                            <button key={chip.label}
                                                onClick={() => set("mileageMax", chip.val)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                                                    filters.mileageMax === chip.val
                                                        ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-100"
                                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-primary-300 hover:bg-primary-50"
                                                }`}
                                            >
                                                {chip.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2 — Details */}
                        {step === 2 && (
                            <div className="p-6 sm:p-8 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                        <Settings2 className="text-primary-600" size={26} />
                                        Any specific preferences?
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">Optional — the more you tell us, the better we match.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                                        <Fuel size={12} /> Fuel Type
                                    </label>
                                    <PillGroup options={FUELS} value={filters.fuelType} onChange={(v) => set("fuelType", v)} />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Transmission</label>
                                    <PillGroup options={TRANSMISSIONS} value={filters.transmission} onChange={(v) => set("transmission", v)} />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                                        <Palette size={12} /> Colour Preference
                                    </label>
                                    <PillGroup options={COLORS} value={filters.color} onChange={(v) => set("color", v)} />
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex justify-between gap-4 border-t border-slate-100 pt-5">
                            {step > 0 ? (
                                <button onClick={() => setStep(step - 1)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all cursor-pointer">
                                    <ChevronLeft size={18} /> Back
                                </button>
                            ) : <div />}

                            {step < 2 ? (
                                <button onClick={() => setStep(step + 1)}
                                    className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 ml-auto cursor-pointer">
                                    Next <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button onClick={handleSubmit}
                                    className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white transition-all shadow-lg ml-auto cursor-pointer"
                                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                                    <Sparkles size={18} /> Find My Deal
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <Results filters={filters} onReset={handleReset} />
                )}
            </div>

            <MobileNav />
        </main>
    );
}

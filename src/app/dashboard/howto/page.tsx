"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    ChevronLeft, Sparkles, HelpCircle, Plus, Flame, 
    CreditCard, ArrowRight, CheckCircle2, Image as ImageIcon, 
    DollarSign, FileText, ExternalLink, Play
} from "lucide-react";
import MobileNav from "@/components/navigation/MobileNav";

type DocTopic = "listing" | "promotion" | "invoices";

export default function HowToPage() {
    const router = useRouter();
    const [activeTopic, setActiveTopic] = useState<DocTopic>("listing");

    const topics: { id: DocTopic; title: string; desc: string; icon: any }[] = [
        { 
            id: "listing", 
            title: "1. Add a Listing", 
            desc: "Learn how to get your vehicles online", 
            icon: Plus 
        },
        { 
            id: "promotion", 
            title: "2. Promote Listings", 
            desc: "Boost visibility and speed up sales", 
            icon: Flame 
        },
        { 
            id: "invoices", 
            title: "3. Manage Invoices", 
            desc: "Track billing history & get invoices", 
            icon: CreditCard 
        },
    ];

    return (
        <main className="min-h-screen pb-32 bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-4 lg:px-8 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all no-tap-highlight"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Dealer Portal</h1>
                            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-primary-100">
                                <HelpCircle size={10} /> Guide
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Body */}
            <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-8">
                
                {/* Intro Hero Banner */}
                <div className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8 text-white"
                     style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)" }}>
                    <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative space-y-3 max-w-xl">
                        <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white">
                            Documentation
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black leading-tight">Interactive Dealer Guides</h2>
                        <p className="text-sm text-sky-100 font-medium leading-relaxed">
                            Master the PulaDrive dealer interface. Select a topic below for interactive step-by-step tutorials, live interface mockups, and walkthroughs.
                        </p>
                    </div>
                </div>

                {/* Topic Selector Tabs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {topics.map((topic) => {
                        const Icon = topic.icon;
                        const active = activeTopic === topic.id;
                        return (
                            <button
                                key={topic.id}
                                onClick={() => setActiveTopic(topic.id)}
                                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 no-tap-highlight ${
                                    active
                                        ? "bg-white border-primary-500 shadow-md ring-2 ring-primary-500/10"
                                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                            >
                                <div className={`p-2.5 rounded-xl shrink-0 ${
                                    active ? "bg-primary-50 text-primary-600" : "bg-slate-50 text-slate-400"
                                }`}>
                                    <Icon size={18} />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className={`text-sm font-black ${active ? "text-slate-900" : "text-slate-700"}`}>
                                        {topic.title}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-semibold leading-tight">
                                        {topic.desc}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Guides Container */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
                    {activeTopic === "listing" && <AddListingGuide />}
                    {activeTopic === "promotion" && <PromotionGuide />}
                    {activeTopic === "invoices" && <InvoiceGuide />}
                </div>

                {/* Back Link to Dashboard */}
                <div className="flex justify-center pt-4">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors no-tap-highlight"
                    >
                        <ChevronLeft size={16} /> Back to Dealer Dashboard
                    </Link>
                </div>
            </div>

            <MobileNav />
        </main>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ADD LISTING GUIDE
   ────────────────────────────────────────────────────────────────────────── */
function AddListingGuide() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Plus className="text-primary-600 shrink-0" size={24} />
                    How to Add a New Listing
                </h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Get your vehicle live on Botswana&apos;s digital car marketplace in 5 simple steps.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Steps Stepper */}
                <div className="lg:col-span-6 space-y-6">
                    {[
                        {
                            step: "1",
                            title: "Find the Add Button",
                            desc: "Click the '+ Add Vehicle' button in the dashboard portal header or under the inventory list."
                        },
                        {
                            step: "2",
                            title: "Enter Vehicle Specs",
                            desc: "Fill in the required fields: Year, Make, Model, Price (in BWP), Fuel Type, Transmission, Mileage, Engine Size, and Color."
                        },
                        {
                            step: "3",
                            title: "Write a Good Description",
                            desc: "Write details about vehicle condition, history (e.g. imported from Japan, full service history), and dealership specs."
                        },
                        {
                            step: "4",
                            title: "Upload High-Quality Images",
                            desc: "Drag & drop up to 10 pictures of the exterior and interior. Clear images increase dealer inquiries by 3x."
                        },
                        {
                            step: "5",
                            title: "Save and Publish",
                            desc: "Click 'Create Listing' to publish the vehicle. It will instantly appear on the PulaDrive search catalog."
                        }
                    ].map((item) => (
                        <div key={item.step} className="flex gap-4">
                            <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 text-xs font-black flex items-center justify-center shrink-0 border border-primary-100 mt-0.5">
                                {item.step}
                            </span>
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-slate-800 leading-none">{item.title}</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Interactive Simulated Interface Mockup (Screenshot Alternative) */}
                <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    {/* Mock Browser Header */}
                    <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                        <div className="flex gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 select-none tracking-tight truncate flex-1 text-center bg-white/70 rounded py-0.5 max-w-xs mx-auto">
                            puladrive.com/dashboard/add
                        </span>
                    </div>

                    {/* Mock Page Form */}
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                            <h4 className="text-xs font-black text-slate-800">New Listing Form</h4>
                            <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-200 px-1.5 py-0.5 rounded">Active Draft</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-bold">
                            <div className="space-y-1">
                                <label className="text-[8px] uppercase tracking-wider text-slate-400 block">Make *</label>
                                <div className="border border-slate-200 bg-white px-2 py-1.5 rounded-lg text-slate-800">Toyota</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] uppercase tracking-wider text-slate-400 block">Model *</label>
                                <div className="border border-slate-200 bg-white px-2 py-1.5 rounded-lg text-slate-800">Corolla Quest</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] uppercase tracking-wider text-slate-400 block">Price (BWP) *</label>
                                <div className="border border-slate-200 bg-white px-2 py-1.5 rounded-lg text-primary-700 font-black">165,000</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] uppercase tracking-wider text-slate-400 block">Year *</label>
                                <div className="border border-slate-200 bg-white px-2 py-1.5 rounded-lg text-slate-800">2021</div>
                            </div>
                        </div>

                        {/* Mock Image Uploader Dropzone */}
                        <div className="border-2 border-dashed border-slate-350 bg-white/80 rounded-xl p-4 text-center space-y-1.5 cursor-pointer hover:bg-white transition-colors">
                            <ImageIcon className="text-slate-400 mx-auto" size={20} />
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Drag Vehicle Photos Here</div>
                            <div className="text-[8px] text-slate-400 font-medium">PNG, JPG up to 10MB</div>
                        </div>

                        {/* Mock Publish button */}
                        <div className="flex justify-end">
                            <button className="bg-primary-600 text-white font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-lg shadow-md shadow-primary-100 flex items-center gap-1 cursor-default">
                                <CheckCircle2 size={10} /> Create Listing
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROMOTION GUIDE
   ────────────────────────────────────────────────────────────────────────── */
function PromotionGuide() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Flame className="text-primary-600 shrink-0" size={24} />
                    How to Promote a Listing
                </h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Get up to 10x more visibility by placing cars in featured placement slots.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Steps Stepper */}
                <div className="lg:col-span-6 space-y-6">
                    {[
                        {
                            step: "1",
                            title: "Locate Your Vehicle",
                            desc: "Scroll to your active inventory list on the main Dealer Portal dashboard."
                        },
                        {
                            step: "2",
                            title: "Click 'Promote'",
                            desc: "Click the 'Promote' button next to the vehicle status. It will show how many slots your dealership has available."
                        },
                        {
                            step: "3",
                            title: "Select Placement Slot",
                            desc: "Select an available slot option inside the promotion modal. The modal will highlight the active slot's expiry date."
                        },
                        {
                            step: "4",
                            title: "Submit and Activate",
                            desc: "Click 'Promote Listing'. The vehicle is immediately boosted and featured in the homepage carousel."
                        }
                    ].map((item) => (
                        <div key={item.step} className="flex gap-4">
                            <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 text-xs font-black flex items-center justify-center shrink-0 border border-primary-100 mt-0.5">
                                {item.step}
                            </span>
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-slate-800 leading-none">{item.title}</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Interactive Simulated Interface Mockup (Screenshot Alternative) */}
                <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    {/* Mock Browser Header */}
                    <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                        <div className="flex gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 select-none tracking-tight truncate flex-1 text-center bg-white/70 rounded py-0.5 max-w-xs mx-auto">
                            Modal Overlay Interface
                        </span>
                    </div>

                    {/* Mock Promotion Modal */}
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800">
                            <Flame className="text-indigo-600" size={16} />
                            <h4 className="text-xs font-black leading-none">Promote Vehicle Listing</h4>
                        </div>
                        
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Select Available Slot</p>
                        
                        {/* Slot Options UI Grid */}
                        <div className="space-y-2">
                            <div className="border-2 border-indigo-500 bg-indigo-50/50 p-2.5 rounded-xl flex items-center justify-between text-[10px]">
                                <div className="space-y-0.5">
                                    <span className="font-black text-indigo-700 block leading-none">Active Premium Slot #1</span>
                                    <span className="text-[8px] text-slate-400 font-semibold block">Expires in 7 days (July 20, 2026)</span>
                                </div>
                                <span className="text-[8px] font-black uppercase text-white bg-indigo-600 px-1.5 py-0.5 rounded-md">Selected</span>
                            </div>

                            <div className="border border-slate-200 bg-white p-2.5 rounded-xl flex items-center justify-between text-[10px] opacity-60">
                                <div className="space-y-0.5 text-slate-500">
                                    <span className="font-black block leading-none">Premium Slot #2</span>
                                    <span className="text-[8px] text-slate-400 font-semibold block">Not currently active (Buy slots in Billing)</span>
                                </div>
                                <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">Empty</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1.5 text-[9px] font-black uppercase tracking-widest">
                            <button className="border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500 cursor-default bg-white">Cancel</button>
                            <button className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-1.5 rounded-lg shadow-md shadow-indigo-100 flex items-center gap-1 cursor-default">
                                Promote Listing
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   INVOICE GUIDE
   ────────────────────────────────────────────────────────────────────────── */
function InvoiceGuide() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <CreditCard className="text-primary-600 shrink-0" size={24} />
                    How to Manage Invoices
                </h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Keep track of subscription bills, view paid receipts, and clear pending dues.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Steps Stepper */}
                <div className="lg:col-span-6 space-y-6">
                    {[
                        {
                            step: "1",
                            title: "Access the Billing Portal",
                            desc: "Click the 'Billing' button located in the top-right header section of the Dealer Portal."
                        },
                        {
                            step: "2",
                            title: "Review Slot Plan & Usage",
                            desc: "Here you can view your active premium slots subscription plan, pricing details, and monthly cycle renewal date."
                        },
                        {
                            step: "3",
                            title: "Find Invoice History",
                            desc: "Scroll to the bottom to find the 'Invoices History' table listing all generated bills."
                        },
                        {
                            step: "4",
                            title: "View or Settle Invoices",
                            desc: "Click 'View Invoice' to download or print PDF receipts. If your account is frozen due to outstanding dues, click 'Pay Now' to settle via Card."
                        }
                    ].map((item) => (
                        <div key={item.step} className="flex gap-4">
                            <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 text-xs font-black flex items-center justify-center shrink-0 border border-primary-100 mt-0.5">
                                {item.step}
                            </span>
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-slate-800 leading-none">{item.title}</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Interactive Simulated Interface Mockup (Screenshot Alternative) */}
                <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    {/* Mock Browser Header */}
                    <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                        <div className="flex gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 select-none tracking-tight truncate flex-1 text-center bg-white/70 rounded py-0.5 max-w-xs mx-auto">
                            puladrive.com/dashboard/billing
                        </span>
                    </div>

                    {/* Mock Invoice Table UI */}
                    <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <h4 className="text-xs font-black text-slate-800">Invoice History</h4>
                            <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-200 px-1.5 py-0.5 rounded">All Years</span>
                        </div>
                        
                        <div className="space-y-2 text-[10px]">
                            {/* Paid Invoice Mock */}
                            <div className="bg-white border border-slate-150 p-2.5 rounded-xl flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-black text-slate-800">Invoice #PD-1082</span>
                                        <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1 py-0.2 rounded-md">Paid</span>
                                    </div>
                                    <span className="text-[8px] text-slate-400 font-semibold block">Issued: July 01, 2026</span>
                                </div>
                                <div className="text-right space-y-1">
                                    <span className="font-black text-slate-800 block leading-none">P 250.00</span>
                                    <span className="text-[8px] text-primary-600 font-bold block hover:underline cursor-default">View Receipt →</span>
                                </div>
                            </div>

                            {/* Overdue Invoice Mock */}
                            <div className="bg-white border border-rose-100 p-2.5 rounded-xl flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-black text-slate-800">Invoice #PD-1054</span>
                                        <span className="text-[8px] font-black bg-rose-100 text-rose-700 px-1 py-0.2 rounded-md">Overdue</span>
                                    </div>
                                    <span className="text-[8px] text-slate-400 font-semibold block">Issued: June 01, 2026</span>
                                </div>
                                <div className="text-right space-y-1">
                                    <span className="font-black text-rose-600 block leading-none">P 250.00</span>
                                    <span className="text-[8px] text-rose-600 font-bold block hover:underline cursor-default">Pay Now →</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

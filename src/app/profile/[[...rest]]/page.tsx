"use client";

import { UserProfile } from "@clerk/nextjs";
import MobileNav from "@/components/navigation/MobileNav";
import { ChevronLeft, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-slate-50 pb-32">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-4 py-6 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-600"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Account Settings</h1>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Manage your PulaDrive profile</p>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
                <div className="max-w-4xl mx-auto flex justify-end">
                    <Link
                        href="/favorites"
                        className="flex items-center gap-2 bg-white border border-slate-100 hover:border-slate-200 shadow-sm px-6 py-3 rounded-2xl text-sm font-bold text-slate-700 transition-all hover:text-rose-500"
                    >
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" /> My Favorites
                    </Link>
                </div>
                <div className="flex justify-center">
                    <UserProfile
                        path="/profile"
                        routing="path"
                        appearance={{
                            elements: {
                                rootBox: "w-full shadow-none",
                                card: "shadow-none border-0 bg-transparent p-0",
                                navbar: "hidden md:flex bg-white rounded-3xl border border-slate-100 p-4 mr-8",
                                pageScrollBox: "p-0",
                                headerTitle: "text-2xl font-black text-slate-900",
                                headerSubtitle: "text-slate-500 font-medium",
                                profileSectionTitleText: "text-sm font-black text-slate-900 uppercase tracking-widest",
                                profileSectionContent: "bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm mb-6",
                                userPreviewSecondaryIdentifier: "text-slate-400 font-medium",
                                formButtonPrimary: "bg-primary-600 hover:bg-primary-700 text-sm font-black rounded-2xl py-3 px-6 shadow-lg shadow-primary-100 transition-all",
                                breadcrumbsBase: "hidden",
                            }
                        }}
                    />
                </div>
            </div>

            <MobileNav />
        </main>
    );
}

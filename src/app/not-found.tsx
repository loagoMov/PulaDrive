"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, Compass, Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-12 text-center font-sans">
            {/* Animated Car Icon or Illustration */}
            <div className="relative mb-8 flex justify-center items-center">
                <div className="absolute w-24 h-24 bg-primary-100 rounded-full animate-ping opacity-25"></div>
                <div className="absolute w-32 h-32 bg-primary-50 rounded-full animate-pulse opacity-40"></div>
                <div className="relative z-10 p-6 bg-white border border-slate-100 shadow-xl rounded-2xl text-primary-600">
                    <Car size={64} className="animate-bounce" style={{ animationDuration: '3s' }} />
                </div>
            </div>

            {/* Error Message */}
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">
                Wrong Turn!
            </h1>
            <p className="text-xl font-bold text-slate-700 mb-2">
                404 - Page Not Found
            </p>
            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed mb-8">
                The road you are looking for doesn't exist, was moved, or has been closed. Let's get you back on track to finding your next vehicle.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
                <button
                    onClick={() => router.back()}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm text-sm transition-all"
                >
                    <ArrowLeft size={16} />
                    Go Back
                </button>
                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg text-sm transition-all"
                >
                    <Home size={16} />
                    Back to Showroom
                </Link>
            </div>

            {/* Quick Links */}
            <div className="mt-12 pt-8 border-t border-slate-200/60 w-full max-w-sm flex items-center justify-around text-xs font-semibold text-slate-400">
                <Link href="/search" className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                    <Search size={14} /> Browse Cars
                </Link>
                <span className="text-slate-300">•</span>
                <Link href="/dealers" className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                    <Compass size={14} /> Dealerships
                </Link>
            </div>
        </div>
    );
}

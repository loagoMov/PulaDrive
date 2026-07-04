"use client";

import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-6">
            <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-xl">
                    <Loader2 size={32} className="text-primary-600 animate-spin" />
                </div>
            </div>
            <div className="text-center space-y-2">
                <p className="text-xl font-black text-slate-900 tracking-tight">
                    PulaDrive<span className="text-primary-600">.</span>
                </p>
                <p className="text-xs font-semibold text-slate-400 animate-pulse">
                    Loading Botswana's premier digital car marketplace...
                </p>
            </div>
        </div>
    );
}

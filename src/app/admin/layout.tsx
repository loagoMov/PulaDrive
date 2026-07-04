"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Loader2, Shield } from "lucide-react";
import MobileNav from "@/components/navigation/MobileNav";

/**
 * Layout guard for all /admin/* routes.
 *
 * Layer 1 (middleware.ts) already ensures the user is authenticated via Clerk.
 * This layout provides Layer 2: verify the authenticated user is a global admin
 * by checking the Convex `checkGlobalAdmin` query against GLOBAL_ADMIN_EMAILS.
 * Any authenticated non-admin sees "Access Denied" and cannot reach any admin page.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoaded } = useUser();
    const isGlobalAdmin = useQuery(api.dealerships.checkGlobalAdmin);

    // Show spinner while Clerk and Convex are loading
    if (!isLoaded || isGlobalAdmin === undefined) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
        );
    }

    // Authenticated but NOT a global admin → access denied
    if (!isGlobalAdmin) {
        const userEmail = user?.primaryEmailAddress?.emailAddress;
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                        <Shield size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Denied</h2>
                        <p className="text-slate-500 font-medium text-sm">
                            Only registered PulaDrive global administrators can access this control panel.
                        </p>
                    </div>
                    <div className="pt-2">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Signed in as:{" "}
                            <span className="text-slate-600 lowercase">{userEmail || "Guest"}</span>
                        </p>
                    </div>
                </div>
                <MobileNav />
            </div>
        );
    }

    // ✅ Verified global admin — render the admin page
    return <>{children}</>;
}

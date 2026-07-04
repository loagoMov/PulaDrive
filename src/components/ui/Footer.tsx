"use client";

import Link from "next/link";
import { MapPin, Shield } from "lucide-react";
import { useAuth, useUser, useOrganizationList } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Footer() {
    const { orgId, isLoaded: orgLoaded } = useAuth();
    const { user, isLoaded: userLoaded } = useUser();
    const { userMemberships, isLoaded: isMembershipsLoaded } = useOrganizationList({
        userMemberships: true,
    });
    const isGlobalAdmin = useQuery(api.dealerships.checkGlobalAdmin);

    const emailSubject = encodeURIComponent("PulaDrive Dealer Account Application");
    const emailBody = encodeURIComponent(
        `Hello PulaDrive Team,\n\nI would like to apply for a dealer account on PulaDrive.\n\nMy Details:\n- Name: ${user?.fullName || ""}\n- Dealership/Company Name: \n- Contact Phone: \n- Account Email: ${user?.primaryEmailAddress?.emailAddress || ""}\n\nThank you.`
    );
    const mailtoLink = `mailto:loagomontsho@icloud.com?subject=${emailSubject}&body=${emailBody}`;

    return (
        <footer className="border-t border-slate-100 bg-white mt-16">
            <div className="max-w-7xl mx-auto px-4 py-10 lg:px-8">
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
                    {/* Brand */}
                    <div className="space-y-2">
                        <p className="text-xl font-black text-slate-900 tracking-tight">
                             PulaDrive<span className="text-primary-600">.</span>
                        </p>
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                            <MapPin size={13} className="text-primary-500 shrink-0" />
                            Gaborone, Botswana
                        </p>
                        <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed">
                            Botswana's premier digital car marketplace — connecting buyers with trusted dealerships.
                        </p>
                    </div>

                    {/* Link columns */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Platform</p>
                            <div className="space-y-2">
                                <Link href="/search" className="block font-medium text-slate-600 hover:text-primary-600 transition-colors">Browse Cars</Link>
                                <Link href="/search/advanced" className="block font-medium text-slate-600 hover:text-primary-600 transition-colors">AI Deal Finder</Link>
                                <Link href="/dealers" className="block font-medium text-slate-600 hover:text-primary-600 transition-colors">Dealerships</Link>
                                <Link href="/favorites" className="block font-medium text-slate-600 hover:text-primary-600 transition-colors">My Favourites</Link>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dealers</p>
                            <div className="space-y-2">
                                {isGlobalAdmin || (userLoaded && user && isMembershipsLoaded && userMemberships.data && userMemberships.data.length > 0) ? (
                                    <>
                                        <Link href="/dashboard" className="block font-medium text-slate-600 hover:text-primary-600 transition-colors">Dealer Portal</Link>
                                        <Link href="/dashboard/analytics" className="block font-medium text-slate-600 hover:text-primary-600 transition-colors">Analytics</Link>
                                    </>
                                ) : (
                                    <a href={mailtoLink} className="block font-medium text-slate-600 hover:text-primary-600 transition-colors">
                                        Register as a Dealer
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legal</p>
                            <div className="space-y-2">
                                <Link href="/legal/privacy" className="block font-medium text-slate-600 hover:text-primary-600 transition-colors">Privacy Policy</Link>
                                <Link href="/legal/terms" className="block font-medium text-slate-600 hover:text-primary-600 transition-colors">Terms of Use</Link>
                                <Link href="/legal/compliance" className="block font-medium text-slate-600 hover:text-primary-600 transition-colors">Data & Compliance</Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs text-slate-400 font-medium">
                        © 2026 PulaDrive (Pty) Ltd. All rights reserved. Built in 🇧🇼 Botswana.
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Shield size={12} className="text-emerald-500" />
                        Verified Dealerships · Secure Platform
                    </div>
                </div>
            </div>
        </footer>
    );
}

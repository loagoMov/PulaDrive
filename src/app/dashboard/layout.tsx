"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useOrganization, useOrganizationList, OrganizationList, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Loader2, Building2, Shield } from "lucide-react";
import MobileNav from "@/components/navigation/MobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoaded: isUserLoaded } = useUser();
    const { organization, isLoaded: isOrgLoaded } = useOrganization();
    const { userMemberships, isLoaded: isMembershipsLoaded, setActive } = useOrganizationList({
        userMemberships: true,
    });
    
    const [syncError, setSyncError] = useState<string | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);

    const dealership = useQuery(api.dealerships.getByClerkOrgId, organization ? { clerkOrgId: organization.id } : "skip");
    const isGlobalAdmin = useQuery(api.dealerships.checkGlobalAdmin);
    const createDealership = useMutation(api.dealerships.create);

    // Auto-select the organization if the user has exactly 1 and none is selected currently.
    useEffect(() => {
        if (isMembershipsLoaded && !organization && userMemberships.data?.length === 1) {
            setActive({ organization: userMemberships.data[0].organization.id });
        }
    }, [isMembershipsLoaded, organization, userMemberships, setActive]);

    // NOTE: We intentionally do NOT auto-create the dealership here.
    // Auto-creating caused deleted dealerships to be silently resurrected on every
    // dashboard load. Creation is now explicit via the "Register Dealership" button below.

    const handleRegisterDealership = async () => {
        if (!organization) return;
        setIsRegistering(true);
        setSyncError(null);
        try {
            await createDealership({
                name: organization.name,
                location: "Gaborone, Botswana",
                slug: organization.slug || organization.id,
                clerkOrgId: organization.id,
                logoUrl: organization.imageUrl,
            });
        } catch (error: any) {
            console.error("Dealership registration failed", error);
            setSyncError(error?.message || "An error occurred while registering your dealership.");
        } finally {
            setIsRegistering(false);
        }
    };

    // 1. Loading State
    if (!isUserLoaded || !isOrgLoaded || isGlobalAdmin === undefined) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
        );
    }

    // 1.5. Access Denied State (User has no dealership organizations and is not a global admin)
    if (!isGlobalAdmin && isMembershipsLoaded && (!userMemberships.data || userMemberships.data.length === 0)) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                        <Shield size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Denied</h2>
                        <p className="text-slate-500 font-medium text-sm">
                            The Dealer Portal is restricted to verified dealerships. To gain access, you must be invited to a Dealership organization by an administrator.
                        </p>
                    </div>
                    <div className="pt-4 flex flex-col gap-3">
                        <a
                            href={`mailto:loagomontsho@icloud.com?subject=PulaDrive%20Dealership%20Access%20Request`}
                            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all text-sm block"
                        >
                            Request Verification / Invitation
                        </a>
                    </div>
                </div>
                <MobileNav />
            </div>
        );
    }

    // 2. Setup Required State (No organization selected)
    if (!organization) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-md w-full space-y-6">
                    <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto">
                        <Building2 className="text-primary-600" size={40} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dealer Setup Required</h2>
                        <p className="text-slate-500 font-medium text-sm">
                            To list cars on PulaDrive, you must be invited to a Dealership organization by an administrator.
                        </p>
                    </div>

                    <div className="pt-4 flex flex-col gap-6">
                        <OrganizationList
                            hidePersonal={true}
                            afterSelectOrganizationUrl="/dashboard"
                            afterCreateOrganizationUrl="/dashboard"
                            appearance={{
                                elements: {
                                    rootBox: "w-full flex justify-center",
                                }
                            }}
                        />

                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest pt-2">
                            To view your new dealership, please accept any pending invites or create a new one above.
                        </p>
                    </div>
                </div>
                <MobileNav />
            </div>
        );
    }

    // 3. Dealership not found in Convex — show explicit registration prompt
    if (dealership === null) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto">
                        <Building2 className="text-amber-500" size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dealership Not Found</h2>
                        <p className="text-slate-500 font-medium text-sm">
                            The PulaDrive profile for <span className="font-black text-slate-800">{organization.name}</span> doesn&apos;t exist yet in our system.
                            Click below to register it.
                        </p>
                    </div>
                    {syncError && (
                        <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2">{syncError}</p>
                    )}
                    <button
                        onClick={handleRegisterDealership}
                        disabled={isRegistering}
                        className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
                    >
                        {isRegistering ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
                        ) : (
                            "Register Dealership on PulaDrive"
                        )}
                    </button>
                </div>
                <MobileNav />
            </div>
        );
    }

    // 4. Still loading dealership from Convex
    if (dealership === undefined) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4 mx-auto" />
                <h2 className="text-xl font-bold text-slate-900">Loading dealership...</h2>
            </div>
        );
    }

    // 4. Authorization / Access Control Guard
    const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
    const isAuthorizedDealer = !dealership.authorizedEmails || dealership.authorizedEmails.includes(userEmail);

    if (!isGlobalAdmin && !isAuthorizedDealer) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                        <Shield size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Denied</h2>
                        <p className="text-slate-500 font-medium text-sm">
                            Your account belongs to this organization, but your email address is not registered in the dealership&apos;s authorized admin list.
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl text-left border border-slate-100 space-y-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Authorized Administrators:</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {dealership.authorizedEmails?.map((email: string) => (
                                <span key={email} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
                                    {email}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="pt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Signed in as: <span className="lowercase text-slate-600">{userEmail || "Guest"}</span>
                    </div>
                </div>
                <MobileNav />
            </div>
        );
    }

    // 5. Authorized Access granted
    return <>{children}</>;
}

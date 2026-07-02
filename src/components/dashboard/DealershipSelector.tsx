"use client";

import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Building2, Check, Plus, Loader2 } from "lucide-react";
import Image from "next/image";

export default function DealershipSelector() {
    const { organization, isLoaded: isOrgLoaded } = useOrganization();
    const { userMemberships, isLoaded: isListLoaded, setActive } = useOrganizationList({
        userMemberships: true,
    });

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isOrgLoaded || !isListLoaded || !organization) {
        return (
            <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span className="text-xs font-medium">Loading dealerships...</span>
            </div>
        );
    }

    const memberships = userMemberships.data || [];
    const hasMultiple = memberships.length > 1;

    const handleSelect = async (orgId: string) => {
        if (orgId === organization.id) return;
        setIsOpen(false);
        await setActive({ organization: orgId });
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                onClick={() => hasMultiple && setIsOpen(!isOpen)}
                disabled={!hasMultiple}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl text-left transition-all duration-200 ${
                    hasMultiple
                        ? "hover:bg-slate-100/80 active:scale-[0.98] cursor-pointer"
                        : "cursor-default"
                }`}
            >
                <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                    {organization.imageUrl ? (
                        <Image
                            src={organization.imageUrl}
                            alt={organization.name}
                            fill
                            sizes="32px"
                            className="object-cover"
                        />
                    ) : (
                        <Building2 className="w-4 h-4 text-primary-500" />
                    )}
                </div>
                <div className="min-w-0 pr-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Dealership</p>
                    <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">
                            {organization.name}
                        </span>
                        {hasMultiple && (
                            <ChevronDown
                                className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0 ${
                                    isOpen ? "rotate-180" : ""
                                }`}
                            />
                        )}
                    </div>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && hasMultiple && (
                <div className="absolute left-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl z-50 py-2.5 overflow-hidden origin-top-left animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 pb-2 mb-2 border-b border-slate-100">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Switch Dealership</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1 px-1.5">
                        {memberships.map((membership) => {
                            const org = membership.organization;
                            const isCurrent = org.id === organization.id;

                            return (
                                <button
                                    key={org.id}
                                    onClick={() => handleSelect(org.id)}
                                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left transition-all duration-150 ${
                                        isCurrent
                                            ? "bg-primary-50/50 text-primary-950 font-bold"
                                            : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                                            {org.imageUrl ? (
                                                <Image
                                                    src={org.imageUrl}
                                                    alt={org.name}
                                                    fill
                                                    sizes="28px"
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                            )}
                                        </div>
                                        <span className="text-xs font-bold truncate">{org.name}</span>
                                    </div>
                                    {isCurrent && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

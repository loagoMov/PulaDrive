"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Store, LayoutDashboard, Shield } from "lucide-react";
import { useAuth, SignInButton, useUser, UserButton, useOrganizationList } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function MobileNav() {
    const { isSignedIn, isLoaded: authLoaded } = useAuth();
    const { user } = useUser();
    const { userMemberships, isLoaded: isMembershipsLoaded } = useOrganizationList({
        userMemberships: true,
    });
    const isGlobalAdmin = useQuery(api.dealerships.checkGlobalAdmin);
    const pathname = usePathname();

    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        let lastScrollY = window.scrollY;
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            // Collapse on scroll down past threshold, expand on scroll up
            if (currentScrollY > 80 && currentScrollY > lastScrollY) {
                setIsMinimized(true);
            } else if (currentScrollY < lastScrollY - 8 || currentScrollY <= 30) {
                setIsMinimized(false);
            }
            lastScrollY = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const hasMemberships = isMembershipsLoaded && userMemberships.data && userMemberships.data.length > 0;
    const canAccessDealer = isGlobalAdmin || (isSignedIn && hasMemberships);

    const tabs = [
        { href: "/", icon: Home, label: "Home", exact: true },
        { href: "/search", icon: Search, label: "Search" },
        { href: "/dealers", icon: Store, label: "Dealers" },
        ...(authLoaded && canAccessDealer ? [{ href: "/dashboard", icon: LayoutDashboard, label: "My Dealer" }] : []),
        ...(isGlobalAdmin ? [{ href: "/admin", icon: Shield, label: "Admin" }] : []),
    ];

    const activeTab = tabs.find(t => t.exact ? pathname === t.href : pathname?.startsWith(t.href)) ?? tabs[0];
    const ActiveIcon = activeTab.icon;

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full glass-nav flex items-center justify-center z-50 transition-all duration-300 ease-out shadow-lg hover:scale-105 active:scale-95 cursor-pointer border border-white/20 animate-in zoom-in duration-200"
                title={`Expand menu (${activeTab.label})`}
            >
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 shadow-sm">
                    <ActiveIcon size={20} className="animate-pulse" />
                </div>
            </button>
        );
    }

    const NavLink = ({ href, icon: Icon, label, exact = false }: { href: string; icon: any; label: string; exact?: boolean }) => {
        const isActive = exact ? pathname === href : pathname?.startsWith(href);
        return (
            <Link href={href} className={`flex flex-col items-center gap-1 transition-all duration-200 relative py-2 px-3 rounded-xl min-w-[60px] active:scale-95 ${
                isActive ? "text-primary-600 font-semibold" : "text-slate-500 hover:text-primary-600"
            }`}>
                <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive ? "bg-primary-50 scale-105" : ""}`}>
                    <Icon size={20} />
                </div>
                <span className="text-[9px] font-medium tracking-tight">{label}</span>
                {isActive && (
                    <span className="absolute bottom-0 w-1 h-1 bg-primary-600 rounded-full animate-pulse" />
                )}
            </Link>
        );
    };

    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-md glass-nav rounded-2xl p-2 flex justify-around items-center z-50 transition-all duration-300 ease-out shadow-xl border border-white/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <NavLink href="/" icon={Home} label="Home" exact />
            <NavLink href="/search" icon={Search} label="Search" />
            <NavLink href="/dealers" icon={Store} label="Dealers" />

            {authLoaded && canAccessDealer && (
                <NavLink href="/dashboard" icon={LayoutDashboard} label="My Dealer" />
            )}

            {isGlobalAdmin && (
                <NavLink href="/admin" icon={Shield} label="Admin" />
            )}

            {authLoaded && isSignedIn ? (
                <div className="flex flex-col items-center gap-1 py-2 px-3 min-w-[60px]">
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "w-7 h-7",
                            },
                        }}
                    />
                    <span className="text-[9px] font-medium tracking-tight text-slate-500">Account</span>
                </div>
            ) : (
                <SignInButton mode="modal">
                    <button className="flex flex-col items-center gap-1 transition-all duration-200 relative py-2 px-3 rounded-xl min-w-[60px] active:scale-95 text-slate-500 hover:text-primary-600 bg-transparent border-none p-0 cursor-pointer">
                        <div className="p-1.5 rounded-lg">
                            <Shield size={20} />
                        </div>
                        <span className="text-[9px] font-medium tracking-tight">Sign In</span>
                    </button>
                </SignInButton>
            )}
        </nav>
    );
}

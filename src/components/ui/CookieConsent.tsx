"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { posthogOptIn, posthogOptOut } from "@/components/PostHogProvider";

// ── Consent key shared with PostHogProvider ──────────────────────────────────
const CONSENT_KEY = "puladrive_cookie_consent";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem(CONSENT_KEY);
    if (!hasConsented) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    posthogOptIn();
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    posthogOptOut();
    setIsVisible(false);
  };

  const handleClose = () => {
    // Dismissed without choosing — treat as declined for this session
    sessionStorage.setItem("puladrive_cookie_dismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 transition-all duration-500 ease-out transform translate-y-0 opacity-100 animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-5 relative overflow-hidden flex flex-col gap-4">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-100/40 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3.5 relative">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
            <Cookie size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Privacy & Storage Preferences</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed pr-6">
              We use analytics cookies to understand how you use PulaDrive and improve your experience. No advertising pixels or third-party ad tracking.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 absolute top-0 right-0 rounded-lg hover:bg-slate-50"
            aria-label="Dismiss cookie banner"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2.5 ml-13">
          <button
            onClick={handleAccept}
            className="text-xs font-bold px-4 py-2 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white rounded-xl shadow-md shadow-primary-500/20 transition-all cursor-pointer"
          >
            Accept All
          </button>
          <button
            onClick={handleDecline}
            className="text-xs font-bold px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-100 cursor-pointer"
          >
            Decline
          </button>
          <Link
            href="/legal/cookies"
            className="text-xs font-medium text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
          >
            Learn more
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser, useOrganization } from "@clerk/nextjs";

// ─── Init ────────────────────────────────────────────────────────────────────
// Only runs on the client. Checks cookie consent before capturing.
if (typeof window !== "undefined") {
  const consent = localStorage.getItem("puladrive_cookie_consent");

  // Detect slow connections or data-saver mode to reduce data usage for Botswana users
  const isSlowOrMetered = () => {
    if (typeof navigator === "undefined") return false;
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (!conn) return false;
    if (conn.saveData) return true;
    const slowConnectionTypes = ["slow-2g", "2g", "3g"];
    if (slowConnectionTypes.includes(conn.effectiveType)) return true;
    return false;
  };

  const slowConn = isSlowOrMetered();

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-05-30",

    // ── Capture ──────────────────────────────────────────────────────────
    capture_pageview: false,       // handled manually below for SPA routing
    capture_pageleave: !slowConn,
    autocapture: !slowConn,        // Disable rage/dead clicks and form tracking on slow connections

    // ── Session Recording ────────────────────────────────────────────────
    disable_session_recording: slowConn,
    session_recording: slowConn ? undefined : {
      maskAllInputs: false,        // keeps input text visible in replays
      maskInputFn: (text, element) => {
        // Mask password and payment fields
        const el = element as HTMLInputElement;
        if (el?.type === "password" || el?.autocomplete?.includes("cc-")) {
          return "*".repeat(text.length);
        }
        return text;
      },
    },

    // ── Heatmaps ─────────────────────────────────────────────────────────
    enable_heatmaps: !slowConn,

    // ── Persistence ──────────────────────────────────────────────────────
    persistence: "localStorage+cookie",

    // ── Bootstrap from cookie consent ────────────────────────────────────
    // If user hasn't consented yet, start in opted-out mode.
    // The CookieConsent component will call posthog.opt_in_capturing() on accept.
    opt_out_capturing_by_default: consent !== "accepted",

    // ── Bootstrap ────────────────────────────────────────────────────────
    bootstrap: {
      // Pre-load feature flags if you have early-access flags
      // distinctID: undefined, // set by identify below
    },

    // ── Loaded callback ──────────────────────────────────────────────────
    loaded: (ph) => {
      // Respect consent state on load
      if (consent === "declined") {
        ph.opt_out_capturing();
      } else if (consent === "accepted") {
        ph.opt_in_capturing();
      }
    },
  });
}

// ─── Page View Tracker ───────────────────────────────────────────────────────
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname && ph) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url += `?${searchParams.toString()}`;
      }
      ph.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, ph]);

  return null;
}

// ─── User Identification ─────────────────────────────────────────────────────
// Exported so it can be rendered inside ClerkProvider (in ConvexClientProvider).
// Links Clerk identity → PostHog distinct ID so sessions are associated
// with real users across devices.
export function PostHogIdentify() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { organization } = useOrganization();
  const ph = usePostHog();

  useEffect(() => {
    if (!isLoaded || !ph) return;

    if (isSignedIn && user) {
      // Identify the individual user
      ph.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        created_at: user.createdAt?.toISOString(),
      });

      // Group by dealer organisation (if the user belongs to one)
      if (organization) {
        ph.group("dealership", organization.id, {
          name: organization.name,
          slug: organization.slug,
        });
      }
    } else if (isLoaded && !isSignedIn) {
      // Signed out — reset to anonymous
      ph.reset();
    }
  }, [isLoaded, isSignedIn, user, organization, ph]);

  return null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
        {/* PostHogIdentify is rendered inside ConvexClientProvider where ClerkProvider is available */}
      </Suspense>
      {children}
    </PHProvider>
  );
}

// ─── Cookie Consent Helpers ──────────────────────────────────────────────────
// Call these from your CookieConsent component.
export function posthogOptIn() {
  posthog.opt_in_capturing();
}

export function posthogOptOut() {
  posthog.opt_out_capturing();
  posthog.reset();
}

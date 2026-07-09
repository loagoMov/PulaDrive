"use client";

/**
 * useFeatureFlag — typed PostHog feature flag hook for PulaDrive.
 *
 * Usage:
 *   const showAIDealFinder = useFeatureFlag("ai-deal-finder");
 *   const variant = useFeatureFlag("homepage-hero-test"); // returns string variant or boolean
 */

import { useFeatureFlagEnabled, useFeatureFlagVariantKey } from "posthog-js/react";

// ─── Flag Registry ────────────────────────────────────────────────────────────
// List all PostHog feature flags here. This gives you a single source of truth
// and prevents typos in flag names throughout the codebase.
export const FLAGS = {
  /** Show the AI Deal Finder entry point in search */
  AI_DEAL_FINDER: "ai-deal-finder",
  /** A/B test variant for the homepage hero section */
  HOMEPAGE_HERO_TEST: "homepage-hero-test",
  /** Enable featured listings carousel on homepage */
  FEATURED_CAROUSEL: "featured-carousel",
  /** Show "Book a Visit" CTA on listing pages */
  BOOK_VISIT_CTA: "book-visit-cta",
  /** Enable push notification prompts */
  PUSH_NOTIFICATIONS: "push-notifications",
} as const;

export type FlagKey = (typeof FLAGS)[keyof typeof FLAGS];

// ─── Boolean flag hook ────────────────────────────────────────────────────────
export function useFeatureFlag(flag: FlagKey): boolean {
  return useFeatureFlagEnabled(flag) ?? false;
}

// ─── Multivariate flag hook ───────────────────────────────────────────────────
export function useFeatureFlagVariant(flag: FlagKey): string | boolean | undefined {
  return useFeatureFlagVariantKey(flag);
}

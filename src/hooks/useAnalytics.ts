"use client";

/**
 * useAnalytics — typed PostHog event capture hook for PulaDrive.
 *
 * Use this instead of calling posthog.capture() directly so every event
 * follows a consistent schema that shows up cleanly in the PostHog dashboard.
 *
 * Usage:
 *   const { capture } = useAnalytics();
 *   capture("listing_viewed", { make: "Toyota", model: "Hilux", price: 350000 });
 */

import { usePostHog } from "posthog-js/react";
import { useCallback } from "react";

// ─── Event Catalog ────────────────────────────────────────────────────────────
// Add new event types here. Every event has a name and a typed properties shape.
// This ensures consistent naming across the app and gives you autocomplete.

export type AnalyticsEvent =
  // ── Listing events ────────────────────────────────────────────────────────
  | { event: "listing_viewed";         props: { vehicle_id: string; make: string; model: string; year: number; price: number; dealer_id: string; dealer_name?: string } }
  | { event: "listing_shared";         props: { vehicle_id: string; method: "native_share" | "clipboard" } }
  | { event: "listing_favorited";      props: { vehicle_id: string; action: "add" | "remove" } }
  | { event: "listing_reported";       props: { vehicle_id: string; reason: string } }
  | { event: "whatsapp_intent";        props: { vehicle_id: string; dealer_id: string; dealer_name?: string } }
  | { event: "book_visit_clicked";     props: { vehicle_id: string; dealer_id: string } }

  // ── Search events ─────────────────────────────────────────────────────────
  | { event: "search_performed";       props: { query?: string; category?: string; target_price?: number; result_count: number } }
  | { event: "search_filter_applied";  props: { filter: string; value: string | number } }
  | { event: "ai_deal_finder_opened";  props: Record<string, never> }

  // ── Dealer events ─────────────────────────────────────────────────────────
  | { event: "dealer_profile_viewed";  props: { dealer_id: string; dealer_slug: string; dealer_name: string } }

  // ── Auth / onboarding events ──────────────────────────────────────────────
  | { event: "signup_cta_clicked";     props: { source: string } }
  | { event: "signin_completed";       props: { method?: string } }

  // ── Dashboard events ──────────────────────────────────────────────────────
  | { event: "dashboard_visited";      props: { dealer_id: string; dealer_name?: string } }
  | { event: "listing_created";        props: { dealer_id: string; make: string; model: string; price: number } }
  | { event: "listing_deleted";        props: { vehicle_id: string; dealer_id: string } }
  | { event: "subscription_upgrade_requested"; props: { dealer_id: string; requested_tier: string } }

  // ── Engagement / UX events ────────────────────────────────────────────────
  | { event: "image_gallery_swiped";   props: { vehicle_id: string; direction: "next" | "prev"; photo_index: number } }
  | { event: "cookie_consent_accepted"; props: Record<string, never> }
  | { event: "cookie_consent_declined"; props: Record<string, never> };

// Extract event name union
type EventName = AnalyticsEvent["event"];

// Extract props type for a given event name
type PropsFor<E extends EventName> = Extract<AnalyticsEvent, { event: E }>["props"];

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAnalytics() {
  const ph = usePostHog();

  /**
   * capture(event, props)
   *
   * Fully typed — TypeScript will error if you pass the wrong props for an event.
   */
  const capture = useCallback(
    <E extends EventName>(event: E, props: PropsFor<E>) => {
      if (!ph) return;
      ph.capture(event, props);
    },
    [ph]
  );

  return { capture };
}

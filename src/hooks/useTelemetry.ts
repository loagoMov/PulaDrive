"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export interface TelemetryEvent {
  anonymousSessionId?: string;
  vehicleId?: string;
  eventType: string;
  pageRoute: string;
  metadata?: any;
  timestamp: number;
}

// Global queue shared across components to avoid duplicate buffers and keep tracking batching clean.
const eventQueue: TelemetryEvent[] = [];

// Helper to generate a cryptographically secure UUID-like string
function getOrCreateAnonId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("puladrive_anon_id");
  if (!id) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      id = crypto.randomUUID();
    } else if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      // Secure fallback: build a UUID v4 from cryptographically random bytes
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
      id = Array.from(bytes)
        .map((b, i) =>
          [4, 6, 8, 10].includes(i)
            ? "-" + b.toString(16).padStart(2, "0")
            : b.toString(16).padStart(2, "0")
        )
        .join("");
    } else {
      // Last-resort: timestamp + counter (non-random, but only hit in very old envs)
      id = "anon_" + Date.now().toString(36);
    }
    localStorage.setItem("puladrive_anon_id", id);
  }
  return id;
}

export function useTelemetry() {
  const logEvents = useMutation(api.telemetry.logEvents);
  const { isSignedIn } = useAuth();

  // Ref to hold mutation to avoid stale closures in event listeners or unmount functions
  const logMutationRef = useRef(logEvents);
  useEffect(() => {
    logMutationRef.current = logEvents;
  }, [logEvents]);

  const flushEvents = useCallback(async () => {
    if (eventQueue.length === 0) return;
    const batch = [...eventQueue];
    eventQueue.length = 0; // Clear queue
    try {
      await logMutationRef.current({
        events: batch.map((e) => ({
          ...e,
          vehicleId: e.vehicleId as Id<"vehicles"> | undefined,
        })),
      });
    } catch (err) {
      console.error("Failed to flush telemetry events", err);
      // Re-add to queue if flush failed
      eventQueue.unshift(...batch);
    }
  }, []);

  const trackEvent = useCallback(
    (eventType: string, vehicleId?: string, metadata?: any) => {
      if (typeof window === "undefined") return;

      const anonymousSessionId = !isSignedIn ? getOrCreateAnonId() : undefined;
      const pageRoute = window.location.pathname;

      const event: TelemetryEvent = {
        anonymousSessionId,
        vehicleId,
        eventType,
        pageRoute,
        metadata,
        timestamp: Date.now(),
      };

      eventQueue.push(event);

      if (eventQueue.length >= 5) {
        flushEvents();
      }
    },
    [isSignedIn, flushEvents]
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      flushEvents();
    };
  }, [flushEvents]);

  // Flush on page unload / hide (standard beacon/persistence pattern)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushEvents();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [flushEvents]);

  return { trackEvent, flushEvents };
}
export { getOrCreateAnonId };

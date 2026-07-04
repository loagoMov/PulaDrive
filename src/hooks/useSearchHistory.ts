"use client";

/**
 * useSearchHistory
 *
 * Signed-in users  → Convex `searchHistory` table (synced across devices)
 * Guest users      → localStorage key "puladrive_search_history" (up to 10 entries)
 */

import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import { useCallback } from "react";

// ─── Shared types ─────────────────────────────────────────────────────────────
export interface SearchEntry {
    _id?: string;
    label: string;
    budgetMin?:    number;
    budgetMax?:    number;
    yearMin?:      number;
    yearMax?:      number;
    mileageMax?:   number;
    fuelType?:     string;
    transmission?: string;
    category?:     string;
    color?:        string;
    makeModel?:    string;
    savedAt?: number;   // local-only timestamp
}

const LOCAL_KEY = "puladrive_search_history";
const MAX_LOCAL = 10;

function readLocal(): SearchEntry[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    } catch {
        return [];
    }
}

function writeLocal(entries: SearchEntry[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entries.slice(0, MAX_LOCAL)));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSearchHistory() {
    const { isSignedIn } = useAuth();

    // Convex — only active when signed in
    const remoteHistory = useQuery(
        api.searchHistory.list,
        isSignedIn ? {} : "skip"
    );
    const saveRemote    = useMutation(api.searchHistory.save);
    const removeRemote  = useMutation(api.searchHistory.remove);
    const clearRemote   = useMutation(api.searchHistory.clearAll);

    // ── Save ──────────────────────────────────────────────────────────────────
    const save = useCallback(async (entry: Omit<SearchEntry, "_id" | "savedAt">) => {
        if (isSignedIn) {
            await saveRemote(entry as any);
        } else {
            const prev = readLocal();
            // deduplicate by label
            const deduped = prev.filter((e) => e.label !== entry.label);
            writeLocal([{ ...entry, savedAt: Date.now() }, ...deduped]);
        }
    }, [isSignedIn, saveRemote]);

    // ── Remove one ────────────────────────────────────────────────────────────
    const remove = useCallback(async (entry: SearchEntry) => {
        if (isSignedIn && entry._id) {
            await removeRemote({ id: entry._id as any });
        } else {
            const prev = readLocal().filter((e) => e.label !== entry.label);
            writeLocal(prev);
        }
    }, [isSignedIn, removeRemote]);

    // ── Clear all ─────────────────────────────────────────────────────────────
    const clear = useCallback(async () => {
        if (isSignedIn) {
            await clearRemote();
        } else {
            writeLocal([]);
        }
    }, [isSignedIn, clearRemote]);

    // Merge source
    const history: SearchEntry[] = isSignedIn
        ? (remoteHistory ?? [])
        : readLocal();

    return { history, save, remove, clear, isLoading: isSignedIn && remoteHistory === undefined };
}

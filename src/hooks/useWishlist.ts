import { useState, useEffect, useCallback } from "react";

const WISHLIST_KEY = "puladrive_wishlist";

export function useWishlist() {
    const [wishlist, setWishlist] = useState<string[]>([]);

    // Hydrate from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(WISHLIST_KEY);
            if (stored) setWishlist(JSON.parse(stored));
        } catch {
            // ignore parse errors
        }
    }, []);

    const toggle = useCallback((vehicleId: string) => {
        setWishlist((prev) => {
            const next = prev.includes(vehicleId)
                ? prev.filter((id) => id !== vehicleId)
                : [...prev, vehicleId];
            try {
                localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
            } catch {
                // ignore storage errors (private browsing quota etc.)
            }
            return next;
        });
    }, []);

    const isWishlisted = useCallback(
        (vehicleId: string) => wishlist.includes(vehicleId),
        [wishlist]
    );

    return { wishlist, toggle, isWishlisted };
}

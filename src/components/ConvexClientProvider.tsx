"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import React, { Suspense } from "react";
import { PostHogIdentify } from "@/components/PostHogProvider";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                {/* PostHogIdentify must live inside ClerkProvider to access useUser/useOrganization */}
                <Suspense fallback={null}>
                    <PostHogIdentify />
                </Suspense>
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}

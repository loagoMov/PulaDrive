import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that require a signed-in user
// CRIT-02 fix: /admin was missing — added so unauthenticated users are
// redirected to Clerk sign-in before the admin page shell is rendered.
// The backend still enforces requireGlobalAdmin() on every query/mutation
// (defense in depth), but the middleware prevents the page from loading at all.
const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/profile(.*)",
    "/admin(.*)",
    "/favorites(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        // Redirects unauthenticated users to Clerk sign-in
        await auth.protect();
    }
    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};

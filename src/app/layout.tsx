

import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import Footer from "@/components/ui/Footer";
import CookieConsent from "@/components/ui/CookieConsent";
import { PostHogProvider } from "@/components/PostHogProvider";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://puladrive.com"),
    title: {
        default: "PulaDrive — Find Your Next Car in Botswana",
        template: "%s | PulaDrive"
    },
    description: "PulaDrive is Botswana's premier digital car marketplace connecting buyers with trusted dealerships in Gaborone and across the country.",
    keywords: ["cars for sale Botswana", "buy car Gaborone", "PulaDrive", "Botswana car marketplace", "dealerships Gaborone", "used cars Botswana"],
    authors: [{ name: "PulaDrive Team" }],
    creator: "PulaDrive",
    publisher: "PulaDrive",
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        locale: "en_BW",
        url: "https://puladrive.com",
        title: "PulaDrive — Find Your Next Car in Botswana",
        description: "PulaDrive is Botswana's premier digital car marketplace connecting buyers with trusted dealerships in Gaborone and across the country.",
        siteName: "PulaDrive",
        images: [
            {
                url: "/logo.png",
                width: 1200,
                height: 630,
                alt: "PulaDrive Botswana Car Marketplace",
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "PulaDrive — Find Your Next Car in Botswana",
        description: "PulaDrive is Botswana's premier digital car marketplace connecting buyers with trusted dealerships in Gaborone and across the country.",
        images: ["/logo.png"],
    },
    robots: {
        index: true,
        follow: true,
    }
};

// Required for env(safe-area-inset-*) CSS variables to work on iOS
export const viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PostHogProvider>
            <ConvexClientProvider>
                <html lang="en">
                    <body className={inter.className}>
                        <div className="min-h-screen flex flex-col justify-between">
                            <main className="flex-1">
                                {children}
                            </main>
                            <Footer />
                            <CookieConsent />
                        </div>
                    </body>
                </html>
            </ConvexClientProvider>
        </PostHogProvider>
    );
}

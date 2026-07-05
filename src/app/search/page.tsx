import SearchClient from "./SearchClient";
import MobileNav from "@/components/navigation/MobileNav";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Search Cars for Sale in Botswana",
    description: "Browse premium vehicles, SUVs, Sedans, and Trucks for sale in Gaborone and across Botswana on PulaDrive. Filter by price, category, and find the best deals.",
    alternates: {
        canonical: "/search",
    },
    openGraph: {
        title: "Search Cars for Sale in Botswana | PulaDrive",
        description: "Browse premium vehicles, SUVs, Sedans, and Trucks for sale in Gaborone and across Botswana on PulaDrive. Filter by price, category, and find the best deals.",
        url: "https://puladrive.com/search",
    }
};

export default function SearchPage() {
    return (
        <main className="min-h-screen bg-slate-50 pb-32">
            <SearchClient />
            <MobileNav />
        </main>
    );
}

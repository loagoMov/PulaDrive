import DealersClient from "./DealersClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Trusted Car Dealerships in Botswana",
    description: "Connect with verified car dealerships in Gaborone, Francistown, and across Botswana. Browse inventories, verify authorized dealers, and contact them directly on PulaDrive.",
    alternates: {
        canonical: "/dealers",
    },
    openGraph: {
        title: "Trusted Car Dealerships in Botswana | PulaDrive",
        description: "Connect with verified car dealerships in Gaborone, Francistown, and across Botswana. Browse inventories, verify authorized dealers, and contact them directly on PulaDrive.",
        url: "https://puladrive.com/dealers",
    }
};

export default function DealersPage() {
    return <DealersClient />;
}

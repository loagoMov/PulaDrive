import VehicleDetailsClient from "./VehicleDetailsClient";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { Metadata } from "next";

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const resolvedParams = await params;
    
    let vehicle = null;
    try {
        vehicle = await fetchQuery(api.vehicles.getVehicle, { id: resolvedParams.id });
    } catch (e) {
        console.error("Failed to fetch vehicle metadata on server", e);
    }

    if (!vehicle) {
        return {
            title: "Vehicle Not Found | PulaDrive",
            description: "The requested vehicle listing could not be found on PulaDrive Botswana.",
        };
    }

    const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} for sale in Botswana`;
    const description = `Buy this ${vehicle.year} ${vehicle.make} ${vehicle.model} on PulaDrive for P ${vehicle.price.toLocaleString()}. Specs: ${vehicle.mileage ? vehicle.mileage.toLocaleString() + " km, " : ""}${vehicle.transmission || "Automatic"}, ${vehicle.fuelType || "Petrol"}. Located in ${vehicle.dealer?.location || "Botswana"}.`;
    const imageUrl = vehicle.imageUrls && vehicle.imageUrls.length > 0 ? vehicle.imageUrls[0] : "/placeholder-car.jpg";

    return {
        title,
        description,
        alternates: {
            canonical: `/listings/${resolvedParams.id}`,
        },
        openGraph: {
            title: `${title} | PulaDrive`,
            description,
            url: `https://puladrive.com/listings/${resolvedParams.id}`,
            images: [
                {
                    url: imageUrl,
                    alt: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                }
            ],
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [imageUrl],
        }
    };
}

export default function VehicleDetailsPage() {
    return <VehicleDetailsClient />;
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { Flag } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";

const ReportModal = dynamic(() => import("./ReportModal"), { ssr: false });

interface Car {
    _id: string;
    make: string;
    model: string;
    price: number;
    year: number;
    imageUrls: string[];
    status: "available" | "reserved" | "sold";
    mileage?: number;
    transmission?: string;
    fuelType?: string;
    dealerId?: string;
}

interface CarCardProps {
    car: Car;
    /** Pass true for the first above-the-fold card to fix LCP */
    priority?: boolean;
}

export default function CarCard({ car, priority = false }: CarCardProps) {
    const [showReport, setShowReport] = useState(false);

    const statusColors = {
        available: "bg-emerald-100 text-emerald-700",
        reserved:  "bg-amber-100 text-amber-700",
        sold:      "bg-rose-100 text-rose-700",
    };

    return (
        <>
            <div className="card-premium group relative">
                {/* Clickable listing area */}
                <Link href={`/listings/${car._id}`} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                            src={car.imageUrls?.[0] || "/placeholder-car.jpg"}
                            alt={`${car.make} ${car.model}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            priority={priority}
                            loading={priority ? "eager" : "lazy"}
                        />
                        <div className="absolute top-3 left-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[car.status]}`}>
                                {car.status}
                            </span>
                        </div>
                        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-primary-900 shadow-sm">
                            {car.year}
                        </div>
                    </div>

                    <div className="p-4 space-y-1">
                        <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                            {car.make} {car.model}
                        </h3>
                        <p className="text-xl font-black text-primary-700">
                            P {car.price.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-4 text-[10px] text-slate-600 font-bold pt-2">
                            <span>{car.transmission || "Automatic"}</span>
                            <span>•</span>
                            <span>{car.fuelType || "Petrol"}</span>
                            <span>•</span>
                            <span>{car.mileage != null ? `${(car.mileage / 1000).toFixed(0)}k km` : "—"}</span>
                        </div>
                    </div>
                </Link>

                {/* Report button — sits outside the Link */}
                {car.dealerId && (
                    <div className="px-4 pb-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowReport(true); }}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors group/report"
                        >
                            <Flag size={11} className="group-hover/report:fill-rose-200 transition-colors" />
                            Report Listing
                        </button>
                    </div>
                )}
            </div>

            {showReport && car.dealerId && (
                <ReportModal
                    vehicleId={car._id}
                    dealerId={car.dealerId}
                    vehicleName={`${car.year} ${car.make} ${car.model}`}
                    onClose={() => setShowReport(false)}
                />
            )}
        </>
    );
}

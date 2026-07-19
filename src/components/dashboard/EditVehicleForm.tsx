"use client";

import { useState } from "react";
import { useSession } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Upload, CheckCircle2, Loader2, Trash2, AlertTriangle, AlertCircle, HandshakeIcon } from "lucide-react";
import Image from "next/image";
import { compressImage } from "@/utils/imageCompressor";
import { uploadVehicleImage } from "@/utils/uploadToSupabase";
import { deleteVehicleImages } from "@/utils/deleteFromSupabase";

// ─── Security constants ────────────────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_IMAGES = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface EditVehicleFormProps {
    vehicle: any;
    onClose: () => void;
    onSoldWhilePromoted?: (vehicle: any) => void;
    isPulaDriveDealership?: boolean;
}

export default function EditVehicleForm({ vehicle, onClose, onSoldWhilePromoted, isPulaDriveDealership = false }: EditVehicleFormProps) {
    const updateVehicle = useMutation(api.vehicles.update);
    const removeVehicle = useMutation(api.vehicles.remove);
    const { session } = useSession();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [success, setSuccess] = useState(false);
    const [exteriorFiles, setExteriorFiles] = useState<File[]>([]);
    const [interiorFiles, setInteriorFiles] = useState<File[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const formatNumber = (val: string | number | undefined) => {
        if (val === undefined || val === null) return "";
        const num = String(val).replace(/\D/g, "");
        if (!num) return "";
        return parseInt(num, 10).toLocaleString();
    };

    const [priceInput, setPriceInput] = useState(formatNumber(vehicle.price));
    const [mileageInput, setMileageInput] = useState(formatNumber(vehicle.mileage));
    const [isNegotiable, setIsNegotiable] = useState<boolean>(vehicle.negotiable ?? false);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPriceInput(formatNumber(e.target.value));
    };

    const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMileageInput(formatNumber(e.target.value));
    };

    // V-07 fix: validate file MIME type and size before accepting
    const handleFileChange = (category: 'exterior' | 'interior') => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError(null);
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);

        const currentNewFiles = exteriorFiles.length + interiorFiles.length;
        const newTotalNewFiles = currentNewFiles + newFiles.length;

        const totalImages = (vehicle.images?.length ?? 0) + newTotalNewFiles;
        if (totalImages > MAX_IMAGES) {
            setFileError(`Total images cannot exceed ${MAX_IMAGES}. You already have ${vehicle.images?.length ?? 0}.`);
            e.target.value = "";
            return;
        }

        for (const file of newFiles) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                setFileError("Only JPEG, PNG, and WebP images are allowed.");
                e.target.value = "";
                return;
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setFileError(`Each image must be smaller than ${MAX_FILE_SIZE_MB} MB.`);
                e.target.value = "";
                return;
            }
        }

        if (category === 'exterior') setExteriorFiles(prev => [...prev, ...newFiles]);
        else setInteriorFiles(prev => [...prev, ...newFiles]);
        
        e.target.value = "";
    };

    const removeFile = (category: 'exterior' | 'interior', index: number) => {
        if (category === 'exterior') setExteriorFiles(prev => prev.filter((_, i) => i !== index));
        else setInteriorFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            // Delete images from Supabase Storage first (with Clerk JWT for auth), then remove the Convex record
            if (vehicle.images?.length) {
                const token = await session?.getToken({ template: "supabase" }) ?? undefined;
                await deleteVehicleImages(vehicle.images, token);
            }
            await removeVehicle({ id: vehicle._id });
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err: any) {
            console.error(err);
            setSubmitError(err?.message ?? "Failed to delete listing.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (fileError) return;
        setIsSubmitting(true);
        setSubmitError(null);

        const formData = new FormData(e.currentTarget);
        try {
            let imageUrls: string[] = vehicle.images || [];

            // Upload any new files to Supabase Storage
            const allFiles = [...exteriorFiles, ...interiorFiles];
            if (allFiles.length > 0) {
                const newUrls: string[] = [];
                for (const file of allFiles) {
                    const compressedFile = await compressImage(file, 1200, 0.82);
                    const token = await session?.getToken({ template: "supabase" }) ?? undefined;
                    const url = await uploadVehicleImage(compressedFile, "listings", token);
                    newUrls.push(url);
                }
                imageUrls = [...imageUrls, ...newUrls];
            }

            const newStatus = formData.get("status") as "available" | "reserved" | "sold";
            const wasPromoted = Boolean(vehicle.featuredUntil && vehicle.featuredUntil > Date.now());

            await updateVehicle({
                id: vehicle._id,
                make: formData.get("make") as string,
                model: formData.get("model") as string,
                year: parseInt(formData.get("year") as string),
                price: parseInt(formData.get("price") as string),
                mileage: parseInt(formData.get("mileage") as string),
                category: formData.get("category") as any,
                fuelType: formData.get("fuelType") as string,
                transmission: formData.get("transmission") as string,
                engineSize: formData.get("engineSize") as string,
                color: formData.get("color") as string,
                status: newStatus,
                description: formData.get("description") as string,
                images: imageUrls,
                negotiable: isNegotiable,
                // Private-seller fields (only submitted for PulaDrive Dealership)
                ...(isPulaDriveDealership ? {
                    customLocation: (formData.get("customLocation") as string) || undefined,
                    customPhone: (formData.get("customPhone") as string) || undefined,
                    sellerEmail: (formData.get("sellerEmail") as string) || undefined,
                } : {}),
            });

            if (newStatus === "sold" && vehicle.status !== "sold" && wasPromoted && onSoldWhilePromoted) {
                onClose();
                onSoldWhilePromoted({ ...vehicle, status: "sold" });
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err: any) {
            console.error(err);
            setSubmitError(err?.message ?? "Failed to update listing. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
                    <CheckCircle2 className="mx-auto text-emerald-500" size={64} />
                    <h3 className="text-2xl font-black text-slate-900">{showDeleteConfirm ? "Listing Deleted" : "Listing Updated"}</h3>
                    <p className="text-slate-500 font-medium">Your changes have been saved to the marketplace.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900">Edit Listing</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Vehicle Details & Status</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!showDeleteConfirm && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 hover:bg-rose-50 text-rose-500 rounded-full transition-colors"
                                title="Delete Listing"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {showDeleteConfirm ? (
                    <div className="p-6 sm:p-12 text-center space-y-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
                            <AlertTriangle size={36} />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-lg sm:text-xl font-black text-slate-900">Delete Listing?</h4>
                            <p className="text-slate-500 font-medium text-sm">
                                This action cannot be undone. Are you sure you want to remove this vehicle from the marketplace?
                            </p>
                        </div>
                        {submitError && (
                            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold">
                                <AlertCircle size={16} className="flex-shrink-0" />
                                {submitError}
                            </div>
                        )}
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Make</label>
                                <input name="make" defaultValue={vehicle.make} required maxLength={50} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Model</label>
                                <input name="model" defaultValue={vehicle.model} required maxLength={50} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Year</label>
                                <input name="year" type="number" defaultValue={vehicle.year} required min={1900} max={2030} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1 whitespace-nowrap">Mileage (km)</label>
                                <input type="text" value={mileageInput} onChange={handleMileageChange} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                                <input type="hidden" name="mileage" value={mileageInput.replace(/\D/g, "")} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Price (P)</label>
                                <input type="text" value={priceInput} onChange={handlePriceChange} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                                <input type="hidden" name="price" value={priceInput.replace(/\D/g, "")} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Status</label>
                                <select name="status" defaultValue={vehicle.status} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                                    <option value="available">Available</option>
                                    <option value="reserved">Reserved</option>
                                    <option value="sold">Sold</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Category</label>
                            <select name="category" defaultValue={vehicle.category} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                                <option value="">Select Category</option>
                                <option value="suv">SUV</option>
                                <option value="sedan">Sedan</option>
                                <option value="hatchback">Hatchback</option>
                                <option value="truck">Truck / Bakkie</option>
                                <option value="coupe">Coupe</option>
                                <option value="wagon">Wagon</option>
                                <option value="van">Van / Minivan</option>
                                <option value="luxury">Luxury</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Fuel Type</label>
                                <select name="fuelType" defaultValue={vehicle.fuelType} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                                    <option value="Petrol">Petrol</option>
                                    <option value="Diesel">Diesel</option>
                                    <option value="Hybrid">Hybrid</option>
                                    <option value="Electric">Electric</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Transmission</label>
                                <select name="transmission" defaultValue={vehicle.transmission} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                                    <option value="Automatic">Automatic</option>
                                    <option value="Manual">Manual</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Engine Size</label>
                                <input name="engineSize" defaultValue={vehicle.engineSize} maxLength={50} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Color</label>
                                <input name="color" defaultValue={vehicle.color} maxLength={50} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Description</label>
                            <textarea name="description" defaultValue={vehicle.description} rows={3} maxLength={2000} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                        </div>

                        {/* Private Seller Fields — only shown for PulaDrive Dealership */}
                        {isPulaDriveDealership && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[9px] font-black">P</div>
                                    <p className="text-xs font-black text-indigo-800 uppercase tracking-widest">Private Seller Details</p>
                                </div>
                                <p className="text-[10px] text-indigo-600 font-medium">These fields route enquiries directly to the seller, not PulaDrive.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Seller Location</label>
                                        <input name="customLocation" defaultValue={vehicle.customLocation ?? ""} maxLength={200} placeholder="e.g. Block 6, Gaborone" className="w-full bg-white border border-indigo-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 font-sans text-sm text-slate-900" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Seller Phone / WhatsApp</label>
                                        <input name="customPhone" defaultValue={vehicle.customPhone ?? ""} maxLength={30} placeholder="e.g. 26774000000" className="w-full bg-white border border-indigo-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 font-sans text-sm text-slate-900" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Seller Email</label>
                                    <input name="sellerEmail" type="email" defaultValue={vehicle.sellerEmail ?? ""} maxLength={320} placeholder="e.g. seller@example.com" className="w-full bg-white border border-indigo-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 font-sans text-sm text-slate-900" />
                                </div>
                            </div>
                        )}

                        {/* Negotiable Toggle */}
                        <button
                            type="button"
                            onClick={() => setIsNegotiable(v => !v)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                isNegotiable
                                    ? "border-amber-400 bg-amber-50"
                                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl transition-colors ${
                                    isNegotiable ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                                }`}>
                                    <HandshakeIcon size={18} />
                                </div>
                                <div className="text-left">
                                    <p className={`text-sm font-black ${isNegotiable ? "text-amber-800" : "text-slate-700"}`}>Price Negotiable</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Buyers will see a &quot;Negotiable&quot; badge on this listing</p>
                                </div>
                            </div>
                            <div className={`w-11 h-6 rounded-full transition-colors flex items-center ${
                                isNegotiable ? "bg-amber-400" : "bg-slate-200"
                            }`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm mx-0.5 transition-transform ${
                                    isNegotiable ? "translate-x-5" : "translate-x-0"
                                }`} />
                            </div>
                        </button>

                        <div className="space-y-4 pt-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Current Photos</label>
                            <div className="flex flex-wrap gap-4">
                                {vehicle.imageUrls?.map((url: string, idx: number) => (
                                    <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-100 group">
                                        <Image src={url} alt="Car" fill sizes="96px" className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* V-07 fix: restricted accept types + file size validation */}
                        <div className="pt-2 space-y-4">
                            <div>
                                <h4 className="text-sm font-black text-slate-900">Add More Photos</h4>
                                <p className="text-xs text-slate-500">Ensure you have Exterior, Interior, and Engine Bay photos covered.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Exterior */}
                                <div className={`border-2 border-dashed ${exteriorFiles.length > 0 ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200'} rounded-2xl p-4 text-center space-y-2 hover:border-blue-300 transition-colors group`}>
                                    <label className="cursor-pointer block">
                                        <Upload className={`mx-auto ${exteriorFiles.length > 0 ? 'text-blue-500' : 'text-slate-300 group-hover:text-primary-500'} transition-colors`} size={24} />
                                        <h5 className="font-bold text-slate-800 text-sm">Exterior</h5>
                                        <p className={`text-xs font-bold ${exteriorFiles.length > 0 ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-900'} transition-colors`}>
                                            {exteriorFiles.length > 0 ? `${exteriorFiles.length} file(s)` : "Upload more"}
                                        </p>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleFileChange('exterior')}
                                        />
                                    </label>
                                    {exteriorFiles.length > 0 && (
                                        <div className="flex flex-wrap justify-center gap-1.5 mt-3 pt-3 border-t border-slate-200/50">
                                            {exteriorFiles.map((file, i) => (
                                                <div key={i} className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 group/img">
                                                    <Image 
                                                        src={URL.createObjectURL(file)} 
                                                        alt="preview" 
                                                        fill
                                                        sizes="40px"
                                                        className="w-full h-full object-cover" 
                                                    />
                                                    <button type="button" onClick={() => removeFile('exterior', i)} className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Interior */}
                                <div className={`border-2 border-dashed ${interiorFiles.length > 0 ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200'} rounded-2xl p-4 text-center space-y-2 hover:border-blue-300 transition-colors group`}>
                                    <label className="cursor-pointer block">
                                        <Upload className={`mx-auto ${interiorFiles.length > 0 ? 'text-blue-500' : 'text-slate-300 group-hover:text-primary-500'} transition-colors`} size={24} />
                                        <h5 className="font-bold text-slate-800 text-sm">Interior</h5>
                                        <p className={`text-xs font-bold ${interiorFiles.length > 0 ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-900'} transition-colors`}>
                                            {interiorFiles.length > 0 ? `${interiorFiles.length} file(s)` : "Upload more"}
                                        </p>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleFileChange('interior')}
                                        />
                                    </label>
                                    {interiorFiles.length > 0 && (
                                        <div className="flex flex-wrap justify-center gap-1.5 mt-3 pt-3 border-t border-slate-200/50">
                                            {interiorFiles.map((file, i) => (
                                                <div key={i} className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 group/img">
                                                    <Image 
                                                        src={URL.createObjectURL(file)} 
                                                        alt="preview" 
                                                        fill
                                                        sizes="40px"
                                                        className="w-full h-full object-cover" 
                                                    />
                                                    <button type="button" onClick={() => removeFile('interior', i)} className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* File validation error */}
                        {fileError && (
                            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold">
                                <AlertCircle size={16} className="flex-shrink-0" />
                                {fileError}
                            </div>
                        )}

                        {/* Submit error */}
                        {submitError && (
                            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold">
                                <AlertCircle size={16} className="flex-shrink-0" />
                                {submitError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || !!fileError}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-4 flex items-center justify-center gap-2 sticky bottom-0 z-10"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Updating Listing...
                                </>
                            ) : "Save Changes"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

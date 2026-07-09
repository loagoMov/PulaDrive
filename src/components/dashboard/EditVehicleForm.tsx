"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { X, Upload, CheckCircle2, Loader2, Trash2, AlertTriangle, AlertCircle } from "lucide-react";
import Image from "next/image";
import { compressImage } from "@/utils/imageCompressor";

// ─── Security constants ────────────────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_IMAGES = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface EditVehicleFormProps {
    vehicle: any;
    onClose: () => void;
}

export default function EditVehicleForm({ vehicle, onClose }: EditVehicleFormProps) {
    const updateVehicle = useMutation(api.vehicles.update);
    const removeVehicle = useMutation(api.vehicles.remove);
    const generateUploadUrl = useMutation(api.vehicles.generateUploadUrl);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [success, setSuccess] = useState(false);
    const [exteriorFiles, setExteriorFiles] = useState<File[]>([]);
    const [interiorFiles, setInteriorFiles] = useState<File[]>([]);
    const [engineBayFiles, setEngineBayFiles] = useState<File[]>([]);
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

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPriceInput(formatNumber(e.target.value));
    };

    const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMileageInput(formatNumber(e.target.value));
    };

    // V-07 fix: validate file MIME type and size before accepting
    const handleFileChange = (category: 'exterior' | 'interior' | 'engineBay') => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError(null);
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);

        const currentNewFiles = exteriorFiles.length + interiorFiles.length + engineBayFiles.length;
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
        else if (category === 'interior') setInteriorFiles(prev => [...prev, ...newFiles]);
        else setEngineBayFiles(prev => [...prev, ...newFiles]);
        
        e.target.value = "";
    };

    const removeFile = (category: 'exterior' | 'interior' | 'engineBay', index: number) => {
        if (category === 'exterior') setExteriorFiles(prev => prev.filter((_, i) => i !== index));
        else if (category === 'interior') setInteriorFiles(prev => prev.filter((_, i) => i !== index));
        else setEngineBayFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
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
            let storageIds = vehicle.images || [];

            // Upload new files if any
            const allFiles = [...exteriorFiles, ...interiorFiles, ...engineBayFiles];
            if (allFiles.length > 0) {
                const newStorageIds: Id<"_storage">[] = [];
                for (const file of allFiles) {
                    const compressedFile = await compressImage(file, 1200, 0.82);
                    const postUrl = await generateUploadUrl();
                    const result = await fetch(postUrl, {
                        method: "POST",
                        headers: { "Content-Type": compressedFile.type },
                        body: compressedFile,
                    });
                    const { storageId } = await result.json();
                    newStorageIds.push(storageId as Id<"_storage">);
                }
                storageIds = [...storageIds, ...newStorageIds];
            }

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
                status: formData.get("status") as any,
                description: formData.get("description") as string,
                images: storageIds,
            });

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

                                {/* Engine Bay */}
                                <div className={`border-2 border-dashed ${engineBayFiles.length > 0 ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200'} rounded-2xl p-4 text-center space-y-2 hover:border-blue-300 transition-colors group`}>
                                    <label className="cursor-pointer block">
                                        <Upload className={`mx-auto ${engineBayFiles.length > 0 ? 'text-blue-500' : 'text-slate-300 group-hover:text-primary-500'} transition-colors`} size={24} />
                                        <h5 className="font-bold text-slate-800 text-sm">Engine Bay</h5>
                                        <p className={`text-xs font-bold ${engineBayFiles.length > 0 ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-900'} transition-colors`}>
                                            {engineBayFiles.length > 0 ? `${engineBayFiles.length} file(s)` : "Upload more"}
                                        </p>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleFileChange('engineBay')}
                                        />
                                    </label>
                                    {engineBayFiles.length > 0 && (
                                        <div className="flex flex-wrap justify-center gap-1.5 mt-3 pt-3 border-t border-slate-200/50">
                                            {engineBayFiles.map((file, i) => (
                                                <div key={i} className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 group/img">
                                                    <Image 
                                                        src={URL.createObjectURL(file)} 
                                                        alt="preview" 
                                                        fill
                                                        sizes="40px"
                                                        className="w-full h-full object-cover" 
                                                    />
                                                    <button type="button" onClick={() => removeFile('engineBay', i)} className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
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

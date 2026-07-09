"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { X, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { compressImage } from "@/utils/imageCompressor";

// ─── Security constants ──────────────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_IMAGES = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AddVehicleFormProps {
    dealerId: Id<"dealerships">;
    onClose: () => void;
}

interface FilePreview {
    file: File;
    objectUrl: string;
}

export default function AddVehicleForm({ dealerId, onClose }: AddVehicleFormProps) {
    const createVehicle = useMutation(api.vehicles.create);
    const generateUploadUrl = useMutation(api.vehicles.generateUploadUrl);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showFrozenModal, setShowFrozenModal] = useState(false);
    const [exteriorFiles, setExteriorFiles] = useState<FilePreview[]>([]);
    const [interiorFiles, setInteriorFiles] = useState<FilePreview[]>([]);
    const [engineBayFiles, setEngineBayFiles] = useState<FilePreview[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const [priceInput, setPriceInput] = useState("");
    const [mileageInput, setMileageInput] = useState("");

    const formatNumber = (val: string) => {
        const num = val.replace(/\D/g, "");
        if (!num) return "";
        return parseInt(num, 10).toLocaleString();
    };

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

        const currentTotal = exteriorFiles.length + interiorFiles.length + engineBayFiles.length;
        const newTotal = currentTotal + newFiles.length;

        if (newTotal > MAX_IMAGES) {
            setFileError(`You can upload at most ${MAX_IMAGES} images in total.`);
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

        const filePreviews = newFiles.map(file => ({
            file,
            objectUrl: URL.createObjectURL(file)
        }));

        if (category === 'exterior') setExteriorFiles(prev => [...prev, ...filePreviews]);
        else if (category === 'interior') setInteriorFiles(prev => [...prev, ...filePreviews]);
        else setEngineBayFiles(prev => [...prev, ...filePreviews]);
        
        e.target.value = "";
    };

    const removeFile = (category: 'exterior' | 'interior' | 'engineBay', index: number) => {
        // Cleanup blob URL to prevent memory leaks
        if (category === 'exterior') {
            URL.revokeObjectURL(exteriorFiles[index].objectUrl);
            setExteriorFiles(prev => prev.filter((_, i) => i !== index));
        }
        else if (category === 'interior') {
            URL.revokeObjectURL(interiorFiles[index].objectUrl);
            setInteriorFiles(prev => prev.filter((_, i) => i !== index));
        }
        else {
            URL.revokeObjectURL(engineBayFiles[index].objectUrl);
            setEngineBayFiles(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (fileError) return;
        setIsSubmitting(true);
        setSubmitError(null);

        const formData = new FormData(e.currentTarget);
        try {
            // Upload files to Convex Storage first
            const storageIds: Id<"_storage">[] = [];
            const allFiles = [
                ...exteriorFiles.map(f => f.file),
                ...interiorFiles.map(f => f.file),
                ...engineBayFiles.map(f => f.file)
            ];
            for (const file of allFiles) {
                // Compress the image before uploading
                const compressedFile = await compressImage(file, 1200, 0.82);
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": compressedFile.type },
                    body: compressedFile,
                });
                const { storageId } = await result.json();
                storageIds.push(storageId as Id<"_storage">);
            }

            const data = {
                dealerId,
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
                status: "available" as const,
                images: storageIds,
                description: formData.get("description") as string,
            };

            await createVehicle(data);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: any) {
            console.error(err);
            const msg = err?.message ?? "Failed to create listing. Please try again.";
            if (msg.toLowerCase().includes("frozen")) {
                setShowFrozenModal(true);
            } else {
                setSubmitError(msg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
                    <CheckCircle2 className="mx-auto text-emerald-500" size={64} />
                    <h3 className="text-2xl font-black text-slate-900">Vehicle Listed!</h3>
                    <p className="text-slate-500 font-medium">Your vehicle has been successfully added to your inventory.</p>
                </div>
            </div>
        );
    }

    if (showFrozenModal) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
                        <AlertCircle size={40} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Account Frozen</h3>
                        <p className="text-slate-500 font-medium text-sm">Your account is currently frozen. Please settle any outstanding invoices or contact support to resume listing vehicles.</p>
                    </div>
                    <button onClick={onClose} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all">
                        Got it
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-black text-slate-900">List New Vehicle</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Make</label>
                            <input name="make" required maxLength={50} placeholder="e.g. Toyota" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-sans text-sm text-slate-900" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Model</label>
                            <input name="model" required maxLength={50} placeholder="e.g. Hilux" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-sans text-sm text-slate-900" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Year</label>
                            <input name="year" type="number" required min={1900} max={2030} placeholder="e.g. 2018" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-sans text-sm text-slate-900" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Mileage (km)</label>
                            <input type="text" value={mileageInput} onChange={handleMileageChange} required placeholder="e.g. 45,000" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-sans text-sm text-slate-900" />
                            <input type="hidden" name="mileage" value={mileageInput.replace(/\D/g, "")} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Price (BWP)</label>
                            <input type="text" value={priceInput} onChange={handlePriceChange} required placeholder="e.g. 250,000" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-sans text-sm text-slate-900" />
                            <input type="hidden" name="price" value={priceInput.replace(/\D/g, "")} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Category</label>
                        <select name="category" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-sans text-sm text-slate-900">
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
                            <select name="fuelType" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-sans text-sm text-slate-900">
                                <option value="Petrol">Petrol</option>
                                <option value="Diesel">Diesel</option>
                                <option value="Hybrid">Hybrid</option>
                                <option value="Electric">Electric</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Transmission</label>
                            <select name="transmission" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-sans text-sm text-slate-900">
                                <option value="Automatic">Automatic</option>
                                <option value="Manual">Manual</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Engine Size</label>
                            <input name="engineSize" maxLength={50} placeholder="e.g. 2.8L" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-sans text-sm text-slate-900" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Color</label>
                            <input name="color" maxLength={50} placeholder="e.g. White" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-sans text-sm text-slate-900" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Description</label>
                        <textarea name="description" rows={3} maxLength={2000} placeholder="Tell us more about the vehicle's condition, features, and history..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-sans text-sm text-slate-900" />
                    </div>

                    {/* Photo Upload Requirements */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-black text-slate-900">Vehicle Photos</h4>
                            <p className="text-xs text-slate-500">Please provide at least 2 photos for each category (Max {MAX_IMAGES} total).</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Exterior */}
                            <div className={`border-2 border-dashed ${exteriorFiles.length >= 2 ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'} rounded-2xl p-4 text-center space-y-2 group transition-all`}>
                                <label className="cursor-pointer block">
                                    <Upload className={`mx-auto ${exteriorFiles.length >= 2 ? 'text-emerald-500' : 'text-slate-300 group-hover:text-primary-500'} transition-colors`} size={24} />
                                    <h5 className="font-bold text-slate-800 text-sm">Exterior</h5>
                                    <p className={`text-xs font-bold ${exteriorFiles.length >= 2 ? 'text-emerald-600' : 'text-slate-500 group-hover:text-slate-900'} transition-colors`}>
                                        {exteriorFiles.length > 0 ? `${exteriorFiles.length} file(s)` : "Min. 2 photos"}
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
                                        {exteriorFiles.map((preview, i) => (
                                            <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 group/img">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={preview.objectUrl} alt="preview" className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => removeFile('exterior', i)} className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Interior */}
                            <div className={`border-2 border-dashed ${interiorFiles.length >= 2 ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'} rounded-2xl p-4 text-center space-y-2 group transition-all`}>
                                <label className="cursor-pointer block">
                                    <Upload className={`mx-auto ${interiorFiles.length >= 2 ? 'text-emerald-500' : 'text-slate-300 group-hover:text-primary-500'} transition-colors`} size={24} />
                                    <h5 className="font-bold text-slate-800 text-sm">Interior</h5>
                                    <p className={`text-xs font-bold ${interiorFiles.length >= 2 ? 'text-emerald-600' : 'text-slate-500 group-hover:text-slate-900'} transition-colors`}>
                                        {interiorFiles.length > 0 ? `${interiorFiles.length} file(s)` : "Min. 2 photos"}
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
                                        {interiorFiles.map((preview, i) => (
                                            <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 group/img">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={preview.objectUrl} alt="preview" className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => removeFile('interior', i)} className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Engine Bay */}
                            <div className={`border-2 border-dashed ${engineBayFiles.length >= 2 ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'} rounded-2xl p-4 text-center space-y-2 group transition-all`}>
                                <label className="cursor-pointer block">
                                    <Upload className={`mx-auto ${engineBayFiles.length >= 2 ? 'text-emerald-500' : 'text-slate-300 group-hover:text-primary-500'} transition-colors`} size={24} />
                                    <h5 className="font-bold text-slate-800 text-sm">Engine Bay</h5>
                                    <p className={`text-xs font-bold ${engineBayFiles.length >= 2 ? 'text-emerald-600' : 'text-slate-500 group-hover:text-slate-900'} transition-colors`}>
                                        {engineBayFiles.length > 0 ? `${engineBayFiles.length} file(s)` : "Min. 2 photos"}
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
                                        {engineBayFiles.map((preview, i) => (
                                            <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 group/img">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={preview.objectUrl} alt="preview" className="w-full h-full object-cover" />
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
                        disabled={isSubmitting || !!fileError || exteriorFiles.length < 2 || interiorFiles.length < 2 || engineBayFiles.length < 2}
                        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-4 sticky bottom-0 z-10"
                    >
                        {isSubmitting ? "Listing Vehicle..." : "Publish Listing"}
                    </button>
                </form>
            </div>
        </div>
    );
}

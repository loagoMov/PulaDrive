"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function InvoiceContent() {
    const params = useSearchParams();
    const dealer      = params.get("dealer")      || "Unknown Dealership";
    const tin         = params.get("tin")         || "000000000";
    const inv         = params.get("inv")         || "INV-0000";
    const vatParam    = parseFloat(params.get("vat") || "0");
    const amount      = parseFloat(params.get("amount") || "0");
    const due         = params.get("due")         || new Date().toISOString();
    const description = params.get("desc")        || `PulaDrive Dealer Subscription — ${new Date().toLocaleString("en-BW", { month: "long", year: "numeric" })}`;
    const subDescription = params.get("subdesc")  || "Monthly access to vehicle listings, leads, analytics & dealer tools";

    const issueDate = new Date().toLocaleDateString("en-BW", { day: "numeric", month: "long", year: "numeric" });
    const dueDate   = new Date(due).toLocaleDateString("en-BW", { day: "numeric", month: "long", year: "numeric" });

    const vatAmount = (amount * vatParam) / 100;
    const total     = amount + vatAmount;

    // Derive a per-invoice colour accent from the invoice number so every PDF
    // looks uniquely "theirs" while staying on-brand
    const accentHue = ((inv.charCodeAt(inv.length - 1) * 13) % 40) + 210; // 210-250 = blue/indigo range

    return (
        <>
            {/* ── Toolbar (hidden on print) ──────────────────────────── */}
            <div className="no-print fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 leading-tight">Tax Invoice — {inv}</p>
                        <p className="text-[11px] text-slate-400">{dealer}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9"/>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                            <rect x="6" y="14" width="12" height="8"/>
                        </svg>
                        Print
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-sm transition"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Download PDF
                    </button>
                </div>
            </div>

            {/* ── Invoice Document ───────────────────────────────────── */}
            <div className="invoice-bg min-h-screen bg-slate-100 flex items-start justify-center pt-20 pb-16 px-0 sm:px-4">
                <div className="invoice-doc w-full max-w-[800px] bg-white rounded-none sm:rounded-3xl overflow-hidden shadow-2xl">

                    {/* Top accent bar */}
                    <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, hsl(${accentHue},80%,45%), hsl(${accentHue + 20},70%,60%))` }} />

                    {/* Header */}
                    <div className="px-5 sm:px-12 pt-10 pb-8 flex flex-col sm:flex-row items-start justify-between gap-6 border-b border-slate-100">
                        {/* Brand */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md"
                                    style={{ background: `hsl(${accentHue},75%,48%)` }}>
                                    PD
                                </div>
                                <div>
                                    <p className="text-xl font-black text-slate-900 tracking-tight leading-none">PulaDrive</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Botswana</p>
                                </div>
                            </div>
                            <div className="pt-3 text-xs text-slate-400 space-y-0.5">
                                <p>puladrive.com</p>
                                <p>Gaborone, Botswana</p>
                            </div>
                        </div>

                        {/* Invoice meta */}
                        <div className="text-left sm:text-right space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tax Invoice</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tight leading-none">{inv}</p>
                            <div className="pt-3 space-y-1 text-xs text-slate-500">
                                <div className="flex items-center sm:justify-end gap-2">
                                    <span className="text-slate-400">Issue date</span>
                                    <span className="font-bold text-slate-700">{issueDate}</span>
                                </div>
                                <div className="flex items-center sm:justify-end gap-2">
                                    <span className="text-slate-400">Due date</span>
                                    <span className="font-bold" style={{ color: `hsl(${accentHue},65%,42%)` }}>{dueDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill To / From */}
                    <div className="px-5 sm:px-12 py-8 grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-slate-100">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Bill To</p>
                            <p className="text-lg font-black text-slate-900 leading-tight">{dealer}</p>
                            <div className="mt-2 space-y-1 text-[13px] text-slate-500">
                                <p>BURS TIN: <span className="font-bold text-slate-700">{tin}</span></p>
                                <p>Botswana</p>
                            </div>
                        </div>
                        <div className="text-left sm:text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Issued By</p>
                            <p className="text-base font-black text-slate-900 leading-tight">PulaDrive Botswana (Pty) Ltd</p>
                            <div className="mt-2 space-y-1 text-[13px] text-slate-500">
                                <p>VAT: <span className="font-bold text-slate-700">{vatParam === 0 ? "Exempt (≤ P500K)" : `${vatParam}%`}</span></p>
                                <p>Gaborone, Botswana</p>
                            </div>
                        </div>
                    </div>

                    {/* Line items */}
                    <div className="px-5 sm:px-12 py-8 overflow-x-auto">
                        <table className="w-full text-sm min-w-[500px] sm:min-w-0">
                            <thead>
                                <tr style={{ borderBottom: `2px solid hsl(${accentHue},75%,48%)` }}>
                                    <th className="text-left pb-3 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Description</th>
                                    <th className="text-center pb-3 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Qty</th>
                                    <th className="text-right pb-3 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Unit Price</th>
                                    <th className="text-right pb-3 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-slate-100">
                                    <td className="py-5 pr-4">
                                        <p className="font-bold text-slate-900">{description}</p>
                                        <p className="text-slate-400 text-xs mt-0.5">{subDescription}</p>
                                    </td>
                                    <td className="py-5 text-center font-semibold text-slate-600">1</td>
                                    <td className="py-5 text-right font-semibold text-slate-600">
                                        P {amount.toLocaleString("en-BW", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-5 text-right font-black text-slate-900">
                                        P {amount.toLocaleString("en-BW", { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Totals block */}
                        <div className="mt-6 flex justify-end">
                            <div className="w-full sm:w-60 space-y-2.5 text-sm">
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-slate-700">P {amount.toLocaleString("en-BW", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>VAT ({vatParam}%)</span>
                                    <span className="font-semibold text-slate-700">P {vatAmount.toLocaleString("en-BW", { minimumFractionDigits: 2 })}</span>
                                </div>
                                {vatParam === 0 && (
                                    <p className="text-[10px] text-slate-400 italic leading-snug">
                                        Zero-rated — annual turnover below P500,000 BURS threshold
                                    </p>
                                )}
                                <div className="pt-2.5 flex justify-between items-baseline font-black text-slate-900"
                                    style={{ borderTop: `2px solid hsl(${accentHue},75%,48%)` }}>
                                    <span className="text-base">Total Due</span>
                                    <span className="text-xl" style={{ color: `hsl(${accentHue},65%,40%)` }}>
                                        P {total.toLocaleString("en-BW", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment instructions */}
                    <div className="mx-5 sm:mx-12 mb-10 rounded-2xl border border-slate-100 overflow-hidden">
                        <div className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-white"
                            style={{ background: `hsl(${accentHue},75%,48%)` }}>
                            Payment Instructions
                        </div>
                        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-2">
                                {[
                                    ["Bank",        "First National Bank (FNB)"],
                                    ["Account No.", "62xxxxxxxxx"],
                                    ["Branch",      "Main Mall, Gaborone"],
                                    ["Swift",       "FIRNBWGX"],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex gap-3">
                                        <span className="text-slate-400 w-24 shrink-0">{label}</span>
                                        <span className="font-bold text-slate-800">{value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                {[
                                    ["Reference", inv],
                                    ["Amount",    `P ${total.toLocaleString("en-BW", { minimumFractionDigits: 2 })}`],
                                    ["Due By",    dueDate],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex gap-3">
                                        <span className="text-slate-400 w-24 shrink-0">{label}</span>
                                        <span className="font-bold text-slate-800">{value}</span>
                                    </div>
                                ))}
                                <p className="text-[11px] text-slate-400 pt-1">
                                    Use the invoice number as your payment reference to ensure correct allocation.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 sm:px-12 py-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <p className="text-[11px] text-slate-400 leading-snug max-w-sm">
                            This is an official PulaDrive invoice. Queries? Email{" "}
                            <span className="font-semibold text-slate-600">support@puladrive.com</span>
                        </p>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            puladrive.com
                        </div>
                    </div>

                    {/* Bottom accent bar */}
                    <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, hsl(${accentHue},80%,45%), hsl(${accentHue + 20},70%,60%))` }} />
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .invoice-bg { background: white !important; padding: 0 !important; padding-top: 0 !important; }
                    .invoice-doc { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
                    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </>
    );
}

export default function InvoicePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 animate-pulse" />
                    <p className="text-slate-400 font-semibold text-sm">Generating invoice…</p>
                </div>
            </div>
        }>
            <InvoiceContent />
        </Suspense>
    );
}

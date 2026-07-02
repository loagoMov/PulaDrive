"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import NotificationCenter from "../../components/NotificationCenter";
import {
    ChevronLeft, CreditCard, AlertTriangle, CheckCircle2,
    Clock, FileText, TrendingUp, Wallet, CalendarDays, ExternalLink, Loader2
} from "lucide-react";
import DealershipSelector from "@/components/dashboard/DealershipSelector";

function StatusBadge({ status }: { status: "pending" | "paid" | "overdue" }) {
    const styles = {
        paid:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
        pending: "bg-amber-50  text-amber-700  border border-amber-200",
        overdue: "bg-red-50    text-red-700    border border-red-200",
    };
    const icons = {
        paid:    <CheckCircle2 size={11} />,
        pending: <Clock size={11} />,
        overdue: <AlertTriangle size={11} />,
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${styles[status]}`}>
            {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

function formatPula(cents: number) {
    return `P ${(cents / 100).toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function daysLabel(dueDate: string) {
    const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000);
    if (diff < 0)  return { text: `${Math.abs(diff)}d overdue`, color: "text-red-600" };
    if (diff === 0) return { text: "Due today",                color: "text-red-500" };
    if (diff <= 7)  return { text: `Due in ${diff}d`,          color: "text-amber-600" };
    return { text: `Due in ${diff}d`,                          color: "text-slate-500" };
}

export default function DealerBillingPage() {
    const router = useRouter();
    const { organization } = useOrganization();

    const dealership = useQuery(
        api.dealerships.getByClerkOrgId,
        organization ? { clerkOrgId: organization.id } : "skip"
    );

    const billing = useQuery(
        api.billing.getDealerBillingSummary,
        dealership ? { dealerId: dealership._id } : "skip"
    );

    const isLoading = dealership === undefined || dealership === null || billing === undefined;

    if (!organization) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500">No dealership organisation found.</p>
            </div>
        );
    }

    if (isLoading || !dealership) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
        );
    }

    const { pending, overdue, paid, totalOwed, totalPaid, upcoming, invoices } = billing;
    const accountStatus = dealership.accountStatus ?? "active";
    const isFrozen = accountStatus === "frozen";

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <header className="bg-white border-b border-slate-200 px-4 py-4 lg:px-8 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="touch-target no-tap-highlight flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            <ChevronLeft size={18} />
                            <span className="hidden xs:inline">Back</span>
                        </button>
                        <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
                            <div>
                                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">Billing &amp; Payments</h1>
                                <div className="mt-0.5">
                                    <DealershipSelector />
                                </div>
                            </div>
                        </div>
                    </div>
                    <NotificationCenter recipientId={dealership._id} />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-28">

                {/* ── Frozen Account Banner ──────────────────────────────────── */}
                {isFrozen && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5">
                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-black text-red-800 text-sm">Account Suspended</p>
                            <p className="text-red-600 text-sm mt-0.5">
                                Your account has been frozen due to outstanding payments. Please settle your balance to restore full access.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── KPI Cards ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        {
                            icon: <Wallet className="text-amber-600" size={18} />, bg: "bg-amber-50",
                            label: "Balance Due",
                            value: <span className={`text-xl sm:text-2xl font-black pt-0.5 ${totalOwed > 0 ? "text-red-600" : "text-slate-900"}`}>{formatPula(totalOwed)}</span>,
                        },
                        {
                            icon: <TrendingUp className="text-emerald-600" size={18} />, bg: "bg-emerald-50",
                            label: "Total Paid",
                            value: <span className="text-xl sm:text-2xl font-black text-slate-900 pt-0.5">{formatPula(totalPaid)}</span>,
                        },
                        {
                            icon: <AlertTriangle className="text-red-500" size={18} />, bg: "bg-red-50",
                            label: "Overdue",
                            value: <span className={`text-xl sm:text-2xl font-black pt-0.5 ${overdue.length > 0 ? "text-red-600" : "text-slate-900"}`}>{overdue.length}</span>,
                        },
                        {
                            icon: <FileText className="text-blue-600" size={18} />, bg: "bg-blue-50",
                            label: "Pending",
                            value: <span className="text-xl sm:text-2xl font-black text-slate-900 pt-0.5">{pending.length}</span>,
                        },
                    ].map(({ icon, bg, label, value }) => (
                        <div key={label} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3">
                            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>{icon}</div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                                {value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Subscription / Account Status Card ────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isFrozen ? "bg-red-50" : "bg-primary-50"}`}>
                            <CreditCard className={isFrozen ? "text-red-500" : "text-primary-600"} size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subscription Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${isFrozen ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
                                <p className={`text-lg font-black ${isFrozen ? "text-red-700" : "text-slate-900"}`}>
                                    {isFrozen ? "Frozen" : "Active"}
                                </p>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Client ID: <span className="font-bold text-slate-600">{dealership.clientCustomId ?? "—"}</span>
                            </p>
                        </div>
                    </div>

                    {upcoming && (
                        <div className="w-full sm:w-auto bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 text-left sm:text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 sm:justify-end">
                                <CalendarDays size={10} /> Next Payment
                            </p>
                            <p className="text-lg font-black text-slate-900 mt-0.5">{formatPula(upcoming.amount)}</p>
                            <p className={`text-xs font-bold mt-0.5 ${daysLabel(upcoming.dueDate).color}`}>
                                {daysLabel(upcoming.dueDate).text}
                            </p>
                            <p className="text-[10px] text-slate-400">{upcoming.invoiceNumber}</p>
                        </div>
                    )}
                </div>

                {/* ── Outstanding Invoices ───────────────────────────────────── */}
                {[...overdue, ...pending].length > 0 && (
                    <section>
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Outstanding Invoices</h2>
                        <div className="space-y-3">
                            {[...overdue, ...pending].map(inv => {
                                const dl = daysLabel(inv.dueDate);
                                return (
                                    <div
                                        key={inv._id}
                                        className={`bg-white rounded-2xl border shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                            inv.status === "overdue" ? "border-red-200" : "border-slate-100"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                inv.status === "overdue" ? "bg-red-50" : "bg-amber-50"
                                            }`}>
                                                <FileText size={16} className={inv.status === "overdue" ? "text-red-500" : "text-amber-600"} />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm">{inv.invoiceNumber}</p>
                                                <p className={`text-xs font-bold mt-0.5 ${dl.color}`}>{dl.text}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pl-12 sm:pl-0">
                                            <StatusBadge status={inv.status} />
                                            <span className="text-base sm:text-lg font-black text-slate-900">{formatPula(inv.amount)}</span>
                                            <a
                                                href={`https://carplacebw.vercel.app/invoice?dealer=${encodeURIComponent(dealership?.name ?? "")}&tin=${encodeURIComponent(dealership?.bursTin ?? "000000000")}&inv=${encodeURIComponent(inv.invoiceNumber)}&vat=0&amount=${(inv.amount / 100).toFixed(2)}&due=${encodeURIComponent(inv.dueDate)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="touch-target no-tap-highlight flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline"
                                            >
                                                View <ExternalLink size={11} />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Payment History ────────────────────────────────────────── */}
                <section>
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Payment History</h2>

                    {invoices.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 sm:p-12 flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                <FileText className="text-slate-300" size={28} />
                            </div>
                            <div>
                                <p className="font-black text-slate-900">No invoices yet</p>
                                <p className="text-sm text-slate-400 mt-1">Your billing history will appear here once invoices are generated.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table (md+) */}
                            <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice</th>
                                            <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                                            <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                            <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                            <th className="px-5 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {[...invoices].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).map(inv => (
                                            <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-4 font-bold text-slate-800">{inv.invoiceNumber}</td>
                                                <td className="px-5 py-4 text-slate-500">{new Date(inv.dueDate).toLocaleDateString("en-BW", { day: "numeric", month: "short", year: "numeric" })}</td>
                                                <td className="px-5 py-4 font-black text-slate-900">{formatPula(inv.amount)}</td>
                                                <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                                                <td className="px-5 py-4 text-right">
                                                    <a
                                                        href={`https://carplacebw.vercel.app/invoice?dealer=${encodeURIComponent(dealership?.name ?? "")}&tin=${encodeURIComponent(dealership?.bursTin ?? "000000000")}&inv=${encodeURIComponent(inv.invoiceNumber)}&vat=0&amount=${(inv.amount / 100).toFixed(2)}&due=${encodeURIComponent(inv.dueDate)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline"
                                                    >
                                                        Download <ExternalLink size={10} />
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List (< md) */}
                            <div className="flex md:hidden flex-col gap-2">
                                {[...invoices].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).map(inv => (
                                    <div
                                        key={inv._id}
                                        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3"
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                            inv.status === "paid" ? "bg-emerald-50" : inv.status === "overdue" ? "bg-red-50" : "bg-amber-50"
                                        }`}>
                                            <FileText size={15} className={
                                                inv.status === "paid" ? "text-emerald-600" : inv.status === "overdue" ? "text-red-500" : "text-amber-600"
                                            } />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-900 text-sm truncate">{inv.invoiceNumber}</p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(inv.dueDate).toLocaleDateString("en-BW", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                            <span className="font-black text-slate-900 text-sm">{formatPula(inv.amount)}</span>
                                            <StatusBadge status={inv.status} />
                                        </div>
                                        <a
                                            href={`https://carplacebw.vercel.app/invoice?dealer=${encodeURIComponent(dealership?.name ?? "")}&tin=${encodeURIComponent(dealership?.bursTin ?? "000000000")}&inv=${encodeURIComponent(inv.invoiceNumber)}&vat=0&amount=${(inv.amount / 100).toFixed(2)}&due=${encodeURIComponent(inv.dueDate)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="touch-target no-tap-highlight text-primary-600 flex-shrink-0"
                                        >
                                            <ExternalLink size={15} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}

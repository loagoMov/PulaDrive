"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import NotificationCenter from "../../components/NotificationCenter";
import { useUser, UserButton } from "@clerk/nextjs";
import {
    FileText, Users, Activity, CheckCircle2, AlertTriangle,
    FileSpreadsheet, PlusCircle, ChevronLeft, CreditCard,
    Clock, TrendingUp, Building2, ChevronDown, ChevronUp,
    ExternalLink, Loader2, Shield, Layers, Star, Zap,
    Infinity as InfinityIcon, X, ChevronRight, Receipt
} from "lucide-react";
import { useRouter } from "next/navigation";

// ── Tier config (mirrors convex/subscriptions.ts) ─────────────────────────────
const TIERS = {
    starter:   { label: "Starter",   price: 150000, slots: 50,       icon: "🌱" },
    growth:    { label: "Growth",    price: 250000, slots: 150,      icon: "⚡" },
    unlimited: { label: "Unlimited", price: 350000, slots: Infinity, icon: "∞"  },
} as const;
type TierKey = keyof typeof TIERS;
const EXTRA_SLOT_UNIT = 20000; // P200 in cents

type EvaluatedRow = {
    confidence: "PERFECT" | "FUZZY" | "NONE";
    amount: number;
    referenceString: string;
    matchedDealerId?: string | null;
    matchedInvoiceId?: string | null;
};

function formatPula(cents: number) {
    return `P ${(cents / 100).toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function HealthBadge({ health }: { health: "good" | "warning" | "critical" }) {
    const map = {
        good:     { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Good standing" },
        warning:  { cls: "bg-amber-50  text-amber-700  border-amber-200",     label: "Due soon" },
        critical: { cls: "bg-red-50    text-red-700    border-red-200",       label: "Overdue" },
    };
    const { cls, label } = map[health];
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${health === "good" ? "bg-emerald-500" : health === "warning" ? "bg-amber-500" : "bg-red-500"}`} />
            {label}
        </span>
    );
}

// ── Invoice type chooser ──────────────────────────────────────────────────────
type InvoiceType = "subscription" | "extra_slots" | "custom";

interface InvoiceFormState {
    dealerId: string;
    invoiceType: InvoiceType;
    // subscription
    tierKey: TierKey;
    // extra slots
    extraSlots: number;
    linkedRequestId: string;
    // custom
    customAmount: string;
    customDescription: string;
    // shared
    dueDate: string;
}

function defaultForm(): InvoiceFormState {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    return {
        dealerId: "",
        invoiceType: "subscription",
        tierKey: "starter",
        extraSlots: 10,
        linkedRequestId: "",
        customAmount: "",
        customDescription: "",
        dueDate: due.toISOString().slice(0, 10),
    };
}

// ── IssueInvoicePanel ─────────────────────────────────────────────────────────
function IssueInvoicePanel({
    dealers,
    approvedRequests,
    onClose,
    onDone,
    prefillDealerId,
}: {
    dealers: any[];
    approvedRequests: any[];
    onClose: () => void;
    onDone: () => void;
    prefillDealerId?: string;
}) {
    const createOfficialInvoice = useMutation(api.billing.createOfficialInvoice);
    const [form, setForm] = useState<InvoiceFormState>({
        ...defaultForm(),
        dealerId: prefillDealerId ?? "",
    });
    const [submitting, setSubmitting] = useState(false);

    const update = (patch: Partial<InvoiceFormState>) => setForm(f => ({ ...f, ...patch }));

    // Compute amount based on type
    const computedAmountCents = (() => {
        if (form.invoiceType === "subscription") return TIERS[form.tierKey].price;
        if (form.invoiceType === "extra_slots") return form.extraSlots * EXTRA_SLOT_UNIT;
        return Math.round(parseFloat(form.customAmount || "0") * 100);
    })();

    // Build description
    const buildDescription = () => {
        const now = new Date();
        const monthLabel = now.toLocaleString("en-BW", { month: "long", year: "numeric" });
        if (form.invoiceType === "subscription") {
            return `PulaDrive ${TIERS[form.tierKey].label} Subscription — ${monthLabel}`;
        }
        if (form.invoiceType === "extra_slots") {
            return `PulaDrive Extra Listing Slots (${form.extraSlots} × P 200) — ${monthLabel}`;
        }
        return form.customDescription || `PulaDrive Custom Charge — ${monthLabel}`;
    };

    const handleSubmit = async () => {
        if (!form.dealerId) { alert("Please select a dealership."); return; }
        if (computedAmountCents <= 0) { alert("Amount must be greater than 0."); return; }
        if (!form.dueDate) { alert("Please set a due date."); return; }
        setSubmitting(true);
        try {
            await createOfficialInvoice({
                dealerId: form.dealerId as Id<"dealerships">,
                amount: computedAmountCents,
                dueDate: new Date(form.dueDate).toISOString(),
                description: buildDescription(),
            });
            onDone();
        } catch (err: any) {
            alert(err?.message || "Failed to create invoice.");
        } finally {
            setSubmitting(false);
        }
    };

    const dealerApprovedRequests = form.dealerId
        ? approvedRequests.filter((r: any) => r.dealerId === form.dealerId && r.requestType === "extra_slots")
        : approvedRequests.filter((r: any) => r.requestType === "extra_slots");

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
                            <Receipt size={18} className="text-primary-600" />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 text-sm leading-none">Issue Invoice</p>
                            <p className="text-xs text-slate-400 mt-0.5">Generate and send a subscription or custom invoice</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <X size={16} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Dealership selector */}
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">Dealership</label>
                        <select
                            value={form.dealerId}
                            onChange={e => update({ dealerId: e.target.value, linkedRequestId: "" })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Choose dealership…</option>
                            {dealers.map((d: any) => (
                                <option key={d._id} value={d._id}>{d.name} {d.clientCustomId ? `(${d.clientCustomId})` : ""}</option>
                            ))}
                        </select>
                    </div>

                    {/* Invoice type tabs */}
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">Invoice Type</label>
                        <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
                            {([
                                { key: "subscription", label: "📅 Subscription", desc: "Monthly tier fee" },
                                { key: "extra_slots",  label: "➕ Extra Slots",  desc: "P200 per slot" },
                                { key: "custom",       label: "✏️ Custom",       desc: "Free-form charge" },
                            ] as const).map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => update({ invoiceType: t.key })}
                                    className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all text-center ${
                                        form.invoiceType === t.key
                                            ? "bg-white shadow-sm text-slate-900"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    <div>{t.label}</div>
                                    <div className={`text-[10px] font-bold mt-0.5 ${form.invoiceType === t.key ? "text-slate-400" : "text-slate-400/60"}`}>{t.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Subscription type ── */}
                    {form.invoiceType === "subscription" && (
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Select Tier</label>
                            <div className="grid grid-cols-3 gap-3">
                                {(Object.entries(TIERS) as [TierKey, typeof TIERS[TierKey]][]).map(([key, tier]) => (
                                    <button
                                        key={key}
                                        onClick={() => update({ tierKey: key })}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                            form.tierKey === key
                                                ? "border-primary-500 bg-primary-50"
                                                : "border-slate-100 hover:border-slate-200 bg-white"
                                        }`}
                                    >
                                        <div className="text-2xl mb-2">{tier.icon}</div>
                                        <p className="font-black text-slate-900 text-sm">{tier.label}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {tier.slots === Infinity ? "Unlimited slots" : `${tier.slots} slots`}
                                        </p>
                                        <p className="text-sm font-black text-primary-600 mt-2">
                                            {formatPula(tier.price)}
                                            <span className="text-[10px] text-slate-400 font-bold">/mo</span>
                                        </p>
                                        {form.tierKey === key && (
                                            <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-primary-600">
                                                <CheckCircle2 size={11} /> Selected
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Extra slots type ── */}
                    {form.invoiceType === "extra_slots" && (
                        <div className="space-y-4">
                            {/* Link to approved request */}
                            {dealerApprovedRequests.length > 0 && (
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                                        Link to Approved Request (optional)
                                    </label>
                                    <div className="space-y-2">
                                        {dealerApprovedRequests.map((req: any) => (
                                            <button
                                                key={req._id}
                                                onClick={() => update({
                                                    linkedRequestId: form.linkedRequestId === req._id ? "" : req._id,
                                                    extraSlots: req.extraSlotsRequested ?? form.extraSlots,
                                                })}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                                                    form.linkedRequestId === req._id
                                                        ? "border-indigo-400 bg-indigo-50"
                                                        : "border-slate-100 hover:border-slate-200 bg-white"
                                                }`}
                                            >
                                                <div>
                                                    <p className="text-xs font-black text-slate-800">
                                                        {req.dealerName ?? "Dealer"} — {req.extraSlotsRequested} extra slots
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        Approved · {new Date(req.createdAt).toLocaleDateString("en-BW")}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-black text-indigo-600">{formatPula((req.extraSlotsRequested ?? 0) * EXTRA_SLOT_UNIT)}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative my-3"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"/></div><div className="relative flex justify-center"><span className="bg-white px-2 text-[10px] text-slate-400 font-bold">OR ENTER MANUALLY</span></div></div>
                                </div>
                            )}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">Number of extra slots</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => update({ extraSlots: Math.max(1, form.extraSlots - 1), linkedRequestId: "" })}
                                        className="w-10 h-10 rounded-xl border border-slate-200 font-black text-slate-600 hover:bg-slate-50 transition-colors"
                                    >−</button>
                                    <input
                                        type="number" min={1} max={500}
                                        value={form.extraSlots}
                                        onChange={e => update({ extraSlots: Math.max(1, Math.min(500, parseInt(e.target.value) || 1)), linkedRequestId: "" })}
                                        className="flex-1 text-center font-black text-slate-900 text-xl border border-slate-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                    <button
                                        onClick={() => update({ extraSlots: Math.min(500, form.extraSlots + 1), linkedRequestId: "" })}
                                        className="w-10 h-10 rounded-xl border border-slate-200 font-black text-slate-600 hover:bg-slate-50 transition-colors"
                                    >+</button>
                                </div>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Total</p>
                                    <p className="text-xs text-indigo-600 mt-0.5">{form.extraSlots} slots × P 200</p>
                                </div>
                                <p className="text-2xl font-black text-indigo-700">{formatPula(computedAmountCents)}</p>
                            </div>
                        </div>
                    )}

                    {/* ── Custom type ── */}
                    {form.invoiceType === "custom" && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">Amount (Pula)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400">P</span>
                                    <input
                                        type="number" min={1} step="0.01"
                                        placeholder="0.00"
                                        value={form.customAmount}
                                        onChange={e => update({ customAmount: e.target.value })}
                                        className="w-full pl-8 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">Description</label>
                                <input
                                    type="text"
                                    placeholder="e.g. PulaDrive Setup Fee — July 2026"
                                    value={form.customDescription}
                                    onChange={e => update({ customDescription: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Due date + preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">Due Date</label>
                            <input
                                type="date"
                                value={form.dueDate}
                                onChange={e => update({ dueDate: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">Invoice Preview</label>
                            <div className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 space-y-1">
                                <p className="text-xs text-slate-500 truncate">{buildDescription()}</p>
                                <p className="text-lg font-black text-slate-900">{computedAmountCents > 0 ? formatPula(computedAmountCents) : "—"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !form.dealerId || computedAmountCents <= 0 || !form.dueDate}
                            className="flex-1 btn-primary py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />}
                            {submitting ? "Issuing…" : "Issue Invoice"}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-5 py-3 border border-slate-200 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminBillingPage() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const isGlobalAdmin = useQuery(api.dealerships.checkGlobalAdmin);
    const [csvInput, setCsvInput] = useState("");
    const [evaluatedRows, setEvaluatedRows] = useState<EvaluatedRow[]>([]);
    const [selectedDealerIds, setSelectedDealerIds] = useState<{ [k: number]: string }>({});
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<{ [k: number]: string }>({});
    const [expandedDealerId, setExpandedDealerId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"roster" | "parser">("roster");

    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [prefillDealerId, setPrefillDealerId] = useState<string | undefined>();
    const [invoiceSuccess, setInvoiceSuccess] = useState<string | null>(null);

    const pendingInvoices = useQuery(api.billing.getPendingInvoices) || [];
    const dealers = useQuery(api.billing.getAllDealers) || [];
    const rosterData = useQuery(api.billing.getAllDealersBillingSummary) || [];
    // Fetch all approved upgrade requests so we can link them to invoices
    const upgradeRequests = useQuery(api.subscriptions.listUpgradeRequests, isGlobalAdmin ? {} : "skip") ?? [];
    const invoicedDealerIds = new Set(pendingInvoices.map((inv: any) => inv.dealerId));
    const approvedRequests = upgradeRequests.filter(
        (r: any) => r.status === "approved" && !invoicedDealerIds.has(r.dealerId)
    );

    const processBankStatement = useMutation(api.billing.processBankStatement);
    const linkManualAliasToDealer = useMutation(api.billing.linkManualAliasToDealer);
    const markInvoiceAsPaid = useMutation(api.billing.markInvoiceAsPaid);
    const pushNotification = useMutation(api.notifications.pushNotification);
    const manualUpdateAccountStatus = useMutation(api.billing.manualUpdateAccountStatus);

    const isSyncConnected = rosterData !== undefined;
    const totalOverdue = rosterData.filter(r => r.health === "critical").length;
    const totalWarning = rosterData.filter(r => r.health === "warning").length;
    const totalBalanceDue = rosterData.reduce((s, r) => s + r.totalOwed, 0);

    // ─── CSV Parser handlers ─────────────────────────────────────────────────
    const handleProcessCsv = async () => {
        try {
            const lines = csvInput.split("\n").filter(l => l.trim() !== "");
            const rows = lines.map(line => {
                const [amountStr, ...refParts] = line.split(",");
                return { amount: Math.round(parseFloat(amountStr.trim()) * 100), referenceString: refParts.join(",").trim() };
            });
            const result = await processBankStatement({ rows });
            setEvaluatedRows(result);
            setCsvInput("");
        } catch {
            alert("Failed to process bank statement. Ensure format is 'Amount,Reference' per line.");
        }
    };

    const handleConfirmMatch = async (index: number) => {
        const row = evaluatedRows[index];
        if (!row.matchedInvoiceId) return;
        await markInvoiceAsPaid({ invoiceId: row.matchedInvoiceId as Id<"invoices"> });
        if (row.matchedDealerId) {
            await pushNotification({
                recipientId: row.matchedDealerId as Id<"dealerships">,
                type: "billing",
                title: "Payment Received",
                message: `Your payment of ${formatPula(row.amount)} has been received and your invoice is now marked as paid.`,
            });
        }
        setEvaluatedRows(prev => prev.filter((_, i) => i !== index));
    };

    const handleManualLink = async (index: number) => {
        const dealerId = selectedDealerIds[index];
        if (!dealerId) { alert("Please select a dealer first."); return; }
        const row = evaluatedRows[index];
        const result = await linkManualAliasToDealer({
            dealerId: dealerId as Id<"dealerships">,
            unmatchedReference: row.referenceString,
            amount: row.amount,
        });
        if (result.success) {
            await pushNotification({
                recipientId: dealerId as Id<"dealerships">,
                type: "billing",
                title: "Payment Manually Reconciled",
                message: `Your payment of ${formatPula(row.amount)} was successfully located and reconciled.`,
            });
            setEvaluatedRows(prev => prev.filter((_, i) => i !== index));
        } else {
            alert(result.message);
        }
    };

    const handleManualMarkPaid = async (index: number) => {
        const invoiceId = selectedInvoiceIds[index];
        if (!invoiceId) { alert("Please select an invoice to mark as paid."); return; }
        await markInvoiceAsPaid({ invoiceId: invoiceId as Id<"invoices"> });
        await pushNotification({
            recipientId: "admin",
            type: "billing",
            title: "Invoice Manually Marked Paid",
            message: "An invoice was manually marked as paid by an admin.",
        });
        setEvaluatedRows(prev => prev.filter((_, i) => i !== index));
    };

    // ─── Auth guard ──────────────────────────────────────────────────────────
    if (!isLoaded || isGlobalAdmin === undefined) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (!isGlobalAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-md w-full space-y-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                        <Shield size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Access Denied</h2>
                    <p className="text-slate-500 text-sm font-medium">Only global administrators can access the billing portal.</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Signed in as: <span className="lowercase text-slate-600">{user?.primaryEmailAddress?.emailAddress || "Guest"}</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-5 lg:px-8 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            <ChevronLeft size={18} /> Back
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <CreditCard size={20} className="text-primary-600" /> Billing Administration
                            </h1>
                            <p className="text-xs text-slate-400 font-medium">Manage dealer payments &amp; reconciliation</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-full">
                            <span className={`w-2 h-2 rounded-full ${isSyncConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                            {isSyncConnected ? "Live" : "Disconnected"}
                        </div>
                        <NotificationCenter recipientId="admin" />
                        <UserButton />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">

                {/* Invoice success toast */}
                {invoiceSuccess && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 animate-in fade-in duration-200">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <p className="text-sm font-bold text-emerald-800 flex-1">{invoiceSuccess}</p>
                        <button onClick={() => setInvoiceSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                            <Building2 className="text-primary-600" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Dealers</p>
                            <p className="text-2xl font-black text-slate-900 pt-0.5">{rosterData.length}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="text-red-500" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overdue</p>
                            <p className={`text-2xl font-black pt-0.5 ${totalOverdue > 0 ? "text-red-600" : "text-slate-900"}`}>{totalOverdue}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <Clock className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Due Soon</p>
                            <p className={`text-2xl font-black pt-0.5 ${totalWarning > 0 ? "text-amber-600" : "text-slate-900"}`}>{totalWarning}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <TrendingUp className="text-emerald-600" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Owed</p>
                            <p className={`text-2xl font-black pt-0.5 ${totalBalanceDue > 0 ? "text-red-600" : "text-slate-900"}`}>{formatPula(totalBalanceDue)}</p>
                        </div>
                    </div>
                </div>

                {/* Approved extra-slot requests needing invoicing */}
                {approvedRequests.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2">
                            <Layers size={16} className="text-indigo-600" />
                            <p className="text-sm font-black text-indigo-800">
                                {approvedRequests.length} approved slot request{approvedRequests.length > 1 ? "s" : ""} awaiting invoicing
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {approvedRequests.map((req: any) => (
                                <button
                                    key={req._id}
                                    onClick={() => {
                                        setPrefillDealerId(req.dealerId);
                                        setShowInvoiceModal(true);
                                    }}
                                    className="flex items-center gap-2 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-50 transition-colors"
                                >
                                    <Receipt size={12} />
                                    {req.dealerName} — {req.extraSlotsRequested} slots ({formatPula((req.extraSlotsRequested ?? 0) * EXTRA_SLOT_UNIT)})
                                    <ChevronRight size={12} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex bg-white border border-slate-100 shadow-sm rounded-2xl p-1 w-fit gap-1">
                    {(["roster", "parser"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all capitalize ${
                                activeTab === tab
                                    ? "bg-primary-600 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            {tab === "roster" ? "Dealer Roster" : "Statement Parser"}
                        </button>
                    ))}
                </div>

                {/* ── ROSTER TAB ────────────────────────────────────────────── */}
                {activeTab === "roster" && (
                    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h2 className="font-black text-slate-900">Dealer Payment Roster</h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => { setPrefillDealerId(undefined); setShowInvoiceModal(true); }}
                                    className="flex items-center gap-1.5 text-xs font-black bg-primary-600 text-white px-3 py-1.5 rounded-xl hover:bg-primary-700 transition active:scale-95 cursor-pointer shadow-sm"
                                >
                                    <PlusCircle size={14} /> Issue Invoice
                                </button>
                                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                                    {rosterData.length} dealers
                                </span>
                            </div>
                        </div>

                        {rosterData.length === 0 ? (
                            <div className="p-16 flex flex-col items-center text-center gap-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                                    <Users className="text-slate-300" size={28} />
                                </div>
                                <div>
                                    <p className="font-black text-slate-900">No dealers yet</p>
                                    <p className="text-sm text-slate-400 mt-1">Dealer billing records will appear here once created.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {rosterData.map(row => {
                                    const isExpanded = expandedDealerId === row.dealer._id;
                                    const nextDue = row.nextInvoice
                                        ? new Date(row.nextInvoice.dueDate).toLocaleDateString("en-BW", { day: "numeric", month: "short", year: "numeric" })
                                        : "—";
                                    const dealerTier = ((row.dealer as any).subscriptionTier ?? "starter") as TierKey;

                                    return (
                                        <div key={row.dealer._id}>
                                            {/* Roster Row */}
                                            <div
                                                className="px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-slate-50/50 cursor-pointer transition-colors"
                                                onClick={() => setExpandedDealerId(isExpanded ? null : row.dealer._id)}
                                            >
                                                {/* Dealer Info */}
                                                <div className="flex items-center gap-3 min-w-[220px]">
                                                    <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                                                        <Building2 size={16} className="text-primary-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm leading-tight">{row.dealer.name}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                            <p className="text-[10px] text-slate-400 font-bold">{row.dealer.clientCustomId ?? "No ID"}</p>
                                                            {/* Tier badge */}
                                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                                                dealerTier === "unlimited" ? "bg-emerald-100 text-emerald-700"
                                                                : dealerTier === "growth" ? "bg-indigo-100 text-indigo-700"
                                                                : "bg-slate-100 text-slate-500"
                                                            }`}>
                                                                {TIERS[dealerTier].icon} {TIERS[dealerTier].label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Metrics */}
                                                <div className="flex flex-wrap items-center gap-6 flex-1 text-sm">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Balance Due</p>
                                                        <p className={`font-black mt-0.5 ${row.totalOwed > 0 ? "text-red-600" : "text-slate-900"}`}>
                                                            {formatPula(row.totalOwed)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Due</p>
                                                        <p className="font-bold text-slate-700 mt-0.5">{nextDue}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Left</p>
                                                        <p className={`font-bold mt-0.5 ${
                                                            row.daysUntilDue === null ? "text-slate-400" :
                                                            row.daysUntilDue < 0 ? "text-red-600" :
                                                            row.daysUntilDue <= 7 ? "text-amber-600" : "text-slate-700"
                                                        }`}>
                                                            {row.daysUntilDue === null ? "—"
                                                                : row.daysUntilDue < 0 ? `${Math.abs(row.daysUntilDue)}d overdue`
                                                                : row.daysUntilDue === 0 ? "Today"
                                                                : `${row.daysUntilDue}d left`}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending</p>
                                                        <p className="font-bold text-slate-700 mt-0.5">{row.pending.length} invoice{row.pending.length !== 1 ? "s" : ""}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Paid</p>
                                                        <p className="font-bold text-emerald-700 mt-0.5">{formatPula(row.totalPaid)}</p>
                                                    </div>
                                                </div>

                                                {/* Health + quick invoice + expand */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setPrefillDealerId(row.dealer._id);
                                                            setShowInvoiceModal(true);
                                                        }}
                                                        className="flex items-center gap-1 text-[10px] font-black text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2.5 py-1.5 rounded-xl transition-colors"
                                                    >
                                                        <Receipt size={11} /> Invoice
                                                    </button>
                                                    <HealthBadge health={row.health} />
                                                    {isExpanded
                                                        ? <ChevronUp size={16} className="text-slate-400" />
                                                        : <ChevronDown size={16} className="text-slate-400" />
                                                    }
                                                </div>
                                            </div>

                                            {/* Expanded Invoice Detail */}
                                            {isExpanded && (
                                                <div className="bg-slate-50 border-t border-slate-100 px-6 py-5 space-y-6">
                                                    {/* Quick invoice shortcuts */}
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Invoice</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(Object.entries(TIERS) as [TierKey, typeof TIERS[TierKey]][]).map(([key, tier]) => (
                                                                <button
                                                                    key={key}
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        setPrefillDealerId(row.dealer._id);
                                                                        setShowInvoiceModal(true);
                                                                    }}
                                                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black transition-colors ${
                                                                        key === dealerTier
                                                                            ? "bg-primary-600 text-white border-primary-600"
                                                                            : "bg-white text-slate-700 border-slate-200 hover:border-primary-300 hover:text-primary-600"
                                                                    }`}
                                                                >
                                                                    <span>{tier.icon}</span>
                                                                    {tier.label} — {formatPula(tier.price)}
                                                                    {key === dealerTier && <span className="text-[9px] opacity-80 ml-0.5">(current)</span>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Manual Account Status Controls */}
                                                    <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Status Override</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`w-2.5 h-2.5 rounded-full ${
                                                                    row.dealer.accountStatus === "frozen" ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                                                                }`} />
                                                                <span className="font-bold text-slate-800 text-sm">
                                                                    {row.dealer.accountStatus === "frozen" ? "Suspended (Frozen)" : "Active"}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 mt-1">
                                                                Manually freeze or activate the lead generation features of this dealer.
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const nextStatus = row.dealer.accountStatus === "frozen" ? "active" : "frozen";
                                                                const verb = nextStatus === "frozen" ? "pause & freeze" : "reactivate";
                                                                if (confirm(`Are you sure you want to ${verb} ${row.dealer.name}'s account?`)) {
                                                                    try {
                                                                        await manualUpdateAccountStatus({
                                                                            dealerId: row.dealer._id,
                                                                            status: nextStatus,
                                                                        });
                                                                    } catch (err: any) {
                                                                        alert(err.message || "Failed to update account status.");
                                                                    }
                                                                }
                                                            }}
                                                            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-sm active:scale-95 ${
                                                                row.dealer.accountStatus === "frozen"
                                                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                    : "bg-rose-600 hover:bg-rose-700 text-white"
                                                            }`}
                                                        >
                                                            {row.dealer.accountStatus === "frozen" ? "Reactivate Account" : "Pause Account completely"}
                                                        </button>
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Invoice History</p>
                                                        {[...row.overdue, ...row.pending, ...row.paid].length === 0 ? (
                                                            <p className="text-sm text-slate-400">No invoices on record.</p>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {[...row.overdue, ...row.pending, ...row.paid]
                                                                    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
                                                                    .map(inv => (
                                                                    <div key={inv._id} className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
                                                                        <span className="font-bold text-slate-800">{inv.invoiceNumber}</span>
                                                                        {inv.description && (
                                                                            <span className="text-[11px] text-slate-400 truncate max-w-[200px]">{inv.description}</span>
                                                                        )}
                                                                        <span className="text-slate-400 text-xs">{new Date(inv.dueDate).toLocaleDateString("en-BW", { day: "numeric", month: "short", year: "numeric" })}</span>
                                                                        <span className="font-black text-slate-900 ml-auto">{formatPula(inv.amount)}</span>
                                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                                                            inv.status === "paid"    ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                                            inv.status === "overdue" ? "bg-red-50 text-red-700 border-red-200" :
                                                                                                       "bg-amber-50 text-amber-700 border-amber-200"
                                                                        }`}>
                                                                            {inv.status}
                                                                        </span>
                                                                        {inv.status !== "paid" && (
                                                                            <button
                                                                                onClick={async (e) => {
                                                                                    e.stopPropagation();
                                                                                    await markInvoiceAsPaid({ invoiceId: inv._id });
                                                                                    await pushNotification({
                                                                                        recipientId: row.dealer._id,
                                                                                        type: "billing",
                                                                                        title: "Payment Confirmed",
                                                                                        message: `Invoice ${inv.invoiceNumber} (${formatPula(inv.amount)}) has been manually marked as paid.`,
                                                                                    });
                                                                                }}
                                                                                className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors"
                                                                            >
                                                                                <CheckCircle2 size={12} /> Mark Paid
                                                                            </button>
                                                                        )}
                                                                        <a
                                                                            href={`/invoice?dealer=${encodeURIComponent(row.dealer.name)}&tin=${encodeURIComponent(row.dealer.bursTin || "000000000")}&inv=${encodeURIComponent(inv.invoiceNumber)}&vat=0&amount=${(inv.amount / 100).toFixed(2)}&due=${encodeURIComponent(inv.dueDate)}${inv.description ? `&desc=${encodeURIComponent(inv.description)}` : ""}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={e => e.stopPropagation()}
                                                                            className="flex items-center gap-1 text-xs font-bold text-white bg-slate-700 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition"
                                                                        >
                                                                            <ExternalLink size={10} /> Download
                                                                        </a>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* ── PARSER TAB ────────────────────────────────────────────── */}
                {activeTab === "parser" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* CSV Input */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileSpreadsheet className="text-slate-400" size={18} />
                                    <h2 className="font-black text-slate-900">Statement Drop-Zone</h2>
                                </div>
                                <p className="text-sm text-slate-500 mb-4">
                                    Paste CSV lines. Format: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">Amount,Reference</code>
                                </p>
                                <textarea
                                    className="w-full h-48 border border-slate-200 rounded-xl p-4 font-mono text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    placeholder={"500.00,CP-123\n1000.00,EFT FNB John Motors"}
                                    value={csvInput}
                                    onChange={e => setCsvInput(e.target.value)}
                                />
                                <button
                                    onClick={handleProcessCsv}
                                    disabled={!csvInput.trim()}
                                    className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl font-black hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    <Activity size={16} /> Evaluate Statement
                                </button>
                            </div>
                        </div>

                        {/* Processing Queue */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <h2 className="font-black text-slate-900">Processing Queue</h2>
                                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                                        {evaluatedRows.length} items
                                    </span>
                                </div>
                                <div className="p-6 space-y-4">
                                    {evaluatedRows.length === 0 ? (
                                        <div className="text-center py-16 flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                                                <CheckCircle2 className="text-slate-300" size={28} />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900">Queue is empty</p>
                                                <p className="text-sm text-slate-400 mt-1">Paste a bank statement CSV to begin evaluation.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        evaluatedRows.map((row, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-5 rounded-xl border flex flex-col gap-4 transition-all ${
                                                    row.confidence === "NONE"
                                                        ? "bg-red-50/30 border-red-100"
                                                        : row.confidence === "FUZZY"
                                                            ? "bg-amber-50/30 border-amber-100"
                                                            : "bg-emerald-50/30 border-emerald-100"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-black px-2 py-1 rounded-md ${
                                                        row.confidence === "NONE"    ? "bg-red-100 text-red-700" :
                                                        row.confidence === "FUZZY"   ? "bg-amber-100 text-amber-700" :
                                                                                       "bg-emerald-100 text-emerald-700"
                                                    }`}>
                                                        {row.confidence} MATCH
                                                    </span>
                                                    <span className="text-lg font-black text-slate-900">{formatPula(row.amount)}</span>
                                                    <code className="text-xs bg-white/70 border border-slate-200/50 px-2 py-1 rounded text-slate-600 flex-1 truncate">
                                                        {row.referenceString}
                                                    </code>
                                                </div>

                                                {row.confidence === "NONE" ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        <select
                                                            className="border border-red-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none flex-1 min-w-[180px]"
                                                            value={selectedDealerIds[idx] || ""}
                                                            onChange={e => setSelectedDealerIds(p => ({ ...p, [idx]: e.target.value }))}
                                                        >
                                                            <option value="">Map to dealership…</option>
                                                            {dealers.map(d => (
                                                                <option key={d._id} value={d._id}>{d.name}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            className="border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none flex-1 min-w-[180px]"
                                                            value={selectedInvoiceIds[idx] || ""}
                                                            onChange={e => setSelectedInvoiceIds(p => ({ ...p, [idx]: e.target.value }))}
                                                        >
                                                            <option value="">Or pick invoice to pay…</option>
                                                            {pendingInvoices.map(inv => (
                                                                <option key={inv._id} value={inv._id}>{inv.invoiceNumber} — {formatPula(inv.amount)}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => handleManualLink(idx)}
                                                            className="flex items-center gap-1 bg-red-600 text-white text-xs font-black px-4 py-2 rounded-lg hover:bg-red-700 transition"
                                                        >
                                                            <FileText size={13} /> Link &amp; Mark Paid
                                                        </button>
                                                        <button
                                                            onClick={() => handleManualMarkPaid(idx)}
                                                            disabled={!selectedInvoiceIds[idx]}
                                                            className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-40"
                                                        >
                                                            <CheckCircle2 size={13} /> Mark Invoice Paid
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        <p className="text-sm font-bold text-slate-600 flex-1">
                                                            {row.confidence === "FUZZY" ? "Fuzzy match — " : ""}
                                                            Matched to invoice {evaluatedRows[idx]?.matchedInvoiceId ? "found" : "not found"}
                                                        </p>
                                                        <button
                                                            onClick={() => handleConfirmMatch(idx)}
                                                            className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
                                                        >
                                                            <CheckCircle2 size={13} /> Confirm &amp; Mark Paid
                                                        </button>
                                                        <button
                                                            onClick={() => setEvaluatedRows(prev => prev.filter((_, i) => i !== idx))}
                                                            className="flex items-center gap-1 border border-slate-200 text-slate-600 text-xs font-black px-4 py-2 rounded-lg hover:bg-slate-50 transition"
                                                        >
                                                            <X size={13} /> Skip
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* ── Issue Invoice Modal ────────────────────────────────────────── */}
            {showInvoiceModal && (
                <IssueInvoicePanel
                    dealers={dealers}
                    approvedRequests={approvedRequests}
                    prefillDealerId={prefillDealerId}
                    onClose={() => { setShowInvoiceModal(false); setPrefillDealerId(undefined); }}
                    onDone={() => {
                        setShowInvoiceModal(false);
                        setPrefillDealerId(undefined);
                        setInvoiceSuccess("Invoice issued successfully and notification sent to the dealership.");
                        setTimeout(() => setInvoiceSuccess(null), 6000);
                    }}
                />
            )}
        </div>
    );
}

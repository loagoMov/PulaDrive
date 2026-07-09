import Link from "next/link";
import { Shield, Eye, Database, Trash2, Mail, Lock } from "lucide-react";

export const metadata = {
    title: "Privacy Policy — PulaDrive",
    description: "Learn how PulaDrive collects, uses, and protects your personal data.",
};

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <section className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon size={18} className="text-primary-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
        </div>
        <div className="legal-prose">{children}</div>
    </section>
);

export default function PrivacyPage() {
    return (
        <article className="space-y-12">
            {/* Hero */}
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    <Shield size={12} /> Legal Document
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    Privacy Policy
                </h1>
                <p className="text-slate-500 font-medium">
                    Effective date: <strong className="text-slate-700">25 June 2026</strong> · Last reviewed: <strong className="text-slate-700">9 July 2026</strong>
                </p>
                <p className="text-slate-600 leading-relaxed text-sm max-w-2xl">
                    PulaDrive (Pty) Ltd ("<strong>PulaDrive</strong>", "we", "our", or "us") is committed to protecting the privacy of everyone who uses our platform. This Privacy Policy explains what personal information we collect, how we use it, who we share it with, and what rights you have under the <strong>Botswana Data Protection Act, 2018</strong>.
                </p>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-800 font-medium">
                    By using PulaDrive, you agree to the collection and use of your information as described in this policy. If you do not agree, please discontinue using our services.
                </div>
            </div>

            {/* 1. Data we collect */}
            <Section icon={Database} title="1. Information We Collect">
                <p className="text-slate-600 text-sm leading-relaxed mb-4">We collect information in the following categories:</p>
                <div className="space-y-3">
                    {[
                        {
                            label: "Account Information",
                            desc: "When you sign in via Clerk, we receive your name, email address, and profile image from your identity provider (Google, email/password). We do not store passwords — authentication is handled by Clerk.",
                        },
                        {
                            label: "Browsing & Interaction Data",
                            desc: "We log which vehicle listings you view, how long you spend on each, which listings you add to your wishlist, and how you interact with search and dealer pages. This data powers your personalised 'For You' feed and product analytics via PostHog.",
                        },
                        {
                            label: "Search History",
                            desc: "Queries entered in standard search and AI Deal Finder are stored to display your recent searches and improve recommendation quality.",
                        },
                        {
                            label: "Device & Session Data",
                            desc: "We automatically collect your browser type, device type, general location (country/city from IP), and session identifiers for analytics and fraud prevention.",
                        },
                        {
                            label: "Session Recordings & Heatmaps",
                            desc: "With your consent, we record anonymised screen sessions and aggregate click/scroll heatmaps using PostHog. Password fields are always masked and never recorded. Recordings help us identify usability issues and improve the platform experience.",
                        },
                        {
                            label: "Dealer-Submitted Data",
                            desc: "If you operate a dealership on PulaDrive, we store your business name, contact email, phone number, location, and vehicle listings including photos.",
                        },
                        {
                            label: "Cookies & Local Storage",
                            desc: "We use browser cookies and local storage to persist session identifiers, wishlist items, search history, and analytics state (via PostHog). You can opt out of analytics cookies at any time via the cookie consent banner. Essential sign-in cookies cannot be disabled without breaking account access.",
                        },
                    ].map((item) => (
                        <div key={item.label} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                            <p className="text-sm font-black text-slate-900">{item.label}</p>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* 2. How we use it */}
            <Section icon={Eye} title="2. How We Use Your Information">
                <ul className="space-y-2 text-sm text-slate-600">
                    {[
                        "To operate and improve the PulaDrive marketplace.",
                        "To personalise your vehicle recommendations ('For You' feed) based on your browsing history and wishlist.",
                        "To power the AI Deal Finder — matching your stated budget and preferences to available inventory.",
                        "To send you transactional notifications (e.g. account-related emails) — we do not send marketing emails without explicit opt-in.",
                        "To generate anonymised analytics for dealerships (e.g. how many views a listing received).",
                        "To understand how users interact with PulaDrive using PostHog — including page views, session recordings, heatmaps, and product funnel analysis — so we can improve our platform (with your consent).",
                        "To detect and prevent fraud, spam, and misuse of the platform.",
                        "To comply with our legal obligations under Botswana law.",
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-[10px] font-black text-emerald-600 shrink-0 mt-0.5">{i + 1}</span>
                            <span className="leading-relaxed">{item}</span>
                        </li>
                    ))}
                </ul>
            </Section>

            {/* 3. Sharing */}
            <Section icon={Lock} title="3. Sharing of Information">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    We do <strong>not</strong> sell your personal data. We share information only in the following limited circumstances:
                </p>
                <div className="space-y-3">
                    {[
                        { party: "Dealerships", detail: "Dealerships can see anonymised engagement metrics for their own listings (views, wishlist adds). They cannot see individual user identities unless you initiate contact via WhatsApp." },
                        { party: "Clerk (Authentication)", detail: "Your sign-in is managed by Clerk Inc. Clerk processes authentication data under their own privacy policy. We receive only your profile details upon sign-in." },
                        { party: "Convex (Database)", detail: "All application data is stored on Convex's cloud infrastructure. Data is encrypted at rest (AES-256) and in transit (TLS 1.2+). Convex does not use your data for any purpose other than providing storage services to PulaDrive." },
                        { party: "PostHog (Product Analytics)", detail: "With your consent, we send anonymised behavioural events — such as page views, listing interactions, and search queries — to PostHog Inc. (US). PostHog may also record session replays and generate heatmaps. PostHog processes this data solely on our behalf as a data processor. Data is stored on PostHog's US-based infrastructure. You can opt out at any time via the cookie consent banner on our site, or by emailing privacy@puladrive.co.bw. PostHog's privacy policy is available at posthog.com/privacy." },
                        { party: "Upstash Redis (Caching Layer)", detail: "Search query results are temporarily cached in Upstash Redis for up to 5 minutes to improve response times. Only anonymised, non-personally-identifiable search parameters (price ranges, vehicle categories, etc.) are stored as cache keys. No user account data, names, or contact details are ever written to Redis. Data is encrypted at rest and in transit via TLS 1.2+." },
                        { party: "Legal Authorities", detail: "We may disclose personal data if required to do so by law, court order, or lawful request from governmental authorities in Botswana or applicable jurisdictions." },
                    ].map((item) => (
                        <div key={item.party} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                            <p className="text-sm font-black text-slate-900">{item.party}</p>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.detail}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* 4. Retention */}
            <Section icon={Database} title="4. Data Retention">
                <p className="text-sm text-slate-600 leading-relaxed">
                    We retain your data for as long as your account is active. If you delete your account, we will delete or anonymise your personal data within <strong>30 days</strong>, except where we are required to retain certain records for legal compliance (e.g. financial records for up to 7 years under Botswana law). Anonymised telemetry data (no personal identifiers) may be retained indefinitely for analytical purposes.
                </p>
            </Section>

            {/* 5. Your rights */}
            <Section icon={Shield} title="5. Your Rights">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    Under the Botswana Data Protection Act, 2018, you have the following rights regarding your personal data:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { right: "Right of Access", desc: "Request a copy of the personal data we hold about you." },
                        { right: "Right to Rectification", desc: "Ask us to correct inaccurate or incomplete data." },
                        { right: "Right to Erasure", desc: "Request deletion of your data (subject to legal retention obligations)." },
                        { right: "Right to Restrict Processing", desc: "Ask us to pause processing of your data in certain circumstances." },
                        { right: "Right to Data Portability", desc: "Receive your data in a structured, machine-readable format." },
                        { right: "Right to Object", desc: "Object to processing based on legitimate interests or for direct marketing." },
                        { right: "Right to Withdraw Analytics Consent", desc: "You may opt out of PostHog analytics at any time by clicking \"Decline\" in our cookie consent banner, or by emailing privacy@puladrive.co.bw. Withdrawing consent does not affect essential sign-in functionality." },
                    ].map((item) => (
                        <div key={item.right} className="p-4 bg-primary-50 rounded-2xl border border-primary-100 space-y-1">
                            <p className="text-sm font-black text-primary-900">{item.right}</p>
                            <p className="text-xs text-primary-700 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* 6. Contact */}
            <Section icon={Mail} title="6. Contact & Data Requests">
                <p className="text-sm text-slate-600 leading-relaxed">
                    To exercise any of your rights, or if you have questions about this Privacy Policy, please contact our Data Protection Officer:
                </p>
                <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-sm">
                    <p className="font-black text-slate-900">PulaDrive Data Protection Officer</p>
                    <p className="text-slate-600 font-medium">Email: <a href="mailto:privacy@puladrive.co.bw" className="text-primary-600 hover:underline">privacy@puladrive.co.bw</a></p>
                    <p className="text-slate-600 font-medium">Address: Gaborone, Botswana</p>
                    <p className="text-slate-400 text-xs mt-2">We will respond to all requests within <strong>30 days</strong> of receipt.</p>
                </div>
            </Section>

            {/* Related links */}
            <div className="p-5 bg-gradient-to-br from-primary-50 to-violet-50 rounded-3xl border border-primary-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-sm font-black text-slate-900">Related Legal Documents</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Review our other policies for the full picture.</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Link href="/legal/terms" className="text-xs font-bold px-4 py-2 bg-white border border-primary-200 text-primary-700 rounded-xl hover:bg-primary-50 transition-colors">
                        Terms of Use →
                    </Link>
                    <Link href="/legal/compliance" className="text-xs font-bold px-4 py-2 bg-white border border-primary-200 text-primary-700 rounded-xl hover:bg-primary-50 transition-colors">
                        Data & Compliance →
                    </Link>
                </div>
            </div>
        </article>
    );
}

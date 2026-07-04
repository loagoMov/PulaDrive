import Link from "next/link";
import { Database, Lock, Server, Users, Eye, Mail } from "lucide-react";

export const metadata = {
    title: "Data & Compliance — PulaDrive",
    description: "How PulaDrive handles data processing, compliance, and your privacy rights in detail.",
};

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <section className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon size={18} className="text-primary-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
        </div>
        <div>{children}</div>
    </section>
);

export default function CompliancePage() {
    return (
        <article className="space-y-12">
            {/* Hero */}
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    <Lock size={12} /> Compliance Document
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    Data & Compliance
                </h1>
                <p className="text-slate-500 font-medium">
                    Effective date: <strong className="text-slate-700">25 June 2026</strong> · Last reviewed: <strong className="text-slate-700">2 July 2026</strong>
                </p>
                <p className="text-slate-600 leading-relaxed text-sm max-w-2xl">
                    This document describes PulaDrive's data processing architecture, the third-party infrastructure providers we rely on, our internal compliance practices, and the obligations of dealerships using our platform. It supplements our <Link href="/legal/privacy" className="text-primary-600 hover:underline font-bold">Privacy Policy</Link>.
                </p>
            </div>

            {/* 1. Data processing principles */}
            <Section icon={Database} title="1. Data Processing Principles">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    PulaDrive processes personal data in accordance with the <strong>Botswana Data Protection Act, 2018</strong> and adopts internationally recognised principles aligned with GDPR best practices:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { principle: "Lawfulness & Transparency", detail: "We collect data only with a valid legal basis and tell you clearly what we collect and why." },
                        { principle: "Purpose Limitation", detail: "Data collected for one purpose (e.g. personalisation) is not used for unrelated purposes (e.g. advertising)." },
                        { principle: "Data Minimisation", detail: "We collect only what is necessary for the stated purpose — no more." },
                        { principle: "Accuracy", detail: "We take reasonable steps to keep your data accurate and up to date." },
                        { principle: "Storage Limitation", detail: "Data is retained only as long as necessary and deleted promptly thereafter." },
                        { principle: "Integrity & Confidentiality", detail: "We implement appropriate technical and organisational security measures to protect data." },
                    ].map((item) => (
                        <div key={item.principle} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
                            <p className="text-sm font-black text-emerald-900">{item.principle}</p>
                            <p className="text-xs text-emerald-700 font-medium leading-relaxed">{item.detail}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* 2. Infrastructure */}
            <Section icon={Server} title="2. Infrastructure & Sub-Processors">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    PulaDrive relies on the following trusted, industry-standard sub-processors. Each has been evaluated for security and compliance:
                </p>
                <div className="space-y-3">
                    {[
                        {
                            name: "Convex",
                            role: "Database & Real-time Backend",
                            detail: "All application data — vehicle listings, user profiles, telemetry events, search history — is stored on Convex. Data is encrypted at rest (AES-256) and in transit (TLS 1.2+). Convex operates under SOC 2 Type II controls.",
                            link: "https://convex.dev/privacy",
                        },
                        {
                            name: "Clerk",
                            role: "Authentication & Identity",
                            detail: "User sign-in, session management, and organization management is handled by Clerk. Clerk stores credentials securely and does not share them with PulaDrive. Clerk is SOC 2 Type II certified and GDPR compliant.",
                            link: "https://clerk.com/privacy",
                        },
                        {
                            name: "Vercel",
                            role: "Web Hosting & Edge Network",
                            detail: "PulaDrive's web application is hosted on Vercel's global edge network. Vercel does not process personal user data beyond standard HTTP request logs needed for operation.",
                            link: "https://vercel.com/legal/privacy-policy",
                        },
                        {
                            name: "Upstash",
                            role: "Redis Caching Layer",
                            detail: "Upstash Redis is used to cache anonymised search query results (e.g. price ranges, vehicle categories) for up to 5 minutes, reducing latency for users. No personally identifiable information — including names, emails, or account data — is stored in Redis. All cached keys are automatically expired via Redis TTL mechanisms. Data is encrypted at rest and in transit (TLS 1.2+). Upstash is SOC 2 Type II certified.",
                            link: "https://upstash.com/privacy",
                        },
                        {
                            name: "Resend",
                            role: "Transactional Email",
                            detail: "Dealer notification and billing reminder emails are dispatched via Resend. Resend processes the recipient email address and message content only. No user browsing data is shared with Resend.",
                            link: "https://resend.com/privacy",
                        },
                    ].map((sp) => (
                        <div key={sp.name} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-black text-slate-900">{sp.name}</p>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-primary-600">{sp.role}</p>
                                </div>
                                <a href={sp.link} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-primary-600 hover:underline">
                                    Privacy Policy ↗
                                </a>
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{sp.detail}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* 3. Telemetry */}
            <Section icon={Eye} title="3. Telemetry & Analytics Transparency">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    PulaDrive uses a first-party telemetry system (built on Convex) to track user behaviour. Here is exactly what we track and why:
                </p>
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Event</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Data Logged</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Purpose</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[
                                { event: "page_view", data: "Session ID, page route, timestamp", purpose: "Platform analytics" },
                                { event: "vehicle_view", data: "Vehicle ID, session ID, timestamp", purpose: "For You feed personalisation; dealer view counts" },
                                { event: "wishlist_add / remove", data: "Vehicle ID, session ID", purpose: "Wishlist feature; personalisation weight" },
                                { event: "search_query", data: "Query text, category, price (no PII)", purpose: "Search ranking improvements" },
                                { event: "ai_search", data: "Filter parameters (budget, specs)", purpose: "AI Deal Finder personalisation" },
                                { event: "contact_click", data: "Vehicle ID, dealer ID", purpose: "Dealer analytics dashboard" },
                            ].map((row) => (
                                <tr key={row.event} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{row.event}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{row.data}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{row.purpose}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-3">
                    * No third-party tracking scripts (Google Analytics, Meta Pixel, etc.) are loaded on PulaDrive. All telemetry is first-party only.
                </p>
            </Section>

            {/* 4. Dealer obligations */}
            <Section icon={Users} title="4. Dealer Data Obligations">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    Dealers who use PulaDrive to list vehicles take on specific data responsibilities:
                </p>
                <ul className="space-y-2">
                    {[
                        "Dealers must not upload or display personal data of third parties (e.g. previous owner names, ID numbers) in listings or images.",
                        "Dealers are solely responsible for obtaining consent from any individuals depicted in uploaded photos.",
                        "WhatsApp numbers submitted to PulaDrive are displayed to prospective buyers — dealers must ensure these numbers are correct and that the number's owner consents to receiving vehicle enquiries.",
                        "Dealers may access anonymised analytics about their own listings only. Individual buyer identities are never disclosed to dealers.",
                        "Dealers must not attempt to use PulaDrive infrastructure to collect or aggregate buyer data for external marketing.",
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center text-[10px] font-black text-primary-600 shrink-0 mt-0.5">{i + 1}</span>
                            <p className="text-xs font-bold text-slate-600 leading-relaxed">{item}</p>
                        </li>
                    ))}
                </ul>
            </Section>

            {/* 5. Security */}
            <Section icon={Lock} title="5. Security Measures">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { measure: "Encryption at Rest", detail: "All database records on Convex are encrypted using AES-256. Redis cache entries on Upstash are encrypted at rest. No plaintext personal data is persisted to any unencrypted storage." },
                        { measure: "Encryption in Transit", detail: "All data transmitted between your browser and our servers uses TLS 1.2 or higher. This applies to Convex, Upstash Redis, Clerk, and Vercel endpoints." },
                        { measure: "Authentication Security", detail: "Clerk enforces rate limiting, brute-force protection, and secure session management. Multi-factor authentication is available for all user accounts." },
                        { measure: "Access Controls", detail: "Dealer dashboards are protected by Clerk organization membership. Admin access requires explicit whitelisting via environment-variable-controlled lists. All sensitive mutations are guarded server-side." },
                        { measure: "Rate Limiting", detail: "All public-facing mutations (search saves, vehicle reports, uploads, featured applications, telemetry) are protected by sliding-window rate limits enforced at the server layer. This prevents abuse and protects service availability." },
                        { measure: "Input Validation & Sanitisation", detail: "All API parameters are validated server-side. Enum fields (fuel type, category, colour, transmission) are whitelisted. Free-text inputs (make/model search) are sanitised to strip non-printable characters and capped at 100 characters. Cache key injection is prevented by capping key length at 512 characters." },
                        { measure: "Webhook & API Security", detail: "Internal HTTP endpoints (telemetry export, analytics import) are protected using constant-time HMAC secret comparison to prevent timing oracle attacks. Payload sizes are capped at 1MB to prevent denial-of-service." },
                        { measure: "HTTP Security Headers", detail: "All responses include X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security (production), Referrer-Policy: no-referrer, Permissions-Policy, Content-Security-Policy, Cross-Origin-Resource-Policy, and X-Permitted-Cross-Domain-Policies headers." },
                        { measure: "Cache Data Isolation", detail: "Upstash Redis only ever stores anonymised, non-personal search filter parameters with automatic 5-minute TTL expiration. User identity data is never written to the cache layer." },
                        { measure: "Incident Response", detail: "In the event of a data breach, we will notify affected users within 72 hours of discovery, as required by applicable law." },
                        { measure: "No Password Storage", detail: "PulaDrive never stores passwords. Authentication is delegated entirely to Clerk." },
                    ].map((item) => (
                        <div key={item.measure} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                <p className="text-sm font-black text-slate-900">{item.measure}</p>
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed pl-4">{item.detail}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* 6. Contact */}
            <Section icon={Mail} title="6. Data Requests & DPO Contact">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    PulaDrive has designated a Data Protection Officer (DPO) as required under the Botswana Data Protection Act. All data subject requests, compliance enquiries, and breach notifications should be directed to:
                </p>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-sm">
                    <p className="font-black text-slate-900">PulaDrive Data Protection Officer</p>
                    <p className="text-slate-600 font-medium">Email: <a href="mailto:privacy@puladrive.co.bw" className="text-primary-600 hover:underline">privacy@puladrive.co.bw</a></p>
                    <p className="text-slate-600 font-medium">General support: <a href="mailto:support@puladrive.co.bw" className="text-primary-600 hover:underline">support@puladrive.co.bw</a></p>
                    <p className="text-slate-400 text-xs mt-2">Response time: within <strong>30 calendar days</strong> of receipt. For urgent security matters, mark your email subject line with [URGENT].</p>
                </div>
            </Section>

            {/* Related links */}
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-primary-50 rounded-3xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-sm font-black text-slate-900">Related Legal Documents</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Review our other policies for the full picture.</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Link href="/legal/privacy" className="text-xs font-bold px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors">
                        Privacy Policy →
                    </Link>
                    <Link href="/legal/terms" className="text-xs font-bold px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors">
                        Terms of Use →
                    </Link>
                </div>
            </div>
        </article>
    );
}

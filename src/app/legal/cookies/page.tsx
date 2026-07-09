import Link from "next/link";
import { Cookie, Shield, Eye, Database, Info, Mail } from "lucide-react";

export const metadata = {
    title: "Cookie Policy — PulaDrive",
    description: "Understand how PulaDrive uses cookies and local storage to run our platform.",
};

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <section className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon size={18} className="text-primary-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
        </div>
        <div className="legal-prose text-sm text-slate-600 leading-relaxed">{children}</div>
    </section>
);

export default function CookiePolicyPage() {
    return (
        <article className="space-y-12">
            {/* Hero */}
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    <Cookie size={12} /> Cookie Policy
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    Cookie Policy
                </h1>
                <p className="text-slate-500 font-medium">
                    Effective date: <strong className="text-slate-700">2 July 2026</strong> · Last reviewed: <strong className="text-slate-700">9 July 2026</strong>
                </p>
                <p className="text-slate-600 leading-relaxed text-sm max-w-2xl">
                    This Cookie Policy explains how PulaDrive (Pty) Ltd ("we", "our", or "us") uses cookies, local storage, and similar technologies on our platform. In the spirit of privacy-first transparency, we keep our use of trackers to an absolute minimum.
                </p>
            </div>

            {/* 1. What are cookies */}
            <Section icon={Info} title="1. What Are Cookies and Local Storage?">
                <p>
                    Cookies are small text files stored on your device by your web browser when you visit a website. Local storage is a modern browser feature that allows websites to store small amounts of data directly on your device. Unlike cookies, local storage data does not travel with every network request, making it faster and more secure for offline features.
                </p>
            </Section>

            {/* 2. Our approach */}
            <Section icon={Shield} title="2. Our Approach to Tracking">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 font-medium space-y-1">
                    <p className="font-black">Our Privacy Pledge</p>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                        We do <strong>not</strong> use any third-party marketing cookies, Meta Pixels, Google Ads tags, or retargeting scripts. We use one first-party analytics tool — PostHog — solely to improve our platform, and only with your consent.
                    </p>
                </div>
                <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                    PostHog is used to capture anonymised product analytics events (page views, listing interactions, searches), session recordings, and heatmaps. When you accept analytics cookies, events are sent to PostHog's US-based servers. Your Clerk sign-in ID may be used to associate events with your account for cross-session analysis. Password fields are always masked in session recordings.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                    You can opt out at any time — see Section 4 below.
                </p>
            </Section>

            {/* 3. Types of cookies */}
            <Section icon={Database} title="3. How We Use Storage">
                <p className="mb-4">We use browser storage for the following reasons:</p>
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                        <p className="text-sm font-black text-slate-900">Essential Session & Authentication (Cookies)</p>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Managed securely by our identity provider, <strong>Clerk</strong>. These cookies keep you logged in to your account, secure your session, and prevent Cross-Site Request Forgery (CSRF) attacks. Without these, our portal cannot function. <strong>These are always active and cannot be disabled.</strong>
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">Always On</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                        <p className="text-sm font-black text-slate-900">Preferences & Wishlist (Local Storage)</p>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Used to save your local vehicle wishlist, theme selection, and recent search filters if you are browsing as a guest. This data remains on your physical device and is never shared.
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">Always On</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                        <p className="text-sm font-black text-slate-900">Internal Analytics (Local Storage)</p>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Generates a random anonymous session ID used to power your personalised "For You" feed and provide dealers with engagement metrics. Stored locally; never sent to third parties.
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">Always On</span>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-1">
                        <p className="text-sm font-black text-amber-900">PostHog Product Analytics (Cookies + Local Storage)</p>
                        <p className="text-xs text-amber-700 font-medium leading-relaxed">
                            With your consent, PostHog stores a distinct user ID cookie (<code className="bg-amber-100 px-1 rounded">ph_*</code>) and local storage keys to track sessions across page visits. This enables page view analytics, session recordings, heatmaps, and product funnel analysis. Data is sent to PostHog's US infrastructure. Password fields are always masked.
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-widest text-amber-600 border border-amber-200 rounded-full px-2 py-0.5">Consent Required</span>
                    </div>
                </div>
            </Section>

            {/* 4. Managing storage */}
            <Section icon={Eye} title="4. Your Consent & Opt-Out Options">
                <p className="mb-3">
                    When you first visit PulaDrive, a consent banner appears. Clicking <strong>Accept All</strong> enables PostHog analytics. Clicking <strong>Decline</strong> disables all PostHog tracking — essential session cookies remain unaffected.
                </p>
                <p className="mb-3">
                    You can change your preference at any time by clearing your browser's local storage for puladrive.com and reloading the page, or by emailing <a href="mailto:privacy@puladrive.co.bw" className="text-primary-600 hover:underline font-bold">privacy@puladrive.co.bw</a>.
                </p>
                <p className="mb-4 font-medium text-slate-700">
                    Most web browsers also allow you to block or delete cookies directly:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-500 font-medium">
                    <li><strong>Chrome</strong>: Settings &gt; Privacy and Security &gt; Cookies and other site data</li>
                    <li><strong>Safari</strong>: Preferences &gt; Privacy &gt; Prevent cross-site tracking / Block all cookies</li>
                    <li><strong>Firefox</strong>: Settings &gt; Privacy &gt; Enhanced Tracking Protection</li>
                </ul>
                <p className="mt-3 text-xs text-slate-400">
                    Note: Blocking essential session cookies will prevent you from signing in to your dealer or admin account.
                </p>
            </Section>

            {/* 5. Contact */}
            <Section icon={Mail} title="5. Questions?">
                <p>
                    If you have any questions about this Cookie Policy, feel free to contact our Data Protection Officer at{" "}
                    <a href="mailto:privacy@puladrive.co.bw" className="text-primary-600 hover:underline font-bold">
                        privacy@puladrive.co.bw
                    </a>.
                </p>
            </Section>

            {/* Related links */}
            <div className="p-5 bg-gradient-to-br from-primary-50 to-violet-50 rounded-3xl border border-primary-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-sm font-black text-slate-900">Related Legal Documents</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Review our other policies for the full picture.</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Link href="/legal/privacy" className="text-xs font-bold px-4 py-2 bg-white border border-primary-200 text-primary-700 rounded-xl hover:bg-primary-50 transition-colors">
                        Privacy Policy →
                    </Link>
                    <Link href="/legal/compliance" className="text-xs font-bold px-4 py-2 bg-white border border-primary-200 text-primary-700 rounded-xl hover:bg-primary-50 transition-colors">
                        Data & Compliance →
                    </Link>
                </div>
            </div>
        </article>
    );
}

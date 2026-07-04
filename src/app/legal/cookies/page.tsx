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
                    Effective date: <strong className="text-slate-700">2 July 2026</strong> · Last reviewed: <strong className="text-slate-700">2 July 2026</strong>
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

            {/* 2. No third party ads */}
            <Section icon={Shield} title="2. Zero Third-Party Advertising & Tracking">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 font-medium space-y-1">
                    <p className="font-black">Our Privacy Pledge</p>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                        We do **not** use any third-party marketing cookies, cross-site trackers, or advertising beacons (such as Google Analytics, Meta Pixels, or retargeting scripts). All storage mechanisms on our platform are purely functional or first-party analytical tools.
                    </p>
                </div>
            </Section>

            {/* 3. Types of cookies */}
            <Section icon={Database} title="3. How We Use Storage">
                <p className="mb-4">We use browser storage for three specific reasons:</p>
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                        <p className="text-sm font-black text-slate-900">Essential Session & Authentication (Cookies)</p>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Managed securely by our identity provider, **Clerk**. These cookies keep you logged in to your account, secure your session, and prevent Cross-Site Request Forgery (CSRF) attacks. Without these, our portal cannot function.
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                        <p className="text-sm font-black text-slate-900">Preferences & Wishlist (Local Storage)</p>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Used to save your local vehicle wishlist, theme selection, and recent search filters if you are browsing as a guest. This data remains on your physical device and is never shared.
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                        <p className="text-sm font-black text-slate-900">First-Party Analytics (Local Storage)</p>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Generates a random unique session ID to count listing page views and wishlist interactions. This powers your personalized "For You" dashboard feeds and provides dealers with anonymous engagement metrics.
                        </p>
                    </div>
                </div>
            </Section>

            {/* 4. Managing storage */}
            <Section icon={Eye} title="4. How to Manage and Control Cookies">
                <p className="mb-3">
                    Most web browsers allow you to block, delete, or restrict cookies and local storage items through their settings:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-500 font-medium">
                    <li>**Chrome**: Settings &gt; Privacy and Security &gt; Cookies and other site data</li>
                    <li>**Safari**: Preferences &gt; Privacy &gt; Prevent cross-site tracking / Block all cookies</li>
                    <li>**Firefox**: Settings &gt; Privacy &gt; Enhanced Tracking Protection</li>
                </ul>
                <p className="mt-3">
                    *Note: Blocking essential session cookies will prevent you from signing in to your dealer or admin account.*
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

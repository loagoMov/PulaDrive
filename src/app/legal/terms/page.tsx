import Link from "next/link";
import { FileText, Users, Ban, Scale, AlertTriangle, Building2 } from "lucide-react";

export const metadata = {
    title: "Terms of Use — PulaDrive",
    description: "Read the PulaDrive Terms of Use before browsing or listing vehicles on our platform.",
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

export default function TermsPage() {
    return (
        <article className="space-y-12">
            {/* Hero */}
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    <FileText size={12} /> Legal Document
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    Terms of Use
                </h1>
                <p className="text-slate-500 font-medium">
                    Effective date: <strong className="text-slate-700">25 June 2026</strong> · Last reviewed: <strong className="text-slate-700">2 July 2026</strong>
                </p>
                <p className="text-slate-600 leading-relaxed text-sm max-w-2xl">
                    These Terms of Use ("Terms") govern your access to and use of the PulaDrive platform, including our website, mobile interfaces, and all related services ("Platform") operated by <strong>PulaDrive (Pty) Ltd</strong>, a company registered in Botswana. Please read these Terms carefully before using our Platform.
                </p>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-800 font-medium">
                    By accessing or using PulaDrive, you agree to be bound by these Terms. If you do not agree, you must not use our Platform.
                </div>
            </div>

            {/* 1. Platform description */}
            <Section icon={Building2} title="1. About the Platform">
                <p className="text-sm text-slate-600 leading-relaxed">
                    PulaDrive is a digital vehicle marketplace that connects buyers with registered car dealerships across Botswana. PulaDrive is a <strong>listing and discovery platform</strong> — we do not buy, sell, or own any vehicles. All transactions occur directly between buyers and dealerships. We are not a party to any sale and accept no liability for any vehicle transaction conducted off-platform.
                </p>
            </Section>

            {/* 2. Eligibility */}
            <Section icon={Users} title="2. Eligibility & Accounts">
                <div className="space-y-3 text-sm text-slate-600">
                    <p className="leading-relaxed">You may use PulaDrive only if you:</p>
                    <ul className="space-y-2">
                        {[
                            "Are at least 18 years of age.",
                            "Have the legal capacity to enter into binding agreements under Botswana law.",
                            "Are not prohibited from using the Platform under any applicable law.",
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5 shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="leading-relaxed mt-4">
                        You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately at <a href="mailto:support@puladrive.co.bw" className="text-primary-600 hover:underline">support@puladrive.co.bw</a> if you suspect any unauthorised access to your account.
                    </p>
                </div>
            </Section>

            {/* 3. Acceptable use */}
            <Section icon={FileText} title="3. Acceptable Use">
                <div className="space-y-4 text-sm text-slate-600">
                    <div>
                        <p className="font-black text-slate-800 mb-2">For Buyers</p>
                        <ul className="space-y-1.5">
                            {[
                                "You may browse listings, add vehicles to your wishlist, and contact dealerships.",
                                "All contact with dealerships must be made in good faith.",
                                "You may not use PulaDrive to scrape, harvest, or automatically extract listing data.",
                                "Automated or high-frequency requests that exceed normal browsing behaviour may be rate-limited or blocked to protect platform availability for all users.",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="font-black text-slate-800 mb-2">For Dealerships</p>
                        <ul className="space-y-1.5">
                            {[
                                "All vehicle listings must be accurate, complete, and not misleading.",
                                "Dealers are solely responsible for the accuracy of pricing, mileage, year, condition, and all other listing details.",
                                "Listings must relate to vehicles physically available for sale in Botswana.",
                                "Dealers must honour published prices unless clearly marked as negotiable.",
                                "Dealers must maintain at least one valid contact method on their profile.",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Section>

            {/* 4. Prohibited conduct */}
            <Section icon={Ban} title="4. Prohibited Conduct">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">The following conduct is strictly prohibited on PulaDrive:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                        "Posting fraudulent, inaccurate, or misleading vehicle listings",
                        "Impersonating any person, dealership, or entity",
                        "Using the Platform to facilitate money laundering or fraud",
                        "Uploading malicious code, scripts, or files",
                        "Attempting to gain unauthorised access to any account or system",
                        "Circumventing any security or access controls",
                        "Harvesting contact information from dealer profiles for unsolicited marketing",
                        "Interfering with the operation of the Platform",
                        "Violating any applicable law or regulation of Botswana",
                        "Posting content that is defamatory, obscene, or discriminatory",
                    ].map((item) => (
                        <div key={item} className="flex items-start gap-2.5 p-3 bg-rose-50 rounded-xl border border-rose-100">
                            <span className="text-rose-500 mt-0.5 shrink-0">✕</span>
                            <p className="text-xs font-bold text-rose-800 leading-relaxed">{item}</p>
                        </div>
                    ))}
                </div>
                <p className="text-sm text-slate-500 font-medium mt-4">
                    Violation of these prohibitions may result in immediate suspension or permanent removal from the Platform, and may be reported to the relevant Botswana authorities.
                </p>
            </Section>

            {/* 5. Intellectual property */}
            <Section icon={FileText} title="5. Intellectual Property">
                <p className="text-sm text-slate-600 leading-relaxed">
                    The PulaDrive name, logo, design, software, and all content created by us (including descriptions, rankings, and AI-generated match scores) are owned by PulaDrive (Pty) Ltd and are protected by intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written permission.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed mt-3">
                    By submitting vehicle listings, photos, or other content to PulaDrive, you grant us a non-exclusive, royalty-free, worldwide licence to display, reproduce, and distribute that content in connection with the operation of our Platform.
                </p>
            </Section>

            {/* 6. Disclaimers */}
            <Section icon={AlertTriangle} title="6. Disclaimers & Limitation of Liability">
                <div className="space-y-3 text-sm text-slate-600">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                        <p className="font-black text-amber-900 mb-1">No Warranty</p>
                        <p className="leading-relaxed text-amber-800">
                            PulaDrive is provided "as is" and "as available". We make no warranties, express or implied, about the accuracy of listings, the availability of the Platform, or the fitness of any vehicle for a particular purpose.
                        </p>
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                        <p className="font-black text-amber-900 mb-1">Vehicle Condition</p>
                        <p className="leading-relaxed text-amber-800">
                            PulaDrive does not inspect, verify, or guarantee the condition, title, or ownership of any vehicle. Buyers are strongly advised to conduct independent inspections and verify vehicle documentation (e.g. BDF/SARS clearance, VIN check) before purchase.
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <p className="font-black text-slate-900 mb-1">Limitation of Liability</p>
                        <p className="leading-relaxed">
                            To the maximum extent permitted by Botswana law, PulaDrive's total liability for any claims arising under these Terms shall not exceed BWP 1,000. We shall not be liable for any indirect, incidental, consequential, or punitive damages.
                        </p>
                    </div>
                </div>
            </Section>

            {/* 7. Governing law */}
            <Section icon={Scale} title="7. Governing Law & Disputes">
                <p className="text-sm text-slate-600 leading-relaxed">
                    These Terms are governed by the laws of the <strong>Republic of Botswana</strong>. Any disputes arising from these Terms or your use of PulaDrive shall be subject to the exclusive jurisdiction of the courts of Botswana. We encourage users to contact us first at <a href="mailto:support@puladrive.co.bw" className="text-primary-600 hover:underline">support@puladrive.co.bw</a> to resolve disputes informally before resorting to legal proceedings.
                </p>
            </Section>

            {/* 8. Changes */}
            <Section icon={FileText} title="8. Changes to These Terms">
                <p className="text-sm text-slate-600 leading-relaxed">
                    We may update these Terms at any time. When we do, we will update the "Last reviewed" date at the top of this page. Your continued use of PulaDrive after changes are posted constitutes your acceptance of the new Terms.
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

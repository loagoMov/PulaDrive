import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sticky top bar */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back
                    </Link>
                    <div className="h-4 w-px bg-slate-200" />
                    <span className="text-sm font-black text-slate-900">
                        PulaDrive<span className="text-primary-600">.</span>
                    </span>
                    <span className="text-sm text-slate-400 font-medium">Legal</span>
                </div>
            </header>

            {/* Content area */}
            <main className="max-w-4xl mx-auto px-4 py-12 pb-32">
                {children}
            </main>

            {/* Bottom legal nav */}
            <footer className="max-w-4xl mx-auto px-4 pb-12 flex flex-wrap gap-4 text-xs font-bold text-slate-400">
                <Link href="/legal/privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link>
                <Link href="/legal/terms" className="hover:text-primary-600 transition-colors">Terms of Use</Link>
                <Link href="/legal/compliance" className="hover:text-primary-600 transition-colors">Data & Compliance</Link>
                <span className="ml-auto">© 2026 PulaDrive (Pty) Ltd</span>
            </footer>
        </div>
    );
}

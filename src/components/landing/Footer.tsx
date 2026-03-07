import Link from "next/link";

export function Footer() {
    return (
        <footer className="pt-[60px] pb-[40px] px-6 md:px-12 bg-brand-black border-t border-white/5 relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-10 mb-12">
                <div>
                    <Link href="/" className="font-bebas text-[32px] tracking-[0.1em] text-white hover:opacity-90 transition-opacity">
                        WANDER<span className="text-brand-orange">PLAN</span>
                    </Link>
                    <p className="text-[13px] text-white/30 font-light mt-1.5">
                        Plan together. Travel better.
                    </p>
                </div>

                <div className="flex flex-wrap gap-16 md:gap-[60px]">
                    <div className="flex flex-col gap-4">
                        <h5 className="font-mono text-[10px] tracking-[0.15em] uppercase text-brand-orange">Product</h5>
                        <ul className="flex flex-col gap-2.5">
                            <li><Link href="#features" className="text-[13px] text-white/40 hover:text-white transition-colors cursor-none">Features</Link></li>
                            <li><Link href="#how" className="text-[13px] text-white/40 hover:text-white transition-colors cursor-none">How it works</Link></li>
                            <li><Link href="#ai" className="text-[13px] text-white/40 hover:text-white transition-colors cursor-none">AI Planning</Link></li>
                            <li><Link href="#" className="text-[13px] text-white/40 hover:text-white transition-colors cursor-none">Pricing</Link></li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h5 className="font-mono text-[10px] tracking-[0.15em] uppercase text-brand-orange">Resources</h5>
                        <ul className="flex flex-col gap-2.5">
                            <li><Link href="#" className="text-[13px] text-white/40 hover:text-white transition-colors cursor-none">Documentation</Link></li>
                            <li><Link href="#" className="text-[13px] text-white/40 hover:text-white transition-colors cursor-none">GitHub</Link></li>
                            <li><Link href="#" className="text-[13px] text-white/40 hover:text-white transition-colors cursor-none">Roadmap</Link></li>
                            <li><Link href="#" className="text-[13px] text-white/40 hover:text-white transition-colors cursor-none">Changelog</Link></li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h5 className="font-mono text-[10px] tracking-[0.15em] uppercase text-brand-orange">Company</h5>
                        <ul className="flex flex-col gap-2.5">
                            <li><Link href="#" className="text-[13px] text-white/40 hover:text-white transition-colors cursor-none">About</Link></li>
                            <li><Link href="#" className="text-[13px] text-white/40 hover:text-white transition-colors cursor-none">Privacy</Link></li>
                            <li><Link href="#" className="text-[13px] text-white/40 hover:text-white transition-colors cursor-none">Terms</Link></li>
                            <li><Link href="#" className="text-[13px] text-white/40 hover:text-white transition-colors cursor-none">Contact</Link></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="font-mono text-[12px] text-white/20">
                    © {new Date().getFullYear()} WanderPlan — Buildathon Cohort 26
                </p>
                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-brand-orange border border-brand-orange/30 px-2.5 py-1">
                    Next.js 16 + Convex
                </div>
            </div>
        </footer>
    );
}

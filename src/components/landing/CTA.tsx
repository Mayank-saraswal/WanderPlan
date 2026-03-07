import Link from "next/link";

export function CTA() {
    return (
        <section className="py-[120px] px-6 md:px-12 bg-brand-orange flex flex-col items-center text-center relative overflow-hidden z-0">
            {/* Background Watermark */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 font-bebas text-[60vw] leading-[0.8] tracking-[-0.02em] text-black/5 pointer-events-none select-none z-0">
                GO
            </div>

            <div className="relative z-10 flex flex-col items-center w-full">
                <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase text-black/50 mb-6 reveal">
                    <div className="w-6 h-px bg-black/40" />
                    Get started today
                </div>

                <h2 className="font-bebas text-[clamp(48px,6vw,88px)] leading-[0.95] tracking-[0.02em] text-black mb-6 reveal reveal-delay-1">
                    YOUR NEXT TRIP<br />
                    STARTS HERE
                </h2>

                <p className="max-w-[480px] text-[17px] text-black/55 leading-[1.6] font-light mb-12 reveal reveal-delay-2">
                    Stop planning in scattered group chats. WanderPlan gives your crew one shared workspace — with AI, real-time sync, and zero chaos.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 reveal reveal-delay-3">
                    <Link
                        href="/dashboard"
                        className="bg-black text-white text-[14px] font-bold tracking-[0.1em] uppercase px-10 py-4 inline-block cursor-none transition-all duration-200 hover:opacity-85 hover:-translate-y-0.5 rounded-none"
                    >
                        Start Planning Free
                    </Link>
                    <Link
                        href="#features"
                        className="text-black text-[13px] font-semibold tracking-[0.08em] uppercase pb-0.5 border-b-2 border-black/40 transition-colors hover:border-black cursor-none"
                    >
                        Explore features
                    </Link>
                </div>
            </div>
        </section>
    );
}

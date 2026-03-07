import Link from "next/link";

export function Hero() {
    const tickerItems = [
        "Day-wise Itinerary",
        "WanderAI Planning",
        "Budget & Settlements",
        "Real-time Chat",
        "Interactive Map",
        "Ideas Board",
        "Boarding Passes",
        "Packing Lists"
    ];

    // Double to ensure seamless looping
    const duplicatedTickerItems = [...tickerItems, ...tickerItems];

    return (
        <section className="relative min-h-screen flex flex-col justify-end px-6 md:px-12 pb-[72px] bg-brand-black overflow-hidden pt-32">
            {/* Background Grid & Gradient */}
            <div
                className="absolute inset-0 z-0 bg-brand-black pointer-events-none"
                style={{
                    backgroundImage: `
            radial-gradient(ellipse 60% 50% at 70% 40%, rgba(234,88,12,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 10% 80%, rgba(245,158,11,0.06) 0%, transparent 60%)
          `
                }}
            />
            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(234,88,12,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(234,88,12,0.06) 1px, transparent 1px)
          `,
                    backgroundSize: '80px 80px',
                    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)'
                }}
            />

            {/* Ticker Strip */}
            <div className="absolute top-16 left-0 right-0 overflow-hidden border-y border-white/5 bg-white/5 py-2.5 z-10">
                <div className="flex whitespace-nowrap animate-[ticker_28s_linear_infinite]">
                    {duplicatedTickerItems.map((item, idx) => (
                        <div key={idx} className="flex items-center shrink-0 font-mono text-[11px] tracking-[0.15em] text-gray-500 uppercase">
                            <span className="text-brand-orange mx-3">✦</span>
                            {item}
                        </div>
                    ))}
                </div>
            </div>

            {/* Vertical Stats (Right side) */}
            <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 flex-col gap-8 z-10 reveal reveal-delay-4">
                <div className="text-right">
                    <div className="font-bebas text-[42px] leading-none text-white">14<span className="text-brand-orange">+</span></div>
                    <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-gray-500 mt-0.5">App Pages</div>
                </div>
                <div className="text-right">
                    <div className="font-bebas text-[42px] leading-none text-white">5<span className="text-brand-orange">×</span></div>
                    <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-gray-500 mt-0.5">AI Features</div>
                </div>
                <div className="text-right">
                    <div className="font-bebas text-[42px] leading-none text-white">3<span className="text-brand-orange">↑</span></div>
                    <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-gray-500 mt-0.5">User Roles</div>
                </div>
            </div>

            {/* Main Content (Bottom Left) */}
            <div className="relative z-10 max-w-[800px]">
                {/* Eyebrow */}
                <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase text-brand-orange mb-6 reveal">
                    <div className="w-8 h-[1px] bg-brand-orange" />
                    Collaborative Trip Planning Platform
                </div>

                {/* Headline */}
                <h1 className="font-bebas text-[clamp(60px,13vw,190px)] leading-[0.9] tracking-[0.01em] mb-12 reveal reveal-delay-1 flex flex-col">
                    <span className="text-white block">PLAN</span>
                    <span className="text-brand-orange block">TOGETHER.</span>
                    <span className="block text-transparent stroke-white" style={{ WebkitTextStroke: '1.5px white', color: 'transparent' }}>TRAVEL BETTER.</span>
                </h1>

                {/* Subline and Buttons row */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mt-12 reveal reveal-delay-2">
                    <p className="max-w-[380px] text-[16px] leading-[1.7] text-white/60 font-light">
                        WanderPlan brings your entire travel crew into one shared workspace. Build <strong className="text-white font-medium">day-by-day itineraries</strong>, split costs, chat in real-time and let <strong className="text-white font-medium">WanderAI do the heavy planning</strong> — zero chaos.
                    </p>

                    <div className="flex items-center gap-5 shrink-0">
                        <Link
                            href="/dashboard"
                            className="bg-brand-orange text-black text-[14px] font-bold tracking-[0.1em] uppercase px-9 py-4 inline-flex items-center relative overflow-hidden group cursor-none rounded-none transition-transform hover:-translate-y-0.5 hover:bg-amber-400"
                        >
                            <span className="mr-6">Start Planning Free</span>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-200 group-hover:translate-x-1">→</span>
                        </Link>
                        <Link
                            href="#features"
                            className="text-white text-[13px] font-medium tracking-[0.08em] uppercase pb-0.5 border-b border-white/30 transition-colors hover:text-brand-orange hover:border-brand-orange cursor-none decorative-none"
                        >
                            See all features
                        </Link>
                    </div>
                </div>
            </div>

            {/* Scroll Hint */}
            <div className="absolute bottom-[72px] right-6 md:right-12 flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-gray-500 reveal reveal-delay-3 z-10">
                <div className="relative w-px h-12 bg-gray-500/30 overflow-hidden">
                    <div className="absolute left-0 w-full h-[40%] bg-brand-orange animate-[scrollDown_1.8s_ease-in-out_infinite]" />
                </div>
                Scroll to explore
            </div>
        </section>
    );
}

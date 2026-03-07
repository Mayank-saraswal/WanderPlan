import { List, Lightbulb, DollarSign, MessageCircle, Globe, BarChart2 } from "lucide-react";

export function Features() {
    const heroFeatures = [
        {
            num: "01",
            icon: List,
            title: "Day-wise Itinerary",
            desc: "Drag and drop activities across days. Set times, locations and categories. Whole crew edits simultaneously.",
            tag: "drag & drop"
        },
        {
            num: "02",
            icon: Lightbulb,
            title: "Ideas Board",
            desc: "Brainstorm destinations before committing. Vote, comment, and promote the best ideas to the itinerary.",
            tag: "collaborative"
        },
        {
            num: "03",
            icon: DollarSign,
            title: "Budget & Settlements",
            desc: "Track shared expenses, split costs, and let WanderAI explain who owes who in plain language.",
            tag: "AI settlements"
        },
        {
            num: "04",
            icon: MessageCircle,
            title: "Real-time Chat",
            desc: "Built-in trip messaging. Every conversation lives inside your trip — no WhatsApp switching.",
            tag: "in-app only"
        },
        {
            num: "05",
            icon: Globe,
            title: "Interactive Map",
            desc: "See all planned activities pinned geographically. Visualize your whole trip route in one view.",
            tag: "geo view"
        },
        {
            num: "06",
            icon: BarChart2,
            title: "Trip Analytics",
            desc: "Visual charts breaking down where your budget went — food, transport, accommodation.",
            tag: "spend breakdown"
        }
    ];

    return (
        <section id="features" className="py-[120px] px-6 md:px-12 bg-brand-black">
            <div className="max-w-[600px] mb-20 reveal">
                <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase text-brand-orange mb-5">
                    <div className="w-6 h-px bg-brand-orange" />
                    Core Features
                </div>
                <h2 className="font-bebas text-[clamp(48px,6vw,88px)] leading-[0.95] tracking-[0.02em] text-white mb-5">
                    EVERYTHING YOUR TRIP NEEDS
                </h2>
                <p className="text-[16px] text-white/50 leading-[1.7] font-light">
                    From the first destination search to the last expense receipt — WanderPlan handles the full journey lifecycle, together.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
                {heroFeatures.map((feat, idx) => {
                    const delayClass = `reveal-delay-${(idx % 3) + 1}`;
                    return (
                        <div key={idx} className={`group relative bg-brand-black p-12 overflow-hidden transition-colors hover:bg-[#111] cursor-none reveal ${delayClass}`}>
                            {/* Number bg */}
                            <div className="absolute top-4 right-6 font-bebas text-[64px] leading-none text-white/5 transition-colors group-hover:text-brand-orange/10 z-0 pointer-events-none">
                                {feat.num}
                            </div>

                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 bg-[linear-gradient(135deg,rgba(234,88,12,0.06)_0%,transparent_60%)] pointer-events-none" />

                            <div className="relative z-10 w-full">
                                {/* Icon Box */}
                                <div className="w-11 h-11 border border-white/15 flex items-center justify-center text-brand-orange mb-7 transition-colors group-hover:bg-brand-orange group-hover:text-black group-hover:border-brand-orange rounded-none">
                                    <feat.icon strokeWidth={1.5} className="w-5 h-5" />
                                </div>

                                <h3 className="font-bebas text-[28px] tracking-[0.04em] text-white mb-3">
                                    {feat.title}
                                </h3>

                                <p className="text-[14px] leading-[1.7] text-gray-400 font-light mb-5">
                                    {feat.desc}
                                </p>

                                <span className="inline-block font-mono text-[10px] tracking-[0.15em] uppercase text-brand-orange px-2.5 py-1 border border-brand-orange/30">
                                    {feat.tag}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

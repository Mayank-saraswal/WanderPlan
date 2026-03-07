import { CalendarDays, DollarSign, Backpack } from "lucide-react";

export function WanderAI() {
    return (
        <section id="ai" className="py-[120px] px-6 md:px-12 bg-[#0D0D0D] relative overflow-hidden">
            {/* Background Watermark */}
            <div className="absolute -bottom-[5%] -right-[5%] font-bebas text-[40vw] leading-[0.85] tracking-[-0.02em] text-brand-orange/[0.03] pointer-events-none select-none">
                AI
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10 w-full">
                <div>
                    <div className="reveal">
                        <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase text-brand-orange mb-5">
                            <div className="w-6 h-px bg-brand-orange" />
                            WanderAI
                        </div>
                        <h2 className="font-bebas text-[clamp(48px,6vw,88px)] leading-[0.95] tracking-[0.02em] text-white">
                            WANDER<span className="text-brand-orange">AI</span> PLANS SO <br />
                            <span className="text-brand-orange">YOU DON'T HAVE TO</span>
                        </h2>
                    </div>

                    <div className="flex flex-col gap-1 mt-12 w-full">
                        {[
                            {
                                icon: <CalendarDays strokeWidth={1.5} className="w-5 h-5" />,
                                title: "Itinerary Generator",
                                desc: "Full day-by-day plan from destination + dates. Editable and ready in seconds.",
                            },
                            {
                                icon: <DollarSign strokeWidth={1.5} className="w-5 h-5" />,
                                title: "Settlement Explainer",
                                desc: "WanderAI reads expense data and explains who owes who in plain language.",
                            },
                            {
                                icon: <Backpack strokeWidth={1.5} className="w-5 h-5" />,
                                title: "Smart Packing List",
                                desc: "Climate-aware checklist from destination, trip duration and traveler count.",
                            }
                        ].map((feat, idx) => (
                            <div key={idx} className={`group flex items-start gap-5 p-6 border border-transparent transition-colors duration-200 cursor-none hover:border-brand-orange/30 hover:bg-brand-orange/5 reveal reveal-delay-${(idx % 3) + 1}`}>
                                <div className="w-10 shrink-0 text-brand-orange pt-0.5">
                                    {feat.icon}
                                </div>
                                <div>
                                    <h4 className="font-sans text-[15px] font-semibold text-white mb-1">{feat.title}</h4>
                                    <p className="text-[13px] text-white/40 leading-[1.6] font-light">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#111] border border-white/10 p-10 relative reveal reveal-delay-2 rounded-none w-full">
                    <div className="bg-white/5 border border-white/10 p-5 font-mono text-xs text-white/40 leading-[1.6] mb-5 rounded-none">
                        <span className="block font-mono text-[10px] tracking-[0.15em] uppercase text-brand-orange mb-2">USER PROMPT</span>
                        Generate a 5-day itinerary for Tokyo, Japan for 3 travelers. Focus on culture and food. Budget: ¥180,000 total.
                    </div>

                    <div className="border border-brand-orange/20 p-5 bg-brand-orange/5 rounded-none">
                        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-brand-orange mb-3">
                            <span className="animate-pulse">●</span> WANDERAI RESPONSE
                        </div>
                        <ul className="flex flex-col gap-2 list-none">
                            {[
                                "Day 1 — Asakusa, Senso-ji Temple, Tsukiji Market lunch",
                                "Day 2 — Shibuya crossing, Harajuku, Meiji Shrine evening",
                                "Day 3 — TeamLab Planets, Odaiba, ramen dinner in Shinjuku",
                                "Day 4 — Nikko day trip, traditional ryokan dinner experience",
                                "Day 5 — Akihabara, final shopping, Narita airport transfer"
                            ].map((item, idx) => (
                                <li key={idx} className="relative pl-4 text-[13px] text-white/60 font-light">
                                    <span className="absolute left-0 text-brand-orange">—</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}

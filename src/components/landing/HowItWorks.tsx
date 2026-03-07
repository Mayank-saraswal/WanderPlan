export function HowItWorks() {
    const steps = [
        {
            title: "Create your trip",
            desc: "Set destination, dates and budget in a 3-step form. Upload a cover image to make it yours."
        },
        {
            title: "Invite your crew",
            desc: "Send invite links by email. Assign Owner, Editor, or Viewer roles."
        },
        {
            title: "Generate with WanderAI",
            desc: "WanderAI produces a complete day-by-day plan from your destination and dates."
        },
        {
            title: "Track & organize",
            desc: "Log expenses, add reservations, upload boarding passes, build packing lists."
        },
        {
            title: "Travel. Together.",
            desc: "Real-time sync, in-app chat, and live updates wherever you are."
        }
    ];

    return (
        <section id="how" className="py-[120px] px-6 md:px-12 bg-[#0D0D0D]">
            <div className="reveal">
                <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase text-brand-orange mb-5">
                    <div className="w-6 h-px bg-brand-orange" />
                    How it works
                </div>
                <h2 className="font-bebas text-[clamp(48px,6vw,88px)] leading-[0.95] tracking-[0.02em] text-white">
                    FROM IDEA TO<br />
                    <span className="text-brand-orange">ITINERARY</span><br />
                    IN MINUTES
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[80px] items-start mt-[80px]">
                <div className="flex flex-col">
                    {steps.map((step, idx) => (
                        <div key={idx} className={`group flex gap-7 py-8 border-b border-white/5 relative cursor-none transition-all duration-300 hover:pl-3 reveal reveal-delay-${(idx % 4) + 1}`}>
                            <div className="w-9 h-9 shrink-0 border border-white/10 font-mono text-[14px] text-gray-500 flex items-center justify-center transition-colors duration-300 group-hover:border-brand-orange group-hover:text-brand-orange rounded-none">
                                0{idx + 1}
                            </div>
                            <div>
                                <h4 className="font-sans text-[16px] font-semibold text-white mb-1.5">{step.title}</h4>
                                <p className="text-[14px] text-white/45 leading-[1.6] font-light">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mockup visual */}
                <div className="hidden lg:flex sticky top-[120px] flex-col justify-end bg-[#111] border border-white/10 p-12 aspect-[4/3] overflow-hidden relative reveal reveal-delay-2 rounded-none">
                    {/* subtle radial gradient bg */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_20%,rgba(234,88,12,0.15)_0%,transparent_60%)] pointer-events-none" />

                    <div className="absolute top-6 left-6 flex gap-1.5 z-10">
                        <div className="w-2 h-2 bg-brand-orange" />
                        <div className="w-2 h-2 bg-amber-400" />
                        <div className="w-2 h-2 bg-gray-500" />
                    </div>

                    <div className="relative z-10 flex flex-col gap-3">
                        {/* Card 1 */}
                        <div className="bg-white/5 border border-white/10 p-5 rounded-none">
                            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-gray-500 mb-2">Budget Used — Tokyo Trip</div>
                            <div className="font-bebas text-[36px] text-white mb-2.5 leading-none">
                                ¥ 142,500 <span className="text-[18px] text-brand-orange">/ ¥180,000</span>
                            </div>
                            <div className="h-1 bg-white/5 relative overflow-hidden rounded-none">
                                <div className="absolute left-0 top-0 h-full w-[80%] bg-brand-orange animate-[barGrow_2s_ease-in-out_infinite_alternate]" />
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white/5 border border-white/10 p-5 rounded-none">
                            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-gray-500 mb-2">Day 3 — Itinerary Progress</div>
                            <div className="text-[13px] text-white/40 font-light mb-2.5">4 of 6 activities completed</div>
                            <div className="h-1 bg-white/5 relative overflow-hidden rounded-none">
                                <div className="absolute left-0 top-0 h-full w-[60%] bg-brand-orange animate-[barGrow_2s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.3s' }} />
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white/5 border border-white/10 p-5 rounded-none">
                            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-gray-500 mb-2">Packing List — 5 members</div>
                            <div className="text-[13px] text-white/40 font-light mb-2.5">18 of 24 items packed</div>
                            <div className="h-1 bg-white/5 relative overflow-hidden rounded-none">
                                <div className="absolute left-0 top-0 h-full w-[75%] bg-brand-orange animate-[barGrow_2s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.6s' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

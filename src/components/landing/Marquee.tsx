export function Marquee() {
    const items = [
        "Itinerary Planner",
        "WanderAI",
        "Budget & Settlements",
        "Real-time Chat",
        "Interactive Map",
        "Ideas Board",
        "Boarding Passes",
        "Analytics"
    ];

    const marqueeItems = [...items, ...items, ...items, ...items];

    return (
        <div className="w-full border-y border-white/10 bg-brand-orange/5 py-[18px] overflow-hidden">
            <div className="flex whitespace-nowrap animate-[ticker_28s_linear_infinite]">
                {marqueeItems.map((item, idx) => (
                    <div key={idx} className="flex items-center shrink-0">
                        <span className="font-bebas text-[18px] tracking-[0.12em] text-white/25 px-8">
                            {item}
                        </span>
                        <span className="font-bebas text-[18px] tracking-[0.12em] text-brand-orange">
                            ✦
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

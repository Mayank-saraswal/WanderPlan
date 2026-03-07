import {
    LayoutDashboard, LayoutGrid, CalendarDays, Users, DollarSign, Lightbulb,
    Globe, CheckSquare, Backpack, FileText, Ticket, Hotel, MessageSquare, BarChart2
} from "lucide-react";

export function AllFeatures() {
    const allFeatures = [
        { icon: LayoutDashboard, title: "Dashboard", desc: "Centralized hub for all upcoming, ongoing and past trips." },
        { icon: LayoutGrid, title: "Trip Overview", desc: "High-level snapshot of everything happening on the trip." },
        { icon: CalendarDays, title: "Itinerary Planner", desc: "Day-by-day drag-drop schedule with times and categories." },
        { icon: Users, title: "Member Management", desc: "Invite and manage participants with granular role control." },
        { icon: DollarSign, title: "Budget & Split", desc: "Track expenses and calculate settlements across the group." },
        { icon: Lightbulb, title: "Ideas Board", desc: "Brainstorm and vote on places before adding to itinerary." },
        { icon: Globe, title: "Interactive Map", desc: "Geographical view of every pinned activity on your trip." },
        { icon: CheckSquare, title: "Checklists", desc: "Group to-dos — book insurance, arrange transfers, and more." },
        { icon: Backpack, title: "Packing Lists", desc: "Dedicated lists assigned to members — nobody forgets essentials." },
        { icon: FileText, title: "Files & Documents", desc: "Upload and share PDFs, images, and important attachments." },
        { icon: Ticket, title: "Boarding Passes", desc: "Upload and access flight tickets without leaving the app." },
        { icon: Hotel, title: "Reservations", desc: "Hotels, cars, restaurants — all confirmations in one place." },
        { icon: MessageSquare, title: "Real-time Chat", desc: "In-app group messaging — no WhatsApp switching needed." },
        { icon: BarChart2, title: "Analytics", desc: "Charts showing exactly how the budget was spent by category." }
    ];

    return (
        <section className="py-[120px] px-6 md:px-12 bg-[#0A0A0A]">
            <div className="mb-16 reveal">
                <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase text-brand-orange mb-5">
                    <div className="w-6 h-px bg-brand-orange" />
                    More Capabilities
                </div>
                <h2 className="font-bebas text-[clamp(48px,6vw,88px)] leading-[0.95] tracking-[0.02em] text-white">
                    14 TOOLS. <span className="text-brand-orange">ONE TRIP.</span>
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/5 reveal reveal-delay-2">
                {allFeatures.map((feat, idx) => (
                    <div key={idx} className="group bg-brand-black p-7 flex gap-4 items-start hover:bg-[#111] transition-colors cursor-none rounded-none">
                        <div className="w-9 h-9 shrink-0 border border-white/10 flex items-center justify-center text-brand-orange transition-colors group-hover:bg-brand-orange group-hover:text-black rounded-none">
                            <feat.icon strokeWidth={1.5} className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-[13px] font-bold text-white mb-1.5">{feat.title}</h4>
                            <p className="text-[12px] text-gray-500/80 leading-relaxed font-light">{feat.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

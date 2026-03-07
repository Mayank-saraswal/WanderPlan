import Link from "next/link";
import { Plane, MapPin, Users, CheckSquare, DollarSign, Sparkles, ArrowRight, Globe } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 border-b border-white/10 bg-[#0A0A0A]/90 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-[#EA580C]" strokeWidth={1.5} />
                    <span className="font-display text-xl font-800 tracking-wider text-white uppercase">WanderPlan</span>
                </div>
                <div className="flex items-center gap-6">
                    <Link href="/sign-in" className="text-sm text-white/60 hover:text-white transition-colors font-medium">
                        Sign In
                    </Link>
                    <Link
                        href="/sign-up"
                        className="bg-[#EA580C] text-white text-sm font-700 uppercase tracking-wider px-5 py-2.5 hover:bg-[#C2410C] transition-colors"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="min-h-screen flex flex-col justify-center pt-20 px-8 md:px-16 lg:px-24">
                <div className="max-w-6xl mx-auto w-full">
                    <div className="mb-6">
                        <span className="inline-flex items-center gap-2 border border-[#EA580C]/40 text-[#EA580C] text-xs font-700 uppercase tracking-widest px-4 py-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI-Powered Trip Planning
                        </span>
                    </div>

                    <h1 className="font-display text-[clamp(4rem,12vw,10rem)] font-900 uppercase leading-none tracking-tight mb-0">
                        PLAN
                        <br />
                        <span className="text-[#EA580C]">TOGETHER.</span>
                    </h1>
                    <h1 className="font-display text-[clamp(4rem,12vw,10rem)] font-900 uppercase leading-none tracking-tight mb-8">
                        TRAVEL
                        <br />
                        <span className="text-white/20">BETTER.</span>
                    </h1>

                    {/* Orange underline accent */}
                    <div className="w-32 h-1 bg-[#EA580C] mb-10" />

                    <p className="text-white/50 text-lg md:text-xl max-w-xl mb-12 font-sans leading-relaxed">
                        The collaborative platform for group trips. Build itineraries together, track budgets, manage bookings — all in one place.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            href="/sign-up"
                            className="inline-flex items-center gap-3 bg-[#EA580C] text-white font-700 uppercase tracking-widest px-8 py-4 hover:bg-[#C2410C] transition-colors text-sm"
                        >
                            Start Planning Free
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/sign-in"
                            className="inline-flex items-center gap-3 border border-white/20 text-white font-600 uppercase tracking-widest px-8 py-4 hover:border-white/60 transition-colors text-sm"
                        >
                            Sign In
                        </Link>
                    </div>

                    {/* Stats row */}
                    <div className="mt-20 pt-10 border-t border-white/10 grid grid-cols-3 gap-8 max-w-md">
                        {[
                            { num: "50K+", label: "Trips Planned" },
                            { num: "120+", label: "Countries" },
                            { num: "4.9★", label: "Rating" },
                        ].map((s) => (
                            <div key={s.label}>
                                <p className="font-display text-3xl font-800 text-white">{s.num}</p>
                                <p className="text-white/40 text-xs uppercase tracking-wider mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="bg-white text-[#0A0A0A] px-8 md:px-16 lg:px-24 py-24">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-16">
                        <p className="text-[#EA580C] text-xs font-700 uppercase tracking-widest mb-3">Everything you need</p>
                        <h2 className="font-display text-5xl md:text-6xl font-800 uppercase leading-tight">
                            BUILT FOR<br />GROUP TRAVEL
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-0 border border-[#0A0A0A]">
                        {[
                            {
                                icon: Globe,
                                title: "Itinerary Builder",
                                desc: "Day-by-day planner with drag-and-drop. Add activities, times, locations. AI generates full itineraries in seconds.",
                            },
                            {
                                icon: DollarSign,
                                title: "Budget Tracker",
                                desc: "Track every expense, split costs fairly, visualize spending by category. AI estimates budget before you go.",
                            },
                            {
                                icon: Users,
                                title: "Team Collaboration",
                                desc: "Invite co-travelers with role-based access. Owners, editors, viewers — everyone sees the right things.",
                            },
                            {
                                icon: CheckSquare,
                                title: "Checklists",
                                desc: "Packing lists, task lists, or custom checklists. Assign items to people. AI suggests what to pack.",
                            },
                            {
                                icon: MapPin,
                                title: "Reservations",
                                desc: "Track flights, hotels, restaurants, and more. Store confirmation numbers. See all bookings at a glance.",
                            },
                            {
                                icon: Sparkles,
                                title: "AI Powered",
                                desc: "GPT-4o generates itineraries, packing lists, budget estimates, and trip descriptions in seconds.",
                            },
                        ].map((f, i) => (
                            <div
                                key={f.title}
                                className={`p-8 border-[#0A0A0A] ${i < 3 ? "border-b" : ""} ${i % 3 !== 2 ? "border-r" : ""} hover:bg-[#0A0A0A] hover:text-white group transition-colors cursor-default`}
                            >
                                <div className="w-10 h-10 border border-[#EA580C] group-hover:border-[#EA580C] flex items-center justify-center mb-6">
                                    <f.icon className="w-5 h-5 text-[#EA580C]" strokeWidth={1.5} />
                                </div>
                                <h3 className="font-display text-xl font-700 uppercase mb-3">{f.title}</h3>
                                <p className="text-sm leading-relaxed text-[#0A0A0A]/60 group-hover:text-white/60">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-[#EA580C] px-8 md:px-16 lg:px-24 py-24">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div>
                        <h2 className="font-display text-4xl md:text-6xl font-900 uppercase text-white leading-tight">
                            READY TO<br />WANDER?
                        </h2>
                        <p className="text-white/70 mt-4 max-w-sm">
                            Join thousands of travelers already planning smarter together.
                        </p>
                    </div>
                    <Link
                        href="/sign-up"
                        className="inline-flex items-center gap-3 bg-[#0A0A0A] text-white font-700 uppercase tracking-widest px-10 py-5 hover:bg-white hover:text-[#0A0A0A] transition-colors text-sm whitespace-nowrap"
                    >
                        Start Free Today
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#0A0A0A] border-t border-white/10 px-8 md:px-16 lg:px-24 py-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-[#EA580C]" strokeWidth={1.5} />
                        <span className="font-display text-lg font-800 tracking-wider uppercase">WanderPlan</span>
                    </div>
                    <p className="text-white/30 text-xs">
                        © 2026 WanderPlan. Built for Buildathon Cohort 26.
                    </p>
                </div>
            </footer>
        </div>
    );
}

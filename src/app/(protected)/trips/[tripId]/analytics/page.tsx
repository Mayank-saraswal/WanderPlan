"use client";
import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader, EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
    BarChart3, Calendar, Users, DollarSign, Camera,
    Activity, Clock, MapPin, Plane, Award
} from "lucide-react";

const CAT_COLORS: Record<string, string> = {
    transport: "#EA580C", accommodation: "#0A0A0A", food: "#f59e0b",
    activity: "#374151", shopping: "#6b7280", other: "#d1d5db",
};

type Props = { params: Promise<{ tripId: string }> };

export default function AnalyticsPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const trip = useQuery(api.trips.getTrip, { tripId });
    const members = useQuery(api.tripMembers.getTripMembers, { tripId });
    const expenses = useQuery(api.expenses.getExpenses, { tripId });
    const activities = useQuery(api.activities.getActivities, { tripId });
    const days = useQuery(api.days.getDays, { tripId });
    const files = useQuery(api.files.getFiles, { tripId });

    if (!trip || !members || !expenses || !activities || !days || !files) return <PageLoader />;

    // ─── Stats Calculations ───
    const numDays = days.length;
    const numActivities = activities.length;
    const numPhotos = files.filter(f => f.category === "image").length;
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const dailyAverage = numDays > 0 ? totalSpent / numDays : 0;
    const perPersonAverage = members.length > 0 ? totalSpent / members.length : 0;

    // Spending by member (actual paid vs fair share)
    const memberSpending: Record<string, { name: string; paid: number; share: number }> = {};
    members.forEach((m: any) => {
        memberSpending[m.userId] = { name: m.user?.name || "Unknown", paid: 0, share: 0 };
    });

    for (const e of expenses) {
        if (memberSpending[e.paidBy]) memberSpending[e.paidBy].paid += e.amount;
        const splitMembers = e.splitWith && e.splitWith.length > 0 ? e.splitWith : members.map((m: any) => m.userId);
        const allSplitters = splitMembers.includes(e.paidBy) ? splitMembers : [e.paidBy, ...splitMembers];
        const perPerson = e.amount / allSplitters.length;
        for (const uid of allSplitters) {
            if (memberSpending[uid]) memberSpending[uid].share += perPerson;
        }
    }

    const memberChartData = Object.values(memberSpending)
        .filter(m => m.paid > 0 || m.share > 0)
        .sort((a, b) => b.share - a.share);

    // Spending by category
    const categories = ["transport", "accommodation", "food", "activity", "shopping", "other"] as const;
    const categoryData = categories.map(cat => ({
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        value: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
        color: CAT_COLORS[cat]
    })).filter(c => c.value > 0);

    const topCategory = [...categoryData].sort((a, b) => b.value - a.value)[0];

    // Activity stats
    const activityTypes = ["transport", "accommodation", "food", "activity", "other"];
    const popularActivityType = activityTypes
        .map(t => ({ name: t, count: activities.filter(a => a.category === t).length }))
        .sort((a, b) => b.count - a.count)[0];

    const isCompleted = trip.status === "completed" || trip.endDate < Date.now();

    return (
        <div className="bg-[#fcfcfc] min-h-screen">
            <div className="border-b border-[#e5e5e5] px-8 py-5 bg-white">
                <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">TRIP ANALYTICS</h1>
                <p className="text-xs text-[#0A0A0A]/40 uppercase tracking-wider mt-0.5">
                    {trip.destination} · {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                </p>
            </div>

            {!isCompleted && (
                <div className="bg-amber-50 border-b border-amber-100 px-8 py-3">
                    <p className="text-xs font-700 text-amber-700 uppercase tracking-wider">
                         Preview Mode: Trip is still active. Final stats will lock when trip completes.
                    </p>
                </div>
            )}

            <div className="p-8 max-w-6xl mx-auto space-y-8">
                {/* Top Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-[#e5e5e5] p-5">
                        <DollarSign className="w-5 h-5 text-[#EA580C] mb-3" />
                        <p className="font-display text-3xl font-900 text-[#0A0A0A]">
                            {trip.currency} {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[#0A0A0A]/40 text-[10px] font-700 uppercase tracking-widest mt-1">Total Spent</p>
                    </div>
                    <div className="bg-white border border-[#e5e5e5] p-5">
                        <Users className="w-5 h-5 text-[#EA580C] mb-3" />
                        <p className="font-display text-3xl font-900 text-[#0A0A0A]">
                            {trip.currency} {perPersonAverage.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[#0A0A0A]/40 text-[10px] font-700 uppercase tracking-widest mt-1">Avg per Person</p>
                    </div>
                    <div className="bg-white border border-[#e5e5e5] p-5">
                        <Clock className="w-5 h-5 text-[#EA580C] mb-3" />
                        <p className="font-display text-3xl font-900 text-[#0A0A0A]">
                            {trip.currency} {dailyAverage.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[#0A0A0A]/40 text-[10px] font-700 uppercase tracking-widest mt-1">Daily Burn Rate</p>
                    </div>
                    <div className="bg-white border border-[#e5e5e5] p-5">
                        <Activity className="w-5 h-5 text-[#EA580C] mb-3" />
                        <p className="font-display text-3xl font-900 text-[#0A0A0A]">
                            {numActivities}
                        </p>
                        <p className="text-[#0A0A0A]/40 text-[10px] font-700 uppercase tracking-widest mt-1">Total Activities</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Charts Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Member Spending Bar Chart */}
                        <div className="bg-white border border-[#e5e5e5] p-6">
                            <h2 className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A] mb-6">MEMBER FAIR SHARE vs PAID</h2>
                            {memberChartData.length === 0 ? (
                                <p className="text-[#0A0A0A]/30 text-sm py-10 text-center">No spending data</p>
                            ) : (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={memberChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} tickFormatter={(v) => `${v}`} />
                                            <Tooltip
                                                cursor={{ fill: '#f5f5f5' }}
                                                contentStyle={{ borderRadius: 0, border: '1px solid #e5e5e5', boxShadow: 'none' }}
                                                formatter={(value, name) => [`${trip.currency} ${Number(value).toFixed(2)}`, name === 'share' ? 'Fair Share' : 'Actually Paid']}
                                            />
                                            <Bar dataKey="share" name="Fair Share" fill="#0A0A0A" radius={[2, 2, 0, 0]} />
                                            <Bar dataKey="paid" name="Paid" fill="#EA580C" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Category Pie Chart */}
                        <div className="bg-white border border-[#e5e5e5] p-6">
                            <h2 className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A] mb-6">SPENDING BY CATEGORY</h2>
                            {categoryData.length === 0 ? (
                                <p className="text-[#0A0A0A]/30 text-sm py-10 text-center">No categories yet</p>
                            ) : (
                                <div className="h-64 flex items-center">
                                    <div className="flex-1 h-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" strokeWidth={2} stroke="#fff">
                                                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                                </Pie>
                                                <Tooltip formatter={(v: any) => `${trip.currency} ${Number(v).toFixed(2)}`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        {categoryData.map((cat, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }} />
                                                <p className="text-sm font-600 flex-1">{cat.name}</p>
                                                <p className="text-sm font-700">{trip.currency} {cat.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                                <p className="text-xs text-[#0A0A0A]/40 w-12 text-right">
                                                    {Math.round((cat.value / totalSpent) * 100)}%
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Shareable Recap Card Column */}
                    <div>
                        <div className="bg-[#0A0A0A] p-1 sticky top-8">
                            <div className="border border-[#333] p-8 bg-[#0A0A0A] text-white flex flex-col items-center text-center relative overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#EA580C] rounded-full blur-[80px] opacity-40 -mr-10 -mt-10" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500 rounded-full blur-[60px] opacity-20 -ml-5 -mb-5" />

                                <Plane className="w-8 h-8 text-[#EA580C] mb-4 relative z-10" />
                                <h3 className="font-display text-2xl font-900 uppercase tracking-wider relative z-10">{trip.title}</h3>
                                <p className="text-white/50 text-xs font-700 tracking-widest uppercase mt-2 mb-8 relative z-10">{trip.destination}</p>

                                <div className="w-full space-y-4 relative z-10">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <div className="text-left">
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-700">Days</p>
                                            <p className="text-xl font-900">{numDays}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-700">Explorers</p>
                                            <p className="text-xl font-900">{members.length}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <div className="text-left">
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-700">Memories</p>
                                            <p className="text-xl font-900">{numPhotos} photos</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-700">Events</p>
                                            <p className="text-xl font-900">{numActivities}</p>
                                        </div>
                                    </div>

                                    <div className="py-2">
                                        <p className="text-[10px] text-[#EA580C] uppercase tracking-widest font-800 mb-1">Top Vibe</p>
                                        <p className="text-lg font-700 capitalize">
                                            {popularActivityType.count > 0 ? popularActivityType.name : "Relaxing"}
                                        </p>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-[10px] text-[#EA580C] uppercase tracking-widest font-800 mb-1">Biggest Splurge</p>
                                        <p className="text-lg font-700">
                                            {topCategory ? topCategory.name : "N/A"}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10 w-full relative z-10">
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-800">Planned with WanderPlan ✨</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    toast.success("Recap copied! (Demo only)");
                                }}
                                className="w-full bg-[#EA580C] text-white py-3 text-xs font-700 uppercase tracking-widest hover:bg-[#C2410C] transition-colors mt-1">
                                Share Trip Recap
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

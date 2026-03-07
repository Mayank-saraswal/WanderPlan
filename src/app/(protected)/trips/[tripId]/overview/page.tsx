"use client";
import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader } from "@/components/shared/EmptyState";
import { Calendar, Users, DollarSign, Activity, MapPin, Clock, Crown, Eye } from "lucide-react";
import { format } from "date-fns";

const ROLE_STYLES = {
    owner: { label: "Owner", cls: "bg-[#EA580C] text-white" },
    editor: { label: "Editor", cls: "bg-[#0A0A0A] text-white" },
    viewer: { label: "Viewer", cls: "border border-[#0A0A0A] text-[#0A0A0A]" },
};

type Props = { params: Promise<{ tripId: string }> };

export default function TripOverviewPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const trip = useQuery(api.trips.getTrip, { tripId });
    const members = useQuery(api.tripMembers.getTripMembers, { tripId });
    const expenses = useQuery(api.expenses.getExpenses, { tripId });
    const activities = useQuery(api.activities.getActivitiesByTrip, { tripId });
    const days = useQuery(api.days.getDays, { tripId });

    if (!trip || !members || !expenses || !activities || !days) return <PageLoader />;

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const tripDays = Math.ceil((trip.endDate - trip.startDate) / (1000 * 60 * 60 * 24)) + 1;

    return (
        <div>
            {/* Hero banner */}
            <div className="relative h-48 bg-[#0A0A0A] overflow-hidden">
                {trip.coverImage && (
                    <img src={trip.coverImage} alt={trip.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
                )}
                <div className="absolute inset-0 px-8 py-8 flex flex-col justify-end">
                    <span className={`inline-block text-xs font-700 uppercase tracking-wider px-2.5 py-1 mb-3 w-fit ${trip.status === "active" ? "bg-[#EA580C]" : trip.status === "completed" ? "bg-gray-500" : "bg-white/20"
                        } text-white`}>
                        {trip.status}
                    </span>
                    <h1 className="font-display text-4xl font-900 uppercase text-white leading-none">{trip.title}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-[#EA580C]" strokeWidth={1.5} />
                        <span className="text-[#EA580C] text-sm font-600 uppercase tracking-wider">{trip.destination}</span>
                    </div>
                    {trip.startDate && (
                        <p className="text-white/40 text-xs mt-1">
                            {format(new Date(trip.startDate), "MMM d")} – {format(new Date(trip.endDate), "MMM d, yyyy")}
                        </p>
                    )}
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 border-b border-[#e5e5e5]">
                {[
                    { label: "Days", value: tripDays, icon: Clock },
                    { label: "Members", value: members.length, icon: Users },
                    { label: "Activities", value: activities.length, icon: Activity },
                    { label: "Spent", value: `${trip.currency} ${totalSpent.toLocaleString()}`, icon: DollarSign },
                ].map((s) => (
                    <div key={s.label} className="px-6 py-5 border-r border-[#e5e5e5] last:border-0">
                        <p className="font-display text-2xl font-900 text-[#0A0A0A]">{s.value}</p>
                        <p className="text-[#0A0A0A]/40 text-xs uppercase tracking-wider mt-1 flex items-center gap-1">
                            <s.icon className="w-3 h-3" strokeWidth={1.5} /> {s.label}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 divide-x divide-[#e5e5e5] px-0">
                {/* Upcoming activities */}
                <div className="px-8 py-6">
                    <h2 className="font-display text-lg font-800 uppercase tracking-wide mb-4 text-[#0A0A0A]">UPCOMING</h2>
                    {activities.length === 0 ? (
                        <p className="text-[#0A0A0A]/40 text-sm">No activities planned yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {activities.slice(0, 5).map((a) => (
                                <div key={a._id} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] mt-2 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-600 text-[#0A0A0A]">{a.title}</p>
                                        {a.startTime && (
                                            <p className="text-xs text-[#0A0A0A]/40 flex items-center gap-1 mt-0.5">
                                                <Clock className="w-3 h-3" /> {a.startTime}
                                                {a.location && <span className="ml-1">· {a.location}</span>}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Members */}
                <div className="px-8 py-6">
                    <h2 className="font-display text-lg font-800 uppercase tracking-wide mb-4 text-[#0A0A0A]">MEMBERS</h2>
                    <div className="space-y-3">
                        {members.map((m: any) => {
                            const roleStyle = ROLE_STYLES[m.role as keyof typeof ROLE_STYLES];
                            return (
                                <div key={m._id} className="flex items-center gap-3">
                                    {m.user?.imageUrl ? (
                                        <img src={m.user.imageUrl} alt={m.user.name} className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 bg-[#0A0A0A] flex items-center justify-center text-white text-xs font-700">
                                            {m.user?.name?.[0]?.toUpperCase() ?? "?"}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-600 text-[#0A0A0A] truncate">{m.user?.name ?? "Unknown"}</p>
                                        <p className="text-xs text-[#0A0A0A]/40 truncate">{m.user?.email}</p>
                                    </div>
                                    <span className={`text-xs font-700 uppercase tracking-wider px-2 py-0.5 ${roleStyle.cls}`}>
                                        {roleStyle.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Description */}
            {trip.description && (
                <div className="px-8 py-6 border-t border-[#e5e5e5]">
                    <h2 className="font-display text-lg font-800 uppercase tracking-wide mb-3 text-[#0A0A0A]">ABOUT</h2>
                    <p className="text-[#0A0A0A]/60 text-sm leading-relaxed max-w-2xl">{trip.description}</p>
                </div>
            )}
        </div>
    );
}

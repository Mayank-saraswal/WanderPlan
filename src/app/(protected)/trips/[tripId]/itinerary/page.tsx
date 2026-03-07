"use client";
import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader, EmptyState } from "@/components/shared/EmptyState";
import { GripVertical, Plus, Pencil, Trash2, Clock, MapPin, DollarSign, Sparkles, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useTripMember } from "@/hooks/useTripMember";
import { format } from "date-fns";

const CATEGORY_COLORS = {
    transport: "border-l-[#EA580C]",
    accommodation: "border-l-gray-400",
    food: "border-l-amber-400",
    activity: "border-l-[#0A0A0A]",
    other: "border-l-gray-300",
};

const CATEGORIES = ["transport", "accommodation", "food", "activity", "other"] as const;

type Props = { params: Promise<{ tripId: string }> };

export default function ItineraryPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const { canEdit } = useTripMember(tripId);
    const trip = useQuery(api.trips.getTrip, { tripId });
    const days = useQuery(api.days.getDays, { tripId });
    const members = useQuery(api.tripMembers.getTripMembers, { tripId });
    const [activeDay, setActiveDay] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const createActivity = useMutation(api.activities.createActivity);
    const deleteActivity = useMutation(api.activities.deleteActivity);

    const [form, setForm] = useState({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        location: "",
        cost: "",
        category: "activity" as typeof CATEGORIES[number],
    });

    if (!days || !trip) return <PageLoader />;

    const currentDay = days[activeDay];
    const ActivitiesForDay = ({ dayId }: { dayId: Id<"days"> }) => {
        const activities = useQuery(api.activities.getActivitiesByDay, { dayId });
        if (!activities) return <div className="h-2 bg-gray-100 animate-pulse rounded" />;
        return (
            <div className="space-y-2">
                {activities.map((a) => (
                    <div key={a._id} className={`bg-white border border-[#e5e5e5] border-l-4 ${CATEGORY_COLORS[a.category as keyof typeof CATEGORY_COLORS] || "border-l-gray-300"} p-4 flex items-start gap-3 group`}>
                        {canEdit && <GripVertical className="w-4 h-4 text-[#0A0A0A]/20 mt-0.5 cursor-grab flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-600 text-sm text-[#0A0A0A]">{a.title}</p>
                                {a.startTime && (
                                    <span className="bg-[#0A0A0A] text-white text-xs px-2 py-0.5 font-mono">
                                        {a.startTime}{a.endTime && `–${a.endTime}`}
                                    </span>
                                )}
                                {a.aiGenerated && (
                                    <span className="border border-[#EA580C]/30 text-[#EA580C] text-xs px-1.5 py-0.5 flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5" /> AI
                                    </span>
                                )}
                            </div>
                            {a.location && (
                                <p className="text-xs text-[#0A0A0A]/50 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {a.location}
                                </p>
                            )}
                            {a.description && <p className="text-xs text-[#0A0A0A]/50 mt-1">{a.description}</p>}
                        </div>
                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {a.cost && (
                                <span className="text-[#EA580C] font-700 text-sm">{trip?.currency} {a.cost}</span>
                            )}
                            {canEdit && (
                                <button
                                    onClick={() => { deleteActivity({ activityId: a._id }); toast.success("Deleted"); }}
                                    className="text-[#0A0A0A]/30 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {activities.length === 0 && !showForm && (
                    <p className="text-[#0A0A0A]/30 text-sm py-4 text-center">No activities yet for this day</p>
                )}
            </div>
        );
    };

    const handleAddActivity = async () => {
        if (!form.title || !currentDay) return;
        try {
            await createActivity({
                tripId,
                dayId: currentDay._id,
                title: form.title,
                description: form.description || undefined,
                startTime: form.startTime || undefined,
                endTime: form.endTime || undefined,
                location: form.location || undefined,
                cost: form.cost ? parseFloat(form.cost) : undefined,
                currency: trip.currency,
                category: form.category,
                order: 0,
                aiGenerated: false,
            });
            setForm({ title: "", description: "", startTime: "", endTime: "", location: "", cost: "", category: "activity" });
            setShowForm(false);
            toast.success("Activity added!");
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleAIGenerate = async () => {
        setAiLoading(true);
        try {
            const dayCount = days.length;
            const res = await fetch("/api/ai/suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "itinerary",
                    context: { destination: trip.destination, days: dayCount, travelers: members?.length || 2 },
                }),
            });
            if (!res.ok) throw new Error("AI request failed");
            const data = await res.json();
            if (data.days) {
                for (const dayData of data.days) {
                    const dayIndex = dayData.dayNumber - 1;
                    const day = days[dayIndex];
                    if (!day) continue;
                    let order = 0;
                    for (const act of dayData.activities ?? []) {
                        await createActivity({
                            tripId, dayId: day._id,
                            title: act.title,
                            description: act.description,
                            startTime: act.startTime,
                            endTime: act.endTime,
                            location: act.location,
                            cost: act.cost,
                            currency: act.currency || trip.currency,
                            category: act.category || "activity",
                            order: order++,
                            aiGenerated: true,
                        });
                    }
                }
                toast.success("AI itinerary generated!");
            }
        } catch {
            toast.error("AI generation failed");
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div>
            {/* Top bar */}
            <div className="border-b border-[#e5e5e5] px-8 py-5 flex items-center justify-between">
                <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">ITINERARY</h1>
                {canEdit && (
                    <button
                        onClick={handleAIGenerate}
                        disabled={aiLoading}
                        className="inline-flex items-center gap-2 bg-[#0A0A0A] text-white text-xs font-700 uppercase tracking-wider px-5 py-3 hover:bg-[#EA580C] transition-colors disabled:opacity-50"
                    >
                        <Sparkles className="w-4 h-4" />
                        {aiLoading ? "Generating..." : "AI Generate Itinerary"}
                    </button>
                )}
            </div>

            {/* Day tabs */}
            <div className="border-b border-[#e5e5e5] px-8 flex gap-0 overflow-x-auto">
                {days.map((day, i) => (
                    <button
                        key={day._id}
                        onClick={() => setActiveDay(i)}
                        className={`px-5 py-3 text-xs font-700 uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${activeDay === i
                            ? "border-[#EA580C] text-[#0A0A0A]"
                            : "border-transparent text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
                            }`}
                    >
                        Day {day.dayNumber}
                        {day.date && <span className="ml-1 font-normal normal-case">{format(new Date(day.date), "MMM d")}</span>}
                    </button>
                ))}
            </div>

            {/* Activities */}
            <div className="px-8 py-6">
                {days.length === 0 ? (
                    <EmptyState title="No Days" description="No days were created for this trip." />
                ) : (
                    <>
                        {currentDay && <ActivitiesForDay dayId={currentDay._id} />}

                        {/* Add activity form */}
                        {showForm && canEdit && (
                            <div className="mt-3 border border-[#0A0A0A] p-5 bg-white">
                                <h3 className="font-display text-sm font-700 uppercase mb-4">Add Activity</h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Activity name *"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                            className="border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]" placeholder="Start time" />
                                        <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                            className="border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]" placeholder="End time" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                                            className="border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]" placeholder="Location" />
                                        <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })}
                                            min="0" className="border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]" placeholder="Cost" />
                                    </div>
                                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as typeof CATEGORIES[number] })}
                                        className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A] bg-white capitalize">
                                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <button onClick={handleAddActivity}
                                            className="flex-1 bg-[#0A0A0A] text-white py-2.5 text-xs font-700 uppercase tracking-wider hover:bg-[#EA580C] transition-colors">
                                            <Check className="w-4 h-4 inline mr-1" />Add
                                        </button>
                                        <button onClick={() => setShowForm(false)}
                                            className="border border-[#e5e5e5] px-4 py-2.5 text-xs hover:border-[#0A0A0A] transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {canEdit && !showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="mt-3 w-full border-2 border-dashed border-[#e5e5e5] hover:border-[#EA580C] transition-colors py-4 text-xs font-700 uppercase tracking-wider text-[#0A0A0A]/40 hover:text-[#EA580C] flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Activity
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

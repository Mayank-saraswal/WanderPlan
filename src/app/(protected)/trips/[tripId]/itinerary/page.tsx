"use client";
import { useState, use, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader, EmptyState } from "@/components/shared/EmptyState";
import { GripVertical, Plus, Pencil, Trash2, Clock, MapPin, DollarSign, Sparkles, X, Check, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { useTripMember } from "@/hooks/useTripMember";
import { format, formatDistanceToNow } from "date-fns";

const CATEGORY_COLORS = {
    transport: "border-l-[#EA580C]",
    accommodation: "border-l-gray-400",
    food: "border-l-amber-400",
    activity: "border-l-[#0A0A0A]",
    other: "border-l-gray-300",
};

const CATEGORIES = ["transport", "accommodation", "food", "activity", "other"] as const;

type EditingActivity = {
    _id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location: string;
    cost: string;
    category: typeof CATEGORIES[number];
};

// ── Comment Panel (extracted outside main component to prevent re-mount) ──
function CommentPanel({
    activityId, activityTitle, onClose, tripId
}: {
    activityId: string; activityTitle: string; onClose: () => void; tripId: Id<"trips">;
}) {
    const comments = useQuery(api.comments.getComments, { targetId: activityId });
    const addComment = useMutation(api.comments.addComment);
    const deleteComment = useMutation(api.comments.deleteComment);
    const [newComment, setNewComment] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments?.length]);

    const handleSend = async () => {
        if (!newComment.trim()) return;
        try {
            await addComment({
                tripId,
                targetId: activityId,
                targetType: "activity",
                content: newComment.trim(),
            });
            setNewComment("");
        } catch (e: any) { toast.error(e.message); }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-white h-full shadow-xl flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
                    <div>
                        <h3 className="font-display text-sm font-800 uppercase tracking-wider">Comments</h3>
                        <p className="text-xs text-[#0A0A0A]/40 truncate mt-0.5">{activityTitle}</p>
                    </div>
                    <button onClick={onClose} className="text-[#0A0A0A]/30 hover:text-[#0A0A0A]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {!comments ? (
                        <div className="h-4 bg-gray-100 animate-pulse rounded" />
                    ) : comments.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="w-8 h-8 text-[#0A0A0A]/10 mx-auto mb-2" strokeWidth={1} />
                            <p className="text-xs text-[#0A0A0A]/30">No comments yet.<br />Start the conversation!</p>
                        </div>
                    ) : (
                        comments.map((c: any) => (
                            <div key={c._id} className="group">
                                <div className="flex items-start gap-2.5">
                                    {c.author?.imageUrl ? (
                                        <img src={c.author.imageUrl} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />
                                    ) : (
                                        <div className="w-7 h-7 bg-[#0A0A0A]/10 rounded-full flex items-center justify-center text-[10px] font-700 flex-shrink-0">
                                            {(c.author?.name || "?").charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-700 text-[#0A0A0A]">{c.author?.name || "Unknown"}</span>
                                            <span className="text-[10px] text-[#0A0A0A]/30">
                                                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#0A0A0A]/70 mt-0.5 leading-relaxed">{c.content}</p>
                                    </div>
                                    <button
                                        onClick={() => { deleteComment({ commentId: c._id }); }}
                                        className="opacity-0 group-hover:opacity-100 text-[#0A0A0A]/20 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input */}
                <div className="px-5 py-4 border-t border-[#e5e5e5]">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Type a comment..."
                            className="flex-1 border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!newComment.trim()}
                            className="bg-[#EA580C] text-white px-3 py-2.5 hover:bg-[#C2410C] transition-colors disabled:opacity-30"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Activities For Day (extracted outside to prevent re-mount on parent state changes) ──
function ActivitiesForDay({
    dayId, editingActivity, setEditingActivity, canEdit,
    handleEditSave, handleEditStart, setCommentActivityId, trip,
}: {
    dayId: Id<"days">;
    editingActivity: EditingActivity | null;
    setEditingActivity: (val: EditingActivity | null) => void;
    canEdit: boolean;
    handleEditSave: () => void;
    handleEditStart: (a: any) => void;
    setCommentActivityId: (id: string) => void;
    trip: any;
}) {
    const activities = useQuery(api.activities.getActivitiesByDay, { dayId });
    const deleteActivity = useMutation(api.activities.deleteActivity);

    if (!activities) return <div className="h-2 bg-gray-100 animate-pulse rounded" />;
    return (
        <div className="space-y-2">
            {activities.map((a) => (
                editingActivity && editingActivity._id === a._id ? (
                    /* ── Inline Edit Form ── */
                    <div key={a._id} className="border border-[#EA580C] border-l-4 border-l-[#EA580C] p-4 bg-[#EA580C]/5">
                        <h3 className="font-display text-xs font-700 uppercase tracking-wider text-[#EA580C] mb-3 flex items-center gap-1">
                            <Pencil className="w-3 h-3" /> Edit Activity
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Activity name *"
                                value={editingActivity.title}
                                onChange={(e) => setEditingActivity({ ...editingActivity, title: e.target.value })}
                                className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]"
                            />
                            <textarea
                                placeholder="Description"
                                value={editingActivity.description}
                                onChange={(e) => setEditingActivity({ ...editingActivity, description: e.target.value })}
                                className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A] resize-none h-16"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="time" value={editingActivity.startTime} onChange={(e) => setEditingActivity({ ...editingActivity, startTime: e.target.value })}
                                    className="border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                                <input type="time" value={editingActivity.endTime} onChange={(e) => setEditingActivity({ ...editingActivity, endTime: e.target.value })}
                                    className="border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" value={editingActivity.location} onChange={(e) => setEditingActivity({ ...editingActivity, location: e.target.value })}
                                    className="border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]" placeholder="Location" />
                                <input type="number" value={editingActivity.cost} onChange={(e) => setEditingActivity({ ...editingActivity, cost: e.target.value })}
                                    className="border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]" placeholder="Cost" />
                            </div>
                            <select value={editingActivity.category} onChange={(e) => setEditingActivity({ ...editingActivity, category: e.target.value as any })}
                                className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A] bg-white capitalize">
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="flex gap-2">
                                <button onClick={handleEditSave}
                                    className="flex-1 bg-[#EA580C] text-white py-2.5 text-xs font-700 uppercase tracking-wider hover:bg-[#C2410C] transition-colors flex items-center justify-center gap-1">
                                    <Check className="w-4 h-4" /> Save Changes
                                </button>
                                <button onClick={() => setEditingActivity(null)}
                                    className="border border-[#e5e5e5] px-4 py-2.5 text-xs hover:border-[#0A0A0A] transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Normal Activity Display ── */
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
                                <>
                                    <button
                                        onClick={() => handleEditStart(a)}
                                        className="text-[#0A0A0A]/30 hover:text-[#EA580C] transition-colors"
                                        title="Edit activity"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setCommentActivityId(a._id)}
                                        className="text-[#0A0A0A]/30 hover:text-blue-500 transition-colors"
                                        title="Comments"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => { deleteActivity({ activityId: a._id }); toast.success("Deleted"); }}
                                        className="text-[#0A0A0A]/30 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )
            ))}
            {activities.length === 0 && (
                <p className="text-[#0A0A0A]/30 text-sm py-4 text-center">No activities yet for this day</p>
            )}
        </div>
    );
}

// ── Main Page Component ──
type Props = { params: Promise<{ tripId: string }> };

export default function ItineraryPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const { canEdit } = useTripMember(tripId);
    const trip = useQuery(api.trips.getTrip, { tripId });
    const days = useQuery(api.days.getDays, { tripId });
    const [activeDay, setActiveDay] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [showAIDialog, setShowAIDialog] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiMode, setAiMode] = useState<"quick" | "detailed">("quick");
    const [editingActivity, setEditingActivity] = useState<EditingActivity | null>(null);
    const [commentActivityId, setCommentActivityId] = useState<string | null>(null);
    const createActivity = useMutation(api.activities.createActivity);
    const updateActivity = useMutation(api.activities.updateActivity);
    const notifyMembers = useMutation(api.notifications.notifyTripMembers);

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

    const handleEditStart = (a: any) => {
        setEditingActivity({
            _id: a._id,
            title: a.title || "",
            description: a.description || "",
            startTime: a.startTime || "",
            endTime: a.endTime || "",
            location: a.location || "",
            cost: a.cost?.toString() || "",
            category: a.category || "activity",
        });
    };

    const handleEditSave = async () => {
        if (!editingActivity) return;
        try {
            await updateActivity({
                activityId: editingActivity._id as Id<"activities">,
                title: editingActivity.title,
                description: editingActivity.description || undefined,
                startTime: editingActivity.startTime || undefined,
                endTime: editingActivity.endTime || undefined,
                location: editingActivity.location || undefined,
                cost: editingActivity.cost ? parseFloat(editingActivity.cost) : undefined,
                category: editingActivity.category,
            });
            await notifyMembers({ tripId, type: "itinerary_updated", message: `Updated activity: ${editingActivity.title}` });
            setEditingActivity(null);
            toast.success("Activity updated!");
        } catch (e: any) {
            toast.error(e.message);
        }
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
            });
            await notifyMembers({ tripId, type: "itinerary_updated", message: `Added activity: ${form.title}` });
            setForm({ title: "", description: "", startTime: "", endTime: "", location: "", cost: "", category: "activity" });
            setShowForm(false);
            toast.success("Activity added!");
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleAIGenerate = async () => {
        if (!days || days.length === 0) return;
        setAiLoading(true);
        setShowAIDialog(false);
        try {
            const contextPayload: any = {
                destination: trip.destination,
                days: days.length,
                startDate: trip.startDate,
                endDate: trip.endDate,
                currency: trip.currency,
                budget: trip.budget,
            };
            if (aiPrompt.trim()) {
                contextPayload.preferences = aiPrompt.trim();
            }
            if (aiMode === "detailed") {
                contextPayload.detailed = true;
                contextPayload.researchBased = true;
            }

            const res = await fetch("/api/ai/suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "itinerary",
                    context: contextPayload,
                }),
            });
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
                await notifyMembers({ tripId, type: "itinerary_updated", message: `AI itinerary generated for ${trip.destination}` });
                toast.success("AI itinerary generated!");
            }
        } catch {
            toast.error("AI generation failed");
        } finally {
            setAiLoading(false);
            setAiPrompt("");
        }
    };

    return (
        <div>
            {/* Top bar */}
            <div className="border-b border-[#e5e5e5] px-8 py-5 flex items-center justify-between">
                <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">ITINERARY</h1>
                {canEdit && (
                    <button
                        onClick={() => setShowAIDialog(true)}
                        disabled={aiLoading}
                        className="inline-flex items-center gap-2 bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-5 py-3 hover:bg-[#C2410C] transition-colors disabled:opacity-50"
                    >
                        <Sparkles className="w-4 h-4" />
                        {aiLoading ? "Generating..." : "AI Generate Itinerary"}
                    </button>
                )}
            </div>

            {/* AI Generation Dialog */}
            {showAIDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white w-full max-w-lg mx-4 shadow-xl">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[#EA580C]" />
                                <h2 className="font-display text-lg font-800 uppercase tracking-wide">AI Itinerary</h2>
                            </div>
                            <button onClick={() => setShowAIDialog(false)} className="text-[#0A0A0A]/40 hover:text-[#0A0A0A]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Trip info */}
                        <div className="px-6 py-4 bg-[#0A0A0A]/5 border-b border-[#e5e5e5]">
                            <div className="flex items-center gap-4 text-sm">
                                <span className="font-700">{trip.destination}</span>
                                <span className="text-[#0A0A0A]/40">·</span>
                                <span className="text-[#0A0A0A]/60">{days.length} days</span>
                                <span className="text-[#0A0A0A]/40">·</span>
                                <span className="text-[#0A0A0A]/60">{format(new Date(trip.startDate), "MMM d")} – {format(new Date(trip.endDate), "MMM d")}</span>
                            </div>
                        </div>

                        {/* User preferences prompt */}
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-xs font-700 uppercase tracking-wider text-[#0A0A0A]/50 mb-2">
                                    <MessageSquare className="w-3 h-3 inline mr-1" />
                                    Tell us about your trip preferences
                                </label>
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="e.g., We love street food, prefer walking tours, interested in local culture and history. Budget-friendly options preferred. Want free time in afternoons..."
                                    className="w-full border border-[#e5e5e5] px-4 py-3 text-sm focus:outline-none focus:border-[#0A0A0A] resize-none h-28"
                                />
                                <p className="text-xs text-[#0A0A0A]/30 mt-1">Optional — Leave empty for a general itinerary</p>
                            </div>

                            {/* Mode selection */}
                            <div>
                                <label className="block text-xs font-700 uppercase tracking-wider text-[#0A0A0A]/50 mb-2">Generation Mode</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setAiMode("quick")}
                                        className={`p-4 border-2 text-left transition-colors ${aiMode === "quick"
                                            ? "border-[#EA580C] bg-[#EA580C]/5"
                                            : "border-[#e5e5e5] hover:border-[#0A0A0A]"
                                            }`}
                                    >
                                        <p className="font-display text-sm font-700 uppercase mb-1">Quick Plan</p>
                                        <p className="text-xs text-[#0A0A0A]/50">Fast AI-generated plan with popular activities and sights</p>
                                    </button>
                                    <button
                                        onClick={() => setAiMode("detailed")}
                                        className={`p-4 border-2 text-left transition-colors ${aiMode === "detailed"
                                            ? "border-[#EA580C] bg-[#EA580C]/5"
                                            : "border-[#e5e5e5] hover:border-[#0A0A0A]"
                                            }`}
                                    >
                                        <p className="font-display text-sm font-700 uppercase mb-1">Deep Research</p>
                                        <p className="text-xs text-[#0A0A0A]/50">Comprehensive plan with local tips, timings, and costs</p>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-4 border-t border-[#e5e5e5] flex gap-3">
                            <button
                                onClick={handleAIGenerate}
                                className="flex-1 bg-[#EA580C] text-white py-3 text-xs font-700 uppercase tracking-wider hover:bg-[#C2410C] transition-colors flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate Itinerary
                            </button>
                            <button
                                onClick={() => setShowAIDialog(false)}
                                className="border border-[#e5e5e5] px-6 py-3 text-xs font-700 uppercase tracking-wider hover:border-[#0A0A0A] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        {currentDay && (
                            <ActivitiesForDay
                                dayId={currentDay._id}
                                editingActivity={editingActivity}
                                setEditingActivity={setEditingActivity}
                                canEdit={canEdit}
                                handleEditSave={handleEditSave}
                                handleEditStart={handleEditStart}
                                setCommentActivityId={setCommentActivityId}
                                trip={trip}
                            />
                        )}

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
                                            className="border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]" placeholder="Cost" />
                                    </div>
                                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                                        className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A] bg-white capitalize">
                                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <button onClick={handleAddActivity}
                                            className="flex-1 bg-[#EA580C] text-white py-2.5 text-xs font-700 uppercase tracking-wider hover:bg-[#C2410C] transition-colors">
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

            {/* Comment slide-out panel */}
            {commentActivityId && (
                <CommentPanel
                    activityId={commentActivityId}
                    activityTitle={"Activity"}
                    onClose={() => setCommentActivityId(null)}
                    tripId={tripId}
                />
            )}
        </div>
    );
}

"use client";
import { useState, use } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader, EmptyState } from "@/components/shared/EmptyState";
import { useTripMember } from "@/hooks/useTripMember";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import {
    Sparkles, Loader2, Sun, CloudRain, Thermometer,
    CheckSquare, Trash2, Shirt, Package, Plug, FileText, Heart, Star
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    essentials: <Package className="w-3.5 h-3.5" />,
    clothing: <Shirt className="w-3.5 h-3.5" />,
    toiletries: <Star className="w-3.5 h-3.5" />,
    electronics: <Plug className="w-3.5 h-3.5" />,
    documents: <FileText className="w-3.5 h-3.5" />,
    health: <Heart className="w-3.5 h-3.5" />,
    fun: <Sun className="w-3.5 h-3.5" />,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    essentials: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
    clothing: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100" },
    toiletries: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-100" },
    electronics: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-100" },
    documents: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
    health: { bg: "bg-red-50", text: "text-red-700", border: "border-red-100" },
    fun: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
};

type Props = { params: Promise<{ tripId: string }> };

export default function PackingPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const { canEdit } = useTripMember(tripId);
    const { user } = useCurrentUser();
    const trip = useQuery(api.trips.getTrip, { tripId });
    const reminders = useQuery(api.packing.getPackingReminders, { tripId });
    const generateSuggestions = useAction(api.packing.generatePackingSuggestions);
    const saveReminders = useMutation(api.packing.savePackingReminders);
    const deleteReminder = useMutation(api.packing.deletePackingReminder);
    const createChecklist = useMutation(api.checklists.createChecklist);
    const addChecklistItem = useMutation(api.checklists.addChecklistItem);
    const checklists = useQuery(api.checklists.getChecklists, { tripId });
    const activities = useQuery(api.activities.getActivities, { tripId });

    const [generating, setGenerating] = useState(false);
    const [preview, setPreview] = useState<{
        weatherSummary: string;
        temperature: string;
        items: { text: string; category: string; tip?: string }[];
    } | null>(null);
    const [addingToChecklist, setAddingToChecklist] = useState(false);

    if (!trip || !reminders || !user || !checklists || !activities) return <PageLoader />;

    const handleGenerate = async () => {
        setGenerating(true);
        setPreview(null);
        try {
            // Only send activity titles and categories to save tokens
            const itinerarySummary = activities.map(a => `${a.title} (${a.category})`).join(", ");

            const result = await generateSuggestions({
                destination: trip.destination,
                startDate: trip.startDate,
                endDate: trip.endDate,
                tripTitle: trip.title,
                itinerarySummary: itinerarySummary || "No specific activities planned yet.",
            });
            setPreview(result as any);
            toast.success("Packing suggestions ready!");
        } catch {
            toast.error("Failed to generate suggestions — try again");
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!preview) return;
        try {
            await saveReminders({
                tripId,
                weatherSummary: preview.weatherSummary,
                temperature: preview.temperature,
                items: preview.items.map(i => ({
                    text: i.text,
                    category: i.category,
                    tip: i.tip,
                })),
            });
            setPreview(null);
            toast.success("Packing reminders saved!");
        } catch {
            toast.error("Failed to save reminders");
        }
    };

    const handleAddToChecklist = async (items: { text: string; category: string }[]) => {
        setAddingToChecklist(true);
        try {
            const listId = await createChecklist({
                tripId,
                title: `🧳 Smart Pack — ${trip.destination}`,
                type: "packing",
                order: checklists.length,
            });
            let order = 0;
            for (const item of items) {
                await addChecklistItem({ checklistId: listId, tripId, text: item.text, order: order++ });
            }
            toast.success(`Added ${items.length} items to checklists!`);
        } catch {
            toast.error("Failed to create checklist");
        } finally {
            setAddingToChecklist(false);
        }
    };

    // Group items by category
    const groupByCategory = (items: { text: string; category: string; tip?: string }[]) => {
        const groups: Record<string, typeof items> = {};
        for (const item of items) {
            const cat = item.category.toLowerCase();
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        }
        return groups;
    };

    return (
        <div>
            <div className="border-b border-[#e5e5e5] px-8 py-5 flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">SMART PACKING</h1>
                    <p className="text-xs text-[#0A0A0A]/40 uppercase tracking-wider mt-0.5">
                        AI-powered packing suggestions for {trip.destination}
                    </p>
                </div>
                {canEdit && (
                    <button onClick={handleGenerate} disabled={generating}
                        className="inline-flex items-center gap-2 bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-6 py-3 hover:bg-[#C2410C] transition-colors disabled:opacity-50">
                        {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {generating ? "Generating..." : "Generate Smart Packing List"}
                    </button>
                )}
            </div>

            {/* AI Preview */}
            {preview && (
                <div className="px-8 py-6 border-b border-[#e5e5e5] bg-gradient-to-br from-[#EA580C]/5 via-amber-50/30 to-transparent">
                    {/* Weather card */}
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 rounded-lg">
                            <Thermometer className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-700 uppercase tracking-wider text-[#EA580C] mb-1">Weather Forecast</p>
                            <p className="text-sm text-[#0A0A0A] font-500 leading-relaxed">{preview.weatherSummary}</p>
                            {preview.temperature && (
                                <p className="text-sm font-700 text-[#EA580C] mt-1">🌡️ {preview.temperature}</p>
                            )}
                        </div>
                    </div>

                    {/* Items by category */}
                    <div className="space-y-4">
                        {Object.entries(groupByCategory(preview.items)).map(([category, items]) => {
                            const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.essentials;
                            return (
                                <div key={category}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`${colors.text}`}>{CATEGORY_ICONS[category] || <Package className="w-3.5 h-3.5" />}</span>
                                        <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A]">{category}</p>
                                        <span className="text-[10px] text-[#0A0A0A]/30 font-600">{items.length} items</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {items.map((item, i) => (
                                            <div key={i} className={`px-3 py-2.5 border ${colors.border} ${colors.bg} flex items-start gap-2`}>
                                                <div className={`w-4 h-4 border ${colors.border} flex-shrink-0 mt-0.5`} />
                                                <div>
                                                    <p className="text-sm font-600 text-[#0A0A0A]">{item.text}</p>
                                                    {item.tip && <p className="text-xs text-[#0A0A0A]/50 mt-0.5 italic">{item.tip}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-6">
                        <button onClick={handleSave}
                            className="bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-5 py-2.5 hover:bg-[#C2410C] transition-colors">
                            Save Reminders
                        </button>
                        <button onClick={() => handleAddToChecklist(preview.items)} disabled={addingToChecklist}
                            className="inline-flex items-center gap-1.5 bg-[#0A0A0A] text-white text-xs font-700 uppercase tracking-wider px-5 py-2.5 hover:bg-[#0A0A0A]/80 transition-colors disabled:opacity-50">
                            <CheckSquare className="w-3.5 h-3.5" />
                            {addingToChecklist ? "Adding..." : "Add All to Checklists"}
                        </button>
                        <button onClick={() => setPreview(null)}
                            className="border border-[#e5e5e5] px-4 py-2.5 text-xs hover:border-[#0A0A0A] transition-colors">
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Saved reminders */}
            <div className="px-8 py-6">
                {reminders.length === 0 && !preview ? (
                    <EmptyState
                        icon={<Sun className="w-8 h-8" strokeWidth={1} />}
                        title="No Packing Reminders Yet"
                        description={"Click 'Generate Smart Packing List' to get weather-based suggestions for " + trip.destination}
                    />
                ) : (
                    reminders.map((reminder: any) => (
                        <div key={reminder._id} className="mb-6 border border-[#e5e5e5] p-5 group">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-xs font-700 uppercase tracking-wider text-[#0A0A0A]/60">
                                        Generated {new Date(reminder.generatedAt).toLocaleDateString()}
                                        {reminder.generatedByUser && ` by ${reminder.generatedByUser.name}`}
                                    </p>
                                    <p className="text-sm text-[#0A0A0A] mt-1">{reminder.weatherSummary}</p>
                                    {reminder.temperature && <p className="text-xs text-[#EA580C] font-600 mt-0.5">🌡️ {reminder.temperature}</p>}
                                </div>
                                {canEdit && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAddToChecklist(reminder.items)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-2 py-1 text-[10px] font-700 uppercase tracking-wider text-[#EA580C] hover:bg-[#EA580C]/10">
                                            <CheckSquare className="w-3 h-3" /> To checklist
                                        </button>
                                        <button onClick={() => { deleteReminder({ reminderId: reminder._id }); toast.success("Deleted"); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#0A0A0A]/20 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                {reminder.items.map((item: any, i: number) => {
                                    const colors = CATEGORY_COLORS[item.category?.toLowerCase()] || CATEGORY_COLORS.essentials;
                                    return (
                                        <div key={i} className={`px-3 py-2 border ${colors.border} ${colors.bg} text-sm`}>
                                            <span className="font-600">{item.text}</span>
                                            {item.tip && <span className="text-xs text-[#0A0A0A]/40 ml-2 italic">— {item.tip}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

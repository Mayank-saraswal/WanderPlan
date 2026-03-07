"use client";
import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader, EmptyState } from "@/components/shared/EmptyState";
import { useTripMember } from "@/hooks/useTripMember";
import { toast } from "sonner";
import { Plus, CheckSquare, Trash2, Sparkles, Check } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Props = { params: Promise<{ tripId: string }> };

export default function ChecklistsPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const { canEdit } = useTripMember(tripId);
    const { user } = useCurrentUser();
    const checklists = useQuery(api.checklists.getChecklists, { tripId });
    const createChecklist = useMutation(api.checklists.createChecklist);
    const deleteChecklist = useMutation(api.checklists.deleteChecklist);
    const addItem = useMutation(api.checklists.addChecklistItem);
    const toggleItem = useMutation(api.checklists.toggleChecklistItem);
    const deleteItem = useMutation(api.checklists.deleteChecklistItem);
    const trip = useQuery(api.trips.getTrip, { tripId });

    const [newListTitle, setNewListTitle] = useState("");
    const [newItemText, setNewItemText] = useState<Record<string, string>>({});
    const [aiLoading, setAiLoading] = useState(false);

    if (!checklists || !user || !trip) return <PageLoader />;

    const handleAIPacking = async () => {
        setAiLoading(true);
        try {
            const res = await fetch("/api/ai/suggest", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "packing", context: { destination: trip.destination, days: 7 } }),
            });
            const data = await res.json();
            if (data.items) {
                const listId = await createChecklist({ tripId, title: `AI Packing List — ${trip.destination}`, type: "packing", order: checklists.length });
                let order = 0;
                for (const item of data.items) {
                    await addItem({ checklistId: listId, tripId, text: item.text, order: order++ });
                }
                toast.success("AI packing list created!");
            }
        } catch { toast.error("AI packing list failed"); } finally { setAiLoading(false); }
    };

    const handleCreate = async () => {
        if (!newListTitle) return;
        await createChecklist({ tripId, title: newListTitle, type: "custom", order: checklists.length });
        setNewListTitle("");
        toast.success("Checklist created!");
    };

    return (
        <div>
            <div className="border-b border-[#e5e5e5] px-8 py-5 flex items-center justify-between">
                <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">CHECKLISTS</h1>
                <div className="flex gap-2">
                    {canEdit && (
                        <button onClick={handleAIPacking} disabled={aiLoading}
                            className="inline-flex items-center gap-2 bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-4 py-2.5 hover:bg-[#C2410C] transition-colors disabled:opacity-50">
                            <Sparkles className="w-4 h-4" /> {aiLoading ? "Generating..." : "AI Packing List"}
                        </button>
                    )}
                </div>
            </div>

            {canEdit && (
                <div className="px-8 py-4 border-b border-[#e5e5e5] flex gap-3">
                    <input type="text" placeholder="New checklist name" value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        className="flex-1 border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                    <button onClick={handleCreate} disabled={!newListTitle}
                        className="bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-5 py-2.5 hover:bg-[#C2410C] transition-colors disabled:opacity-50 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </div>
            )}

            {checklists.length === 0 ? (
                <EmptyState icon={<CheckSquare className="w-8 h-8" strokeWidth={1} />} title="No Checklists"
                    description="Create a checklist or let AI generate a packing list." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8">
                    {checklists.map((cl: any) => {
                        const completed = cl.items.filter((i: any) => i.completed).length;
                        const total = cl.items.length;
                        const pct = total > 0 ? (completed / total) * 100 : 0;
                        return (
                            <div key={cl._id} className="border border-[#e5e5e5] hover:border-[#0A0A0A] transition-colors">
                                {/* Progress bar */}
                                <div className="h-1 w-full bg-[#e5e5e5]">
                                    <div className="h-full bg-[#EA580C] transition-all" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-display text-base font-800 uppercase">{cl.title}</h3>
                                            <p className="text-xs text-[#0A0A0A]/40 uppercase tracking-wider">{cl.type} · {completed}/{total}</p>
                                        </div>
                                        {canEdit && (
                                            <button onClick={() => { deleteChecklist({ checklistId: cl._id }); toast.success("Deleted"); }}
                                                className="text-[#0A0A0A]/20 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {cl.items.map((item: any) => (
                                            <div key={item._id} className="flex items-center gap-3 group">
                                                <button onClick={() => toggleItem({ itemId: item._id })}
                                                    className={`w-4 h-4 border flex-shrink-0 flex items-center justify-center transition-colors ${item.completed ? "bg-[#EA580C] border-[#EA580C]" : "border-[#0A0A0A]/30 hover:border-[#EA580C]"}`}>
                                                    {item.completed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                </button>
                                                <span className={`text-sm flex-1 ${item.completed ? "line-through text-[#0A0A0A]/30" : "text-[#0A0A0A]"}`}>
                                                    {item.text}
                                                </span>
                                                {canEdit && (
                                                    <button onClick={() => { deleteItem({ itemId: item._id }); }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#0A0A0A]/20 hover:text-red-500">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {canEdit && (
                                        <div className="flex gap-2 mt-4">
                                            <input
                                                type="text" placeholder="Add item..."
                                                value={newItemText[cl._id] || ""}
                                                onChange={(e) => setNewItemText((prev) => ({ ...prev, [cl._id]: e.target.value }))}
                                                onKeyDown={async (e) => {
                                                    if (e.key === "Enter" && newItemText[cl._id]) {
                                                        await addItem({ checklistId: cl._id, tripId, text: newItemText[cl._id], order: cl.items.length });
                                                        setNewItemText((prev) => ({ ...prev, [cl._id]: "" }));
                                                    }
                                                }}
                                                className="flex-1 border border-[#e5e5e5] px-3 py-2 text-xs focus:outline-none focus:border-[#0A0A0A]"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

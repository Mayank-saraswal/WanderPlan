"use client";
import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader } from "@/components/shared/EmptyState";
import { useTripMember } from "@/hooks/useTripMember";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import {
    Lightbulb, Plus, ThumbsUp, ThumbsDown, Check, X,
    ExternalLink, Trash2, Home, Utensils, MapPin, Car, HelpCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const IDEA_CATEGORIES = ["accommodation", "restaurant", "activity", "transport", "other"] as const;
const CATEGORY_META: Record<string, { icon: any; color: string; label: string }> = {
    accommodation: { icon: Home, color: "#0A0A0A", label: "Accommodation" },
    restaurant: { icon: Utensils, color: "#f59e0b", label: "Restaurant" },
    activity: { icon: MapPin, color: "#EA580C", label: "Activity" },
    transport: { icon: Car, color: "#6b7280", label: "Transport" },
    other: { icon: HelpCircle, color: "#d1d5db", label: "Other" },
};
const STATUS_COLORS: Record<string, string> = {
    proposed: "bg-blue-100 text-blue-700",
    accepted: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-500",
};

type Props = { params: Promise<{ tripId: string }> };

export default function IdeasPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const { canEdit } = useTripMember(tripId);
    const { user } = useCurrentUser();
    const ideas = useQuery(api.ideas.getIdeas, { tripId });
    const proposeIdea = useMutation(api.ideas.proposeIdea);
    const castVote = useMutation(api.ideas.castVote);
    const updateStatus = useMutation(api.ideas.updateIdeaStatus);
    const deleteIdea = useMutation(api.ideas.deleteIdea);
    const notifyMembers = useMutation(api.notifications.notifyTripMembers);

    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState<"all" | "proposed" | "accepted" | "rejected">("all");
    const [form, setForm] = useState({
        title: "", description: "", category: "activity" as typeof IDEA_CATEGORIES[number], link: ""
    });

    if (!ideas || !user) return <PageLoader />;

    const filtered = filter === "all" ? ideas : ideas.filter((i: any) => i.status === filter);
    const sorted = [...filtered].sort((a: any, b: any) => b.score - a.score);

    const handlePropose = async () => {
        if (!form.title) return;
        try {
            await proposeIdea({
                tripId,
                title: form.title,
                description: form.description || undefined,
                category: form.category,
                link: form.link || undefined,
            });
            await notifyMembers({ tripId, type: "idea_proposed", message: `Proposed idea: ${form.title}` });
            setForm({ title: "", description: "", category: "activity", link: "" });
            setShowForm(false);
            toast.success("Idea proposed!");
        } catch (e: any) { toast.error(e.message); }
    };

    const handleVote = async (ideaId: string, ideaTitle: string, vote: "up" | "down") => {
        try {
            await castVote({ ideaId: ideaId as Id<"ideas">, vote });
            await notifyMembers({ tripId, type: "idea_voted", message: `${vote === "up" ? "👍 Upvoted" : "👎 Downvoted"} idea: ${ideaTitle}` });
        } catch (e: any) { toast.error(e.message); }
    };

    const getUserVote = (idea: any): "up" | "down" | null => {
        const v = idea.voters?.find((v: any) => v.userId === user._id);
        return v?.vote || null;
    };

    const handleStatus = async (ideaId: string, ideaTitle: string, status: "accepted" | "rejected" | "proposed") => {
        await updateStatus({ ideaId: ideaId as Id<"ideas">, status });
        await notifyMembers({ tripId, type: "idea_status_changed", message: `Idea ${status}: ${ideaTitle}` });
        toast.success(`Idea ${status}`);
    };

    return (
        <div>
            {/* Header */}
            <div className="border-b border-[#e5e5e5] px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">IDEAS BOARD</h1>
                    <span className="bg-[#0A0A0A] text-white text-[10px] font-800 px-2 py-0.5 uppercase tracking-wider">
                        {ideas.length} proposals
                    </span>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="inline-flex items-center gap-2 bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-5 py-3 hover:bg-[#C2410C] transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Propose Idea
                    </button>
                )}
            </div>

            {/* Filter tabs */}
            <div className="border-b border-[#e5e5e5] px-8 flex gap-0">
                {(["all", "proposed", "accepted", "rejected"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-5 py-3 text-xs font-700 uppercase tracking-wider border-b-2 transition-colors ${filter === f
                            ? "border-[#EA580C] text-[#0A0A0A]"
                            : "border-transparent text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
                            }`}
                    >
                        {f}
                        <span className="ml-1.5 text-[10px] text-[#0A0A0A]/30">
                            ({f === "all" ? ideas.length : ideas.filter((i: any) => i.status === f).length})
                        </span>
                    </button>
                ))}
            </div>

            {/* Propose form */}
            {showForm && canEdit && (
                <div className="px-8 py-6 border-b border-[#e5e5e5] bg-[#0A0A0A]/5">
                    <h3 className="font-display text-sm font-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-[#EA580C]" />
                        Propose an Idea
                    </h3>
                    <div className="space-y-3 max-w-xl">
                        <input
                            type="text" placeholder="What's your idea? *"
                            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A] bg-white"
                        />
                        <textarea
                            placeholder="Describe your idea (optional)"
                            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A] bg-white resize-none h-20"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <select
                                value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                                className="border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A] bg-white"
                            >
                                {IDEA_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{CATEGORY_META[c].label}</option>
                                ))}
                            </select>
                            <input
                                type="url" placeholder="Link (optional)"
                                value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
                                className="border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A] bg-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handlePropose}
                                className="bg-[#EA580C] text-white px-5 py-2.5 text-xs font-700 uppercase tracking-wider hover:bg-[#C2410C] transition-colors">
                                Submit Idea
                            </button>
                            <button onClick={() => setShowForm(false)}
                                className="border border-[#e5e5e5] px-4 py-2.5 text-xs hover:border-[#0A0A0A] transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ideas grid */}
            <div className="px-8 py-6">
                {sorted.length === 0 ? (
                    <div className="text-center py-16">
                        <Lightbulb className="w-12 h-12 text-[#0A0A0A]/10 mx-auto mb-3" strokeWidth={1} />
                        <p className="font-display text-lg font-700 uppercase text-[#0A0A0A]/20">
                            {filter === "all" ? "No ideas yet" : `No ${filter} ideas`}
                        </p>
                        <p className="text-xs text-[#0A0A0A]/30 mt-1">Be the first to propose something!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sorted.map((idea: any) => {
                            const meta = CATEGORY_META[idea.category] || CATEGORY_META.other;
                            const CatIcon = meta.icon;
                            const userVote = getUserVote(idea);

                            return (
                                <div key={idea._id} className="border border-[#e5e5e5] group hover:border-[#0A0A0A]/20 transition-colors">
                                    <div className="flex">
                                        {/* Voting column */}
                                        <div className="flex flex-col items-center px-4 py-4 border-r border-[#e5e5e5] gap-1">
                                            <button
                                                onClick={() => handleVote(idea._id, idea.title, "up")}
                                                className={`p-1.5 transition-colors ${userVote === "up"
                                                    ? "text-emerald-600 bg-emerald-50"
                                                    : "text-[#0A0A0A]/20 hover:text-emerald-600 hover:bg-emerald-50"
                                                    }`}
                                            >
                                                <ThumbsUp className="w-4 h-4" />
                                            </button>
                                            <span className={`font-display text-lg font-900 ${idea.score > 0 ? "text-emerald-600" : idea.score < 0 ? "text-red-500" : "text-[#0A0A0A]/30"
                                                }`}>
                                                {idea.score}
                                            </span>
                                            <button
                                                onClick={() => handleVote(idea._id, idea.title, "down")}
                                                className={`p-1.5 transition-colors ${userVote === "down"
                                                    ? "text-red-500 bg-red-50"
                                                    : "text-[#0A0A0A]/20 hover:text-red-500 hover:bg-red-50"
                                                    }`}
                                            >
                                                <ThumbsDown className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 px-5 py-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <CatIcon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                                                        <span className="text-[10px] font-700 uppercase tracking-wider" style={{ color: meta.color }}>
                                                            {meta.label}
                                                        </span>
                                                        <span className={`text-[10px] font-700 uppercase tracking-wider px-1.5 py-0.5 ${STATUS_COLORS[idea.status]}`}>
                                                            {idea.status}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-700 text-[#0A0A0A] text-sm">{idea.title}</h3>
                                                    {idea.description && (
                                                        <p className="text-xs text-[#0A0A0A]/50 mt-1 leading-relaxed">{idea.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-2">
                                                        {idea.proposer && (
                                                            <div className="flex items-center gap-1.5">
                                                                {idea.proposer.imageUrl && (
                                                                    <img src={idea.proposer.imageUrl} className="w-4 h-4 rounded-full" alt="" />
                                                                )}
                                                                <span className="text-[10px] text-[#0A0A0A]/40">{idea.proposer.name}</span>
                                                            </div>
                                                        )}
                                                        <span className="text-[10px] text-[#0A0A0A]/30">
                                                            {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
                                                        </span>
                                                        {idea.link && (
                                                            <a href={idea.link} target="_blank" rel="noopener noreferrer"
                                                                className="text-[10px] text-[#EA580C] font-600 flex items-center gap-0.5 hover:underline">
                                                                <ExternalLink className="w-3 h-3" /> Link
                                                            </a>
                                                        )}
                                                        <span className="text-[10px] text-[#0A0A0A]/30">
                                                            {idea.upVotes} 👍 · {idea.downVotes} 👎
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                {canEdit && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {idea.status !== "accepted" && (
                                                            <button
                                                                onClick={() => handleStatus(idea._id, idea.title, "accepted")}
                                                                className="p-1.5 text-[#0A0A0A]/20 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                                title="Accept"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {idea.status !== "rejected" && (
                                                            <button
                                                                onClick={() => handleStatus(idea._id, idea.title, "rejected")}
                                                                className="p-1.5 text-[#0A0A0A]/20 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                                title="Reject"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={async () => { await deleteIdea({ ideaId: idea._id as Id<"ideas"> }); await notifyMembers({ tripId, type: "idea_status_changed", message: `Deleted idea: ${idea.title}` }); toast.success("Deleted"); }}
                                                            className="p-1.5 text-[#0A0A0A]/20 hover:text-red-500 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

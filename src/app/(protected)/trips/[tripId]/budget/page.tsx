"use client";
import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader, EmptyState } from "@/components/shared/EmptyState";
import { useTripMember } from "@/hooks/useTripMember";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { Plus, DollarSign, Sparkles, Trash2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const CAT_COLORS: Record<string, string> = {
    transport: "#EA580C", accommodation: "#0A0A0A", food: "#f59e0b",
    activity: "#374151", shopping: "#6b7280", other: "#d1d5db",
};

const CATEGORIES = ["transport", "accommodation", "food", "activity", "shopping", "other"] as const;

type Props = { params: Promise<{ tripId: string }> };

export default function BudgetPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const { canEdit } = useTripMember(tripId);
    const { user } = useCurrentUser();
    const trip = useQuery(api.trips.getTrip, { tripId });
    const expenses = useQuery(api.expenses.getExpenses, { tripId });
    const members = useQuery(api.tripMembers.getTripMembers, { tripId });
    const createExpense = useMutation(api.expenses.createExpense);
    const deleteExpense = useMutation(api.expenses.deleteExpense);

    const [showForm, setShowForm] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [form, setForm] = useState({ title: "", amount: "", category: "food" as typeof CATEGORIES[number], notes: "" });

    if (!trip || !expenses || !members || !user) return <PageLoader />;

    const totalBudget = trip.totalBudget ?? 0;
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const remaining = totalBudget - totalSpent;
    const pct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

    const byCategory = CATEGORIES.map((cat) => ({
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        value: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
        color: CAT_COLORS[cat],
    })).filter((c) => c.value > 0);

    const handleAdd = async () => {
        if (!form.title || !form.amount) return;
        try {
            await createExpense({
                tripId,
                title: form.title,
                amount: parseFloat(form.amount),
                currency: trip.currency,
                category: form.category,
                paidBy: user._id,
                splitWith: [],
                date: Date.now(),
                notes: form.notes || undefined,
            });
            setForm({ title: "", amount: "", category: "food", notes: "" });
            setShowForm(false);
            toast.success("Expense added!");
        } catch (e: any) { toast.error(e.message); }
    };

    const handleAIBudget = async () => {
        setAiLoading(true);
        try {
            const res = await fetch("/api/ai/suggest", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "budget", context: { destination: trip.destination, days: 7, travelers: members.length, currency: trip.currency } }),
            });
            const data = await res.json();
            if (data.breakdown) {
                for (const b of data.breakdown) {
                    await createExpense({
                        tripId, title: b.category, amount: b.estimated, currency: trip.currency,
                        category: b.category.toLowerCase().replace(/[^a-z]/g, "") as any || "other",
                        paidBy: user._id, splitWith: [], date: Date.now(), notes: b.notes,
                    });
                }
                toast.success("AI budget estimate added!");
            }
        } catch { toast.error("AI budget failed"); } finally { setAiLoading(false); }
    };

    return (
        <div>
            <div className="border-b border-[#e5e5e5] px-8 py-5 flex items-center justify-between">
                <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">BUDGET</h1>
                {canEdit && (
                    <button onClick={handleAIBudget} disabled={aiLoading}
                        className="inline-flex items-center gap-2 border border-[#0A0A0A] text-[#0A0A0A] text-xs font-700 uppercase tracking-wider px-4 py-2.5 hover:bg-[#0A0A0A] hover:text-white transition-colors disabled:opacity-50">
                        <Sparkles className="w-4 h-4" /> {aiLoading ? "Estimating..." : "AI Estimate"}
                    </button>
                )}
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 border-b border-[#e5e5e5]">
                {[
                    { label: "Total Budget", value: totalBudget > 0 ? `${trip.currency} ${totalBudget.toLocaleString()}` : "Not set", cls: "" },
                    { label: "Spent", value: `${trip.currency} ${totalSpent.toLocaleString()}`, cls: "border-x border-[#e5e5e5]" },
                    { label: "Remaining", value: `${trip.currency} ${remaining.toLocaleString()}`, cls: remaining < 0 ? "text-red-500" : "" },
                ].map((s) => (
                    <div key={s.label} className={`px-8 py-6 ${s.cls}`}>
                        <p className={`font-display text-3xl font-900 text-[#0A0A0A] ${s.cls}`}>{s.value}</p>
                        <p className="text-[#0A0A0A]/40 text-xs uppercase tracking-wider mt-1">{s.label}</p>
                        {s.label === "Spent" && totalBudget > 0 && (
                            <div className="mt-3 h-1.5 bg-[#e5e5e5] w-full">
                                <div className="h-full bg-[#EA580C] transition-all" style={{ width: `${pct}%` }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 divide-x divide-[#e5e5e5]">
                {/* Chart */}
                <div className="px-8 py-6">
                    <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A] mb-4">BY CATEGORY</p>
                    {byCategory.length === 0 ? (
                        <p className="text-[#0A0A0A]/30 text-sm py-10 text-center">No expenses yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={byCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" strokeWidth={0}>
                                    {byCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip formatter={(v: any) => `${trip.currency} ${Number(v).toLocaleString()}`} />
                                <Legend iconType="square" iconSize={10} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Add expense */}
                <div className="px-8 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A]">EXPENSES</p>
                        {canEdit && (
                            <button onClick={() => setShowForm(!showForm)}
                                className="inline-flex items-center gap-1 text-xs text-[#EA580C] font-700 uppercase tracking-wider">
                                <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                        )}
                    </div>

                    {showForm && canEdit && (
                        <div className="space-y-2 mb-4 border border-[#e5e5e5] p-4">
                            <input type="text" placeholder="Expense name *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                            <input type="number" placeholder={`Amount (${trip.currency}) *`} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                className="w-full border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                                className="w-full border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A] bg-white capitalize">
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input type="text" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                className="w-full border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                            <button onClick={handleAdd} className="w-full bg-[#0A0A0A] text-white py-2 text-xs font-700 uppercase tracking-wider hover:bg-[#EA580C] transition-colors">
                                Add Expense
                            </button>
                        </div>
                    )}

                    {expenses.length === 0 ? (
                        <p className="text-[#0A0A0A]/30 text-sm text-center py-8">No expenses yet</p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {expenses.map((e: any) => (
                                <div key={e._id} className="flex items-center gap-3 group">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[e.category] || "#ccc" }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-600 text-[#0A0A0A] truncate">{e.title}</p>
                                        <p className="text-xs text-[#0A0A0A]/40 capitalize">{e.category}</p>
                                    </div>
                                    <p className="font-700 text-sm text-[#0A0A0A]">{trip.currency} {e.amount.toLocaleString()}</p>
                                    {canEdit && (
                                        <button onClick={() => { deleteExpense({ expenseId: e._id }); toast.success("Deleted"); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#0A0A0A]/30 hover:text-red-500">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

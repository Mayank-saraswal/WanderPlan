"use client";
import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader, EmptyState } from "@/components/shared/EmptyState";
import { useTripMember } from "@/hooks/useTripMember";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { Plus, DollarSign, Sparkles, Trash2, ArrowRight, Users, Receipt, Scale, Check } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const CAT_COLORS: Record<string, string> = {
    transport: "#EA580C", accommodation: "#0A0A0A", food: "#f59e0b",
    activity: "#374151", shopping: "#6b7280", other: "#d1d5db",
};

const CATEGORIES = ["transport", "accommodation", "food", "activity", "shopping", "other"] as const;

type Props = { params: Promise<{ tripId: string }> };

// ─── Balance Calculation Engine ───
function calculateBalances(expenses: any[], members: any[]) {
    // Track net balance for each user: positive = owed money, negative = owes money
    const netBalances: Record<string, number> = {};
    members.forEach((m: any) => { netBalances[m.userId] = 0; });

    for (const expense of expenses) {
        const payer = expense.paidBy;
        // If splitWith is empty, assume split equally with all members
        const splitMembers = expense.splitWith && expense.splitWith.length > 0
            ? expense.splitWith
            : members.map((m: any) => m.userId);

        // Include the payer in the split if they aren't already
        const allSplitters = splitMembers.includes(payer) ? splitMembers : [payer, ...splitMembers];
        const perPerson = expense.amount / allSplitters.length;

        // Payer paid the full amount, so they are owed (amount - their share)
        if (netBalances[payer] !== undefined) {
            netBalances[payer] += expense.amount - perPerson;
        }
        // Each other person owes their share
        for (const uid of allSplitters) {
            if (uid !== payer && netBalances[uid] !== undefined) {
                netBalances[uid] -= perPerson;
            }
        }
    }

    return netBalances;
}

// Simplify debts into minimal transfers
function simplifyDebts(netBalances: Record<string, number>) {
    const creditors: { id: string; amount: number }[] = [];
    const debtors: { id: string; amount: number }[] = [];

    for (const [id, balance] of Object.entries(netBalances)) {
        if (balance > 0.01) creditors.push({ id, amount: balance });
        else if (balance < -0.01) debtors.push({ id, amount: -balance });
    }

    // Sort descending
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const settlements: { from: string; to: string; amount: number }[] = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const transfer = Math.min(debtors[i].amount, creditors[j].amount);
        if (transfer > 0.01) {
            settlements.push({
                from: debtors[i].id,
                to: creditors[j].id,
                amount: Math.round(transfer * 100) / 100,
            });
        }
        debtors[i].amount -= transfer;
        creditors[j].amount -= transfer;
        if (debtors[i].amount < 0.01) i++;
        if (creditors[j].amount < 0.01) j++;
    }

    return settlements;
}

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
    const notifyMembers = useMutation(api.notifications.notifyTripMembers);

    const [showForm, setShowForm] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"expenses" | "balances">("expenses");
    const [form, setForm] = useState({ title: "", amount: "", category: "food" as typeof CATEGORIES[number], notes: "" });
    const [splitWith, setSplitWith] = useState<string[]>([]); // user IDs to split with
    const [splitMode, setSplitMode] = useState<"all" | "custom">("all");

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

    // Balance calculations
    const netBalances = calculateBalances(expenses, members);
    const settlements = simplifyDebts(netBalances);

    // Member lookup helper
    const memberLookup: Record<string, any> = {};
    members.forEach((m: any) => { memberLookup[m.userId] = m; });

    const getMemberName = (userId: string) => {
        const m = memberLookup[userId];
        return m?.user?.name || m?.name || "Unknown";
    };

    const getMemberImage = (userId: string) => {
        const m = memberLookup[userId];
        return m?.user?.imageUrl || null;
    };

    const toggleSplitMember = (userId: string) => {
        setSplitWith((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const handleAdd = async () => {
        if (!form.title || !form.amount) return;
        try {
            const split = splitMode === "all" ? [] : splitWith.map(id => id as Id<"users">);
            await createExpense({
                tripId,
                title: form.title,
                amount: parseFloat(form.amount),
                currency: trip.currency,
                category: form.category,
                paidBy: user._id,
                splitWith: split,
                date: Date.now(),
                notes: form.notes || undefined,
            });
            await notifyMembers({ tripId, type: "budget_updated", message: `Added expense: ${form.title} (${trip.currency} ${form.amount})` });
            setForm({ title: "", amount: "", category: "food", notes: "" });
            setSplitWith([]);
            setSplitMode("all");
            setShowForm(false);
            toast.success("Expense added!");
        } catch (e: any) { toast.error(e.message); }
    };

    const mapToCategory = (raw: string): typeof CATEGORIES[number] => {
        const s = raw.toLowerCase();
        if (s.includes("transport") || s.includes("flight") || s.includes("taxi") || s.includes("train") || s.includes("bus") || s.includes("uber")) return "transport";
        if (s.includes("hotel") || s.includes("accommodation") || s.includes("stay") || s.includes("hostel") || s.includes("airbnb") || s.includes("lodging")) return "accommodation";
        if (s.includes("food") || s.includes("dining") || s.includes("meal") || s.includes("restaurant") || s.includes("eat") || s.includes("coffee") || s.includes("drink")) return "food";
        if (s.includes("shop") || s.includes("souvenir") || s.includes("gift") || s.includes("market") || s.includes("buying")) return "shopping";
        if (s.includes("activity") || s.includes("tour") || s.includes("entertainment") || s.includes("excursion") || s.includes("museum") || s.includes("sightseeing") || s.includes("ticket")) return "activity";
        return "other";
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
                        category: mapToCategory(b.category),
                        paidBy: user._id, splitWith: [], date: Date.now(), notes: b.notes,
                    });
                }
                await notifyMembers({ tripId, type: "budget_updated", message: `AI budget estimate generated for ${trip.destination}` });
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

            {/* Tabs: Expenses | Balances */}
            <div className="border-b border-[#e5e5e5] px-8 flex gap-0">
                {([
                    { key: "expenses" as const, label: "Expenses", icon: Receipt },
                    { key: "balances" as const, label: "Who Owes Who", icon: Scale },
                ]).map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={`px-5 py-3 text-xs font-700 uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === t.key
                                ? "border-[#EA580C] text-[#0A0A0A]"
                                : "border-transparent text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
                            }`}
                    >
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                        {t.key === "balances" && settlements.length > 0 && (
                            <span className="bg-[#EA580C] text-white text-[10px] font-800 w-5 h-5 flex items-center justify-center rounded-full">
                                {settlements.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {activeTab === "expenses" && (
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

                    {/* Expense list + add form */}
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

                                {/* Split with selector */}
                                <div className="border border-[#e5e5e5] p-3">
                                    <p className="text-xs font-700 uppercase tracking-wider text-[#0A0A0A]/60 mb-2 flex items-center gap-1">
                                        <Users className="w-3 h-3" /> Split with
                                    </p>
                                    <div className="flex gap-2 mb-2">
                                        <button
                                            onClick={() => { setSplitMode("all"); setSplitWith([]); }}
                                            className={`px-3 py-1.5 text-[10px] font-700 uppercase tracking-wider border transition-colors ${splitMode === "all" ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "border-[#e5e5e5] text-[#0A0A0A]/50 hover:border-[#0A0A0A]"
                                                }`}
                                        >
                                            Everyone
                                        </button>
                                        <button
                                            onClick={() => setSplitMode("custom")}
                                            className={`px-3 py-1.5 text-[10px] font-700 uppercase tracking-wider border transition-colors ${splitMode === "custom" ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "border-[#e5e5e5] text-[#0A0A0A]/50 hover:border-[#0A0A0A]"
                                                }`}
                                        >
                                            Custom
                                        </button>
                                    </div>
                                    {splitMode === "custom" && (
                                        <div className="space-y-1.5">
                                            {members.map((m: any) => {
                                                if (m.userId === user._id) return null; // Don't show current user
                                                const selected = splitWith.includes(m.userId);
                                                return (
                                                    <button
                                                        key={m.userId}
                                                        onClick={() => toggleSplitMember(m.userId)}
                                                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs transition-colors text-left ${selected ? "bg-[#EA580C]/10 text-[#0A0A0A]" : "hover:bg-[#0A0A0A]/5 text-[#0A0A0A]/60"
                                                            }`}
                                                    >
                                                        <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 ${selected ? "bg-[#EA580C] border-[#EA580C] text-white" : "border-[#e5e5e5]"
                                                            }`}>
                                                            {selected && <Check className="w-3 h-3" />}
                                                        </div>
                                                        {m.user?.imageUrl && (
                                                            <img src={m.user.imageUrl} className="w-5 h-5 rounded-full" alt="" />
                                                        )}
                                                        <span className="font-600">{m.user?.name || "Unknown"}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

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
                            <div className="space-y-2 max-h-72 overflow-y-auto">
                                {expenses.map((e: any) => (
                                    <div key={e._id} className="flex items-center gap-3 group">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[e.category] || "#ccc" }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-600 text-[#0A0A0A] truncate">{e.title}</p>
                                            <p className="text-xs text-[#0A0A0A]/40 capitalize">
                                                {e.category}
                                                {e.paidByUser && <span className="ml-1">· Paid by {e.paidByUser.name}</span>}
                                                {e.splitWith && e.splitWith.length > 0 && (
                                                    <span className="ml-1">· Split {e.splitWith.length + 1} ways</span>
                                                )}
                                            </p>
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
            )}

            {activeTab === "balances" && (
                <div className="px-8 py-6">
                    {/* Settle Up Section */}
                    {settlements.length === 0 ? (
                        <div className="text-center py-16">
                            <Scale className="w-12 h-12 text-[#0A0A0A]/10 mx-auto mb-3" strokeWidth={1} />
                            <p className="font-display text-lg font-700 uppercase text-[#0A0A0A]/20">All Settled Up!</p>
                            <p className="text-xs text-[#0A0A0A]/30 mt-1">
                                {expenses.length === 0 ? "Add expenses to start tracking balances" : "Everyone is even — no payments needed"}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A] mb-4">SETTLE UP — {settlements.length} payment{settlements.length > 1 ? "s" : ""} needed</p>
                            <div className="space-y-3 mb-8">
                                {settlements.map((s, i) => (
                                    <div key={i} className="border border-[#e5e5e5] p-4 flex items-center gap-4">
                                        {/* From */}
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {getMemberImage(s.from) ? (
                                                <img src={getMemberImage(s.from)} className="w-8 h-8 rounded-full" alt="" />
                                            ) : (
                                                <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-700">
                                                    {getMemberName(s.from).charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-700 text-[#0A0A0A]">{getMemberName(s.from)}</p>
                                                <p className="text-[10px] uppercase tracking-wider text-red-500 font-700">Owes</p>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="flex flex-col items-center gap-1 px-3">
                                            <p className="font-display text-xl font-900 text-[#EA580C]">
                                                {trip.currency} {s.amount.toLocaleString()}
                                            </p>
                                            <ArrowRight className="w-5 h-5 text-[#0A0A0A]/20" />
                                        </div>

                                        {/* To */}
                                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                            <div className="text-right">
                                                <p className="text-sm font-700 text-[#0A0A0A]">{getMemberName(s.to)}</p>
                                                <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-700">Gets back</p>
                                            </div>
                                            {getMemberImage(s.to) ? (
                                                <img src={getMemberImage(s.to)} className="w-8 h-8 rounded-full" alt="" />
                                            ) : (
                                                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-700">
                                                    {getMemberName(s.to).charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Per-person summary */}
                            <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A] mb-3">INDIVIDUAL BALANCES</p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(netBalances)
                                    .filter(([, b]) => Math.abs(b) > 0.01)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([userId, balance]) => (
                                        <div key={userId} className="border border-[#e5e5e5] p-3 flex items-center gap-3">
                                            {getMemberImage(userId) ? (
                                                <img src={getMemberImage(userId)} className="w-7 h-7 rounded-full" alt="" />
                                            ) : (
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-700 ${balance > 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                                                    }`}>
                                                    {getMemberName(userId).charAt(0)}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-600 text-[#0A0A0A] truncate">{getMemberName(userId)}</p>
                                            </div>
                                            <p className={`font-700 text-sm ${balance > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                                {balance > 0 ? "+" : ""}{trip.currency} {balance.toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

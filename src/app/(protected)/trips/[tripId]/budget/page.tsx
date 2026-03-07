"use client";
import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader, EmptyState } from "@/components/shared/EmptyState";
import { useTripMember } from "@/hooks/useTripMember";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { Plus, Trash2, ArrowRight, Users, Receipt, Scale, Check, Wallet, User, ChevronDown, Sparkles } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const CAT_COLORS: Record<string, string> = {
    transport: "#EA580C", accommodation: "#0A0A0A", food: "#f59e0b",
    activity: "#374151", shopping: "#6b7280", other: "#d1d5db",
};

const CATEGORIES = ["transport", "accommodation", "food", "activity", "shopping", "other"] as const;

type Props = { params: Promise<{ tripId: string }> };

// ─── Balance Calculation Engine (100% real data — no estimates) ───
function calculateBalances(expenses: any[], members: any[]) {
    const netBalances: Record<string, number> = {};
    members.forEach((m: any) => { netBalances[m.userId] = 0; });

    for (const expense of expenses) {
        const payer = expense.paidBy;
        const splitMembers = expense.splitWith && expense.splitWith.length > 0
            ? expense.splitWith
            : members.map((m: any) => m.userId);

        const allSplitters = splitMembers.includes(payer) ? splitMembers : [payer, ...splitMembers];
        const perPerson = expense.amount / allSplitters.length;

        if (netBalances[payer] !== undefined) {
            netBalances[payer] += expense.amount - perPerson;
        }
        for (const uid of allSplitters) {
            if (uid !== payer && netBalances[uid] !== undefined) {
                netBalances[uid] -= perPerson;
            }
        }
    }

    return netBalances;
}

function simplifyDebts(netBalances: Record<string, number>) {
    const creditors: { id: string; amount: number }[] = [];
    const debtors: { id: string; amount: number }[] = [];

    for (const [id, balance] of Object.entries(netBalances)) {
        if (balance > 0.01) creditors.push({ id, amount: balance });
        else if (balance < -0.01) debtors.push({ id, amount: -balance });
    }

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

// ─── Per-member spending breakdown ───
function getMemberSpending(expenses: any[], members: any[]) {
    const spending: Record<string, { paid: number; share: number; count: number }> = {};
    members.forEach((m: any) => { spending[m.userId] = { paid: 0, share: 0, count: 0 }; });

    for (const expense of expenses) {
        const payer = expense.paidBy;
        if (spending[payer]) {
            spending[payer].paid += expense.amount;
            spending[payer].count += 1;
        }

        const splitMembers = expense.splitWith && expense.splitWith.length > 0
            ? expense.splitWith
            : members.map((m: any) => m.userId);
        const allSplitters = splitMembers.includes(payer) ? splitMembers : [payer, ...splitMembers];
        const perPerson = expense.amount / allSplitters.length;

        for (const uid of allSplitters) {
            if (spending[uid]) {
                spending[uid].share += perPerson;
            }
        }
    }

    return spending;
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
    const [activeTab, setActiveTab] = useState<"expenses" | "balances" | "members">("expenses");
    const [form, setForm] = useState({ title: "", amount: "", category: "food" as typeof CATEGORIES[number], notes: "" });
    const [splitWith, setSplitWith] = useState<string[]>([]);
    const [splitMode, setSplitMode] = useState<"all" | "custom">("all");
    const [paidBy, setPaidBy] = useState<string>("");
    const [showPayerDropdown, setShowPayerDropdown] = useState(false);

    if (!trip || !expenses || !members || !user) return <PageLoader />;

    // Set default payer to current user if not set
    if (!paidBy && user) {
        setPaidBy(user._id);
    }

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const totalBudget = trip.totalBudget ?? 0;
    const remaining = totalBudget - totalSpent;
    const pct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

    const byCategory = CATEGORIES.map((cat) => ({
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        value: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
        color: CAT_COLORS[cat],
    })).filter((c) => c.value > 0);

    // Real balance calculations
    const netBalances = calculateBalances(expenses, members);
    const settlements = simplifyDebts(netBalances);
    const memberSpending = getMemberSpending(expenses, members);

    // Member lookup
    const memberLookup: Record<string, any> = {};
    members.forEach((m: any) => { memberLookup[m.userId] = m; });
    const getMemberName = (userId: string) => memberLookup[userId]?.user?.name || "Unknown";
    const getMemberImage = (userId: string) => memberLookup[userId]?.user?.imageUrl || null;

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
                paidBy: paidBy as Id<"users">,
                splitWith: split,
                date: Date.now(),
                notes: form.notes || undefined,
            });
            await notifyMembers({ tripId, type: "expense_added", message: `💰 ${getMemberName(paidBy)} paid ${trip.currency} ${form.amount} for ${form.title}` });
            setForm({ title: "", amount: "", category: "food", notes: "" });
            setSplitWith([]);
            setSplitMode("all");
            setShowForm(false);
            toast.success("Expense added!");
        } catch (e: any) { toast.error(e.message); }
    };

    return (
        <div>
            <div className="border-b border-[#e5e5e5] px-8 py-5 flex items-center justify-between">
                <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">BUDGET</h1>
                {canEdit && (
                    <button onClick={() => setShowForm(!showForm)}
                        className="inline-flex items-center gap-2 bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-6 py-3 hover:bg-[#C2410C] transition-colors">
                        <Plus className="w-5 h-5" /> Add Expense
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 border-b border-[#e5e5e5]">
                <div className="px-6 py-5">
                    <p className="font-display text-2xl font-900 text-[#0A0A0A]">
                        {trip.currency} {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[#0A0A0A]/40 text-xs uppercase tracking-wider mt-1">Total Spent</p>
                </div>
                <div className="px-6 py-5 border-x border-[#e5e5e5]">
                    <p className="font-display text-2xl font-900 text-[#0A0A0A]">{expenses.length}</p>
                    <p className="text-[#0A0A0A]/40 text-xs uppercase tracking-wider mt-1">Expenses</p>
                </div>
                <div className="px-6 py-5 border-r border-[#e5e5e5]">
                    <p className="font-display text-2xl font-900 text-[#0A0A0A]">{members.length}</p>
                    <p className="text-[#0A0A0A]/40 text-xs uppercase tracking-wider mt-1">Members</p>
                </div>
                <div className="px-6 py-5">
                    <p className={`font-display text-2xl font-900 ${remaining < 0 ? "text-red-500" : "text-[#0A0A0A]"}`}>
                        {totalBudget > 0 ? `${trip.currency} ${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                    </p>
                    <p className="text-[#0A0A0A]/40 text-xs uppercase tracking-wider mt-1">
                        {totalBudget > 0 ? "Remaining" : "No Budget Set"}
                    </p>
                    {totalBudget > 0 && (
                        <div className="mt-2 h-1.5 bg-[#e5e5e5] w-full">
                            <div className={`h-full transition-all ${pct > 90 ? "bg-red-500" : "bg-[#EA580C]"}`} style={{ width: `${pct}%` }} />
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#e5e5e5] px-8 flex gap-0">
                {([
                    { key: "expenses" as const, label: "Expenses", icon: Receipt, badge: expenses.length },
                    { key: "balances" as const, label: "Who Owes Who", icon: Scale, badge: settlements.length },
                    { key: "members" as const, label: "Member Spending", icon: Wallet, badge: 0 },
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
                        {t.badge > 0 && (
                            <span className="bg-[#EA580C] text-white text-[10px] font-800 w-5 h-5 flex items-center justify-center rounded-full">
                                {t.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ═══ EXPENSES TAB ═══ */}
            {activeTab === "expenses" && (
                <div className="grid grid-cols-2 divide-x divide-[#e5e5e5]">
                    {/* Chart */}
                    <div className="px-8 py-6">
                        <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A] mb-4">SPENDING BY CATEGORY</p>
                        {byCategory.length === 0 ? (
                            <p className="text-[#0A0A0A]/30 text-sm py-10 text-center">No expenses yet</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie data={byCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" strokeWidth={0}>
                                        {byCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => `${trip.currency} ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                                    <Legend iconType="square" iconSize={10} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Expense list + form */}
                    <div className="px-8 py-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A]">ALL EXPENSES</p>
                        </div>

                        {/* Add expense form */}
                        {showForm && canEdit && (
                            <div className="space-y-2 mb-4 border border-[#EA580C] p-4 bg-[#EA580C]/5">
                                <p className="text-xs font-700 uppercase tracking-wider text-[#EA580C] mb-2">New Expense</p>
                                <input type="text" placeholder="What was it for? *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                                <input type="number" placeholder={`Amount (${trip.currency}) *`} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    className="w-full border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                                    className="w-full border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A] bg-white capitalize">
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>

                                {/* WHO PAID — Payer selector */}
                                <div className="border border-[#e5e5e5] p-3">
                                    <p className="text-xs font-700 uppercase tracking-wider text-[#0A0A0A]/60 mb-2 flex items-center gap-1">
                                        <User className="w-3 h-3" /> Who paid?
                                    </p>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowPayerDropdown(!showPayerDropdown)}
                                            className="w-full flex items-center gap-2 px-3 py-2 border border-[#e5e5e5] text-sm text-left hover:border-[#0A0A0A] transition-colors"
                                        >
                                            {getMemberImage(paidBy) && (
                                                <img src={getMemberImage(paidBy)} className="w-5 h-5 rounded-full" alt="" />
                                            )}
                                            <span className="flex-1 font-600">{getMemberName(paidBy)}</span>
                                            {paidBy === user._id && <span className="text-[10px] text-[#EA580C] font-700 uppercase">You</span>}
                                            <ChevronDown className="w-3.5 h-3.5 text-[#0A0A0A]/30" />
                                        </button>
                                        {showPayerDropdown && (
                                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e5e5e5] shadow-lg z-10">
                                                {members.map((m: any) => (
                                                    <button
                                                        key={m.userId}
                                                        onClick={() => { setPaidBy(m.userId); setShowPayerDropdown(false); }}
                                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[#0A0A0A]/5 transition-colors ${paidBy === m.userId ? "bg-[#EA580C]/10" : ""
                                                            }`}
                                                    >
                                                        {m.user?.imageUrl && (
                                                            <img src={m.user.imageUrl} className="w-5 h-5 rounded-full" alt="" />
                                                        )}
                                                        <span className="flex-1 font-600">{m.user?.name || "Unknown"}</span>
                                                        {m.userId === user._id && <span className="text-[10px] text-[#EA580C] font-700 uppercase">You</span>}
                                                        {paidBy === m.userId && <Check className="w-4 h-4 text-[#EA580C]" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Split with */}
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
                                            Everyone ({members.length})
                                        </button>
                                        <button
                                            onClick={() => setSplitMode("custom")}
                                            className={`px-3 py-1.5 text-[10px] font-700 uppercase tracking-wider border transition-colors ${splitMode === "custom" ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "border-[#e5e5e5] text-[#0A0A0A]/50 hover:border-[#0A0A0A]"
                                                }`}
                                        >
                                            Custom
                                        </button>
                                    </div>
                                    {splitMode === "all" && (
                                        <p className="text-[10px] text-[#0A0A0A]/40">
                                            {trip.currency} {form.amount ? (parseFloat(form.amount) / members.length).toFixed(2) : "0.00"} per person
                                        </p>
                                    )}
                                    {splitMode === "custom" && (
                                        <div className="space-y-1.5">
                                            {members.map((m: any) => {
                                                const selected = splitWith.includes(m.userId);
                                                const isPayerUser = m.userId === paidBy;
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
                                                        <span className="font-600 flex-1">{m.user?.name || "Unknown"}</span>
                                                        {isPayerUser && <span className="text-[10px] text-[#0A0A0A]/30">Payer</span>}
                                                    </button>
                                                );
                                            })}
                                            {splitWith.length > 0 && form.amount && (
                                                <p className="text-[10px] text-[#0A0A0A]/40 mt-1">
                                                    {trip.currency} {(parseFloat(form.amount) / (splitWith.includes(paidBy) ? splitWith.length : splitWith.length + 1)).toFixed(2)} per person
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <input type="text" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className="w-full border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                                <div className="flex gap-2">
                                    <button onClick={handleAdd} className="flex-1 bg-[#EA580C] text-white py-2.5 text-xs font-700 uppercase tracking-wider hover:bg-[#C2410C] transition-colors flex items-center justify-center gap-1">
                                        <Check className="w-4 h-4" /> Add Expense
                                    </button>
                                    <button onClick={() => setShowForm(false)}
                                        className="border border-[#e5e5e5] px-4 py-2.5 text-xs hover:border-[#0A0A0A] transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {expenses.length === 0 ? (
                            <p className="text-[#0A0A0A]/30 text-sm text-center py-8">No expenses yet — add your first real expense above</p>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {expenses.map((e: any) => {
                                    const splitCount = e.splitWith && e.splitWith.length > 0 ? e.splitWith.length : members.length;
                                    const perPerson = e.amount / (e.splitWith && e.splitWith.length > 0
                                        ? (e.splitWith.includes(e.paidBy) ? e.splitWith.length : e.splitWith.length + 1)
                                        : members.length);

                                    return (
                                        <div key={e._id} className="flex items-center gap-3 group border border-[#e5e5e5] px-3 py-2.5">
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[e.category] || "#ccc" }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-600 text-[#0A0A0A] truncate">{e.title}</p>
                                                <div className="flex items-center gap-2 text-xs text-[#0A0A0A]/40">
                                                    <span className="capitalize">{e.category}</span>
                                                    <span>·</span>
                                                    <span className="flex items-center gap-1">
                                                        {e.paidByUser?.imageUrl && <img src={e.paidByUser.imageUrl} className="w-3.5 h-3.5 rounded-full" alt="" />}
                                                        Paid by <strong className="font-600 text-[#0A0A0A]/60">{e.paidByUser?.name || "Unknown"}</strong>
                                                    </span>
                                                    <span>·</span>
                                                    <span>{trip.currency} {perPerson.toFixed(2)}/person</span>
                                                </div>
                                            </div>
                                            <p className="font-700 text-sm text-[#0A0A0A]">{trip.currency} {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                            {canEdit && (
                                                <button onClick={async () => { await deleteExpense({ expenseId: e._id }); await notifyMembers({ tripId, type: "expense_deleted", message: `🗑️ Deleted expense: ${e.title} (${trip.currency} ${e.amount})` }); toast.success("Deleted"); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#0A0A0A]/30 hover:text-red-500">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ WHO OWES WHO TAB ═══ */}
            {activeTab === "balances" && (
                <div className="px-8 py-6">
                    <div className="bg-[#0A0A0A]/5 border border-[#e5e5e5] px-4 py-3 mb-6 flex items-center gap-2">
                        <Scale className="w-4 h-4 text-[#0A0A0A]/40" />
                        <p className="text-xs text-[#0A0A0A]/50">
                            All balances are calculated from <strong className="text-[#0A0A0A] font-700">{expenses.length} real expenses</strong> totaling <strong className="text-[#0A0A0A] font-700">{trip.currency} {totalSpent.toFixed(2)}</strong>. No estimates.
                        </p>
                    </div>

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
                            <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A] mb-4">
                                SETTLE UP — {settlements.length} payment{settlements.length > 1 ? "s" : ""} needed
                            </p>
                            <div className="space-y-3 mb-8">
                                {settlements.map((s, i) => (
                                    <div key={i} className="border border-[#e5e5e5] p-4 flex items-center gap-4">
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

                                        <div className="flex flex-col items-center gap-1 px-3">
                                            <p className="font-display text-xl font-900 text-[#EA580C]">
                                                {trip.currency} {s.amount.toFixed(2)}
                                            </p>
                                            <ArrowRight className="w-5 h-5 text-[#0A0A0A]/20" />
                                        </div>

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

                            <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A] mb-3">NET BALANCES</p>
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

            {/* ═══ MEMBER SPENDING TAB ═══ */}
            {activeTab === "members" && (
                <div className="px-8 py-6">
                    <div className="bg-[#0A0A0A]/5 border border-[#e5e5e5] px-4 py-3 mb-6 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-[#0A0A0A]/40" />
                        <p className="text-xs text-[#0A0A0A]/50">
                            Shows exactly <strong className="text-[#0A0A0A] font-700">how much each member paid</strong> vs <strong className="text-[#0A0A0A] font-700">their fair share</strong> based on {expenses.length} real expenses.
                        </p>
                    </div>

                    <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A] mb-4">PER-MEMBER BREAKDOWN</p>

                    <div className="space-y-3">
                        {members.map((m: any) => {
                            const stats = memberSpending[m.userId] || { paid: 0, share: 0, count: 0 };
                            const diff = stats.paid - stats.share; // positive = overpaid, negative = underpaid

                            return (
                                <div key={m.userId} className="border border-[#e5e5e5] p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        {m.user?.imageUrl ? (
                                            <img src={m.user.imageUrl} className="w-10 h-10 rounded-full" alt="" />
                                        ) : (
                                            <div className="w-10 h-10 bg-[#0A0A0A]/10 rounded-full flex items-center justify-center font-700 text-sm">
                                                {(m.user?.name || "?").charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-700 text-[#0A0A0A]">{m.user?.name || "Unknown"}</p>
                                            <p className="text-xs text-[#0A0A0A]/40">{stats.count} expense{stats.count !== 1 ? "s" : ""} paid</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-display text-lg font-900 ${diff > 0.01 ? "text-emerald-600" : diff < -0.01 ? "text-red-500" : "text-[#0A0A0A]/30"}`}>
                                                {diff > 0.01 ? `+${trip.currency} ${diff.toFixed(2)}` : diff < -0.01 ? `-${trip.currency} ${Math.abs(diff).toFixed(2)}` : "Even"}
                                            </p>
                                            <p className="text-[10px] uppercase tracking-wider text-[#0A0A0A]/30">
                                                {diff > 0.01 ? "Overpaid" : diff < -0.01 ? "Underpaid" : "Balanced"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bar visualizations */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1">
                                                <span className="text-[#0A0A0A]/40">Actually Paid</span>
                                                <span className="font-700 text-[#0A0A0A]">{trip.currency} {stats.paid.toFixed(2)}</span>
                                            </div>
                                            <div className="h-2 bg-[#e5e5e5]">
                                                <div className="h-full bg-[#0A0A0A] transition-all"
                                                    style={{ width: totalSpent > 0 ? `${(stats.paid / totalSpent) * 100}%` : "0%" }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1">
                                                <span className="text-[#0A0A0A]/40">Fair Share</span>
                                                <span className="font-700 text-[#0A0A0A]">{trip.currency} {stats.share.toFixed(2)}</span>
                                            </div>
                                            <div className="h-2 bg-[#e5e5e5]">
                                                <div className="h-full bg-[#EA580C] transition-all"
                                                    style={{ width: totalSpent > 0 ? `${(stats.share / totalSpent) * 100}%` : "0%" }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";
import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader, EmptyState } from "@/components/shared/EmptyState";
import { useTripMember } from "@/hooks/useTripMember";
import { toast } from "sonner";
import { Bookmark, Plane, Building2, Car, Utensils, Activity, Plus, X, Check, Trash2 } from "lucide-react";

const TYPES = [
    { value: "flight", label: "Flight", icon: Plane },
    { value: "hotel", label: "Hotel", icon: Building2 },
    { value: "car", label: "Car", icon: Car },
    { value: "restaurant", label: "Restaurant", icon: Utensils },
    { value: "activity", label: "Activity", icon: Activity },
    { value: "other", label: "Other", icon: Bookmark },
] as const;

const STATUS_STYLE = {
    confirmed: "bg-[#EA580C] text-white",
    pending: "bg-[#0A0A0A] text-white",
    cancelled: "bg-gray-300 text-gray-600",
};

type RType = typeof TYPES[number]["value"];
type Props = { params: Promise<{ tripId: string }> };

export default function ReservationsPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const { canEdit } = useTripMember(tripId);
    const reservations = useQuery(api.reservations.getReservations, { tripId });
    const trip = useQuery(api.trips.getTrip, { tripId });
    const createReservation = useMutation(api.reservations.createReservation);
    const deleteReservation = useMutation(api.reservations.deleteReservation);
    const updateReservation = useMutation(api.reservations.updateReservation);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        title: "", type: "flight" as RType, confirmationNumber: "",
        provider: "", checkIn: "", checkOut: "", amount: "", currency: "USD",
        notes: "", status: "pending" as "confirmed" | "pending" | "cancelled",
    });

    if (!reservations || !trip) return <PageLoader />;

    const grouped = TYPES.map((t) => ({
        ...t,
        items: reservations.filter((r) => r.type === t.value),
    })).filter((g) => g.items.length > 0);

    const handleCreate = async () => {
        if (!form.title || !form.checkIn) return;
        try {
            await createReservation({
                tripId, title: form.title, type: form.type,
                confirmationNumber: form.confirmationNumber || undefined,
                provider: form.provider || undefined,
                checkIn: new Date(form.checkIn).getTime(),
                checkOut: form.checkOut ? new Date(form.checkOut).getTime() : undefined,
                amount: form.amount ? parseFloat(form.amount) : undefined,
                currency: form.currency || trip.currency,
                notes: form.notes || undefined,
                status: form.status,
            });
            setShowForm(false);
            setForm({ title: "", type: "flight", confirmationNumber: "", provider: "", checkIn: "", checkOut: "", amount: "", currency: trip.currency, notes: "", status: "pending" });
            toast.success("Reservation added!");
        } catch (e: any) { toast.error(e.message); }
    };

    return (
        <div>
            <div className="border-b border-[#e5e5e5] px-8 py-5 flex items-center justify-between">
                <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">RESERVATIONS</h1>
                {canEdit && (
                    <button onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-5 py-3 hover:bg-[#C2410C] transition-colors">
                        <Plus className="w-4 h-4" /> Add Reservation
                    </button>
                )}
            </div>

            {/* Form slide-over */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
                    <div className="relative bg-white w-full max-w-md h-full overflow-y-auto border-l border-[#0A0A0A] shadow-2xl">
                        <div className="px-6 py-5 border-b border-[#e5e5e5] flex items-center justify-between">
                            <h2 className="font-display text-xl font-800 uppercase">Add Reservation</h2>
                            <button onClick={() => setShowForm(false)} className="text-[#0A0A0A]/40 hover:text-[#0A0A0A]"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Type selector */}
                            <div>
                                <p className="text-xs font-700 uppercase tracking-wider mb-2">Type</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {TYPES.map((t) => (
                                        <button key={t.value} onClick={() => setForm({ ...form, type: t.value })}
                                            className={`flex flex-col items-center gap-1 py-3 border text-xs font-700 uppercase transition-colors ${form.type === t.value ? "border-[#EA580C] bg-[#EA580C]/5 text-[#EA580C]" : "border-[#e5e5e5] text-[#0A0A0A]/50 hover:border-[#0A0A0A]"}`}>
                                            <t.icon className="w-4 h-4" strokeWidth={1.5} />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {[
                                { label: "Title *", key: "title", type: "text", placeholder: "e.g. Emirates EK124" },
                                { label: "Provider", key: "provider", type: "text", placeholder: "e.g. Emirates, Marriott" },
                                { label: "Confirmation #", key: "confirmationNumber", type: "text", placeholder: "ABC123" },
                                { label: "Check-in / Departure *", key: "checkIn", type: "datetime-local", placeholder: "" },
                                { label: "Check-out / Arrival", key: "checkOut", type: "datetime-local", placeholder: "" },
                                { label: "Amount", key: "amount", type: "number", placeholder: "0" },
                                { label: "Notes", key: "notes", type: "text", placeholder: "Any additional notes" },
                            ].map((f) => (
                                <div key={f.key}>
                                    <label className="text-xs font-700 uppercase tracking-wider text-[#0A0A0A] block mb-1">{f.label}</label>
                                    <input type={f.type} value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                                        placeholder={f.placeholder}
                                        className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                                </div>
                            ))}
                            <div>
                                <label className="text-xs font-700 uppercase tracking-wider text-[#0A0A0A] block mb-1">Status</label>
                                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                                    className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A] bg-white">
                                    <option value="confirmed">Confirmed</option>
                                    <option value="pending">Pending</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <button onClick={handleCreate} className="w-full bg-[#EA580C] text-white py-3 text-sm font-700 uppercase tracking-wider hover:bg-[#C2410C] transition-colors flex items-center justify-center gap-2">
                                <Check className="w-4 h-4" /> Add Reservation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reservations grouped */}
            <div className="px-8 py-6">
                {reservations.length === 0 ? (
                    <EmptyState icon={<Bookmark className="w-8 h-8" strokeWidth={1} />} title="No Reservations" description="Add flights, hotels, and bookings to keep everything in one place." />
                ) : (
                    <div className="space-y-8">
                        {grouped.map((group) => (
                            <div key={group.value}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-1 h-5 bg-[#EA580C]" />
                                    <p className="font-display text-sm font-800 uppercase tracking-widest text-[#0A0A0A]">{group.label}S</p>
                                </div>
                                <div className="space-y-2">
                                    {group.items.map((r) => (
                                        <div key={r._id} className="border border-[#e5e5e5] p-4 flex items-center gap-4 hover:border-[#0A0A0A] transition-colors group">
                                            <div className="w-8 h-8 bg-[#0A0A0A] flex items-center justify-center flex-shrink-0">
                                                <group.icon className="w-4 h-4 text-white" strokeWidth={1.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-600 text-sm text-[#0A0A0A]">{r.title}</p>
                                                {r.provider && <p className="text-xs text-[#0A0A0A]/50">{r.provider}</p>}
                                                {r.confirmationNumber && (
                                                    <p className="text-xs font-mono text-[#EA580C] bg-[#EA580C]/5 px-2 py-0.5 inline-block mt-1">{r.confirmationNumber}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                {r.checkIn && <p className="text-xs text-[#0A0A0A]/50">{new Date(r.checkIn).toLocaleDateString()}</p>}
                                                {r.amount && trip && <p className="font-700 text-sm">{r.currency || trip.currency} {r.amount.toLocaleString()}</p>}
                                            </div>
                                            <span className={`text-xs font-700 uppercase tracking-wider px-2 py-1 flex-shrink-0 ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                                            {canEdit && (
                                                <button onClick={() => { deleteReservation({ reservationId: r._id }); toast.success("Deleted"); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#0A0A0A]/20 hover:text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

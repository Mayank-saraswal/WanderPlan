"use client";
import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/EmptyState";
import { useTripMember } from "@/hooks/useTripMember";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "JPY", "SGD"];

type Props = { params: Promise<{ tripId: string }> };

export default function SettingsPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const { isOwner, role } = useTripMember(tripId);
    const trip = useQuery(api.trips.getTrip, { tripId });
    const updateTrip = useMutation(api.trips.updateTrip);
    const deleteTrip = useMutation(api.trips.deleteTrip);
    const router = useRouter();

    const [form, setForm] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState("");

    if (!trip || role === undefined) return <PageLoader />;

    if (!form && trip) {
        setForm({
            title: trip.title,
            description: trip.description ?? "",
            destination: trip.destination,
            startDate: trip.startDate ? new Date(trip.startDate).toISOString().split("T")[0] : "",
            endDate: trip.endDate ? new Date(trip.endDate).toISOString().split("T")[0] : "",
            currency: trip.currency,
            totalBudget: trip.totalBudget?.toString() ?? "",
            status: trip.status,
        });
        return <PageLoader />;
    }

    if (!isOwner) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Lock className="w-12 h-12 text-[#0A0A0A]/20" strokeWidth={1} />
                <p className="font-display text-xl font-700 uppercase text-[#0A0A0A]/40">Owner Only</p>
                <p className="text-sm text-[#0A0A0A]/30">Only the trip owner can access settings.</p>
            </div>
        );
    }

    const isDirty = form && trip && (
        form.title !== trip.title ||
        form.description !== (trip.description ?? "") ||
        form.destination !== trip.destination ||
        form.currency !== trip.currency ||
        form.status !== trip.status
    );

    const handleSave = async () => {
        if (!form) return;
        setSaving(true);
        try {
            await updateTrip({
                tripId,
                title: form.title,
                description: form.description || undefined,
                destination: form.destination,
                startDate: form.startDate ? new Date(form.startDate).getTime() : undefined,
                endDate: form.endDate ? new Date(form.endDate).getTime() : undefined,
                currency: form.currency,
                totalBudget: form.totalBudget ? parseFloat(form.totalBudget) : undefined,
                status: form.status,
            });
            toast.success("Changes saved!");
        } catch (e: any) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (deleteConfirmName !== trip.title) { toast.error("Trip name doesn't match"); return; }
        try {
            await deleteTrip({ tripId });
            toast.success("Trip deleted");
            router.push("/dashboard");
        } catch (e: any) { toast.error(e.message); }
    };

    return (
        <div>
            <div className="border-b border-[#e5e5e5] px-8 py-5">
                <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">SETTINGS</h1>
            </div>

            <div className="px-8 py-6 space-y-10 max-w-2xl">
                {/* General */}
                <section>
                    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-[#e5e5e5]">
                        <div className="w-1 h-4 bg-[#EA580C]" />
                        <h2 className="font-display text-sm font-800 uppercase tracking-widest">GENERAL</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: "Trip Name", key: "title", type: "text" },
                            { label: "Destination", key: "destination", type: "text" },
                            { label: "Description", key: "description", type: "textarea" },
                            { label: "Start Date", key: "startDate", type: "date" },
                            { label: "End Date", key: "endDate", type: "date" },
                            { label: "Total Budget", key: "totalBudget", type: "number" },
                        ].map((f) => (
                            <div key={f.key}>
                                <label className="text-xs font-700 uppercase tracking-wider text-[#0A0A0A] block mb-1">{f.label}</label>
                                {f.type === "textarea" ? (
                                    <textarea rows={3} value={form?.[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                                        className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#0A0A0A]" />
                                ) : (
                                    <input type={f.type} value={form?.[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                                        className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                                )}
                            </div>
                        ))}
                        <div>
                            <label className="text-xs font-700 uppercase tracking-wider text-[#0A0A0A] block mb-1">Currency</label>
                            <select value={form?.currency ?? "USD"} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A] bg-white">
                                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-700 uppercase tracking-wider text-[#0A0A0A] block mb-1">Status</label>
                            <select value={form?.status ?? "planning"} onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A] bg-white">
                                <option value="planning">Planning</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={!isDirty || saving}
                        className="mt-6 bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-8 py-3 hover:bg-[#C2410C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </section>

                {/* Danger Zone */}
                <section className="border-l-4 border-red-600 pl-5">
                    <h2 className="font-display text-sm font-800 uppercase tracking-widest text-red-600 mb-4">DANGER ZONE</h2>
                    <p className="text-sm text-[#0A0A0A]/50 mb-4">
                        Permanently delete this trip and all its data — activities, expenses, checklists, files, and members. This action cannot be undone.
                    </p>
                    <button
                        onClick={() => setDeleteConfirm(true)}
                        className="border-2 border-red-600 text-red-600 text-xs font-700 uppercase tracking-wider px-6 py-3 hover:bg-red-600 hover:text-white transition-colors"
                    >
                        Delete Trip
                    </button>
                </section>
            </div>

            {/* Delete confirm modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteConfirm(false)} />
                    <div className="relative bg-white border border-[#0A0A0A] p-8 max-w-md w-full mx-4">
                        <h3 className="font-display text-2xl font-800 uppercase text-red-600 mb-3">Delete Trip?</h3>
                        <p className="text-[#0A0A0A]/60 text-sm mb-4">
                            Type <strong>{trip.title}</strong> to confirm:
                        </p>
                        <input type="text" value={deleteConfirmName} onChange={(e) => setDeleteConfirmName(e.target.value)}
                            placeholder={trip.title} className="w-full border border-[#e5e5e5] px-4 py-3 text-sm focus:outline-none focus:border-red-600 mb-6" />
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(false)} className="flex-1 border border-[#0A0A0A] py-2.5 text-sm font-600 uppercase hover:bg-[#EA580C] hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleteConfirmName !== trip.title}
                                className="flex-1 bg-red-600 text-white py-2.5 text-sm font-600 uppercase hover:bg-red-700 transition-colors disabled:opacity-50">
                                Delete Forever
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

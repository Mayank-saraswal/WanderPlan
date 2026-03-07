"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppSidebar } from "@/components/layout/Sidebar";
import { MapPin, Calendar, DollarSign, Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "JPY", "SGD"];

const steps = [
    { num: 1, label: "Trip Details" },
    { num: 2, label: "Dates" },
    { num: 3, label: "Budget" },
];

export default function NewTripPage() {
    const router = useRouter();
    const createTrip = useMutation(api.trips.createTrip);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    const [form, setForm] = useState({
        title: "",
        destination: "",
        description: "",
        startDate: "",
        endDate: "",
        currency: "USD",
        totalBudget: "",
    });

    const update = (key: string, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const calcDays = () => {
        if (!form.startDate || !form.endDate) return 0;
        const diff = new Date(form.endDate).getTime() - new Date(form.startDate).getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    };

    const generateDescription = async () => {
        if (!form.title || !form.destination) {
            toast.error("Enter a title and destination first");
            return;
        }
        setAiLoading(true);
        try {
            const res = await fetch("/api/ai/suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "description",
                    context: { title: form.title, destination: form.destination },
                }),
            });
            if (!res.ok) throw new Error("AI request failed");
            const data = await res.json();
            update("description", data.description ?? "");
            toast.success("AI description generated!");
        } catch {
            toast.error("Failed to generate description");
        } finally {
            setAiLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.title || !form.destination || !form.startDate || !form.endDate) {
            toast.error("Please fill in all required fields");
            return;
        }
        if (new Date(form.startDate) > new Date(form.endDate)) {
            toast.error("End date must be on or after start date");
            return;
        }
        setLoading(true);
        try {
            const tripId = await createTrip({
                title: form.title,
                destination: form.destination,
                description: form.description || undefined,
                startDate: new Date(form.startDate).getTime(),
                endDate: new Date(form.endDate).getTime(),
                currency: form.currency,
                totalBudget: form.totalBudget ? parseFloat(form.totalBudget) : undefined,
            });
            toast.success("Trip created!");
            router.push(`/trips/${tripId}/overview`);
        } catch (err: any) {
            toast.error(err.message || "Failed to create trip");
        } finally {
            setLoading(false);
        }
    };

    const days = calcDays();

    return (
        <div className="flex min-h-screen bg-white">
            <AppSidebar />
            <main className="flex-1 ml-56 px-8 py-8">
                {/* Header */}
                <div className="border-b border-[#e5e5e5] pb-6 mb-8">
                    <p className="text-[#0A0A0A]/40 text-xs uppercase tracking-widest font-display mb-1">New Trip</p>
                    <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">CREATE A TRIP</h1>
                </div>

                <div className="max-w-2xl">
                    {/* Step progress */}
                    <div className="flex items-center gap-0 mb-10">
                        {steps.map((s, i) => (
                            <div key={s.num} className="flex items-center">
                                <div className={`flex items-center justify-center w-8 h-8 text-sm font-700 border-2 transition-all ${step > s.num
                                        ? "bg-[#0A0A0A] border-[#0A0A0A] text-white"
                                        : step === s.num
                                            ? "bg-[#EA580C] border-[#EA580C] text-white"
                                            : "border-[#e5e5e5] text-[#0A0A0A]/30"
                                    }`}>
                                    {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                                </div>
                                <span className={`ml-2 text-xs uppercase tracking-wider font-600 ${step === s.num ? "text-[#0A0A0A]" : "text-[#0A0A0A]/40"}`}>
                                    {s.label}
                                </span>
                                {i < steps.length - 1 && (
                                    <div className="w-12 h-px bg-[#e5e5e5] mx-4" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Live preview */}
                    {(form.title || form.destination) && (
                        <div className="border border-[#0A0A0A] p-5 mb-8 bg-[#0A0A0A] text-white">
                            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Preview</p>
                            <h2 className="font-display text-2xl font-900 uppercase">{form.title || "Trip Title"}</h2>
                            {form.destination && (
                                <p className="text-[#EA580C] text-sm font-600 uppercase tracking-wider mt-1">{form.destination}</p>
                            )}
                            {form.startDate && form.endDate && (
                                <p className="text-white/40 text-xs mt-2">
                                    {new Date(form.startDate).toLocaleDateString()} — {new Date(form.endDate).toLocaleDateString()} · {days} days
                                </p>
                            )}
                        </div>
                    )}

                    {/* Step 1 */}
                    {step === 1 && (
                        <div className="space-y-6 border border-[#e5e5e5] p-6">
                            <div>
                                <label className="block text-xs font-700 uppercase tracking-wider text-[#0A0A0A] mb-2">
                                    Trip Name <span className="text-[#EA580C]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => update("title", e.target.value)}
                                    placeholder="e.g. Tokyo Summer 2026"
                                    className="w-full border border-[#e5e5e5] px-4 py-3 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-700 uppercase tracking-wider text-[#0A0A0A] mb-2">
                                    Destination <span className="text-[#EA580C]">*</span>
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-[#0A0A0A]/30" strokeWidth={1.5} />
                                    <input
                                        type="text"
                                        value={form.destination}
                                        onChange={(e) => update("destination", e.target.value)}
                                        placeholder="e.g. Tokyo, Japan"
                                        className="w-full border border-[#e5e5e5] pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-700 uppercase tracking-wider text-[#0A0A0A]">
                                        Description
                                    </label>
                                    <button
                                        onClick={generateDescription}
                                        disabled={aiLoading}
                                        className="inline-flex items-center gap-1.5 text-xs text-[#EA580C] font-600 uppercase tracking-wider hover:underline disabled:opacity-50"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        {aiLoading ? "Generating..." : "AI Write"}
                                    </button>
                                </div>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => update("description", e.target.value)}
                                    placeholder="Describe your trip..."
                                    rows={3}
                                    className="w-full border border-[#e5e5e5] px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#0A0A0A] transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <div className="space-y-6 border border-[#e5e5e5] p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-700 uppercase tracking-wider text-[#0A0A0A] mb-2">
                                        Start Date <span className="text-[#EA580C]">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-[#0A0A0A]/30" strokeWidth={1.5} />
                                        <input
                                            type="date"
                                            value={form.startDate}
                                            onChange={(e) => update("startDate", e.target.value)}
                                            className="w-full border border-[#e5e5e5] pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-700 uppercase tracking-wider text-[#0A0A0A] mb-2">
                                        End Date <span className="text-[#EA580C]">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-[#0A0A0A]/30" strokeWidth={1.5} />
                                        <input
                                            type="date"
                                            value={form.endDate}
                                            min={form.startDate}
                                            onChange={(e) => update("endDate", e.target.value)}
                                            className="w-full border border-[#e5e5e5] pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                            {days > 0 && (
                                <div className="border border-[#EA580C]/20 bg-[#EA580C]/5 p-4">
                                    <p className="text-[#EA580C] font-700 uppercase tracking-wider text-sm">
                                        {days} {days === 1 ? "day" : "days"} trip
                                    </p>
                                    <p className="text-[#0A0A0A]/50 text-xs mt-1">
                                        Days will be auto-created in your itinerary
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                        <div className="space-y-6 border border-[#e5e5e5] p-6">
                            <div>
                                <label className="block text-xs font-700 uppercase tracking-wider text-[#0A0A0A] mb-2">
                                    Currency
                                </label>
                                <select
                                    value={form.currency}
                                    onChange={(e) => update("currency", e.target.value)}
                                    className="w-full border border-[#e5e5e5] px-4 py-3 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors bg-white"
                                >
                                    {CURRENCIES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-700 uppercase tracking-wider text-[#0A0A0A] mb-2">
                                    Total Budget (optional)
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-[#0A0A0A]/30" strokeWidth={1.5} />
                                    <input
                                        type="number"
                                        value={form.totalBudget}
                                        onChange={(e) => update("totalBudget", e.target.value)}
                                        placeholder="e.g. 5000"
                                        min="0"
                                        className="w-full border border-[#e5e5e5] pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between mt-6">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep((s) => s - 1)}
                                className="inline-flex items-center gap-2 border border-[#e5e5e5] px-6 py-3 text-sm font-600 uppercase tracking-wider hover:border-[#0A0A0A] transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                        ) : (
                            <div />
                        )}
                        {step < 3 ? (
                            <button
                                onClick={() => setStep((s) => s + 1)}
                                disabled={
                                    step === 1 ? !form.title || !form.destination :
                                        step === 2 ? !form.startDate || !form.endDate : false
                                }
                                className="inline-flex items-center gap-2 bg-[#0A0A0A] text-white px-8 py-3 text-sm font-700 uppercase tracking-wider hover:bg-[#EA580C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="inline-flex items-center gap-2 bg-[#EA580C] text-white px-8 py-3 text-sm font-700 uppercase tracking-wider hover:bg-[#C2410C] transition-colors disabled:opacity-50"
                            >
                                {loading ? "Creating..." : "Create Trip"} <Check className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

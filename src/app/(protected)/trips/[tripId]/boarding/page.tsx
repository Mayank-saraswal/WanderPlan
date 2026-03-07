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
    Ticket, Plane, Trash2, Plus, Sparkles, Loader2, MapPin,
    Clock, Hash, User, X, ChevronDown, ChevronUp
} from "lucide-react";

type Props = { params: Promise<{ tripId: string }> };

type ExtractedPass = {
    airline: string;
    flightNumber: string;
    departure: string;
    arrival: string;
    departureTime: string;
    arrivalTime: string;
    terminal: string;
    gate: string;
    seat: string;
    date: string;
    passengerName: string;
};

export default function BoardingPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const { canEdit } = useTripMember(tripId);
    const { user } = useCurrentUser();
    const passes = useQuery(api.boardingPasses.getBoardingPasses, { tripId });
    const addPass = useMutation(api.boardingPasses.addBoardingPass);
    const deletePass = useMutation(api.boardingPasses.deleteBoardingPass);
    const extractPass = useAction(api.boardingPasses.extractBoardingPass);

    const [rawText, setRawText] = useState("");
    const [extracting, setExtracting] = useState(false);
    const [extracted, setExtracted] = useState<ExtractedPass | null>(null);
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualForm, setManualForm] = useState({
        airline: "", flightNumber: "", departure: "", arrival: "",
        departureTime: "", arrivalTime: "", terminal: "", gate: "", seat: "", date: "", passengerName: "",
    });

    if (!passes || !user) return <PageLoader />;

    const handleExtract = async () => {
        if (!rawText.trim()) return;
        setExtracting(true);
        try {
            const result = await extractPass({ rawText });
            setExtracted(result as ExtractedPass);
            toast.success("Boarding pass info extracted!");
        } catch {
            toast.error("Failed to extract — try pasting clearer text");
        } finally {
            setExtracting(false);
        }
    };

    const handleSaveExtracted = async () => {
        if (!extracted) return;
        try {
            await addPass({
                tripId,
                airline: extracted.airline || "Unknown Airline",
                flightNumber: extracted.flightNumber || "N/A",
                departure: extracted.departure || "N/A",
                arrival: extracted.arrival || "N/A",
                departureTime: extracted.departureTime || undefined,
                arrivalTime: extracted.arrivalTime || undefined,
                terminal: extracted.terminal || undefined,
                gate: extracted.gate || undefined,
                seat: extracted.seat || undefined,
                date: extracted.date || new Date().toISOString().split("T")[0],
                passengerName: extracted.passengerName || undefined,
            });
            setExtracted(null);
            setRawText("");
            toast.success("Boarding pass saved!");
        } catch {
            toast.error("Failed to save boarding pass");
        }
    };

    const handleManualAdd = async () => {
        if (!manualForm.airline || !manualForm.flightNumber) return;
        try {
            await addPass({
                tripId,
                airline: manualForm.airline,
                flightNumber: manualForm.flightNumber,
                departure: manualForm.departure || "N/A",
                arrival: manualForm.arrival || "N/A",
                departureTime: manualForm.departureTime || undefined,
                arrivalTime: manualForm.arrivalTime || undefined,
                terminal: manualForm.terminal || undefined,
                gate: manualForm.gate || undefined,
                seat: manualForm.seat || undefined,
                date: manualForm.date || new Date().toISOString().split("T")[0],
                passengerName: manualForm.passengerName || undefined,
            });
            setManualForm({ airline: "", flightNumber: "", departure: "", arrival: "", departureTime: "", arrivalTime: "", terminal: "", gate: "", seat: "", date: "", passengerName: "" });
            setShowManualForm(false);
            toast.success("Boarding pass added!");
        } catch {
            toast.error("Failed to add boarding pass");
        }
    };

    return (
        <div>
            <div className="border-b border-[#e5e5e5] px-8 py-5 flex items-center justify-between">
                <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">BOARDING PASSES</h1>
                {canEdit && (
                    <button onClick={() => setShowManualForm(!showManualForm)}
                        className="inline-flex items-center gap-2 bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-6 py-3 hover:bg-[#C2410C] transition-colors">
                        <Plus className="w-5 h-5" /> Add Manually
                    </button>
                )}
            </div>

            {/* AI Extractor */}
            {canEdit && (
                <div className="px-8 py-6 border-b border-[#e5e5e5] bg-gradient-to-r from-[#EA580C]/5 to-transparent">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-[#EA580C]" />
                        <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A]">AI Pass Scanner</p>
                    </div>
                    <p className="text-xs text-[#0A0A0A]/50 mb-3">
                        Paste your boarding pass text, booking confirmation email, or ticket info below — AI will extract the flight details.
                    </p>
                    <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder={"Paste your boarding pass or booking email here...\n\nExample:\nBoarding Pass\nPassenger: John Doe\nFlight: AI302\nFrom: DEL (Delhi) → BOM (Mumbai)\nDate: 15 Mar 2026\nDeparture: 06:30  Gate: T3-22\nSeat: 14A"}
                        className="w-full border border-[#e5e5e5] px-4 py-3 text-sm h-32 resize-none focus:outline-none focus:border-[#0A0A0A] font-mono"
                    />
                    <div className="flex gap-2 mt-3">
                        <button onClick={handleExtract} disabled={!rawText.trim() || extracting}
                            className="inline-flex items-center gap-2 bg-[#0A0A0A] text-white text-xs font-700 uppercase tracking-wider px-5 py-2.5 hover:bg-[#0A0A0A]/80 transition-colors disabled:opacity-40">
                            {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {extracting ? "Extracting..." : "Extract with AI"}
                        </button>
                        {rawText && (
                            <button onClick={() => { setRawText(""); setExtracted(null); }}
                                className="border border-[#e5e5e5] px-4 py-2.5 text-xs hover:border-[#0A0A0A] transition-colors">
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Extracted result */}
                    {extracted && (
                        <div className="mt-4 border border-[#EA580C] bg-[#EA580C]/5 p-4">
                            <p className="text-xs font-700 uppercase tracking-wider text-[#EA580C] mb-3">✨ Extracted Result</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-[#0A0A0A]/40 text-xs uppercase">Airline</span><p className="font-600">{extracted.airline || "—"}</p></div>
                                <div><span className="text-[#0A0A0A]/40 text-xs uppercase">Flight</span><p className="font-600">{extracted.flightNumber || "—"}</p></div>
                                <div><span className="text-[#0A0A0A]/40 text-xs uppercase">From</span><p className="font-600">{extracted.departure || "—"}</p></div>
                                <div><span className="text-[#0A0A0A]/40 text-xs uppercase">To</span><p className="font-600">{extracted.arrival || "—"}</p></div>
                                <div><span className="text-[#0A0A0A]/40 text-xs uppercase">Departure</span><p className="font-600">{extracted.departureTime || "—"}</p></div>
                                <div><span className="text-[#0A0A0A]/40 text-xs uppercase">Arrival</span><p className="font-600">{extracted.arrivalTime || "—"}</p></div>
                                <div><span className="text-[#0A0A0A]/40 text-xs uppercase">Terminal</span><p className="font-600">{extracted.terminal || "—"}</p></div>
                                <div><span className="text-[#0A0A0A]/40 text-xs uppercase">Gate</span><p className="font-600">{extracted.gate || "—"}</p></div>
                                <div><span className="text-[#0A0A0A]/40 text-xs uppercase">Seat</span><p className="font-600">{extracted.seat || "—"}</p></div>
                                <div><span className="text-[#0A0A0A]/40 text-xs uppercase">Date</span><p className="font-600">{extracted.date || "—"}</p></div>
                                <div className="col-span-2"><span className="text-[#0A0A0A]/40 text-xs uppercase">Passenger</span><p className="font-600">{extracted.passengerName || "—"}</p></div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={handleSaveExtracted}
                                    className="bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-5 py-2.5 hover:bg-[#C2410C] transition-colors">
                                    Save This Pass
                                </button>
                                <button onClick={() => setExtracted(null)}
                                    className="border border-[#e5e5e5] px-4 py-2.5 text-xs hover:border-[#0A0A0A] transition-colors">
                                    Discard
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Manual form */}
            {showManualForm && canEdit && (
                <div className="px-8 py-4 border-b border-[#e5e5e5]">
                    <div className="border border-[#EA580C] bg-[#EA580C]/5 p-4 space-y-2">
                        <p className="text-xs font-700 uppercase tracking-wider text-[#EA580C] mb-2">Add Boarding Pass Manually</p>
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Airline *" value={manualForm.airline} onChange={(e) => setManualForm({ ...manualForm, airline: e.target.value })}
                                className="border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                            <input type="text" placeholder="Flight Number *" value={manualForm.flightNumber} onChange={(e) => setManualForm({ ...manualForm, flightNumber: e.target.value })}
                                className="border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                            <input type="text" placeholder="From (Departure)" value={manualForm.departure} onChange={(e) => setManualForm({ ...manualForm, departure: e.target.value })}
                                className="border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                            <input type="text" placeholder="To (Arrival)" value={manualForm.arrival} onChange={(e) => setManualForm({ ...manualForm, arrival: e.target.value })}
                                className="border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                            <input type="text" placeholder="Departure Time" value={manualForm.departureTime} onChange={(e) => setManualForm({ ...manualForm, departureTime: e.target.value })}
                                className="border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                            <input type="text" placeholder="Arrival Time" value={manualForm.arrivalTime} onChange={(e) => setManualForm({ ...manualForm, arrivalTime: e.target.value })}
                                className="border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                            <input type="text" placeholder="Terminal" value={manualForm.terminal} onChange={(e) => setManualForm({ ...manualForm, terminal: e.target.value })}
                                className="border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                            <input type="text" placeholder="Gate" value={manualForm.gate} onChange={(e) => setManualForm({ ...manualForm, gate: e.target.value })}
                                className="border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                            <input type="text" placeholder="Seat" value={manualForm.seat} onChange={(e) => setManualForm({ ...manualForm, seat: e.target.value })}
                                className="border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                            <input type="date" placeholder="Date" value={manualForm.date} onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                                className="border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                            <input type="text" placeholder="Passenger Name" value={manualForm.passengerName} onChange={(e) => setManualForm({ ...manualForm, passengerName: e.target.value })}
                                className="col-span-2 border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#0A0A0A]" />
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button onClick={handleManualAdd} disabled={!manualForm.airline || !manualForm.flightNumber}
                                className="bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-5 py-2.5 hover:bg-[#C2410C] transition-colors disabled:opacity-40">
                                Save
                            </button>
                            <button onClick={() => setShowManualForm(false)}
                                className="border border-[#e5e5e5] px-4 py-2.5 text-xs hover:border-[#0A0A0A] transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Saved Passes */}
            <div className="px-8 py-6">
                {passes.length === 0 ? (
                    <EmptyState
                        icon={<Ticket className="w-8 h-8" strokeWidth={1} />}
                        title="No Boarding Passes"
                        description="Paste boarding pass text above to extract flight info, or add manually."
                    />
                ) : (
                    <div>
                        <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A] mb-4">
                            {passes.length} PASS{passes.length > 1 ? "ES" : ""} SAVED
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {passes.map((pass: any) => (
                                <div key={pass._id} className="border border-[#e5e5e5] hover:border-[#0A0A0A] transition-colors group relative overflow-hidden">
                                    {/* Airline header stripe */}
                                    <div className="bg-[#0A0A0A] px-5 py-3 flex items-center gap-3">
                                        <Plane className="w-4 h-4 text-[#EA580C]" />
                                        <div className="flex-1">
                                            <p className="text-white font-700 text-sm uppercase">{pass.airline}</p>
                                            <p className="text-white/50 text-xs font-600">{pass.flightNumber}</p>
                                        </div>
                                        <span className="text-white/30 text-xs font-600">{pass.date}</span>
                                        {canEdit && (
                                            <button onClick={() => { deletePass({ passId: pass._id }); toast.success("Deleted"); }}
                                                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Flight route */}
                                    <div className="px-5 py-4">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="flex-1">
                                                <p className="font-display text-xl font-900 text-[#0A0A0A]">{pass.departure}</p>
                                                {pass.departureTime && <p className="text-xs text-[#0A0A0A]/40">{pass.departureTime}</p>}
                                            </div>
                                            <div className="flex items-center gap-2 px-3">
                                                <div className="w-2 h-2 rounded-full bg-[#EA580C]" />
                                                <div className="w-16 h-[1px] bg-[#e5e5e5]" />
                                                <Plane className="w-4 h-4 text-[#EA580C] -rotate-0" />
                                                <div className="w-16 h-[1px] bg-[#e5e5e5]" />
                                                <div className="w-2 h-2 rounded-full bg-[#0A0A0A]" />
                                            </div>
                                            <div className="flex-1 text-right">
                                                <p className="font-display text-xl font-900 text-[#0A0A0A]">{pass.arrival}</p>
                                                {pass.arrivalTime && <p className="text-xs text-[#0A0A0A]/40">{pass.arrivalTime}</p>}
                                            </div>
                                        </div>

                                        {/* Details grid */}
                                        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-dashed border-[#e5e5e5]">
                                            {pass.terminal && (
                                                <div>
                                                    <p className="text-[10px] text-[#0A0A0A]/30 uppercase font-600">Terminal</p>
                                                    <p className="text-sm font-700">{pass.terminal}</p>
                                                </div>
                                            )}
                                            {pass.gate && (
                                                <div>
                                                    <p className="text-[10px] text-[#0A0A0A]/30 uppercase font-600">Gate</p>
                                                    <p className="text-sm font-700">{pass.gate}</p>
                                                </div>
                                            )}
                                            {pass.seat && (
                                                <div>
                                                    <p className="text-[10px] text-[#0A0A0A]/30 uppercase font-600">Seat</p>
                                                    <p className="text-sm font-700">{pass.seat}</p>
                                                </div>
                                            )}
                                            {pass.passengerName && (
                                                <div>
                                                    <p className="text-[10px] text-[#0A0A0A]/30 uppercase font-600">Passenger</p>
                                                    <p className="text-sm font-700">{pass.passengerName}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

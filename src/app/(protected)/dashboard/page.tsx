"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppSidebar } from "@/components/layout/Sidebar";
import { EmptyState, PageLoader } from "@/components/shared/EmptyState";
import Link from "next/link";
import { Plane, MapPin, Calendar, Users, Plus, Clock, Mail, Check, X, Bell } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type TripWithRole = {
    _id: string;
    title: string;
    destination: string;
    startDate: number;
    endDate: number;
    status: "planning" | "active" | "completed";
    coverImage?: string;
    userRole: string;
    currency: string;
};

const STATUS_STYLES = {
    planning: "bg-[#0A0A0A] text-white",
    active: "bg-[#EA580C] text-white",
    completed: "bg-gray-200 text-gray-600",
};

function TripCard({ trip }: { trip: TripWithRole }) {
    const days = Math.ceil((trip.endDate - trip.startDate) / (1000 * 60 * 60 * 24)) + 1;
    return (
        <Link
            href={`/trips/${trip._id}/overview`}
            className="group block border border-[#e5e5e5] hover:border-[#0A0A0A] transition-colors bg-white cursor-pointer"
        >
            {/* Cover */}
            <div className="h-40 bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] overflow-hidden relative">
                {trip.coverImage ? (
                    <img src={trip.coverImage} alt={trip.title} className="w-full h-full object-cover opacity-80" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Plane className="w-12 h-12 text-white/10" strokeWidth={1} />
                    </div>
                )}
                {/* Status badge */}
                <div className="absolute top-3 right-3">
                    <span className={`text-xs font-700 uppercase tracking-wider px-2.5 py-1 ${STATUS_STYLES[trip.status]}`}>
                        {trip.status}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="font-display text-xl font-800 uppercase tracking-tight text-[#0A0A0A] group-hover:text-[#EA580C] transition-colors mb-1">
                    {trip.title}
                </h3>
                <div className="flex items-center gap-1.5 text-[#EA580C] mb-3">
                    <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span className="text-xs font-600 uppercase tracking-wider">{trip.destination}</span>
                </div>
                <div className="flex items-center justify-between text-[#0A0A0A]/50 text-xs">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{format(new Date(trip.startDate), "MMM d")} – {format(new Date(trip.endDate), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{days} days</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function InviteCard({ invite, onAccept, onDecline }: {
    invite: any;
    onAccept: () => void;
    onDecline: () => void;
}) {
    const [loading, setLoading] = useState<"accept" | "decline" | null>(null);

    return (
        <div className="border border-[#EA580C]/30 bg-[#EA580C]/5 p-5 flex items-center gap-4">
            {/* Inviter avatar */}
            <div className="flex-shrink-0">
                {invite.inviter?.imageUrl ? (
                    <img src={invite.inviter.imageUrl} alt={invite.inviter.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                    <div className="w-10 h-10 bg-[#EA580C] flex items-center justify-center text-white text-sm font-700 rounded-full">
                        <Mail className="w-5 h-5" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-600 text-[#0A0A0A]">
                    <span className="font-700">{invite.inviter?.name ?? "Someone"}</span> invited you to join
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="font-display text-base font-800 uppercase text-[#0A0A0A]">{invite.trip.title}</span>
                    <span className="text-[#EA580C] text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" strokeWidth={1.5} />
                        {invite.trip.destination}
                    </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs font-700 uppercase tracking-wider px-2 py-0.5 ${invite.role === "editor" ? "bg-[#0A0A0A] text-white" : "border border-[#0A0A0A] text-[#0A0A0A]"}`}>
                        {invite.role}
                    </span>
                    <span className="text-xs text-[#0A0A0A]/40">
                        Expires {format(new Date(invite.expiresAt), "MMM d, yyyy")}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={async () => {
                        setLoading("accept");
                        try {
                            await onAccept();
                        } finally {
                            setLoading(null);
                        }
                    }}
                    disabled={loading !== null}
                    className="inline-flex items-center gap-1.5 bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-4 py-2.5 hover:bg-[#C2410C] transition-colors disabled:opacity-50"
                >
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    {loading === "accept" ? "Joining..." : "Accept"}
                </button>
                <button
                    onClick={async () => {
                        setLoading("decline");
                        try {
                            await onDecline();
                        } finally {
                            setLoading(null);
                        }
                    }}
                    disabled={loading !== null}
                    className="inline-flex items-center gap-1.5 border border-[#0A0A0A]/20 text-[#0A0A0A]/60 text-xs font-700 uppercase tracking-wider px-4 py-2.5 hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Decline
                </button>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const trips = useQuery(api.trips.getMyTrips) as TripWithRole[] | undefined;
    const pendingInvites = useQuery(api.tripMembers.getMyPendingInvites);
    const acceptInvite = useMutation(api.tripMembers.acceptInvite);
    const declineInvite = useMutation(api.tripMembers.declineInvite);
    const router = useRouter();

    const handleAccept = async (token: string) => {
        try {
            const tripId = await acceptInvite({ token });
            toast.success("You've joined the trip!");
            router.push(`/trips/${tripId}/overview`);
        } catch (e: any) {
            toast.error(e.message || "Failed to accept invite");
        }
    };

    const handleDecline = async (inviteId: string) => {
        try {
            await declineInvite({ inviteId: inviteId as any });
            toast.success("Invite declined");
        } catch (e: any) {
            toast.error(e.message || "Failed to decline invite");
        }
    };

    const inviteCount = pendingInvites?.length ?? 0;

    return (
        <div className="flex min-h-screen bg-white">
            <AppSidebar inviteCount={inviteCount} />
            <main className="flex-1 ml-56">
                {/* Top bar */}
                <div className="border-b border-[#e5e5e5] px-8 py-6 flex items-center justify-between">
                    <div>
                        <p className="text-[#0A0A0A]/40 text-xs uppercase tracking-widest font-display mb-1">Dashboard</p>
                        <h1 className="font-display text-3xl font-900 uppercase tracking-tight text-[#0A0A0A]">MY TRIPS</h1>
                    </div>
                    <Link
                        href="/trips/new"
                        className="inline-flex items-center gap-2 bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-5 py-3 hover:bg-[#C2410C] transition-colors"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2} />
                        New Trip
                    </Link>
                </div>

                {/* Pending invites section */}
                {pendingInvites && pendingInvites.length > 0 && (
                    <div className="px-8 py-6 border-b border-[#e5e5e5] bg-gradient-to-r from-[#EA580C]/5 to-transparent">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-[#EA580C] flex items-center justify-center">
                                <Bell className="w-4 h-4 text-white" strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="font-display text-lg font-800 uppercase tracking-wide text-[#0A0A0A]">
                                    PENDING INVITATIONS
                                </h2>
                                <p className="text-xs text-[#0A0A0A]/40">
                                    {pendingInvites.length} invitation{pendingInvites.length !== 1 ? "s" : ""} waiting for your response
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {pendingInvites.map((invite: any) => (
                                <InviteCard
                                    key={invite._id}
                                    invite={invite}
                                    onAccept={() => handleAccept(invite.token)}
                                    onDecline={() => handleDecline(invite._id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="px-8 py-8">
                    {trips === undefined ? (
                        <PageLoader />
                    ) : trips.length === 0 && inviteCount === 0 ? (
                        <EmptyState
                            icon={<Plane className="w-8 h-8" strokeWidth={1} />}
                            title="No Trips Yet"
                            description="Create your first trip and start planning your adventure together."
                            action={
                                <Link
                                    href="/trips/new"
                                    className="inline-flex items-center gap-2 bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-6 py-3 hover:bg-[#C2410C] transition-colors"
                                >
                                    <Plus className="w-4 h-4" strokeWidth={2} />
                                    Create First Trip
                                </Link>
                            }
                        />
                    ) : trips.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-[#0A0A0A]/40 text-sm">No trips yet. Accept an invitation above or create a new trip.</p>
                        </div>
                    ) : (
                        <div>
                            {/* Stats */}
                            <div className="grid grid-cols-3 max-w-lg gap-6 mb-8">
                                {[
                                    { label: "Total Trips", value: trips.length },
                                    { label: "Active", value: trips.filter((t) => t.status === "active").length },
                                    { label: "Planning", value: trips.filter((t) => t.status === "planning").length },
                                ].map((s) => (
                                    <div key={s.label} className="border border-[#e5e5e5] p-4 text-center">
                                        <p className="font-display text-3xl font-900 text-[#0A0A0A]">{s.value}</p>
                                        <p className="text-[#0A0A0A]/40 text-xs uppercase tracking-wider mt-1">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {trips.map((trip) => (
                                    <TripCard key={trip._id} trip={trip} />
                                ))}
                                {/* New trip card */}
                                <Link
                                    href="/trips/new"
                                    className="border-2 border-dashed border-[#e5e5e5] hover:border-[#EA580C] transition-colors flex flex-col items-center justify-center min-h-[220px] gap-3 group cursor-pointer"
                                >
                                    <div className="w-12 h-12 border border-[#e5e5e5] group-hover:border-[#EA580C] flex items-center justify-center transition-colors">
                                        <Plus className="w-6 h-6 text-[#0A0A0A]/30 group-hover:text-[#EA580C] transition-colors" strokeWidth={1.5} />
                                    </div>
                                    <p className="font-display text-sm font-700 uppercase tracking-wider text-[#0A0A0A]/30 group-hover:text-[#EA580C] transition-colors">
                                        New Trip
                                    </p>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

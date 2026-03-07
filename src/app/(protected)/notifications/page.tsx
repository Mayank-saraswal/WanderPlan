"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppSidebar } from "@/components/layout/Sidebar";
import { PageLoader } from "@/components/shared/EmptyState";
import Link from "next/link";
import {
    Bell, Check, X, Mail, MapPin, CheckCheck,
    Sparkles, DollarSign, FileText, UserPlus, Users, Calendar,
    Lightbulb, ThumbsUp, Trash2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NOTIF_ICONS: Record<string, any> = {
    itinerary_updated: Sparkles,
    budget_updated: DollarSign,
    member_joined: UserPlus,
    member_removed: Users,
    trip_updated: Calendar,
    file_uploaded: FileText,
    reservation_added: Calendar,
    checklist_updated: Check,
    idea_proposed: Lightbulb,
    idea_voted: ThumbsUp,
    idea_status_changed: Lightbulb,
    expense_added: DollarSign,
    expense_deleted: Trash2,
};

const NOTIF_LABELS: Record<string, string> = {
    itinerary_updated: "Itinerary",
    budget_updated: "Budget",
    member_joined: "Members",
    member_removed: "Members",
    trip_updated: "Trip",
    file_uploaded: "Files",
    reservation_added: "Reservations",
    checklist_updated: "Checklists",
    idea_proposed: "Ideas",
    idea_voted: "Ideas",
    idea_status_changed: "Ideas",
    expense_added: "Budget",
    expense_deleted: "Budget",
};

export default function NotificationsPage() {
    const pendingInvites = useQuery(api.tripMembers.getMyPendingInvites);
    const notifications = useQuery(api.notifications.getMyNotifications, { onlyUnread: false });
    const acceptInvite = useMutation(api.tripMembers.acceptInvite);
    const declineInvite = useMutation(api.tripMembers.declineInvite);
    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);
    const router = useRouter();
    const [tab, setTab] = useState<"all" | "invites" | "updates">("all");

    const inviteCount = pendingInvites?.length ?? 0;
    const unreadCount = notifications?.filter((n: any) => !n.read).length ?? 0;

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

    const showInvites = tab === "all" || tab === "invites";
    const showUpdates = tab === "all" || tab === "updates";

    return (
        <div className="flex min-h-screen bg-white">
            <AppSidebar inviteCount={inviteCount} />
            <main className="flex-1 ml-56">
                {/* Top bar */}
                <div className="border-b border-[#e5e5e5] px-8 py-6 flex items-center justify-between">
                    <div>
                        <p className="text-[#0A0A0A]/40 text-xs uppercase tracking-widest font-display mb-1">Dashboard</p>
                        <h1 className="font-display text-3xl font-900 uppercase tracking-tight text-[#0A0A0A]">NOTIFICATIONS</h1>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => { markAllAsRead({}); toast.success("All marked as read"); }}
                            className="inline-flex items-center gap-2 border border-[#e5e5e5] text-[#0A0A0A]/60 text-xs font-700 uppercase tracking-wider px-5 py-3 hover:border-[#0A0A0A] hover:text-[#0A0A0A] transition-colors"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Mark all read
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="border-b border-[#e5e5e5] px-8 flex gap-0">
                    {([
                        { key: "all", label: "All", count: inviteCount + (notifications?.length ?? 0) },
                        { key: "invites", label: "Invites", count: inviteCount },
                        { key: "updates", label: "Updates", count: notifications?.length ?? 0 },
                    ] as const).map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-5 py-3 text-xs font-700 uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${tab === t.key
                                ? "border-[#EA580C] text-[#0A0A0A]"
                                : "border-transparent text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
                                }`}
                        >
                            {t.label}
                            {t.count > 0 && (
                                <span className={`text-[10px] font-800 w-5 h-5 flex items-center justify-center rounded-full ${tab === t.key ? "bg-[#EA580C] text-white" : "bg-[#e5e5e5] text-[#0A0A0A]/50"
                                    }`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="px-8 py-6">
                    {/* Pending Invites */}
                    {showInvites && pendingInvites && pendingInvites.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-7 h-7 bg-[#EA580C] flex items-center justify-center">
                                    <Mail className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                                </div>
                                <h2 className="font-display text-sm font-800 uppercase tracking-wider text-[#0A0A0A]">
                                    Pending Invitations ({pendingInvites.length})
                                </h2>
                            </div>
                            <div className="space-y-3">
                                {pendingInvites.map((invite: any) => (
                                    <div key={invite._id} className="border border-[#EA580C]/30 bg-[#EA580C]/5 p-5 flex items-center gap-4">
                                        <div className="flex-shrink-0">
                                            {invite.inviter?.imageUrl ? (
                                                <img src={invite.inviter.imageUrl} alt={invite.inviter.name} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 bg-[#EA580C] flex items-center justify-center text-white rounded-full">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
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
                                                <span className={`text-xs font-700 uppercase tracking-wider px-2 py-0.5 ${invite.role === "editor" ? "bg-[#EA580C] text-white" : "border border-[#0A0A0A] text-[#0A0A0A]"}`}>
                                                    {invite.role}
                                                </span>
                                                <span className="text-xs text-[#0A0A0A]/40">
                                                    Expires {format(new Date(invite.expiresAt), "MMM d, yyyy")}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleAccept(invite.token)}
                                                className="inline-flex items-center gap-1.5 bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-4 py-2.5 hover:bg-[#C2410C] transition-colors"
                                            >
                                                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleDecline(invite._id)}
                                                className="inline-flex items-center gap-1.5 border border-[#0A0A0A]/20 text-[#0A0A0A]/60 text-xs font-700 uppercase tracking-wider px-4 py-2.5 hover:border-red-500 hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notification Feed */}
                    {showUpdates && notifications && (
                        <div>
                            {showInvites && inviteCount > 0 && (
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-7 h-7 bg-[#0A0A0A] flex items-center justify-center">
                                        <Bell className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                                    </div>
                                    <h2 className="font-display text-sm font-800 uppercase tracking-wider text-[#0A0A0A]">
                                        Trip Updates ({notifications.length})
                                    </h2>
                                </div>
                            )}
                            {notifications.length === 0 ? (
                                <div className="text-center py-16">
                                    <Bell className="w-10 h-10 text-[#0A0A0A]/10 mx-auto mb-3" strokeWidth={1} />
                                    <p className="font-display text-lg font-700 uppercase text-[#0A0A0A]/20">No notifications yet</p>
                                    <p className="text-xs text-[#0A0A0A]/30 mt-1">You'll be notified when your trip collaborators make changes</p>
                                </div>
                            ) : (
                                <div className="space-y-0 border border-[#e5e5e5] divide-y divide-[#e5e5e5]">
                                    {notifications.map((n: any) => {
                                        const Icon = NOTIF_ICONS[n.type] || Bell;
                                        const label = NOTIF_LABELS[n.type] || "Update";
                                        return (
                                            <div
                                                key={n._id}
                                                className={`flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer ${!n.read ? "bg-[#EA580C]/5" : "hover:bg-[#0A0A0A]/[0.02]"
                                                    }`}
                                                onClick={() => {
                                                    if (!n.read) markAsRead({ notificationId: n._id });
                                                    if (n.tripId) router.push(`/trips/${n.tripId}/overview`);
                                                }}
                                            >
                                                {/* Icon */}
                                                <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${!n.read ? "bg-[#EA580C] text-white" : "bg-[#0A0A0A]/5 text-[#0A0A0A]/30"
                                                    }`}>
                                                    <Icon className="w-4 h-4" strokeWidth={2} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${!n.read ? "font-700 text-[#0A0A0A]" : "text-[#0A0A0A]/60"}`}>
                                                        {n.message}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {n.actor && (
                                                            <span className="flex items-center gap-1.5 text-xs text-[#0A0A0A]/40">
                                                                {n.actor.imageUrl && (
                                                                    <img src={n.actor.imageUrl} className="w-4 h-4 rounded-full" alt="" />
                                                                )}
                                                                {n.actor.name}
                                                            </span>
                                                        )}
                                                        {n.trip && (
                                                            <span className="text-xs font-600 text-[#EA580C]">
                                                                {n.trip.title}
                                                            </span>
                                                        )}
                                                        <span className={`text-[10px] font-700 uppercase tracking-wider px-1.5 py-0.5 ${!n.read ? "bg-[#EA580C]/10 text-[#EA580C]" : "bg-[#0A0A0A]/5 text-[#0A0A0A]/30"
                                                            }`}>
                                                            {label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Time + unread dot */}
                                                <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                                                    <span className="text-xs text-[#0A0A0A]/30">
                                                        {format(new Date(n.createdAt), "MMM d, h:mm a")}
                                                    </span>
                                                    {!n.read && (
                                                        <div className="w-2.5 h-2.5 bg-[#EA580C] rounded-full" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty state for invites tab */}
                    {tab === "invites" && (!pendingInvites || pendingInvites.length === 0) && (
                        <div className="text-center py-16">
                            <Mail className="w-10 h-10 text-[#0A0A0A]/10 mx-auto mb-3" strokeWidth={1} />
                            <p className="font-display text-lg font-700 uppercase text-[#0A0A0A]/20">No pending invites</p>
                            <p className="text-xs text-[#0A0A0A]/30 mt-1">Invitations from other travelers will appear here</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

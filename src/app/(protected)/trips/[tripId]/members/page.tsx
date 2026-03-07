"use client";
import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/EmptyState";
import { useTripMember } from "@/hooks/useTripMember";
import { toast } from "sonner";
import { Crown, Pencil, Eye, Trash2, MoreHorizontal, Mail, UserPlus } from "lucide-react";

const ROLE_CONFIG = {
    owner: { label: "Owner", cls: "bg-[#EA580C] text-white" },
    editor: { label: "Editor", cls: "bg-[#0A0A0A] text-white" },
    viewer: { label: "Viewer", cls: "border border-[#0A0A0A] text-[#0A0A0A]" },
};

type Props = { params: Promise<{ tripId: string }> };

export default function MembersPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const { isOwner, canEdit } = useTripMember(tripId);
    const members = useQuery(api.tripMembers.getTripMembers, { tripId });
    const pendingInvites = useQuery(api.tripMembers.getPendingInvites, { tripId });
    const inviteMember = useMutation(api.tripMembers.inviteMember);
    const removeMember = useMutation(api.tripMembers.removeMember);
    const changeMemberRole = useMutation(api.tripMembers.changeMemberRole);
    const revokeInvite = useMutation(api.tripMembers.revokeInvite);

    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"editor" | "viewer">("editor");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

    if (!members || !pendingInvites) return <PageLoader />;

    const handleInvite = async () => {
        if (!email) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }
        setInviteLoading(true);
        try {
            await inviteMember({ tripId, email, role });
            toast.success(`Invite sent to ${email}`);
            setEmail("");
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setInviteLoading(false);
        }
    };

    return (
        <div>
            <div className="border-b border-[#e5e5e5] px-8 py-5">
                <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">MEMBERS</h1>
            </div>

            {/* Invite form */}
            {canEdit && (
                <div className="px-8 py-6 border-b border-[#e5e5e5]">
                    <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A] mb-4">INVITE MEMBER</p>
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Mail className="absolute left-3 top-3 w-4 h-4 text-[#0A0A0A]/30" strokeWidth={1.5} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                className="w-full border border-[#e5e5e5] pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
                            />
                        </div>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
                            className="border border-[#e5e5e5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0A0A0A] bg-white"
                        >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                        </select>
                        <button
                            onClick={handleInvite}
                            disabled={inviteLoading || !email}
                            className="bg-[#EA580C] text-white text-xs font-700 uppercase tracking-wider px-5 py-2.5 hover:bg-[#C2410C] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            {inviteLoading ? "Sending..." : "Send Invite"}
                        </button>
                    </div>
                </div>
            )}

            {/* Members list */}
            <div className="px-8 py-4">
                <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A]/40 mb-3">
                    {members.length} member{members.length !== 1 ? "s" : ""}
                </p>
                <div className="space-y-0 border border-[#e5e5e5]">
                    {members.map((m: any) => {
                        const rc = ROLE_CONFIG[m.role as keyof typeof ROLE_CONFIG];
                        return (
                            <div key={m._id} className="flex items-center gap-4 px-4 py-3 border-b border-[#e5e5e5] last:border-0 hover:bg-gray-50 transition-colors">
                                {m.user?.imageUrl ? (
                                    <img src={m.user.imageUrl} alt={m.user.name} className="w-9 h-9 rounded-full object-cover" />
                                ) : (
                                    <div className="w-9 h-9 bg-[#0A0A0A] flex items-center justify-center text-white text-sm font-700 rounded-full">
                                        {m.user?.name?.[0]?.toUpperCase() ?? "?"}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-sm font-600 text-[#0A0A0A]">{m.user?.name ?? "Unknown"}</p>
                                    <p className="text-xs text-[#0A0A0A]/40">{m.user?.email}</p>
                                </div>
                                <span className={`text-xs font-700 uppercase tracking-wider px-2.5 py-1 ${rc.cls}`}>{rc.label}</span>
                                {isOwner && m.role !== "owner" && (
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={m.role}
                                            onChange={(e) => changeMemberRole({ tripId, userId: m.userId, role: e.target.value as "editor" | "viewer" })}
                                            className="text-xs border border-[#e5e5e5] px-2 py-1 focus:outline-none bg-white"
                                        >
                                            <option value="editor">Editor</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                        <button
                                            onClick={() => setRemoveConfirm(m.userId)}
                                            className="text-[#0A0A0A]/30 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pending invites */}
            {pendingInvites.length > 0 && (
                <div className="px-8 py-4">
                    <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A]/40 mb-3">PENDING INVITES</p>
                    <div className="border border-[#e5e5e5]">
                        {pendingInvites.map((inv: any) => (
                            <div key={inv._id} className="flex items-center gap-4 px-4 py-3 border-b border-[#e5e5e5] last:border-0">
                                <Mail className="w-4 h-4 text-[#0A0A0A]/30" />
                                <div className="flex-1">
                                    <p className="text-sm italic text-[#0A0A0A]/60">{inv.email}</p>
                                    <p className="text-xs text-[#0A0A0A]/30">
                                        Expires {new Date(inv.expiresAt).toLocaleDateString()} · {inv.role}
                                    </p>
                                </div>
                                {(isOwner || canEdit) && (
                                    <button
                                        onClick={() => { revokeInvite({ inviteId: inv._id }); toast.success("Invite revoked"); }}
                                        className="text-xs text-[#EA580C] hover:underline font-600"
                                    >
                                        Revoke
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!removeConfirm}
                onClose={() => setRemoveConfirm(null)}
                onConfirm={() => { if (removeConfirm) removeMember({ tripId, userId: removeConfirm as Id<"users"> }); toast.success("Member removed"); }}
                title="Remove Member"
                description="This person will lose access to the trip immediately."
                confirmLabel="Remove"
                isDestructive
            />
        </div>
    );
}

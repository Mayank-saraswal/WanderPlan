"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { canEdit, hasPermission, isOwner, type Permission } from "@/lib/rbac";

export function useTripMember(tripId: Id<"trips"> | undefined) {
    const role = useQuery(
        api.tripMembers.getMyRole,
        tripId ? { tripId } : "skip"
    );

    return {
        role,
        canEdit: canEdit(role),
        isOwner: isOwner(role),
        can: (permission: Permission) => hasPermission(role, permission),
    };
}

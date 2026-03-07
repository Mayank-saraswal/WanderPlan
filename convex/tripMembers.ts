import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getTripMembers = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        const members = await ctx.db
            .query("tripMembers")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .collect();

        return Promise.all(
            members.map(async (m) => {
                const user = await ctx.db.get(m.userId);
                return { ...m, user };
            })
        );
    },
});

export const getMyRole = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) return null;

        const member = await ctx.db
            .query("tripMembers")
            .withIndex("by_trip_user", (q) =>
                q.eq("tripId", args.tripId).eq("userId", user._id)
            )
            .first();
        return member?.role ?? null;
    },
});

export const inviteMember = mutation({
    args: {
        tripId: v.id("trips"),
        email: v.string(),
        role: v.union(v.literal("editor"), v.literal("viewer")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) throw new Error("User not found");

        const member = await ctx.db
            .query("tripMembers")
            .withIndex("by_trip_user", (q) =>
                q.eq("tripId", args.tripId).eq("userId", user._id)
            )
            .first();
        if (!member || member.role === "viewer") throw new Error("Forbidden");

        // Check if invite already exists
        const existing = await ctx.db
            .query("invites")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();
        if (existing && !existing.used) throw new Error("Invite already sent");

        const token = crypto.randomUUID();
        await ctx.db.insert("invites", {
            tripId: args.tripId,
            email: args.email,
            role: args.role,
            token,
            invitedBy: user._id,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            used: false,
        });
        return token;
    },
});

export const removeMember = mutation({
    args: {
        tripId: v.id("trips"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) throw new Error("User not found");

        const actingMember = await ctx.db
            .query("tripMembers")
            .withIndex("by_trip_user", (q) =>
                q.eq("tripId", args.tripId).eq("userId", user._id)
            )
            .first();
        if (!actingMember || actingMember.role !== "owner") throw new Error("Only owner can remove members");

        const target = await ctx.db
            .query("tripMembers")
            .withIndex("by_trip_user", (q) =>
                q.eq("tripId", args.tripId).eq("userId", args.userId)
            )
            .first();
        if (target) await ctx.db.delete(target._id);
    },
});

export const changeMemberRole = mutation({
    args: {
        tripId: v.id("trips"),
        userId: v.id("users"),
        role: v.union(v.literal("editor"), v.literal("viewer")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) throw new Error("User not found");

        const actingMember = await ctx.db
            .query("tripMembers")
            .withIndex("by_trip_user", (q) =>
                q.eq("tripId", args.tripId).eq("userId", user._id)
            )
            .first();
        if (!actingMember || actingMember.role !== "owner") throw new Error("Only owner can change roles");

        const target = await ctx.db
            .query("tripMembers")
            .withIndex("by_trip_user", (q) =>
                q.eq("tripId", args.tripId).eq("userId", args.userId)
            )
            .first();
        if (target) await ctx.db.patch(target._id, { role: args.role });
    },
});

export const acceptInvite = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const invite = await ctx.db
            .query("invites")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();
        if (!invite || invite.used || invite.expiresAt < Date.now())
            throw new Error("Invalid or expired invite");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) throw new Error("User not found");

        await ctx.db.insert("tripMembers", {
            tripId: invite.tripId,
            userId: user._id,
            role: invite.role,
            invitedBy: invite.invitedBy,
            joinedAt: Date.now(),
        });
        await ctx.db.patch(invite._id, { used: true });
        return invite.tripId;
    },
});

export const getPendingInvites = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        return ctx.db
            .query("invites")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .filter((q) => q.eq(q.field("used"), false))
            .collect();
    },
});

export const revokeInvite = mutation({
    args: { inviteId: v.id("invites") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.inviteId);
    },
});

export const getMyPendingInvites = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) return [];

        const invites = await ctx.db
            .query("invites")
            .withIndex("by_email", (q) => q.eq("email", user.email))
            .filter((q) => q.eq(q.field("used"), false))
            .collect();

        // Filter expired and enrich with trip + inviter info
        const now = Date.now();
        const results = [];
        for (const inv of invites) {
            if (inv.expiresAt < now) continue;
            const trip = await ctx.db.get(inv.tripId);
            const inviter = await ctx.db.get(inv.invitedBy);
            if (trip) {
                results.push({
                    ...inv,
                    trip: { title: trip.title, destination: trip.destination },
                    inviter: inviter ? { name: inviter.name, imageUrl: inviter.imageUrl } : null,
                });
            }
        }
        return results;
    },
});

export const declineInvite = mutation({
    args: { inviteId: v.id("invites") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const invite = await ctx.db.get(args.inviteId);
        if (!invite) throw new Error("Invite not found");

        // Mark as used so it can't be accepted later
        await ctx.db.patch(args.inviteId, { used: true });
    },
});

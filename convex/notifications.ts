import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Get all notifications for the current user
export const getMyNotifications = query({
    args: {
        onlyUnread: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) return [];

        let notifs;
        if (args.onlyUnread) {
            notifs = await ctx.db
                .query("notifications")
                .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
                .order("desc")
                .take(50);
        } else {
            notifs = await ctx.db
                .query("notifications")
                .withIndex("by_user", (q) => q.eq("userId", user._id))
                .order("desc")
                .take(50);
        }

        return Promise.all(
            notifs.map(async (n) => {
                const actor = await ctx.db.get(n.actorId);
                const trip = await ctx.db.get(n.tripId);
                return {
                    ...n,
                    actor: actor ? { name: actor.name, imageUrl: actor.imageUrl } : null,
                    trip: trip ? { title: trip.title, destination: trip.destination } : null,
                };
            })
        );
    },
});

// Get unread count
export const getUnreadCount = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return 0;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) return 0;

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
            .collect();
        return unread.length;
    },
});

// Mark a single notification as read
export const markAsRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.notificationId, { read: true });
    },
});

// Mark all notifications as read for current user
export const markAllAsRead = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) throw new Error("User not found");

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
            .collect();

        await Promise.all(unread.map((n) => ctx.db.patch(n._id, { read: true })));
    },
});

// Helper: Notify all trip members (except the actor)
export const notifyTripMembers = mutation({
    args: {
        tripId: v.id("trips"),
        type: v.union(
            v.literal("itinerary_updated"),
            v.literal("budget_updated"),
            v.literal("member_joined"),
            v.literal("member_removed"),
            v.literal("trip_updated"),
            v.literal("file_uploaded"),
            v.literal("reservation_added"),
            v.literal("checklist_updated"),
            v.literal("idea_proposed"),
            v.literal("idea_voted"),
            v.literal("idea_status_changed"),
            v.literal("expense_added"),
            v.literal("expense_deleted")
        ),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) return;

        const members = await ctx.db
            .query("tripMembers")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .collect();

        // Notify everyone except the user who performed the action
        await Promise.all(
            members
                .filter((m) => m.userId !== user._id)
                .map((m) =>
                    ctx.db.insert("notifications", {
                        userId: m.userId,
                        tripId: args.tripId,
                        type: args.type,
                        message: args.message,
                        actorId: user._id,
                        read: false,
                        createdAt: Date.now(),
                    })
                )
        );
    },
});

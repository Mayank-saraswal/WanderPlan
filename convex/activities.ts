import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getActivitiesByDay = query({
    args: { dayId: v.id("days") },
    handler: async (ctx, args) => {
        return ctx.db
            .query("activities")
            .withIndex("by_day", (q) => q.eq("dayId", args.dayId))
            .order("asc")
            .collect();
    },
});

export const getActivitiesByTrip = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        return ctx.db
            .query("activities")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .collect();
    },
});

// Alias for getActivitiesByTrip since packing page expects getActivities
export const getActivities = getActivitiesByTrip;

export const createActivity = mutation({
    args: {
        tripId: v.id("trips"),
        dayId: v.id("days"),
        title: v.string(),
        description: v.optional(v.string()),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        location: v.optional(v.string()),
        cost: v.optional(v.number()),
        currency: v.optional(v.string()),
        category: v.union(
            v.literal("transport"),
            v.literal("accommodation"),
            v.literal("food"),
            v.literal("activity"),
            v.literal("other")
        ),
        order: v.number(),
        aiGenerated: v.optional(v.boolean()),
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

        return ctx.db.insert("activities", { ...args, createdBy: user._id });
    },
});

export const updateActivity = mutation({
    args: {
        activityId: v.id("activities"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        location: v.optional(v.string()),
        cost: v.optional(v.number()),
        currency: v.optional(v.string()),
        category: v.optional(
            v.union(
                v.literal("transport"),
                v.literal("accommodation"),
                v.literal("food"),
                v.literal("activity"),
                v.literal("other")
            )
        ),
        order: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { activityId, ...updates } = args;
        await ctx.db.patch(activityId, updates);
    },
});

export const deleteActivity = mutation({
    args: { activityId: v.id("activities") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.activityId);
    },
});

export const reorderActivities = mutation({
    args: {
        updates: v.array(
            v.object({ id: v.id("activities"), order: v.number() })
        ),
    },
    handler: async (ctx, args) => {
        await Promise.all(
            args.updates.map(({ id, order }) => ctx.db.patch(id, { order }))
        );
    },
});

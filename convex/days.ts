import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getDays = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        return ctx.db
            .query("days")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .order("asc")
            .collect();
    },
});

export const updateDay = mutation({
    args: {
        dayId: v.id("days"),
        title: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { dayId, ...updates } = args;
        await ctx.db.patch(dayId, updates);
    },
});

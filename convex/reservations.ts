import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getReservations = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        return ctx.db.query("reservations").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
    },
});

export const createReservation = mutation({
    args: {
        tripId: v.id("trips"),
        title: v.string(),
        type: v.union(v.literal("flight"), v.literal("hotel"), v.literal("car"), v.literal("restaurant"), v.literal("activity"), v.literal("other")),
        confirmationNumber: v.optional(v.string()),
        provider: v.optional(v.string()),
        checkIn: v.number(),
        checkOut: v.optional(v.number()),
        amount: v.optional(v.number()),
        currency: v.optional(v.string()),
        notes: v.optional(v.string()),
        status: v.union(v.literal("confirmed"), v.literal("pending"), v.literal("cancelled")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const user = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).first();
        if (!user) throw new Error("User not found");
        const member = await ctx.db.query("tripMembers").withIndex("by_trip_user", (q) => q.eq("tripId", args.tripId).eq("userId", user._id)).first();
        if (!member || member.role === "viewer") throw new Error("Forbidden");
        return ctx.db.insert("reservations", { ...args, createdBy: user._id });
    },
});

export const updateReservation = mutation({
    args: {
        reservationId: v.id("reservations"),
        title: v.optional(v.string()),
        confirmationNumber: v.optional(v.string()),
        provider: v.optional(v.string()),
        checkIn: v.optional(v.number()),
        checkOut: v.optional(v.number()),
        amount: v.optional(v.number()),
        notes: v.optional(v.string()),
        status: v.optional(v.union(v.literal("confirmed"), v.literal("pending"), v.literal("cancelled"))),
    },
    handler: async (ctx, args) => {
        const { reservationId, ...updates } = args;
        await ctx.db.patch(reservationId, updates);
    },
});

export const deleteReservation = mutation({
    args: { reservationId: v.id("reservations") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.reservationId);
    },
});

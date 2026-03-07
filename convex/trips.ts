import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all trips for the current user
export const getMyTrips = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) return [];

        const memberships = await ctx.db
            .query("tripMembers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const trips = await Promise.all(
            memberships.map(async (m) => {
                const trip = await ctx.db.get(m.tripId);
                return trip ? { ...trip, userRole: m.role } : null;
            })
        );
        return trips.filter(Boolean);
    },
});

export const getTrip = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        return ctx.db.get(args.tripId);
    },
});

export const createTrip = mutation({
    args: {
        title: v.string(),
        destination: v.string(),
        description: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.number(),
        totalBudget: v.optional(v.number()),
        currency: v.string(),
        coverImage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) throw new Error("User not found");

        const tripId = await ctx.db.insert("trips", {
            ...args,
            createdBy: user._id,
            status: "planning",
            createdAt: Date.now(),
        });

        // Add creator as owner
        await ctx.db.insert("tripMembers", {
            tripId,
            userId: user._id,
            role: "owner",
            joinedAt: Date.now(),
        });

        // Auto-generate days
        const start = new Date(args.startDate);
        const end = new Date(args.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        for (let i = 0; i < days; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            await ctx.db.insert("days", {
                tripId,
                date: date.getTime(),
                dayNumber: i + 1,
                order: i,
            });
        }

        return tripId;
    },
});

export const updateTrip = mutation({
    args: {
        tripId: v.id("trips"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        destination: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        totalBudget: v.optional(v.number()),
        currency: v.optional(v.string()),
        coverImage: v.optional(v.string()),
        status: v.optional(v.union(v.literal("planning"), v.literal("active"), v.literal("completed"))),
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

        const { tripId, ...updates } = args;
        await ctx.db.patch(tripId, updates);
    },
});

export const deleteTrip = mutation({
    args: { tripId: v.id("trips") },
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
        if (!member || member.role !== "owner") throw new Error("Only the owner can delete a trip");

        // Delete all related data
        const members = await ctx.db.query("tripMembers").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
        await Promise.all(members.map((m) => ctx.db.delete(m._id)));

        const days = await ctx.db.query("days").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
        await Promise.all(days.map((d) => ctx.db.delete(d._id)));

        const activities = await ctx.db.query("activities").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
        await Promise.all(activities.map((a) => ctx.db.delete(a._id)));

        const expenses = await ctx.db.query("expenses").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
        await Promise.all(expenses.map((e) => ctx.db.delete(e._id)));

        const checklists = await ctx.db.query("checklists").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
        for (const cl of checklists) {
            const items = await ctx.db.query("checklistItems").withIndex("by_checklist", (q) => q.eq("checklistId", cl._id)).collect();
            await Promise.all(items.map((i) => ctx.db.delete(i._id)));
            await ctx.db.delete(cl._id);
        }

        const files = await ctx.db.query("files").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
        await Promise.all(files.map((f) => ctx.db.delete(f._id)));

        const reservations = await ctx.db.query("reservations").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
        await Promise.all(reservations.map((r) => ctx.db.delete(r._id)));

        const comments = await ctx.db.query("comments").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
        await Promise.all(comments.map((c) => ctx.db.delete(c._id)));

        const invites = await ctx.db.query("invites").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
        await Promise.all(invites.map((i) => ctx.db.delete(i._id)));

        await ctx.db.delete(args.tripId);
    },
});

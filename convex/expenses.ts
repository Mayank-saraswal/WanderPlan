import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getExpenses = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        const expenses = await ctx.db
            .query("expenses")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .collect();

        return Promise.all(
            expenses.map(async (e) => {
                const paidByUser = await ctx.db.get(e.paidBy);
                return { ...e, paidByUser };
            })
        );
    },
});

export const createExpense = mutation({
    args: {
        tripId: v.id("trips"),
        title: v.string(),
        amount: v.number(),
        currency: v.string(),
        category: v.union(
            v.literal("transport"),
            v.literal("accommodation"),
            v.literal("food"),
            v.literal("activity"),
            v.literal("shopping"),
            v.literal("other")
        ),
        paidBy: v.id("users"),
        splitWith: v.array(v.id("users")),
        date: v.number(),
        notes: v.optional(v.string()),
        activityId: v.optional(v.id("activities")),
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

        return ctx.db.insert("expenses", { ...args, createdBy: user._id });
    },
});

export const deleteExpense = mutation({
    args: { expenseId: v.id("expenses") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.expenseId);
    },
});

export const updateExpense = mutation({
    args: {
        expenseId: v.id("expenses"),
        title: v.optional(v.string()),
        amount: v.optional(v.number()),
        category: v.optional(
            v.union(
                v.literal("transport"),
                v.literal("accommodation"),
                v.literal("food"),
                v.literal("activity"),
                v.literal("shopping"),
                v.literal("other")
            )
        ),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { expenseId, ...updates } = args;
        await ctx.db.patch(expenseId, updates);
    },
});

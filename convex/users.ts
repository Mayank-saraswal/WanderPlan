import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getMe = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        return ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
    },
});

export const getUserById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return ctx.db.get(args.userId);
    },
});

export const createUser = mutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        imageUrl: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
        if (existing) return existing._id;

        return ctx.db.insert("users", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

export const updateUser = mutation({
    args: {
        clerkId: v.string(),
        name: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        email: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
        if (!user) return;
        const { clerkId, ...updates } = args;
        await ctx.db.patch(user._id, updates);
    },
});

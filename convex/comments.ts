import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getComments = query({
    args: { targetId: v.string() },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("comments")
            .withIndex("by_target", (q) => q.eq("targetId", args.targetId))
            .order("asc")
            .collect();
        return Promise.all(comments.map(async (c) => {
            const author = await ctx.db.get(c.authorId);
            return { ...c, author };
        }));
    },
});

export const addComment = mutation({
    args: {
        tripId: v.id("trips"),
        targetId: v.string(),
        targetType: v.union(v.literal("day"), v.literal("activity")),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const user = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).first();
        if (!user) throw new Error("User not found");
        return ctx.db.insert("comments", {
            ...args,
            authorId: user._id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const deleteComment = mutation({
    args: { commentId: v.id("comments") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        await ctx.db.delete(args.commentId);
    },
});

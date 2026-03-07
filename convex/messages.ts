import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all messages for a trip (real-time)
export const getMessages = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .order("asc")
            .collect();

        return Promise.all(
            messages.map(async (m) => {
                const author = await ctx.db.get(m.authorId);
                return {
                    ...m,
                    author: author
                        ? { name: author.name, imageUrl: author.imageUrl }
                        : null,
                };
            })
        );
    },
});

// Send a message
export const sendMessage = mutation({
    args: {
        tripId: v.id("trips"),
        content: v.string(),
        mentionDay: v.optional(v.number()),
        mentionActivity: v.optional(v.string()),
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
        if (!member) throw new Error("Not a member of this trip");

        return ctx.db.insert("messages", {
            tripId: args.tripId,
            authorId: user._id,
            content: args.content,
            mentionDay: args.mentionDay,
            mentionActivity: args.mentionActivity,
            createdAt: Date.now(),
        });
    },
});

// Delete a message
export const deleteMessage = mutation({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");
        if (message.authorId !== user._id) throw new Error("Can only delete your own messages");

        await ctx.db.delete(args.messageId);
    },
});

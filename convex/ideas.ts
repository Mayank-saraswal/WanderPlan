import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getIdeas = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        const ideas = await ctx.db
            .query("ideas")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .order("desc")
            .collect();

        return Promise.all(
            ideas.map(async (idea) => {
                const proposer = await ctx.db.get(idea.proposedBy);
                const votes = await ctx.db
                    .query("votes")
                    .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
                    .collect();
                const upVotes = votes.filter((v) => v.vote === "up").length;
                const downVotes = votes.filter((v) => v.vote === "down").length;
                return {
                    ...idea,
                    proposer,
                    upVotes,
                    downVotes,
                    score: upVotes - downVotes,
                    voters: votes.map((v) => ({ userId: v.userId, vote: v.vote })),
                };
            })
        );
    },
});

export const proposeIdea = mutation({
    args: {
        tripId: v.id("trips"),
        title: v.string(),
        description: v.optional(v.string()),
        category: v.union(
            v.literal("accommodation"),
            v.literal("restaurant"),
            v.literal("activity"),
            v.literal("transport"),
            v.literal("other")
        ),
        link: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) throw new Error("User not found");

        return ctx.db.insert("ideas", {
            ...args,
            status: "proposed",
            proposedBy: user._id,
            createdAt: Date.now(),
        });
    },
});

export const castVote = mutation({
    args: {
        ideaId: v.id("ideas"),
        vote: v.union(v.literal("up"), v.literal("down")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) throw new Error("User not found");

        // Check for existing vote
        const existing = await ctx.db
            .query("votes")
            .withIndex("by_idea_user", (q) =>
                q.eq("ideaId", args.ideaId).eq("userId", user._id)
            )
            .first();

        if (existing) {
            if (existing.vote === args.vote) {
                // Toggle off — remove vote
                await ctx.db.delete(existing._id);
            } else {
                // Change vote direction
                await ctx.db.patch(existing._id, { vote: args.vote });
            }
        } else {
            await ctx.db.insert("votes", {
                ideaId: args.ideaId,
                userId: user._id,
                vote: args.vote,
            });
        }
    },
});

export const updateIdeaStatus = mutation({
    args: {
        ideaId: v.id("ideas"),
        status: v.union(
            v.literal("proposed"),
            v.literal("accepted"),
            v.literal("rejected")
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.ideaId, { status: args.status });
    },
});

export const deleteIdea = mutation({
    args: { ideaId: v.id("ideas") },
    handler: async (ctx, args) => {
        // Delete all votes for this idea
        const votes = await ctx.db
            .query("votes")
            .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
            .collect();
        for (const vote of votes) {
            await ctx.db.delete(vote._id);
        }
        await ctx.db.delete(args.ideaId);
    },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSettlements = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        const settlements = await ctx.db
            .query("settlements")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .collect();

        // Enrich with user info
        const enriched = await Promise.all(
            settlements.map(async (s) => {
                const fromUser = await ctx.db.get(s.fromUserId);
                const toUser = await ctx.db.get(s.toUserId);
                const settledByUser = await ctx.db.get(s.settledBy);
                return {
                    ...s,
                    fromUser: fromUser ? { name: fromUser.name, imageUrl: fromUser.imageUrl } : null,
                    toUser: toUser ? { name: toUser.name, imageUrl: toUser.imageUrl } : null,
                    settledByUser: settledByUser ? { name: settledByUser.name } : null,
                };
            })
        );

        return enriched;
    },
});

export const markSettled = mutation({
    args: {
        tripId: v.id("trips"),
        fromUserId: v.id("users"),
        toUserId: v.id("users"),
        amount: v.number(),
        currency: v.string(),
        method: v.optional(v.union(
            v.literal("venmo"),
            v.literal("paypal"),
            v.literal("cash"),
            v.literal("bank"),
            v.literal("other")
        )),
        note: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) throw new Error("User not found");

        return await ctx.db.insert("settlements", {
            tripId: args.tripId,
            fromUserId: args.fromUserId,
            toUserId: args.toUserId,
            amount: args.amount,
            currency: args.currency,
            method: args.method,
            settledBy: user._id,
            settledAt: Date.now(),
            note: args.note,
        });
    },
});

export const undoSettlement = mutation({
    args: { settlementId: v.id("settlements") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        await ctx.db.delete(args.settlementId);
    },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getChecklists = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        const checklists = await ctx.db
            .query("checklists")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .collect();

        return Promise.all(
            checklists.map(async (cl) => {
                const items = await ctx.db
                    .query("checklistItems")
                    .withIndex("by_checklist", (q) => q.eq("checklistId", cl._id))
                    .order("asc")
                    .collect();
                return { ...cl, items };
            })
        );
    },
});

export const createChecklist = mutation({
    args: {
        tripId: v.id("trips"),
        title: v.string(),
        type: v.union(v.literal("packing"), v.literal("todo"), v.literal("custom")),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const user = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).first();
        if (!user) throw new Error("User not found");
        const member = await ctx.db.query("tripMembers").withIndex("by_trip_user", (q) => q.eq("tripId", args.tripId).eq("userId", user._id)).first();
        if (!member || member.role === "viewer") throw new Error("Forbidden");
        return ctx.db.insert("checklists", { ...args, createdBy: user._id });
    },
});

export const deleteChecklist = mutation({
    args: { checklistId: v.id("checklists") },
    handler: async (ctx, args) => {
        const items = await ctx.db.query("checklistItems").withIndex("by_checklist", (q) => q.eq("checklistId", args.checklistId)).collect();
        await Promise.all(items.map((i) => ctx.db.delete(i._id)));
        await ctx.db.delete(args.checklistId);
    },
});

export const addChecklistItem = mutation({
    args: {
        checklistId: v.id("checklists"),
        tripId: v.id("trips"),
        text: v.string(),
        order: v.number(),
        assignedTo: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        return ctx.db.insert("checklistItems", { ...args, completed: false });
    },
});

export const toggleChecklistItem = mutation({
    args: { itemId: v.id("checklistItems") },
    handler: async (ctx, args) => {
        const item = await ctx.db.get(args.itemId);
        if (!item) throw new Error("Item not found");
        await ctx.db.patch(args.itemId, { completed: !item.completed });
    },
});

export const deleteChecklistItem = mutation({
    args: { itemId: v.id("checklistItems") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.itemId);
    },
});

export const updateChecklistItem = mutation({
    args: {
        itemId: v.id("checklistItems"),
        text: v.optional(v.string()),
        assignedTo: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const { itemId, ...updates } = args;
        await ctx.db.patch(itemId, updates);
    },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getFiles = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        const files = await ctx.db.query("files").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
        return Promise.all(files.map(async (f) => {
            const uploader = await ctx.db.get(f.uploadedBy);
            return { ...f, uploader };
        }));
    },
});

export const generateUploadUrl = mutation({
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const saveFile = mutation({
    args: {
        tripId: v.id("trips"),
        name: v.string(),
        storageId: v.string(),
        type: v.string(),
        size: v.number(),
        category: v.union(v.literal("ticket"), v.literal("document"), v.literal("image"), v.literal("other")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const user = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).first();
        if (!user) throw new Error("User not found");

        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) throw new Error("Storage URL not found");

        return ctx.db.insert("files", {
            ...args,
            url,
            uploadedBy: user._id,
            uploadedAt: Date.now(),
        });
    },
});

export const deleteFile = mutation({
    args: { fileId: v.id("files") },
    handler: async (ctx, args) => {
        const file = await ctx.db.get(args.fileId);
        if (!file) throw new Error("File not found");
        await ctx.storage.delete(file.storageId as any);
        await ctx.db.delete(args.fileId);
    },
});

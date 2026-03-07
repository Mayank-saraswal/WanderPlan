import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        imageUrl: v.string(),
        createdAt: v.number(),
    })
        .index("by_clerkId", ["clerkId"])
        .index("by_email", ["email"]),

    trips: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        destination: v.string(),
        startDate: v.number(),
        endDate: v.number(),
        coverImage: v.optional(v.string()),
        createdBy: v.id("users"),
        totalBudget: v.optional(v.number()),
        currency: v.string(),
        status: v.union(
            v.literal("planning"),
            v.literal("active"),
            v.literal("completed")
        ),
        createdAt: v.number(),
    })
        .index("by_createdBy", ["createdBy"])
        .index("by_status", ["status"]),

    tripMembers: defineTable({
        tripId: v.id("trips"),
        userId: v.id("users"),
        role: v.union(
            v.literal("owner"),
            v.literal("editor"),
            v.literal("viewer")
        ),
        invitedBy: v.optional(v.id("users")),
        joinedAt: v.number(),
    })
        .index("by_trip", ["tripId"])
        .index("by_user", ["userId"])
        .index("by_trip_user", ["tripId", "userId"]),

    days: defineTable({
        tripId: v.id("trips"),
        date: v.number(),
        dayNumber: v.number(),
        title: v.optional(v.string()),
        notes: v.optional(v.string()),
        order: v.number(),
    })
        .index("by_trip", ["tripId"])
        .index("by_trip_date", ["tripId", "date"]),

    activities: defineTable({
        tripId: v.id("trips"),
        dayId: v.id("days"),
        title: v.string(),
        description: v.optional(v.string()),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        location: v.optional(v.string()),
        cost: v.optional(v.number()),
        currency: v.optional(v.string()),
        category: v.union(
            v.literal("transport"),
            v.literal("accommodation"),
            v.literal("food"),
            v.literal("activity"),
            v.literal("other")
        ),
        order: v.number(),
        aiGenerated: v.boolean(),
        createdBy: v.id("users"),
    })
        .index("by_day", ["dayId"])
        .index("by_trip", ["tripId"]),

    comments: defineTable({
        tripId: v.id("trips"),
        targetId: v.string(),
        targetType: v.union(v.literal("day"), v.literal("activity")),
        content: v.string(),
        authorId: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_target", ["targetId"])
        .index("by_trip", ["tripId"]),

    checklists: defineTable({
        tripId: v.id("trips"),
        title: v.string(),
        type: v.union(
            v.literal("packing"),
            v.literal("todo"),
            v.literal("custom")
        ),
        createdBy: v.id("users"),
        order: v.number(),
    }).index("by_trip", ["tripId"]),

    checklistItems: defineTable({
        checklistId: v.id("checklists"),
        tripId: v.id("trips"),
        text: v.string(),
        completed: v.boolean(),
        assignedTo: v.optional(v.id("users")),
        order: v.number(),
    }).index("by_checklist", ["checklistId"]),

    expenses: defineTable({
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
        createdBy: v.id("users"),
    })
        .index("by_trip", ["tripId"])
        .index("by_paidBy", ["paidBy"]),

    files: defineTable({
        tripId: v.id("trips"),
        name: v.string(),
        url: v.string(),
        storageId: v.string(),
        type: v.string(),
        size: v.number(),
        uploadedBy: v.id("users"),
        uploadedAt: v.number(),
        category: v.union(
            v.literal("ticket"),
            v.literal("document"),
            v.literal("image"),
            v.literal("other")
        ),
    }).index("by_trip", ["tripId"]),

    reservations: defineTable({
        tripId: v.id("trips"),
        title: v.string(),
        type: v.union(
            v.literal("flight"),
            v.literal("hotel"),
            v.literal("car"),
            v.literal("restaurant"),
            v.literal("activity"),
            v.literal("other")
        ),
        confirmationNumber: v.optional(v.string()),
        provider: v.optional(v.string()),
        checkIn: v.number(),
        checkOut: v.optional(v.number()),
        amount: v.optional(v.number()),
        currency: v.optional(v.string()),
        notes: v.optional(v.string()),
        status: v.union(
            v.literal("confirmed"),
            v.literal("pending"),
            v.literal("cancelled")
        ),
        createdBy: v.id("users"),
    }).index("by_trip", ["tripId"]),

    invites: defineTable({
        tripId: v.id("trips"),
        email: v.string(),
        role: v.union(v.literal("editor"), v.literal("viewer")),
        token: v.string(),
        invitedBy: v.id("users"),
        expiresAt: v.number(),
        used: v.boolean(),
    })
        .index("by_token", ["token"])
        .index("by_trip", ["tripId"]),
});

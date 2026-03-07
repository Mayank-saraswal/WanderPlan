import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Get packing reminders for a trip
export const getPackingReminders = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        const reminders = await ctx.db
            .query("packingReminders")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .order("desc")
            .collect();

        return Promise.all(
            reminders.map(async (r) => {
                const generatedByUser = await ctx.db.get(r.generatedBy);
                return { ...r, generatedByUser };
            })
        );
    },
});

// Save packing reminders
export const savePackingReminders = mutation({
    args: {
        tripId: v.id("trips"),
        weatherSummary: v.string(),
        temperature: v.optional(v.string()),
        items: v.array(v.object({
            text: v.string(),
            category: v.string(),
            tip: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) throw new Error("User not found");

        return ctx.db.insert("packingReminders", {
            ...args,
            generatedBy: user._id,
            generatedAt: Date.now(),
        });
    },
});

// Delete a packing reminder
export const deletePackingReminder = mutation({
    args: { reminderId: v.id("packingReminders") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.reminderId);
    },
});

// AI: Generate smart packing suggestions
export const generatePackingSuggestions = action({
    args: {
        destination: v.string(),
        startDate: v.number(),
        endDate: v.number(),
        tripTitle: v.string(),
        itinerarySummary: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const startDate = new Date(args.startDate);
        const endDate = new Date(args.endDate);
        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const monthName = startDate.toLocaleString("en", { month: "long" });

        const prompt = `
You are a smart travel packing assistant for WanderPlan. Generate highly personalized packing suggestions for this trip based on the specific itinerary:

- Destination: ${args.destination}
- Trip: "${args.tripTitle}"
- Duration: ${durationDays} days
- Dates: ${startDate.toDateString()} to ${endDate.toDateString()}
- Season/Month: ${monthName}
- Planned Activities: ${args.itinerarySummary}

1. Analyze the destination and expected weather during ${monthName}.
2. Deeply analyze the "Planned Activities". Identify what specific gear, clothing, or items are necessary for those specific things (e.g. if they are hiking, suggest hiking boots; if they are going to a fancy restaurant, suggest formal wear).
3. If no specific activities are planned, rely on the destination and season.
4. Make the suggestions specific and fun.

Return a JSON object:
{
  "weatherSummary": "Brief 1-2 sentence weather summary for the destination during this period",
  "temperature": "Expected temperature range, e.g. '28-35°C'",
  "items": [
    {
      "text": "Item name",
      "category": "one of: essentials, clothing, toiletries, electronics, documents, health, fun",
      "tip": "A fun, short tip about why this item is important (e.g. 'Don't forget sunscreen — it'll be 35°C in Bali!')"
    }
  ]
}

Generate 15-25 items. Make tips engaging, specific to the destination, and weather-aware. Include destination-specific items.
Return ONLY the JSON object, no markdown or explanations.
`;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.8,
                max_tokens: 1500,
            });

            const content = response.choices[0].message.content || "{}";
            const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            return JSON.parse(cleaned);
        } catch (error) {
            console.error("Packing suggestion error:", error);
            throw new Error("Failed to generate packing suggestions");
        }
    },
});

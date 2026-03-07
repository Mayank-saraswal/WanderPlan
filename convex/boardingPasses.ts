import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Get all boarding passes for a trip
export const getBoardingPasses = query({
    args: { tripId: v.id("trips") },
    handler: async (ctx, args) => {
        const passes = await ctx.db
            .query("boardingPasses")
            .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
            .collect();

        return Promise.all(
            passes.map(async (p) => {
                const addedByUser = await ctx.db.get(p.addedBy);
                return { ...p, addedByUser };
            })
        );
    },
});

// Add a boarding pass manually
export const addBoardingPass = mutation({
    args: {
        tripId: v.id("trips"),
        airline: v.string(),
        flightNumber: v.string(),
        departure: v.string(),
        arrival: v.string(),
        departureTime: v.optional(v.string()),
        arrivalTime: v.optional(v.string()),
        terminal: v.optional(v.string()),
        gate: v.optional(v.string()),
        seat: v.optional(v.string()),
        date: v.string(),
        passengerName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user) throw new Error("User not found");

        return ctx.db.insert("boardingPasses", {
            ...args,
            addedBy: user._id,
            createdAt: Date.now(),
        });
    },
});

// Delete a boarding pass
export const deleteBoardingPass = mutation({
    args: { passId: v.id("boardingPasses") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.passId);
    },
});

// AI: Extract boarding pass info from raw text
export const extractBoardingPass = action({
    args: {
        rawText: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const prompt = `
You are a boarding pass parser. Extract structured flight information from the following text which may be from a boarding pass, booking confirmation email, or ticket.

Text:
"""
${args.rawText}
"""

Return a JSON object with these fields (use empty string if not found):
{
  "airline": "airline name",
  "flightNumber": "flight number (e.g. AI302, EK512)",
  "departure": "departure city/airport",
  "arrival": "arrival city/airport",
  "departureTime": "departure time",
  "arrivalTime": "arrival time",
  "terminal": "terminal number",
  "gate": "gate number",
  "seat": "seat number",
  "date": "flight date (YYYY-MM-DD format)",
  "passengerName": "passenger name"
}

Return ONLY the JSON object, no markdown or explanations.
`;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1,
                max_tokens: 500,
            });

            const content = response.choices[0].message.content || "{}";
            // Clean any markdown fencing
            const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            return JSON.parse(cleaned);
        } catch (error) {
            console.error("Boarding pass extraction error:", error);
            throw new Error("Failed to extract boarding pass information");
        }
    },
});

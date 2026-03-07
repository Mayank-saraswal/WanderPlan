import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { type, context } = await req.json();

    const prompts: Record<string, string> = {
        itinerary: `You are an expert travel planner. Generate a detailed ${context.days}-day itinerary for ${context.destination} for ${context.travelers || 2} travelers. Return a JSON object with key "days" — an array of objects, each with: dayNumber (number), date (string), title (string), activities (array of objects with: title, description, startTime (HH:MM), endTime (HH:MM), location, cost (number), currency, category (transport|accommodation|food|activity|other)). Be specific, realistic, and practical.`,

        packing: `Generate a smart packing checklist for a trip to ${context.destination} in ${context.season || "any season"} for ${context.days || 7} days. Return a JSON object with key "items" — an array of objects with: text (string), category (string, e.g. Clothing, Toiletries, Documents, Electronics, etc.). Include ${context.travelers || 1} traveler(s) worth of items. Be comprehensive and practical.`,

        budget: `Estimate a realistic budget breakdown for ${context.travelers || 2} travelers visiting ${context.destination} for ${context.days || 7} days. Return a JSON object with key "breakdown" — an array of objects with: category (string), estimated (number, in ${context.currency || "USD"}), notes (string). Include categories: Accommodation, Food & Dining, Transport, Activities & Sightseeing, Shopping, Miscellaneous. Also include "total" (number) and "currency" (string) at the top level.`,

        description: `Write a compelling, exciting 2-3 sentence trip description for a trip to ${context.destination} titled "${context.title}". Return a JSON object with key "description" (string). Make it vivid and inspiring.`,
    };

    if (!prompts[type]) {
        return Response.json({ error: "Invalid suggestion type" }, { status: 400 });
    }

    try {
        const res = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompts[type] }],
            response_format: { type: "json_object" },
            temperature: 0.8,
        });

        return Response.json(JSON.parse(res.choices[0].message.content!));
    } catch (error) {
        console.error("OpenAI error:", error);
        return Response.json({ error: "AI suggestion failed" }, { status: 500 });
    }
}

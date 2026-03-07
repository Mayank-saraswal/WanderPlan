import { v } from "convex/values";
import { action } from "./_generated/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const explainBudget = action({
    args: {
        tripName: v.string(),
        currency: v.string(),
        totalSpent: v.number(),
        expenses: v.array(v.object({
            title: v.string(),
            amount: v.number(),
            paidBy: v.string(),
            splitWith: v.array(v.string()),
        })),
        settlements: v.array(v.object({
            from: v.string(),
            to: v.string(),
            amount: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const prompt = `
You are WanderPlan's friendly AI travel accountant. Explain the trip budget and out-of-pocket settlements for the trip "${args.tripName}".

Here is the data:
- Total Trip Spend: ${args.currency} ${args.totalSpent.toFixed(2)}
- Expenses Logged: ${args.expenses.length}

Here are the minimized settlements (who owes who to settle all debts):
${args.settlements.length === 0 ? "Everyone is perfectly even! No payments are needed." : args.settlements.map(s => `- ${s.from} MUST PAY ${args.currency} ${s.amount.toFixed(2)} to ${s.to}`).join("\n")}

### Task
Write a short, engaging, and friendly explanation of the budget situation. 
1. Acknowledge the total spent.
2. If there are payments needed, explicitly tell who needs to pay whom and how much, so there is absolute zero confusion. Use bold text for names and amounts.
3. Keep it brief and conversational (like a text message from a hyper-organized friend). Do not include raw JSON or lists of individual expenses unless they are heavily skewed.
4. Format using markdown.
`;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 400,
            });

            return response.choices[0].message.content || "Sorry, I couldn't generate an explanation right now.";
        } catch (error) {
            console.error("OpenAI Error:", error);
            throw new Error("Failed to generate AI explanation");
        }
    },
});

import { Webhook } from "svix";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { headers } from "next/headers";

export async function POST(req: Request) {
    const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!CLERK_WEBHOOK_SECRET) {
        throw new Error("CLERK_WEBHOOK_SECRET is not set");
    }
    if (!CONVEX_URL) {
        throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
    }

    const convex = new ConvexHttpClient(CONVEX_URL);
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return Response.json({ error: "Missing svix headers" }, { status: 400 });
    }

    const body = await req.text();
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);

    let payload: any;
    try {
        payload = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch {
        return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (payload.type === "user.created") {
        await convex.mutation(api.users.createUser, {
            clerkId: payload.data.id,
            email: payload.data.email_addresses[0]?.email_address ?? "",
            name: `${payload.data.first_name ?? ""} ${payload.data.last_name ?? ""}`.trim(),
            imageUrl: payload.data.image_url ?? "",
        });
    }

    if (payload.type === "user.updated") {
        await convex.mutation(api.users.updateUser, {
            clerkId: payload.data.id,
            name: `${payload.data.first_name ?? ""} ${payload.data.last_name ?? ""}`.trim(),
            imageUrl: payload.data.image_url ?? "",
            email: payload.data.email_addresses[0]?.email_address ?? "",
        });
    }

    return Response.json({ success: true });
}

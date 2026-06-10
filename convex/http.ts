import stripe from '../src/lib/stripe';
import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { api } from "./_generated/api"
import { Webhook } from "svix"
import type { WebhookEvent } from "@clerk/nextjs/server";

const http = httpRouter()

const clerkWebhookHandler = httpAction(async (_ctx, req) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    if (!webhookSecret) {
        console.error("CLERK_WEBHOOK_SECRET is not set")
        throw new Error("Webhook secret not configured")
    }

    const svix_id = req.headers.get("svix-id");
    const svix_signature = req.headers.get("svix-signature");
    const svix_timestamp = req.headers.get("svix-timestamp");

    if (!svix_id || !svix_signature || !svix_timestamp) {
        console.error("Missing Svix headers")
        return new Response("Missing headers", { status: 400 })
    }

    const payload = await req.json()
    const body = JSON.stringify(payload)

    const wh = new Webhook(webhookSecret)
    let event: WebhookEvent;

    try {
        event = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature
        }) as WebhookEvent
    } catch (e) {
        console.error(e)
        return new Response("Invalid signature", { status: 400 })
    }

    // todo: create user and save it in db
    const eventType = event.type;

    if (eventType === "user.created" || eventType === "user.updated") {
        const { id, email_addresses, first_name, last_name } = event.data;

        const email = email_addresses?.[0]?.email_address || "";
        const name = `${first_name || ""} ${last_name || ""}`.trim();

        const ID = id;

        try {

            const customer = await stripe.customers.create({
                email,
                name,
                metadata: {
                    clerkId: ID,
                },
            });

            await _ctx.runMutation(api.users.createUser, {
                email,
                name,
                clerkId: ID,
                stripeCustomerId: customer.id,
            });
        } catch (e) {
            console.error(e);
        }
    }

    return new Response("OK", { status: 200 })
})

http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: clerkWebhookHandler
})


export default http



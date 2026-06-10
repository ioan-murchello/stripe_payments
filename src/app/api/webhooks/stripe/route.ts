import Stripe from "stripe";
import stripe from "@/lib/stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";


const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
	const body = await req.text();
	const signature = req.headers.get("Stripe-Signature") as string;

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
	} catch (err: any) {
		return new Response("Webhook signature verification failed.", { status: 400 });
	}

	try {
		switch (event.type) {
			case "checkout.session.completed":
				await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
				break;
			case "customer.subscription.created":
			case "customer.subscription.updated":
				await handleSubscriptionUpsert(event.data.object as Stripe.Subscription, event.type);
				break;
			case "customer.subscription.deleted":
				await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
				break;
			default:
				console.log(`Unhandled event type: ${event.type}`);
				break;
		}
	} catch (error: any) {
		console.error(`Error processing webhook (${event.type}):`, error);
		return new Response("Error processing webhook", { status: 400 });
	}

	return new Response(null, { status: 200 });
}

// async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
// 	const stripeCustomerId = session.customer as string;

// 	const courseId = session.metadata?.courseId;
// 	const userId = session.metadata?.userId;

// 	if (!stripeCustomerId) {
// 		throw new Error("Missing stripeCustomerId");
// 	}

// 	if (courseId) {
// 		const user = await convex.query(api.users.getUserByStripeCustomerId, { stripeCustomerId });

// 		if (!user) {
// 			throw new Error("User not found");
// 		}

// 		await convex.mutation(api.purchases.createPurchase, {
// 			userId: user._id,
// 			courseId: courseId as Id<"courses">,
// 			amount: session.amount_total as number,
// 			stripePurchaseId: session.id,
// 		});

// 		return;
// 	}

// 	if (session.mode === "subscription" || userId) {
// 		const stripeSubscriptionId = session.subscription as string;

// 		if (!userId || !stripeSubscriptionId) {
// 			throw new Error("Missing userId or stripeSubscriptionId for subscription");
// 		}

// 		const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any;

// 		const interval = subscription.items?.data?.[0]?.plan?.interval || "month";
// 		const planType = interval === "year" ? "year" : "month";

// 		const startTimestamp = subscription.billing_cycle_anchor || subscription.created || Math.floor(Date.now() / 1000);

// 		const secondsInPeriod = planType === "year" ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60;
// 		const endTimestamp = startTimestamp + secondsInPeriod;

// 		await convex.mutation(api.subscriptions.upsertSubscription, {
// 			userId: userId as any,
// 			stripeSubscriptionId: subscription.id,
// 			status: subscription.status,
// 			planType: planType,
// 			currentPeriodStart: startTimestamp,  
// 			currentPeriodEnd: endTimestamp,     
// 			cancelAtPeriodEnd: !!subscription.cancel_at_period_end,  
// 		});

// 		return;
// 	}

// }

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
	const stripeCustomerId = session.customer as string;
	const courseId = session.metadata?.courseId;
	const userId = session.metadata?.userId;

	if (!stripeCustomerId) {
		throw new Error("Missing stripeCustomerId");
	}

	if (courseId) {
		const user = await convex.query(api.users.getUserByStripeCustomerId, { stripeCustomerId });
		if (!user) throw new Error("User not found");

		await convex.mutation(api.purchases.createPurchase, {
			userId: user._id,
			courseId: courseId as Id<"courses">,
			amount: session.amount_total as number,
			stripePurchaseId: session.id,
		});
		return;
	}

	if (session.mode === "subscription" || userId) {
		const stripeSubscriptionId = session.subscription as string;

		if (!userId || !stripeSubscriptionId) {
			throw new Error("Missing userId or stripeSubscriptionId for subscription");
		}

		const subscription = (await stripe.subscriptions.retrieve(stripeSubscriptionId)) as Stripe.Subscription;

		const interval = subscription.items?.data?.[0]?.plan?.interval || "month";
		const planType = interval === "year" ? "year" : "month";

		const item = subscription.items?.data?.[0];		

		await convex.mutation(api.subscriptions.upsertSubscription, {
			userId: userId as any,
			stripeSubscriptionId: subscription.id,
			status: subscription.status,
			planType: planType, 
			currentPeriodStart: item.current_period_start,
			currentPeriodEnd: item.current_period_end,
			cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
		});

		return;
	}
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription, eventType: string) {

	const userId = subscription.metadata?.userId;

	if (subscription.status !== "active") {
		return;
	}

	let finalUserId = userId;
	if (!finalUserId) {
		const stripeCustomerId = subscription.customer as string;
		const user = await convex.query(api.users.getUserByStripeCustomerId, { stripeCustomerId });
		if (user) finalUserId = user._id;
	}

	if (!finalUserId) {
		console.error(`❌ could not find user for ${subscription.id}`);
		return;
	}

	const hasYearlyItem = subscription.items.data.some(item => item.plan.interval === "year");
	const currentPlanType = hasYearlyItem ? "year" : "month";

	try {
		const currentPeriodStart = (subscription as any).current_period_start;
		const currentPeriodEnd = (subscription as any).current_period_end;

		await convex.mutation(api.subscriptions.upsertSubscription, {
			userId: finalUserId as any,
			stripeSubscriptionId: subscription.id,
			status: subscription.status,
			planType: currentPlanType,
			currentPeriodStart,
			currentPeriodEnd,
			cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
		});

		//todo: send email
		// resend.emails.send({
		// 	from: 'onboarding@resend.dev',
		// 	to: 'user@resend.dev',
		// 	subject: 'Welcome to our online academy',
		// 	template: {
		// 		id: 'skill-development', // Replace with your actual template ID
		// 		variables: {
		// 			first_name: 'John',
		// 			company_name: 'Resend',
		// 			platform_url: 'https://resend.com',
		// 		},
		// 	},
		// }); 
	} catch (error) {
		console.error(`❌ Error upsertSubscription in webhook for ${eventType}:`, error);
	}
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	try {
		await convex.mutation(api.subscriptions.removeSubscription, {
			stripeSubscriptionId: subscription.id,
		});
		console.log(`Successfully deleted subscription ${subscription.id}`);
	} catch (error) {
		console.error(`Error deleting subscription ${subscription.id}:`, error);
	}
}

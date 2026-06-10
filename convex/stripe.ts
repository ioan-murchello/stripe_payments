import { toast } from 'sonner';

import { v } from "convex/values";
import { action } from "./_generated/server";
import stripe from "../src/lib/stripe";
import rateLimit from "../src/lib/ratelimit";
import { api } from "./_generated/api";

//! we using 'action' for third party API calls that don't need to be cached, and 'query' for fetching data that we want to cache and revalidate. In this case, creating a checkout session is an action that doesn't need caching, while fetching the user's subscription is a query that benefits from caching.
export const createCheckoutSession = action({
    args: {
        courseId: v.id("courses"),
    },
    handler: async (ctx, { courseId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const user = await ctx.runQuery(api.users.getUserByClerkId, { clerkId: identity.subject });
        if (!user) {
            throw new Error("User not found");
        }

        const rateLimitKey = `checkout-session-${user._id}`;
        const { success, reset } = await rateLimit.limit(rateLimitKey);

        if (!success) {
            toast.error("Rate limit exceeded. Please try again later.");
            throw new Error("Rate limit exceeded. Please try again later.");
        }

        const course = await ctx.runQuery(api.courses.getCourseById, { courseId });
        if (!course) {
            throw new Error("Course not found");
        }

        const session = await stripe.checkout.sessions.create({
            customer: user.stripeCustomerId,
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: course.title,
                            description: course.description,
                            images: [course.imageUrl],
                        },
                        unit_amount: Math.round(course.price * 100), // convert to cents
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId: user._id.toString(),
                courseId: courseId.toString(),
            },
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/courses/${courseId}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/courses`,
        });

        return { checkoutUrl: session.url };


    }
})
//! we using 'action' for third party API calls that don't need to be cached, and 'query' for fetching data that we want to cache and revalidate. In this case, creating a checkout session is an action that doesn't need caching, while fetching the user's subscription is a query that benefits from caching.
export const createProPlanCheckoutSession = action({
    args: {
        planId: v.union(v.literal("month"), v.literal("year")),
    },
    handler: async (ctx, { planId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        console.log(planId, 'planId')

        const user = await ctx.runQuery(api.users.getUserByClerkId, { clerkId: identity.subject });
        if (!user) {
            throw new Error("User not found");
        }

        const rateLimitKey = `pro-checkout-session-${user._id}`;
        const { success, reset } = await rateLimit.limit(rateLimitKey);

        if (!success) {
            toast.error("Rate limit exceeded. Please try again later.");
            throw new Error("Rate limit exceeded. Please try again later.");
        }

        const priceId = planId === "month" ? process.env.STRIPE_MONTHLY_PRO_PRICE_ID : process.env.STRIPE_YEARLY_PRO_PRICE_ID;
 
        const session = await stripe.checkout.sessions.create({
            customer: user.stripeCustomerId,
            payment_method_types: ["card"],
            mode: "subscription",
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],

            metadata: {
                userId: user._id.toString(),
                planType: planId,
            },

            subscription_data: {
                metadata: {
                    userId: user._id.toString(),
                    planType: planId,
                },
            },
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pro/success?session_id={CHECKOUT_SESSION_ID}&year=${planId === "year"}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pro`,
        });
        return { checkoutUrl: session.url };
    }
})
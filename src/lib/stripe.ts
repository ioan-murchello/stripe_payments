import stripe from "stripe";

const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export default stripeClient;
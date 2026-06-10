import { internalMutation, mutation, query } from "./_generated/server"
import { ConvexError, v } from "convex/values";

export const createUser = mutation({
    args: {
        email: v.string(),
        name: v.string(),
        clerkId: v.string(),
        stripeCustomerId: v.string()
    },
    handler: async (ctx, { email, name, clerkId, stripeCustomerId }) => {

        const existingUser = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", clerkId)).unique();
        if (existingUser) {
            return existingUser._id;
        }

        const userId = await ctx.db.insert("users", { email, name, clerkId, stripeCustomerId }); // ? return userId by default
        return userId;
    }
})

export const getUserByClerkId = query({
    args: {
        clerkId: v.string(),
    },
    handler: async (ctx, { clerkId }) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", clerkId))
            .unique();
        return user || null;
    }
})

export const getUserByStripeCustomerId = query({
    args: {
        stripeCustomerId: v.string(),
    },
    handler: async (ctx, { stripeCustomerId }) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_stripeCustomerId", q => q.eq("stripeCustomerId", stripeCustomerId))
            .unique();
        return user || null;
    }
})

export const getUserAccess = query({
    args: {
        userId: v.id("users"),
        courseId: v.id("courses"),
    },
    handler: async (ctx, { userId, courseId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized");
        }
        const user = await ctx.db.get("users", userId);
        if (!user) {
            throw new ConvexError("User not found");
        }

        if (user.currentSubscriptionId) {
            const subscription = await ctx.db.get("subscriptions", user.currentSubscriptionId);
            if (subscription && subscription.status === "active") {
                return { hasAccess: true, accessType: 'subscription' };
            }
        }

        const purchase = await ctx.db.query("purchases").withIndex("by_userId_and_courseId", q =>
            q.eq("userId", userId).eq("courseId", courseId)
        ).unique();
        if (purchase) {
            return { hasAccess: true, accessType: 'purchase' };
        }

        return { hasAccess: false, accessType: null };
    }
})

export const deleteUser = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

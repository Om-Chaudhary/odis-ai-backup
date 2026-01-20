/**
 * Subscription Feature Gating Middleware
 *
 * Provides tRPC middleware to enforce subscription tier requirements.
 * Use this to restrict features to specific subscription tiers.
 *
 * Works with Clerk organizations - looks up clinic by orgId.
 */

import { TRPCError } from "@trpc/server";
import { middleware } from "~/server/api/trpc";
import {
  tierHasFeature,
  type TierFeature,
  type SubscriptionTier,
  TIER_DISPLAY_INFO,
  getMinimumTierForFeature,
} from "@odis-ai/shared/constants";

/**
 * Feature gating middleware factory
 *
 * Creates middleware that enforces subscription tier requirements.
 * Throws FORBIDDEN error if clinic's subscription tier doesn't include the feature.
 *
 * @param feature - The feature to check (e.g., 'batch_scheduling', 'outbound_calls')
 * @returns Middleware that enforces the feature requirement
 *
 * @example
 * ```typescript
 * export const outboundRouter = createTRPCRouter({
 *   scheduleBatch: orgProtectedProcedure
 *     .use(requireFeature('batch_scheduling'))
 *     .input(batchSchema)
 *     .mutation(async ({ ctx, input }) => {
 *       // Only accessible with professional+ tier
 *     }),
 * });
 * ```
 */
export function requireFeature(feature: TierFeature) {
  return middleware(async ({ ctx, next }) => {
    // Super admins bypass subscription checks
    const { data: adminCheck } = ctx.userId
      ? await ctx.supabase
          .from("users")
          .select("role")
          .eq("id", ctx.userId)
          .single()
      : { data: null };

    if (adminCheck?.role === "admin") {
      return next({
        ctx: {
          ...ctx,
          subscriptionTier: "enterprise" as SubscriptionTier,
        },
      });
    }

    // Organization membership required for feature gating
    if (!ctx.orgId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Organization membership required to access this feature",
      });
    }

    // Get clinic's subscription tier
    const { data: clinic, error } = await ctx.supabase
      .from("clinics")
      .select("subscription_tier, subscription_status")
      .eq("clerk_org_id", ctx.orgId)
      .single();

    if (error || !clinic) {
      console.error("[Feature Gate] Error fetching clinic:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to verify subscription status",
      });
    }

    const tier = (clinic.subscription_tier ?? "none") as SubscriptionTier;
    const status = clinic.subscription_status ?? "none";

    // Check if subscription is active
    const isActive = status === "active" || status === "trialing";

    if (!isActive) {
      const minimumTier = getMinimumTierForFeature(feature);
      const tierInfo = TIER_DISPLAY_INFO[minimumTier];

      throw new TRPCError({
        code: "PAYMENT_REQUIRED",
        message: `Active subscription required. This feature needs the ${tierInfo.name} plan ($${tierInfo.priceMonthly}/mo).`,
      });
    }

    // Check if tier includes the feature
    if (!tierHasFeature(tier, feature)) {
      const minimumTier = getMinimumTierForFeature(feature);
      const tierInfo = TIER_DISPLAY_INFO[minimumTier];

      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This feature requires the ${tierInfo.name} plan ($${tierInfo.priceMonthly}/mo) or higher.`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        subscriptionTier: tier,
      },
    });
  });
}

/**
 * Minimum tier middleware factory
 *
 * Creates middleware that enforces a minimum subscription tier.
 * More flexible than requireFeature - checks tier level instead of specific features.
 *
 * @param minimumTier - The minimum tier required (e.g., 'professional')
 * @returns Middleware that enforces the tier requirement
 *
 * @example
 * ```typescript
 * export const analyticsRouter = createTRPCRouter({
 *   getAdvanced: orgProtectedProcedure
 *     .use(requireMinimumTier('enterprise'))
 *     .query(async ({ ctx }) => {
 *       // Only enterprise tier can access
 *     }),
 * });
 * ```
 */
export function requireMinimumTier(minimumTier: SubscriptionTier) {
  return middleware(async ({ ctx, next }) => {
    // Super admins bypass subscription checks
    const { data: adminCheck } = ctx.userId
      ? await ctx.supabase
          .from("users")
          .select("role")
          .eq("id", ctx.userId)
          .single()
      : { data: null };

    if (adminCheck?.role === "admin") {
      return next({
        ctx: {
          ...ctx,
          subscriptionTier: "enterprise" as SubscriptionTier,
        },
      });
    }

    // Organization membership required for tier gating
    if (!ctx.orgId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Organization membership required to access this feature",
      });
    }

    // Get clinic's subscription tier
    const { data: clinic, error } = await ctx.supabase
      .from("clinics")
      .select("subscription_tier, subscription_status")
      .eq("clerk_org_id", ctx.orgId)
      .single();

    if (error || !clinic) {
      console.error("[Tier Gate] Error fetching clinic:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to verify subscription status",
      });
    }

    const tier = (clinic.subscription_tier ?? "none") as SubscriptionTier;
    const status = clinic.subscription_status ?? "none";

    // Check if subscription is active
    const isActive = status === "active" || status === "trialing";

    if (!isActive) {
      const tierInfo = TIER_DISPLAY_INFO[minimumTier];

      throw new TRPCError({
        code: "PAYMENT_REQUIRED",
        message: `Active subscription required. This feature needs the ${tierInfo.name} plan ($${tierInfo.priceMonthly}/mo) or higher.`,
      });
    }

    // Check tier hierarchy
    const TIER_HIERARCHY = ["none", "inbound", "professional", "enterprise"];
    const currentTierIndex = TIER_HIERARCHY.indexOf(tier);
    const requiredTierIndex = TIER_HIERARCHY.indexOf(minimumTier);

    if (currentTierIndex < requiredTierIndex) {
      const tierInfo = TIER_DISPLAY_INFO[minimumTier];

      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This feature requires the ${tierInfo.name} plan ($${tierInfo.priceMonthly}/mo) or higher.`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        subscriptionTier: tier,
      },
    });
  });
}

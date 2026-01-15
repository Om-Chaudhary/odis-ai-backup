/**
 * Subscription Router
 *
 * tRPC procedures for subscription management.
 * Provides subscription plan info and current clinic subscription status.
 * Note: Checkout now uses Stripe Payment Links (no API key required).
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  TIER_DISPLAY_INFO,
  STRIPE_PRICE_IDS,
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
} from "@odis-ai/shared/constants";
import { getClinicByUserId } from "@odis-ai/domain/clinics";

export const subscriptionRouter = createTRPCRouter({
  /**
   * Get available subscription plans
   */
  getPlans: publicProcedure.query(() => {
    const plans = Object.entries(TIER_DISPLAY_INFO)
      .filter(([tier]) => tier !== SUBSCRIPTION_TIERS.NONE)
      .map(([tier, info]) => ({
        tier: tier as SubscriptionTier,
        name: info.name,
        description: info.description,
        priceMonthly: info.priceMonthly,
        badge: info.badge,
        priceId: STRIPE_PRICE_IDS[tier as keyof typeof STRIPE_PRICE_IDS],
      }));

    return plans;
  }),

  /**
   * Get current clinic subscription status
   */
  getStatus: protectedProcedure
    .input(
      z
        .object({
          clinicId: z.string().uuid().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      let clinicId = input?.clinicId;

      // If no clinic ID provided, get user's primary clinic
      if (!clinicId) {
        const clinic = await getClinicByUserId(user.id, supabase);
        if (!clinic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No clinic found for user",
          });
        }
        clinicId = clinic.id;
      }

      // Get clinic subscription info
      const { data: clinic, error } = await supabase
        .from("clinics")
        .select(
          "id, name, stripe_customer_id, stripe_subscription_id, subscription_tier, subscription_status, current_period_start, current_period_end",
        )
        .eq("id", clinicId)
        .single();

      if (error || !clinic) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Clinic not found",
        });
      }

      const tier = (clinic.subscription_tier ?? "none") as SubscriptionTier;
      const tierInfo = TIER_DISPLAY_INFO[tier];

      return {
        clinicId: clinic.id,
        clinicName: clinic.name,
        tier,
        tierName: tierInfo?.name ?? "No Plan",
        tierDescription: tierInfo?.description ?? "",
        priceMonthly: tierInfo?.priceMonthly ?? 0,
        status: clinic.subscription_status ?? "none",
        hasActiveSubscription:
          clinic.subscription_status === "active" ||
          clinic.subscription_status === "trialing",
        stripeCustomerId: clinic.stripe_customer_id,
        stripeSubscriptionId: clinic.stripe_subscription_id,
        currentPeriodStart: clinic.current_period_start,
        currentPeriodEnd: clinic.current_period_end,
      };
    }),
});

// Export types
export type SubscriptionRouter = typeof subscriptionRouter;

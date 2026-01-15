/**
 * Subscription Router
 *
 * tRPC procedures for subscription management.
 * Handles checkout sessions, portal sessions, and subscription status.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { subscriptionTierSchema } from "@odis-ai/shared/validators";
import {
  TIER_DISPLAY_INFO,
  STRIPE_PRICE_IDS,
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
} from "@odis-ai/shared/constants";
import {
  createCheckoutSession,
  createPortalSession,
} from "@odis-ai/integrations/stripe";
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

  /**
   * Create a Stripe Checkout session for a new subscription
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        tier: subscriptionTierSchema.exclude(["none"]),
        clinicId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;
      const { tier } = input;

      let clinicId = input.clinicId;

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

      // Get clinic details
      const { data: clinic, error } = await supabase
        .from("clinics")
        .select("id, name, stripe_customer_id")
        .eq("id", clinicId)
        .single();

      if (error || !clinic) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Clinic not found",
        });
      }

      // Get user email
      const email = user.email ?? "";
      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email is required for checkout",
        });
      }

      // Determine URLs based on environment
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      // Get clinic slug for redirect URLs
      const { data: clinicSlug } = await supabase
        .from("clinics")
        .select("slug")
        .eq("id", clinicId)
        .single();

      const slug = clinicSlug?.slug ?? "";
      const successUrl = `${baseUrl}/dashboard/${slug}/billing`;
      const cancelUrl = `${baseUrl}/dashboard/${slug}/billing`;

      // Create checkout session
      const session = await createCheckoutSession({
        clinicId,
        clinicName: clinic.name,
        email,
        tier,
        successUrl,
        cancelUrl,
        stripeCustomerId: clinic.stripe_customer_id,
      });

      return {
        sessionId: session.sessionId,
        sessionUrl: session.sessionUrl,
      };
    }),

  /**
   * Create a Stripe Customer Portal session
   */
  createPortalSession: protectedProcedure
    .input(
      z
        .object({
          clinicId: z.string().uuid().optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
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

      // Get clinic's Stripe customer ID
      const { data: clinic, error } = await supabase
        .from("clinics")
        .select("id, slug, stripe_customer_id")
        .eq("id", clinicId)
        .single();

      if (error || !clinic) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Clinic not found",
        });
      }

      if (!clinic.stripe_customer_id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No billing account found. Please subscribe first.",
        });
      }

      // Determine return URL
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const returnUrl = `${baseUrl}/dashboard/${clinic.slug}/billing`;

      // Create portal session
      const session = await createPortalSession({
        stripeCustomerId: clinic.stripe_customer_id,
        returnUrl,
      });

      return {
        url: session.url,
      };
    }),
});

// Export types
export type SubscriptionRouter = typeof subscriptionRouter;

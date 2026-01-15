/**
 * Zod schemas for subscription-related validation
 */
import { z } from "zod";

/**
 * Subscription tier enum schema
 */
export const subscriptionTierSchema = z.enum([
  "none",
  "inbound",
  "professional",
  "enterprise",
]);

export type SubscriptionTierInput = z.infer<typeof subscriptionTierSchema>;

/**
 * Subscription status enum schema
 */
export const subscriptionStatusSchema = z.enum([
  "none",
  "active",
  "past_due",
  "canceled",
  "trialing",
  "incomplete",
]);

export type SubscriptionStatusInput = z.infer<typeof subscriptionStatusSchema>;

/**
 * Schema for creating a checkout session
 */
export const createCheckoutSessionSchema = z.object({
  tier: subscriptionTierSchema.exclude(["none"]),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>;

/**
 * Schema for clinic subscription data
 */
export const clinicSubscriptionSchema = z.object({
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  subscriptionTier: subscriptionTierSchema,
  subscriptionStatus: subscriptionStatusSchema,
  currentPeriodStart: z.coerce.date().nullable(),
  currentPeriodEnd: z.coerce.date().nullable(),
});

export type ClinicSubscriptionData = z.infer<typeof clinicSubscriptionSchema>;

/**
 * Schema for Stripe webhook event metadata
 */
export const stripeWebhookMetadataSchema = z.object({
  clinicId: z.string().uuid(),
});

export type StripeWebhookMetadata = z.infer<typeof stripeWebhookMetadataSchema>;

/**
 * Schema for subscription update from webhook
 */
export const subscriptionWebhookUpdateSchema = z.object({
  stripeCustomerId: z.string(),
  stripeSubscriptionId: z.string(),
  tier: subscriptionTierSchema,
  status: subscriptionStatusSchema,
  currentPeriodStart: z.coerce.date(),
  currentPeriodEnd: z.coerce.date(),
});

export type SubscriptionWebhookUpdate = z.infer<
  typeof subscriptionWebhookUpdateSchema
>;

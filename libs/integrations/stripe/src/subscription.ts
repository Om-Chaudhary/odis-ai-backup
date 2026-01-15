/**
 * Stripe subscription helpers
 */
import { getStripeClient, type Stripe } from "./client";
import {
  SUBSCRIPTION_TIERS,
  STRIPE_PRICE_IDS,
  type SubscriptionTier,
} from "@odis-ai/shared/constants";
import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.api.child("stripe-subscription");

/**
 * Get subscription tier from a Stripe price ID
 */
export function getTierFromPriceId(priceId: string): SubscriptionTier {
  for (const [tier, id] of Object.entries(STRIPE_PRICE_IDS)) {
    if (id === priceId) {
      return tier as SubscriptionTier;
    }
  }
  logger.warn("Unknown price ID, defaulting to none", { priceId });
  return SUBSCRIPTION_TIERS.NONE;
}

/**
 * Get subscription tier from a Stripe subscription object
 */
export function getTierFromSubscription(
  subscription: Stripe.Subscription,
): SubscriptionTier {
  const item = subscription.items.data[0];
  if (!item?.price?.id) {
    return SUBSCRIPTION_TIERS.NONE;
  }
  return getTierFromPriceId(item.price.id);
}

/**
 * Map Stripe subscription status to our status
 */
export function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status,
): string {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "trialing":
      return "trialing";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    case "unpaid":
      return "past_due";
    case "paused":
      return "canceled";
    default:
      return "none";
  }
}

/**
 * Retrieve a subscription by ID
 */
export async function getSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  options?: { immediately?: boolean },
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();

  logger.info("Canceling subscription", {
    subscriptionId,
    immediately: options?.immediately,
  });

  if (options?.immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }

  // Cancel at period end (default)
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Update subscription to a new tier
 */
export async function updateSubscriptionTier(
  subscriptionId: string,
  newTier: Exclude<SubscriptionTier, "none">,
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const currentItem = subscription.items.data[0];
  if (!currentItem) {
    throw new Error("Subscription has no items");
  }

  const newPriceId = STRIPE_PRICE_IDS[newTier];
  if (!newPriceId) {
    throw new Error(`No price ID configured for tier: ${newTier}`);
  }

  logger.info("Updating subscription tier", {
    subscriptionId,
    oldPriceId: currentItem.price.id,
    newPriceId,
    newTier,
  });

  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: currentItem.id,
        price: newPriceId,
      },
    ],
    proration_behavior: "create_prorations",
  });
}

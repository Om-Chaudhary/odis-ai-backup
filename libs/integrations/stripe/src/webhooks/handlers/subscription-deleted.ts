/**
 * Handle customer.subscription.deleted webhook event
 *
 * This fires when a subscription is canceled/deleted.
 * We reset the clinic to no subscription.
 */
import type { Stripe } from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import {
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_TIERS,
} from "@odis-ai/shared/constants";

const logger = loggers.webhook.child("stripe-subscription-deleted");

export async function handleSubscriptionDeleted(
  event: Stripe.CustomerSubscriptionDeletedEvent,
  supabase: SupabaseClient,
): Promise<void> {
  const subscription = event.data.object;

  const clinicId = subscription.metadata?.clinicId;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  logger.info("Processing subscription deletion", {
    subscriptionId: subscription.id,
    clinicId,
    customerId,
  });

  // Update clinic to remove subscription
  const updateData = {
    stripe_subscription_id: null,
    subscription_tier: SUBSCRIPTION_TIERS.NONE,
    subscription_status: SUBSCRIPTION_STATUSES.CANCELED,
    current_period_start: null,
    current_period_end: null,
  };

  // Try by clinicId first
  if (clinicId) {
    const { error } = await supabase
      .from("clinics")
      .update(updateData)
      .eq("id", clinicId);

    if (error) {
      logger.logError("Failed to update clinic by ID", error);
      throw error;
    }

    logger.info("Clinic subscription canceled by ID", { clinicId });
    return;
  }

  // Otherwise, find by stripe_subscription_id
  const { error, count } = await supabase
    .from("clinics")
    .update(updateData)
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    logger.logError("Failed to update clinic by subscription ID", error);
    throw error;
  }

  if (count === 0) {
    logger.warn("No clinic found for subscription", {
      subscriptionId: subscription.id,
    });
  } else {
    logger.info("Clinic subscription canceled", {
      subscriptionId: subscription.id,
    });
  }
}

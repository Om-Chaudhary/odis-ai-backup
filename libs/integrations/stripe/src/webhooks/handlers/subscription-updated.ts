/**
 * Handle customer.subscription.created and customer.subscription.updated webhook events
 *
 * This fires when a subscription is created or updated (plan change, payment method update, etc.)
 */
import type { Stripe } from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import { getTierFromSubscription, mapStripeStatus } from "../../subscription";

const logger = loggers.webhook.child("stripe-subscription-updated");

// Extended subscription type with period fields that may be present
interface SubscriptionWithPeriod extends Stripe.Subscription {
  current_period_start?: number;
  current_period_end?: number;
}

export async function handleSubscriptionUpdated(
  event:
    | Stripe.CustomerSubscriptionUpdatedEvent
    | Stripe.CustomerSubscriptionCreatedEvent,
  supabase: SupabaseClient,
): Promise<void> {
  const subscription = event.data.object as SubscriptionWithPeriod;

  const clinicId = subscription.metadata?.clinicId;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  logger.info("Processing subscription update", {
    subscriptionId: subscription.id,
    clinicId,
    customerId,
    status: subscription.status,
  });

  // If we have clinicId in metadata, use that
  if (clinicId) {
    const tier = getTierFromSubscription(subscription);
    const status = mapStripeStatus(subscription.status);

    const { error } = await supabase
      .from("clinics")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_tier: tier,
        subscription_status: status,
        current_period_start: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : null,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      })
      .eq("id", clinicId);

    if (error) {
      logger.logError("Failed to update clinic by ID", error);
      throw error;
    }

    logger.info("Clinic subscription updated by ID", {
      clinicId,
      tier,
      status,
    });
    return;
  }

  // Otherwise, find clinic by stripe_customer_id
  if (customerId) {
    const tier = getTierFromSubscription(subscription);
    const status = mapStripeStatus(subscription.status);

    const { error, count } = await supabase
      .from("clinics")
      .update({
        stripe_subscription_id: subscription.id,
        subscription_tier: tier,
        subscription_status: status,
        current_period_start: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : null,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      })
      .eq("stripe_customer_id", customerId);

    if (error) {
      logger.logError("Failed to update clinic by customer ID", error);
      throw error;
    }

    if (count === 0) {
      logger.warn("No clinic found for customer ID", {
        customerId,
        subscriptionId: subscription.id,
      });
    } else {
      logger.info("Clinic subscription updated by customer ID", {
        customerId,
        tier,
        status,
      });
    }
  }
}

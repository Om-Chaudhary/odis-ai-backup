/**
 * Handle checkout.session.completed webhook event
 *
 * This fires when a customer completes a checkout session.
 * We use this to link the Stripe customer to the clinic and activate the subscription.
 */
import type { Stripe } from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import { getTierFromPriceId, mapStripeStatus } from "../../subscription";
import { getStripeClient } from "../../client";

const logger = loggers.webhook.child("stripe-checkout-completed");

export async function handleCheckoutCompleted(
  event: Stripe.CheckoutSessionCompletedEvent,
  supabase: SupabaseClient,
): Promise<void> {
  const session = event.data.object;

  // Only process subscription checkouts
  if (session.mode !== "subscription") {
    logger.info("Ignoring non-subscription checkout", {
      sessionId: session.id,
      mode: session.mode,
    });
    return;
  }

  // Prefer clerk_org_id, fall back to legacy clinicId
  const clerkOrgId = session.metadata?.clerk_org_id;
  const clinicId = session.metadata?.clinicId;

  if (!clerkOrgId && !clinicId) {
    logger.warn("Checkout session missing clinic identifier metadata", {
      sessionId: session.id,
    });
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!customerId || !subscriptionId) {
    logger.warn("Missing customer or subscription ID", {
      sessionId: session.id,
      customerId,
      subscriptionId,
    });
    return;
  }

  logger.info("Processing checkout completion", {
    sessionId: session.id,
    clerkOrgId,
    clinicId,
    customerId,
    subscriptionId,
  });

  // Fetch full subscription details
  const stripe = getStripeClient();
  const subscription = (await stripe.subscriptions.retrieve(
    subscriptionId,
  )) as unknown as {
    id: string;
    status: Stripe.Subscription.Status;
    items: { data: Array<{ price?: { id?: string } }> };
    current_period_start?: number;
    current_period_end?: number;
  };

  // Get tier from subscription
  const priceId = subscription.items.data[0]?.price?.id;
  const tier = priceId ? getTierFromPriceId(priceId) : "professional";
  const status = mapStripeStatus(subscription.status);

  // Update clinic with subscription info
  // Prefer clerk_org_id (Clerk integration), fall back to legacy clinicId (UUID)
  const updateData = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    subscription_tier: tier,
    subscription_status: status,
    current_period_start: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : null,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
  };

  let query = supabase.from("clinics").update(updateData);

  if (clerkOrgId) {
    query = query.eq("clerk_org_id", clerkOrgId);
    logger.info("Using clerk_org_id for clinic lookup", { clerkOrgId });
  } else if (clinicId) {
    query = query.eq("id", clinicId);
    logger.info("Using legacy clinicId for clinic lookup", { clinicId });
  }

  const { error } = await query;

  if (error) {
    logger.logError("Failed to update clinic subscription", error);
    throw error;
  }

  logger.info("Clinic subscription activated", {
    clerkOrgId,
    clinicId,
    customerId,
    subscriptionId,
    tier,
    status,
  });
}

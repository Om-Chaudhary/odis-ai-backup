/**
 * Handle invoice.payment_failed webhook event
 *
 * This fires when a payment fails.
 * We mark the subscription as past_due.
 */
import type { Stripe } from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import { SUBSCRIPTION_STATUSES } from "@odis-ai/shared/constants";

const logger = loggers.webhook.child("stripe-invoice-payment-failed");

export async function handleInvoicePaymentFailed(
  event: Stripe.InvoicePaymentFailedEvent,
  supabase: SupabaseClient,
): Promise<void> {
  const invoice = event.data.object;

  // Get subscription from the invoice - it can be a string ID, expanded object, or null
  const invoiceSubscription = (
    invoice as unknown as { subscription?: string | { id: string } | null }
  ).subscription;

  // Only process subscription invoices
  if (!invoiceSubscription) {
    logger.info("Ignoring non-subscription invoice", {
      invoiceId: invoice.id,
    });
    return;
  }

  const subscriptionId =
    typeof invoiceSubscription === "string"
      ? invoiceSubscription
      : invoiceSubscription.id;

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  logger.info("Processing failed invoice payment", {
    invoiceId: invoice.id,
    subscriptionId,
    customerId,
    attemptCount: invoice.attempt_count,
  });

  // Update subscription status to past_due
  const { error, count } = await supabase
    .from("clinics")
    .update({
      subscription_status: SUBSCRIPTION_STATUSES.PAST_DUE,
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    logger.logError("Failed to update clinic subscription status", error);
    throw error;
  }

  if (count === 0) {
    logger.warn("No clinic found for subscription", { subscriptionId });
  } else {
    logger.info("Clinic subscription marked as past_due", {
      subscriptionId,
      attemptCount: invoice.attempt_count,
    });
  }
}

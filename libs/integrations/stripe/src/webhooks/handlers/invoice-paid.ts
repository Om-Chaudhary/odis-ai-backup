/**
 * Handle invoice.paid webhook event
 *
 * This fires when an invoice is paid successfully.
 * We ensure the subscription status is active.
 */
import type { Stripe } from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import { SUBSCRIPTION_STATUSES } from "@odis-ai/shared/constants";

const logger = loggers.webhook.child("stripe-invoice-paid");

export async function handleInvoicePaid(
  event: Stripe.InvoicePaidEvent,
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

  logger.info("Processing paid invoice", {
    invoiceId: invoice.id,
    subscriptionId,
    customerId,
    amountPaid: invoice.amount_paid,
  });

  // Update subscription status to active
  const { error, count } = await supabase
    .from("clinics")
    .update({
      subscription_status: SUBSCRIPTION_STATUSES.ACTIVE,
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    logger.logError("Failed to update clinic subscription status", error);
    throw error;
  }

  if (count === 0) {
    logger.warn("No clinic found for subscription", { subscriptionId });
  } else {
    logger.info("Clinic subscription marked as active", { subscriptionId });
  }
}

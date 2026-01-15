/**
 * Stripe webhook handling
 */
import type { Stripe } from "stripe";
import { getStripeClient } from "../client";
import { loggers } from "@odis-ai/shared/logger";
import { handleCheckoutCompleted } from "./handlers/checkout-completed";
import { handleSubscriptionUpdated } from "./handlers/subscription-updated";
import { handleSubscriptionDeleted } from "./handlers/subscription-deleted";
import { handleInvoicePaid } from "./handlers/invoice-paid";
import { handleInvoicePaymentFailed } from "./handlers/invoice-payment-failed";
import type { SupabaseClient } from "@supabase/supabase-js";

const logger = loggers.webhook.child("stripe");

/**
 * Supported Stripe webhook events
 */
export const SUPPORTED_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
] as const;

export type SupportedStripeEvent = (typeof SUPPORTED_EVENTS)[number];

/**
 * Verify Stripe webhook signature and parse event
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string,
): Stripe.Event {
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Handle a verified Stripe webhook event
 */
export async function handleStripeWebhook(
  event: Stripe.Event,
  supabase: SupabaseClient,
): Promise<{ success: boolean; message?: string }> {
  logger.info("Processing Stripe webhook", {
    eventId: event.id,
    eventType: event.type,
  });

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event, supabase);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event as Stripe.CustomerSubscriptionUpdatedEvent,
          supabase,
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event, supabase);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event, supabase);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event, supabase);
        break;

      default:
        logger.info("Ignoring unhandled event type", {
          eventType: event.type,
        });
    }

    logger.info("Webhook processed successfully", {
      eventId: event.id,
      eventType: event.type,
    });

    return { success: true };
  } catch (error) {
    logger.logError("Webhook handler failed", error as Error);
    throw error;
  }
}

/**
 * Stripe Customer Portal helpers
 */
import { getStripeClient } from "./client";
import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.api.child("stripe-portal");

export interface CreatePortalSessionParams {
  /** Stripe customer ID */
  stripeCustomerId: string;
  /** URL to return to after portal session */
  returnUrl: string;
}

export interface PortalSessionResult {
  /** Portal session URL */
  url: string;
}

/**
 * Create a Stripe Customer Portal session
 * Allows customers to manage their subscription, update payment methods, and view invoices
 */
export async function createPortalSession(
  params: CreatePortalSessionParams,
): Promise<PortalSessionResult> {
  const stripe = getStripeClient();
  const { stripeCustomerId, returnUrl } = params;

  logger.info("Creating portal session", {
    stripeCustomerId,
    returnUrl,
  });

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  logger.info("Created portal session", {
    stripeCustomerId,
    sessionUrl: session.url,
  });

  return {
    url: session.url,
  };
}

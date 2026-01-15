/**
 * Stripe Checkout session helpers
 */
import { getStripeClient } from "./client";
import {
  STRIPE_PRICE_IDS,
  type SubscriptionTier,
} from "@odis-ai/shared/constants";
import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.api.child("stripe-checkout");

export interface CreateCheckoutSessionParams {
  /** Clinic ID to associate with the subscription */
  clinicId: string;
  /** Clinic name for Stripe customer */
  clinicName: string;
  /** Email for the Stripe customer */
  email: string;
  /** Subscription tier to purchase */
  tier: Exclude<SubscriptionTier, "none">;
  /** URL to redirect to on success */
  successUrl: string;
  /** URL to redirect to on cancel */
  cancelUrl: string;
  /** Existing Stripe customer ID if available */
  stripeCustomerId?: string | null;
}

export interface CheckoutSessionResult {
  sessionId: string;
  sessionUrl: string;
}

/**
 * Create a Stripe Checkout session for a new subscription
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams,
): Promise<CheckoutSessionResult> {
  const stripe = getStripeClient();
  const {
    clinicId,
    clinicName,
    email,
    tier,
    successUrl,
    cancelUrl,
    stripeCustomerId,
  } = params;

  const priceId = STRIPE_PRICE_IDS[tier];
  if (!priceId) {
    throw new Error(`No price ID configured for tier: ${tier}`);
  }

  logger.info("Creating checkout session", {
    clinicId,
    tier,
    priceId,
    hasExistingCustomer: !!stripeCustomerId,
  });

  // Create or retrieve customer
  let customerId = stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      name: clinicName,
      metadata: {
        clinicId,
      },
    });
    customerId = customer.id;
    logger.info("Created new Stripe customer", {
      customerId,
      clinicId,
    });
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        clinicId,
        tier,
      },
    },
    metadata: {
      clinicId,
      tier,
    },
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session URL");
  }

  logger.info("Created checkout session", {
    sessionId: session.id,
    clinicId,
    tier,
  });

  return {
    sessionId: session.id,
    sessionUrl: session.url,
  };
}

/**
 * Retrieve a checkout session by ID
 */
export async function getCheckoutSession(sessionId: string) {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription", "customer"],
  });
}

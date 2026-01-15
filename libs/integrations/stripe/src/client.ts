/**
 * Stripe client configuration and initialization
 */
import Stripe from "stripe";

// Singleton Stripe client instance
let stripeClient: Stripe | null = null;

/**
 * Get or create the Stripe client instance
 */
export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return stripeClient;
}

/**
 * Reset the Stripe client (useful for testing)
 */
export function resetStripeClient(): void {
  stripeClient = null;
}

export { Stripe };

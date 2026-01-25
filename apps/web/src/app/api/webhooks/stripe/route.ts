/**
 * Stripe Webhook Route
 *
 * Next.js API route handler for Stripe webhook events.
 * Handles subscription lifecycle events to keep clinic subscription
 * status in sync with Stripe.
 *
 * Supported Events:
 * - checkout.session.completed: New subscription created via checkout
 * - customer.subscription.created: Subscription created
 * - customer.subscription.updated: Plan change, payment update, etc.
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.paid: Payment successful
 * - invoice.payment_failed: Payment failed
 *
 * @see https://stripe.com/docs/webhooks
 */

import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { loggers } from "@odis-ai/shared/logger";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import {
  verifyWebhookSignature,
  handleStripeWebhook,
  SUPPORTED_EVENTS,
} from "@odis-ai/integrations/stripe";

const logger = loggers.webhook.child("stripe-route");

/**
 * Handle incoming webhook from Stripe
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    logger.info("Stripe webhook received", {
      timestamp: new Date().toISOString(),
      contentLength: body.length,
      hasSignature: !!signature,
    });

    // Verify webhook secret is configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    // Verify signature
    if (!signature) {
      logger.warn("Missing stripe-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event;
    try {
      event = verifyWebhookSignature(body, signature, webhookSecret);
    } catch (err) {
      logger.warn("Invalid webhook signature", {
        error: (err as Error).message,
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    logger.info("Webhook signature verified", {
      eventId: event.id,
      eventType: event.type,
    });

    // Create service client (bypasses RLS for webhook processing)
    const supabase = await createServiceClient();

    // Process the webhook
    const result = await handleStripeWebhook(event, supabase);

    return NextResponse.json(result);
  } catch (error) {
    logger.logError("Stripe webhook processing failed", error as Error);

    // Sentry Capture
    Sentry.withScope((scope) => {
      scope.setTag("webhook_type", "stripe");
      Sentry.captureException(error);
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Stripe webhook endpoint is active",
    supportedEvents: SUPPORTED_EVENTS,
  });
}

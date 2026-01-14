# Stripe Subscription Billing - Technical Design Document

Version 1.0 | January 14, 2026

| Field            | Value                     |
| ---------------- | ------------------------- |
| Document Version | 1.0                       |
| Date             | January 14, 2026          |
| Author           | Engineering Team          |
| Status           | Draft - Awaiting Approval |
| Related Docs     | [PRD.md](./PRD.md)        |

---

## 1. Executive Summary

This document provides the technical implementation details for Stripe subscription billing in ODIS AI. It covers database schema, service architecture, integration patterns, webhook handling, and testing strategy.

**Key Technical Decisions:**

- Clinic-level billing (1 Stripe customer per clinic)
- Repository pattern for testability
- Event-driven usage tracking
- Webhook-based subscription lifecycle management
- Service client for webhook handlers (bypasses RLS)

---

## 2. Architecture Overview

### 2.1 System Components

```
┌──────────────────────────────────────────────────────────┐
│                  Frontend Layer                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Next.js App Router Pages                          │  │
│  │  - /pricing (plan selection)                       │  │
│  │  - /dashboard/billing (usage dashboard)            │  │
│  │  - /api/checkout (Stripe Checkout redirect)        │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│                   API Layer                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │  tRPC Routers                                       │  │
│  │  - billing/subscription (CRUD)                      │  │
│  │  - billing/usage (query usage)                      │  │
│  │  - billing/plans (list plans)                       │  │
│  │                                                      │  │
│  │  Server Actions                                     │  │
│  │  - createCheckoutSession()                          │  │
│  │  - cancelSubscription()                             │  │
│  │                                                      │  │
│  │  API Routes                                         │  │
│  │  - /api/webhooks/stripe (webhook handler)           │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│               Domain Services Layer                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  libs/domain/billing/data-access/                   │  │
│  │  - SubscriptionService.ts                           │  │
│  │  - UsageTrackingService.ts                          │  │
│  │  - PlanEnforcementService.ts                        │  │
│  │  - BillingAnalyticsService.ts                       │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│             Data Access Layer                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  libs/data-access/repository-impl/                  │  │
│  │  - SubscriptionRepository.ts                        │  │
│  │  - UsageRepository.ts                               │  │
│  │  - PaymentRepository.ts                             │  │
│  │                                                      │  │
│  │  Repository Interfaces:                             │  │
│  │  - ISubscriptionRepository                          │  │
│  │  - IUsageRepository                                 │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│              Integration Layer                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  libs/integrations/stripe/                          │  │
│  │  - client.ts (Stripe SDK wrapper)                   │  │
│  │  - webhooks/handlers/ (event handlers)              │  │
│  │  - services/ (customer, subscription, usage)        │  │
│  │  - schemas/ (Zod validation)                        │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│               External Services                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Stripe API                                         │  │
│  │  - Customers, Subscriptions, Invoices               │  │
│  │  - Checkout Sessions, Products, Prices              │  │
│  │  - Webhooks, Meters (future)                        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Data Model

**Core Entities:**

- `stripe_customers` - 1:1 with `clinics`
- `subscription_plans` - Product catalog
- `clinic_subscriptions` - Active subscriptions
- `subscription_usage` - Aggregated usage per period
- `usage_events` - Detailed audit trail
- `payment_history` - Invoice records

**Relationships:**

```
clinics (1) ──→ (1) stripe_customers
                      │
                      ├──→ (1) clinic_subscriptions
                      │         │
                      │         ├──→ (1) subscription_plans
                      │         │
                      │         └──→ (N) subscription_usage (per period)
                      │                   │
                      │                   └──→ (N) usage_events
                      │
                      └──→ (N) payment_history
```

---

## 3. Database Schema

### 3.1 Tables

```sql
-- =====================================================
-- STRIPE INTEGRATION TABLES
-- =====================================================

-- 1. Stripe Customer mapping (clinic = Stripe customer)
CREATE TABLE stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,  -- cus_xxx from Stripe
  email text,
  name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_clinic_customer UNIQUE(clinic_id)
);

-- 2. Subscription plans (mirrors Stripe Products/Prices)
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id text UNIQUE NOT NULL,   -- prod_xxx
  stripe_price_id text UNIQUE NOT NULL,     -- price_xxx

  -- Plan metadata
  name text NOT NULL,                        -- "Starter", "Professional", etc.
  slug text UNIQUE NOT NULL,                 -- "starter", "professional"
  description text,

  -- Usage limits (NULL = unlimited)
  monthly_outbound_calls integer,
  monthly_inbound_calls integer,
  monthly_soap_notes integer,
  monthly_discharge_summaries integer,
  monthly_case_ingestions integer,

  -- Features (JSON array)
  features jsonb DEFAULT '[]'::jsonb,       -- ["analytics", "priority_support"]

  -- Pricing
  price_cents integer NOT NULL,             -- $299.00 = 29900
  currency text DEFAULT 'usd',
  billing_interval text DEFAULT 'month',    -- 'month' | 'year'
  trial_days integer DEFAULT 0,             -- 14 for trial plan

  -- Status
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Clinic subscriptions
CREATE TABLE clinic_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  stripe_customer_id uuid NOT NULL REFERENCES stripe_customers(id),
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),

  -- Stripe subscription data
  stripe_subscription_id text UNIQUE NOT NULL,  -- sub_xxx
  stripe_price_id text NOT NULL,

  -- Status enum
  status text NOT NULL DEFAULT 'trialing',
  -- 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'

  -- Trial period
  trial_start timestamptz,
  trial_end timestamptz,

  -- Current billing period
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,

  -- Cancellation
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  cancellation_reason text,

  -- Metadata (JSON for extensibility)
  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_clinic_subscription UNIQUE(clinic_id)
);

-- 4. Usage tracking (aggregated per billing period)
CREATE TABLE subscription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES clinic_subscriptions(id),

  -- Billing period
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,

  -- Usage counters
  outbound_calls_count integer DEFAULT 0,
  inbound_calls_count integer DEFAULT 0,
  soap_notes_count integer DEFAULT 0,
  discharge_summaries_count integer DEFAULT 0,
  case_ingestions_count integer DEFAULT 0,

  -- Cost tracking (VAPI costs in cents)
  total_call_cost_cents integer DEFAULT 0,

  -- Finalization
  is_finalized boolean DEFAULT false,
  finalized_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_clinic_period UNIQUE(clinic_id, period_start)
);

-- 5. Usage events (detailed audit trail)
CREATE TABLE usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  subscription_id uuid REFERENCES clinic_subscriptions(id),
  user_id uuid REFERENCES auth.users(id),

  -- Event type
  event_type text NOT NULL,
  -- 'outbound_call' | 'inbound_call' | 'soap_note' | 'discharge_summary' | 'case_ingestion'

  -- Reference to actual entity
  entity_id uuid,                           -- ID of the call/note/case
  entity_type text,                         -- 'scheduled_discharge_call', etc.

  -- Cost (for calls)
  cost_cents integer DEFAULT 0,

  -- Billing period this belongs to
  billing_period_start timestamptz NOT NULL,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now()
);

-- 6. Payment history
CREATE TABLE payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  subscription_id uuid REFERENCES clinic_subscriptions(id),
  stripe_customer_id uuid REFERENCES stripe_customers(id),

  -- Stripe invoice data
  stripe_invoice_id text UNIQUE,            -- in_xxx
  stripe_payment_intent_id text,            -- pi_xxx
  stripe_charge_id text,                    -- ch_xxx

  -- Amount
  amount_cents integer NOT NULL,
  currency text DEFAULT 'usd',

  -- Status enum
  status text NOT NULL,
  -- 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'

  -- Dates
  invoice_date timestamptz,
  due_date timestamptz,
  paid_at timestamptz,

  -- Invoice URLs
  invoice_pdf_url text,
  hosted_invoice_url text,

  -- Period this invoice covers
  period_start timestamptz,
  period_end timestamptz,

  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_stripe_customers_clinic ON stripe_customers(clinic_id);
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);

CREATE INDEX idx_clinic_subscriptions_clinic ON clinic_subscriptions(clinic_id);
CREATE INDEX idx_clinic_subscriptions_status ON clinic_subscriptions(status);
CREATE INDEX idx_clinic_subscriptions_stripe_id ON clinic_subscriptions(stripe_subscription_id);
CREATE INDEX idx_clinic_subscriptions_period ON clinic_subscriptions(current_period_start, current_period_end);

CREATE INDEX idx_subscription_usage_clinic ON subscription_usage(clinic_id);
CREATE INDEX idx_subscription_usage_period ON subscription_usage(period_start, period_end);
CREATE INDEX idx_subscription_usage_subscription ON subscription_usage(subscription_id);
CREATE INDEX idx_subscription_usage_finalized ON subscription_usage(is_finalized);

CREATE INDEX idx_usage_events_clinic ON usage_events(clinic_id);
CREATE INDEX idx_usage_events_type ON usage_events(event_type);
CREATE INDEX idx_usage_events_period ON usage_events(billing_period_start);
CREATE INDEX idx_usage_events_created ON usage_events(created_at);
CREATE INDEX idx_usage_events_entity ON usage_events(entity_id, entity_type);

CREATE INDEX idx_payment_history_clinic ON payment_history(clinic_id);
CREATE INDEX idx_payment_history_subscription ON payment_history(subscription_id);
CREATE INDEX idx_payment_history_stripe_invoice ON payment_history(stripe_invoice_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Stripe customers: Clinic admins can view their own
CREATE POLICY "Clinic admins can view stripe customers"
  ON stripe_customers FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_clinic_access
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    OR
    clinic_id = (
      SELECT c.id FROM clinics c
      JOIN users u ON u.clinic_name = c.name
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'practice_owner')
    )
  );

-- Subscription plans: Public read access
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- Clinic subscriptions: Clinic admins can view their own
CREATE POLICY "Clinic admins can view subscriptions"
  ON clinic_subscriptions FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_clinic_access
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    OR
    clinic_id = (
      SELECT c.id FROM clinics c
      JOIN users u ON u.clinic_name = c.name
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'practice_owner')
    )
  );

-- Subscription usage: Clinic members can view their usage
CREATE POLICY "Clinic users can view usage"
  ON subscription_usage FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid()
    )
    OR
    clinic_id = (
      SELECT c.id FROM clinics c
      JOIN users u ON u.clinic_name = c.name
      WHERE u.id = auth.uid()
    )
  );

-- Similar policies for usage_events and payment_history...

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to increment usage count atomically
CREATE OR REPLACE FUNCTION increment_usage_count(
  p_clinic_id uuid,
  p_event_type text,
  p_cost_cents integer DEFAULT 0
) RETURNS void AS $$
DECLARE
  v_subscription_id uuid;
  v_period_start timestamptz;
BEGIN
  -- Get active subscription and period
  SELECT id, current_period_start INTO v_subscription_id, v_period_start
  FROM clinic_subscriptions
  WHERE clinic_id = p_clinic_id AND status IN ('trialing', 'active')
  LIMIT 1;

  IF v_subscription_id IS NULL THEN
    RAISE EXCEPTION 'No active subscription for clinic %', p_clinic_id;
  END IF;

  -- Upsert usage record
  INSERT INTO subscription_usage (
    clinic_id,
    subscription_id,
    period_start,
    period_end,
    outbound_calls_count,
    inbound_calls_count,
    soap_notes_count,
    discharge_summaries_count,
    case_ingestions_count,
    total_call_cost_cents
  )
  SELECT
    p_clinic_id,
    v_subscription_id,
    v_period_start,
    (SELECT current_period_end FROM clinic_subscriptions WHERE id = v_subscription_id),
    CASE WHEN p_event_type = 'outbound_call' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'inbound_call' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'soap_note' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'discharge_summary' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'case_ingestion' THEN 1 ELSE 0 END,
    p_cost_cents
  ON CONFLICT (clinic_id, period_start)
  DO UPDATE SET
    outbound_calls_count = subscription_usage.outbound_calls_count +
      CASE WHEN p_event_type = 'outbound_call' THEN 1 ELSE 0 END,
    inbound_calls_count = subscription_usage.inbound_calls_count +
      CASE WHEN p_event_type = 'inbound_call' THEN 1 ELSE 0 END,
    soap_notes_count = subscription_usage.soap_notes_count +
      CASE WHEN p_event_type = 'soap_note' THEN 1 ELSE 0 END,
    discharge_summaries_count = subscription_usage.discharge_summaries_count +
      CASE WHEN p_event_type = 'discharge_summary' THEN 1 ELSE 0 END,
    case_ingestions_count = subscription_usage.case_ingestions_count +
      CASE WHEN p_event_type = 'case_ingestion' THEN 1 ELSE 0 END,
    total_call_cost_cents = subscription_usage.total_call_cost_cents + p_cost_cents,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_clinic_id uuid,
  p_event_type text
) RETURNS jsonb AS $$
DECLARE
  v_plan_limit integer;
  v_current_usage integer;
  v_result jsonb;
BEGIN
  -- Get plan limit
  SELECT
    CASE p_event_type
      WHEN 'outbound_call' THEN sp.monthly_outbound_calls
      WHEN 'inbound_call' THEN sp.monthly_inbound_calls
      WHEN 'soap_note' THEN sp.monthly_soap_notes
      WHEN 'discharge_summary' THEN sp.monthly_discharge_summaries
      WHEN 'case_ingestion' THEN sp.monthly_case_ingestions
    END INTO v_plan_limit
  FROM clinic_subscriptions cs
  JOIN subscription_plans sp ON sp.id = cs.plan_id
  WHERE cs.clinic_id = p_clinic_id
    AND cs.status IN ('trialing', 'active')
  LIMIT 1;

  -- NULL = unlimited
  IF v_plan_limit IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'limit', null,
      'current', 0,
      'remaining', null
    );
  END IF;

  -- Get current usage
  SELECT
    CASE p_event_type
      WHEN 'outbound_call' THEN su.outbound_calls_count
      WHEN 'inbound_call' THEN su.inbound_calls_count
      WHEN 'soap_note' THEN su.soap_notes_count
      WHEN 'discharge_summary' THEN su.discharge_summaries_count
      WHEN 'case_ingestion' THEN su.case_ingestions_count
    END INTO v_current_usage
  FROM subscription_usage su
  JOIN clinic_subscriptions cs ON cs.id = su.subscription_id
  WHERE su.clinic_id = p_clinic_id
    AND cs.status IN ('trialing', 'active')
    AND su.period_start = cs.current_period_start
  LIMIT 1;

  v_current_usage := COALESCE(v_current_usage, 0);

  RETURN jsonb_build_object(
    'allowed', v_current_usage < v_plan_limit,
    'limit', v_plan_limit,
    'current', v_current_usage,
    'remaining', GREATEST(0, v_plan_limit - v_current_usage)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.2 Migration Strategy

**Migration File:** `supabase/migrations/20260114000000_create_stripe_billing_tables.sql`

**Rollback Plan:**

```sql
-- Drop tables in reverse order (respects foreign keys)
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS usage_events CASCADE;
DROP TABLE IF EXISTS subscription_usage CASCADE;
DROP TABLE IF EXISTS clinic_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS increment_usage_count;
DROP FUNCTION IF EXISTS check_usage_limit;
```

---

## 4. Service Architecture

### 4.1 Stripe Integration Library

**Location:** `libs/integrations/stripe/`

**Structure:**

```
libs/integrations/stripe/
├── src/
│   ├── client.ts                  # Stripe SDK initialization
│   ├── index.ts                   # Public exports
│   ├── schemas/
│   │   ├── customer.ts            # Zod schemas for customers
│   │   ├── subscription.ts        # Subscription schemas
│   │   ├── usage.ts               # Usage event schemas
│   │   └── webhook.ts             # Webhook payload schemas
│   ├── services/
│   │   ├── customer-service.ts    # Customer CRUD
│   │   ├── subscription-service.ts # Subscription management
│   │   ├── usage-service.ts       # Usage reporting
│   │   └── checkout-service.ts    # Checkout session creation
│   └── webhooks/
│       ├── index.ts               # Webhook router
│       ├── verify.ts              # Signature verification
│       └── handlers/
│           ├── checkout-completed.ts
│           ├── subscription-created.ts
│           ├── subscription-updated.ts
│           ├── subscription-deleted.ts
│           ├── invoice-paid.ts
│           └── invoice-payment-failed.ts
├── __tests__/
│   ├── customer-service.test.ts
│   ├── subscription-service.test.ts
│   └── webhooks/
│       └── handlers.test.ts
└── project.json
```

**Client Initialization:**

```typescript
// libs/integrations/stripe/src/client.ts
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_API_VERSION = "2024-12-18.acacia"; // Pin version

if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
  typescript: true,
});

export type StripeClient = typeof stripe;
```

**Customer Service:**

```typescript
// libs/integrations/stripe/src/services/customer-service.ts
import { stripe } from "../client";
import type { StripeCustomerCreateInput } from "../schemas/customer";

export async function createStripeCustomer(
  input: StripeCustomerCreateInput,
): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email: input.email,
    name: input.name,
    metadata: {
      clinic_id: input.clinicId,
      odis_customer_type: "clinic",
    },
  });
}

export async function getStripeCustomer(
  customerId: string,
): Promise<Stripe.Customer> {
  return await stripe.customers.retrieve(customerId);
}

export async function updateStripeCustomer(
  customerId: string,
  updates: Partial<StripeCustomerCreateInput>,
): Promise<Stripe.Customer> {
  return await stripe.customers.update(customerId, {
    email: updates.email,
    name: updates.name,
  });
}
```

**Subscription Service:**

```typescript
// libs/integrations/stripe/src/services/subscription-service.ts
import { stripe } from "../client";

export async function createSubscription(
  customerId: string,
  priceId: string,
  options?: {
    trialDays?: number;
    metadata?: Record<string, string>;
  },
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: options?.trialDays,
    metadata: options?.metadata,
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent"],
  });
}

export async function cancelSubscription(
  subscriptionId: string,
  options?: {
    cancelAtPeriodEnd?: boolean;
    cancellationReason?: string;
  },
): Promise<Stripe.Subscription> {
  if (options?.cancelAtPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      metadata: {
        cancellation_reason: options.cancellationReason,
      },
    });
  }

  return await stripe.subscriptions.cancel(subscriptionId, {
    prorate: true,
    invoice_now: true,
  });
}
```

**Checkout Service:**

```typescript
// libs/integrations/stripe/src/services/checkout-service.ts
import { stripe } from "../client";

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  options: {
    successUrl: string;
    cancelUrl: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  },
): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: options.trialDays,
      metadata: options.metadata,
    },
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    allow_promotion_codes: true,
  });
}
```

### 4.2 Billing Domain Services

**Location:** `libs/domain/billing/data-access/`

**Structure:**

```
libs/domain/billing/data-access/
├── src/
│   ├── lib/
│   │   ├── subscription-service.ts      # Subscription CRUD
│   │   ├── usage-tracking-service.ts    # Usage recording
│   │   ├── plan-enforcement-service.ts  # Limit checking
│   │   └── billing-analytics-service.ts # Analytics
│   └── index.ts
├── __tests__/
│   ├── subscription-service.test.ts
│   ├── usage-tracking-service.test.ts
│   └── plan-enforcement-service.test.ts
└── project.json
```

**Subscription Service:**

```typescript
// libs/domain/billing/data-access/src/lib/subscription-service.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ISubscriptionRepository } from "@odis-ai/data-access/repository-interfaces";
import {
  createStripeCustomer,
  createCheckoutSession,
} from "@odis-ai/integrations/stripe";

export class SubscriptionService {
  constructor(
    private subscriptionRepo: ISubscriptionRepository,
    private supabase: SupabaseClient,
  ) {}

  async createCheckoutForClinic(
    clinicId: string,
    planId: string,
    userId: string,
  ): Promise<{ sessionUrl: string }> {
    // 1. Get or create Stripe customer
    const stripeCustomer = await this.getOrCreateStripeCustomer(clinicId);

    // 2. Get plan details
    const plan = await this.subscriptionRepo.getPlanById(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    // 3. Create Stripe Checkout session
    const session = await createCheckoutSession(
      stripeCustomer.stripe_customer_id,
      plan.stripe_price_id,
      {
        successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?subscribed=true`,
        cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
        trialDays: plan.trial_days,
        metadata: {
          clinic_id: clinicId,
          plan_id: planId,
          user_id: userId,
        },
      },
    );

    return { sessionUrl: session.url! };
  }

  async getActiveSubscription(clinicId: string) {
    return await this.subscriptionRepo.getActiveSubscription(clinicId);
  }

  async cancelSubscription(
    clinicId: string,
    cancelAtPeriodEnd: boolean,
    reason?: string,
  ): Promise<void> {
    const subscription = await this.getActiveSubscription(clinicId);
    if (!subscription) {
      throw new Error("No active subscription found");
    }

    // Cancel in Stripe
    await cancelSubscription(subscription.stripe_subscription_id, {
      cancelAtPeriodEnd,
      cancellationReason: reason,
    });

    // Update database
    await this.subscriptionRepo.updateSubscription(subscription.id, {
      cancel_at_period_end: cancelAtPeriodEnd,
      canceled_at: new Date(),
      cancellation_reason: reason,
    });
  }

  private async getOrCreateStripeCustomer(clinicId: string) {
    const { data: existing } = await this.supabase
      .from("stripe_customers")
      .select("*")
      .eq("clinic_id", clinicId)
      .single();

    if (existing) return existing;

    // Get clinic details
    const { data: clinic } = await this.supabase
      .from("clinics")
      .select("name, email")
      .eq("id", clinicId)
      .single();

    if (!clinic) {
      throw new Error(`Clinic ${clinicId} not found`);
    }

    // Create Stripe customer
    const stripeCustomer = await createStripeCustomer({
      email: clinic.email,
      name: clinic.name,
      clinicId,
    });

    // Store in database
    const { data: created } = await this.supabase
      .from("stripe_customers")
      .insert({
        clinic_id: clinicId,
        stripe_customer_id: stripeCustomer.id,
        email: stripeCustomer.email,
        name: stripeCustomer.name,
      })
      .select()
      .single();

    return created!;
  }
}
```

**Usage Tracking Service:**

```typescript
// libs/domain/billing/data-access/src/lib/usage-tracking-service.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type UsageEventType =
  | "outbound_call"
  | "inbound_call"
  | "soap_note"
  | "discharge_summary"
  | "case_ingestion";

export class UsageTrackingService {
  constructor(private supabase: SupabaseClient) {}

  async recordUsageEvent(
    clinicId: string,
    eventType: UsageEventType,
    entityId: string,
    options?: {
      userId?: string;
      costCents?: number;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    // Get active subscription
    const { data: subscription } = await this.supabase
      .from("clinic_subscriptions")
      .select("id, current_period_start")
      .eq("clinic_id", clinicId)
      .in("status", ["trialing", "active"])
      .single();

    if (!subscription) {
      console.warn(`No active subscription for clinic ${clinicId}`);
      return; // Don't block action if no subscription
    }

    // Insert usage event
    await this.supabase.from("usage_events").insert({
      clinic_id: clinicId,
      subscription_id: subscription.id,
      user_id: options?.userId,
      event_type: eventType,
      entity_id: entityId,
      entity_type: this.getEntityType(eventType),
      cost_cents: options?.costCents ?? 0,
      billing_period_start: subscription.current_period_start,
      metadata: options?.metadata ?? {},
    });

    // Increment aggregated usage (via database function)
    await this.supabase.rpc("increment_usage_count", {
      p_clinic_id: clinicId,
      p_event_type: eventType,
      p_cost_cents: options?.costCents ?? 0,
    });
  }

  async getCurrentUsage(clinicId: string) {
    const { data } = await this.supabase
      .from("subscription_usage")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("period_start", { ascending: false })
      .limit(1)
      .single();

    return data;
  }

  private getEntityType(eventType: UsageEventType): string {
    const mapping: Record<UsageEventType, string> = {
      outbound_call: "scheduled_discharge_call",
      inbound_call: "inbound_vapi_call",
      soap_note: "soap_note",
      discharge_summary: "discharge_summary",
      case_ingestion: "case",
    };
    return mapping[eventType];
  }
}
```

**Plan Enforcement Service:**

```typescript
// libs/domain/billing/data-access/src/lib/plan-enforcement-service.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UsageEventType } from "./usage-tracking-service";

export interface UsageLimitCheck {
  allowed: boolean;
  limit: number | null; // null = unlimited
  current: number;
  remaining: number | null; // null = unlimited
}

export class PlanEnforcementService {
  constructor(private supabase: SupabaseClient) {}

  async checkUsageLimit(
    clinicId: string,
    eventType: UsageEventType,
  ): Promise<UsageLimitCheck> {
    const { data, error } = await this.supabase.rpc("check_usage_limit", {
      p_clinic_id: clinicId,
      p_event_type: eventType,
    });

    if (error) {
      console.error("Error checking usage limit:", error);
      // Fail open (allow action) on error
      return {
        allowed: true,
        limit: null,
        current: 0,
        remaining: null,
      };
    }

    return data as UsageLimitCheck;
  }

  async requiresUpgrade(
    clinicId: string,
    eventType: UsageEventType,
  ): Promise<boolean> {
    const check = await this.checkUsageLimit(clinicId, eventType);
    return !check.allowed;
  }

  async getUsagePercentage(
    clinicId: string,
    eventType: UsageEventType,
  ): Promise<number> {
    const check = await this.checkUsageLimit(clinicId, eventType);

    if (check.limit === null) {
      return 0; // Unlimited
    }

    return (check.current / check.limit) * 100;
  }
}
```

---

## 5. Integration Points

### 5.1 Call Scheduling Integration

**Modify:** `libs/domain/discharge/data-access/src/lib/call-executor.ts`

**Before:**

```typescript
export async function executeScheduledCall(
  callId: string,
  supabase: SupabaseClient,
): Promise<CallExecutionResult> {
  // Existing call execution logic
  const vapiResponse = await createPhoneCall({
    /* ... */
  });
  // ...
}
```

**After:**

```typescript
import { UsageTrackingService } from "@odis-ai/domain/billing";

export async function executeScheduledCall(
  callId: string,
  supabase: SupabaseClient,
): Promise<CallExecutionResult> {
  const call = await getCallById(callId, supabase);
  const clinic = await getClinicForUser(call.user_id, supabase);

  // Existing call execution logic
  const vapiResponse = await createPhoneCall({
    /* ... */
  });

  // NEW: Record usage event
  const usageService = new UsageTrackingService(supabase);
  await usageService.recordUsageEvent(clinic.id, "outbound_call", callId, {
    userId: call.user_id,
    costCents: Math.round((vapiResponse.cost ?? 0) * 100),
    metadata: {
      vapi_call_id: vapiResponse.id,
      duration_seconds: vapiResponse.duration,
    },
  });

  return { success: true, vapiCallId: vapiResponse.id };
}
```

### 5.2 SOAP Note Generation Integration

**Modify:** `libs/domain/cases/data-access/src/lib/case-ai.ts`

**Before:**

```typescript
export async function autoGenerateDischargeSummary(
  supabase: SupabaseClient,
  userId: string,
  caseId: string,
  entities: NormalizedEntities,
): Promise<{ summaryId: string } | null> {
  // Generate summary
  const { structured, plainText } =
    await generateStructuredDischargeSummaryWithRetry({
      /* ... */
    });

  // Save to database
  const { data: summary } = await supabase
    .from("discharge_summaries")
    .insert({
      /* ... */
    })
    .single();

  return { summaryId: summary.id };
}
```

**After:**

```typescript
import {
  UsageTrackingService,
  PlanEnforcementService,
} from "@odis-ai/domain/billing";

export async function autoGenerateDischargeSummary(
  supabase: SupabaseClient,
  userId: string,
  caseId: string,
  entities: NormalizedEntities,
): Promise<{ summaryId: string } | null> {
  const clinic = await getClinicForUser(userId, supabase);

  // NEW: Check usage limit
  const enforcement = new PlanEnforcementService(supabase);
  const limitCheck = await enforcement.checkUsageLimit(
    clinic.id,
    "discharge_summary",
  );

  if (!limitCheck.allowed) {
    throw new Error(
      "Discharge summary limit reached. Please upgrade your plan.",
    );
  }

  // Generate summary
  const { structured, plainText } =
    await generateStructuredDischargeSummaryWithRetry({
      /* ... */
    });

  // Save to database
  const { data: summary } = await supabase
    .from("discharge_summaries")
    .insert({
      /* ... */
    })
    .single();

  // NEW: Record usage event
  const usageService = new UsageTrackingService(supabase);
  await usageService.recordUsageEvent(
    clinic.id,
    "discharge_summary",
    summary.id,
    { userId, metadata: { case_id: caseId } },
  );

  return { summaryId: summary.id };
}
```

### 5.3 VAPI Webhook Integration

**Modify:** `libs/integrations/vapi/src/webhooks/handlers/end-of-call-report.ts`

**Add to existing handler:**

```typescript
import { UsageTrackingService } from "@odis-ai/domain/billing";

export async function handleEndOfCallReport(
  message: EndOfCallReportMessage,
  context: WebhookHandlerContext,
  supabase: SupabaseClient,
): Promise<void> {
  const { call } = message;

  // Existing logic: Update call record with results
  // ...

  // NEW: Record usage event with VAPI cost
  const clinic = await getClinicFromCallId(call.id, supabase);
  if (clinic) {
    const usageService = new UsageTrackingService(supabase);
    const totalCost = calculateTotalCost(call.costs);

    await usageService.recordUsageEvent(
      clinic.id,
      message.type === "outbound" ? "outbound_call" : "inbound_call",
      call.id,
      {
        costCents: Math.round(totalCost * 100),
        metadata: {
          duration_seconds: calculateDuration(call),
          status: call.status,
          ended_reason: call.endedReason,
        },
      },
    );
  }
}
```

---

## 6. Webhook Implementation

### 6.1 Webhook Route

**Location:** `apps/web/src/app/api/webhooks/stripe/route.ts`

```typescript
import { headers } from "next/headers";
import { stripe } from "@odis-ai/integrations/stripe";
import { handleCheckoutCompleted } from "@odis-ai/integrations/stripe/webhooks/handlers/checkout-completed";
import { handleSubscriptionCreated } from "@odis-ai/integrations/stripe/webhooks/handlers/subscription-created";
import { handleSubscriptionUpdated } from "@odis-ai/integrations/stripe/webhooks/handlers/subscription-updated";
import { handleSubscriptionDeleted } from "@odis-ai/integrations/stripe/webhooks/handlers/subscription-deleted";
import { handleInvoicePaid } from "@odis-ai/integrations/stripe/webhooks/handlers/invoice-paid";
import { handleInvoicePaymentFailed } from "@odis-ai/integrations/stripe/webhooks/handlers/invoice-payment-failed";
import { createServiceClient } from "@odis-ai/data-access/db";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return Response.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  // Create service client (bypasses RLS for webhooks)
  const supabase = createServiceClient();

  try {
    // Route to appropriate handler
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, supabase);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object, supabase);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object, supabase);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object, supabase);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object, supabase);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object, supabase);
        break;

      case "customer.subscription.trial_will_end":
        // TODO: Send trial ending notification
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error:`, err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
```

### 6.2 Webhook Handlers

**Checkout Completed:**

```typescript
// libs/integrations/stripe/src/webhooks/handlers/checkout-completed.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient,
): Promise<void> {
  const clinicId = session.metadata?.clinic_id;
  const planId = session.metadata?.plan_id;

  if (!clinicId || !planId) {
    throw new Error("Missing clinic_id or plan_id in session metadata");
  }

  // Subscription will be created via subscription.created webhook
  // This handler is mainly for logging and analytics

  console.log(`Checkout completed for clinic ${clinicId}, plan ${planId}`);
}
```

**Subscription Created:**

```typescript
// libs/integrations/stripe/src/webhooks/handlers/subscription-created.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: SupabaseClient,
): Promise<void> {
  const customerId = subscription.customer as string;

  // Get clinic from stripe_customer
  const { data: stripeCustomer } = await supabase
    .from("stripe_customers")
    .select("clinic_id, id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!stripeCustomer) {
    throw new Error(`Stripe customer ${customerId} not found in database`);
  }

  // Get plan from price_id
  const priceId = subscription.items.data[0].price.id;
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("stripe_price_id", priceId)
    .single();

  if (!plan) {
    throw new Error(`Plan with price ${priceId} not found`);
  }

  // Create clinic_subscription
  await supabase.from("clinic_subscriptions").insert({
    clinic_id: stripeCustomer.clinic_id,
    stripe_customer_id: stripeCustomer.id,
    plan_id: plan.id,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    status: subscription.status,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    current_period_start: new Date(
      subscription.current_period_start * 1000,
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000,
    ).toISOString(),
  });

  // Initialize subscription_usage
  await supabase.from("subscription_usage").insert({
    clinic_id: stripeCustomer.clinic_id,
    subscription_id: subscription.id,
    period_start: new Date(
      subscription.current_period_start * 1000,
    ).toISOString(),
    period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  });

  console.log(`Subscription created for clinic ${stripeCustomer.clinic_id}`);
}
```

**Subscription Updated:**

```typescript
// libs/integrations/stripe/src/webhooks/handlers/subscription-updated.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: SupabaseClient,
): Promise<void> {
  // Update subscription status and period
  await supabase
    .from("clinic_subscriptions")
    .update({
      status: subscription.status,
      current_period_start: new Date(
        subscription.current_period_start * 1000,
      ).toISOString(),
      current_period_end: new Date(
        subscription.current_period_end * 1000,
      ).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    })
    .eq("stripe_subscription_id", subscription.id);

  console.log(
    `Subscription ${subscription.id} updated to status: ${subscription.status}`,
  );
}
```

**Invoice Paid:**

```typescript
// libs/integrations/stripe/src/webhooks/handlers/invoice-paid.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

export async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  supabase: SupabaseClient,
): Promise<void> {
  const customerId = invoice.customer as string;

  // Get clinic from stripe_customer
  const { data: stripeCustomer } = await supabase
    .from("stripe_customers")
    .select("clinic_id, id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!stripeCustomer) {
    console.error(`Stripe customer ${customerId} not found`);
    return;
  }

  // Record payment in payment_history
  await supabase.from("payment_history").insert({
    clinic_id: stripeCustomer.clinic_id,
    stripe_customer_id: stripeCustomer.id,
    subscription_id: invoice.subscription as string,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: invoice.payment_intent as string,
    stripe_charge_id: invoice.charge as string,
    amount_cents: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status ?? "paid",
    invoice_date: new Date(invoice.created * 1000).toISOString(),
    due_date: invoice.due_date
      ? new Date(invoice.due_date * 1000).toISOString()
      : null,
    paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
    invoice_pdf_url: invoice.invoice_pdf,
    hosted_invoice_url: invoice.hosted_invoice_url,
    period_start: invoice.period_start
      ? new Date(invoice.period_start * 1000).toISOString()
      : null,
    period_end: invoice.period_end
      ? new Date(invoice.period_end * 1000).toISOString()
      : null,
  });

  // Finalize previous period usage
  if (invoice.period_end) {
    await supabase
      .from("subscription_usage")
      .update({
        is_finalized: true,
        finalized_at: new Date().toISOString(),
      })
      .eq("clinic_id", stripeCustomer.clinic_id)
      .eq("period_end", new Date(invoice.period_end * 1000).toISOString());
  }

  console.log(
    `Invoice ${invoice.id} paid for clinic ${stripeCustomer.clinic_id}`,
  );
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

**Test Coverage Targets:**

- Services: 80%+
- Webhook handlers: 90%+
- Database functions: 100%

**Example Test:**

```typescript
// libs/domain/billing/data-access/src/__tests__/plan-enforcement-service.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PlanEnforcementService } from "../lib/plan-enforcement-service";
import { createMockSupabaseClient } from "@odis-ai/shared/testing";

describe("PlanEnforcementService", () => {
  let service: PlanEnforcementService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new PlanEnforcementService(mockSupabase as any);
  });

  it("should allow action when under limit", async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: {
        allowed: true,
        limit: 50,
        current: 25,
        remaining: 25,
      },
      error: null,
    });

    const result = await service.checkUsageLimit("clinic-123", "outbound_call");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(25);
  });

  it("should block action when limit reached", async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: {
        allowed: false,
        limit: 50,
        current: 50,
        remaining: 0,
      },
      error: null,
    });

    const result = await service.checkUsageLimit("clinic-123", "outbound_call");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should allow unlimited usage for null limit", async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: {
        allowed: true,
        limit: null,
        current: 1000,
        remaining: null,
      },
      error: null,
    });

    const result = await service.checkUsageLimit("clinic-123", "soap_note");

    expect(result.allowed).toBe(true);
    expect(result.limit).toBeNull();
  });
});
```

### 7.2 Integration Tests

**Webhook Integration Test:**

```typescript
// libs/integrations/stripe/src/__tests__/webhooks/subscription-created.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { handleSubscriptionCreated } from "../../webhooks/handlers/subscription-created";
import { createMockSupabaseClient } from "@odis-ai/shared/testing";
import type Stripe from "stripe";

describe("handleSubscriptionCreated", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  it("should create clinic_subscription and subscription_usage", async () => {
    const mockSubscription: Stripe.Subscription = {
      id: "sub_123",
      customer: "cus_123",
      status: "active",
      current_period_start: 1705276800,
      current_period_end: 1707868800,
      items: {
        data: [{ price: { id: "price_starter" } }],
      },
      trial_start: null,
      trial_end: null,
    } as any;

    mockSupabase.from("stripe_customers").select.mockResolvedValue({
      data: { clinic_id: "clinic-123", id: "sc-123" },
      error: null,
    });

    mockSupabase.from("subscription_plans").select.mockResolvedValue({
      data: { id: "plan-123" },
      error: null,
    });

    await handleSubscriptionCreated(mockSubscription, mockSupabase as any);

    expect(mockSupabase.from).toHaveBeenCalledWith("clinic_subscriptions");
    expect(mockSupabase.from).toHaveBeenCalledWith("subscription_usage");
  });
});
```

### 7.3 Manual Testing Checklist

**Subscription Flow:**

- [ ] Sign up for free trial
- [ ] Verify trial subscription created in Stripe
- [ ] Test trial limits (10 calls, etc.)
- [ ] Receive trial ending notification
- [ ] Upgrade to Starter plan
- [ ] Verify payment processed
- [ ] Check usage resets for new period

**Usage Tracking:**

- [ ] Create outbound call → verify usage incremented
- [ ] Create SOAP note → verify usage incremented
- [ ] Reach 80% limit → verify warning shown
- [ ] Reach 100% limit → verify action blocked
- [ ] Verify upgrade prompt displayed

**Webhooks:**

- [ ] Test each webhook event type using Stripe CLI
- [ ] Verify database updated correctly
- [ ] Check error handling for missing data
- [ ] Confirm idempotency (resend webhook)

---

## 8. Deployment

### 8.1 Environment Variables

Add to `.env`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Plans (created in Stripe Dashboard)
STRIPE_PLAN_FREE_TRIAL_PRICE_ID=price_xxx
STRIPE_PLAN_STARTER_PRICE_ID=price_xxx
STRIPE_PLAN_PROFESSIONAL_PRICE_ID=price_xxx
STRIPE_PLAN_ENTERPRISE_PRICE_ID=price_xxx
```

### 8.2 Stripe Configuration

**1. Create Products & Prices in Stripe Dashboard:**

```bash
# Free Trial
Product: "ODIS AI - Free Trial"
Price: $0/month with 14-day trial

# Starter
Product: "ODIS AI - Starter"
Price: $99/month

# Professional
Product: "ODIS AI - Professional"
Price: $299/month

# Enterprise
Product: "ODIS AI - Enterprise"
Price: $599/month
```

**2. Configure Webhook Endpoint:**

```
URL: https://your-domain.com/api/webhooks/stripe
Events:
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.paid
- invoice.payment_failed
- customer.subscription.trial_will_end
```

**3. Seed Database with Plans:**

```sql
-- Run after migration
INSERT INTO subscription_plans (
  stripe_product_id,
  stripe_price_id,
  name,
  slug,
  description,
  monthly_outbound_calls,
  monthly_inbound_calls,
  monthly_soap_notes,
  monthly_discharge_summaries,
  monthly_case_ingestions,
  features,
  price_cents,
  trial_days,
  display_order
) VALUES
  ('prod_trial', 'price_trial', 'Free Trial', 'free-trial', '14-day trial', 10, 5, 10, 10, 20, '["basic_features"]', 0, 14, 0),
  ('prod_starter', 'price_starter', 'Starter', 'starter', 'For small clinics', 50, 25, 100, 100, 200, '["email_support"]', 9900, 0, 1),
  ('prod_pro', 'price_pro', 'Professional', 'professional', 'For growing practices', 200, 100, NULL, NULL, NULL, '["idexx_sync", "analytics", "priority_support"]', 29900, 0, 2),
  ('prod_ent', 'price_ent', 'Enterprise', 'enterprise', 'For multi-location groups', NULL, NULL, NULL, NULL, NULL, '["custom_branding", "api_access", "dedicated_support"]', 59900, 0, 3);
```

### 8.3 Rollout Plan

**Phase 1: Infrastructure (Week 1)**

- [ ] Run database migration
- [ ] Deploy Stripe integration library
- [ ] Deploy billing domain services
- [ ] Configure Stripe webhook endpoint
- [ ] Seed subscription plans

**Phase 2: Integration (Week 2)**

- [ ] Integrate usage tracking into call executor
- [ ] Integrate usage tracking into SOAP note generation
- [ ] Integrate usage tracking into case ingestion
- [ ] Add limit checks to all billable actions
- [ ] Test webhook handlers

**Phase 3: UI (Week 3)**

- [ ] Build pricing page
- [ ] Build billing dashboard
- [ ] Add usage warnings/alerts
- [ ] Add upgrade prompts
- [ ] Test checkout flow

**Phase 4: Beta (Week 4)**

- [ ] Launch to 5 beta clinics
- [ ] Monitor usage tracking accuracy
- [ ] Gather feedback on pricing
- [ ] Fix critical bugs

**Phase 5: GA (Week 5)**

- [ ] Migrate existing clinics (30-day notice)
- [ ] Full production launch
- [ ] Monitor conversion rates
- [ ] Iterate based on data

---

## 9. Monitoring & Observability

### 9.1 Key Metrics to Track

**Revenue Metrics:**

- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- ARPU (Average Revenue Per User)
- Churn Rate

**Usage Metrics:**

- Average usage per plan
- Percentage at 80%+ usage
- Percentage under 50% usage

**Technical Metrics:**

- Webhook success rate (>99.9%)
- Usage tracking latency (<100ms)
- Payment success rate (>95%)

### 9.2 Alerts

**Critical:**

- Webhook failure rate >1%
- Payment success rate <90%
- Database function errors

**Warning:**

- High churn rate (>7%)
- Low trial conversion (<30%)
- Stripe API errors

---

## 10. Security Considerations

### 10.1 PCI Compliance

- ✅ Use Stripe Checkout (Stripe handles PCI)
- ✅ Never store card details
- ✅ Verify webhook signatures
- ✅ Use HTTPS for all API calls

### 10.2 Data Protection

- ✅ Encrypt sensitive data at rest
- ✅ Use service client only for webhooks
- ✅ RLS policies on all billing tables
- ✅ Audit log all subscription changes

---

## 11. Open Technical Questions

1. **Metered billing**: Use Stripe Billing Meters or custom implementation?
   - **Recommendation**: Custom for now, Stripe Meters in Phase 2

2. **Usage reconciliation**: How often to reconcile usage with Stripe?
   - **Recommendation**: Daily reconciliation job

3. **Failed payment handling**: Auto-retry or manual?
   - **Recommendation**: Stripe Smart Retries (automatic)

4. **Plan changes**: Immediate or end of period?
   - **Recommendation**: Immediate with proration

---

**End of Document**

This technical design provides the complete implementation blueprint for Stripe subscription billing in ODIS AI.

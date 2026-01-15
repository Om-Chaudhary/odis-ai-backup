/**
 * Subscription tier constants for Stripe billing integration
 */

export const SUBSCRIPTION_TIERS = {
  NONE: "none",
  INBOUND: "inbound",
  PROFESSIONAL: "professional",
  ENTERPRISE: "enterprise",
} as const;

export type SubscriptionTier =
  (typeof SUBSCRIPTION_TIERS)[keyof typeof SUBSCRIPTION_TIERS];

export const SUBSCRIPTION_STATUSES = {
  NONE: "none",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  TRIALING: "trialing",
  INCOMPLETE: "incomplete",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUSES)[keyof typeof SUBSCRIPTION_STATUSES];

/**
 * Features available per subscription tier
 */
export const TIER_FEATURES = {
  [SUBSCRIPTION_TIERS.NONE]: [] as const,
  [SUBSCRIPTION_TIERS.INBOUND]: [
    "inbound_calls",
    "messages",
    "voicemail",
  ] as const,
  [SUBSCRIPTION_TIERS.PROFESSIONAL]: [
    "inbound_calls",
    "messages",
    "voicemail",
    "outbound_calls",
    "discharge",
    "batch_scheduling",
  ] as const,
  [SUBSCRIPTION_TIERS.ENTERPRISE]: [
    "inbound_calls",
    "messages",
    "voicemail",
    "outbound_calls",
    "discharge",
    "batch_scheduling",
    "priority_support",
    "advanced_analytics",
    "custom_integrations",
  ] as const,
} as const;

export type TierFeature = (typeof TIER_FEATURES)[SubscriptionTier][number];

/**
 * Tier hierarchy for comparison (higher index = higher tier)
 */
export const TIER_HIERARCHY: SubscriptionTier[] = [
  SUBSCRIPTION_TIERS.NONE,
  SUBSCRIPTION_TIERS.INBOUND,
  SUBSCRIPTION_TIERS.PROFESSIONAL,
  SUBSCRIPTION_TIERS.ENTERPRISE,
];

/**
 * Stripe Price IDs for each tier (monthly recurring)
 */
export const STRIPE_PRICE_IDS = {
  [SUBSCRIPTION_TIERS.INBOUND]: "price_1SpqJgBBPCIS612yZ30gWcl2",
  [SUBSCRIPTION_TIERS.PROFESSIONAL]: "price_1SpqJgBBPCIS612yHt7LewHF",
  [SUBSCRIPTION_TIERS.ENTERPRISE]: "price_1SpqJgBBPCIS612ywL5jFbsm",
} as const;

/**
 * Stripe Product IDs for each tier
 */
export const STRIPE_PRODUCT_IDS = {
  [SUBSCRIPTION_TIERS.INBOUND]: "prod_TnRBG4CbOwFCA5",
  [SUBSCRIPTION_TIERS.PROFESSIONAL]: "prod_TnRBvUQkkS9p6B",
  [SUBSCRIPTION_TIERS.ENTERPRISE]: "prod_TnRBGGTsNgqBLG",
} as const;

/**
 * Stripe Payment Links (created in Stripe Dashboard - no API key required)
 * These are read from environment variables at runtime
 */
export const STRIPE_PAYMENT_LINKS = {
  [SUBSCRIPTION_TIERS.INBOUND]:
    process.env.NEXT_PUBLIC_STRIPE_LINK_INBOUND ?? "",
  [SUBSCRIPTION_TIERS.PROFESSIONAL]:
    process.env.NEXT_PUBLIC_STRIPE_LINK_PROFESSIONAL ?? "",
  [SUBSCRIPTION_TIERS.ENTERPRISE]:
    process.env.NEXT_PUBLIC_STRIPE_LINK_ENTERPRISE ?? "",
} as const;

/**
 * Stripe Billing Portal URL (static link - no API key required)
 * Customers can log in with their email to manage subscriptions
 */
export const STRIPE_BILLING_PORTAL_URL =
  process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL ??
  "https://billing.stripe.com/p/login/eVqbJ0ctPemHbrq7w25sA00";

/**
 * Build a Payment Link URL with clinic ID for tracking
 */
export function getPaymentLinkUrl(
  tier: Exclude<SubscriptionTier, "none">,
  clinicId: string,
): string | null {
  const baseUrl = STRIPE_PAYMENT_LINKS[tier];
  if (!baseUrl) return null;
  return `${baseUrl}?client_reference_id=${encodeURIComponent(clinicId)}`;
}

/**
 * Display information for each tier
 */
export const TIER_DISPLAY_INFO = {
  [SUBSCRIPTION_TIERS.NONE]: {
    name: "No Plan",
    description: "No active subscription",
    priceMonthly: 0,
    badge: null,
  },
  [SUBSCRIPTION_TIERS.INBOUND]: {
    name: "Inbound",
    description: "After-hours call handling and message routing",
    priceMonthly: 250,
    badge: null,
  },
  [SUBSCRIPTION_TIERS.PROFESSIONAL]: {
    name: "Professional",
    description: "Complete inbound and outbound call automation",
    priceMonthly: 500,
    badge: "Most Popular",
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    name: "Enterprise",
    description: "Full platform with priority support and analytics",
    priceMonthly: 1000,
    badge: "Best Value",
  },
} as const;

/**
 * Check if a tier has access to a specific feature
 */
export function tierHasFeature(
  tier: SubscriptionTier,
  feature: TierFeature,
): boolean {
  const features = TIER_FEATURES[tier];
  return (features as readonly string[]).includes(feature);
}

/**
 * Check if tierA is at least as high as tierB
 */
export function tierAtLeast(
  tierA: SubscriptionTier,
  tierB: SubscriptionTier,
): boolean {
  const indexA = TIER_HIERARCHY.indexOf(tierA);
  const indexB = TIER_HIERARCHY.indexOf(tierB);
  return indexA >= indexB;
}

/**
 * Get the minimum tier required for a feature
 */
export function getMinimumTierForFeature(
  feature: TierFeature,
): SubscriptionTier {
  for (const tier of TIER_HIERARCHY) {
    if (tierHasFeature(tier, feature)) {
      return tier;
    }
  }
  return SUBSCRIPTION_TIERS.ENTERPRISE;
}

/**
 * Check if a subscription status allows access to the platform
 */
export function isActiveSubscription(status: SubscriptionStatus): boolean {
  return (
    status === SUBSCRIPTION_STATUSES.ACTIVE ||
    status === SUBSCRIPTION_STATUSES.TRIALING
  );
}

import type { Database } from "@odis-ai/shared/types";

/**
 * PostHog User Person Properties
 *
 * These properties identify users across the platform.
 * Use $set_once for immutable properties, $set for mutable ones.
 */
export interface PostHogUserProperties {
  // Core identity
  email: string | null;
  first_name: string | null;
  last_name: string | null;

  // Role & permissions
  role: Database["public"]["Enums"]["user_role"] | null;

  // Auth metadata
  clerk_user_id: string | null;

  // Clinic association (legacy)
  clinic_name: string | null;

  // Account status
  onboarding_completed: boolean | null;
  account_created_at: string; // ISO date string

  // Initial state (set_once only)
  initial_role?: Database["public"]["Enums"]["user_role"] | null;
}

/**
 * PostHog Clinic Group Properties
 *
 * Properties for the "clinic" group type.
 * Used to track organization-level metrics and segment users by clinic.
 */
export interface PostHogClinicGroupProperties {
  // Core identity
  name: string;
  slug: string;

  // Subscription
  subscription_tier: string | null;
  subscription_status: string | null;

  // Status
  is_active: boolean;

  // Integration
  pims_type: string;

  // Contact
  phone: string | null;
  email: string | null;

  // Settings
  timezone: string | null;
}

/**
 * PostHog Super Properties
 *
 * Properties automatically included with every event.
 * Set via posthog.register() for session-wide properties.
 */
export interface PostHogSuperProperties {
  // Current context
  current_clinic_id?: string;
  current_clinic_slug?: string;

  // UTM parameters (already tracked on landing pages)
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

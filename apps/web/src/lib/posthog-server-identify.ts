import PostHogClient from "~/lib/posthog";
import type { Database } from "@odis-ai/shared/types";
import type { PostHogUserProperties } from "./posthog-types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type ClinicRow = Database["public"]["Tables"]["clinics"]["Row"];

/**
 * Identify user on server-side
 *
 * Use this in:
 * - Webhook handlers (Clerk user created)
 * - Server actions that modify user data
 * - Background jobs that need to track user events
 *
 * @param userId - User ID
 * @param userProfile - Full or partial user profile
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * // In Clerk webhook after user creation
 * await identifyUserServer(userId, {
 *   email: user.email,
 *   first_name: user.firstName,
 *   last_name: user.lastName,
 *   clerk_user_id: clerkId,
 *   created_at: new Date().toISOString(),
 * });
 * ```
 */
export async function identifyUserServer(
  userId: string,
  userProfile: Partial<UserRow>,
  options?: {
    setOnce?: Partial<PostHogUserProperties>;
  },
) {
  const posthog = PostHogClient();

  try {
    posthog.identify({
      distinctId: userId,
      properties: {
        $set_once: {
          account_created_at: userProfile.created_at,
          initial_role: userProfile.role,
          ...options?.setOnce,
        },
        $set: {
          email: userProfile.email,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          role: userProfile.role,
          clerk_user_id: userProfile.clerk_user_id,
          clinic_name: userProfile.clinic_name,
          onboarding_completed: userProfile.onboarding_completed,
        },
      },
    });

    await posthog.flush();
  } catch (error) {
    console.error("[PostHog] Server identify error:", error);
  }
}

/**
 * Set group properties on server-side
 *
 * Updates clinic group properties in PostHog.
 *
 * @param clinicId - Clinic ID
 * @param clinicData - Full or partial clinic data
 *
 * @example
 * ```typescript
 * // After subscription tier changes
 * await setClinicGroupServer(clinicId, {
 *   subscription_tier: 'premium',
 *   subscription_status: 'active',
 * });
 * ```
 */
export async function setClinicGroupServer(
  clinicId: string,
  clinicData: Partial<ClinicRow>,
) {
  const posthog = PostHogClient();

  try {
    posthog.groupIdentify({
      groupType: "clinic",
      groupKey: clinicId,
      properties: {
        name: clinicData.name,
        slug: clinicData.slug,
        subscription_tier: clinicData.subscription_tier,
        subscription_status: clinicData.subscription_status,
        is_active: clinicData.is_active,
        pims_type: clinicData.pims_type,
        phone: clinicData.phone,
        email: clinicData.email,
        timezone: clinicData.timezone,
      },
    });

    await posthog.flush();
  } catch (error) {
    console.error("[PostHog] Server group identify error:", error);
  }
}

/**
 * Associate user with clinic group on server-side
 *
 * Links a user to a clinic group by capturing a group event.
 * This is useful when user-clinic associations change.
 *
 * @param userId - User ID
 * @param clinicId - Clinic ID
 *
 * @example
 * ```typescript
 * // When user joins a new clinic
 * await associateUserWithClinicServer(userId, newClinicId);
 * ```
 */
export async function associateUserWithClinicServer(
  userId: string,
  clinicId: string,
) {
  const posthog = PostHogClient();

  try {
    // Capture an event to create the association
    posthog.capture({
      distinctId: userId,
      event: "$group_identify",
      properties: {
        $group_type: "clinic",
        $group_key: clinicId,
      },
    });

    await posthog.flush();
  } catch (error) {
    console.error("[PostHog] Server group association error:", error);
  }
}

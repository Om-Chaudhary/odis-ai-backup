"use client";

import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import type { Database } from "@odis-ai/shared/types";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type ClinicRow = Database["public"]["Tables"]["clinics"]["Row"];

interface PostHogIdentifyProps {
  userId: string | null;
  userProfile: UserProfile | null;
  clinicId: string | null;
  clinicData: ClinicRow | null;
}

/**
 * PostHog User Identification & Group Analytics Hook
 *
 * Identifies users and associates them with clinic groups for PostHog analytics.
 *
 * Features:
 * - Identifies users with posthog.identify() on authentication
 * - Sets person properties ($set_once for immutable, $set for mutable)
 * - Associates users with clinic groups via posthog.group()
 * - Handles clinic switching (admins can switch between clinics)
 * - Resets on logout with posthog.reset()
 * - Supports both Clerk and Supabase Auth users
 *
 * @param userId - User ID (null if not authenticated)
 * @param userProfile - Full user profile from database
 * @param clinicId - Current clinic ID
 * @param clinicData - Full clinic data from database
 *
 * @example
 * ```tsx
 * usePostHogIdentify({
 *   userId: user.id,
 *   userProfile: profile,
 *   clinicId: clinic?.id ?? null,
 *   clinicData: clinic ?? null,
 * });
 * ```
 */
export function usePostHogIdentify({
  userId,
  userProfile,
  clinicId,
  clinicData,
}: PostHogIdentifyProps) {
  const posthog = usePostHog();
  const hasIdentified = useRef<string | null>(null);
  const currentGroup = useRef<string | null>(null);

  useEffect(() => {
    // Skip if PostHog not available or no user
    if (!posthog || !userId || !userProfile) {
      return;
    }

    // Only identify once per user (unless user changes)
    if (hasIdentified.current === userId) {
      // Check if clinic changed (for group updates when admin switches clinics)
      if (clinicId && clinicId !== currentGroup.current && clinicData) {
        posthog.group("clinic", clinicId, {
          name: clinicData.name,
          slug: clinicData.slug,
          subscription_tier: clinicData.subscription_tier,
          subscription_status: clinicData.subscription_status,
          is_active: clinicData.is_active,
          pims_type: clinicData.pims_type,
          phone: clinicData.phone,
          email: clinicData.email,
          timezone: clinicData.timezone,
        });
        currentGroup.current = clinicId;
      }
      return;
    }

    // Identify user with person properties
    posthog.identify(userId, {
      // Immutable properties (set once) - never change after account creation
      $set_once: {
        account_created_at: userProfile.created_at,
        initial_role: userProfile.role,
      },
      // Mutable properties (update on every identify) - can change over time
      $set: {
        email: userProfile.email,
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        role: userProfile.role,
        clerk_user_id: userProfile.clerk_user_id,
        clinic_name: userProfile.clinic_name, // Legacy field
        onboarding_completed: userProfile.onboarding_completed,
      },
    });

    hasIdentified.current = userId;

    // Set up group analytics (clinic)
    if (clinicId && clinicData) {
      posthog.group("clinic", clinicId, {
        name: clinicData.name,
        slug: clinicData.slug,
        subscription_tier: clinicData.subscription_tier,
        subscription_status: clinicData.subscription_status,
        is_active: clinicData.is_active,
        pims_type: clinicData.pims_type,
        phone: clinicData.phone,
        email: clinicData.email,
        timezone: clinicData.timezone,
      });
      currentGroup.current = clinicId;
    }
  }, [posthog, userId, userProfile, clinicId, clinicData]);

  // Handle logout (reset PostHog state)
  useEffect(() => {
    if (!userId && hasIdentified.current) {
      posthog?.reset();
      hasIdentified.current = null;
      currentGroup.current = null;
    }
  }, [userId, posthog]);
}

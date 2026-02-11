"use client";

import { usePostHogIdentify } from "~/hooks/usePostHogIdentify";
import type { Database } from "@odis-ai/shared/types";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type ClinicRow = Database["public"]["Tables"]["clinics"]["Row"];

interface PostHogIdentifierProps {
  userId: string;
  userProfile: UserProfile;
  clinicId: string | null;
  clinicData: ClinicRow | null;
}

/**
 * PostHog User & Group Identifier
 *
 * Handles user identification and clinic group association for dashboard analytics.
 * Renders nothing - purely for analytics setup.
 *
 * Mount in dashboard layout to ensure user is identified before any events are tracked.
 *
 * @example
 * ```tsx
 * // In dashboard layout
 * <PostHogIdentifier
 *   userId={user.id}
 *   userProfile={profile}
 *   clinicId={clinic?.id ?? null}
 *   clinicData={clinic ?? null}
 * />
 * ```
 */
export function PostHogIdentifier({
  userId,
  userProfile,
  clinicId,
  clinicData,
}: PostHogIdentifierProps) {
  usePostHogIdentify({
    userId,
    userProfile,
    clinicId,
    clinicData,
  });

  // This component renders nothing - it's purely for analytics
  return null;
}

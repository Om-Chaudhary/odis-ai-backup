/**
 * Hook for fetching and using clinic schedule data
 *
 * Fetches clinic operating hours and blocked periods,
 * and provides a function to determine business hours status for any timestamp.
 *
 * NOTE: Uses settings.schedule queries as the single source of truth
 * This ensures consistency between settings UI and inbound table dividers
 */

import { useCallback } from "react";
import { api } from "~/trpc/client";
import {
  getBusinessHoursStatus,
  type BusinessHoursStatus,
} from "../table/business-hours-badge";

interface UseClinicScheduleOptions {
  clinicId: string | undefined;
}

export function useClinicSchedule({ clinicId }: UseClinicScheduleOptions) {
  // Use settings queries as single source of truth
  const { data: scheduleConfig } = api.settings.schedule.getScheduleConfig.useQuery(
    { clinicId },
    {
      enabled: !!clinicId,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    },
  );

  // Get ONLY ACTIVE blocked periods (matches settings UI behavior)
  const { data: blockedPeriods = [], isLoading } =
    api.settings.schedule.getBlockedPeriods.useQuery(
      { clinicId, activeOnly: true },
      {
        enabled: !!clinicId,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      },
    );

  const getStatus = useCallback(
    (timestamp: Date | string): BusinessHoursStatus => {
      if (!scheduleConfig) {
        // Default to "active" if no data available
        return { type: "active" };
      }

      return getBusinessHoursStatus(
        timestamp,
        {
          daily_hours: scheduleConfig.daily_hours,
          timezone: scheduleConfig.timezone,
        },
        blockedPeriods,
      );
    },
    [scheduleConfig, blockedPeriods],
  );

  return {
    scheduleConfig,
    blockedPeriods,
    isLoading,
    getStatus,
  };
}

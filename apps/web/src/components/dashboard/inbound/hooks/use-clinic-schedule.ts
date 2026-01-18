/**
 * Hook for fetching and using clinic schedule data
 *
 * Fetches clinic operating hours and blocked periods,
 * and provides a function to determine business hours status for any timestamp.
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
  const { data, isLoading } = api.inbound.getClinicSchedule.useQuery(
    { clinicId: clinicId! },
    {
      enabled: !!clinicId,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    },
  );

  const getStatus = useCallback(
    (timestamp: Date | string): BusinessHoursStatus => {
      if (!data) {
        // Default to "active" if no data available
        return "active";
      }

      return getBusinessHoursStatus(
        timestamp,
        data.scheduleConfig,
        data.blockedPeriods,
      );
    },
    [data],
  );

  return {
    scheduleConfig: data?.scheduleConfig,
    blockedPeriods: data?.blockedPeriods,
    isLoading,
    getStatus,
  };
}

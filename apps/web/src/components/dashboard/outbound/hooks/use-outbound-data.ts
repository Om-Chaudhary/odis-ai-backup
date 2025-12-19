/**
 * Custom hook for fetching outbound discharge data
 */

import { useRef, useEffect } from "react";
import { api } from "~/trpc/client";

interface UseOutboundDataParams {
  page: number;
  pageSize: number;
  searchTerm: string;
  startDate: string;
  endDate: string;
  consultationId?: string | null;
}

/**
 * Hook for managing outbound data queries
 * Handles cases, stats, settings, and deep linking
 */
export function useOutboundData(params: UseOutboundDataParams) {
  const { page, pageSize, searchTerm, startDate, endDate, consultationId } =
    params;

  const casesRef = useRef<Array<{ status: string }>>([]);

  // Fetch cases
  const {
    data: casesData,
    isLoading,
    refetch,
  } = api.outbound.listDischargeCases.useQuery(
    {
      page,
      pageSize,
      search: searchTerm || undefined,
      startDate,
      endDate,
    },
    {
      refetchInterval: () => {
        const hasActive = casesRef.current.some(
          (c) => c.status === "in_progress",
        );
        return hasActive ? 5000 : 30000;
      },
    },
  );

  // Fetch stats
  const { data: statsData } = api.outbound.getDischargeCaseStats.useQuery({
    startDate,
    endDate,
  });

  // Fetch discharge settings (for test mode indicator)
  const { data: settingsData } = api.cases.getDischargeSettings.useQuery();

  // Deep link: Find case by IDEXX consultation ID
  const { data: deepLinkData, isLoading: isDeepLinkLoading } =
    api.outbound.findByConsultationId.useQuery(
      { consultationId: consultationId ?? "", pageSize },
      {
        enabled: !!consultationId,
        staleTime: Infinity,
      },
    );

  // Update ref when data changes
  useEffect(() => {
    if (casesData?.cases) {
      casesRef.current = casesData.cases as Array<{ status: string }>;
    }
  }, [casesData?.cases]);

  const cases = casesData?.cases ?? [];
  const totalCases =
    casesData?.pagination?.total ?? (cases as unknown[]).length;

  return {
    cases,
    totalCases,
    stats: statsData,
    settings: settingsData,
    deepLinkData,
    isDeepLinkLoading,
    isLoading,
    refetch,
    currentPagination: casesData?.pagination ?? {
      page: 1,
      pageSize: 25,
      total: 0,
    },
  };
}

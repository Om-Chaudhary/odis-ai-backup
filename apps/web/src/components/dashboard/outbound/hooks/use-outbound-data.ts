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
  /** Direct case ID for deep linking (e.g., from IDEXX Neo extension) */
  caseId?: string | null;
  /** Current view mode - needed to fetch previous attention date when in needs_attention view */
  viewMode?: "all" | "needs_review" | "needs_attention";
  /** Clinic slug for admin users viewing a specific clinic's data */
  clinicSlug?: string;
}

/**
 * Hook for managing outbound data queries
 * Handles cases, stats, settings, and deep linking
 */
export function useOutboundData(params: UseOutboundDataParams) {
  const {
    page,
    pageSize,
    searchTerm,
    startDate,
    endDate,
    consultationId,
    caseId,
    viewMode,
    clinicSlug,
  } = params;

  const casesRef = useRef<Array<{ status: string }>>([]);

  // For needs_attention mode, we skip date filtering to show ALL needs attention cases
  const isNeedsAttentionMode = viewMode === "needs_attention";

  // Fetch cases
  // When in needs_attention mode, don't pass dates - server returns all needs attention cases
  const {
    data: casesData,
    isLoading,
    refetch,
  } = api.outbound.listDischargeCases.useQuery(
    {
      page,
      pageSize,
      search: searchTerm || undefined,
      clinicSlug,
      // Only pass dates if NOT in needs_attention mode
      ...(isNeedsAttentionMode
        ? { viewMode: "needs_attention" }
        : { startDate, endDate }),
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
  // For needs_attention, we still want date-filtered stats for other counts
  const { data: statsData } = api.outbound.getDischargeCaseStats.useQuery({
    startDate,
    endDate,
    clinicSlug,
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

  // Deep link: Get case directly by ID (for IDEXX Neo extension)
  const { data: caseByIdData, isLoading: isCaseByIdLoading } =
    api.outbound.getCaseById.useQuery(
      { id: caseId ?? "" },
      {
        enabled: !!caseId,
        staleTime: Infinity,
      },
    );

  // Previous attention date navigation is no longer needed since we show all attention cases
  // Keep the query disabled but retain the return values for backwards compatibility
  const previousAttentionData = null;
  const isPreviousAttentionLoading = false;

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
    // Direct case ID deep link
    caseByIdData,
    isCaseByIdLoading,
    isLoading,
    refetch,
    currentPagination: casesData?.pagination ?? {
      page: 1,
      pageSize: 25,
      total: 0,
    },
    // Previous attention date navigation is deprecated - we now show all attention cases
    // Keeping these for backwards compatibility with any components that may reference them
    previousAttentionDate: previousAttentionData,
    previousAttentionCount: 0,
    hasPreviousAttention: false,
    isPreviousAttentionLoading,
  };
}

import { getSupabaseClient, logger, fetchCasesByDate } from '@odis-ai/extension/shared';
import { useEffect, useState, useRef } from 'react';
import type { Tables } from '@database-types';

const useCasesLogger = logger.child('[useCases]');

type Case = Tables<'cases'>;
type Patient = Tables<'patients'>;

interface CaseWithPatient extends Case {
  patients?: Patient[];
}

const FETCH_TIMEOUT = 10000; // 10 seconds timeout

/**
 * Create a promise that rejects after a timeout
 */
const createTimeoutPromise = (timeoutMs: number): Promise<never> =>
  new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout: Failed to fetch cases after ${timeoutMs}ms`));
    }, timeoutMs);
  });

export const useCases = (selectedDate: Date) => {
  const [cases, setCases] = useState<CaseWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCases = async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear any existing loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Safety net: Force clear loading after timeout + buffer (15 seconds total)
    // This ensures loading is ALWAYS cleared even if something goes wrong
    loadingTimeoutRef.current = setTimeout(() => {
      useCasesLogger.warn('Loading state force-cleared after timeout buffer');
      setLoading(false);
    }, FETCH_TIMEOUT + 5000);

    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseClient();

      // Fetch cases with timeout
      const fetchPromise = fetchCasesByDate(supabase, selectedDate, {
        select: '*, patients (*)',
        orderBy: 'scheduled_at',
        orderDirection: 'descending',
      });

      // Race between fetch and timeout
      const data = await Promise.race([fetchPromise, createTimeoutPromise(FETCH_TIMEOUT)]);

      // Check if request was aborted
      if (abortController.signal.aborted) {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setLoading(false);
        return;
      }

      setCases((data as CaseWithPatient[]) || []);
    } catch (err) {
      // Ignore abort errors - but still clear loading
      if (abortController.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setLoading(false);
        return;
      }

      useCasesLogger.error('Error fetching cases', { error: err });
      const errorMessage =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Failed to fetch cases. Please try again.';
      setError(errorMessage);
      setCases([]);
    } finally {
      // Clear the safety timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      // ALWAYS clear loading state, regardless of success, error, or abort
      // This ensures the UI is never stuck in a loading state
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();

    // Cleanup: abort request and clear timeouts if component unmounts or date changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      // Ensure loading is cleared on cleanup
      setLoading(false);
    };
  }, [selectedDate]);

  return {
    cases,
    loading,
    error,
    refetch: fetchCases,
  };
};

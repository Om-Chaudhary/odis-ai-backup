import { getStartOfDay, getEndOfDay } from "./dateUtils";
import { requireAuthSession } from "./supabase-auth";
import type { Database } from "../types/database-types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Case = Database["public"]["Tables"]["cases"]["Row"];

export interface CasesQueryOptions {
  /**
   * Start date for filtering cases by scheduled_at
   * If provided, filters cases where scheduled_at >= startDate
   */
  startDate?: Date;

  /**
   * End date for filtering cases by scheduled_at
   * If provided, filters cases where scheduled_at <= endDate
   */
  endDate?: Date;

  /**
   * Filter cases by source(s)
   * Can be a single source string or array of sources
   */
  sources?: string | string[];

  /**
   * Filter cases by user_id
   * If not provided, uses the current authenticated user's ID
   */
  userId?: string;

  /**
   * Fields to select from cases table
   * Default: '*' (all fields)
   * Can include joins like '*, patients (*)'
   */
  select?: string;

  /**
   * Order by field
   * Default: 'scheduled_at'
   */
  orderBy?: string;

  /**
   * Order direction
   * Default: 'ascending'
   */
  orderDirection?: "ascending" | "descending";

  /**
   * Limit number of results
   */
  limit?: number;

  /**
   * Additional filters as a callback function
   * Allows for custom filtering logic
   */
  customFilter?: <T>(query: T) => T;
}

/**
 * Build a Supabase query for cases table with common filters
 * Returns a query builder that can be further customized
 *
 * @param supabase - Supabase client instance
 * @param options - Query options for filtering and ordering
 * @returns Supabase query builder
 *
 * @example
 * ```typescript
 * const supabase = getSupabaseClient();
 * const query = buildCasesQuery(supabase, {
 *   startDate: getStartOfDay(),
 *   endDate: getEndOfDay(),
 *   sources: ['idexx_neo', 'manual'],
 *   orderBy: 'scheduled_at',
 *   orderDirection: 'ascending'
 * });
 * const { data, error } = await query;
 * ```
 */
export const buildCasesQuery = (
  supabase: SupabaseClient<Database>,
  options: CasesQueryOptions = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  const {
    startDate,
    endDate,
    sources,
    userId,
    select = "*",
    orderBy = "scheduled_at",
    orderDirection = "ascending",
    limit,
    customFilter,
  } = options;

  let query = supabase.from("cases").select(select);

  // Filter by user_id (defaults to current user if not provided)
  if (userId) {
    query = query.eq("user_id", userId);
  }

  // Filter by date range
  if (startDate) {
    query = query.gte("scheduled_at", startDate.toISOString());
  }

  if (endDate) {
    query = query.lte("scheduled_at", endDate.toISOString());
  }

  // Filter by source(s)
  if (sources) {
    if (Array.isArray(sources)) {
      query = query.in("source", sources);
    } else {
      query = query.eq("source", sources);
    }
  }

  // Apply custom filters if provided
  if (customFilter) {
    query = customFilter(query);
  }

  // Order results
  query = query.order(orderBy, { ascending: orderDirection === "ascending" });

  // Apply limit if provided
  if (limit) {
    query = query.limit(limit);
  }

  return query;
};

/**
 * Fetch cases for a date range with common filters
 * Automatically uses the current authenticated user's ID
 *
 * @param supabase - Supabase client instance
 * @param startDate - Start date for filtering (inclusive)
 * @param endDate - End date for filtering (inclusive)
 * @param options - Additional query options
 * @returns Promise<Case[]> Array of cases
 *
 * @example
 * ```typescript
 * const supabase = getSupabaseClient();
 * const cases = await fetchCasesByDateRange(
 *   supabase,
 *   getStartOfDay(),
 *   getEndOfDay(),
 *   { sources: ['idexx_neo', 'manual'] }
 * );
 * ```
 */
export const fetchCasesByDateRange = async (
  supabase: SupabaseClient<Database>,
  startDate: Date,
  endDate: Date,
  options: Omit<CasesQueryOptions, "startDate" | "endDate" | "userId"> = {},
): Promise<Case[]> => {
  // Ensure user is authenticated
  const session = await requireAuthSession();

  const query = buildCasesQuery(supabase, {
    ...options,
    startDate,
    endDate,
    userId: session.user.id,
  });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch cases: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return data as unknown as Case[];
};

/**
 * Fetch cases for today with common filters
 * Convenience function that uses getStartOfDay() and getEndOfDay()
 *
 * @param supabase - Supabase client instance
 * @param options - Additional query options
 * @returns Promise<Case[]> Array of cases
 *
 * @example
 * ```typescript
 * const supabase = getSupabaseClient();
 * const todayCases = await fetchTodayCases(supabase, {
 *   sources: ['idexx_neo', 'manual']
 * });
 * ```
 */
export const fetchTodayCases = async (
  supabase: SupabaseClient<Database>,
  options: Omit<CasesQueryOptions, "startDate" | "endDate" | "userId"> = {},
): Promise<Case[]> =>
  fetchCasesByDateRange(supabase, getStartOfDay(), getEndOfDay(), options);

/**
 * Fetch cases for a specific date
 * Uses start and end of the provided date
 *
 * @param supabase - Supabase client instance
 * @param date - Date to fetch cases for
 * @param options - Additional query options
 * @returns Promise<Case[]> Array of cases
 *
 * @example
 * ```typescript
 * const supabase = getSupabaseClient();
 * const dateCases = await fetchCasesByDate(supabase, new Date('2024-01-15'), {
 *   select: '*, patients (*)'
 * });
 * ```
 */
export const fetchCasesByDate = async (
  supabase: SupabaseClient<Database>,
  date: Date,
  options: Omit<CasesQueryOptions, "startDate" | "endDate" | "userId"> = {},
): Promise<Case[]> => {
  const startOfDay = getStartOfDay(date);
  const endOfDay = getEndOfDay(date);
  return fetchCasesByDateRange(supabase, startOfDay, endOfDay, options);
};

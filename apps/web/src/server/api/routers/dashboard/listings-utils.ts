/**
 * Dashboard Listings Utilities
 *
 * Helper functions for building queries, enriching data, and paginating results.
 * Extracted from listings.ts to improve readability and maintainability.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { TRPCError } from "@trpc/server";
import type { Database } from "@odis-ai/shared/types";
import type { CaseWithPatients } from "./types";

/**
 * Related data types for cases - using Database schema types for type safety
 */
type SoapNote = Pick<
  Database["public"]["Tables"]["soap_notes"]["Row"],
  "case_id" | "id" | "created_at"
>;
type DischargeSummary = Pick<
  Database["public"]["Tables"]["discharge_summaries"]["Row"],
  "case_id" | "id" | "created_at"
>;
type Call = Pick<
  Database["public"]["Tables"]["scheduled_discharge_calls"]["Row"],
  "case_id" | "id" | "created_at" | "ended_at"
>;
type Email = Pick<
  Database["public"]["Tables"]["scheduled_discharge_emails"]["Row"],
  "case_id" | "id" | "created_at" | "sent_at"
>;

/**
 * Enriched case with related data
 */
type EnrichedCase = {
  id: string;
  status: string | null;
  source: string | null;
  type: string | null;
  created_at: string | null;
  scheduled_at: string | null;
  is_starred: boolean;
  patient: {
    id: string;
    name: string;
    species: string;
    owner_name: string;
  };
  hasSoapNote: boolean;
  hasDischargeSummary: boolean;
  hasDischargeCall: boolean;
  hasDischargeEmail: boolean;
  soapNoteTimestamp?: string;
  dischargeSummaryTimestamp?: string;
  dischargeCallTimestamp?: string;
  dischargeEmailTimestamp?: string;
};

/**
 * Batch fetch related data for cases
 *
 * Fetches SOAP notes, discharge summaries, calls, and emails
 * for all case IDs in a single round-trip to avoid N+1 queries.
 *
 * @param caseIds - Array of case IDs to fetch related data for
 * @param supabase - Supabase client
 * @returns Promise resolving to related data arrays
 */
export async function fetchRelatedData(
  caseIds: string[],
  supabase: SupabaseClient,
) {
  if (caseIds.length === 0) {
    return {
      soapNotes: [],
      dischargeSummaries: [],
      calls: [],
      emails: [],
    };
  }

  const [
    { data: soapNotes },
    { data: dischargeSummaries },
    { data: calls },
    { data: emails },
  ] = await Promise.all([
    supabase
      .from("soap_notes")
      .select("case_id, id, created_at")
      .in("case_id", caseIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("discharge_summaries")
      .select("case_id, id, created_at")
      .in("case_id", caseIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("scheduled_discharge_calls")
      .select("case_id, id, created_at, ended_at")
      .in("case_id", caseIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("scheduled_discharge_emails")
      .select("case_id, id, created_at, sent_at")
      .in("case_id", caseIds)
      .order("created_at", { ascending: false }),
  ]);

  return {
    soapNotes: (soapNotes ?? []) as SoapNote[],
    dischargeSummaries: (dischargeSummaries ?? []) as DischargeSummary[],
    calls: (calls ?? []) as Call[],
    emails: (emails ?? []) as Email[],
  };
}

/**
 * Group related data by case_id for efficient lookup
 *
 * Creates Maps with case_id as key and the latest record as value.
 * Data is already ordered by created_at desc, so we take the first occurrence.
 *
 * @param relatedData - Object containing arrays of related data
 * @returns Object with Maps for each data type
 */
export function groupRelatedDataByCase(relatedData: {
  soapNotes: SoapNote[];
  dischargeSummaries: DischargeSummary[];
  calls: Call[];
  emails: Email[];
}) {
  const soapNotesByCase = new Map<string, SoapNote>();
  const dischargeSummariesByCase = new Map<string, DischargeSummary>();
  const callsByCase = new Map<string, Call>();
  const emailsByCase = new Map<string, Email>();

  // Get latest entry for each case (data is already ordered by created_at desc)
  for (const note of relatedData.soapNotes) {
    if (note?.case_id && !soapNotesByCase.has(note.case_id)) {
      soapNotesByCase.set(note.case_id, note);
    }
  }

  for (const summary of relatedData.dischargeSummaries) {
    if (
      summary?.case_id &&
      !dischargeSummariesByCase.has(summary.case_id)
    ) {
      dischargeSummariesByCase.set(summary.case_id, summary);
    }
  }

  for (const call of relatedData.calls) {
    if (call?.case_id && !callsByCase.has(call.case_id)) {
      callsByCase.set(call.case_id, call);
    }
  }

  for (const email of relatedData.emails) {
    if (email?.case_id && !emailsByCase.has(email.case_id)) {
      emailsByCase.set(email.case_id, email);
    }
  }

  return {
    soapNotesByCase,
    dischargeSummariesByCase,
    callsByCase,
    emailsByCase,
  };
}

/**
 * Enrich cases with related data
 *
 * Combines case data with SOAP notes, discharge summaries, calls, and emails.
 * Adds boolean flags and timestamps for each related data type.
 *
 * @param cases - Array of cases to enrich
 * @param groupedData - Maps of related data grouped by case_id
 * @returns Array of enriched cases
 */
export function enrichCasesWithRelatedData(
  cases: CaseWithPatients[],
  groupedData: {
    soapNotesByCase: Map<string, SoapNote>;
    dischargeSummariesByCase: Map<string, DischargeSummary>;
    callsByCase: Map<string, Call>;
    emailsByCase: Map<string, Email>;
  },
): EnrichedCase[] {
  return cases.map((c) => {
    const soapNote = groupedData.soapNotesByCase.get(c.id);
    const dischargeSummary = groupedData.dischargeSummariesByCase.get(c.id);
    const call = groupedData.callsByCase.get(c.id);
    const email = groupedData.emailsByCase.get(c.id);

    const patients = c.patients ?? [];
    const patient = patients[0];

    // Get latest timestamps (use ended_at for calls, sent_at for emails, created_at for others)
    const soapNoteTimestamp = soapNote?.created_at;
    const dischargeSummaryTimestamp = dischargeSummary?.created_at;
    const dischargeCallTimestamp = call?.ended_at ?? call?.created_at;
    const dischargeEmailTimestamp = email?.sent_at ?? email?.created_at;

    return {
      id: c.id,
      status: c.status,
      source: c.source,
      type: c.type,
      created_at: c.created_at,
      scheduled_at: c.scheduled_at,
      is_starred: c.is_starred ?? false,
      patient: {
        id: patient?.id ?? "",
        name: patient?.name ?? "Unknown",
        species: patient?.species ?? "Unknown",
        owner_name: patient?.owner_name ?? "Unknown",
      },
      hasSoapNote: !!soapNote,
      hasDischargeSummary: !!dischargeSummary,
      hasDischargeCall: !!call,
      hasDischargeEmail: !!email,
      soapNoteTimestamp,
      dischargeSummaryTimestamp,
      dischargeCallTimestamp,
      dischargeEmailTimestamp,
    };
  });
}

/**
 * Apply client-side filters to enriched cases
 *
 * Filters by search term (patient/owner name), missing discharge, and missing SOAP.
 *
 * @param cases - Array of enriched cases
 * @param filters - Filter options
 * @returns Filtered array of cases
 */
export function filterEnrichedCases(
  cases: EnrichedCase[],
  filters: {
    search?: string;
    missingDischarge?: boolean;
    missingSoap?: boolean;
  },
): EnrichedCase[] {
  let filteredCases = cases;

  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredCases = filteredCases.filter(
      (c) =>
        c.patient.name.toLowerCase().includes(searchLower) ||
        (c.patient.owner_name?.toLowerCase() ?? "").includes(searchLower),
    );
  }

  // Apply missing discharge filter
  if (filters.missingDischarge === true) {
    filteredCases = filteredCases.filter((c) => !c.hasDischargeSummary);
  }

  // Apply missing SOAP filter
  if (filters.missingSoap === true) {
    filteredCases = filteredCases.filter((c) => !c.hasSoapNote);
  }

  return filteredCases;
}

/**
 * Apply pagination to filtered results
 *
 * Slices the array based on page number and page size.
 *
 * @param cases - Array of filtered cases
 * @param page - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Paginated slice of cases
 */
export function paginateResults<T>(
  cases: T[],
  page: number,
  pageSize: number,
): T[] {
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  return cases.slice(from, to);
}

/**
 * Fetch cases from database with filters and optional pagination
 *
 * @param supabase - Supabase client
 * @param filters - Query filters
 * @param options - Pagination and sorting options
 * @returns Promise resolving to cases and count
 */
export async function fetchCasesBatch(
  supabase: SupabaseClient,
  filters: {
    clinicScopeFilter: string;
    status?: string;
    source?: string;
    starred?: boolean;
    startIso?: string;
    endIso?: string;
  },
  options: {
    applyPagination: boolean;
    page?: number;
    pageSize?: number;
  },
): Promise<{ cases: CaseWithPatients[]; count: number | null }> {
  let query = supabase
    .from("cases")
    .select(
      `
        id,
        status,
        source,
        type,
        created_at,
        scheduled_at,
        is_starred,
        patients (
          id,
          name,
          species,
          owner_name
        )
      `,
      { count: "exact" },
    )
    .or(filters.clinicScopeFilter);

  // Apply filters
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.source) {
    query = query.eq("source", filters.source);
  }

  if (filters.starred === true) {
    query = query.eq("is_starred", true);
  }

  if (filters.startIso) {
    query = query.gte("created_at", filters.startIso);
  }

  if (filters.endIso) {
    query = query.lte("created_at", filters.endIso);
  }

  // Apply ordering
  query = query.order("created_at", { ascending: false });

  // Apply pagination if requested
  if (options.applyPagination && options.page && options.pageSize) {
    const from = (options.page - 1) * options.pageSize;
    const to = from + options.pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch cases",
      cause: error,
    });
  }

  return {
    cases: (data as CaseWithPatients[]) ?? [],
    count,
  };
}

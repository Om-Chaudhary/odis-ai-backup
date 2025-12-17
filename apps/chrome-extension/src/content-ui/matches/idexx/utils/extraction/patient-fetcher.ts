import { getSupabaseClient, logger, getCurrentISOString, requireAuthSession } from '@odis-ai/extension-shared';
import type { Tables } from '@database-types';

const odisLogger = logger.child('[ODIS]');

type Patient = Tables<'patients'>;
type Case = Tables<'cases'>;

const getSupabaseErrorCode = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as Record<string, unknown>).code;
    if (typeof code === 'string') return code;
  }
  return undefined;
};

/**
 * Search for patients by name across ALL user's patients and return the newest match
 *
 * IMPORTANT: Always scoped to current user via RLS on cases table.
 * Uses direct patient name search (case-insensitive) joined to cases for efficiency.
 *
 * Returns array with single patient (newest match) or empty array if no match found.
 */
const searchPatientsByName = async (searchTerm: string): Promise<PatientWithCase[]> => {
  const supabase = getSupabaseClient();

  // Ensure user is authenticated
  const session = await requireAuthSession();

  const normalizedSearchTerm = searchTerm.trim();

  // Search patients directly by name (case-insensitive) and join to cases
  // This is more efficient than loading all cases and avoids the 500 limit bug
  // RLS on cases table ensures we only see patients linked to user's cases
  const { data: matchingPatients, error: patientsError } = await supabase
    .from('patients')
    .select('id, name, case_id, cases!inner(id, user_id, created_at, updated_at)')
    .ilike('name', normalizedSearchTerm) // Case-insensitive exact match
    .eq('cases.user_id', session.user.id) // Filter by current user's cases
    .order('cases(updated_at)', { ascending: false }) // Most recent case first
    .limit(1); // We only need the most recent match

  if (patientsError) {
    odisLogger.error('❌ Error searching for patients by name', { error: patientsError });
    if (getSupabaseErrorCode(patientsError) === 'PGRST116') return [];
    throw patientsError as unknown as Error;
  }

  if (!matchingPatients || matchingPatients.length === 0) {
    odisLogger.debug('No patient found with name', { searchTerm: normalizedSearchTerm });
    return [];
  }

  // Type the response
  const patient = matchingPatients[0] as unknown as {
    id: string;
    name: string | null;
    case_id: string | null;
    cases: {
      id: string;
      user_id: string | null;
      created_at: string | null;
      updated_at: string | null;
    };
  };

  const matchedPatient: PatientWithCase = {
    id: String(patient.id),
    name: patient.name || 'Unknown Patient',
    latest_case_id: String(patient.cases?.id ?? patient.case_id ?? ''),
    latest_case_date: patient.cases?.updated_at ?? patient.cases?.created_at ?? getCurrentISOString(),
  };

  odisLogger.debug('Found patient by name', {
    searchTerm: normalizedSearchTerm,
    patientId: matchedPatient.id,
    caseId: matchedPatient.latest_case_id,
  });

  return [matchedPatient];
};

/**
 * Fetch recent unique patients for the current authenticated user
 * Returns patients ordered by most recent case activity
 */
const fetchRecentPatients = async (limit: number = 10): Promise<PatientWithCase[]> => {
  const supabase = getSupabaseClient();

  // Ensure user is authenticated
  const session = await requireAuthSession();

  odisLogger.debug('Fetching recent patients from most recently modified cases', { userEmail: session.user.email });

  // Source of truth for recency is the cases table, ordered by last modification.
  // We fetch the most recently modified cases for the current user, join patients,
  // then deduplicate by patient to yield patients ordered by their latest case activity.
  // Note: patients.case_id references cases.id (one patient per case)
  const { data: recentCases, error: casesError } = await supabase
    .from('cases')
    .select(['id', 'created_at', 'updated_at', 'user_id', 'patients(id, name)'].join(', '))
    .eq('user_id', session.user.id)
    .not('patients', 'is', null)
    .order('updated_at', { ascending: false })
    // Over-fetch to allow per-patient de-duplication
    .limit(Math.max(limit * 5, 100));

  if (casesError) {
    odisLogger.error('Error fetching recent cases with patients join', { error: casesError });
    if (getSupabaseErrorCode(casesError) === 'PGRST116') return [];
    throw casesError as unknown as Error;
  }

  if (!recentCases || recentCases.length === 0) {
    return [];
  }

  const seenPatientIds = new Set<string>();
  const uniquePatients: PatientWithCase[] = [];

  const typedRecentCases = recentCases as unknown as Array<{
    id: string;
    created_at: string | null;
    updated_at: string | null;
    user_id: string | null;
    patients: Array<{ id: string; name: string | null }>;
  }>;

  for (const c of typedRecentCases) {
    // A case can have multiple patients, iterate through them
    const casePatients = c.patients || [];
    for (const patient of casePatients) {
      const patientId = patient?.id;
      if (!patientId || seenPatientIds.has(patientId)) continue;
      seenPatientIds.add(patientId);
      uniquePatients.push({
        id: String(patientId),
        name: patient?.name || 'Unknown Patient',
        latest_case_id: String(c.id ?? ''),
        // Use updated_at if available, otherwise fall back to created_at
        latest_case_date: c.updated_at ?? c.created_at ?? new Date().toISOString(),
      });

      if (uniquePatients.length >= limit) break;
    }
    if (uniquePatients.length >= limit) break;
  }

  return uniquePatients;
};

/**
 * Fetch the most recent discharge summary for a specific patient
 * Returns null if no discharge summary found
 */
const fetchPatientLatestDischargeSummary = async (patientId: string) => {
  const supabase = getSupabaseClient();

  // Ensure user is authenticated
  const session = await requireAuthSession();

  // Get the most recent discharge summary for any case linked to this patient
  const { data: summary, error: summaryError } = await supabase
    .from('discharge_summaries')
    .select('*, cases!inner(id, user_id, external_id, patients!inner(id, name))')
    .eq('cases.user_id', session.user.id)
    .eq('cases.patients.id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (summaryError) {
    // If no rows, return null
    const code = (summaryError as { code?: string } | null)?.code;
    if (code === 'PGRST116') return null;
    throw summaryError;
  }

  return summary;
};

/**
 * Fetch the most recent SOAP note for a specific patient
 * Returns null if no SOAP note found
 */
const fetchPatientLatestSoapNote = async (patientId: string) => {
  const supabase = getSupabaseClient();

  // Ensure user is authenticated
  const session = await requireAuthSession();

  // Get the most recent SOAP note for any case linked to this patient
  const { data: soapNote, error: soapError } = await supabase
    .from('soap_notes')
    .select('*, cases!inner(id, user_id, external_id, patients!inner(id, name))')
    .eq('cases.user_id', session.user.id)
    .eq('cases.patients.id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (soapError) {
    // If no rows, return null
    const code = (soapError as { code?: string } | null)?.code;
    if (code === 'PGRST116') return null;
    throw soapError;
  }

  return soapNote;
};

/**
 * Check if a case has transcriptions
 *
 * @param caseId - The case ID to check
 * @returns true if case has at least one transcription, false otherwise
 */
const checkCaseHasTranscriptions = async (caseId: string): Promise<boolean> => {
  const supabase = getSupabaseClient();

  // Count transcriptions for this case
  const { count, error } = await supabase
    .from('transcriptions')
    .select('id', { count: 'exact', head: true })
    .eq('case_id', caseId);

  if (error) {
    odisLogger.warn('Error checking transcriptions for case', { error, caseId });
    return false;
  }

  return (count ?? 0) > 0;
};

/**
 * Fetch patient by IDEXX consultation ID
 *
 * Primary lookup method for consultation pages. Uses the consultation_id stored
 * in case.metadata.idexx.consultation_id to find the associated patient.
 *
 * This is more reliable than name-based lookup because:
 * 1. It matches the exact consultation being viewed
 * 2. It doesn't depend on DOM name detection accuracy
 * 3. It works even when navigating between consultations (SPA navigation)
 *
 * Now only returns a patient if the case has transcriptions, ensuring that
 * auto-selection only happens when the user has created a case with transcriptions.
 *
 * @param consultationId - The IDEXX consultation ID (from URL or page)
 * @returns PatientWithCase if found and has transcriptions, null otherwise
 */
const fetchPatientByConsultationId = async (consultationId: string): Promise<PatientWithCase | null> => {
  const supabase = getSupabaseClient();

  // Ensure user is authenticated
  const session = await requireAuthSession();

  odisLogger.debug('Looking up patient by consultation ID', { consultationId, userId: session.user.id });

  // Query case by consultation_id in metadata, join to patients
  const { data: caseData, error: caseError } = await supabase
    .from('cases')
    .select('id, updated_at, created_at, patients(id, name)')
    .eq('metadata->idexx->>consultation_id', consultationId)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (caseError) {
    odisLogger.warn('Error fetching case by consultation ID', { error: caseError, consultationId });
    if (getSupabaseErrorCode(caseError) === 'PGRST116') return null;
    throw caseError as unknown as Error;
  }

  if (!caseData) {
    odisLogger.debug('No case found for consultation ID', { consultationId });
    return null;
  }

  // Check if case has transcriptions before proceeding
  const hasTranscriptions = await checkCaseHasTranscriptions(caseData.id);
  if (!hasTranscriptions) {
    odisLogger.debug('Case found but has no transcriptions, skipping auto-selection', {
      consultationId,
      caseId: caseData.id,
    });
    return null;
  }

  // Type the patients response
  const patients = caseData.patients as unknown as Array<{ id: string; name: string | null }> | null;
  const patient = patients?.[0];

  if (!patient) {
    odisLogger.debug('Case found but no patient linked', { consultationId, caseId: caseData.id });
    return null;
  }

  const result: PatientWithCase = {
    id: String(patient.id),
    name: patient.name || 'Unknown Patient',
    latest_case_id: String(caseData.id),
    latest_case_date: caseData.updated_at ?? caseData.created_at ?? getCurrentISOString(),
  };

  odisLogger.debug('Found patient by consultation ID with transcriptions', {
    consultationId,
    patientId: result.id,
    patientName: result.name,
    caseId: result.latest_case_id,
  });

  return result;
};

export type { Patient, Case };
export {
  searchPatientsByName,
  fetchRecentPatients,
  fetchPatientLatestDischargeSummary,
  fetchPatientLatestSoapNote,
  fetchPatientByConsultationId,
};

export interface PatientWithCase {
  id: string;
  name: string;
  latest_case_id: string;
  latest_case_date: string;
}

/**
 * Attempts to read the current patient's name from the Idexx (Neo) DOM.
 * Looks for the patient name element typically rendered as:
 * <span data-qa="patient-signalment-patient-name" class="spot-patient-display__pet-name">
 *   <a ...>Lady</a>
 * </span>
 */
export const detectIdexxPatientNameFromDom = (): string | null => {
  try {
    odisLogger.debug('🔍 Attempting to detect patient name from DOM...');

    // Try multiple selectors in order of specificity
    const selectors = [
      '[data-qa="patient-signalment-patient-name"].spot-patient-display__pet-name',
      '[data-qa="patient-signalment-patient-name"]',
      '.spot-patient-display__pet-name',
    ];

    for (const selector of selectors) {
      const container = document.querySelector(selector) as HTMLElement | null;
      if (container) {
        const anchor = container.querySelector('a');
        const raw = (anchor?.textContent ?? container.textContent ?? '').trim();

        if (raw) {
          // Normalize: collapse whitespace and strip trailing punctuation/spaces
          const normalized = raw.replace(/\s+/g, ' ').trim();
          return normalized;
        }
      }
    }

    return null;
  } catch (error) {
    odisLogger.error('❌ Error detecting patient name from DOM', { error });
    return null;
  }
};

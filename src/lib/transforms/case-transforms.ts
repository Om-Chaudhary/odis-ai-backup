import type { BackendCase, DashboardCase } from "~/types/dashboard";

/**
 * Partial BackendCase type for list queries that don't return all fields
 */
export type PartialBackendCase = Omit<
  BackendCase,
  "scheduled_discharge_calls"
> & {
  scheduled_discharge_calls: Array<{
    id: string;
    status: BackendCase["scheduled_discharge_calls"][number]["status"];
    scheduled_for: string | null;
    ended_at: string | null;
    vapi_call_id: string | null;
    transcript: string | null;
    recording_url: string | null;
    duration_seconds: number | null;
    created_at: string;
  }>;
};

/**
 * Transform backend case response to UI-friendly shape
 * - Picks first patient from patients array (should only be one due to !inner join)
 * - Picks latest discharge summary from array (most recent)
 * - Maps all scheduled calls and emails
 * - Handles null safety
 */
export function transformBackendCaseToDashboardCase(
  backendCase: BackendCase | PartialBackendCase,
): DashboardCase {
  // Get first patient (should only be one due to !inner join)
  const patient = backendCase.patients[0];
  if (!patient) {
    throw new Error(`Case ${backendCase.id} has no patient`);
  }

  // Get latest discharge summary (most recent)
  const dischargeSummary = backendCase.discharge_summaries?.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA; // Most recent first
  })[0];

  return {
    id: backendCase.id,
    status: backendCase.status,
    source: backendCase.source,
    type: backendCase.type,
    created_at: backendCase.created_at,
    scheduled_at: backendCase.scheduled_at,
    patient: {
      id: patient.id,
      name: patient.name ?? "Unknown Patient",
      species: patient.species ?? "Unknown Species",
      breed: patient.breed ?? "Unknown Breed",
      owner_name: patient.owner_name ?? "Unknown Owner",
      owner_email: patient.owner_email ?? "No email address",
      owner_phone: patient.owner_phone ?? "No phone number",
    },
    discharge_summary: dischargeSummary
      ? {
          id: dischargeSummary.id,
          content: dischargeSummary.content,
          created_at: dischargeSummary.created_at,
        }
      : undefined,
    scheduled_discharge_calls: backendCase.scheduled_discharge_calls
      .map((call) => ({
        id: call.id,
        status: call.status ?? "queued",
        scheduled_for: call.scheduled_for,
        ended_at: call.ended_at,
        vapi_call_id: call.vapi_call_id,
        transcript: call.transcript ?? null,
        recording_url: call.recording_url ?? null,
        duration_seconds: call.duration_seconds ?? null,
        created_at: call.created_at, // Use created_at from backend if available, otherwise it might be missing in types currently but we added it to query
      }))
      .sort((a, b) => {
        // Sort by created_at descending (newest first)
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }),
    scheduled_discharge_emails: backendCase.scheduled_discharge_emails
      .map((email) => ({
        id: email.id,
        status: email.status ?? "queued",
        scheduled_for: email.scheduled_for,
        sent_at: email.sent_at,
        created_at: email.created_at,
      }))
      .sort((a, b) => {
        // Sort by created_at descending (newest first)
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }),
  };
}

/**
 * Transform array of backend cases to dashboard cases
 */
export function transformBackendCasesToDashboardCases(
  backendCases: (BackendCase | PartialBackendCase)[],
): DashboardCase[] {
  return backendCases.map(transformBackendCaseToDashboardCase);
}

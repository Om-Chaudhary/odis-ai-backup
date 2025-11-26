import type { BackendCase, DashboardCase } from "~/types/dashboard";

/**
 * Transform backend case response to UI-friendly shape
 * - Picks first patient from patients array (should only be one due to !inner join)
 * - Picks latest discharge summary from array (most recent)
 * - Picks latest scheduled call from array (most recent)
 * - Picks latest scheduled email from array (most recent)
 * - Handles null safety
 */
export function transformBackendCaseToDashboardCase(
  backendCase: BackendCase,
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

  // Get latest scheduled call (most recent)
  const scheduledCall = backendCase.scheduled_discharge_calls.sort((a, b) => {
    const dateA = a.scheduled_for ? new Date(a.scheduled_for).getTime() : 0;
    const dateB = b.scheduled_for ? new Date(b.scheduled_for).getTime() : 0;
    return dateB - dateA; // Most recent first
  })[0];

  // Get latest scheduled email (most recent)
  const scheduledEmail = backendCase.scheduled_discharge_emails.sort((a, b) => {
    const dateA = a.scheduled_for ? new Date(a.scheduled_for).getTime() : 0;
    const dateB = b.scheduled_for ? new Date(b.scheduled_for).getTime() : 0;
    return dateB - dateA; // Most recent first
  })[0];

  return {
    id: backendCase.id,
    status: backendCase.status,
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
    scheduled_discharge_call: scheduledCall
      ? {
          id: scheduledCall.id,
          status: scheduledCall.status ?? "queued", // Default to "queued" if null
          scheduled_for: scheduledCall.scheduled_for,
          ended_at: scheduledCall.ended_at,
          vapi_call_id: scheduledCall.vapi_call_id,
        }
      : undefined,
    scheduled_discharge_email: scheduledEmail
      ? {
          id: scheduledEmail.id,
          status: scheduledEmail.status ?? "queued", // Default to "queued" if null
          scheduled_for: scheduledEmail.scheduled_for,
          sent_at: scheduledEmail.sent_at,
        }
      : undefined,
  };
}

/**
 * Transform array of backend cases to dashboard cases
 */
export function transformBackendCasesToDashboardCases(
  backendCases: BackendCase[],
): DashboardCase[] {
  return backendCases.map(transformBackendCaseToDashboardCase);
}

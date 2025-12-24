import { upsertPatientFromAppointment } from './patient-sync';
import { idexxApiClient } from '../../services/api/idexx-api-client';
import { fetchConsultationData } from '../extraction/consultation-fetcher';
import {
  getSupabaseClient,
  logger,
  requireAuthSession,
  buildCasesQuery,
  withTimeout,
  TimeoutError,
} from '@odis-ai/extension/shared';
import type { IdexxConsultationLine } from '../../types';
import type { ScheduleAppointment } from '../extraction/schedule-extractor';
import type { Database } from '@database-types';

const odisLogger = logger.child('[ODIS]');

type Case = Database['public']['Tables']['cases']['Row'];
type CaseInsert = Database['public']['Tables']['cases']['Insert'];
type CaseStatus = Database['public']['Enums']['CaseStatus'];

// Timeout constants for sync operations
const AUTH_TIMEOUT_MS = 10000; // 10 seconds for auth check
const PER_APPOINTMENT_TIMEOUT_MS = 15000; // 15 seconds per appointment
const OVERALL_SYNC_TIMEOUT_MS = 120000; // 2 minutes for entire sync
const CONSULTATION_FETCH_TIMEOUT_MS = 10000; // 10 seconds for consultation notes fetch

/**
 * Result of attempting to fetch consultation data (notes + products/services)
 */
interface ConsultationNotesResult {
  success: boolean;
  notes: string | null;
  consultationStatus?: string;
  productsServices?: string | null;
  declinedProductsServices?: string | null;
  error?: string;
}

/**
 * Format consultation line items (products/services) into a readable string
 * @param lines - Array of consultation line items
 * @param declinedOnly - If true, only return declined items; if false, only return accepted items
 * @returns Formatted string of products/services
 */
const formatProductsServices = (lines: IdexxConsultationLine[] | undefined, declinedOnly: boolean): string => {
  if (!lines || lines.length === 0) {
    return '';
  }

  const filtered = lines.filter(line => (declinedOnly ? line.isDeclined : !line.isDeclined));

  if (filtered.length === 0) {
    return '';
  }

  return filtered
    .map(line => {
      const parts = [line.productService];
      if (line.quantity && line.quantity !== 1) {
        parts.push(`(Qty: ${line.quantity})`);
      }
      return parts.join(' ');
    })
    .join('; ');
};

/**
 * Safely fetch consultation data (notes + products/services) from IDEXX consultation endpoint
 * Returns null data on failure but doesn't throw - allows sync to continue
 */
const fetchConsultationNotesForAppointment = async (
  consultationId: string | null,
  appointmentId: string,
): Promise<ConsultationNotesResult> => {
  // If no consultation ID, we can't fetch consultation data
  if (!consultationId) {
    odisLogger.debug('No consultation_id for appointment, skipping consultation data fetch', {
      appointmentId,
    });
    return { success: false, notes: null, error: 'No consultation_id available' };
  }

  try {
    odisLogger.debug('Fetching consultation data (notes + products/services)', {
      consultationId,
      appointmentId,
      timeoutMs: CONSULTATION_FETCH_TIMEOUT_MS,
    });

    // Fetch with timeout to prevent hanging
    const consultationData = await withTimeout(
      fetchConsultationData(consultationId),
      CONSULTATION_FETCH_TIMEOUT_MS,
      `fetchConsultationNotes_${consultationId}`,
    );

    // Extract notes from consultation data
    // IDEXX API structure: consultationNotes.notes or consultation.notes
    const consultationNotes = consultationData.consultationNotes as { notes?: string } | undefined;
    const rawNotes = consultationNotes?.notes || consultationData.consultation?.notes || '';

    // Extract products/services (billing line items)
    const productsServices = formatProductsServices(consultationData.consultationLines, false);
    const declinedProductsServices = formatProductsServices(consultationData.consultationLines, true);

    // Log what we found
    odisLogger.debug('🛒 Extracted consultation data', {
      consultationId,
      appointmentId,
      notesLength: rawNotes.length,
      hasProducts: !!productsServices,
      hasDeclinedProducts: !!declinedProductsServices,
      acceptedProductsPreview: productsServices?.substring(0, 100),
      declinedProductsPreview: declinedProductsServices?.substring(0, 100),
    });

    // Check if we have any data to sync
    const hasNotes = !!rawNotes.trim();
    const hasProducts = !!productsServices || !!declinedProductsServices;

    if (!hasNotes && !hasProducts) {
      odisLogger.debug('Consultation has no notes or products/services', {
        consultationId,
        appointmentId,
      });
      return {
        success: true,
        notes: null,
        consultationStatus: consultationData.consultation?.status,
        productsServices: null,
        declinedProductsServices: null,
      };
    }

    odisLogger.debug('Successfully fetched consultation data', {
      consultationId,
      appointmentId,
      notesLength: rawNotes.length,
      hasProducts,
    });

    return {
      success: true,
      notes: rawNotes || null,
      consultationStatus: consultationData.consultation?.status,
      productsServices: productsServices || null,
      declinedProductsServices: declinedProductsServices || null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = error instanceof TimeoutError;

    odisLogger.warn('Failed to fetch consultation data (non-fatal)', {
      consultationId,
      appointmentId,
      error: errorMessage,
      isTimeout,
    });

    return {
      success: false,
      notes: null,
      error: isTimeout ? `Timeout after ${CONSULTATION_FETCH_TIMEOUT_MS / 1000}s` : errorMessage,
    };
  }
};

/**
 * Check if an appointment should be synced (only finalized appointments)
 */
const shouldSyncAppointment = (appointment: ScheduleAppointment): boolean => {
  const status = appointment.status?.toLowerCase().trim() || '';

  // Only sync finalized/completed appointments
  return status === 'finalized' || status === 'completed' || status === 'finished' || status === 'done';
};

/**
 * Check if an appointment is a "no show"
 * These should not be synced, and if previously synced, should be deleted
 */
const isNoShowAppointment = (appointment: ScheduleAppointment): boolean => {
  const status = appointment.status?.toLowerCase().trim() || '';
  return status === 'no show' || status === 'no-show' || status === 'noshow';
};

/**
 * Map IDEXX appointment status to valid CaseStatus enum
 */
const mapAppointmentStatusToCaseStatus = (idexxStatus: string | null): CaseStatus => {
  const status = idexxStatus?.toLowerCase().trim() || '';

  // Map IDEXX statuses to valid database enum values
  switch (status) {
    case 'finalized':
    case 'completed':
    case 'finished':
    case 'done':
      return 'completed';

    case 'in progress':
    case 'in-progress':
    case 'ongoing':
    case 'active':
    case 'started':
      return 'ongoing';

    case 'reviewed':
    case 'checked':
      return 'reviewed';

    case 'scheduled':
    case 'pending':
    case 'upcoming':
    case 'booked':
    case 'draft':
    default:
      return 'draft';
  }
};

/**
 * Fetch appointments from IDEXX API and sync to Supabase
 * Creates both patient records and case records, including consultation data (clinical notes + products/services)
 *
 * This function has an overall timeout of 2 minutes to prevent hanging.
 */
const syncScheduleFromApi = async (startDate: Date, endDate: Date): Promise<SyncResult> => {
  const syncStartTime = Date.now();

  // GUARD: Ensure we are NOT running in an extension page context (like the dashboard)
  // Extension pages have an origin starting with chrome-extension://
  if (typeof window !== 'undefined' && window.location.origin.startsWith('chrome-extension://')) {
    const error = new Error(
      'syncScheduleFromApi called from extension context! This function must only be called from the content script.',
    );
    odisLogger.error('CRITICAL ERROR: syncScheduleFromApi called from extension context', {
      origin: window.location.origin,
      stack: error.stack,
    });
    throw error;
  }

  odisLogger.info('🟢 syncScheduleFromApi called', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
    hasDocument: typeof document !== 'undefined',
    documentLocation: typeof document !== 'undefined' ? document.location?.href : 'N/A',
    overallTimeoutMs: OVERALL_SYNC_TIMEOUT_MS,
  });

  try {
    // Wrap the entire sync operation with an overall timeout
    return await withTimeout(
      performSync(startDate, endDate, syncStartTime),
      OVERALL_SYNC_TIMEOUT_MS,
      'syncScheduleFromApi',
    );
  } catch (error) {
    const elapsed = Date.now() - syncStartTime;

    if (error instanceof TimeoutError) {
      odisLogger.error('🔴 Schedule sync timed out', {
        elapsedMs: elapsed,
        timeoutMs: OVERALL_SYNC_TIMEOUT_MS,
      });
      throw new Error(`Schedule sync timed out after ${Math.round(elapsed / 1000)} seconds. Please try again.`);
    }

    odisLogger.error('🔴 Schedule sync from API failed', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.name : undefined,
      elapsedMs: elapsed,
    });
    throw error;
  }
};

/**
 * Internal function that performs the actual sync
 */
const performSync = async (startDate: Date, endDate: Date, syncStartTime: number): Promise<SyncResult> => {
  // Ensure user is authenticated with timeout
  odisLogger.info('🟢 Checking authentication...', { elapsedMs: Date.now() - syncStartTime });
  try {
    await withTimeout(requireAuthSession(), AUTH_TIMEOUT_MS, 'requireAuthSession');
  } catch (error) {
    if (error instanceof TimeoutError) {
      throw new Error('Authentication check timed out. Please ensure you are signed in and try again.');
    }
    throw error;
  }
  odisLogger.info('🟢 Authentication verified', { elapsedMs: Date.now() - syncStartTime });

  // Fetch appointments from IDEXX API (already has its own timeout)
  odisLogger.info('🟢 Calling idexxApiClient.fetchAppointments...', { elapsedMs: Date.now() - syncStartTime });
  const allAppointments = await idexxApiClient.fetchAppointments(startDate, endDate);

  // Filter to only sync finalized appointments
  const appointments = allAppointments.filter(apt => shouldSyncAppointment(apt));
  const filteredOut = allAppointments.filter(apt => !shouldSyncAppointment(apt));

  // Log filtered out appointments for debugging
  if (filteredOut.length > 0) {
    odisLogger.info('🔵 Filtered out non-finalized appointments', {
      count: filteredOut.length,
      statuses: [...new Set(filteredOut.map(apt => apt.status))],
      examples: filteredOut.slice(0, 3).map(apt => ({
        id: apt.id,
        status: apt.status,
        clientEmail: apt.client.email,
        patientName: apt.patient.name,
        startTime: apt.startTime?.toISOString(),
      })),
    });
  }

  // Identify no-show appointments that might need deletion
  const noShowAppointments = allAppointments.filter(apt => isNoShowAppointment(apt));

  odisLogger.info('🟢 Appointments fetched', {
    total: allAppointments.length,
    filtered: filteredOut.length,
    finalizedOnly: appointments.length,
    noShows: noShowAppointments.length,
    elapsedMs: Date.now() - syncStartTime,
  });

  // Delete any previously synced cases that are now no-shows
  let deletedCount = 0;
  if (noShowAppointments.length > 0) {
    odisLogger.info('🗑️ Deleting no-show cases...', {
      count: noShowAppointments.length,
      elapsedMs: Date.now() - syncStartTime,
    });

    const supabase = getSupabaseClient();
    const session = await requireAuthSession();

    for (const noShow of noShowAppointments) {
      const externalId = `idexx-appt-${noShow.id}`;
      try {
        // Check if case exists before deleting
        const { data: existingCase } = await supabase
          .from('cases')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('external_id', externalId)
          .maybeSingle();

        if (existingCase) {
          const { error } = await supabase
            .from('cases')
            .delete()
            .eq('user_id', session.user.id)
            .eq('external_id', externalId);

          if (!error) {
            deletedCount++;
            odisLogger.info('🗑️ Deleted no-show case', {
              appointmentId: noShow.id,
              externalId,
              patientName: noShow.patient.name,
            });
          }
        }
      } catch (error) {
        odisLogger.warn('Failed to delete no-show case', { externalId, error });
      }
    }
  }

  odisLogger.info('🟢 Syncing to Supabase (with clinical notes + products/services)...', {
    elapsedMs: Date.now() - syncStartTime,
  });
  const result = await syncScheduleToSupabase(appointments, syncStartTime);

  // Add deleted count to result
  result.deleted = deletedCount;
  odisLogger.info('🟢 Sync complete', {
    total: result.total,
    created: result.created,
    updated: result.updated,
    failed: result.failed,
    deleted: result.deleted,
    patientsCreated: result.patientsCreated,
    patientsUpdated: result.patientsUpdated,
    dataReconciled: result.notesReconciled,
    dataFailed: result.notesFailed,
    errorsCount: result.errors.length,
    elapsedMs: Date.now() - syncStartTime,
  });
  return result;
};

/**
 * Sync appointments to Supabase (creates patients and cases with consultation data)
 * Each appointment has a timeout to prevent individual operations from hanging.
 */
const syncScheduleToSupabase = async (
  appointments: ScheduleAppointment[],
  syncStartTime?: number,
): Promise<SyncResult> => {
  const startTime = syncStartTime ?? Date.now();

  try {
    const supabase = getSupabaseClient();

    // Ensure user is authenticated
    const session = await requireAuthSession();

    const results: SyncResult = {
      total: appointments.length,
      created: 0,
      updated: 0,
      failed: 0,
      deleted: 0,
      errors: [],
      patientsCreated: 0,
      patientsUpdated: 0,
      notesReconciled: 0,
      notesFailed: 0,
    };

    // Process each appointment with timeout
    for (let i = 0; i < appointments.length; i++) {
      const appointment = appointments[i];
      const appointmentStartTime = Date.now();

      // Log progress every 5 appointments
      if (i % 5 === 0) {
        odisLogger.info(`🟢 Processing appointment ${i + 1}/${appointments.length}`, {
          appointmentId: appointment.id,
          elapsedMs: Date.now() - startTime,
        });
      }

      try {
        // Wrap the entire appointment sync with a timeout
        await withTimeout(
          syncSingleAppointment(supabase, session.user.id, appointment, results),
          PER_APPOINTMENT_TIMEOUT_MS,
          `syncAppointment_${appointment.id}`,
        );
      } catch (error) {
        results.failed++;

        let errorMessage: string;
        if (error instanceof TimeoutError) {
          errorMessage = `Appointment sync timed out after ${PER_APPOINTMENT_TIMEOUT_MS / 1000}s`;
          odisLogger.warn(`⚠️ Appointment ${appointment.id} timed out`, {
            appointmentId: appointment.id,
            timeoutMs: PER_APPOINTMENT_TIMEOUT_MS,
            elapsedMs: Date.now() - appointmentStartTime,
          });
        } else {
          errorMessage = error instanceof Error ? error.message : 'Unknown error';
          odisLogger.error(`❌ Failed to sync appointment ${appointment.id}`, {
            appointmentId: appointment.id,
            error,
            elapsedMs: Date.now() - appointmentStartTime,
          });
        }

        results.errors.push({
          appointmentId: appointment.id,
          error: errorMessage,
        });
      }
    }

    return results;
  } catch (error) {
    odisLogger.error('❌ Schedule sync failed', { error, elapsedMs: Date.now() - startTime });
    throw error;
  }
};

/**
 * Sync a single appointment (patient + case + consultation data: clinical notes + products/services)
 */
const syncSingleAppointment = async (
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  appointment: ScheduleAppointment,
  results: SyncResult,
): Promise<void> => {
  // Step 1: Create or update patient
  const patientResult = await upsertPatientFromAppointment(userId, appointment);

  if (patientResult.created) {
    results.patientsCreated++;
  } else {
    results.patientsUpdated++;
  }

  // Step 2: Fetch consultation data (notes + products/services) from consultation endpoint (if consultation_id exists)
  const notesResult = await fetchConsultationNotesForAppointment(appointment.consultationId ?? null, appointment.id);

  // Track consultation data fetch results
  // Consider it reconciled if we got notes OR products/services
  if (
    notesResult.success &&
    (notesResult.notes || notesResult.productsServices || notesResult.declinedProductsServices)
  ) {
    results.notesReconciled++;
  } else if (!notesResult.success && appointment.consultationId) {
    // Only count as failed if we had a consultation_id but couldn't fetch
    results.notesFailed++;
  }

  // Step 3: Create or update case linked to patient (with clinical notes)
  await upsertAppointmentAsCase(supabase, userId, appointment, patientResult.patient.id, notesResult);

  results.created++;
};

/**
 * Format a Date as a PostgreSQL timestamp in America/Los_Angeles timezone
 * This preserves the local clinic time (PST/PDT) without converting to UTC
 *
 * Example: December 2nd 4:00 PM (local) → "2025-12-02 16:00:00-08" (PST)
 *
 * IMPORTANT: The Date object is already in local time from IDEXX API parsing.
 * We format it with explicit timezone offset to tell PostgreSQL "this is PST time".
 */
const formatDateAsLocalTimestamp = (date: Date | null): string | null => {
  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // Get the timezone offset in minutes and convert to hours
  const offsetMinutes = date.getTimezoneOffset();
  const offsetHours = Math.abs(offsetMinutes / 60);
  const offsetSign = offsetMinutes > 0 ? '-' : '+'; // Reversed because getTimezoneOffset is backwards
  const offsetFormatted = `${offsetSign}${String(Math.floor(offsetHours)).padStart(2, '0')}`;

  // Return timestamp with explicit timezone offset
  // This tells PostgreSQL: "this time is in PST/PDT (offset -08 or -07)"
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${offsetFormatted}`;
};

/**
 * Upsert a single appointment as a case linked to a patient
 * Always updates existing records with fresh data (including clinical notes + products/services)
 */
const upsertAppointmentAsCase = async (
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  appointment: ScheduleAppointment,
  patientId: string,
  notesResult?: ConsultationNotesResult,
): Promise<Case> => {
  // Prepare case data with metadata in JSONB
  // Store the appointment time in local timezone (PST) without converting to UTC
  const scheduledAt = formatDateAsLocalTimestamp(appointment.startTime);

  // Determine consultation data and sync timestamp
  // If we successfully fetched data (even if empty), record the sync time
  const consultationNotes = notesResult?.notes || null;
  const productsServices = notesResult?.productsServices || null;
  const declinedProductsServices = notesResult?.declinedProductsServices || null;
  const notesSyncedAt = notesResult?.success ? new Date().toISOString() : null;
  const consultationStatus = notesResult?.consultationStatus || null;

  const caseData: CaseInsert = {
    user_id: userId,
    source: 'idexx_neo',
    external_id: `idexx-appt-${appointment.id}`,
    scheduled_at: scheduledAt,
    // Let Supabase auto-generate created_at to current timestamp (when record is created)

    // Store all IDEXX appointment data in metadata JSONB
    metadata: {
      idexx: {
        appointment_id: appointment.id,
        consultation_id: appointment.consultationId || null,
        patient_id: appointment.patient.id,
        patient_name: appointment.patient.name,
        patient_species: appointment.patient.species,
        patient_breed: appointment.patient.breed,
        client_id: appointment.client.id,
        client_name: appointment.client.name,
        client_phone: appointment.client.phone,
        client_email: appointment.client.email,
        provider_id: appointment.provider.id,
        provider_name: appointment.provider.name,
        appointment_type: appointment.type,
        appointment_duration: appointment.duration,
        appointment_status: appointment.status,
        appointment_reason: appointment.reason,
        notes: appointment.notes,
        extracted_at: new Date().toISOString(),
        extracted_from: appointment.extractedFrom,
        // Clinical notes and products/services from consultation endpoint (fetched during sync)
        consultation_notes: consultationNotes,
        consultation_status: consultationStatus,
        products_services: productsServices,
        declined_products_services: declinedProductsServices,
        notes_synced_at: notesSyncedAt,
      },
    },

    // Defaults for existing required columns
    type: 'checkup',
    status: mapAppointmentStatusToCaseStatus(appointment.status),
    visibility: 'private',
  };

  // Upsert using (user_id, external_id) as conflict resolution
  // This allows multiple users to sync the same IDEXX appointment
  // ignoreDuplicates: false ensures we always UPDATE existing records with fresh data
  const { data, error } = await supabase
    .from('cases')
    .upsert(caseData, {
      onConflict: 'user_id,external_id',
      ignoreDuplicates: false, // Always update existing records with fresh data
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert case: ${error.message}`);
  }

  // Link patient to case if not already linked
  await supabase.from('patients').update({ case_id: data.id }).eq('id', patientId);

  return data;
};

const getSyncedAppointments = async (): Promise<Case[]> => {
  const supabase = getSupabaseClient();

  // Ensure user is authenticated
  const session = await requireAuthSession();

  const query = buildCasesQuery(supabase, {
    userId: session.user.id,
    sources: 'idexx_neo',
    orderBy: 'scheduled_at',
    orderDirection: 'descending',
  });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch synced appointments: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  // Type assertion: Supabase returns Case[] but TypeScript needs explicit cast
  return data as unknown as Case[];
};

const deleteSyncedAppointment = async (externalId: string): Promise<void> => {
  const supabase = getSupabaseClient();

  // Ensure user is authenticated
  const session = await requireAuthSession();

  const { error } = await supabase.from('cases').delete().eq('user_id', session.user.id).eq('external_id', externalId);

  if (error) {
    throw new Error(`Failed to delete appointment: ${error.message}`);
  }
};

interface SyncResult {
  total: number;
  created: number;
  updated: number;
  failed: number;
  /** Number of no-show cases that were deleted */
  deleted: number;
  patientsCreated: number;
  patientsUpdated: number;
  /** Number of cases where consultation data (notes + products/services) were successfully fetched */
  notesReconciled: number;
  /** Number of cases where consultation data fetch failed (non-fatal) */
  notesFailed: number;
  errors: Array<{
    appointmentId: string;
    error: string;
  }>;
}

// Exports
export { syncScheduleFromApi, syncScheduleToSupabase, getSyncedAppointments, deleteSyncedAppointment };
export type { SyncResult };

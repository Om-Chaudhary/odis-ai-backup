/**
 * Schedule Sync Service
 *
 * A modular, context-agnostic service for syncing IDEXX appointments to Supabase.
 * This service can be used from UI components, automation scripts, or background workers.
 *
 * Features:
 * - Dependency injection for testability
 * - Progress callbacks for UI feedback
 * - Structured error handling
 * - No DOM/window dependencies (caller handles context validation)
 */

import { fetchConsultationData } from '../utils/extraction/consultation-fetcher';
import { upsertPatientFromAppointment } from '../utils/sync/patient-sync';
import { createSyncRecord, updateSyncRecord } from '../utils/sync/sync-tracking';
import { logger } from '@odis-ai/extension-shared';
import type { IdexxConsultationLine } from '../types';
import type { IdexxApiClient } from './api/idexx-api-client';
import type { ScheduleAppointment } from '../utils/extraction/schedule-extractor';
import type { Database } from '@database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

const odisLogger = logger.child('[ScheduleSyncService]');

// Types
type Case = Database['public']['Tables']['cases']['Row'];
type CaseInsert = Database['public']['Tables']['cases']['Insert'];
type CaseStatus = Database['public']['Enums']['CaseStatus'];

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
 * IDEXX-specific metadata stored in case.metadata.idexx
 */
interface IdexxMetadata {
  appointment_id?: string;
  consultation_id?: string | null;
  patient_id?: string;
  patient_name?: string;
  patient_species?: string;
  patient_breed?: string;
  client_id?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  provider_id?: string;
  provider_name?: string;
  appointment_type?: string;
  appointment_duration?: number;
  appointment_status?: string;
  appointment_reason?: string;
  notes?: string;
  extracted_at?: string;
  extracted_from?: string;
  consultation_notes?: string | null;
  consultation_status?: string;
  notes_synced_at?: string | null;
}

interface CaseMetadata {
  idexx?: IdexxMetadata;
  [key: string]: unknown;
}

type SyncPhase = 'initializing' | 'fetching' | 'syncing' | 'reconciling' | 'complete' | 'error';

interface SyncProgress {
  phase: SyncPhase;
  current: number;
  total: number;
  message: string;
  itemName?: string;
}

interface SyncOptions {
  startDate: Date;
  endDate: Date;
  onProgress?: (progress: SyncProgress) => void;
}

interface ReconcileOptions {
  startDate: Date;
  endDate: Date;
  skipAlreadyReconciled?: boolean;
  maxCases?: number;
  onProgress?: (progress: SyncProgress) => void;
}

interface SyncResult {
  success: boolean;
  syncId?: string;
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
  durationMs: number;
  errors: Array<{ id: string; error: string }>;
}

interface ReconciliationResult {
  success: boolean;
  syncId: string;
  totalCases: number;
  reconciledCount: number;
  skippedCount: number;
  failedCount: number;
  durationMs: number;
  errors: Array<{ caseId: string; error: string }>;
}

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
 * Schedule Sync Service
 *
 * Provides methods for syncing IDEXX appointments and reconciling notes.
 */
class ScheduleSyncService {
  constructor(
    private readonly apiClient: IdexxApiClient,
    private readonly supabase: SupabaseClient<Database>,
    private readonly userId: string,
  ) {}

  /**
   * Sync appointments from IDEXX to Supabase
   */
  async syncSchedule(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    const { startDate, endDate, onProgress } = options;

    odisLogger.info('Starting schedule sync', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      userId: this.userId,
    });

    const result: SyncResult = {
      success: false,
      total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      deleted: 0,
      patientsCreated: 0,
      patientsUpdated: 0,
      notesReconciled: 0,
      notesFailed: 0,
      durationMs: 0,
      errors: [],
    };

    try {
      // Create sync tracking record
      const syncRecord = await createSyncRecord({
        userId: this.userId,
        syncDate: startDate,
        syncType: 'schedule',
      });
      result.syncId = syncRecord.id;

      // Phase 1: Fetch appointments from IDEXX
      onProgress?.({
        phase: 'fetching',
        current: 0,
        total: 0,
        message: 'Fetching appointments from IDEXX...',
      });

      const allAppointments = await this.apiClient.fetchAppointments(startDate, endDate);

      // Filter to only sync finalized appointments
      const appointments = allAppointments.filter(apt => shouldSyncAppointment(apt));
      const filteredCount = allAppointments.length - appointments.length;

      result.total = appointments.length;

      // Identify no-show appointments that might need deletion
      const noShowAppointments = allAppointments.filter(apt => isNoShowAppointment(apt));

      odisLogger.info('Fetched appointments', {
        total: allAppointments.length,
        filtered: filteredCount,
        finalizedOnly: appointments.length,
        noShows: noShowAppointments.length,
      });

      // Phase 1.5: Delete any previously synced cases that are now no-shows
      if (noShowAppointments.length > 0) {
        onProgress?.({
          phase: 'syncing',
          current: 0,
          total: appointments.length,
          message: `Removing ${noShowAppointments.length} no-show case(s)...`,
        });

        for (const noShow of noShowAppointments) {
          const externalId = `idexx-appt-${noShow.id}`;
          const deleted = await this.deleteCaseIfExists(externalId);
          if (deleted) {
            result.deleted++;
            odisLogger.info('Deleted no-show case', {
              appointmentId: noShow.id,
              externalId,
              patientName: noShow.patient.name,
            });
          }
        }
      }

      // Phase 2: Sync each appointment
      for (let i = 0; i < appointments.length; i++) {
        const appointment = appointments[i];
        const patientName = appointment.patient.name || 'Unknown';

        onProgress?.({
          phase: 'syncing',
          current: i + 1,
          total: appointments.length,
          message: `Syncing ${i + 1}/${appointments.length}`,
          itemName: patientName,
        });

        try {
          await this.syncSingleAppointment(appointment, result);
        } catch (error) {
          result.failed++;
          result.errors.push({
            id: appointment.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          odisLogger.warn('Failed to sync appointment', {
            appointmentId: appointment.id,
            error,
          });
        }
      }

      result.success = result.failed === 0;
      result.durationMs = Date.now() - startTime;

      // Update sync record
      await updateSyncRecord(syncRecord.id, {
        status: result.failed === result.total ? 'failed' : result.failed > 0 ? 'partial' : 'completed',
        completedAt: new Date(),
        totalItems: result.total,
        syncedCount: result.created + result.updated,
        failedCount: result.failed,
        metadata: { durationMs: result.durationMs },
      });

      onProgress?.({
        phase: 'complete',
        current: result.total,
        total: result.total,
        message: `Synced ${result.created} appointments`,
      });

      odisLogger.info('Schedule sync complete', { ...result });
      return result;
    } catch (error) {
      result.durationMs = Date.now() - startTime;

      onProgress?.({
        phase: 'error',
        current: 0,
        total: 0,
        message: error instanceof Error ? error.message : 'Sync failed',
      });

      odisLogger.error('Schedule sync failed', { error });
      throw error;
    }
  }

  /**
   * Reconcile consultation notes for previously synced cases
   */
  async reconcileNotes(options: ReconcileOptions): Promise<ReconciliationResult> {
    const startTime = Date.now();
    const { startDate, endDate, skipAlreadyReconciled = true, maxCases, onProgress } = options;

    odisLogger.info('Starting notes reconciliation', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Create sync tracking record
    const syncRecord = await createSyncRecord({
      userId: this.userId,
      syncDate: startDate,
      syncType: 'notes',
    });

    const result: ReconciliationResult = {
      success: false,
      syncId: syncRecord.id,
      totalCases: 0,
      reconciledCount: 0,
      skippedCount: 0,
      failedCount: 0,
      durationMs: 0,
      errors: [],
    };

    try {
      // Fetch cases needing reconciliation
      onProgress?.({
        phase: 'fetching',
        current: 0,
        total: 0,
        message: 'Finding cases to reconcile...',
      });

      const cases = await this.getCasesNeedingReconciliation(startDate, endDate, skipAlreadyReconciled, maxCases);
      result.totalCases = cases.length;

      // Process each case
      for (let i = 0; i < cases.length; i++) {
        const caseItem = cases[i];
        const patientName = this.getPatientNameFromCase(caseItem);

        onProgress?.({
          phase: 'reconciling',
          current: i + 1,
          total: cases.length,
          message: `Reconciling ${i + 1}/${cases.length}`,
          itemName: patientName,
        });

        try {
          const reconciled = await this.reconcileSingleCase(caseItem);
          if (reconciled) {
            result.reconciledCount++;
          } else {
            result.skippedCount++;
          }
        } catch (error) {
          result.failedCount++;
          result.errors.push({
            caseId: caseItem.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      result.success = result.failedCount === 0;
      result.durationMs = Date.now() - startTime;

      // Update sync record
      await updateSyncRecord(syncRecord.id, {
        status: result.failedCount === result.totalCases ? 'failed' : result.failedCount > 0 ? 'partial' : 'completed',
        completedAt: new Date(),
        totalItems: result.totalCases,
        syncedCount: result.reconciledCount,
        skippedCount: result.skippedCount,
        failedCount: result.failedCount,
        metadata: { durationMs: result.durationMs },
      });

      onProgress?.({
        phase: 'complete',
        current: result.totalCases,
        total: result.totalCases,
        message: `Reconciled ${result.reconciledCount} cases`,
      });

      odisLogger.info('Notes reconciliation complete', { ...result });
      return result;
    } catch (error) {
      result.durationMs = Date.now() - startTime;

      await updateSyncRecord(syncRecord.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Sync a single appointment (patient + case + consultation data)
   */
  private async syncSingleAppointment(appointment: ScheduleAppointment, result: SyncResult): Promise<void> {
    // Step 1: Create or update patient
    const patientResult = await upsertPatientFromAppointment(this.userId, appointment);

    if (patientResult.created) {
      result.patientsCreated++;
    } else {
      result.patientsUpdated++;
    }

    // Step 2: Fetch consultation data (notes + products/services) if consultation_id exists
    let consultationNotes: string | null = null;
    let productsServices: string | null = null;
    let declinedProductsServices: string | null = null;
    let consultationStatus: string | null = null;

    if (appointment.consultationId) {
      try {
        const consultationData = await fetchConsultationData(appointment.consultationId);

        // Extract notes
        const notesData = consultationData.consultationNotes as { notes?: string } | undefined;
        consultationNotes = notesData?.notes || consultationData.consultation?.notes || null;

        // Extract products/services
        productsServices = formatProductsServices(consultationData.consultationLines, false) || null;
        declinedProductsServices = formatProductsServices(consultationData.consultationLines, true) || null;
        consultationStatus = consultationData.consultation?.status || null;

        // Track successful fetch if we got any data
        if (consultationNotes || productsServices || declinedProductsServices) {
          result.notesReconciled++;
        }
      } catch (error) {
        // Non-fatal error - log and continue
        odisLogger.warn('Failed to fetch consultation data (non-fatal)', {
          consultationId: appointment.consultationId,
          appointmentId: appointment.id,
          error,
        });
        result.notesFailed++;
      }
    }

    // Step 3: Create or update case linked to patient (with consultation data)
    await this.upsertAppointmentAsCase(
      appointment,
      patientResult.patient.id,
      consultationNotes,
      productsServices,
      declinedProductsServices,
      consultationStatus,
    );
    result.created++;
  }

  /**
   * Upsert a single appointment as a case (with consultation data)
   */
  private async upsertAppointmentAsCase(
    appointment: ScheduleAppointment,
    patientId: string,
    consultationNotes: string | null = null,
    productsServices: string | null = null,
    declinedProductsServices: string | null = null,
    consultationStatus: string | null = null,
  ): Promise<Case> {
    const scheduledAt = appointment.startTime?.toISOString() || null;
    const notesSyncedAt =
      consultationNotes || productsServices || declinedProductsServices ? new Date().toISOString() : null;

    const caseData: CaseInsert = {
      user_id: this.userId,
      source: 'idexx_neo',
      external_id: `idexx-appt-${appointment.id}`,
      scheduled_at: scheduledAt,
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
          // Consultation data (notes + products/services)
          consultation_notes: consultationNotes,
          consultation_status: consultationStatus,
          products_services: productsServices,
          declined_products_services: declinedProductsServices,
          notes_synced_at: notesSyncedAt,
        },
      },
      type: 'checkup',
      status: mapAppointmentStatusToCaseStatus(appointment.status),
      visibility: 'private',
    };

    const { data, error } = await this.supabase
      .from('cases')
      .upsert(caseData, {
        onConflict: 'user_id,external_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert case: ${error.message}`);
    }

    // Link patient to case
    await this.supabase.from('patients').update({ case_id: data.id }).eq('id', patientId);

    return data;
  }

  /**
   * Get cases that need notes reconciliation
   */
  private async getCasesNeedingReconciliation(
    startDate: Date,
    endDate: Date,
    skipAlreadyReconciled: boolean,
    maxCases?: number,
  ): Promise<Case[]> {
    let query = this.supabase
      .from('cases')
      .select('*')
      .eq('user_id', this.userId)
      .eq('source', 'idexx_neo')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .order('scheduled_at', { ascending: true });

    if (maxCases) {
      query = query.limit(maxCases);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch cases: ${error.message}`);
    }

    let cases = data || [];

    // Filter in memory if needed
    if (skipAlreadyReconciled) {
      cases = cases.filter(c => !this.hasConsultationNotes(c));
    }

    return cases;
  }

  /**
   * Reconcile notes for a single case
   */
  private async reconcileSingleCase(caseItem: Case): Promise<boolean> {
    const idexx = this.getIdexxMetadata(caseItem);

    if (!idexx) {
      return false;
    }

    // Get consultation ID
    const consultationId = idexx.consultation_id;

    if (!consultationId) {
      // TODO: Implement consultation ID lookup from appointment
      return false;
    }

    // Fetch consultation data
    const consultationData = await fetchConsultationData(consultationId);

    const consultationNotes =
      (consultationData.consultationNotes as { notes?: string } | undefined)?.notes ||
      consultationData.consultation?.notes ||
      '';

    if (!consultationNotes) {
      return false;
    }

    // Update case metadata
    const metadata = caseItem.metadata as Record<string, unknown> | null;
    const updatedMetadata = {
      ...metadata,
      idexx: {
        ...idexx,
        consultation_id: consultationId,
        consultation_notes: consultationNotes,
        consultation_status: consultationData.consultation?.status,
        notes_synced_at: new Date().toISOString(),
      },
    };

    const { error } = await this.supabase.from('cases').update({ metadata: updatedMetadata }).eq('id', caseItem.id);

    if (error) {
      throw new Error(`Failed to update case: ${error.message}`);
    }

    return true;
  }

  /**
   * Helper: Get IDEXX metadata from a case
   */
  private getIdexxMetadata(caseItem: Case): IdexxMetadata | null {
    const metadata = caseItem.metadata as CaseMetadata | null;
    return metadata?.idexx ?? null;
  }

  /**
   * Helper: Get patient name from case with fallback
   */
  private getPatientNameFromCase(caseItem: Case, fallback = 'Unknown'): string {
    const idexx = this.getIdexxMetadata(caseItem);
    return idexx?.patient_name || fallback;
  }

  /**
   * Helper: Check if case has consultation notes
   */
  private hasConsultationNotes(caseItem: Case): boolean {
    const idexx = this.getIdexxMetadata(caseItem);
    return Boolean(idexx?.consultation_notes);
  }

  /**
   * Helper: Delete a case by external_id if it exists
   * @returns true if a case was deleted, false if no case existed
   */
  private async deleteCaseIfExists(externalId: string): Promise<boolean> {
    // First check if the case exists
    const { data: existingCase } = await this.supabase
      .from('cases')
      .select('id')
      .eq('user_id', this.userId)
      .eq('external_id', externalId)
      .maybeSingle();

    if (!existingCase) {
      return false;
    }

    // Delete the case
    const { error } = await this.supabase
      .from('cases')
      .delete()
      .eq('user_id', this.userId)
      .eq('external_id', externalId);

    if (error) {
      odisLogger.warn('Failed to delete no-show case', { externalId, error });
      return false;
    }

    return true;
  }
}

/**
 * Factory function to create a ScheduleSyncService instance
 */
const createScheduleSyncService = (
  apiClient: IdexxApiClient,
  supabase: SupabaseClient<Database>,
  userId: string,
): ScheduleSyncService => new ScheduleSyncService(apiClient, supabase, userId);

export { ScheduleSyncService, createScheduleSyncService };
export type { SyncPhase, SyncProgress, SyncOptions, ReconcileOptions, SyncResult, ReconciliationResult };

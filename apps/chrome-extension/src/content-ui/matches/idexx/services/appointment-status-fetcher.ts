/**
 * Appointment Status Fetcher
 *
 * Fetches communication status (email/call) for appointments displayed in the calendar grid.
 * Uses a hybrid approach:
 * 1. First checks synced cases in database by appointment_id
 * 2. Falls back to IDEXX API to get consultation_id for unsynced appointments
 * 3. Batch queries scheduled_discharge_emails/calls tables for status
 *
 * Includes caching to avoid repeated queries for the same appointments.
 */

import { IdexxApiClient } from './api/idexx-api-client';
import { getSupabaseClient, logger } from '@odis-ai/extension/shared';
import type { CommunicationStatus } from '../components/icons/ScheduleStatusIcons';

const odisLogger = logger.child('[AppointmentStatusFetcher]');

/**
 * Communication status for an appointment
 */
interface AppointmentCommunicationStatus {
  emailStatus: CommunicationStatus;
  callStatus: CommunicationStatus;
  caseId?: string | null;
  /** Whether the owner email is missing */
  missingEmail?: boolean;
  /** Whether the owner phone is missing */
  missingPhone?: boolean;
  /** Whether the case has been flagged as urgent by AI */
  isUrgent?: boolean;
  /** AI-generated reason why the case was flagged as urgent */
  urgentReason?: string | null;
}

/**
 * Cache entry with TTL
 */
interface CacheEntry {
  status: AppointmentCommunicationStatus;
  timestamp: number;
}

// Cache TTL: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;

// In-memory cache: appointment_id -> status
const statusCache = new Map<string, CacheEntry>();

// Pending fetches to prevent duplicate requests
const pendingFetches = new Map<string, Promise<AppointmentCommunicationStatus>>();

/**
 * Map database email status to CommunicationStatus
 */
const mapEmailStatus = (dbStatus: string | null): CommunicationStatus => {
  if (!dbStatus) return 'none';

  switch (dbStatus.toLowerCase()) {
    case 'scheduled':
    case 'pending':
    case 'queued':
      return 'scheduled';
    case 'sent':
      return 'sent';
    case 'failed':
    case 'error':
      return 'failed';
    default:
      return 'none';
  }
};

/**
 * Map database call status to CommunicationStatus
 */
const mapCallStatus = (dbStatus: string | null): CommunicationStatus => {
  if (!dbStatus) return 'none';

  switch (dbStatus.toLowerCase()) {
    case 'scheduled':
    case 'pending':
    case 'queued':
      return 'scheduled';
    case 'completed':
      return 'sent';
    case 'failed':
    case 'error':
      return 'failed';
    default:
      return 'none';
  }
};

/**
 * Check if cache entry is still valid
 */
const isCacheValid = (entry: CacheEntry): boolean => Date.now() - entry.timestamp < CACHE_TTL_MS;

/**
 * Get cached status if available and valid
 */
const getCachedStatus = (appointmentId: string): AppointmentCommunicationStatus | null => {
  const entry = statusCache.get(appointmentId);
  if (entry && isCacheValid(entry)) {
    return entry.status;
  }
  // Remove stale entry
  if (entry) {
    statusCache.delete(appointmentId);
  }
  return null;
};

/**
 * Store status in cache
 */
const setCachedStatus = (appointmentId: string, status: AppointmentCommunicationStatus): void => {
  statusCache.set(appointmentId, {
    status,
    timestamp: Date.now(),
  });
};

/**
 * Fetch status for a single appointment by appointment_id
 */
const fetchSingleAppointmentStatus = async (appointmentId: string): Promise<AppointmentCommunicationStatus> => {
  const defaultStatus: AppointmentCommunicationStatus = {
    emailStatus: 'none',
    callStatus: 'none',
    caseId: null,
    missingEmail: false,
    missingPhone: false,
    isUrgent: false,
    urgentReason: null,
  };

  try {
    const supabase = getSupabaseClient();

    // Step 1: Try to find case by appointment_id in metadata
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id, metadata, is_urgent')
      .eq('metadata->idexx->>appointment_id', appointmentId)
      .maybeSingle();

    if (caseError) {
      odisLogger.warn('Error fetching case by appointment_id', { error: caseError, appointmentId });
      return defaultStatus;
    }

    let caseId: string | null = null;
    let consultationId: string | null = null;
    let isUrgent = false;

    if (caseData) {
      caseId = caseData.id;
      isUrgent = caseData.is_urgent === true;
      // Extract consultation_id from metadata if available
      const metadata = caseData.metadata as { idexx?: { consultation_id?: string } } | null;
      consultationId = metadata?.idexx?.consultation_id || null;
    }

    // Step 2: If no case found, try to get consultation_id from IDEXX API
    if (!caseId && !consultationId) {
      try {
        const apiClient = new IdexxApiClient();
        // Get today's appointments from API
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointments = await apiClient.fetchAppointments(today, tomorrow);
        const matchingAppt = appointments.find(a => a.id === appointmentId);

        if (matchingAppt?.consultationId) {
          consultationId = matchingAppt.consultationId;
          odisLogger.debug('Found consultation_id from API', { appointmentId, consultationId });
        }
      } catch (apiError) {
        odisLogger.debug('Could not fetch from IDEXX API', { error: apiError, appointmentId });
      }
    }

    // Step 3: If we still don't have a case_id, try lookup by consultation_id
    if (!caseId && consultationId) {
      const { data: caseByConsultation } = await supabase
        .from('cases')
        .select('id')
        .eq('metadata->idexx->>consultation_id', consultationId)
        .maybeSingle();

      if (caseByConsultation) {
        caseId = caseByConsultation.id;
      }
    }

    // If still no case found, return default (no communications scheduled)
    if (!caseId) {
      return defaultStatus;
    }

    // Step 4: Fetch email, call status, and patient contact info
    const [emailResult, callResult, patientResult] = await Promise.all([
      supabase
        .from('scheduled_discharge_emails')
        .select('id, status')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('scheduled_discharge_calls')
        .select('id, status, urgent_reason_summary')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('patients').select('owner_email, owner_phone').eq('case_id', caseId).maybeSingle(),
    ]);

    const emailStatus = mapEmailStatus(emailResult.data?.status || null);
    const callStatus = mapCallStatus(callResult.data?.status || null);
    const urgentReason = callResult.data?.urgent_reason_summary || null;

    // Check for missing contact info
    const ownerEmail = patientResult.data?.owner_email;
    const ownerPhone = patientResult.data?.owner_phone;
    const missingEmail = !ownerEmail || ownerEmail.trim() === '';
    const missingPhone = !ownerPhone || ownerPhone.trim() === '';

    const result: AppointmentCommunicationStatus = {
      emailStatus,
      callStatus,
      caseId,
      missingEmail,
      missingPhone,
      isUrgent,
      urgentReason,
    };

    odisLogger.debug('Fetched appointment status', {
      appointmentId,
      caseId,
      emailStatus,
      callStatus,
      missingEmail,
      missingPhone,
      isUrgent,
    });

    return result;
  } catch (error) {
    odisLogger.error('Error fetching appointment status', { error, appointmentId });
    return defaultStatus;
  }
};

/**
 * Fetch status for a single appointment with caching
 */
const getAppointmentStatus = async (appointmentId: string): Promise<AppointmentCommunicationStatus> => {
  // Check cache first
  const cached = getCachedStatus(appointmentId);
  if (cached) {
    return cached;
  }

  // Check if there's already a pending fetch for this appointment
  const pending = pendingFetches.get(appointmentId);
  if (pending) {
    return pending;
  }

  // Create new fetch promise
  const fetchPromise = fetchSingleAppointmentStatus(appointmentId).then(status => {
    setCachedStatus(appointmentId, status);
    pendingFetches.delete(appointmentId);
    return status;
  });

  pendingFetches.set(appointmentId, fetchPromise);
  return fetchPromise;
};

/**
 * Batch fetch statuses for multiple appointments
 * More efficient than individual fetches when loading the calendar
 */
const batchGetAppointmentStatuses = async (
  appointmentIds: string[],
): Promise<Map<string, AppointmentCommunicationStatus>> => {
  const results = new Map<string, AppointmentCommunicationStatus>();
  const uncachedIds: string[] = [];

  // Check cache for each appointment
  for (const id of appointmentIds) {
    const cached = getCachedStatus(id);
    if (cached) {
      results.set(id, cached);
    } else {
      uncachedIds.push(id);
    }
  }

  // If all were cached, return immediately
  if (uncachedIds.length === 0) {
    return results;
  }

  odisLogger.debug('Batch fetching statuses for uncached appointments', { count: uncachedIds.length });

  try {
    const supabase = getSupabaseClient();

    // Batch query: Find all cases matching any of the appointment_ids
    // Supabase doesn't support IN on JSONB path directly, so we need to query differently
    // We'll fetch in smaller batches to avoid query complexity
    const BATCH_SIZE = 50;
    const casesMap = new Map<string, { caseId: string; consultationId: string | null; isUrgent: boolean }>();

    for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
      const batchIds = uncachedIds.slice(i, i + BATCH_SIZE);

      // Query cases that match any of these appointment_ids
      // Using OR with multiple eq conditions
      const { data: cases, error } = await supabase
        .from('cases')
        .select('id, metadata, is_urgent')
        .or(batchIds.map(id => `metadata->idexx->>appointment_id.eq.${id}`).join(','));

      if (error) {
        odisLogger.warn('Error batch fetching cases', { error });
        continue;
      }

      for (const caseData of cases || []) {
        const metadata = caseData.metadata as { idexx?: { appointment_id?: string; consultation_id?: string } } | null;
        const appointmentId = metadata?.idexx?.appointment_id;
        if (appointmentId) {
          casesMap.set(appointmentId, {
            caseId: caseData.id,
            consultationId: metadata?.idexx?.consultation_id || null,
            isUrgent: caseData.is_urgent === true,
          });
        }
      }
    }

    // Get all case IDs that were found
    const caseIds = Array.from(casesMap.values()).map(c => c.caseId);

    // Batch fetch email, call statuses, and patient contact info
    const [emailsResult, callsResult, patientsResult] = await Promise.all([
      caseIds.length > 0
        ? supabase
            .from('scheduled_discharge_emails')
            .select('id, case_id, status')
            .in('case_id', caseIds)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      caseIds.length > 0
        ? supabase
            .from('scheduled_discharge_calls')
            .select('id, case_id, status, urgent_reason_summary')
            .in('case_id', caseIds)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      caseIds.length > 0
        ? supabase.from('patients').select('case_id, owner_email, owner_phone').in('case_id', caseIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Build maps of latest status per case_id
    const emailStatusMap = new Map<string, string>();
    const callStatusMap = new Map<string, { status: string; urgentReason: string | null }>();
    const patientContactMap = new Map<string, { email: string | null; phone: string | null }>();

    // Get the latest email status per case (first occurrence since ordered desc)
    for (const email of emailsResult.data || []) {
      if (email.case_id && !emailStatusMap.has(email.case_id)) {
        emailStatusMap.set(email.case_id, email.status);
      }
    }

    // Get the latest call status per case
    for (const call of callsResult.data || []) {
      if (call.case_id && !callStatusMap.has(call.case_id)) {
        callStatusMap.set(call.case_id, {
          status: call.status,
          urgentReason: call.urgent_reason_summary || null,
        });
      }
    }

    // Get patient contact info per case
    for (const patient of patientsResult.data || []) {
      if (patient.case_id) {
        patientContactMap.set(patient.case_id, {
          email: patient.owner_email,
          phone: patient.owner_phone,
        });
      }
    }

    // Build results for all uncached IDs
    for (const appointmentId of uncachedIds) {
      const caseInfo = casesMap.get(appointmentId);
      let status: AppointmentCommunicationStatus;

      if (caseInfo) {
        const emailStatus = mapEmailStatus(emailStatusMap.get(caseInfo.caseId) || null);
        const callInfo = callStatusMap.get(caseInfo.caseId);
        const callStatus = mapCallStatus(callInfo?.status || null);
        const contactInfo = patientContactMap.get(caseInfo.caseId);
        const missingEmail = !contactInfo?.email || contactInfo.email.trim() === '';
        const missingPhone = !contactInfo?.phone || contactInfo.phone.trim() === '';
        status = {
          emailStatus,
          callStatus,
          caseId: caseInfo.caseId,
          missingEmail,
          missingPhone,
          isUrgent: caseInfo.isUrgent,
          urgentReason: callInfo?.urgentReason || null,
        };
      } else {
        // No case found for this appointment
        status = {
          emailStatus: 'none',
          callStatus: 'none',
          caseId: null,
          missingEmail: false,
          missingPhone: false,
          isUrgent: false,
          urgentReason: null,
        };
      }

      results.set(appointmentId, status);
      setCachedStatus(appointmentId, status);
    }
  } catch (error) {
    odisLogger.error('Error batch fetching appointment statuses', { error });

    // Return 'none' for all uncached appointments on error
    for (const id of uncachedIds) {
      const defaultStatus: AppointmentCommunicationStatus = {
        emailStatus: 'none',
        callStatus: 'none',
        caseId: null,
        missingEmail: false,
        missingPhone: false,
        isUrgent: false,
        urgentReason: null,
      };
      results.set(id, defaultStatus);
    }
  }

  return results;
};

/**
 * Invalidate cached status for an appointment
 * Call this when you know the status has changed (e.g., after scheduling)
 */
const invalidateAppointmentStatus = (appointmentId: string): void => {
  statusCache.delete(appointmentId);
};

/**
 * Clear the entire cache
 * Useful when navigating away from the calendar or refreshing
 */
const clearStatusCache = (): void => {
  statusCache.clear();
  odisLogger.debug('Status cache cleared');
};

export {
  type AppointmentCommunicationStatus,
  getAppointmentStatus,
  batchGetAppointmentStatuses,
  invalidateAppointmentStatus,
  clearStatusCache,
};

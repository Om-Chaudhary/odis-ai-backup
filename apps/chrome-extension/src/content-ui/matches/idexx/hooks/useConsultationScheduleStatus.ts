/**
 * Hook to fetch scheduling status for a consultation
 *
 * Queries the scheduled_discharge_emails and scheduled_discharge_calls tables
 * to determine if email and/or phone communications have been scheduled for
 * the current consultation.
 */

import { getSupabaseClient, logger } from '@odis-ai/extension/shared';
import { useState, useEffect } from 'react';
import type { CommunicationStatus } from '../components/icons/ScheduleStatusIcons';

const odisLogger = logger.child('[useConsultationScheduleStatus]');

/**
 * Map database email status to CommunicationStatus
 */
const mapEmailStatus = (dbStatus: string | null): CommunicationStatus => {
  if (!dbStatus) return 'none';

  switch (dbStatus.toLowerCase()) {
    case 'scheduled':
    case 'pending':
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

interface ScheduleStatus {
  hasScheduledEmail: boolean;
  hasScheduledCall: boolean;
  emailStatus: CommunicationStatus;
  callStatus: CommunicationStatus;
  caseId: string | null;
  isLoading: boolean;
  error: string | null;
  /** Whether the owner email is missing */
  missingEmail: boolean;
  /** Whether the owner phone is missing */
  missingPhone: boolean;
  /** Whether the case has been flagged as urgent by AI */
  isUrgent: boolean;
  /** AI-generated reason why the case was flagged as urgent */
  urgentReason: string | null;
}

/**
 * Fetch scheduling status for a consultation by ID
 *
 * @param consultationId - The IDEXX consultation ID (extracted from URL)
 * @returns Schedule status indicating if email/call are scheduled
 */
export const useConsultationScheduleStatus = (consultationId: string | null): ScheduleStatus => {
  const [status, setStatus] = useState<ScheduleStatus>({
    hasScheduledEmail: false,
    hasScheduledCall: false,
    emailStatus: 'none',
    callStatus: 'none',
    caseId: null,
    isLoading: true,
    error: null,
    missingEmail: false,
    missingPhone: false,
    isUrgent: false,
    urgentReason: null,
  });

  useEffect(() => {
    if (!consultationId) {
      setStatus({
        hasScheduledEmail: false,
        hasScheduledCall: false,
        emailStatus: 'none',
        callStatus: 'none',
        caseId: null,
        isLoading: false,
        error: null,
        missingEmail: false,
        missingPhone: false,
        isUrgent: false,
        urgentReason: null,
      });
      return;
    }

    const fetchStatus = async () => {
      try {
        setStatus(prev => ({ ...prev, isLoading: true, error: null }));

        const supabase = getSupabaseClient();
        let caseId: string | null = null;
        let isUrgent = false;

        // Step 1: Try to find case by consultation_id stored in metadata
        const { data: caseByConsultation, error: consultationError } = await supabase
          .from('cases')
          .select('id, is_urgent')
          .eq('metadata->idexx->>consultation_id', consultationId)
          .maybeSingle();

        if (consultationError) {
          odisLogger.warn('Error fetching case by consultation_id', { error: consultationError, consultationId });
        }

        if (caseByConsultation) {
          caseId = caseByConsultation.id;
          isUrgent = caseByConsultation.is_urgent === true;
          odisLogger.debug('Found case by consultation_id', { consultationId, caseId });
        }

        // Step 2: If no case found, try to find by appointment_id from URL query params
        if (!caseId) {
          const urlParams = new URLSearchParams(window.location.search);
          const appointmentId = urlParams.get('appointment_id') || urlParams.get('appointmentId');

          if (appointmentId) {
            const { data: caseByAppointment } = await supabase
              .from('cases')
              .select('id, is_urgent')
              .eq('metadata->idexx->>appointment_id', appointmentId)
              .maybeSingle();

            if (caseByAppointment) {
              caseId = caseByAppointment.id;
              isUrgent = caseByAppointment.is_urgent === true;
              odisLogger.debug('Found case by appointment_id from URL', { appointmentId, caseId });
            }
          }
        }

        // Step 3: If still no case found, try to extract appointment_id from page DOM
        if (!caseId) {
          // Look for appointment links or data attributes in the page
          const appointmentLink = document.querySelector('a[href*="appointment_id="]');
          if (appointmentLink) {
            const href = appointmentLink.getAttribute('href');
            const match = href?.match(/appointment_id=(\d+)/);
            if (match) {
              const appointmentId = match[1];
              const { data: caseByAppointment } = await supabase
                .from('cases')
                .select('id, is_urgent')
                .eq('metadata->idexx->>appointment_id', appointmentId)
                .maybeSingle();

              if (caseByAppointment) {
                caseId = caseByAppointment.id;
                isUrgent = caseByAppointment.is_urgent === true;
                odisLogger.debug('Found case by appointment_id from DOM', { appointmentId, caseId });
              }
            }
          }
        }

        if (!caseId) {
          // No case found - consultation hasn't been synced yet
          odisLogger.debug('No case found for consultation', { consultationId });
          setStatus({
            hasScheduledEmail: false,
            hasScheduledCall: false,
            emailStatus: 'none',
            callStatus: 'none',
            caseId: null,
            isLoading: false,
            error: null,
            missingEmail: false,
            missingPhone: false,
            isUrgent: false,
            urgentReason: null,
          });
          return;
        }

        // Fetch email status, call status, and patient contact info in parallel
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

        if (emailResult.error) {
          odisLogger.warn('Error fetching email status', { error: emailResult.error, caseId });
        }

        if (callResult.error) {
          odisLogger.warn('Error fetching call status', { error: callResult.error, caseId });
        }

        if (patientResult.error) {
          odisLogger.warn('Error fetching patient data', { error: patientResult.error, caseId });
        }

        const emailStatus = mapEmailStatus(emailResult.data?.status || null);
        const callStatus = mapCallStatus(callResult.data?.status || null);
        const urgentReason = callResult.data?.urgent_reason_summary || null;

        // Check for missing contact info
        // Only show warning if patient exists but has missing contact info
        // If patient doesn't exist yet (not synced), don't show warning
        const ownerEmail = patientResult.data?.owner_email;
        const ownerPhone = patientResult.data?.owner_phone;
        const hasPatientData = patientResult.data !== null && !patientResult.error;
        const missingEmail = hasPatientData && (!ownerEmail || ownerEmail.trim() === '');
        const missingPhone = hasPatientData && (!ownerPhone || ownerPhone.trim() === '');

        setStatus({
          hasScheduledEmail: emailStatus !== 'none',
          hasScheduledCall: callStatus !== 'none',
          emailStatus,
          callStatus,
          caseId: caseId,
          isLoading: false,
          error: null,
          missingEmail,
          missingPhone,
          isUrgent,
          urgentReason,
        });

        odisLogger.debug('Fetched schedule status', {
          consultationId,
          caseId,
          emailStatus,
          callStatus,
          missingEmail,
          missingPhone,
          isUrgent,
        });
      } catch (error) {
        odisLogger.error('Unexpected error fetching schedule status', { error, consultationId });
        setStatus({
          hasScheduledEmail: false,
          hasScheduledCall: false,
          emailStatus: 'none',
          callStatus: 'none',
          caseId: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          missingEmail: false,
          missingPhone: false,
          isUrgent: false,
          urgentReason: null,
        });
      }
    };

    fetchStatus();
  }, [consultationId]);

  return status;
};

/**
 * Extract consultation ID from the current URL
 * Returns null if not on a consultation page
 *
 * Handles multiple URL patterns:
 * - /consultations/722450
 * - /consultations/view/722450
 * - /consultations/edit/722450
 */
export const extractConsultationIdFromUrl = (): string | null => {
  const match = window.location.pathname.match(/\/consultations\/(?:view\/|edit\/)?(\d+)/);
  return match ? match[1] : null;
};

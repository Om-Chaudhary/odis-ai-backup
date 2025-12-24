import { logger } from '@odis-ai/extension/shared';
import type { IdexxConsultationPageData, ScheduleCallRequest } from '../../types';

const odisLogger = logger.child('[ODIS]');

/**
 * Format phone number to E.164 format for VAPI
 * Handles various input formats and defaults to US country code
 * E.164 format: +[country code][number] (e.g., +12137774445)
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Already has country code
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+${cleaned}`;
  }

  // Assume US if 10 digits
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // Return as-is with + if it looks like international
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }

  // Fallback - try to format as US
  return `+1${cleaned}`;
};

/**
 * Transform IDEXX consultation data to VAPI call request format
 *
 * @param idexxData - Raw data from IDEXX consultation API
 * @param scheduledFor - When to schedule the call (ISO 8601 timestamp)
 * @param userNotes - Optional custom notes to add
 * @param timezone - Optional timezone (defaults to 'America/Los_Angeles')
 * @returns Formatted request ready to send to backend VAPI API
 */
export const transformConsultationToCallRequest = (
  idexxData: IdexxConsultationPageData,
  scheduledFor: Date,
  userNotes?: string,
  timezone: string = 'America/Los_Angeles',
): ScheduleCallRequest => {
  // Select primary provider (first in list)
  const primaryProvider = idexxData.pageData.providers[0];
  if (!primaryProvider) {
    throw new Error('No provider found in consultation data');
  }

  // Extract patient info
  const petName = idexxData.patient.name;
  if (!petName) {
    throw new Error('Patient name is required');
  }

  // Extract owner info (IDEXX uses firstName/lastName separately)
  const ownerName = `${idexxData.client.firstName || ''} ${idexxData.client.lastName || ''}`.trim();
  const ownerPhone = formatPhoneNumber(idexxData.client.phone || '');

  if (!ownerName || !ownerPhone) {
    throw new Error('Owner name and phone are required');
  }

  // Extract clinic info (from clientBranch)
  const clinicName = idexxData.clientBranch?.name || 'Unknown Clinic';

  // Extract discharge summary from consultationNotes
  const consultationNotesData = idexxData.consultationNotes as { notes?: string } | undefined;
  const dischargeSummary = consultationNotesData?.notes || idexxData.consultation.reason || '';

  // Build notes
  const consultationNotes =
    userNotes || `Consultation #${idexxData.consultation.id} - ${idexxData.consultation.reason || 'Follow-up'}`;

  // Build request
  const request: ScheduleCallRequest = {
    phoneNumber: ownerPhone,
    petName: petName,
    ownerName: ownerName,
    vetName: primaryProvider.name,
    clinicName: clinicName,
    clinicPhone: '', // Not available in this endpoint
    dischargeSummary: dischargeSummary,
    scheduledFor: scheduledFor.toISOString(),
    notes: consultationNotes,
    timezone: timezone,

    metadata: {
      source: 'idexx_neo',
      consultation_id: idexxData.consultation.id,
      provider_id: primaryProvider.id,
      company_id: idexxData.clientBranch?.id || 0,
      patient_external_id: `idexx-patient-${idexxData.patient.id}`,
    },
  };

  odisLogger.debug('Transformed consultation data to call request', { request });

  return request;
};

/**
 * Validate that consultation data has all required fields for scheduling
 * Returns both critical errors (blocks modal) and warnings (shows modal with warnings)
 */
export const validateConsultationData = (
  data: IdexxConsultationPageData,
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical: Check patient
  if (!data.patient?.name) {
    errors.push('Missing patient name');
  }

  // Critical: Check provider
  if (!data.pageData?.providers || data.pageData.providers.length === 0) {
    errors.push('No providers found');
  }

  // Warning: Check client (IDEXX uses firstName/lastName)
  if (!data.client?.firstName && !data.client?.lastName) {
    warnings.push('Missing owner name - please add manually');
  }

  // Warning: Phone can be added manually
  if (!data.client?.phone) {
    warnings.push('Missing owner phone number - please add manually');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Get a summary of consultation data for display
 */
export const getConsultationSummary = (data: IdexxConsultationPageData): string => {
  const provider = data.pageData.providers[0];
  const ownerName = `${data.client.firstName || ''} ${data.client.lastName || ''}`.trim();
  const clinicName = data.clientBranch?.name || 'Unknown Clinic';

  return `
Patient: ${data.patient.name} (${data.patient.species || 'Unknown species'})
Owner: ${ownerName}
Phone: ${data.client.phone || 'No phone'}
Veterinarian: ${provider?.name || 'Unknown'}
Clinic: ${clinicName}
Reason: ${data.consultation.reason || 'No reason provided'}
  `.trim();
};

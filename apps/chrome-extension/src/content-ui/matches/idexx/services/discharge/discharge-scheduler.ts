import { fetchContactInfo } from './contact-info-fetcher';
import { fetchCurrentConsultationData } from '../../utils/extraction/consultation-fetcher';
import { logger, getCurrentISOString, now, addDays, addMinutes, requireAuthToken, trackEvent } from '@odis-ai/extension/shared';
import type { IdexxConsultationLine } from '../../types';

const odisLogger = logger.child('[ODIS]');

/**
 * Format consultation line items (products/services) into a readable string
 * @param lines - Array of consultation line items
 * @param declinedOnly - If true, only return declined items; if false, only return accepted items
 * @returns Formatted string of products/services
 */
const formatProductsServices = (lines: IdexxConsultationLine[] | undefined, declinedOnly: boolean): string => {
  odisLogger.debug('🔍 [Discharge] Formatting products/services', {
    totalLines: lines?.length || 0,
    declinedOnly,
    hasLines: !!lines,
  });

  if (!lines || lines.length === 0) {
    odisLogger.debug('⚠️ [Discharge] No lines to format');
    return '';
  }

  const filtered = lines.filter(line => (declinedOnly ? line.isDeclined : !line.isDeclined));

  odisLogger.debug('🔍 [Discharge] Filtered products', {
    declinedOnly,
    totalLines: lines.length,
    filteredCount: filtered.length,
    filtered: filtered.map(l => ({ name: l.productService, isDeclined: l.isDeclined, qty: l.quantity })),
  });

  if (filtered.length === 0) {
    odisLogger.debug('⚠️ [Discharge] No products after filtering');
    return '';
  }

  const formatted = filtered
    .map(line => {
      const parts = [line.productService];
      if (line.quantity && line.quantity !== 1) {
        parts.push(`(Qty: ${line.quantity})`);
      }
      return parts.join(' ');
    })
    .join('; ');

  odisLogger.debug('✅ [Discharge] Formatted result', {
    declinedOnly,
    result: formatted,
  });

  return formatted;
};

interface DischargeScheduleResult {
  success: boolean;
  error?: string;
  actions?: string[];
}

/**
 * Send API request via background script
 */
const sendApiRequest = async (url: string, method: string, body: unknown, authToken: string) => {
  const response = await chrome.runtime.sendMessage({
    type: 'API_REQUEST',
    url,
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body,
  });

  if (!response.success) {
    odisLogger.error('API request failed', { response });
    throw new Error(response.error || 'API request failed');
  }

  return response.data;
};

/**
 * Schedule discharge workflow: normalize → generate summary → schedule call → generate email → schedule email
 */
export const scheduleDischarge = async (): Promise<DischargeScheduleResult> => {
  // Fetch consultation data from current IDEXX page
  const consultationData = await fetchCurrentConsultationData();
  if (!consultationData) {
    throw new Error('Failed to fetch consultation data. Make sure you are on a consultation page.');
  }

  // Get auth token
  const authToken = await requireAuthToken();
  const baseUrl = process.env.CEB_BACKEND_API_URL || 'https://odisai.net';

  odisLogger.debug('Auth token present', { hasToken: !!authToken, tokenLength: authToken.length, baseUrl });

  // STEP 0: Fetch contact info FIRST (before building clinical text)
  odisLogger.info('Step 0: Fetching contact information...');
  const { phone: ownerPhone, email: ownerEmail } = await fetchContactInfo(consultationData);

  // Build clinical text with structured patient/owner data + consultation notes
  const consultationNotes = consultationData.consultationNotes as { notes?: string } | undefined;
  const rawNotes = consultationNotes?.notes || consultationData.consultation.notes || '';

  if (!rawNotes.trim()) {
    throw new Error('No consultation notes found. Please add notes to the consultation first.');
  }

  // Track workflow start
  await trackEvent(
    {
      event_type: 'discharge_workflow_started',
      event_category: 'discharge',
      event_action: 'start',
      source: 'idexx_extension',
      metadata: {
        consultation_id: consultationData.consultation.id,
        has_email: !!ownerEmail,
        has_phone: !!ownerPhone,
      },
    },
    { trackFeatureUsage: true, updateSession: true },
  );

  // Use orchestration endpoint to handle entire workflow
  odisLogger.info('Step 1: Executing discharge workflow via orchestration endpoint...');

  // Prepare structured data for orchestration endpoint
  const structuredData = {
    // Patient information
    pet_name: consultationData.patient.name || 'Unknown',
    pet_species: consultationData.patient.species || 'unknown',
    pet_breed: consultationData.patient.breed || 'unknown breed',
    pet_date_of_birth: consultationData.patient.dateOfBirth,
    pet_sex: consultationData.patient.sex,
    pet_weight: consultationData.patient.weight?.toString(),
    pet_weight_unit: consultationData.patient.weightUnit,

    // Client/Owner information
    client_first_name: consultationData.client.firstName || '',
    client_last_name: consultationData.client.lastName || '',
    phone_number: ownerPhone || '',
    email: ownerEmail || '',

    // Consultation information
    consultation_id: consultationData.consultation.id,
    consultation_date: consultationData.consultation.date || getCurrentISOString(),
    consultation_reason: consultationData.consultation.reason || 'Follow-up',
    consultation_notes: rawNotes,

    // Clinic information
    clinic_name: consultationData.clientBranch?.name || 'Veterinary Clinic',
    clinic_phone: '', // Not available in IDEXX consultation data
    emergency_phone: '', // Not available in IDEXX consultation data

    // Provider information
    provider_name: consultationData.pageData.providers[0]?.name || 'Dr. Unknown',
    provider_id: consultationData.pageData.providers[0]?.id,

    // Products/Services from consultation
    products_services: formatProductsServices(consultationData.consultationLines, false),
    declined_products_services: formatProductsServices(consultationData.consultationLines, true),
  };

  odisLogger.debug('📦 [Discharge] Products/Services data prepared', {
    hasConsultationLines: !!consultationData.consultationLines,
    linesCount: consultationData.consultationLines?.length || 0,
    acceptedProducts: structuredData.products_services,
    declinedProducts: structuredData.declined_products_services,
  });

  // Calculate email and call times
  const emailTime = addMinutes(now(), 2);
  let callTime: Date | undefined;
  if (ownerPhone) {
    callTime = addDays(now(), 2);
    callTime.setHours(10, 0, 0, 0);
  }

  // Call orchestration endpoint
  const orchestrationResponse = await sendApiRequest(
    `${baseUrl}/api/discharge/orchestrate`,
    'POST',
    {
      input: {
        mode: 'structured',
        source: 'idexx_extension',
        data: structuredData,
      },
      steps: {
        ingest: true,
        generateSummary: true,
        prepareEmail: true,
        scheduleEmail: {
          enabled: !!ownerEmail,
          recipient: 'client',
          scheduledFor: emailTime.toISOString(),
        },
        scheduleCall: {
          enabled: !!ownerPhone,
          phone: ownerPhone,
          scheduledFor: callTime?.toISOString(),
        },
      },
      options: {
        stopOnError: false, // Continue on error to allow partial success
        parallel: true, // Execute email and call in parallel
      },
    },
    authToken,
  );

  if (!orchestrationResponse.success) {
    // Check for partial success
    const steps = orchestrationResponse.data?.steps;
    const caseId = steps?.ingest?.caseId;
    const actions: string[] = [];

    if (steps?.scheduleEmail) actions.push('email');
    if (steps?.scheduleCall) actions.push('call');

    // Collect error messages
    const errors = orchestrationResponse.errors || [];
    const errorMessages = errors
      .map((e: { message?: string; step?: string }) => e.message || e.step || 'Unknown error')
      .join(', ');

    // If we have at least one successful action, consider it partial success
    if (actions.length > 0 || caseId) {
      odisLogger.warn('Partial success in orchestration mode', { actions, caseId, errors });

      // Track partial success
      await trackEvent(
        {
          event_type: 'discharge_workflow_completed',
          event_category: 'discharge',
          event_action: 'complete',
          source: 'idexx_extension',
          case_id: caseId,
          success: true,
          error_message: errorMessages || 'Some steps failed',
          metadata: {
            actions,
            partial_success: true,
            errors: errors.length,
          },
        },
        { updateSession: true },
      );

      return {
        success: true,
        actions,
        error: errorMessages || 'Some steps failed',
      };
    }

    // Track complete failure
    await trackEvent(
      {
        event_type: 'discharge_workflow_completed',
        event_category: 'discharge',
        event_action: 'complete',
        source: 'idexx_extension',
        success: false,
        error_message: errorMessages || orchestrationResponse.error || 'Orchestration failed',
        metadata: {
          errors: errors.length,
        },
      },
      { updateSession: true },
    );

    // Complete failure
    throw new Error(errorMessages || orchestrationResponse.error || 'Orchestration failed');
  }

  // Parse successful response
  const steps = orchestrationResponse.data?.steps || {};
  const actions: string[] = [];

  if (steps.scheduleEmail) actions.push('email');
  if (steps.scheduleCall) actions.push('call');

  // Check for errors in metadata (partial success)
  const metadata = orchestrationResponse.data?.metadata;
  const errors = metadata?.errors || [];
  if (errors.length > 0) {
    const errorMessages = errors.map((e: { message: string }) => e.message).join(', ');
    odisLogger.warn('Partial success in orchestration mode', { actions, errors });
    return {
      success: true,
      actions,
      error: errorMessages,
    };
  }

  odisLogger.info('✅ Discharge workflow complete (orchestration mode)', {
    caseId: steps.ingest?.caseId,
    actions,
  });

  // Track successful completion
  await trackEvent(
    {
      event_type: 'discharge_workflow_completed',
      event_category: 'discharge',
      event_action: 'complete',
      source: 'idexx_extension',
      case_id: steps.ingest?.caseId,
      scheduled_email_id: steps.scheduleEmail?.emailId,
      scheduled_call_id: steps.scheduleCall?.callId,
      success: true,
      metadata: {
        actions,
        has_email: actions.includes('email'),
        has_call: actions.includes('call'),
      },
    },
    { updateSession: true },
  );

  // If no actions were scheduled, provide helpful error message
  if (actions.length === 0) {
    // Check if we had contact info but scheduling failed
    if (ownerEmail || ownerPhone) {
      return {
        success: true,
        actions: [],
        error: 'Discharge created, but email/call scheduling failed. Please check the logs for details.',
      };
    }
    return {
      success: true,
      actions: [],
      error: 'Discharge created, but no email or phone number found. Please add contact info to the client record.',
    };
  }

  return {
    success: true,
    actions,
  };
};

export type { DischargeScheduleResult };

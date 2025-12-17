import { logger, now, getCurrentISOString, addDays, addMinutes } from '@odis-ai/extension-shared';

const odisLogger = logger.child('[ODIS]');

interface ClinicalData {
  patient: {
    name: string;
    species: string;
    breed: string;
    dateOfBirth?: string;
    sex?: string;
    weight?: string;
    weightUnit?: string;
  };
  client: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  consultation: {
    id: string;
    date: string;
    reason: string;
    notes: string;
  };
  clinic: {
    name: string;
    phone: string;
    emergencyPhone: string;
  };
  provider: {
    name: string;
  };
  existingCaseId?: string | null;
}

interface DischargeResult {
  success: boolean;
  actions: ('email' | 'call')[];
  error?: string;
  caseId?: string;
}

/**
 * Send API requests via background script to handle CORS and cookies
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
 * Execute discharge workflow using orchestration mode (primary API)
 */
const executeDischargeWorkflowOrchestration = async (
  data: ClinicalData,
  authToken: string,
  baseUrl: string = process.env.CEB_BACKEND_API_URL || 'https://odisai.net',
): Promise<DischargeResult> => {
  try {
    odisLogger.info('🚀 Starting discharge workflow (orchestration mode)', { patient: data.patient.name });

    // Prepare structured data
    const structuredData = {
      // Patient information
      pet_name: data.patient.name || 'Unknown',
      pet_species: data.patient.species || 'unknown',
      pet_breed: data.patient.breed || 'unknown breed',
      pet_date_of_birth: data.patient.dateOfBirth,
      pet_sex: data.patient.sex,
      pet_weight: data.patient.weight,
      pet_weight_unit: data.patient.weightUnit,

      // Client/Owner information
      client_first_name: data.client.firstName || '',
      client_last_name: data.client.lastName || '',
      phone_number: data.client.phone || '',
      email: data.client.email || '',

      // Consultation information
      consultation_id: data.consultation.id,
      consultation_date: data.consultation.date || getCurrentISOString(),
      consultation_reason: data.consultation.reason || 'Follow-up',
      consultation_notes: data.consultation.notes || '',

      // Clinic information
      clinic_name: data.clinic.name || 'Veterinary Clinic',
      clinic_phone: data.clinic.phone || '',
      emergency_phone: data.clinic.emergencyPhone || data.clinic.phone || '',

      // Provider information
      provider_name: data.provider.name || 'Veterinarian',
    };

    // Calculate email and call times
    const emailTime = addMinutes(now(), 2);
    let callTime: Date | undefined;
    if (data.client.phone) {
      callTime = addDays(now(), 2);
      callTime.setHours(10, 0, 0, 0);
    }

    // Call orchestration endpoint
    odisLogger.info('Calling orchestration endpoint...');
    const response = await sendApiRequest(
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
            enabled: !!data.client.email,
            recipient: 'client',
            scheduledFor: emailTime.toISOString(),
          },
          scheduleCall: {
            enabled: !!data.client.phone,
            phone: data.client.phone,
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

    if (!response.success) {
      // Check if there are any successful steps (partial success scenario)
      const steps = response.data?.steps;
      const caseId = steps?.ingest?.caseId;
      const actions: ('email' | 'call')[] = [];

      if (steps?.scheduleEmail) actions.push('email');
      if (steps?.scheduleCall) actions.push('call');

      // Collect error messages
      const errors = response.errors || [];
      const errorMessages = errors
        .map((e: { message?: string; step?: string }) => e.message || e.step || 'Unknown error')
        .join(', ');

      // If we have at least one successful action, consider it partial success
      if (actions.length > 0 || caseId) {
        odisLogger.warn('Partial success in orchestration mode', { actions, caseId, errors });
        return {
          success: true,
          actions,
          caseId,
          error: errorMessages || response.error || 'Some steps failed',
        };
      }

      // Complete failure
      throw new Error(errorMessages || response.error || 'Orchestration failed');
    }

    // Parse successful response
    const steps = response.data?.steps || {};
    const actions: ('email' | 'call')[] = [];

    if (steps.scheduleEmail) actions.push('email');
    if (steps.scheduleCall) actions.push('call');

    const caseId = steps.ingest?.caseId;

    // Check for errors in metadata (partial success)
    const metadata = response.data?.metadata;
    const errors = metadata?.errors || [];
    if (errors.length > 0) {
      const errorMessages = errors.map((e: { message: string }) => e.message).join(', ');
      odisLogger.warn('Partial success in orchestration mode', { actions, caseId, errors });
      return {
        success: true,
        actions,
        caseId,
        error: errorMessages,
      };
    }

    if (actions.length === 0 && !caseId) {
      return {
        success: true,
        actions: [],
        error: 'No email or phone number provided',
      };
    }

    odisLogger.info('✅ Discharge workflow complete (orchestration mode)', { actions, caseId });

    return {
      success: true,
      actions,
      caseId,
    };
  } catch (error) {
    odisLogger.error('Error executing discharge workflow (orchestration mode)', { error });
    return {
      success: false,
      actions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Execute complete discharge workflow using legacy multi-endpoint approach
 */
const executeDischargeWorkflowLegacy = async (
  data: ClinicalData,
  authToken: string,
  baseUrl: string = process.env.CEB_BACKEND_API_URL || 'https://odisai.net',
): Promise<DischargeResult> => {
  try {
    odisLogger.info('🚀 Starting discharge workflow', { patient: data.patient.name });

    // Step 1: Use unified ingest endpoint to create/update case and optionally schedule call
    // The ingest endpoint handles smart merging (updates existing cases instead of creating duplicates)
    const actions: ('email' | 'call')[] = [];

    // Prepare structured data for ingest endpoint
    const structuredData = {
      // Patient information
      pet_name: data.patient.name || 'Unknown',
      pet_species: data.patient.species || 'unknown',
      pet_breed: data.patient.breed || 'unknown breed',
      pet_date_of_birth: data.patient.dateOfBirth,
      pet_sex: data.patient.sex,
      pet_weight: data.patient.weight,
      pet_weight_unit: data.patient.weightUnit,

      // Client/Owner information
      client_first_name: data.client.firstName || '',
      client_last_name: data.client.lastName || '',
      phone_number: data.client.phone || '',
      email: data.client.email || '',

      // Consultation information
      consultation_id: data.consultation.id,
      consultation_date: data.consultation.date || getCurrentISOString(),
      consultation_reason: data.consultation.reason || 'Follow-up',
      consultation_notes: data.consultation.notes || '',

      // Clinic information
      clinic_name: data.clinic.name || 'Veterinary Clinic',
      clinic_phone: data.clinic.phone || '',
      emergency_phone: data.clinic.emergencyPhone || data.clinic.phone || '',

      // Provider information
      provider_name: data.provider.name || 'Veterinarian',
    };

    // Calculate call time if phone exists
    let callTime: Date | undefined;
    if (data.client.phone) {
      callTime = addDays(now(), 2);
      callTime.setHours(10, 0, 0, 0);
    }

    // Ingest case with autoSchedule if phone exists
    odisLogger.info('Step 1: Ingesting case via unified endpoint...');
    const ingestResponse = await sendApiRequest(
      `${baseUrl}/api/cases/ingest`,
      'POST',
      {
        mode: 'structured',
        source: 'idexx_extension',
        data: structuredData,
        options: {
          autoSchedule: !!data.client.phone,
          // Note: scheduledFor and inputType are not supported by the backend schema
          // The backend will determine the schedule time when autoSchedule is true
        },
      },
      authToken,
    );

    if (!ingestResponse.success) {
      throw new Error(ingestResponse.error || 'Failed to ingest case');
    }

    const caseId = ingestResponse.data?.caseId;
    if (!caseId) {
      throw new Error('Failed to create/update case');
    }

    odisLogger.info('✅ Case ingested successfully', {
      caseId,
      scheduledCall: ingestResponse.data?.scheduledCall,
    });

    if (ingestResponse.data?.scheduledCall) {
      actions.push('call');
    }

    // Step 4: Generate email content (if email exists)
    if (data.client.email) {
      odisLogger.info('Step 4: Generating email content...');
      const emailContentResponse = await sendApiRequest(
        `${baseUrl}/api/generate/discharge-email`,
        'POST',
        {
          caseId,
        },
        authToken,
      );

      if (!emailContentResponse.subject || !emailContentResponse.html) {
        throw new Error('Failed to generate email content');
      }

      // Step 5: Schedule email delivery
      odisLogger.info('Step 5: Scheduling email delivery...');
      const emailTime = addMinutes(now(), 2);

      await sendApiRequest(
        `${baseUrl}/api/send/discharge-email`,
        'POST',
        {
          caseId,
          recipientEmail: data.client.email,
          recipientName: `${data.client.firstName || ''} ${data.client.lastName || ''}`.trim(),
          subject: emailContentResponse.subject,
          htmlContent: emailContentResponse.html,
          textContent: emailContentResponse.text,
          scheduledFor: emailTime.toISOString(),
          metadata: {
            source: 'idexx-extension',
            consultation_id: data.consultation.id,
          },
        },
        authToken,
      );

      actions.push('email');
    }

    if (actions.length === 0) {
      return {
        success: true, // Technically success, just nothing sent
        actions: [],
        caseId,
        error: 'No email or phone number provided',
      };
    }

    odisLogger.info('✅ Discharge workflow complete');

    return {
      success: true,
      actions,
      caseId,
    };
  } catch (error) {
    odisLogger.error('Error executing discharge workflow', { error });
    return {
      success: false,
      actions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Execute complete discharge workflow: normalize → generate summary → generate email → send email
 * Always uses orchestration mode, falls back to legacy mode on error
 */
const executeDischargeWorkflow = async (
  data: ClinicalData,
  authToken: string,
  baseUrl: string = process.env.CEB_BACKEND_API_URL || 'https://odisai.net',
): Promise<DischargeResult> => {
  try {
    odisLogger.info('Using orchestration mode');
    return await executeDischargeWorkflowOrchestration(data, authToken, baseUrl);
  } catch (error) {
    odisLogger.error('Orchestration mode failed, falling back to legacy mode', { error });
    // Fallback to legacy mode on error for safety
    return executeDischargeWorkflowLegacy(data, authToken, baseUrl);
  }
};

export type { ClinicalData, DischargeResult };
export { executeDischargeWorkflow };

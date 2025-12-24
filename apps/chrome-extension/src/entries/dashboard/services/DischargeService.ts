import { logger, getCurrentISOString, now, addMinutes, testModeStorage, IS_DEV, trackEvent } from '@odis-ai/extension/shared';

const odisLogger = logger.child('[ODIS-DASHBOARD]');

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
    // Check test mode (only in development)
    let testMode = null;
    if (IS_DEV) {
      testMode = await testModeStorage.get();
      if (testMode?.enabled) {
        odisLogger.warn('🧪 TEST MODE ACTIVE - Overriding recipient information', {
          originalEmail: data.client.email,
          originalPhone: data.client.phone,
          testEmail: testMode.testEmail,
          testPhone: testMode.testPhone,
        });
      }
    }

    // Override email/phone if test mode is enabled
    const clientEmail = testMode?.enabled && testMode.testEmail ? testMode.testEmail : data.client.email;
    const clientPhone = testMode?.enabled && testMode.testPhone ? testMode.testPhone : data.client.phone;

    odisLogger.info('🚀 Starting discharge workflow (orchestration mode)', {
      patient: data.patient.name,
      testMode: testMode?.enabled ? 'ACTIVE' : 'inactive',
    });

    // Track workflow start
    await trackEvent(
      {
        event_type: 'discharge_workflow_started',
        event_category: 'discharge',
        event_action: 'start',
        source: 'dashboard',
        case_id: data.existingCaseId || undefined,
        metadata: {
          consultation_id: data.consultation.id,
          has_email: !!clientEmail,
          has_phone: !!clientPhone,
          test_mode: testMode?.enabled || false,
        },
      },
      { trackFeatureUsage: true, updateSession: true },
    );

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

      // Client/Owner information (use test mode overrides)
      client_first_name: data.client.firstName || '',
      client_last_name: data.client.lastName || '',
      phone_number: clientPhone || '',
      email: clientEmail || '',

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

    // Calculate schedule times (use test mode schedule if enabled)
    const emailScheduleMinutes = testMode?.enabled ? testMode.emailScheduleMinutes : 2;
    const emailTime = addMinutes(now(), emailScheduleMinutes);

    let callTime: Date | undefined;
    if (clientPhone) {
      // Use test mode schedule minutes if enabled, otherwise default to 2 days (2880 minutes)
      const phoneScheduleMinutes = testMode?.enabled ? testMode.phoneScheduleMinutes : 2 * 24 * 60; // 2 days in minutes
      callTime = addMinutes(now(), phoneScheduleMinutes);
      // Only set hours if not in test mode (test mode uses exact minutes)
      if (!testMode?.enabled) {
        callTime.setHours(10, 0, 0, 0);
      }

      if (testMode?.enabled) {
        odisLogger.info('🧪 TEST MODE: Using test phone schedule', {
          scheduleMinutes: phoneScheduleMinutes,
          testPhone: clientPhone,
        });
      }
    }

    if (testMode?.enabled) {
      odisLogger.info('🧪 TEST MODE: Using test email schedule', {
        scheduleMinutes: emailScheduleMinutes,
        testEmail: clientEmail,
      });
    }

    // Call orchestration endpoint
    odisLogger.info('Calling orchestration endpoint...');

    // Build steps object - only include scheduleEmail/scheduleCall if email/phone exists
    const steps: Record<string, unknown> = {
      ingest: true,
      generateSummary: true,
      prepareEmail: true,
    };

    // Only include scheduleEmail if email exists
    if (clientEmail) {
      steps.scheduleEmail = {
        recipientEmail: clientEmail,
        scheduledFor: emailTime.toISOString(),
      };
    }

    // Only include scheduleCall if phone exists
    if (clientPhone && callTime) {
      steps.scheduleCall = {
        phoneNumber: clientPhone,
        scheduledFor: callTime.toISOString(),
      };
    }

    const response = await sendApiRequest(
      `${baseUrl}/api/discharge/orchestrate`,
      'POST',
      {
        input: {
          rawData: {
            mode: 'structured',
            source: 'idexx_extension',
            data: structuredData,
          },
        },
        steps,
        options: {
          stopOnError: false, // Continue on error to allow partial success
          parallel: true, // Execute email and call in parallel
        },
      },
      authToken,
    );

    if (!response.success) {
      // Check if there are any successful steps (partial success scenario)
      const responseData = response.data || {};
      const caseId = responseData.ingestion?.caseId;
      const actions: ('email' | 'call')[] = [];

      if (responseData.emailSchedule) actions.push('email');
      if (responseData.call) actions.push('call');

      // Collect error messages from metadata
      const metadata = response.metadata || {};
      const errors = metadata.errors || [];
      const errorMessages = errors
        .map((e: { error?: string; step?: string }) => e.error || e.step || 'Unknown error')
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
            source: 'dashboard',
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
          caseId,
          error: errorMessages || response.error || 'Some steps failed',
        };
      }

      // Track complete failure
      await trackEvent(
        {
          event_type: 'discharge_workflow_completed',
          event_category: 'discharge',
          event_action: 'complete',
          source: 'dashboard',
          case_id: data.existingCaseId || undefined,
          success: false,
          error_message: errorMessages || response.error || 'Orchestration failed',
          metadata: {
            errors: errors.length,
          },
        },
        { updateSession: true },
      );

      // Complete failure
      throw new Error(errorMessages || response.error || 'Orchestration failed');
    }

    // Parse successful response
    const responseData = response.data || {};
    const actions: ('email' | 'call')[] = [];

    if (responseData.emailSchedule) actions.push('email');
    if (responseData.call) actions.push('call');

    const caseId = responseData.ingestion?.caseId;

    // Check for errors in metadata (partial success)
    const metadata = response.metadata || {};
    const errors = metadata.errors || [];
    if (errors.length > 0) {
      const errorMessages = errors
        .map((e: { error?: string; step?: string }) => e.error || e.step || 'Unknown error')
        .join(', ');
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

    odisLogger.info('✅ Discharge workflow complete (orchestration mode)', {
      actions,
      caseId,
      testMode: testMode?.enabled ? 'ACTIVE' : 'inactive',
    });

    // Track successful completion
    await trackEvent(
      {
        event_type: 'discharge_workflow_completed',
        event_category: 'discharge',
        event_action: 'complete',
        source: 'dashboard',
        case_id: caseId,
        scheduled_email_id: responseData.emailSchedule?.emailId,
        scheduled_call_id: responseData.call?.callId,
        success: true,
        metadata: {
          actions,
          has_email: actions.includes('email'),
          has_call: actions.includes('call'),
        },
      },
      { updateSession: true },
    );

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
    // Check test mode (only in development)
    let testMode = null;
    if (IS_DEV) {
      testMode = await testModeStorage.get();
      if (testMode.enabled) {
        odisLogger.warn('🧪 TEST MODE ACTIVE - Overriding recipient information', {
          originalEmail: data.client.email,
          originalPhone: data.client.phone,
          testEmail: testMode.testEmail,
          testPhone: testMode.testPhone,
        });
      }
    }

    // Override email/phone if test mode is enabled
    const clientEmail = testMode?.enabled && testMode.testEmail ? testMode.testEmail : data.client.email;
    const clientPhone = testMode?.enabled && testMode.testPhone ? testMode.testPhone : data.client.phone;

    odisLogger.info('🚀 Starting discharge workflow', {
      patient: data.patient.name,
      testMode: testMode?.enabled ? 'ACTIVE' : 'inactive',
    });

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
      phone_number: clientPhone || '',
      email: clientEmail || '',

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
    if (clientPhone) {
      // Use test mode schedule minutes if enabled, otherwise default to 2 days (2880 minutes)
      const scheduleMinutes = testMode?.enabled ? testMode.phoneScheduleMinutes : 2 * 24 * 60; // 2 days in minutes
      callTime = addMinutes(now(), scheduleMinutes);
      // Only set hours if not in test mode (test mode uses exact minutes)
      if (!testMode?.enabled) {
        callTime.setHours(10, 0, 0, 0);
      }

      if (testMode?.enabled) {
        odisLogger.info('🧪 TEST MODE: Using test phone schedule', {
          scheduleMinutes,
          testPhone: clientPhone,
        });
      }
    }

    // Ingest case with autoSchedule if phone exists
    odisLogger.info('Step 1: Ingesting case via unified endpoint...');
    let ingestResponse;
    try {
      ingestResponse = await sendApiRequest(
        `${baseUrl}/api/cases/ingest`,
        'POST',
        {
          mode: 'structured',
          source: 'idexx_extension',
          data: structuredData,
          options: {
            autoSchedule: !!clientPhone,
            // Note: scheduledFor and inputType are not supported by the backend schema
            // The backend will determine the schedule time when autoSchedule is true
          },
        },
        authToken,
      );
    } catch (error) {
      // Handle 405 Method Not Allowed specifically
      if (
        (error instanceof Error && error.message.includes('405')) ||
        (error instanceof Error && error.message.includes('Method Not Allowed'))
      ) {
        const errorMsg = `API endpoint /api/cases/ingest is not available or does not accept POST requests. This endpoint must be deployed on the backend. Please check backend deployment status.`;
        odisLogger.error('❌ Backend endpoint not available', {
          endpoint: `${baseUrl}/api/cases/ingest`,
          method: 'POST',
          error: error.message,
        });
        throw new Error(errorMsg);
      }
      throw error;
    }

    if (!ingestResponse.success) {
      throw new Error(ingestResponse.error || 'Failed to ingest case');
    }

    const caseId = ingestResponse.data?.caseId;
    if (!caseId) {
      throw new Error('Failed to create/update case - no caseId returned from API');
    }

    odisLogger.info('✅ Case ingested successfully', {
      caseId,
      scheduledCall: ingestResponse.data?.scheduledCall,
    });

    if (ingestResponse.data?.scheduledCall) {
      actions.push('call');
    }

    // Step 4: Generate email content (if email exists)
    if (clientEmail) {
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
      // Use test mode schedule minutes if enabled, otherwise default to 2 minutes
      const scheduleMinutes = testMode?.enabled ? testMode.emailScheduleMinutes : 2;
      const emailTime = addMinutes(now(), scheduleMinutes);

      if (testMode?.enabled) {
        odisLogger.info('🧪 TEST MODE: Using test email schedule', {
          scheduleMinutes,
          testEmail: clientEmail,
        });
      }

      await sendApiRequest(
        `${baseUrl}/api/send/discharge-email`,
        'POST',
        {
          caseId,
          recipientEmail: clientEmail,
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

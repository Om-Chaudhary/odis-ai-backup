import { scrapeClientPhoneFromPage } from './dom/client-dom-scraper';
import { scrapeClientEmailFromPage } from './dom/client-email-scraper';
import { fetchClientPhoneNumber } from './extraction/client-fetcher';
import { fetchCurrentConsultationData } from './extraction/consultation-fetcher';
import { normalizePhoneNumber, isValidE164PhoneNumber } from './formatting/phone-formatter';
import { validateConsultationData } from './transformation/consultation-transformer';
import { logger, getAuthSession, getCurrentISOString } from '@odis-ai/extension/shared';
import type { IdexxConsultationPageData } from '../types';

const odisLogger = logger.child('[ODIS]');

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
 * Enforce 12pm-5pm time constraint for scheduled calls
 * If scheduled time is outside this range, adjust to nearest valid time
 */
const enforceBusinessHours = (date: Date): Date => {
  const constrainedDate = new Date(date);
  const hours = constrainedDate.getHours();

  // If before 12pm, set to 12pm
  if (hours < 12) {
    constrainedDate.setHours(12, 0, 0, 0);
  }
  // If after 5pm (17:00), set to next day at 12pm
  else if (hours >= 17) {
    constrainedDate.setDate(constrainedDate.getDate() + 1);
    constrainedDate.setHours(12, 0, 0, 0);
  }

  return constrainedDate;
};

/**
 * Wait for phone number to populate with retries
 */
const waitForPhoneNumber = async (
  data: IdexxConsultationPageData,
  maxRetries = 3,
  delayMs = 1000,
): Promise<{ phone: string; type: 'mobile' | 'home' | 'work' | 'other' | null }> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Try consultation data first
    const phoneNumber =
      data.client.phone || data.client.mobilePhone || data.client.homePhone || data.client.workPhone || '';
    let detectedPhoneType: 'mobile' | 'home' | 'work' | 'other' | null = null;

    if (phoneNumber) {
      if (data.client.mobilePhone === phoneNumber) detectedPhoneType = 'mobile';
      else if (data.client.homePhone === phoneNumber) detectedPhoneType = 'home';
      else if (data.client.workPhone === phoneNumber) detectedPhoneType = 'work';
      else detectedPhoneType = 'other';

      return { phone: normalizePhoneNumber(phoneNumber), type: detectedPhoneType };
    }

    // Try client API
    if (data.client.id) {
      try {
        const clientPhoneResult = await fetchClientPhoneNumber(data.client.id);
        if (clientPhoneResult.phone) {
          return {
            phone: normalizePhoneNumber(clientPhoneResult.phone),
            type: clientPhoneResult.type,
          };
        }

        // Fallback: DOM scraping
        const scrapedResult = await scrapeClientPhoneFromPage(data.client.id);
        if (scrapedResult.phone) {
          return {
            phone: normalizePhoneNumber(scrapedResult.phone),
            type: scrapedResult.type,
          };
        }
      } catch (err) {
        odisLogger.error(`❌ Failed to fetch phone (attempt ${attempt + 1})`, { error: err });
      }
    }

    // Wait before retry (except on last attempt)
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // No phone found after all retries
  return { phone: '', type: null };
};

/**
 * Wait for email to populate with retries
 */
const waitForEmail = async (data: IdexxConsultationPageData, maxRetries = 3, delayMs = 1000): Promise<string> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Try consultation data first
    const email = data.client.email || '';

    if (email) {
      return email;
    }

    // Fallback: DOM scraping
    if (data.client.id) {
      try {
        const scrapedResult = await scrapeClientEmailFromPage(data.client.id);
        if (scrapedResult.email) {
          return scrapedResult.email;
        }
      } catch (err) {
        odisLogger.error(`❌ Failed to fetch email (attempt ${attempt + 1})`, { error: err });
      }
    }

    // Wait before retry (except on last attempt)
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // No email found after all retries
  return '';
};

/**
 * Send discharge (email + call) from menu bar
 * This is the main entry point for the "Send Discharge" button
 * Implements the full workflow: normalize → email chain → call chain
 */
const scheduleDischargeCallFromMenuBar = async (): Promise<void> => {
  // Fetch current consultation data
  const data = await fetchCurrentConsultationData();

  if (!data) {
    throw new Error('Failed to fetch consultation data. Make sure you are on a consultation page.');
  }

  // Validate data
  const validation = validateConsultationData(data);
  if (!validation.valid) {
    throw new Error(`Invalid consultation data: ${validation.errors.join(', ')}`);
  }

  // Wait for email to populate
  const ownerEmail = await waitForEmail(data);
  const { phone: phoneNumber } = await waitForPhoneNumber(data);

  // Check if all required fields are present
  const fullName = `${data.client.firstName || ''} ${data.client.lastName || ''}`.trim();

  // Validate required fields
  const missingFields = [];
  if (!fullName.trim()) missingFields.push('owner name');
  if (!phoneNumber) missingFields.push('phone number');
  else if (!isValidE164PhoneNumber(phoneNumber)) missingFields.push('valid phone number format');
  if (!ownerEmail) missingFields.push('owner email');

  if (missingFields.length > 0) {
    throw new Error(
      `Cannot send discharge. Missing required fields: ${missingFields.join(', ')}. ` +
        `Please ensure the consultation page has complete client information.`,
    );
  }

  // Calculate schedule dates
  const callScheduleDate = enforceBusinessHours(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)); // 2 days
  const emailScheduleDate = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes (immediate)

  // Get auth token from extension storage
  const token = await getSupabaseToken();
  if (!token) {
    throw new Error('Not signed in. Please sign in to the extension first.');
  }

  // Execute the complete workflow
  try {
    const result = await executeDischargeWorkflow({
      consultationData: data,
      ownerEmail,
      ownerPhone: phoneNumber,
      callScheduledTime: callScheduleDate,
      emailScheduledTime: emailScheduleDate,
      token,
    });

    if (!result.success) {
      throw new Error(result.error || 'Discharge workflow failed');
    }

    // Show success notification
    showSuccessToast(
      `Discharge sent! Email: ${emailScheduleDate.toLocaleTimeString()}, Call: ${callScheduleDate.toLocaleDateString()} at ${callScheduleDate.toLocaleTimeString()}`,
    );
  } catch (error) {
    odisLogger.error('❌ Discharge workflow failed', { error });
    throw error;
  }
};

/**
 * Get Supabase auth token from extension storage
 * The token is stored by Supabase client in chrome.storage.local with a key like:
 * sb-<project-ref>-auth-token
 */
/**
 * Get Supabase auth token from the shared Supabase client
 * This is more reliable than manually parsing Chrome storage
 */
const getSupabaseToken = async (): Promise<string | null> => {
  try {
    const session = await getAuthSession();

    if (!session) {
      odisLogger.error('No active Supabase session found');
      return null;
    }

    const token = session.access_token;
    if (!token) {
      odisLogger.error('Session found but no access_token');
      return null;
    }

    odisLogger.info('✅ Retrieved auth token from Supabase client');
    return token;
  } catch (err) {
    odisLogger.error('Error getting Supabase token', { error: err });
    return null;
  }
};

/**
 * Execute complete discharge workflow: normalize → generate summary → generate email → send email
 */
interface DischargeWorkflowParams {
  consultationData: IdexxConsultationPageData;
  ownerEmail: string;
  ownerPhone: string;
  callScheduledTime: Date;
  emailScheduledTime: Date;
  token: string;
}

interface DischargeWorkflowResult {
  success: boolean;
  error?: string;
  caseId?: string;
  discharge?: {
    summaryId: string;
    emailId: string;
    vapiCallId: string;
  };
  scheduledTimes?: {
    email: string;
    call: string;
  };
}

const executeDischargeWorkflow = async (params: DischargeWorkflowParams): Promise<DischargeWorkflowResult> => {
  const { consultationData, ownerEmail, ownerPhone, callScheduledTime, emailScheduledTime, token } = params;

  const baseUrl = process.env.CEB_BACKEND_API_URL || 'https://odisai.net';

  try {
    // ========================================
    // STEP 1: Execute Complete Workflow via Orchestration Endpoint
    // ========================================
    odisLogger.info('Step 1/1: Executing discharge workflow via orchestration endpoint...');

    // Extract consultation notes
    const consultationNotesData = consultationData.consultationNotes as { notes?: string } | undefined;
    const rawNotes = consultationNotesData?.notes || consultationData.consultation.notes || '';

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
      clinic_name: consultationData.clientBranch?.name || consultationData.pageData.clinicName || 'IDEXX Clinic',
      clinic_phone: consultationData.pageData.clinicPhone || '',
      emergency_phone: consultationData.pageData.emergencyPhone || consultationData.pageData.clinicPhone || '',

      // Provider information
      provider_name: consultationData.pageData.providers[0]?.name || 'the veterinarian',
      provider_id: consultationData.pageData.providers[0]?.id,
    };

    // Call orchestration endpoint via background script
    const result = await sendApiRequest(
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
            scheduledFor: emailScheduledTime.toISOString(),
          },
          scheduleCall: {
            enabled: !!ownerPhone,
            phone: ownerPhone,
            scheduledFor: callScheduledTime.toISOString(),
          },
        },
        options: {
          stopOnError: false, // Continue on error to allow partial success
          parallel: true, // Execute email and call in parallel
        },
      },
      token,
    );

    if (!result.success) {
      // Check for partial success
      const steps = result.data?.steps;
      const caseId = steps?.ingest?.caseId;
      const errors = result.errors || [];
      const errorMessages = errors
        .map((e: { message?: string; step?: string }) => e.message || e.step || 'Unknown error')
        .join(', ');

      // If we have at least a caseId, consider it partial success
      if (caseId) {
        odisLogger.warn('Partial success in orchestration mode', { caseId, errors });
        return {
          success: true,
          caseId,
          discharge: {
            summaryId: steps?.generateSummary?.summaryId || '',
            emailId: steps?.scheduleEmail?.emailId || '',
            vapiCallId: steps?.scheduleCall?.callId || '',
          },
          scheduledTimes: {
            email: steps?.scheduleEmail?.scheduledFor || emailScheduledTime.toISOString(),
            call: steps?.scheduleCall?.scheduledFor || callScheduledTime.toISOString(),
          },
          error: errorMessages || 'Some steps failed',
        };
      }

      // Complete failure
      throw new Error(errorMessages || 'Orchestration failed');
    }

    const steps = result.data?.steps || {};

    odisLogger.info('✓ Step 1/1: Discharge orchestration complete', {
      caseId: steps.ingest?.caseId,
      emailScheduled: !!steps.scheduleEmail,
      callScheduled: !!steps.scheduleCall,
    });

    // Check for errors in metadata (partial success)
    const metadata = result.data?.metadata;
    const errors = metadata?.errors || [];
    const errorMessages = errors.length > 0 ? errors.map((e: { message: string }) => e.message).join(', ') : undefined;

    // ========================================
    // SUCCESS - Return Results
    // ========================================
    return {
      success: true,
      caseId: steps.ingest?.caseId,
      discharge: {
        summaryId: steps.generateSummary?.summaryId || '',
        emailId: steps.scheduleEmail?.emailId || '',
        vapiCallId: steps.scheduleCall?.callId || '',
      },
      scheduledTimes: {
        email: steps.scheduleEmail?.scheduledFor || emailScheduledTime.toISOString(),
        call: steps.scheduleCall?.scheduledFor || callScheduledTime.toISOString(),
      },
      error: errorMessages,
    };
  } catch (error) {
    odisLogger.error('Discharge workflow error', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Show a success toast notification
 */
const showSuccessToast = (message: string) => {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #10b981;
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    z-index: 100001;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  toast.innerHTML = `<span>✅</span><span>${message}</span>`;

  document.body.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
};

export { scheduleDischargeCallFromMenuBar };

import { logger, requireAuthToken } from '@odis-ai/extension/shared';
import type { IdexxConsultationPageData } from '../../types';

const odisLogger = logger.child('[ODIS]');

/**
 * Options for case ingestion
 */
export interface CaseIngestOptions {
  /**
   * If true, automatically schedule a discharge call after creating/updating the case
   */
  autoSchedule?: boolean;
  /**
   * When to schedule the call (ISO 8601 timestamp)
   * Required if autoSchedule is true
   */
  scheduledFor?: string;
  /**
   * Input type hint for normalization (e.g., 'soap_note', 'visit_notes')
   */
  inputType?: string;
}

/**
 * Structured data payload for IDEXX extension
 */
export interface StructuredIngestData {
  // Patient information
  pet_name?: string;
  pet_species?: string;
  pet_breed?: string;
  pet_date_of_birth?: string;
  pet_sex?: string;
  pet_weight?: string;
  pet_weight_unit?: string;

  // Client/Owner information
  client_first_name?: string;
  client_last_name?: string;
  phone_number?: string;
  email?: string;

  // Consultation information
  consultation_id?: string | number;
  consultation_date?: string;
  consultation_reason?: string;
  consultation_notes?: string;

  // Clinic information
  clinic_name?: string;
  clinic_phone?: string;
  emergency_phone?: string;

  // Provider information
  provider_name?: string;
  provider_id?: number;

  // Additional metadata (will be stored in case metadata)
  [key: string]: unknown;
}

/**
 * Request payload for /api/cases/ingest endpoint
 */
export interface CaseIngestRequest {
  mode: 'structured';
  source: 'idexx_extension';
  data: StructuredIngestData;
  options?: CaseIngestOptions;
}

/**
 * Response from /api/cases/ingest endpoint
 */
export interface CaseIngestResponse {
  success: boolean;
  data?: {
    caseId: string;
    entities?: Record<string, unknown>;
    scheduledCall?: {
      callId: string;
      scheduledFor: string;
      qstashMessageId?: string;
    };
  };
  error?: string;
}

/**
 * API client for ingesting cases via the unified /api/cases/ingest endpoint
 * This replaces the old normalize + schedule flow with a single unified endpoint
 */
export class CasesIngestApi {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Default to environment variable or fallback
    this.baseUrl = baseUrl || process.env.CEB_BACKEND_API_URL || 'https://odisai.net';
  }

  /**
   * Ingest a case from IDEXX consultation data
   * This creates or updates a case and optionally schedules a call
   */
  async ingestCase(idexxData: IdexxConsultationPageData, options?: CaseIngestOptions): Promise<CaseIngestResponse> {
    try {
      // Get authentication token from Supabase
      const authToken = await requireAuthToken();

      // Transform IDEXX data to structured format
      const structuredData = this.transformIdexxToStructured(idexxData);

      // Filter options to only include fields supported by the backend schema
      const backendOptions = options
        ? {
            autoSchedule: options.autoSchedule,
            // Note: scheduledFor and inputType are not supported by the backend schema
            // The backend will determine the schedule time when autoSchedule is true
          }
        : undefined;

      const request: CaseIngestRequest = {
        mode: 'structured',
        source: 'idexx_extension',
        data: structuredData,
        options: backendOptions,
      };

      odisLogger.info('Sending case ingest request to backend...', {
        url: `${this.baseUrl}/api/cases/ingest`,
        consultationId: idexxData.consultation.id,
        autoSchedule: options?.autoSchedule || false,
        scheduledFor: options?.scheduledFor,
      });

      // Send request via background script to bypass CORS
      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        url: `${this.baseUrl}/api/cases/ingest`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: request,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to ingest case');
      }

      const data = response.data as CaseIngestResponse;

      odisLogger.info('✅ Case ingested successfully', {
        caseId: data.data?.caseId,
        scheduledCall: data.data?.scheduledCall,
      });

      return data;
    } catch (error) {
      odisLogger.error('❌ Failed to ingest case', { error });

      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to ingest case. Please try again.');
    }
  }

  /**
   * Transform IDEXX consultation page data to structured ingest format
   */
  private transformIdexxToStructured(idexxData: IdexxConsultationPageData): StructuredIngestData {
    // Extract consultation notes
    const consultationNotesData = idexxData.consultationNotes as { notes?: string } | undefined;
    const rawNotes = consultationNotesData?.notes || idexxData.consultation.notes || '';

    // Extract phone number (try multiple fields)
    const phoneNumber =
      idexxData.client.phone ||
      idexxData.client.mobilePhone ||
      idexxData.client.homePhone ||
      idexxData.client.workPhone ||
      idexxData.client.phoneNumber ||
      '';

    // Extract provider info
    const primaryProvider = idexxData.pageData.providers?.[0];

    return {
      // Patient information
      pet_name: idexxData.patient.name,
      pet_species: idexxData.patient.species,
      pet_breed: idexxData.patient.breed,
      pet_date_of_birth: idexxData.patient.dateOfBirth,
      pet_sex: idexxData.patient.sex,
      pet_weight: idexxData.patient.weight?.toString(),
      pet_weight_unit: idexxData.patient.weightUnit,

      // Client/Owner information
      client_first_name: idexxData.client.firstName,
      client_last_name: idexxData.client.lastName,
      phone_number: phoneNumber,
      email: idexxData.client.email,

      // Consultation information
      consultation_id: idexxData.consultation.id,
      consultation_date: idexxData.consultation.date,
      consultation_reason: idexxData.consultation.reason,
      consultation_notes: rawNotes,

      // Clinic information
      clinic_name: idexxData.clientBranch?.name,
      clinic_phone: '', // Not available in IDEXX consultation data
      emergency_phone: '', // Not available in IDEXX consultation data

      // Provider information
      provider_name: primaryProvider?.name,
      provider_id: primaryProvider?.id,

      // Store full IDEXX data in metadata for reference
      idexx_metadata: {
        consultation_id: idexxData.consultation.id,
        patient_id: idexxData.patient.id,
        client_id: idexxData.client.id,
        provider_id: primaryProvider?.id,
        company_id: idexxData.clientBranch?.id,
      },
    };
  }
}

/**
 * Singleton instance of the API client
 */
export const casesIngestApi = new CasesIngestApi();

/**
 * Convenience function to ingest a case from IDEXX data
 */
export const ingestCaseFromIdexx = async (
  idexxData: IdexxConsultationPageData,
  options?: CaseIngestOptions,
): Promise<CaseIngestResponse> => casesIngestApi.ingestCase(idexxData, options);

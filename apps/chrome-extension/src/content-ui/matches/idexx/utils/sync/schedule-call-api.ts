import { logger, requireAuthToken } from '@odis-ai/extension-shared';
import type { ScheduleCallRequest, ScheduleCallResponse, ScheduledCall } from '../../types';

const odisLogger = logger.child('[ODIS]');

/**
 * API client for scheduling discharge follow-up calls via VAPI
 * Uses the unified /api/calls/schedule endpoint
 */
export class ScheduleCallApi {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Default to environment variable or fallback
    // Update this to match your actual API URL
    this.baseUrl = baseUrl || process.env.CEB_BACKEND_API_URL || 'http://localhost:3000';
  }

  /**
   * Schedule a discharge follow-up call
   * Directly uses the /api/calls/schedule endpoint with proper data formatting
   */
  async scheduleCall(request: ScheduleCallRequest): Promise<ScheduleCallResponse> {
    try {
      // Get authentication token from Supabase
      const authToken = await requireAuthToken();

      odisLogger.info('Preparing schedule call request...', {
        consultationId: request.metadata?.consultation_id,
        scheduledFor: request.scheduledFor,
      });

      // Transform the request to match the expected scheduleCallSchema format
      const apiRequest = {
        // Contact information (E.164 format)
        phoneNumber: this.formatPhoneToE164(request.phoneNumber),

        // Core patient/appointment details (REQUIRED)
        petName: request.petName,
        ownerName: request.ownerName,
        appointmentDate: this.formatDateSpelledOut(new Date()), // Today's date spelled out

        // Call type configuration (REQUIRED)
        callType: 'discharge' as const, // Always discharge for extension calls

        // Clinic information (REQUIRED)
        clinicName: request.clinicName || 'Your Veterinary Clinic',
        clinicPhone: this.formatPhoneSpelledOut(request.clinicPhone || '+14085551234'),
        emergencyPhone: this.formatPhoneSpelledOut(request.clinicPhone || '+14085551234'),

        // Agent name (optional, defaults to "Sarah")
        agentName: 'Sarah',

        // Clinical details (REQUIRED)
        dischargeSummary: request.dischargeSummary || request.notes || 'Post-appointment discharge instructions',

        // Optional fields for discharge calls
        subType: 'wellness' as const, // Can be 'wellness' or 'vaccination'

        // Follow-up instructions (optional but recommended)
        nextSteps: 'Follow the discharge instructions provided. Call us if you have any concerns.',

        // Additional clinical info (optional)
        vetName: request.vetName,
        medications: undefined, // Add if available
        recheckDate: undefined, // Add if available

        // Scheduling
        scheduledFor: request.scheduledFor ? new Date(request.scheduledFor) : undefined,
        notes: request.notes,
        metadata: {
          source: 'idexx-extension',
          consultation_id: request.metadata?.consultation_id,
          provider_id: request.metadata?.provider_id,
          company_id: request.metadata?.company_id,
          patient_external_id: request.metadata?.patient_external_id,
        },
      };

      odisLogger.info('Sending schedule call request to /api/calls/schedule...', {
        baseUrl: this.baseUrl,
        phoneNumber: apiRequest.phoneNumber,
        petName: apiRequest.petName,
      });

      // Send request via background script to bypass CORS
      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        url: `${this.baseUrl}/api/calls/schedule`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: apiRequest,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to schedule call');
      }

      // The response.data is the actual API response body
      // It should already contain success and data fields
      const responseData = response.data as any;

      // Check if it's the expected structure
      if (responseData && responseData.success && responseData.data) {
        // API returns success structure with nested data
        const data: ScheduleCallResponse = {
          success: true,
          data: {
            callId: responseData.data.callId,
            scheduledFor: responseData.data.scheduledFor,
            qstashMessageId: responseData.data.qstashMessageId,
          },
        };

        odisLogger.info('✅ Call scheduled successfully', { data });
        return data;
      } else if (responseData && responseData.callId) {
        // Fallback if API returns data directly
        const data: ScheduleCallResponse = {
          success: true,
          data: {
            callId: responseData.callId,
            scheduledFor: responseData.scheduledFor,
            qstashMessageId: responseData.qstashMessageId,
          },
        };

        odisLogger.info('✅ Call scheduled successfully', { data });
        return data;
      } else {
        throw new Error(responseData?.error || 'Failed to schedule call');
      }
    } catch (error) {
      odisLogger.error('❌ Failed to schedule call', { error });

      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to schedule call. Please try again.');
    }
  }

  /**
   * Format phone number to E.164 format
   * Examples: (415) 555-1234 -> +14155551234
   */
  private formatPhoneToE164(phone: string): string {
    if (!phone) return '+14085551234'; // Default phone

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Add country code if not present (assuming US)
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    } else if (digits.startsWith('+')) {
      return phone;
    }

    // Return as-is if already in correct format or can't parse
    return phone.startsWith('+') ? phone : `+1${digits}`;
  }

  /**
   * Format phone number to spelled out format for VAPI
   * Example: +14155551234 -> "four one five, five five five, one two three four"
   */
  private formatPhoneSpelledOut(phone: string): string {
    if (!phone) return 'four zero eight, five five five, one two three four';

    // Get just the digits
    const digits = phone.replace(/\D/g, '');

    // Map digits to words
    const digitWords: { [key: string]: string } = {
      '0': 'zero',
      '1': 'one',
      '2': 'two',
      '3': 'three',
      '4': 'four',
      '5': 'five',
      '6': 'six',
      '7': 'seven',
      '8': 'eight',
      '9': 'nine',
    };

    // Format US phone number (skip country code 1)
    const phoneDigits = digits.startsWith('1') && digits.length === 11 ? digits.substring(1) : digits;

    if (phoneDigits.length === 10) {
      // Format as: "area code, prefix, line number"
      const areaCode = phoneDigits
        .substring(0, 3)
        .split('')
        .map(d => digitWords[d] || d)
        .join(' ');
      const prefix = phoneDigits
        .substring(3, 6)
        .split('')
        .map(d => digitWords[d] || d)
        .join(' ');
      const lineNumber = phoneDigits
        .substring(6)
        .split('')
        .map(d => digitWords[d] || d)
        .join(' ');

      return `${areaCode}, ${prefix}, ${lineNumber}`;
    }

    // Fallback: spell out all digits with spaces
    return digits
      .split('')
      .map(d => digitWords[d] || d)
      .join(' ');
  }

  /**
   * Format date to spelled out format
   * Example: 2024-01-15 -> "January fifteenth"
   */
  private formatDateSpelledOut(date: Date): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const ordinalNumbers = [
      '',
      'first',
      'second',
      'third',
      'fourth',
      'fifth',
      'sixth',
      'seventh',
      'eighth',
      'ninth',
      'tenth',
      'eleventh',
      'twelfth',
      'thirteenth',
      'fourteenth',
      'fifteenth',
      'sixteenth',
      'seventeenth',
      'eighteenth',
      'nineteenth',
      'twentieth',
      'twenty-first',
      'twenty-second',
      'twenty-third',
      'twenty-fourth',
      'twenty-fifth',
      'twenty-sixth',
      'twenty-seventh',
      'twenty-eighth',
      'twenty-ninth',
      'thirtieth',
      'thirty-first',
    ];

    const month = months[date.getMonth()];
    const day = ordinalNumbers[date.getDate()] || `${date.getDate()}th`;

    return `${month} ${day}`;
  }

  /**
   * Get scheduled calls for the current user
   * (Optional - for future use to display scheduled calls in extension)
   */
  async getScheduledCalls(): Promise<ScheduledCall[]> {
    try {
      const authToken = await requireAuthToken();

      const response = await fetch(`${this.baseUrl}/api/calls/scheduled`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch scheduled calls: ${response.status}`);
      }

      const data = await response.json();
      return data.calls || [];
    } catch (error) {
      odisLogger.error('Failed to fetch scheduled calls', { error });
      return [];
    }
  }

  /**
   * Cancel a scheduled call
   * (Optional - for future use)
   */
  async cancelScheduledCall(callId: string): Promise<boolean> {
    try {
      const authToken = await requireAuthToken();

      const response = await fetch(`${this.baseUrl}/api/calls/${callId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      odisLogger.error('Failed to cancel scheduled call', { error });
      return false;
    }
  }
}

/**
 * Singleton instance of the API client
 */
export const scheduleCallApi = new ScheduleCallApi();

/**
 * Convenience function to schedule a call
 */
export const scheduleDischargeCall = async (request: ScheduleCallRequest): Promise<ScheduleCallResponse> =>
  scheduleCallApi.scheduleCall(request);

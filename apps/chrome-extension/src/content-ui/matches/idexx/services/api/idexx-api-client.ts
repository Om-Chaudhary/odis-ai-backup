import { logger, now, addDays, createTimeoutAbortController, TimeoutError } from '@odis-ai/extension-shared';
import type { ScheduleAppointment } from '../../utils/extraction/schedule-extractor';

const odisLogger = logger.child('[ODIS]');

// Timeout for IDEXX API requests (30 seconds)
const IDEXX_API_TIMEOUT_MS = 30000;

/**
 * IDEXX API response types (based on actual API structure)
 * Example response from /appointments/getCalendarEventData
 */
interface IdexxApiAppointment {
  // Appointment identifiers
  id: string | number;
  appointment_id: string | number;
  consultation_id?: number | null;

  // Date/time fields
  start: string; // "2025-10-08 09:00:00"
  end: string; // "2025-10-08 09:00:00"
  arrival_date_time?: string | null;

  // Patient information
  patient_id: number;
  patient_name: string;

  // Client/Owner information
  client_id: number;
  client_title?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  phone_label?: string;
  is_valid_mobile_phone?: boolean;

  // Provider information
  provider?: string;
  popup_title_text?: string; // Often contains provider name

  // Appointment details
  title: string; // "Minnie ; Souza, Max"
  type_description?: string;
  reason?: string;
  current_status?: string;
  status_label?: string;
  status_class?: string;
  confirmed_status?: string;

  // Room/resource
  resourceId?: string;
  appointment_room_id?: number;
  appointment_room_name?: string;

  // Metadata
  backgroundColor?: string;
  darkFont?: boolean;
  is_block?: boolean;
  is_roster?: boolean;
  recurring?: boolean;

  // Audit fields
  booked_by?: string;
  booked_at?: string;
  last_updated_at?: string;
  last_updated_by?: string;
  root_created_at_local?: string;
  root_created_at_user?: string;

  // Status flags
  is_unmatched?: boolean;
  audit_incomplete?: boolean;
  estimate_id?: number | null;

  [key: string]: unknown;
}

interface IdexxApiResponse {
  appointments?: IdexxApiAppointment[];
  data?: IdexxApiAppointment[];
  events?: IdexxApiAppointment[];
  success?: boolean;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

/**
 * IDEXX Neo API Client
 * Fetches appointment data from IDEXX calendar API
 */
export class IdexxApiClient {
  /**
   * IDEXX domain patterns that are valid for API requests
   */
  private static readonly IDEXX_DOMAIN_PATTERNS = [
    /^https:\/\/.*\.idexxneo\.com$/,
    /^https:\/\/.*\.idexxneocloud\.com$/,
    /^https:\/\/neo\.vet$/,
    /^https:\/\/.*\.neosuite\.com$/,
  ];

  /**
   * Get the base URL dynamically from the current page's origin
   * Validates that we're on an IDEXX domain before returning
   *
   * IMPORTANT: In content scripts, we must use the page's window/document,
   * not the extension's window. Content scripts run in an isolated world but
   * still have access to the page's DOM and window.location.
   */
  private getBaseUrl(): string {
    // In content scripts, we need to ensure we're getting the page's location
    // Use document.location which always refers to the page's location in content scripts
    let origin: string;
    let href: string;
    let hostname: string;

    try {
      // Try document.location first (most reliable in content scripts)
      if (document && document.location) {
        origin = document.location.origin;
        href = document.location.href;
        hostname = document.location.hostname;
      } else if (typeof window !== 'undefined' && window.location) {
        // Fallback to window.location
        origin = window.location.origin;
        href = window.location.href;
        hostname = window.location.hostname;
      } else {
        throw new Error('Cannot access page location - not in content script context');
      }
    } catch (error) {
      odisLogger.error('Failed to get page location', { error });
      throw new Error('Cannot determine page origin. Make sure you are on an IDEXX Neo page.');
    }

    // Debug logging to understand the context
    odisLogger.info('Getting base URL', {
      origin,
      href,
      hostname,
      hasDocument: !!document,
      hasWindow: typeof window !== 'undefined',
      documentLocation: document?.location?.toString(),
      windowLocation: window?.location?.toString(),
      isChromeExtension: origin.startsWith('chrome-extension://'),
    });

    // Special check: if we're getting chrome-extension://, something is wrong with the context
    if (origin.startsWith('chrome-extension://')) {
      const errorMessage = `Cannot fetch IDEXX appointments: detected extension origin instead of IDEXX page origin. This usually means the content script is not running in the correct context. Current origin: ${origin}. Please ensure you are on an IDEXX Neo page and the extension is properly loaded.`;
      odisLogger.error(errorMessage, {
        origin,
        href,
        hostname,
        documentLocation: document?.location?.toString(),
        windowLocation: window?.location?.toString(),
      });
      throw new Error(errorMessage);
    }

    // Validate that we're on an IDEXX domain
    const isValidIdexxDomain = IdexxApiClient.IDEXX_DOMAIN_PATTERNS.some(pattern => pattern.test(origin));

    odisLogger.info('Domain validation', {
      origin,
      isValidIdexxDomain,
      patterns: IdexxApiClient.IDEXX_DOMAIN_PATTERNS.map(p => p.toString()),
    });

    if (!isValidIdexxDomain) {
      const errorMessage = `Cannot fetch IDEXX appointments: not on an IDEXX domain. Current origin: ${origin}, hostname: ${hostname}, href: ${href}. Please ensure you're on an IDEXX Neo page (idexxneo.com, idexxneocloud.com, neo.vet, or neosuite.com).`;
      odisLogger.error(errorMessage);
      throw new Error(errorMessage);
    }

    return origin;
  }

  /**
   * Fetch appointments from IDEXX calendar API for a date range
   */
  async fetchAppointments(startDate: Date, endDate: Date): Promise<ScheduleAppointment[]> {
    odisLogger.info('🔵 fetchAppointments called', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      stackTrace: new Error().stack,
    });

    try {
      // Get base URL dynamically (validates IDEXX domain)
      odisLogger.info('🔵 Getting base URL...');
      const baseUrl = this.getBaseUrl();
      odisLogger.info('🔵 Base URL obtained', { baseUrl });

      odisLogger.info('🔵 Fetching appointments', {
        baseUrl,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Format dates as YYYY-MM-DD HH:MM:SS for IDEXX API
      const startFormatted = this.formatDateForApi(startDate);
      const endFormatted = this.formatDateForApi(endDate);

      odisLogger.info('🔵 Dates formatted', { startFormatted, endFormatted });

      // Build API URL
      const url = `${baseUrl}/appointments/getCalendarEventData?start=${encodeURIComponent(startFormatted)}&end=${encodeURIComponent(endFormatted)}`;

      odisLogger.info('🔵 Making API request', {
        url,
        method: 'GET',
        willIncludeCredentials: true,
        timeoutMs: IDEXX_API_TIMEOUT_MS,
      });

      // Create abort controller with timeout
      const { controller, cleanup } = createTimeoutAbortController(IDEXX_API_TIMEOUT_MS);

      // Fetch with credentials to use browser session
      odisLogger.info('🔵 About to call fetch()', { url, timeoutMs: IDEXX_API_TIMEOUT_MS });
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest', // Mark as AJAX request
          },
          signal: controller.signal,
        });
        cleanup(); // Clear timeout on successful fetch
      } catch (fetchError) {
        cleanup(); // Clear timeout on error
        // Check if this was a timeout
        if (fetchError instanceof TimeoutError || (fetchError instanceof Error && fetchError.name === 'AbortError')) {
          odisLogger.error('🔴 IDEXX API request timed out', {
            url,
            timeoutMs: IDEXX_API_TIMEOUT_MS,
          });
          throw new Error(
            `IDEXX API request timed out after ${IDEXX_API_TIMEOUT_MS / 1000} seconds. Please try again.`,
          );
        }
        throw fetchError;
      }

      // Log response headers (convert to object for logging)
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      odisLogger.info('🔵 Fetch response received', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: responseHeaders,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response');
        odisLogger.error('🔴 API response not OK', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: response.url,
        });
        throw new Error(`IDEXX API error: ${response.status} ${response.statusText}`);
      }

      odisLogger.info('🔵 Parsing JSON response...');
      const data = (await response.json()) as IdexxApiResponse;
      odisLogger.info('🔵 JSON parsed', {
        hasAppointments: !!data.appointments,
        hasData: !!data.data,
        hasEvents: !!data.events,
        isArray: Array.isArray(data),
        keys: Object.keys(data),
      });

      // Extract appointments array from response
      // The actual response structure may vary - handle multiple possible formats
      odisLogger.info('🔵 Extracting appointments from response...');
      const rawAppointments = data.appointments || data.data || data.events || (Array.isArray(data) ? data : []);

      odisLogger.info('🔵 Raw appointments extracted', {
        count: Array.isArray(rawAppointments) ? rawAppointments.length : 0,
        isArray: Array.isArray(rawAppointments),
        type: typeof rawAppointments,
      });

      if (!Array.isArray(rawAppointments)) {
        odisLogger.warn('🔴 Unexpected API response format', {
          data,
          rawAppointments,
          type: typeof rawAppointments,
        });
        return [];
      }

      // Map IDEXX API response to our internal ScheduleAppointment format
      odisLogger.info('🔵 Mapping appointments...', { count: rawAppointments.length });
      const appointments = rawAppointments.map(apt => this.mapApiAppointmentToScheduleAppointment(apt));

      odisLogger.info('🔵 Appointments mapped successfully', { count: appointments.length });
      return appointments;
    } catch (error) {
      odisLogger.error('🔴 Failed to fetch appointments from IDEXX API', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : undefined,
      });
      throw new Error(`Failed to fetch appointments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format Date object to IDEXX API format: "YYYY-MM-DD HH:MM:SS"
   */
  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Map IDEXX API appointment data to our ScheduleAppointment format
   */
  private mapApiAppointmentToScheduleAppointment(apiData: IdexxApiAppointment): ScheduleAppointment {
    // Extract appointment ID
    const appointmentId = String(apiData.appointment_id || apiData.id);

    // Parse start time
    const startTime = this.parseApiDateTime(apiData.start);

    // Calculate duration from start and end times
    let duration: number | null = null;
    if (apiData.start && apiData.end) {
      const start = this.parseApiDateTime(apiData.start);
      const end = this.parseApiDateTime(apiData.end);
      if (start && end) {
        duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      }
    }

    // Extract patient info
    const patientId = String(apiData.patient_id);
    const patientName = apiData.patient_name || null;

    // IDEXX API doesn't include species/breed in appointments endpoint
    // These would need to be fetched from patient details API if needed
    const species = null;
    const breed = null;

    // Extract client/owner info
    const clientId = String(apiData.client_id);
    const clientName = `${apiData.first_name} ${apiData.last_name}`.trim() || null;
    const clientPhone = apiData.phone_number || null;
    const clientEmail = apiData.email || null;

    // Extract provider info
    // IDEXX uses 'provider' field and 'popup_title_text' for provider name
    const providerName = apiData.provider || apiData.popup_title_text || null;
    const providerId = apiData.resourceId || null;

    // Extract appointment details
    const type = apiData.type_description || 'Appointment';
    const status = apiData.current_status || apiData.status_label || 'Scheduled';
    const notes = apiData.reason || null;
    const reason = apiData.reason || null;

    // Extract consultation ID if available
    const consultationId = apiData.consultation_id ? String(apiData.consultation_id) : null;

    return {
      id: appointmentId,
      consultationId,
      startTime,
      duration,
      patient: {
        name: patientName,
        id: patientId || null,
        species,
        breed,
      },
      client: {
        name: clientName,
        id: clientId || null,
        phone: clientPhone,
        email: clientEmail,
      },
      provider: {
        name: providerName,
        id: providerId,
      },
      type,
      status,
      notes,
      reason,
      extractedFrom: 'api',
    };
  }

  /**
   * Parse IDEXX API date/time string to Date object
   *
   * IMPORTANT: IDEXX returns times in the clinic's local timezone (e.g. PST/PDT).
   * We parse them as-is in local time, which preserves the correct appointment time.
   *
   * Example: "2025-12-02 16:00:00" from IDEXX means 4pm local time on Dec 2nd.
   * When converted to UTC for storage, it becomes "2025-12-03 00:00:00 UTC" (if PST).
   * This is correct - we want to preserve the local appointment time.
   */
  private parseApiDateTime(dateTimeStr: string | null | undefined): Date | null {
    if (!dateTimeStr) return null;

    try {
      // Try parsing custom format "YYYY-MM-DD HH:MM:SS"
      // This is the format IDEXX uses, and it's in the clinic's local timezone
      const match = dateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
      if (match) {
        const [, year, month, day, hours, minutes, seconds] = match;
        // Parse as local time (clinic timezone)
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1, // Month is 0-indexed
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds),
        );

        odisLogger.debug('Parsed IDEXX datetime', {
          input: dateTimeStr,
          parsed: date.toISOString(),
          localTime: date.toLocaleString(),
        });

        return date;
      }

      // Fallback: Try parsing as ISO 8601
      const date = new Date(dateTimeStr);
      if (!isNaN(date.getTime())) {
        odisLogger.debug('Parsed as ISO 8601', {
          input: dateTimeStr,
          parsed: date.toISOString(),
        });
        return date;
      }

      return null;
    } catch (error) {
      odisLogger.warn('Failed to parse date/time', { dateTimeStr, error });
      return null;
    }
  }

  /**
   * Test API connection (useful for debugging)
   */
  async testConnection(): Promise<boolean> {
    try {
      const currentTime = now();
      const tomorrow = addDays(currentTime, 1);
      await this.fetchAppointments(currentTime, tomorrow);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const idexxApiClient = new IdexxApiClient();

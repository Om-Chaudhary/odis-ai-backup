/**
 * Schedule Scraper
 *
 * Fetches appointment schedule from IDEXX Neo API for a given date.
 */

import type { Page } from "playwright";
import { scheduleLogger as logger } from "../lib/logger";
import { IDEXX_URLS, config } from "../config";
import { DASHBOARD_SELECTORS } from "../selectors";
import { normalizePhone } from "../utils/phone";
import { getRateLimiter } from "../utils/rate-limiter";
import type { BrowserService } from "../services/browser.service";
import type { ScrapedAppointment, ScheduleScraperResult } from "../types";

/**
 * IDEXX API appointment response structure
 */
interface IdexxAppointmentApiResponse {
  id?: string;
  title?: string;
  start?: string;
  end?: string;
  resourceId?: string;
  className?: string;
  patientName?: string;
  clientName?: string;
  clientPhone?: string;
  providerName?: string;
  appointmentType?: string;
  status?: string;
  // API may return additional fields
  [key: string]: unknown;
}

/**
 * IDEXX API schedule configuration response
 */
interface IdexxScheduleConfig {
  businessHours?: {
    start?: string; // e.g., "08:00"
    end?: string; // e.g., "18:00"
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  };
  slotDuration?: number; // in minutes
  providers?: Array<{
    id?: string | number;
    name?: string;
    color?: string;
  }>;
  rooms?: Array<{
    id?: string | number;
    name?: string;
  }>;
  [key: string]: unknown;
}

/**
 * Calculated free slot
 */
interface FreeSlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
  provider?: string;
  room?: string;
}

/**
 * Schedule Scraper
 *
 * Fetches appointments from IDEXX Neo API with support for:
 * - Booked appointments
 * - Business hours configuration
 * - Free/available slots calculation
 */
export class ScheduleScraper {
  private rateLimiter = getRateLimiter("idexx-api", config.IDEXX_RATE_LIMIT);

  constructor(private browser: BrowserService) {}

  /**
   * Fetch schedule configuration including business hours
   */
  async fetchScheduleConfig(page: Page): Promise<IdexxScheduleConfig | null> {
    try {
      const baseUrl = new URL(page.url()).origin;
      const configUrl = `${baseUrl}/schedule/getScheduleConfigs`;

      logger.debug(`Fetching schedule config from: ${configUrl}`);

      // Apply rate limiting
      await this.rateLimiter.acquire();
      const response = await page.request.get(configUrl);

      if (!response.ok()) {
        logger.warn(`Failed to fetch schedule config: ${response.status()}`);
        return null;
      }

      const config = (await response.json()) as IdexxScheduleConfig;
      return config;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.warn(`Could not fetch schedule config: ${msg}`);
      return null;
    }
  }

  /**
   * Calculate free slots based on business hours and booked appointments
   */
  calculateFreeSlots(
    appointments: ScrapedAppointment[],
    config: IdexxScheduleConfig | null,
    targetDate: string,
  ): FreeSlot[] {
    const freeSlots: FreeSlot[] = [];

    // Default business hours if config not available
    const startHour = config?.businessHours?.start ?? "08:00";
    const endHour = config?.businessHours?.end ?? "18:00";
    const slotDuration = config?.slotDuration ?? 15; // default 15 minutes

    const dayStart = new Date(`${targetDate}T${startHour}:00`);
    const dayEnd = new Date(`${targetDate}T${endHour}:00`);

    // Sort appointments by start time
    const sortedAppts = [...appointments].sort((a, b) => {
      const timeA = this.parseTimeToMinutes(a.start_time);
      const timeB = this.parseTimeToMinutes(b.start_time);
      return timeA - timeB;
    });

    let currentTime = dayStart;

    // Find gaps between appointments
    for (const appt of sortedAppts) {
      const apptStart = new Date(
        `${targetDate}T${this.normalizeTime24(appt.start_time)}`,
      );

      // If there's a gap, it's a free slot
      if (apptStart > currentTime) {
        const durationMs = apptStart.getTime() - currentTime.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);

        if (durationMinutes >= slotDuration) {
          freeSlots.push({
            start_time: currentTime.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
            end_time: apptStart.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
            duration_minutes: durationMinutes,
          });
        }
      }

      // Move current time to end of this appointment
      if (appt.end_time) {
        currentTime = new Date(
          `${targetDate}T${this.normalizeTime24(appt.end_time)}`,
        );
      } else {
        // If no end time, assume slot duration
        currentTime = new Date(apptStart.getTime() + slotDuration * 60000);
      }
    }

    // Check if there's time left at end of day
    if (currentTime < dayEnd) {
      const durationMs = dayEnd.getTime() - currentTime.getTime();
      const durationMinutes = Math.floor(durationMs / 60000);

      if (durationMinutes >= slotDuration) {
        freeSlots.push({
          start_time: currentTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          end_time: dayEnd.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          duration_minutes: durationMinutes,
        });
      }
    }

    return freeSlots;
  }

  /**
   * Parse time string to minutes since midnight
   */
  private parseTimeToMinutes(timeStr: string): number {
    const time24 = this.normalizeTime24(timeStr);
    const [hours, minutes] = time24.split(":").map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  }

  /**
   * Normalize time from 12-hour to 24-hour format
   */
  private normalizeTime24(timeStr: string): string {
    const match = /(\d{1,2}):(\d{2})\s*(am|pm)/i.exec(timeStr);

    if (!match) {
      // Already in 24-hour format or invalid
      return timeStr;
    }

    let hours = parseInt(match[1] ?? "0", 10);
    const minutes = match[2] ?? "00";
    const meridiem = match[3]?.toLowerCase();

    if (meridiem === "pm" && hours !== 12) {
      hours += 12;
    } else if (meridiem === "am" && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
  }

  /**
   * Parse "PATIENT; CLIENT, NAME" from title field
   *
   * IDEXX calendar API returns appointment title in format:
   * "PATIENT_NAME; CLIENT_LASTNAME, CLIENT_FIRSTNAME"
   */
  private parseTitle(title: string | undefined): {
    patientName: string | null;
    clientName: string | null;
  } {
    if (!title) return { patientName: null, clientName: null };

    // Format: "PATIENT_NAME; CLIENT_LASTNAME, CLIENT_FIRSTNAME"
    const semicolonIndex = title.indexOf(";");
    if (semicolonIndex === -1) {
      return { patientName: title.trim() || null, clientName: null };
    }

    const patientName = title.substring(0, semicolonIndex).trim();
    const clientName = title.substring(semicolonIndex + 1).trim();

    return {
      patientName: patientName || null,
      clientName: clientName || null,
    };
  }

  /**
   * Fetch schedule from IDEXX Neo API
   *
   * @param page - Playwright page instance (used for auth cookies)
   * @param date - Optional date in YYYY-MM-DD format (defaults to today)
   */
  async scrape(page: Page, date?: string): Promise<ScheduleScraperResult> {
    const errors: string[] = [];
    const appointments: ScrapedAppointment[] = [];
    const targetDate = date ?? new Date().toISOString().split("T")[0] ?? "";

    try {
      logger.info(`Fetching schedule for date: ${targetDate}...`);

      // Navigate to schedule page first (ensures proper page state)
      const navClicked = await this.browser.clickElement(
        page,
        DASHBOARD_SELECTORS.scheduleNav,
      );

      if (!navClicked) {
        await page.goto(IDEXX_URLS.SCHEDULE, {
          waitUntil: "networkidle",
        });
      }

      await page.waitForLoadState("networkidle");

      // Get the base URL from the page
      const baseUrl = new URL(page.url()).origin;

      // Build API URL with date range (single day)
      const startDateTime = `${targetDate} 00:00:00`;
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 1);
      const endDateTime = `${endDate.toISOString().split("T")[0]} 00:00:00`;

      const apiUrl = `${baseUrl}/appointments/getCalendarEventData?start=${encodeURIComponent(startDateTime)}&end=${encodeURIComponent(endDateTime)}`;

      logger.debug(`Fetching appointments from API: ${apiUrl}`);

      // Apply rate limiting
      await this.rateLimiter.acquire();

      // Make authenticated API request using page context
      const response = await page.request.get(apiUrl);

      if (!response.ok()) {
        throw new Error(
          `API request failed with status ${response.status()}: ${response.statusText()}`,
        );
      }

      const rawData = await response.json();

      logger.debug(
        `Raw API response type: ${Array.isArray(rawData) ? "array" : typeof rawData}`,
      );

      // API might return data in different structures
      let data: IdexxAppointmentApiResponse[];

      if (Array.isArray(rawData)) {
        // Direct array response
        data = rawData as IdexxAppointmentApiResponse[];
        logger.debug(`Direct array response with ${data.length} items`);
      } else if (rawData && typeof rawData === "object") {
        // Wrapped in an object (try common property names)
        const possibleKeys = Object.keys(rawData);
        logger.debug(`Response object keys: ${possibleKeys.join(", ")}`);

        // IDEXX returns events in the 'events' key
        data = (rawData.events ??
          rawData.data ??
          rawData.appointments ??
          rawData.results ??
          []) as IdexxAppointmentApiResponse[];

        // Log first event structure for debugging
        if (data.length > 0) {
          const sampleEvent = data[0];
          logger.debug(
            `Sample event keys: ${Object.keys(sampleEvent ?? {}).join(", ")}`,
          );
          logger.debug(
            `Sample event: ${JSON.stringify(sampleEvent).substring(0, 500)}`,
          );
        }

        if (data.length === 0 && possibleKeys.length > 0) {
          // Log a sample to help debug
          logger.warn(
            `Could not find appointments in response. Sample: ${JSON.stringify(rawData).substring(0, 300)}`,
          );
        }
      } else {
        // Unexpected format
        logger.warn(
          `Unexpected API response format: ${JSON.stringify(rawData).substring(0, 200)}`,
        );
        data = [];
      }

      logger.debug(`Received ${data.length} appointments from API`);

      // Transform API response to our appointment format
      for (const apiAppt of data) {
        try {
          const appointment = this.transformApiAppointment(apiAppt, targetDate);
          appointments.push(appointment);
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          errors.push(`Failed to transform appointment: ${msg}`);
        }
      }

      logger.info(`Extracted ${appointments.length} appointments`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Schedule fetching failed: ${msg}`);
      logger.error(`Fetching failed: ${msg}`);
    }

    return {
      appointments,
      scrapedAt: new Date(),
      errors,
    };
  }

  /**
   * Transform IDEXX API appointment to our format
   */
  private transformApiAppointment(
    apiAppt: IdexxAppointmentApiResponse,
    date: string,
  ): ScrapedAppointment {
    // Parse start and end times from ISO datetime strings
    let startTime = "";
    let endTime: string | null = null;

    if (apiAppt.start) {
      const startDate = new Date(apiAppt.start);
      startTime = startDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    if (apiAppt.end) {
      const endDate = new Date(apiAppt.end);
      endTime = endDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    // Determine status from className (primary) or status field (fallback)
    // IDEXX uses className for calendar event styling which indicates status
    let status = "scheduled";
    const statusSource = apiAppt.className ?? apiAppt.status ?? "";
    const statusLower = statusSource.toString().toLowerCase();

    if (statusLower.includes("finalized") || statusLower.includes("complete")) {
      status = "completed";
    } else if (statusLower.includes("arrived")) {
      status = "arrived";
    } else if (
      statusLower.includes("no-show") ||
      statusLower.includes("noshow") ||
      statusLower.includes("no_show")
    ) {
      status = "no_show";
    } else if (statusLower.includes("late")) {
      status = "late";
    } else if (
      statusLower.includes("cancelled") ||
      statusLower.includes("cancel")
    ) {
      status = "cancelled";
    } else if (
      statusLower.includes("in-progress") ||
      statusLower.includes("in_progress") ||
      statusLower.includes("progress")
    ) {
      status = "in_progress";
    }

    // Parse patient/client from title field as fallback
    // IDEXX calendar API returns "PATIENT; CLIENT" format in title
    const { patientName: parsedPatient, clientName: parsedClient } =
      this.parseTitle(apiAppt.title);

    return {
      neo_appointment_id: apiAppt.id?.toString() ?? null,
      date,
      start_time: startTime,
      end_time: endTime,
      patient_name: apiAppt.patientName?.trim() ?? parsedPatient,
      client_name: apiAppt.clientName?.trim() ?? parsedClient,
      client_phone: normalizePhone(apiAppt.clientPhone?.toString() ?? null),
      provider_name: apiAppt.providerName?.trim() ?? null,
      appointment_type: apiAppt.appointmentType?.trim() ?? null,
      status,
    };
  }
}

/**
 * IDEXX Neo Schedule Client
 * Fetches appointments via IDEXX API (proven approach from Chrome extension)
 */

import type { Page } from "playwright";
import type { PimsAppointment } from "@odis-ai/domain/sync";
import type { BrowserService } from "../browser/browser-service";
import type { IdexxAuthClient } from "./auth-client";
import { IDEXX_ENDPOINTS } from "./types";

/**
 * IDEXX API appointment response structure
 * Based on actual API response from /appointments/getCalendarEventData
 */
interface IdexxApiAppointment {
  // Appointment identifiers
  id: string | number;
  appointment_id: string | number;
  consultation_id?: number | null;

  // Date/time fields (format: "YYYY-MM-DD HH:MM:SS")
  start: string;
  end: string;

  // Patient information
  patient_id: number;
  patient_name: string;

  // Client/Owner information
  client_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;

  // Provider information
  provider?: string;
  resourceId?: string;

  // Appointment details
  title: string;
  type_description?: string;
  reason?: string;
  current_status?: string;
  status_label?: string;

  // Block/roster flags
  is_block?: boolean;
  is_roster?: boolean;
}

/**
 * Client for fetching schedule data from IDEXX Neo
 */
export class IdexxScheduleClient {
  constructor(
    private browserService: BrowserService,
    private authClient: IdexxAuthClient,
    private baseUrl: string,
  ) {}

  /**
   * Fetch appointments for date range using IDEXX API
   * Uses the same endpoint as the Chrome extension (proven to work)
   */
  async fetchAppointments(
    startDate: Date,
    endDate: Date,
  ): Promise<PimsAppointment[]> {
    if (!this.authClient.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    const session = await this.browserService.createPage("appointments");
    const { page } = session;

    try {
      // Apply authentication
      await this.authClient.applyAuth(page);

      // IMPORTANT: Navigate to IDEXX domain first so fetch() is same-origin
      // Without this, fetch() from about:blank is cross-origin and blocked by CORS
      console.log("[IdexxScheduleClient] Navigating to IDEXX domain for API access...");
      await page.goto(this.baseUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      console.log("[IdexxScheduleClient] On IDEXX domain, ready to fetch appointments");

      // Format dates as IDEXX expects: "YYYY-MM-DD HH:MM:SS"
      const startFormatted = this.formatDateForApi(startDate);
      const endFormatted = this.formatDateForApi(endDate);

      // Build URL with query params
      const url = `${this.baseUrl}${IDEXX_ENDPOINTS.APPOINTMENTS}?start=${encodeURIComponent(startFormatted)}&end=${encodeURIComponent(endFormatted)}`;

      console.log("[IdexxScheduleClient] Fetching appointments from:", url);

      // Fetch via page context to use authenticated session
      const appointments = await this.fetchAppointmentsFromApi(page, url);

      console.log(`[IdexxScheduleClient] Fetched ${appointments.length} appointments`);

      return appointments;
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      return [];
    } finally {
      await page.close();
    }
  }

  /**
   * Format Date to IDEXX API format: "YYYY-MM-DD HH:MM:SS"
   */
  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Fetch appointments from IDEXX API using page context
   */
  private async fetchAppointmentsFromApi(
    page: Page,
    url: string,
  ): Promise<PimsAppointment[]> {
    // Use page.evaluate to make fetch with authenticated session
    const response = await page.evaluate(async (apiUrl: string) => {
      const res = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      return res.json();
    }, url);

    // Extract appointments array from response
    // The response may be an array directly or wrapped in an object
    const typedResponse = response as {
      appointments?: IdexxApiAppointment[];
      data?: IdexxApiAppointment[];
      events?: IdexxApiAppointment[];
    };
    const rawAppointments: IdexxApiAppointment[] =
      typedResponse.appointments ??
      typedResponse.data ??
      typedResponse.events ??
      (Array.isArray(response) ? (response as IdexxApiAppointment[]) : []);

    if (!Array.isArray(rawAppointments)) {
      console.warn("Unexpected appointments response format:", response);
      return [];
    }

    // Filter out blocks and rosters, map to PimsAppointment
    return rawAppointments
      .filter((appt) => !appt.is_block && !appt.is_roster)
      .map((appt) => this.mapApiAppointment(appt));
  }

  /**
   * Map IDEXX API appointment to PimsAppointment
   */
  private mapApiAppointment(appt: IdexxApiAppointment): PimsAppointment {
    // Parse IDEXX datetime string to Date
    const startTime = this.parseIdexxDateTime(appt.start);
    const endTime = this.parseIdexxDateTime(appt.end);

    // Calculate duration in minutes
    let duration: number | null = null;
    if (startTime && endTime) {
      duration = Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60),
      );
    }

    // Extract date as YYYY-MM-DD
    const date = appt.start ? (appt.start.split(" ")[0] ?? "") : "";

    // Combine client name
    const clientName =
      `${appt.first_name ?? ""} ${appt.last_name ?? ""}`.trim() ?? null;

    return {
      id: String(appt.appointment_id ?? appt.id),
      consultationId: appt.consultation_id
        ? String(appt.consultation_id)
        : null,
      date,
      startTime,
      duration,
      status: appt.current_status ?? appt.status_label ?? "Scheduled",
      patient: {
        id: appt.patient_id ? String(appt.patient_id) : null,
        name: appt.patient_name ?? null,
        species: null, // Not available in appointments endpoint
        breed: null, // Not available in appointments endpoint
      },
      client: {
        id: appt.client_id ? String(appt.client_id) : null,
        name: clientName,
        phone: appt.phone_number ?? null,
        email: appt.email ?? null,
      },
      provider: {
        id: appt.resourceId ?? null,
        name: appt.provider ?? null,
      },
      type: appt.type_description ?? "Appointment",
      reason: appt.reason ?? null,
    };
  }

  /**
   * Parse IDEXX datetime string "YYYY-MM-DD HH:MM:SS" to Date
   * Parses as local time (clinic timezone)
   */
  private parseIdexxDateTime(
    dateTimeStr: string | null | undefined,
  ): Date | null {
    if (!dateTimeStr) return null;

    try {
      const match = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/.exec(
        dateTimeStr,
      );
      if (match) {
        const [, year, month, day, hours, minutes, seconds] = match;
        return new Date(
          parseInt(year!),
          parseInt(month!) - 1,
          parseInt(day!),
          parseInt(hours!),
          parseInt(minutes!),
          parseInt(seconds!),
        );
      }

      // Fallback: try ISO 8601 parsing
      const date = new Date(dateTimeStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }
}

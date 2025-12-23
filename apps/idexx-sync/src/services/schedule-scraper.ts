/**
 * Schedule Scraper Service
 *
 * Handles pre-open sync: scrapes today's appointment schedule from IDEXX Neo.
 * Used to fetch appointments before clinic opens so vets can record against them.
 */

import type { Page } from "playwright";
import { type PlaywrightBrowser } from "./playwright-browser";
import {
  SCHEDULE_SELECTORS,
  DASHBOARD_SELECTORS,
  getSelectorVariants,
} from "../utils/selectors";

export interface ScrapedAppointment {
  neo_appointment_id: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  patient_name: string | null;
  client_name: string | null;
  client_phone: string | null;
  provider_name: string | null;
  appointment_type: string | null;
  status: string;
}

export interface ScheduleScraperResult {
  appointments: ScrapedAppointment[];
  scrapedAt: Date;
  errors: string[];
}

/**
 * Schedule Scraper Service
 *
 * Navigates to IDEXX Neo schedule and extracts today's appointments.
 */
export class ScheduleScraper {
  private browser: PlaywrightBrowser;

  constructor(browser: PlaywrightBrowser) {
    this.browser = browser;
  }

  /**
   * Scrape today's schedule from IDEXX Neo
   */
  async scrapeSchedule(page: Page): Promise<ScheduleScraperResult> {
    const errors: string[] = [];
    const appointments: ScrapedAppointment[] = [];

    try {
      console.log("[SCHEDULE] Navigating to schedule page...");

      // Navigate to schedule
      const navClicked = await this.browser.clickElement(
        page,
        DASHBOARD_SELECTORS.scheduleNav,
      );

      if (!navClicked) {
        // Try direct navigation
        await page.goto("https://us.idexxneo.com/schedule", {
          waitUntil: "networkidle",
        });
      }

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Set date filter to today
      const today = new Date().toISOString().split("T")[0] ?? "";
      const datePickerFilled = await this.browser.fillField(
        page,
        SCHEDULE_SELECTORS.datePicker,
        today,
      );

      if (datePickerFilled) {
        console.log(`[SCHEDULE] Date filter set to ${today}`);
        // Wait for schedule to reload
        await page.waitForTimeout(2000);
      }

      // Extract appointments
      console.log("[SCHEDULE] Extracting appointments...");

      const appointmentSelectors = getSelectorVariants(
        SCHEDULE_SELECTORS.appointmentRow,
      );

      // Try each selector to find appointment rows
      let appointmentRows: ReturnType<Page["locator"]> | null = null;

      for (const selector of appointmentSelectors) {
        const locator = page.locator(selector);
        const count = await locator.count();

        if (count > 0) {
          appointmentRows = locator;
          console.log(
            `[SCHEDULE] Found ${count} appointments using: ${selector}`,
          );
          break;
        }
      }

      if (!appointmentRows) {
        errors.push("Could not find appointment rows on schedule page");
        return { appointments, scrapedAt: new Date(), errors };
      }

      // Extract data from each appointment row
      const rowCount = await appointmentRows.count();

      for (let i = 0; i < rowCount; i++) {
        try {
          const row = appointmentRows.nth(i);
          const appointment = await this.extractAppointmentData(row);
          appointments.push(appointment);
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          errors.push(`Failed to extract appointment ${i}: ${msg}`);
        }
      }

      console.log(`[SCHEDULE] Extracted ${appointments.length} appointments`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Schedule scraping failed: ${msg}`);
      console.error("[SCHEDULE] Error:", msg);
    }

    return {
      appointments,
      scrapedAt: new Date(),
      errors,
    };
  }

  /**
   * Extract appointment data from a table row
   */
  private async extractAppointmentData(
    row: ReturnType<Page["locator"]>,
  ): Promise<ScrapedAppointment> {
    // Extract appointment ID from data attribute
    const appointmentId = await row.getAttribute("data-appointment-id");

    // Extract time
    const timeElement = row.locator(
      getSelectorVariants(SCHEDULE_SELECTORS.appointmentTime).join(", "),
    );
    const timeText = await timeElement
      .first()
      .textContent()
      .catch(() => null);

    // Parse start and end times
    let startTime = "";
    let endTime: string | null = null;

    if (timeText) {
      const timeParts = timeText.split("-").map((t) => t.trim());
      startTime = timeParts[0] ?? "";
      endTime = timeParts[1] ?? null;
    }

    // Extract patient name
    const patientElement = row.locator(
      getSelectorVariants(SCHEDULE_SELECTORS.patientName).join(", "),
    );
    const patientName = await patientElement
      .first()
      .textContent()
      .catch(() => null);

    // Extract client name
    const clientElement = row.locator(
      getSelectorVariants(SCHEDULE_SELECTORS.clientName).join(", "),
    );
    const clientName = await clientElement
      .first()
      .textContent()
      .catch(() => null);

    // Extract client phone
    const phoneElement = row.locator(
      getSelectorVariants(SCHEDULE_SELECTORS.clientPhone).join(", "),
    );
    const clientPhone = await phoneElement
      .first()
      .textContent()
      .catch(() => null);

    // Extract provider name
    const providerElement = row.locator(
      getSelectorVariants(SCHEDULE_SELECTORS.providerName).join(", "),
    );
    const providerName = await providerElement
      .first()
      .textContent()
      .catch(() => null);

    // Extract appointment type
    const typeElement = row.locator(
      getSelectorVariants(SCHEDULE_SELECTORS.appointmentType).join(", "),
    );
    const appointmentType = await typeElement
      .first()
      .textContent()
      .catch(() => null);

    const dateStr = new Date().toISOString().split("T")[0];

    return {
      neo_appointment_id: appointmentId,
      date: dateStr ?? new Date().toISOString().substring(0, 10),
      start_time: startTime,
      end_time: endTime,
      patient_name: patientName?.trim() ?? null,
      client_name: clientName?.trim() ?? null,
      client_phone: this.normalizePhone(clientPhone),
      provider_name: providerName?.trim() ?? null,
      appointment_type: appointmentType?.trim() ?? null,
      status: "scheduled",
    };
  }

  /**
   * Normalize phone number to E.164 format
   */
  private normalizePhone(phone: string | null): string | null {
    if (!phone) return null;

    // Remove all non-numeric characters
    const digits = phone.replace(/\D/g, "");

    // Assume US number if 10 digits
    if (digits.length === 10) {
      return `+1${digits}`;
    }

    // If already has country code
    if (digits.length === 11 && digits.startsWith("1")) {
      return `+${digits}`;
    }

    return phone; // Return original if we can't normalize
  }
}

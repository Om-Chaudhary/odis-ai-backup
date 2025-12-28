/**
 * Schedule Scraper
 *
 * Scrapes appointment schedule from IDEXX Neo for a given date.
 */

import type { Page } from "playwright";
import { scheduleLogger as logger } from "../lib/logger";
import { IDEXX_URLS } from "../config";
import {
  DASHBOARD_SELECTORS,
  SCHEDULE_SELECTORS,
  getSelectorVariants,
} from "../selectors";
import { normalizePhone } from "../utils/phone";
import type { BrowserService } from "../services/browser.service";
import type { ScrapedAppointment, ScheduleScraperResult } from "../types";

/**
 * Schedule Scraper
 *
 * Navigates to IDEXX Neo schedule and extracts appointments.
 */
export class ScheduleScraper {
  constructor(private browser: BrowserService) {}

  /**
   * Scrape schedule from IDEXX Neo
   *
   * @param page - Playwright page instance
   * @param date - Optional date in YYYY-MM-DD format (defaults to today)
   */
  async scrape(page: Page, date?: string): Promise<ScheduleScraperResult> {
    const errors: string[] = [];
    const appointments: ScrapedAppointment[] = [];
    const targetDate = date ?? new Date().toISOString().split("T")[0] ?? "";

    try {
      logger.info(`Navigating to schedule page for date: ${targetDate}...`);

      // Navigate to schedule
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

      // Set date filter
      const datePickerFilled = await this.browser.fillField(
        page,
        SCHEDULE_SELECTORS.datePicker,
        targetDate,
      );

      if (datePickerFilled) {
        logger.debug(`Date filter set to ${targetDate}`);
        await page.waitForTimeout(2000);
      }

      // Extract appointments
      logger.debug("Extracting appointments...");

      const appointmentSelectors = getSelectorVariants(
        SCHEDULE_SELECTORS.appointmentRow,
      );

      let appointmentRows: ReturnType<Page["locator"]> | null = null;

      for (const selector of appointmentSelectors) {
        const locator = page.locator(selector);
        const count = await locator.count();

        if (count > 0) {
          appointmentRows = locator;
          logger.debug(
            `Found ${count} appointments using selector: ${selector}`,
          );
          break;
        }
      }

      if (!appointmentRows) {
        errors.push("Could not find appointment rows on schedule page");
        return { appointments, scrapedAt: new Date(), errors };
      }

      // Extract data from each row
      const rowCount = await appointmentRows.count();

      for (let i = 0; i < rowCount; i++) {
        try {
          const row = appointmentRows.nth(i);
          const appointment = await this.extractAppointmentData(
            row,
            targetDate,
          );
          appointments.push(appointment);
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          errors.push(`Failed to extract appointment ${i}: ${msg}`);
        }
      }

      logger.info(`Extracted ${appointments.length} appointments`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Schedule scraping failed: ${msg}`);
      logger.error(`Scraping failed: ${msg}`);
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
    date: string,
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

    return {
      neo_appointment_id: appointmentId,
      date,
      start_time: startTime,
      end_time: endTime,
      patient_name: patientName?.trim() ?? null,
      client_name: clientName?.trim() ?? null,
      client_phone: normalizePhone(clientPhone),
      provider_name: providerName?.trim() ?? null,
      appointment_type: appointmentType?.trim() ?? null,
      status: "scheduled",
    };
  }
}

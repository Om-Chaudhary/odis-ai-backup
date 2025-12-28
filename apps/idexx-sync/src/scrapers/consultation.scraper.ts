/**
 * Consultation Scraper
 *
 * Scrapes consultation data (notes, vitals, diagnoses) from IDEXX Neo.
 */

import type { Page } from "playwright";
import { consultationLogger as logger } from "../lib/logger";
import { IDEXX_URLS } from "../config";
import {
  DASHBOARD_SELECTORS,
  CONSULTATION_SELECTORS,
  getSelectorVariants,
} from "../selectors";
import type { BrowserService } from "../services/browser.service";
import type {
  ScrapedConsultation,
  ScrapedVitals,
  ConsultationScraperResult,
} from "../types";

/**
 * Consultation Scraper
 *
 * Navigates to IDEXX Neo consultations and extracts clinical data.
 */
export class ConsultationScraper {
  constructor(private browser: BrowserService) {}

  /**
   * Scrape consultations from IDEXX Neo
   *
   * @param page - Playwright page instance
   * @param date - Optional date in YYYY-MM-DD format (defaults to today)
   */
  async scrape(page: Page, date?: string): Promise<ConsultationScraperResult> {
    const errors: string[] = [];
    const consultations: ScrapedConsultation[] = [];
    const targetDate = date ?? new Date().toISOString().split("T")[0] ?? "";

    try {
      logger.info(
        `Navigating to consultations page for date: ${targetDate}...`,
      );

      // Navigate to consultations
      const navClicked = await this.browser.clickElement(
        page,
        DASHBOARD_SELECTORS.consultationsNav,
      );

      if (!navClicked) {
        await page.goto(IDEXX_URLS.CONSULTATIONS, {
          waitUntil: "networkidle",
        });
      }

      await page.waitForLoadState("networkidle");

      // Set date filter
      await this.browser.fillField(
        page,
        CONSULTATION_SELECTORS.startDateInput,
        targetDate,
      );
      await this.browser.fillField(
        page,
        CONSULTATION_SELECTORS.endDateInput,
        targetDate,
      );

      // Click search
      await this.browser.clickElement(
        page,
        CONSULTATION_SELECTORS.searchButton,
      );

      await page.waitForTimeout(2000);

      // Find consultation rows
      const consultationSelectors = getSelectorVariants(
        CONSULTATION_SELECTORS.consultationRow,
      );

      let consultationRows: ReturnType<Page["locator"]> | null = null;

      for (const selector of consultationSelectors) {
        const locator = page.locator(selector);
        const count = await locator.count();

        if (count > 0) {
          consultationRows = locator;
          logger.debug(
            `Found ${count} consultations using selector: ${selector}`,
          );
          break;
        }
      }

      if (!consultationRows) {
        errors.push("Could not find consultation rows");
        return { consultations, scrapedAt: new Date(), errors };
      }

      // Extract data from each consultation
      const rowCount = await consultationRows.count();

      for (let i = 0; i < rowCount; i++) {
        try {
          const row = consultationRows.nth(i);

          // Check if consultation has notes
          const notesIndicator = row.locator(
            getSelectorVariants(CONSULTATION_SELECTORS.notesIndicator).join(
              ", ",
            ),
          );
          const hasNotes = (await notesIndicator.count()) > 0;

          // Get basic info from list
          const consultation = await this.extractConsultationBasicInfo(
            row,
            targetDate,
          );
          consultation.has_notes = hasNotes;

          // If has notes, click into detail view
          if (hasNotes) {
            try {
              await row.click();
              await page.waitForLoadState("networkidle");

              // Extract detailed data
              const details = await this.extractConsultationDetails(page);
              consultation.clinical_notes = details.clinical_notes;
              consultation.vitals = details.vitals;
              consultation.diagnoses = details.diagnoses;

              // Go back to list
              await page.goBack();
              await page.waitForLoadState("networkidle");
            } catch (detailError) {
              const msg =
                detailError instanceof Error
                  ? detailError.message
                  : "Unknown error";
              errors.push(
                `Failed to extract details for consultation ${i}: ${msg}`,
              );
            }
          }

          consultations.push(consultation);
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          errors.push(`Failed to extract consultation ${i}: ${msg}`);
        }
      }

      logger.info(`Extracted ${consultations.length} consultations`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Consultation scraping failed: ${msg}`);
      logger.error(`Scraping failed: ${msg}`);
    }

    return {
      consultations,
      scrapedAt: new Date(),
      errors,
    };
  }

  /**
   * Extract basic consultation info from list row
   */
  private async extractConsultationBasicInfo(
    row: ReturnType<Page["locator"]>,
    date: string,
  ): Promise<ScrapedConsultation> {
    const consultationId = await row.getAttribute("data-consultation-id");
    const appointmentId = await row.getAttribute("data-appointment-id");

    // Extract patient name
    const patientText = await row
      .locator(".patient-name, [class*='patient']")
      .first()
      .textContent()
      .catch(() => null);

    // Extract status
    const statusText = await row
      .locator(
        getSelectorVariants(CONSULTATION_SELECTORS.statusIndicator).join(", "),
      )
      .first()
      .textContent()
      .catch(() => null);

    let status: ScrapedConsultation["status"] = "in_progress";
    if (statusText?.toLowerCase().includes("complete")) {
      status = "completed";
    } else if (statusText?.toLowerCase().includes("cancel")) {
      status = "cancelled";
    }

    return {
      neo_consultation_id: consultationId,
      neo_appointment_id: appointmentId,
      patient_name: patientText?.trim() ?? null,
      date,
      status,
      has_notes: false,
      clinical_notes: null,
      vitals: null,
      diagnoses: [],
    };
  }

  /**
   * Extract detailed consultation data from detail page
   */
  private async extractConsultationDetails(page: Page): Promise<{
    clinical_notes: string | null;
    vitals: ScrapedVitals | null;
    diagnoses: string[];
  }> {
    // Extract clinical notes (SOAP)
    const notesElement = page.locator(
      getSelectorVariants(CONSULTATION_SELECTORS.clinicalNotes).join(", "),
    );
    const clinicalNotes = await notesElement
      .first()
      .textContent()
      .catch(() => null);

    // Extract vitals
    const vitalsSection = page.locator(
      getSelectorVariants(CONSULTATION_SELECTORS.vitalsSection).join(", "),
    );
    const vitalsText = await vitalsSection
      .first()
      .textContent()
      .catch(() => null);
    const vitals = this.parseVitals(vitalsText);

    // Extract diagnoses
    const diagnosisSection = page.locator(
      getSelectorVariants(CONSULTATION_SELECTORS.diagnosisSection).join(", "),
    );
    const diagnosisText = await diagnosisSection
      .first()
      .textContent()
      .catch(() => null);
    const diagnoses = this.parseDiagnoses(diagnosisText);

    return {
      clinical_notes: clinicalNotes?.trim() ?? null,
      vitals,
      diagnoses,
    };
  }

  /**
   * Parse vitals text into structured data
   */
  private parseVitals(vitalsText: string | null): ScrapedVitals | null {
    if (!vitalsText) return null;

    const vitals: ScrapedVitals = {};

    // Temperature (e.g., "101.5 F" or "38.6 C")
    const tempMatch = /(?:temp|temperature)[:\s]*(\d+\.?\d*)\s*(F|C)/i.exec(
      vitalsText,
    );
    if (tempMatch?.[1] && tempMatch[2]) {
      vitals.temperature = parseFloat(tempMatch[1]);
      vitals.temperature_unit = tempMatch[2].toUpperCase() as "F" | "C";
    }

    // Pulse (e.g., "120 bpm")
    const pulseMatch = /(?:pulse|hr|heart rate)[:\s]*(\d+)/i.exec(vitalsText);
    if (pulseMatch?.[1]) {
      vitals.pulse = parseInt(pulseMatch[1], 10);
    }

    // Respiration (e.g., "20 rpm")
    const respMatch = /(?:resp|respiration|rr)[:\s]*(\d+)/i.exec(vitalsText);
    if (respMatch?.[1]) {
      vitals.respiration = parseInt(respMatch[1], 10);
    }

    // Weight (e.g., "25.5 kg" or "56.2 lb")
    const weightMatch = /(?:weight|wt)[:\s]*(\d+\.?\d*)\s*(kg|lb|lbs)/i.exec(
      vitalsText,
    );
    if (weightMatch?.[1] && weightMatch[2]) {
      vitals.weight = parseFloat(weightMatch[1]);
      vitals.weight_unit = weightMatch[2].toLowerCase().startsWith("l")
        ? "lb"
        : "kg";
    }

    // Blood pressure (e.g., "120/80")
    const bpMatch = /(?:bp|blood pressure)[:\s]*(\d+\/\d+)/i.exec(vitalsText);
    if (bpMatch?.[1]) {
      vitals.blood_pressure = bpMatch[1];
    }

    return Object.keys(vitals).length > 0 ? vitals : null;
  }

  /**
   * Parse diagnoses text into array
   */
  private parseDiagnoses(diagnosisText: string | null): string[] {
    if (!diagnosisText) return [];

    return diagnosisText
      .split(/[,;\n]/)
      .map((d) => d.trim())
      .filter((d) => d.length > 0 && d.length < 500);
  }
}

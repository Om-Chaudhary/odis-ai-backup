/**
 * Consultation Scraper Service
 *
 * Handles EOD sync: scrapes consultation data (notes, vitals, diagnoses)
 * from IDEXX Neo for completed appointments.
 */

import type { Page } from "playwright";
import { type PlaywrightBrowser } from "./playwright-browser";
import {
  CONSULTATION_SELECTORS,
  DASHBOARD_SELECTORS,
  getSelectorVariants,
} from "../utils/selectors";

export interface ScrapedConsultation {
  neo_consultation_id: string | null;
  neo_appointment_id: string | null;
  patient_name: string | null;
  date: string;
  status: "in_progress" | "completed" | "cancelled";
  has_notes: boolean;
  clinical_notes: string | null;
  vitals: {
    temperature?: number;
    temperature_unit?: "F" | "C";
    pulse?: number;
    respiration?: number;
    weight?: number;
    weight_unit?: "kg" | "lb";
    blood_pressure?: string;
  } | null;
  diagnoses: string[];
}

export interface ConsultationScraperResult {
  consultations: ScrapedConsultation[];
  scrapedAt: Date;
  errors: string[];
}

/**
 * Consultation Scraper Service
 *
 * Navigates to IDEXX Neo consultations and extracts clinical data.
 */
export class ConsultationScraper {
  private browser: PlaywrightBrowser;

  constructor(browser: PlaywrightBrowser) {
    this.browser = browser;
  }

  /**
   * Scrape today's consultations from IDEXX Neo
   */
  async scrapeConsultations(page: Page): Promise<ConsultationScraperResult> {
    const errors: string[] = [];
    const consultations: ScrapedConsultation[] = [];

    try {
      console.log("[CONSULTATION] Navigating to consultations page...");

      // Navigate to consultations
      const navClicked = await this.browser.clickElement(
        page,
        DASHBOARD_SELECTORS.consultationsNav,
      );

      if (!navClicked) {
        // Try direct navigation
        await page.goto("https://us.idexxneo.com/consultations", {
          waitUntil: "networkidle",
        });
      }

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Set date filter to today
      const today = new Date().toISOString().split("T")[0] ?? "";
      await this.browser.fillField(
        page,
        CONSULTATION_SELECTORS.startDateInput,
        today,
      );
      await this.browser.fillField(
        page,
        CONSULTATION_SELECTORS.endDateInput,
        today,
      );

      // Click search
      await this.browser.clickElement(
        page,
        CONSULTATION_SELECTORS.searchButton,
      );

      // Wait for results
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
          console.log(
            `[CONSULTATION] Found ${count} consultations using: ${selector}`,
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
          const consultation = await this.extractConsultationBasicInfo(row);
          consultation.has_notes = hasNotes;

          // If has notes, click into detail view to get full data
          if (hasNotes) {
            try {
              await row.click();
              await page.waitForLoadState("networkidle");

              // Extract detailed data
              const detailedData = await this.extractConsultationDetails(page);
              consultation.clinical_notes = detailedData.clinical_notes;
              consultation.vitals = detailedData.vitals;
              consultation.diagnoses = detailedData.diagnoses;

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

      console.log(
        `[CONSULTATION] Extracted ${consultations.length} consultations`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Consultation scraping failed: ${msg}`);
      console.error("[CONSULTATION] Error:", msg);
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

    const dateStr = new Date().toISOString().split("T")[0];

    return {
      neo_consultation_id: consultationId,
      neo_appointment_id: appointmentId,
      patient_name: patientText?.trim() ?? null,
      date: dateStr ?? new Date().toISOString().substring(0, 10),
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
    vitals: ScrapedConsultation["vitals"];
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
  private parseVitals(
    vitalsText: string | null,
  ): ScrapedConsultation["vitals"] {
    if (!vitalsText) return null;

    const vitals: NonNullable<ScrapedConsultation["vitals"]> = {};

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

    // Split by common delimiters
    const diagnoses = diagnosisText
      .split(/[,;\n]/)
      .map((d) => d.trim())
      .filter((d) => d.length > 0 && d.length < 500); // Filter out empty and overly long strings

    return diagnoses;
  }
}

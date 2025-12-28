/**
 * Consultation Scraper
 *
 * Fetches consultation data (notes, vitals, diagnoses) from IDEXX Neo API.
 */

import type { Page } from "playwright";
import { consultationLogger as logger } from "../lib/logger";
import { IDEXX_URLS } from "../config";
import { DASHBOARD_SELECTORS } from "../selectors";
import type { BrowserService } from "../services/browser.service";
import type {
  ScrapedConsultation,
  ScrapedVitals,
  ConsultationScraperResult,
} from "../types";

/**
 * IDEXX API consultation response structure
 */
interface IdexxConsultationApiResponse {
  id?: string | number;
  appointmentId?: string | number;
  patientName?: string;
  clientName?: string;
  providerId?: string | number;
  providerName?: string;
  consultedAt?: string;
  status?: string;
  clinicalNotes?: string;
  vitals?: {
    temperature?: number;
    temperatureUnit?: string;
    pulse?: number;
    respiration?: number;
    weight?: number;
    weightUnit?: string;
    bloodPressure?: string;
  };
  diagnoses?: string[];
  // API may return additional fields
  [key: string]: unknown;
}

/**
 * Consultation Scraper
 *
 * Navigates to IDEXX Neo consultations and extracts clinical data.
 */
export class ConsultationScraper {
  constructor(private browser: BrowserService) {}

  /**
   * Fetch consultations from IDEXX Neo API
   *
   * @param page - Playwright page instance (used for auth cookies)
   * @param date - Optional date in YYYY-MM-DD format (defaults to today)
   */
  async scrape(page: Page, date?: string): Promise<ConsultationScraperResult> {
    const errors: string[] = [];
    const consultations: ScrapedConsultation[] = [];
    const targetDate = date ?? new Date().toISOString().split("T")[0] ?? "";

    try {
      logger.info(`Fetching consultations for date: ${targetDate}...`);

      // Navigate to consultations page first (ensures proper page state)
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

      // Get the base URL from the page
      const baseUrl = new URL(page.url()).origin;

      // Format dates for IDEXX API (DD.MM.YYYY HH:mm:ss)
      const [year, month, day] = targetDate.split("-");
      const startDate = `${day}.${month}.${year} 00:00:00`;
      const endDate = `${day}.${month}.${year} 23:59:59`;

      // Build consultation search API URL
      const params = new URLSearchParams({
        page: "1",
        date_start: startDate,
        date_end: endDate,
        "order[]": "consultedAt:desc",
      });

      const apiUrl = `${baseUrl}/consultations/search?${params.toString()}`;

      logger.debug(`Fetching consultations from API: ${apiUrl}`);

      // Make authenticated API request using page context
      const response = await page.request.get(apiUrl);

      if (!response.ok()) {
        throw new Error(
          `API request failed with status ${response.status()}: ${response.statusText()}`,
        );
      }

      const data = (await response.json()) as {
        data?: IdexxConsultationApiResponse[];
        consultations?: IdexxConsultationApiResponse[];
        results?: IdexxConsultationApiResponse[];
      };

      // API might return data in different structures
      const apiConsultations =
        data.data ?? data.consultations ?? data.results ?? [];

      logger.debug(
        `Received ${apiConsultations.length} consultations from API`,
      );

      // Transform API response to our consultation format
      for (const apiConsult of apiConsultations) {
        try {
          const consultation = await this.transformApiConsultation(
            apiConsult,
            targetDate,
            page,
            baseUrl,
          );
          consultations.push(consultation);
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          errors.push(`Failed to transform consultation: ${msg}`);
        }
      }

      logger.info(`Extracted ${consultations.length} consultations`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Consultation fetching failed: ${msg}`);
      logger.error(`Fetching failed: ${msg}`);
    }

    return {
      consultations,
      scrapedAt: new Date(),
      errors,
    };
  }

  /**
   * Transform IDEXX API consultation to our format
   * If detailed data is not in the list API response, fetches it from detail endpoint
   */
  private async transformApiConsultation(
    apiConsult: IdexxConsultationApiResponse,
    date: string,
    page: Page,
    baseUrl: string,
  ): Promise<ScrapedConsultation> {
    // Determine status from API data
    let status: ScrapedConsultation["status"] = "in_progress";
    if (apiConsult.status) {
      const statusLower = apiConsult.status.toString().toLowerCase();
      if (
        statusLower.includes("complete") ||
        statusLower.includes("finalized")
      ) {
        status = "completed";
      } else if (statusLower.includes("cancel")) {
        status = "cancelled";
      }
    }

    // Transform vitals if available
    let vitals: ScrapedVitals | null = null;
    if (apiConsult.vitals) {
      vitals = {
        temperature: apiConsult.vitals.temperature,
        temperature_unit:
          (apiConsult.vitals.temperatureUnit as "F" | "C") ?? "F",
        pulse: apiConsult.vitals.pulse,
        respiration: apiConsult.vitals.respiration,
        weight: apiConsult.vitals.weight,
        weight_unit: (apiConsult.vitals.weightUnit as "kg" | "lb") ?? "lb",
        blood_pressure: apiConsult.vitals.bloodPressure,
      };
    }

    // Check if we have detailed data
    const hasNotes = !!apiConsult.clinicalNotes;
    let clinicalNotes = apiConsult.clinicalNotes?.trim() ?? null;
    let diagnoses = apiConsult.diagnoses ?? [];

    // If we don't have detailed data but have a consultation ID, fetch it
    if (!hasNotes && apiConsult.id) {
      try {
        const detailUrl = `${baseUrl}/consultations/view/${apiConsult.id}`;
        const detailResponse = await page.request.get(detailUrl);

        if (detailResponse.ok()) {
          const detailData =
            (await detailResponse.json()) as IdexxConsultationApiResponse;
          clinicalNotes = detailData.clinicalNotes?.trim() ?? clinicalNotes;
          vitals = detailData.vitals
            ? this.transformVitals(detailData.vitals)
            : vitals;
          diagnoses = detailData.diagnoses ?? diagnoses;
        }
      } catch (_error) {
        logger.debug(
          `Could not fetch detailed data for consultation ${apiConsult.id}`,
        );
      }
    }

    return {
      neo_consultation_id: apiConsult.id?.toString() ?? null,
      neo_appointment_id: apiConsult.appointmentId?.toString() ?? null,
      patient_name: apiConsult.patientName?.trim() ?? null,
      date,
      status,
      has_notes: !!clinicalNotes,
      clinical_notes: clinicalNotes,
      vitals,
      diagnoses: Array.isArray(diagnoses) ? diagnoses : [],
    };
  }

  /**
   * Transform API vitals to our format
   */
  private transformVitals(apiVitals: Record<string, unknown>): ScrapedVitals {
    return {
      temperature: apiVitals.temperature as number | undefined,
      temperature_unit: (apiVitals.temperatureUnit as "F" | "C") ?? "F",
      pulse: apiVitals.pulse as number | undefined,
      respiration: apiVitals.respiration as number | undefined,
      weight: apiVitals.weight as number | undefined,
      weight_unit: (apiVitals.weightUnit as "kg" | "lb") ?? "lb",
      blood_pressure: apiVitals.bloodPressure as string | undefined,
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

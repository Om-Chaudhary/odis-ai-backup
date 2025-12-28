/**
 * Scrape Service
 *
 * Main orchestration service for on-demand IDEXX Neo scraping.
 * Coordinates browser, auth, scrapers, and persistence.
 */

import { scrapeLogger as logger } from "../lib/logger";
import { BrowserService } from "./browser.service";
import { AuthService } from "./auth.service";
import { PersistenceService } from "./persistence.service";
import { ScheduleScraper, ConsultationScraper } from "../scrapers";
import type { ScrapeOptions, ScrapeResult } from "../types";

/**
 * Scrape Service
 *
 * Orchestrates the scraping workflow:
 * 1. Retrieve credentials via persistence
 * 2. Create session via persistence
 * 3. Launch browser, login via auth
 * 4. Run appropriate scraper
 * 5. Persist results via persistence
 */
export class ScrapeService {
  private browser: BrowserService;
  private auth: AuthService;
  private persistence: PersistenceService;
  private scheduleScraper: ScheduleScraper;
  private consultationScraper: ConsultationScraper;

  constructor() {
    this.browser = new BrowserService();
    this.auth = new AuthService(this.browser);
    this.persistence = new PersistenceService();
    this.scheduleScraper = new ScheduleScraper(this.browser);
    this.consultationScraper = new ConsultationScraper(this.browser);
  }

  /**
   * Run a scrape operation for a single clinic
   */
  async run(options: ScrapeOptions): Promise<ScrapeResult> {
    const { type, clinicId, date } = options;
    const errors: string[] = [];
    let recordsScraped = 0;
    let sessionId = "";

    logger.info(
      `Starting ${type} scrape for clinic ${clinicId}${date ? ` (date: ${date})` : ""}`,
    );

    try {
      // 1. Validate clinic exists
      const clinic = await this.persistence.getClinic(clinicId);
      if (!clinic) {
        return this.errorResult(`Clinic not found: ${clinicId}`);
      }

      logger.info(`Processing clinic: ${clinic.name}`);

      // 2. Get credentials
      const credentialResult =
        await this.persistence.getClinicCredentials(clinicId);
      if (!credentialResult) {
        return this.errorResult(
          `No credentials found for clinic: ${clinic.name}`,
        );
      }

      const { credentials, userId } = credentialResult;

      // 3. Create session
      const newSessionId = await this.persistence.createSession(
        userId,
        clinicId,
        type,
      );
      if (!newSessionId) {
        return this.errorResult(`Failed to create session for ${clinic.name}`);
      }
      sessionId = newSessionId;

      try {
        // 4. Launch browser and login
        await this.browser.launch();
        const page = await this.browser.newPage();

        const loginSuccess = await this.auth.login(page, credentials);
        if (!loginSuccess) {
          await this.persistence.updateSessionStatus(sessionId, "failed", {
            errorMessage: "Login failed",
          });
          return {
            success: false,
            sessionId,
            recordsScraped: 0,
            errors: [`Login failed for clinic: ${clinic.name}`],
          };
        }

        // 5. Run appropriate scraper
        if (type === "schedule") {
          recordsScraped = await this.runScheduleScrape(
            page,
            clinicId,
            sessionId,
            errors,
            date,
          );
        } else {
          recordsScraped = await this.runConsultationScrape(
            page,
            clinicId,
            sessionId,
            errors,
            date,
          );
        }

        // 6. Update session as completed
        await this.persistence.updateSessionStatus(sessionId, "completed", {
          appointmentsSynced: type === "schedule" ? recordsScraped : 0,
          consultationsSynced: type === "consultation" ? recordsScraped : 0,
        });

        logger.info(
          `Scrape completed for ${clinic.name}: ${recordsScraped} records`,
        );
      } finally {
        await this.browser.close();
      }

      return {
        success: errors.length === 0,
        sessionId,
        recordsScraped,
        errors,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Scrape operation failed: ${msg}`);
      errors.push(msg);

      if (sessionId) {
        await this.persistence.updateSessionStatus(sessionId, "failed", {
          errorMessage: msg,
        });
      }

      return {
        success: false,
        sessionId,
        recordsScraped,
        errors,
      };
    }
  }

  /**
   * Run schedule scraping
   */
  private async runScheduleScrape(
    page: Awaited<ReturnType<BrowserService["newPage"]>>,
    clinicId: string,
    sessionId: string,
    errors: string[],
    date?: string,
  ): Promise<number> {
    const result = await this.scheduleScraper.scrape(page, date);
    errors.push(...result.errors);

    if (result.appointments.length === 0) {
      return 0;
    }

    const { synced, errors: persistErrors } =
      await this.persistence.upsertAppointments(
        clinicId,
        sessionId,
        result.appointments,
      );

    errors.push(...persistErrors);
    return synced;
  }

  /**
   * Run consultation scraping
   */
  private async runConsultationScrape(
    page: Awaited<ReturnType<BrowserService["newPage"]>>,
    clinicId: string,
    sessionId: string,
    errors: string[],
    date?: string,
  ): Promise<number> {
    const result = await this.consultationScraper.scrape(page, date);
    errors.push(...result.errors);

    if (result.consultations.length === 0) {
      return 0;
    }

    const { synced, errors: persistErrors } =
      await this.persistence.upsertConsultations(
        clinicId,
        sessionId,
        result.consultations,
      );

    errors.push(...persistErrors);
    return synced;
  }

  /**
   * Create error result helper
   */
  private errorResult(message: string): ScrapeResult {
    return {
      success: false,
      sessionId: "",
      recordsScraped: 0,
      errors: [message],
    };
  }
}

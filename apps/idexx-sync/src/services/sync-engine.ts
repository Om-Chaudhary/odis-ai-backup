/**
 * Sync Engine Service
 *
 * Main orchestration service for IDEXX Neo synchronization.
 * Coordinates browser automation, data scraping, and database updates.
 */

import type { Page } from "playwright";
import { PlaywrightBrowser } from "./playwright-browser";
import { ScheduleScraper } from "./schedule-scraper";
import { ConsultationScraper } from "./consultation-scraper";
import { LOGIN_SELECTORS, DASHBOARD_SELECTORS } from "../utils/selectors";
import { createServiceClient } from "@odis-ai/db";
import { IdexxCredentialManager } from "@odis-ai/idexx";

export type SyncType = "pre-open" | "eod";

export interface SyncResult {
  success: boolean;
  sessionId: string;
  recordsSynced: number;
  errors: string[];
}

interface IdexxCredentials {
  username: string;
  password: string;
}

/**
 * Sync Engine
 *
 * Coordinates the full sync workflow:
 * 1. Retrieve credentials
 * 2. Launch browser and login
 * 3. Scrape data based on sync type
 * 4. Write to Supabase
 * 5. Log session
 */
export class SyncEngine {
  private browser: PlaywrightBrowser;
  private scheduleScraper: ScheduleScraper;
  private consultationScraper: ConsultationScraper;

  constructor() {
    this.browser = new PlaywrightBrowser();
    this.scheduleScraper = new ScheduleScraper(this.browser);
    this.consultationScraper = new ConsultationScraper(this.browser);
  }

  /**
   * Run a sync operation
   */
  async runSync(syncType: SyncType): Promise<SyncResult> {
    const errors: string[] = [];
    let recordsSynced = 0;
    let sessionId = "";

    try {
      const supabase = await createServiceClient();

      // Get clinics with enabled sync
      const { data: clinics, error: clinicsError } = await supabase
        .from("clinics")
        .select("id, name")
        .eq("is_active", true);

      if (clinicsError) {
        throw new Error(`Failed to fetch clinics: ${clinicsError.message}`);
      }

      if (!clinics || clinics.length === 0) {
        return {
          success: true,
          sessionId: "",
          recordsSynced: 0,
          errors: ["No active clinics found"],
        };
      }

      // Process each clinic
      for (const clinic of clinics) {
        try {
          console.log(`[SYNC] Processing clinic: ${clinic.name}`);

          // Get credentials for this clinic
          const credentials = await this.getClinicCredentials(clinic.id);

          if (!credentials) {
            errors.push(`No credentials found for clinic: ${clinic.name}`);
            continue;
          }

          // Create sync session
          const { data: session, error: sessionError } = await supabase
            .from("idexx_sync_sessions")
            .insert({
              clinic_id: clinic.id,
              session_type:
                syncType === "pre-open"
                  ? "appointment_sync"
                  : "consultation_sync",
              status: "in_progress",
              started_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (sessionError || !session) {
            errors.push(`Failed to create session for ${clinic.name}`);
            continue;
          }

          sessionId = session.id;

          // Launch browser and login
          await this.browser.launch();
          const page = await this.browser.newPage();
          const loginSuccess = await this.login(page, credentials);

          if (!loginSuccess) {
            await this.updateSessionStatus(supabase, sessionId, "failed", {
              error_message: "Login failed",
            });
            errors.push(`Login failed for clinic: ${clinic.name}`);
            continue;
          }

          // Run sync based on type
          let clinicRecordsSynced = 0;

          if (syncType === "pre-open") {
            clinicRecordsSynced = await this.runPreOpenSync(
              page,
              supabase,
              clinic.id,
              sessionId,
              errors,
            );
          } else {
            clinicRecordsSynced = await this.runEodSync(
              page,
              supabase,
              clinic.id,
              sessionId,
              errors,
            );
          }

          recordsSynced += clinicRecordsSynced;

          // Update session as completed
          await this.updateSessionStatus(supabase, sessionId, "completed", {
            appointments_synced:
              syncType === "pre-open" ? clinicRecordsSynced : 0,
            consultations_synced: syncType === "eod" ? clinicRecordsSynced : 0,
            completed_at: new Date().toISOString(),
          });

          console.log(
            `[SYNC] Completed ${clinic.name}: ${clinicRecordsSynced} records`,
          );
        } catch (clinicError) {
          const msg =
            clinicError instanceof Error
              ? clinicError.message
              : "Unknown error";
          errors.push(`Error syncing ${clinic.name}: ${msg}`);
          console.error(`[SYNC] Error with ${clinic.name}:`, msg);
        } finally {
          await this.browser.close();
        }

        // Add delay between clinics to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      return {
        success: errors.length === 0,
        sessionId,
        recordsSynced,
        errors,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(msg);

      return {
        success: false,
        sessionId,
        recordsSynced,
        errors,
      };
    }
  }

  /**
   * Get credentials for a clinic
   */
  private async getClinicCredentials(
    clinicId: string,
  ): Promise<IdexxCredentials | null> {
    try {
      const credentialManager = await IdexxCredentialManager.create();
      const supabase = await createServiceClient();

      // Get credentials directly by clinic_id
      const { data: credential, error } = await supabase
        .from("idexx_credentials")
        .select("user_id")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (error || !credential) {
        console.log(`[SYNC] No credentials found for clinic ${clinicId}`);
        return null;
      }

      return await credentialManager.getCredentials(
        credential.user_id,
        clinicId,
      );
    } catch (error) {
      console.error("[SYNC] Error getting credentials:", error);
      return null;
    }
  }

  /**
   * Login to IDEXX Neo
   */
  private async login(
    page: Page,
    credentials: IdexxCredentials,
  ): Promise<boolean> {
    try {
      console.log("[SYNC] Logging into IDEXX Neo...");

      await page.goto("https://us.idexxneo.com/login", {
        waitUntil: "networkidle",
      });

      // Fill username
      const usernameFilled = await this.browser.fillField(
        page,
        LOGIN_SELECTORS.usernameInput,
        credentials.username,
      );

      if (!usernameFilled) {
        console.error("[SYNC] Could not find username field");
        return false;
      }

      // Fill password
      const passwordFilled = await this.browser.fillField(
        page,
        LOGIN_SELECTORS.passwordInput,
        credentials.password,
      );

      if (!passwordFilled) {
        console.error("[SYNC] Could not find password field");
        return false;
      }

      // Click submit
      await this.browser.clickElement(page, LOGIN_SELECTORS.submitButton);

      // Wait for navigation to dashboard
      const navigated = await this.browser.waitForNavigation(
        page,
        /dashboard|home|schedule/i,
        { timeout: 30000 },
      );

      if (!navigated) {
        // Check for error message
        const errorElement = await this.browser.findElement(
          page,
          LOGIN_SELECTORS.errorMessage,
          { timeout: 2000 },
        );

        if (errorElement) {
          const errorText = await errorElement.textContent();
          console.error("[SYNC] Login error:", errorText);
        }

        // Check for 2FA
        const twoFactorElement = await this.browser.findElement(
          page,
          LOGIN_SELECTORS.twoFactorInput,
          { timeout: 2000 },
        );

        if (twoFactorElement) {
          console.error("[SYNC] 2FA required - cannot proceed automatically");
        }

        return false;
      }

      // Verify login by checking for user menu
      const userMenu = await this.browser.findElement(
        page,
        DASHBOARD_SELECTORS.userMenu,
        { timeout: 5000 },
      );

      if (!userMenu) {
        console.error("[SYNC] Login may have failed - user menu not found");
        return false;
      }

      console.log("[SYNC] Login successful");
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[SYNC] Login error:", msg);
      return false;
    }
  }

  /**
   * Run pre-open sync (schedule scraping)
   */
  private async runPreOpenSync(
    page: Page,
    supabase: Awaited<ReturnType<typeof createServiceClient>>,
    clinicId: string,
    sessionId: string,
    errors: string[],
  ): Promise<number> {
    const result = await this.scheduleScraper.scrapeSchedule(page);
    errors.push(...result.errors);

    if (result.appointments.length === 0) {
      return 0;
    }

    // Upsert appointments to database
    let synced = 0;

    for (const appointment of result.appointments) {
      try {
        const { error } = await supabase.from("appointments").upsert(
          {
            clinic_id: clinicId,
            neo_appointment_id: appointment.neo_appointment_id,
            date: appointment.date,
            start_time: appointment.start_time,
            end_time: appointment.end_time ?? appointment.start_time,
            patient_name: appointment.patient_name,
            client_name: appointment.client_name,
            client_phone: appointment.client_phone,
            appointment_type: appointment.appointment_type,
            status: "scheduled",
            source: "neo",
            sync_id: sessionId,
          },
          {
            onConflict: "clinic_id,neo_appointment_id",
          },
        );

        if (error) {
          errors.push(`Failed to upsert appointment: ${error.message}`);
        } else {
          synced++;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Error upserting appointment: ${msg}`);
      }
    }

    return synced;
  }

  /**
   * Run EOD sync (consultation scraping)
   */
  private async runEodSync(
    page: Page,
    supabase: Awaited<ReturnType<typeof createServiceClient>>,
    clinicId: string,
    sessionId: string,
    errors: string[],
  ): Promise<number> {
    const result = await this.consultationScraper.scrapeConsultations(page);
    errors.push(...result.errors);

    if (result.consultations.length === 0) {
      return 0;
    }

    // Update cases with consultation data
    let synced = 0;

    for (const consultation of result.consultations) {
      if (!consultation.has_notes || !consultation.clinical_notes) {
        continue;
      }

      try {
        // Find matching case by appointment ID or patient name + date
        let caseId: string | null = null;

        if (consultation.neo_appointment_id) {
          const { data: appointment } = await supabase
            .from("appointments")
            .select("id")
            .eq("clinic_id", clinicId)
            .eq("neo_appointment_id", consultation.neo_appointment_id)
            .single();

          if (appointment) {
            // Find case linked to this appointment date
            const { data: cases } = await supabase
              .from("cases")
              .select("id")
              .eq("scheduled_at", `${consultation.date}T00:00:00Z`)
              .limit(1);

            if (cases && cases.length > 0) {
              caseId = cases[0]?.id ?? null;
            }
          }
        }

        if (!caseId && consultation.patient_name) {
          // Try matching by patient name and date
          const { data: patients } = await supabase
            .from("patients")
            .select("case_id")
            .ilike("name", `%${consultation.patient_name}%`)
            .limit(1);

          if (patients && patients.length > 0 && patients[0]?.case_id) {
            caseId = patients[0].case_id;
          }
        }

        if (!caseId) {
          // Create new case for this consultation
          const { data: newCase, error: createError } = await supabase
            .from("cases")
            .insert({
              source: "idexx_neo",
              external_id: consultation.neo_consultation_id,
              status: "ongoing",
              scheduled_at: `${consultation.date}T00:00:00Z`,
              metadata: {
                idexx_consultation_id: consultation.neo_consultation_id,
                idexx_notes: consultation.clinical_notes,
                idexx_vitals: consultation.vitals,
                idexx_diagnoses: consultation.diagnoses,
                synced_at: new Date().toISOString(),
              },
            })
            .select("id")
            .single();

          if (createError) {
            errors.push(`Failed to create case: ${createError.message}`);
            continue;
          }

          caseId = newCase?.id ?? null;
        } else {
          // Update existing case with IDEXX data
          const { error: updateError } = await supabase
            .from("cases")
            .update({
              metadata: {
                idexx_consultation_id: consultation.neo_consultation_id,
                idexx_notes: consultation.clinical_notes,
                idexx_vitals: consultation.vitals,
                idexx_diagnoses: consultation.diagnoses,
                synced_at: new Date().toISOString(),
              },
            })
            .eq("id", caseId);

          if (updateError) {
            errors.push(`Failed to update case: ${updateError.message}`);
            continue;
          }
        }

        // Track consultation sync status
        const consultationIdToUse =
          consultation.neo_consultation_id ?? `unknown-${Date.now()}`;
        await supabase.from("consultation_sync_status").upsert(
          {
            neo_consultation_id: consultationIdToUse,
            sync_session_id: sessionId,
            case_id: caseId,
            status: "synced",
            synced_at: new Date().toISOString(),
          },
          {
            onConflict: "neo_consultation_id",
          },
        );

        synced++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Error processing consultation: ${msg}`);
      }
    }

    return synced;
  }

  /**
   * Update sync session status
   */
  private async updateSessionStatus(
    supabase: Awaited<ReturnType<typeof createServiceClient>>,
    sessionId: string,
    status: string,
    additionalData: Record<string, unknown> = {},
  ): Promise<void> {
    await supabase
      .from("idexx_sync_sessions")
      .update({
        status,
        ...additionalData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
  }
}

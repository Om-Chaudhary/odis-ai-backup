/**
 * ODIS API Client
 *
 * Client for the ODIS /api/cases/ingest endpoint.
 * Handles case ingestion and no-show deletions.
 */

import {
  logger,
  getAuthSession,
  sendApiRequest,
} from "@odis-ai/extension/shared";
import type {
  IdexxAppointmentData,
  IdexxIngestRequest,
  IdexxIngestResponse,
  IdexxDeleteResponse,
} from "../../types";

const odisLogger = logger.child("[OdisApiClient]");

// ODIS API base URL
const ODIS_API_BASE_URL = process.env.CEB_API_URL || "https://odisai.net";

// Timeout for API requests (60 seconds - ingestion includes AI generation)
const API_TIMEOUT_MS = 60000;

/**
 * ODIS API Client for case ingestion
 */
class OdisApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = ODIS_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get the current auth token
   */
  private async getAuthToken(): Promise<string> {
    const session = await getAuthSession();
    if (!session?.access_token) {
      throw new Error("No auth session available - user must be logged in");
    }
    return session.access_token;
  }

  /**
   * Ingest a single IDEXX appointment
   *
   * This creates or updates a case in ODIS, runs AI entity extraction,
   * generates a discharge summary, and pre-generates call intelligence.
   *
   * @param appointment - IDEXX appointment data
   * @param options - Ingest options (autoSchedule, skipGeneration, etc.)
   * @returns Ingest response with case ID and generation status
   */
  async ingestAppointment(
    appointment: IdexxAppointmentData,
    options?: IdexxIngestRequest["options"],
  ): Promise<IdexxIngestResponse> {
    const token = await this.getAuthToken();
    const url = `${this.baseUrl}/api/cases/ingest`;

    const requestBody: IdexxIngestRequest = {
      appointment,
      options,
    };

    odisLogger.info("Ingesting appointment", {
      appointmentId: appointment.appointmentId,
      petName: appointment.pet_name,
      hasConsultationNotes: !!appointment.consultation_notes,
    });

    const response = await sendApiRequest<IdexxIngestResponse>(
      url,
      "POST",
      requestBody,
      token,
      {
        timeout: API_TIMEOUT_MS,
      },
    );

    if (response.success) {
      odisLogger.info("Appointment ingested successfully", {
        caseId: response.data?.caseId,
        generation: response.data?.generation,
        timing: response.data?.timing,
      });
    } else {
      odisLogger.warn("Appointment ingest failed", {
        appointmentId: appointment.appointmentId,
        error: response.error,
      });
    }

    return response;
  }

  /**
   * Delete a no-show case by appointment ID
   *
   * Used when an IDEXX appointment becomes a no-show or is cancelled.
   * Deletes the corresponding case from ODIS.
   *
   * @param appointmentId - IDEXX appointment ID
   * @returns true if a case was deleted, false if no matching case found
   */
  async deleteNoShowCase(appointmentId: string): Promise<boolean> {
    const token = await this.getAuthToken();
    const url = `${this.baseUrl}/api/cases/ingest?appointmentId=${encodeURIComponent(appointmentId)}`;

    odisLogger.info("Deleting no-show case", { appointmentId });

    try {
      const response = await sendApiRequest<IdexxDeleteResponse>(
        url,
        "DELETE",
        undefined,
        token,
        {
          timeout: API_TIMEOUT_MS,
        },
      );

      if (response.deleted) {
        odisLogger.info("No-show case deleted", { appointmentId });
      } else {
        odisLogger.info("No case found to delete", { appointmentId });
      }

      return response.deleted;
    } catch (error) {
      odisLogger.error("Failed to delete no-show case", {
        appointmentId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Sync future appointments to the appointments table
   *
   * Unlike ingestAppointment which creates cases for finalized appointments,
   * this syncs scheduled/confirmed appointments for availability checking.
   *
   * @param appointments - Array of transformed appointment data
   * @returns Sync response with count of synced appointments
   */
  async syncAppointments(
    appointments: Array<{
      neo_appointment_id: string;
      date: string;
      start_time: string;
      end_time: string;
      patient_name?: string;
      client_name?: string;
      client_phone?: string;
      appointment_type?: string | null;
      status: "scheduled" | "confirmed";
      notes?: string;
      metadata?: Record<string, unknown>;
    }>,
  ): Promise<{ success: boolean; count: number; error?: string }> {
    const token = await this.getAuthToken();
    const url = `${this.baseUrl}/api/appointments/sync`;

    // Get user/clinic info from session
    const session = await getAuthSession();
    const user = session?.user;

    if (!user) {
      throw new Error("User info not available");
    }

    odisLogger.info("Syncing future appointments", {
      count: appointments.length,
      user_id: user.id,
    });

    try {
      const requestBody = {
        clinic_name: user.user_metadata?.clinic_name || "Unknown Clinic",
        appointments,
      };

      const response = await sendApiRequest<{
        success: boolean;
        count: number;
        error?: string;
      }>(url, "POST", requestBody, token);

      if (response.success) {
        odisLogger.info("Future appointments synced successfully", {
          count: response.count,
        });
      } else {
        odisLogger.warn("Future appointments sync failed", {
          error: response.error,
        });
      }

      return response;
    } catch (error) {
      odisLogger.error("Failed to sync future appointments", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * Singleton instance of OdisApiClient
 */
let odisApiClientInstance: OdisApiClient | null = null;

/**
 * Get or create the singleton OdisApiClient instance
 */
const getOdisApiClient = (): OdisApiClient => {
  if (!odisApiClientInstance) {
    odisApiClientInstance = new OdisApiClient();
  }
  return odisApiClientInstance;
};

export { OdisApiClient, getOdisApiClient };

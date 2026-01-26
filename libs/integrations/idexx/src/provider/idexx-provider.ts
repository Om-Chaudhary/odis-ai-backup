/**
 * IDEXX Neo Provider
 * Implements IPimsProvider interface for IDEXX Neo integration
 */

import type {
  IPimsProvider,
  PimsCredentials,
  PimsAppointment,
  PimsConsultation,
} from "@odis-ai/shared/types";
import { type BrowserService } from "../browser/browser-service";
import { IdexxAuthClient } from "./auth-client";
import { IdexxScheduleClient } from "./schedule-client";
import { IdexxConsultationClient } from "./consultation-client";
import { IdexxAppointmentManagementClient } from "./appointment-management-client";
import type { IdexxProviderConfig } from "./types";
import type {
  CreateAppointmentInput,
  AppointmentOperationResult,
  SearchPatientParams,
  PatientSearchResult,
} from "./appointment-management-types";

/**
 * IDEXX Neo provider implementation
 * Handles authentication, schedule fetching, and consultation retrieval
 */
export class IdexxProvider implements IPimsProvider {
  readonly name = "IDEXX Neo";

  private browserService: BrowserService;
  private authClient: IdexxAuthClient;
  private scheduleClient: IdexxScheduleClient;
  private consultationClient: IdexxConsultationClient;
  private appointmentMgmtClient: IdexxAppointmentManagementClient;
  private baseUrl: string;
  private debug: boolean;

  constructor(config: IdexxProviderConfig) {
    this.browserService = config.browserService;
    this.baseUrl = config.baseUrl ?? "https://us.idexxneo.com";
    this.debug = config.debug ?? false;

    // Initialize clients
    this.authClient = new IdexxAuthClient(this.browserService, this.baseUrl);
    this.scheduleClient = new IdexxScheduleClient(
      this.browserService,
      this.authClient,
      this.baseUrl,
    );
    this.consultationClient = new IdexxConsultationClient(
      this.browserService,
      this.authClient,
      this.baseUrl,
    );
    this.appointmentMgmtClient = new IdexxAppointmentManagementClient(
      this.browserService,
      this.authClient,
      this.baseUrl,
    );

    if (this.debug) {
      console.log("[IdexxProvider] Initialized with baseUrl:", this.baseUrl);
    }
  }

  /**
   * Authenticate with IDEXX Neo
   */
  async authenticate(credentials: PimsCredentials): Promise<boolean> {
    if (this.debug) {
      console.log("[IdexxProvider] Authenticating...");
    }

    try {
      const success = await this.authClient.authenticate(credentials);

      if (this.debug) {
        console.log(
          "[IdexxProvider] Authentication:",
          success ? "SUCCESS" : "FAILED",
        );
      }

      return success;
    } catch (error) {
      if (this.debug) {
        console.error("[IdexxProvider] Authentication error:", error);
      }
      return false;
    }
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    return this.authClient.isAuthenticated();
  }

  /**
   * Fetch appointments for date range
   */
  async fetchAppointments(
    startDate: Date,
    endDate: Date,
  ): Promise<PimsAppointment[]> {
    if (this.debug) {
      console.log("[IdexxProvider] Fetching appointments:", {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      });
    }

    try {
      const appointments = await this.scheduleClient.fetchAppointments(
        startDate,
        endDate,
      );

      if (this.debug) {
        console.log(
          `[IdexxProvider] Found ${appointments.length} appointments`,
        );
      }

      return appointments;
    } catch (error) {
      if (this.debug) {
        console.error("[IdexxProvider] Appointments error:", error);
      }
      return [];
    }
  }

  /**
   * Fetch consultation details
   */
  async fetchConsultation(
    consultationId: string,
  ): Promise<PimsConsultation | null> {
    if (this.debug) {
      console.log("[IdexxProvider] Fetching consultation:", consultationId);
    }

    try {
      const consultation =
        await this.consultationClient.fetchConsultation(consultationId);

      if (this.debug) {
        console.log(
          "[IdexxProvider] Consultation:",
          consultation ? "FOUND" : "NOT FOUND",
        );
      }

      return consultation;
    } catch (error) {
      if (this.debug) {
        console.error("[IdexxProvider] Consultation error:", error);
      }
      return null;
    }
  }

  /**
   * Batch fetch consultations (optimization)
   */
  async fetchConsultations(
    consultationIds: string[],
  ): Promise<Map<string, PimsConsultation>> {
    if (this.debug) {
      console.log(
        `[IdexxProvider] Batch fetching ${consultationIds.length} consultations`,
      );
    }

    try {
      const consultations =
        await this.consultationClient.fetchConsultations(consultationIds);

      if (this.debug) {
        console.log(
          `[IdexxProvider] Fetched ${consultations.size}/${consultationIds.length} consultations`,
        );
      }

      return consultations;
    } catch (error) {
      if (this.debug) {
        console.error("[IdexxProvider] Batch consultation error:", error);
      }
      return new Map();
    }
  }

  /**
   * Search for patients by name or ID
   */
  async searchPatient(
    params: SearchPatientParams,
  ): Promise<PatientSearchResult> {
    if (this.debug) {
      console.log("[IdexxProvider] Searching patients:", params.query);
    }

    try {
      const result = await this.appointmentMgmtClient.searchPatient(params);

      if (this.debug) {
        console.log(
          `[IdexxProvider] Found ${result.patients.length} patients`,
        );
      }

      return result;
    } catch (error) {
      if (this.debug) {
        console.error("[IdexxProvider] Patient search error:", error);
      }
      return { patients: [], totalCount: 0 };
    }
  }

  /**
   * Create appointment for existing patient
   */
  async createAppointment(
    input: CreateAppointmentInput,
  ): Promise<AppointmentOperationResult> {
    if (this.debug) {
      console.log("[IdexxProvider] Creating appointment:", {
        patientId: input.patientId,
        date: input.date,
        time: input.startTime,
      });
    }

    try {
      const result = await this.appointmentMgmtClient.createAppointment(input);

      if (this.debug) {
        console.log("[IdexxProvider] Appointment creation result:", {
          success: result.success,
          appointmentId: result.appointmentId,
        });
      }

      return result;
    } catch (error) {
      if (this.debug) {
        console.error("[IdexxProvider] Appointment creation error:", error);
      }
      return {
        success: false,
        error: {
          code: "provider_error",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: error,
        },
      };
    }
  }

  /**
   * Create appointment with new client and patient
   */
  async createAppointmentWithNewClient(
    input: CreateAppointmentInput,
  ): Promise<AppointmentOperationResult> {
    if (this.debug) {
      console.log("[IdexxProvider] Creating appointment with new client:", {
        clientName: `${input.newClient?.firstName} ${input.newClient?.lastName}`,
        patientName: input.newPatient?.name,
        date: input.date,
      });
    }

    try {
      const result =
        await this.appointmentMgmtClient.createAppointmentWithNewClient(input);

      if (this.debug) {
        console.log(
          "[IdexxProvider] New client appointment creation result:",
          {
            success: result.success,
            appointmentId: result.appointmentId,
          },
        );
      }

      return result;
    } catch (error) {
      if (this.debug) {
        console.error(
          "[IdexxProvider] New client appointment creation error:",
          error,
        );
      }
      return {
        success: false,
        error: {
          code: "provider_error",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: error,
        },
      };
    }
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    if (this.debug) {
      console.log("[IdexxProvider] Closing...");
    }

    try {
      // Clear authentication state
      this.authClient.clearAuth();

      // Close browser service
      await this.browserService.close();

      if (this.debug) {
        console.log("[IdexxProvider] Closed successfully");
      }
    } catch (error) {
      if (this.debug) {
        console.error("[IdexxProvider] Close error:", error);
      }
    }
  }

  /**
   * Get provider statistics
   */
  getStats() {
    return {
      name: this.name,
      authenticated: this.isAuthenticated(),
      authState: this.authClient.getAuthState(),
      browserRunning: this.browserService.isRunning(),
      activeContexts: this.browserService.getContextCount(),
    };
  }
}

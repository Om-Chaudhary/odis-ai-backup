/**
 * IDEXX Neo Appointment Management Client
 * Handles appointment creation, patient search, and client management
 */

import type { Page } from "playwright";
import type { BrowserService } from "../browser/browser-service";
import type { IdexxAuthClient } from "./auth-client";
import type {
  CreateAppointmentInput,
  AppointmentOperationResult,
  IdexxPatient,
  SearchPatientParams,
  PatientSearchResult,
  IdexxAppointmentCreatePayload,
  IdexxAppointmentResponse,
  CancelAppointmentInput,
  IdexxAppointmentViewData,
  IdexxAppointmentDetails,
  GetAppointmentResult,
} from "./appointment-management-types";

/**
 * IDEXX API endpoints for appointment management
 * Based on API discovery (January 2026)
 */
const APPOINTMENT_ENDPOINTS = {
  /**
   * Patient search endpoint (autocomplete)
   * Uses /search/patients NOT /patients/search
   */
  PATIENT_SEARCH: "/search/patients",

  /**
   * Appointment creation endpoint (multipart/form-data)
   */
  CREATE_APPOINTMENT: "/appointments/create",

  /**
   * Cancel/Delete appointment endpoint
   * POST /appointments/delete/{id} with {"action": "cancel"|"delete", "reason": "..."}
   */
  DELETE_APPOINTMENT: "/appointments/delete",

  /**
   * Get single appointment details
   */
  GET_APPOINTMENT: "/appointments/getAppointment",

  /**
   * Get appointment view data (types, rooms, providers)
   */
  GET_APPOINTMENT_VIEW: "/appointments/getAppointmentView",

  /**
   * Client creation endpoint
   */
  CREATE_CLIENT: "/clients/create",

  /**
   * Patient creation endpoint
   */
  CREATE_PATIENT: "/patients/create",

  /**
   * Client search endpoint
   */
  CLIENT_SEARCH: "/clients/search",

  /**
   * Get genders (lookup data)
   */
  GET_GENDERS: "/genders/getGenders",
} as const;

/**
 * Client for managing appointments in IDEXX Neo
 */
export class IdexxAppointmentManagementClient {
  constructor(
    private browserService: BrowserService,
    private authClient: IdexxAuthClient,
    private baseUrl: string,
  ) {}

  /**
   * Search for patients by name or ID
   * Uses the same pattern as existing clients: page.evaluate() with fetch()
   */
  async searchPatient(
    params: SearchPatientParams,
  ): Promise<PatientSearchResult> {
    if (!this.authClient.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    const session = await this.browserService.createPage("patient-search");
    const { page } = session;

    try {
      // Apply authentication
      await this.authClient.applyAuth(page);

      // Navigate to IDEXX domain for same-origin fetch
      await page.goto(this.baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      // Build search URL
      const url = `${this.baseUrl}${APPOINTMENT_ENDPOINTS.PATIENT_SEARCH}?q=${encodeURIComponent(params.query)}${params.limit ? `&limit=${params.limit}` : ""}`;

      console.log("[IdexxAppointmentMgmt] Searching patients:", {
        query: params.query,
        url,
      });

      // Fetch patient search results
      const result = await this.fetchPatientSearch(page, url);

      return result;
    } catch (error) {
      console.error("Failed to search patients:", error);
      return { patients: [], totalCount: 0 };
    } finally {
      await page.close();
    }
  }

  /**
   * Fetch patient search results from API
   */
  private async fetchPatientSearch(
    page: Page,
    url: string,
  ): Promise<PatientSearchResult> {
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
        throw new Error(`Patient search error: ${res.status} ${res.statusText}`);
      }

      return res.json();
    }, url);

    // Handle different response formats
    const patients = this.parsePatientSearchResponse(response);

    return {
      patients,
      totalCount: patients.length,
    };
  }

  /**
   * Safely convert value to string, only if it's a primitive
   * Returns empty string if value is an object or null/undefined
   */
  private toSafeString(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    // Skip objects, arrays, functions, etc.
    return "";
  }

  /**
   * Parse patient search response into IdexxPatient[]
   * Handles various response formats from IDEXX API
   */
  private parsePatientSearchResponse(response: unknown): IdexxPatient[] {
    // Response could be:
    // - Array of patients directly
    // - { patients: [...] }
    // - { data: [...] }
    // - { results: [...] }

    let rawPatients: unknown[] = [];

    if (Array.isArray(response)) {
      rawPatients = response;
    } else if (typeof response === "object" && response !== null) {
      const obj = response as Record<string, unknown>;
      if (Array.isArray(obj.patients)) {
        rawPatients = obj.patients;
      } else if (Array.isArray(obj.data)) {
        rawPatients = obj.data;
      } else if (Array.isArray(obj.results)) {
        rawPatients = obj.results;
      }
    }

    return rawPatients
      .filter((patient): patient is Record<string, unknown> => 
        typeof patient === "object" && patient !== null
      )
      .map((patient): IdexxPatient => {
        const p = patient;

        // Safely extract client name from various formats
        const clientName =
          this.toSafeString(p.client_name) ||
          this.toSafeString(p.clientName) ||
          `${this.toSafeString(p.client_first_name)} ${this.toSafeString(p.client_last_name)}`.trim();

        const mapped: IdexxPatient = {
          id: this.toSafeString(p.id) || this.toSafeString(p.patient_id),
          name: this.toSafeString(p.name) || this.toSafeString(p.patient_name),
          clientId: this.toSafeString(p.client_id) || this.toSafeString(p.clientId),
          clientName,
          species: this.toSafeString(p.species),
        };

        // Add optional properties only if they exist and are primitives
        const breed = this.toSafeString(p.breed);
        const age = this.toSafeString(p.age);
        const color = this.toSafeString(p.color);
        const sex = this.toSafeString(p.sex);
        const weight = this.toSafeString(p.weight);

        if (breed) mapped.breed = breed;
        if (age) mapped.age = age;
        if (color) mapped.color = color;
        if (sex) mapped.sex = sex;
        if (weight) mapped.weight = weight;

        return mapped;
      })
      .filter((p) => !!p.id);
  }

  /**
   * Create appointment for existing patient
   */
  async createAppointment(
    input: CreateAppointmentInput,
  ): Promise<AppointmentOperationResult> {
    if (!this.authClient.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    const session = await this.browserService.createPage("create-appointment");
    const { page } = session;

    try {
      // Apply authentication
      await this.authClient.applyAuth(page);

      // Navigate to IDEXX domain
      await page.goto(this.baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      // Build appointment payload
      const payload = this.buildAppointmentPayload(input);

      console.log("[IdexxAppointmentMgmt] Creating appointment:", {
        patientId: input.patientId,
        date: input.date,
        time: input.startTime,
      });

      // Create appointment via API
      const result = await this.postAppointment(page, payload);

      return result;
    } catch (error) {
      console.error("Failed to create appointment:", error);
      return {
        success: false,
        error: {
          code: "api_error",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: error,
        },
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Build appointment creation payload
   */
  private buildAppointmentPayload(
    input: CreateAppointmentInput,
  ): IdexxAppointmentCreatePayload {
    return {
      patient_id: input.patientId,
      client_id: input.clientId,
      provider_id: input.providerId,
      appointment_type_id: input.appointmentTypeId,
      room_id: input.roomId,
      appointment_date: input.date,
      start_time: this.formatTimeForApi(input.startTime),
      end_time: this.formatTimeForApi(input.endTime),
      reason: input.reason,
      notes: input.note,
      status: "Scheduled",
    };
  }

  /**
   * Format time to IDEXX API format (HH:MM:SS)
   */
  private formatTimeForApi(time: string): string {
    // If already in HH:MM:SS format, return as is
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      return time;
    }

    // If in HH:MM format, add :00
    if (/^\d{2}:\d{2}$/.test(time)) {
      return `${time}:00`;
    }

    // If in H:MM or other format, try to parse
    const parts = time.split(":");
    const hours = String(parts[0] ?? "0").padStart(2, "0");
    const minutes = String(parts[1] ?? "0").padStart(2, "0");
    return `${hours}:${minutes}:00`;
  }

  /**
   * Post appointment to IDEXX API
   */
  private async postAppointment(
    page: Page,
    payload: IdexxAppointmentCreatePayload,
  ): Promise<AppointmentOperationResult> {
    const url = `${this.baseUrl}${APPOINTMENT_ENDPOINTS.CREATE_APPOINTMENT}`;

    const response = await page.evaluate(
      async (args: { url: string; payload: IdexxAppointmentCreatePayload }) => {
        const res = await fetch(args.url, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify(args.payload),
        });

        const responseData = await res.json();

        return {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          data: responseData,
        };
      },
      { url, payload },
    );

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: String(response.status),
          message: response.statusText,
          details: response.data,
        },
      };
    }

    // Parse response
    const apptResponse = response.data as IdexxAppointmentResponse;

    return {
      success: true,
      appointmentId: String(apptResponse.id ?? apptResponse.appointment_id),
      message: "Appointment created successfully",
    };
  }

  /**
   * Create new client and patient, then schedule appointment
   */
  async createAppointmentWithNewClient(
    input: CreateAppointmentInput,
  ): Promise<AppointmentOperationResult> {
    if (!this.authClient.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    const session = await this.browserService.createPage(
      "create-appointment-new-client",
    );
    const { page } = session;

    try {
      // Apply authentication
      await this.authClient.applyAuth(page);

      // Navigate to IDEXX domain
      await page.goto(this.baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      console.log("[IdexxAppointmentMgmt] Creating new client and patient");

      // Step 1: Create client
      if (!input.newClient) {
        return {
          success: false,
          error: {
            code: "missing_client_data",
            message: "New client data is required",
          },
        };
      }

      const clientResult = await this.createClient(page, input.newClient);
      if (!clientResult.success || !clientResult.clientId) {
        return {
          success: false,
          error: {
            code: "client_creation_failed",
            message: clientResult.error?.message ?? "Failed to create client",
            details: clientResult.error,
          },
        };
      }

      // Step 2: Create patient under the new client
      if (!input.newPatient) {
        return {
          success: false,
          error: {
            code: "missing_patient_data",
            message: "New patient data is required",
          },
        };
      }

      const patientResult = await this.createPatient(
        page,
        input.newPatient,
        clientResult.clientId,
      );
      if (!patientResult.success || !patientResult.patientId) {
        return {
          success: false,
          error: {
            code: "patient_creation_failed",
            message:
              patientResult.error?.message ?? "Failed to create patient",
            details: patientResult.error,
          },
        };
      }

      // Step 3: Create appointment with new patient ID
      const appointmentInput: CreateAppointmentInput = {
        ...input,
        patientId: patientResult.patientId,
        clientId: clientResult.clientId,
      };

      const appointmentPayload = this.buildAppointmentPayload(appointmentInput);
      const result = await this.postAppointment(page, appointmentPayload);

      console.log("[IdexxAppointmentMgmt] Appointment created with new client:", {
        clientId: clientResult.clientId,
        patientId: patientResult.patientId,
        appointmentId: result.appointmentId,
      });

      return result;
    } catch (error) {
      console.error("Failed to create appointment with new client:", error);
      return {
        success: false,
        error: {
          code: "api_error",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: error,
        },
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Create a new client
   */
  private async createClient(
    page: Page,
    clientData: NonNullable<CreateAppointmentInput["newClient"]>,
  ): Promise<{ success: boolean; clientId?: string; error?: { code: string; message: string } }> {
    const url = `${this.baseUrl}${APPOINTMENT_ENDPOINTS.CREATE_CLIENT}`;

    const payload = {
      first_name: clientData.firstName,
      last_name: clientData.lastName,
      phone: clientData.phone,
      email: clientData.email,
      address: clientData.address,
      city: clientData.city,
      state: clientData.state,
      zip_code: clientData.zipCode,
    };

    const response = await page.evaluate(
      async (args: { url: string; payload: unknown }) => {
        const res = await fetch(args.url, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify(args.payload),
        });

        const responseData = await res.json();

        return {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          data: responseData,
        };
      },
      { url, payload },
    );

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: String(response.status),
          message: `Client creation failed: ${response.statusText}`,
        },
      };
    }

    const clientResponse = response.data as { id?: string | number; client_id?: string | number };
    const clientId = String(clientResponse.id ?? clientResponse.client_id);

    return {
      success: true,
      clientId,
    };
  }

  /**
   * Create a new patient
   */
  private async createPatient(
    page: Page,
    patientData: NonNullable<CreateAppointmentInput["newPatient"]>,
    clientId: string,
  ): Promise<{ success: boolean; patientId?: string; error?: { code: string; message: string } }> {
    const url = `${this.baseUrl}${APPOINTMENT_ENDPOINTS.CREATE_PATIENT}`;

    const payload = {
      client_id: clientId,
      name: patientData.name,
      species: patientData.species,
      breed: patientData.breed,
      age: patientData.age,
      color: patientData.color,
      sex: patientData.sex,
      weight: patientData.weight,
    };

    const response = await page.evaluate(
      async (args: { url: string; payload: unknown }) => {
        const res = await fetch(args.url, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify(args.payload),
        });

        const responseData = await res.json();

        return {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          data: responseData,
        };
      },
      { url, payload },
    );

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: String(response.status),
          message: `Patient creation failed: ${response.statusText}`,
        },
      };
    }

    const patientResponse = response.data as { id?: string | number; patient_id?: string | number };
    const patientId = String(patientResponse.id ?? patientResponse.patient_id);

    return {
      success: true,
      patientId,
    };
  }

  /* ========================================
     Appointment Retrieval Methods
     ======================================== */

  /**
   * Get appointment details by ID
   * Endpoint: GET /appointments/getAppointment?id={id}
   */
  async getAppointment(appointmentId: string): Promise<GetAppointmentResult> {
    if (!this.authClient.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    const session = await this.browserService.createPage("get-appointment");
    const { page } = session;

    try {
      await this.authClient.applyAuth(page);

      await page.goto(this.baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      const url = `${this.baseUrl}${APPOINTMENT_ENDPOINTS.GET_APPOINTMENT}?id=${appointmentId}`;

      console.log("[IdexxAppointmentMgmt] Getting appointment:", { appointmentId, url });

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
          return { ok: false, status: res.status, statusText: res.statusText, data: null };
        }

        return { ok: true, status: res.status, statusText: res.statusText, data: await res.json() };
      }, url);

      if (!response.ok || !response.data) {
        return {
          success: false,
          error: {
            code: String(response.status),
            message: response.statusText || "Appointment not found",
          },
        };
      }

      // The API returns { appointment: {...} }
      const appointmentData = (response.data as { appointment?: IdexxAppointmentDetails }).appointment;

      if (!appointmentData) {
        return {
          success: false,
          error: {
            code: "not_found",
            message: "Appointment not found",
          },
        };
      }

      return {
        success: true,
        appointment: appointmentData,
      };
    } catch (error) {
      console.error("Failed to get appointment:", error);
      return {
        success: false,
        error: {
          code: "api_error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Get appointment view data (lookup data: types, rooms, providers)
   * Endpoint: GET /appointments/getAppointmentView
   */
  async getAppointmentView(): Promise<IdexxAppointmentViewData | null> {
    if (!this.authClient.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    const session = await this.browserService.createPage("get-appointment-view");
    const { page } = session;

    try {
      await this.authClient.applyAuth(page);

      await page.goto(this.baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      const url = `${this.baseUrl}${APPOINTMENT_ENDPOINTS.GET_APPOINTMENT_VIEW}`;

      console.log("[IdexxAppointmentMgmt] Getting appointment view data");

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
          return null;
        }

        return res.json();
      }, url);

      return response as IdexxAppointmentViewData | null;
    } catch (error) {
      console.error("Failed to get appointment view:", error);
      return null;
    } finally {
      await page.close();
    }
  }

  /* ========================================
     Appointment Cancellation Methods
     ======================================== */

  /**
   * Cancel an appointment
   * Endpoint: POST /appointments/delete/{id}
   * Body: { "action": "cancel" | "delete", "reason": "..." }
   */
  async cancelAppointment(input: CancelAppointmentInput): Promise<AppointmentOperationResult> {
    if (!this.authClient.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    const session = await this.browserService.createPage("cancel-appointment");
    const { page } = session;

    try {
      await this.authClient.applyAuth(page);

      await page.goto(this.baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      const url = `${this.baseUrl}${APPOINTMENT_ENDPOINTS.DELETE_APPOINTMENT}/${input.appointmentId}`;
      const payload = {
        action: input.action ?? "cancel", // Default to soft cancel
        reason: input.reason ?? "Cancelled via phone",
      };

      console.log("[IdexxAppointmentMgmt] Cancelling appointment:", {
        appointmentId: input.appointmentId,
        action: payload.action,
        reason: payload.reason,
      });

      const response = await page.evaluate(
        async (args: { url: string; payload: { action: string; reason: string } }) => {
          const res = await fetch(args.url, {
            method: "POST",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify(args.payload),
          });

          const responseData = await res.json().catch(() => ({}));

          return {
            ok: res.ok,
            status: res.status,
            statusText: res.statusText,
            data: responseData,
          };
        },
        { url, payload },
      );

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: String(response.status),
            message: response.statusText || "Failed to cancel appointment",
            details: response.data,
          },
        };
      }

      console.log("[IdexxAppointmentMgmt] Appointment cancelled successfully:", {
        appointmentId: input.appointmentId,
      });

      return {
        success: true,
        appointmentId: input.appointmentId,
        message: "Appointment cancelled successfully",
      };
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      return {
        success: false,
        error: {
          code: "api_error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    } finally {
      await page.close();
    }
  }
}

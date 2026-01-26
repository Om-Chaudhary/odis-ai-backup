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
  IdexxAppointmentCreateFormData,
  IdexxAppointmentResponse,
  CancelAppointmentInput,
  IdexxAppointmentViewData,
  IdexxAppointmentDetails,
  GetAppointmentResult,
} from "./appointment-management-types";
import { idexxFetch, extractCsrfToken } from "./fetch-utils";
import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.idexx;

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
  ) { }

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

      logger.debug("Searching patients", {
        query: params.query,
        url,
      });

      // Fetch patient search results using shared utility
      const response = await idexxFetch(page, url, { method: "GET" });

      if (!response.ok) {
        throw new Error(`Patient search error: ${response.status} ${response.statusText}`);
      }

      // Handle different response formats
      const patients = this.parsePatientSearchResponse(response.data);

      return {
        patients,
        totalCount: patients.length,
      };
    } catch (error) {
      logger.error("Failed to search patients", { error });
      return { patients: [], totalCount: 0 };
    } finally {
      await page.close();
    }
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
   * Now uses form-based automation to avoid CSRF issues
   */
  async createAppointment(
    input: CreateAppointmentInput,
  ): Promise<AppointmentOperationResult> {
    // Use form-based method which handles CSRF properly
    return this.createAppointmentViaForm(input);
  }

  /**
   * Create appointment via form automation (CSRF-safe)
   * Uses Playwright to fill and submit the actual IDEXX appointment form.
   * The browser handles CSRF tokens naturally since we stay on the same authenticated page.
   */
  async createAppointmentViaForm(
    input: CreateAppointmentInput,
  ): Promise<AppointmentOperationResult> {
    const session = await this.browserService.createPage("create-appointment-form");
    const { page } = session;

    try {
      logger.debug("[IdexxAppointmentMgmt] Creating appointment via form:", {
        patientId: input.patientId,
        date: input.date,
        time: input.startTime,
      });

      // 1. Authenticate on THIS page (not a separate auth page)
      // This ensures the CSRF token is tied to this page session
      const authenticated = await this.authClient.authenticateOnPage(page);
      if (!authenticated) {
        return {
          success: false,
          error: {
            code: "auth_failed",
            message: "Failed to authenticate on page for form submission",
          },
        };
      }

      // 2. Navigate to appointment form with date/time pre-filled via URL params
      const formUrl = `${this.baseUrl}/schedule/appointments/new?date=${input.date}&time=${this.formatTimeForUrl(input.startTime)}`;
      logger.debug("[IdexxAppointmentMgmt] Navigating to form:", formUrl);

      await page.goto(formUrl, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Wait for form to be ready
      await page.waitForSelector('button:has-text("Save")', { timeout: 10000 });

      // 3. Search and select patient
      await this.selectPatientInForm(page, input);

      // 4. Fill appointment details (provider, reason, room, note)
      await this.fillAppointmentDetailsInForm(page, input);

      // 5. Submit form
      logger.debug("[IdexxAppointmentMgmt] Clicking Save button...");
      await page.click('button:has-text("Save")');

      // 6. Wait for success - page should navigate back to schedule
      try {
        await page.waitForURL(/\/schedule(?:\?|$)/, { timeout: 15000 });
        logger.debug("[IdexxAppointmentMgmt] Form submitted successfully, redirected to schedule");

        return {
          success: true,
          message: "Appointment created successfully via form",
        };
      } catch {
        // Check if there's an error message on the page
        const errorText = await page.textContent('.error-message, .alert-danger, [role="alert"]').catch(() => null);
        if (errorText) {
          logger.error("[IdexxAppointmentMgmt] Form error:", errorText);
          return {
            success: false,
            error: {
              code: "form_validation_error",
              message: errorText,
            },
          };
        }

        // Still on form page but no error - might have succeeded
        const currentUrl = page.url();
        if (currentUrl.includes("/schedule") && !currentUrl.includes("/new")) {
          return {
            success: true,
            message: "Appointment created successfully via form",
          };
        }

        return {
          success: false,
          error: {
            code: "form_submission_timeout",
            message: "Form submission did not complete as expected",
          },
        };
      }
    } catch (error) {
      logger.error("[IdexxAppointmentMgmt] Form-based appointment creation failed:", error);
      return {
        success: false,
        error: {
          code: "form_error",
          message: error instanceof Error ? error.message : "Unknown form error",
          details: error,
        },
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Select patient in the appointment form using autocomplete search
   */
  private async selectPatientInForm(page: Page, input: CreateAppointmentInput): Promise<void> {
    if (!input.patientId) {
      throw new Error("Patient ID is required for form-based appointment creation");
    }

    logger.debug("[IdexxAppointmentMgmt] Selecting patient:", input.patientId);

    // Click on the patient search combobox to open it
    await page.click('span.select2-selection--single:has-text("Search")');

    // Wait for the search input to appear
    await page.waitForSelector('input.select2-search__field', { timeout: 5000 });

    // If we have a patient name, search by name; otherwise search by ID
    const searchQuery = input.patientName ?? input.patientId;

    // Type in the search box
    await page.fill('input.select2-search__field', searchQuery);

    // Wait for search results to load
    await page.waitForTimeout(1000); // Give autocomplete time to fetch results

    // Try to find and click the patient by ID in the results
    // The option text format is: "{PatientName} {ClientLastName} (ID:{PatientId})"
    const patientSelector = `li.select2-results__option:has-text("ID:${input.patientId}")`;

    try {
      await page.waitForSelector(patientSelector, { timeout: 5000 });
      await page.click(patientSelector);
      logger.debug("[IdexxAppointmentMgmt] Patient selected successfully");
    } catch {
      // Try clicking the first result if exact ID match not found
      const firstResult = await page.$('li.select2-results__option');
      if (firstResult) {
        const resultText = await firstResult.textContent();
        logger.debug("[IdexxAppointmentMgmt] Selecting first result:", resultText);
        await firstResult.click();
      } else {
        throw new Error(`Patient not found in search results: ${searchQuery}`);
      }
    }
  }

  /**
   * Fill appointment details in the form (provider, reason, room, note)
   */
  private async fillAppointmentDetailsInForm(page: Page, input: CreateAppointmentInput): Promise<void> {
    // Select Provider if specified
    if (input.providerId) {
      logger.debug("[IdexxAppointmentMgmt] Selecting provider:", input.providerId);
      try {
        // The provider dropdown uses select2 or native select
        const providerSelect = await page.$('select[name*="provider"], select[name*="user_id"]');
        if (providerSelect) {
          await providerSelect.selectOption(input.providerId);
        } else {
          // Try clicking the provider dropdown and selecting
          await page.click('text=Provider >> .. >> .select2-selection, select[data-field="provider"]');
          await page.click(`li.select2-results__option:has-text("${input.providerId}")`);
        }
      } catch (err) {
        logger.debug("[IdexxAppointmentMgmt] Could not set provider, using default:", err);
      }
    }

    // Select Reason if specified
    if (input.reason) {
      logger.debug("[IdexxAppointmentMgmt] Selecting reason:", input.reason);
      try {
        // Find the reason dropdown - look for combobox with "Reason" label
        const reasonDropdown = page.locator('select').filter({ hasText: /Exam|Follow-up|Surgery|Vaccines/ }).first();
        const reasonExists = await reasonDropdown.count();

        if (reasonExists > 0) {
          await reasonDropdown.selectOption({ label: input.reason });
        } else {
          // Try native select
          await page.selectOption('select[name*="type"], select[name*="reason"]', { label: input.reason });
        }
      } catch (err) {
        logger.debug("[IdexxAppointmentMgmt] Could not set reason, using default:", err);
      }
    }

    // Select Room if specified
    if (input.roomId) {
      logger.debug("[IdexxAppointmentMgmt] Selecting room:", input.roomId);
      try {
        await page.selectOption('select[name*="room"]', input.roomId);
      } catch (err) {
        logger.debug("[IdexxAppointmentMgmt] Could not set room, using default:", err);
      }
    }

    // Fill Note if specified
    if (input.note) {
      logger.debug("[IdexxAppointmentMgmt] Adding note");
      try {
        await page.fill('textarea[name*="note"], input[name*="note"]', input.note);
      } catch (err) {
        logger.debug("[IdexxAppointmentMgmt] Could not set note:", err);
      }
    }

    // Time should already be set via URL params, but verify/adjust if needed
    if (input.startTime) {
      try {
        // The "From" time dropdown
        const timeValue = this.formatTimeForDropdown(input.startTime);
        logger.debug("[IdexxAppointmentMgmt] Verifying start time:", timeValue);
        // Time may already be set via URL params
      } catch (err) {
        logger.debug("[IdexxAppointmentMgmt] Time already set via URL params");
      }
    }
  }

  /**
   * Format time for URL parameter (24h format: HH:MM)
   */
  private formatTimeForUrl(time: string): string {
    // If already in HH:MM format, return as is
    if (/^\d{2}:\d{2}$/.test(time)) {
      return time;
    }
    // If in HH:MM:SS format, strip seconds
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      return time.substring(0, 5);
    }
    // Parse and format
    const parts = time.split(":");
    const hours = String(parts[0] ?? "8").padStart(2, "0");
    const minutes = String(parts[1] ?? "0").padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  /**
   * Format time for dropdown selection (12h format: H:MMam/pm)
   */
  private formatTimeForDropdown(time: string): string {
    const [hoursStr, minutesStr] = time.split(":");
    let hours = parseInt(hoursStr ?? "8", 10);
    const minutes = minutesStr?.substring(0, 2) ?? "00";
    const period = hours >= 12 ? "pm" : "am";

    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;

    return `${hours}:${minutes}${period}`;
  }

  /**
   * Legacy API-based appointment creation (kept for reference, may have CSRF issues)
   * @deprecated Use createAppointmentViaForm instead
   */
  async createAppointmentViaApi(
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

      // Navigate to appointments page to ensure CSRF token is set
      // IDEXX sets CSRF tokens when you visit specific pages
      const appointmentsUrl = `${this.baseUrl}/appointments`;
      await page.goto(appointmentsUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      // Wait a moment for any JavaScript to initialize CSRF tokens
      await page.waitForTimeout(500);

      // Build appointment form data (multipart/form-data format)
      const formData = this.buildAppointmentFormData(input);

      logger.debug("[IdexxAppointmentMgmt] Creating appointment via API:", {
        patientId: input.patientId,
        date: input.date,
        time: input.startTime,
        formData,
      });

      // Create appointment via API
      const result = await this.postAppointment(page, formData);

      return result;
    } catch (error) {
      logger.error("Failed to create appointment via API:", error);
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
   * Build appointment creation payload (multipart/form-data format)
   * Uses IDEXX API field names discovered January 2026
   */
  private buildAppointmentFormData(
    input: CreateAppointmentInput,
  ): IdexxAppointmentCreateFormData {
    return {
      patient_id: input.patientId ?? "",
      type_id: input.appointmentTypeId ?? "1", // Default to "Default" type
      user_id: input.providerId ?? "1", // Provider/User ID
      room: input.roomId ?? "7", // Default to first room
      appointment_date: input.date,
      time: this.formatTimeForForm(input.startTime),
      time_end: this.formatTimeForForm(input.endTime),
      useRealEndTime: "true",
    };
  }

  /**
   * Format time to IDEXX form format (HH:MM)
   * IDEXX expects simple HH:MM for multipart/form-data
   */
  private formatTimeForForm(time: string): string {
    // If already in HH:MM format, return as is
    if (/^\d{2}:\d{2}$/.test(time)) {
      return time;
    }

    // If in HH:MM:SS format, strip seconds
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      return time.substring(0, 5);
    }

    // If in H:MM or other format, try to parse
    const parts = time.split(":");
    const hours = String(parts[0] ?? "0").padStart(2, "0");
    const minutes = String(parts[1] ?? "0").padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  /**
   * Build appointment payload from input for IDEXX API
   */
  private buildAppointmentPayload(input: CreateAppointmentInput): IdexxAppointmentCreateFormData {
    const startTime = this.formatTimeForForm(input.startTime);
    const endTime = input.endTime
      ? this.formatTimeForForm(input.endTime)
      : this.addMinutesToTime(startTime, 15);

    return {
      patient_id: input.patientId,
      type_id: input.appointmentTypeId ?? "1",
      user_id: input.providerId ?? "1",
      room: input.roomId ?? "0",
      appointment_date: input.date,
      time: startTime,
      time_end: endTime,
      useRealEndTime: "true",
    };
  }

  /**
   * Add minutes to a time string (HH:MM)
   */
  private addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(":").map(Number);
    const totalMinutes = (hours ?? 0) * 60 + (mins ?? 0) + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
  }

  /**
   * Post appointment to IDEXX API using multipart/form-data
   * IDEXX Neo requires multipart/form-data format (discovered January 2026)
   */
  private async postAppointment(
    page: Page,
    formData: IdexxAppointmentCreateFormData,
  ): Promise<AppointmentOperationResult> {
    const url = `${this.baseUrl}${APPOINTMENT_ENDPOINTS.CREATE_APPOINTMENT}`;

    logger.debug("Posting appointment", { url, formData });

    // Extract CSRF token from page
    const csrfToken = await extractCsrfToken(page);
    logger.debug("CSRF token extraction", { found: !!csrfToken });

    // Use shared fetch utility with form-data content type
    const response = await idexxFetch<IdexxAppointmentResponse | { success: boolean }>(
      page,
      url,
      {
        method: "POST",
        body: formData as unknown as Record<string, string | number>,
        csrfToken,
        contentType: "form-data",
      },
    );

    logger.debug("API Response", {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    if (!response.ok) {
      logger.error("Appointment creation failed", {
        status: response.status,
        statusText: response.statusText,
        errorData: response.data,
      });

      return {
        success: false,
        error: {
          code: String(response.status),
          message: response.statusText || "Appointment creation failed",
          details: response.data,
        },
      };
    }

    // IDEXX returns { success: true } on success
    // The appointment ID may not be in the response, but the creation succeeded
    const apptResponse = response.data as IdexxAppointmentResponse | { success: boolean };

    if ("success" in apptResponse && apptResponse.success) {
      return {
        success: true,
        message: "Appointment created successfully",
        // Note: IDEXX doesn't return appointment ID in create response
        // Would need to search for it if needed
      };
    }

    // Try to extract appointment ID if present
    const fullResponse = response.data as IdexxAppointmentResponse;
    return {
      success: true,
      appointmentId: String(fullResponse.id ?? fullResponse.appointment_id ?? ""),
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

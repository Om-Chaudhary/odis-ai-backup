import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { checkCaseDischargeReadiness } from "~/lib/utils/discharge-readiness";
import type { BackendCase } from "~/types/dashboard";
import { getClinicByUserId } from "~/lib/clinics/utils";
import { normalizeEmail, normalizeToE164 } from "~/lib/utils/phone";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const caseSchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
  visibility: z.enum(["public", "private"]).nullable().optional(),
  type: z
    .enum(["checkup", "emergency", "surgery", "follow_up"])
    .nullable()
    .optional(),
  status: z
    .enum(["draft", "ongoing", "completed", "reviewed"])
    .nullable()
    .optional(),
  scheduled_at: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  external_id: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});

export const casesRouter = createTRPCRouter({
  /**
   * List current user's cases for a specific date with pagination
   */
  listMyCasesToday: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(5).max(50).default(10),
        date: z.string().optional(), // Single day (YYYY-MM-DD)
        startDate: z.string().optional(), // Range start (YYYY-MM-DD)
        endDate: z.string().optional(), // Range end (YYYY-MM-DD)
        readinessFilter: z
          .enum(["all", "ready_for_discharge", "not_ready"])
          .optional()
          .default("all"),
        fetchAll: z.boolean().optional().default(false), // Fetch all cases (no pagination)
      }),
    )
    .query(async ({ ctx, input }) => {
      // Determine date range: use startDate/endDate if provided, otherwise use single date
      // If no date parameters provided at all, search all time (used when search is active)
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      const hasDateFilter = !!(input.startDate ?? input.endDate ?? input.date);

      if (input.startDate && input.endDate) {
        // Date range mode
        startDate = new Date(input.startDate);
        startDate.setUTCHours(0, 0, 0, 0);
        endDate = new Date(input.endDate);
        endDate.setUTCHours(23, 59, 59, 999);
      } else if (input.date) {
        // Single date mode (backward compatible)
        const selectedDate = new Date(input.date);
        selectedDate.setUTCHours(0, 0, 0, 0);
        endDate = new Date(selectedDate);
        endDate.setUTCHours(23, 59, 59, 999);
        startDate = selectedDate;
      }
      // else: no date filter = search all time (startDate and endDate remain null)

      // Get total count - filter by scheduled_at (with created_at fallback when scheduled_at is null)
      // We need to count cases where:
      // 1. scheduled_at is in range, OR
      // 2. scheduled_at is null AND created_at is in range
      let count: number | null = null;

      if (hasDateFilter && startDate && endDate) {
        const startIso = startDate.toISOString();
        const endIso = endDate.toISOString();

        // Use .or() to implement COALESCE(scheduled_at, created_at) logic
        const { count: filteredCount } = await ctx.supabase
          .from("cases")
          .select("id", { count: "exact", head: true })
          .eq("user_id", ctx.user.id)
          .or(
            `and(scheduled_at.gte.${startIso},scheduled_at.lte.${endIso}),and(scheduled_at.is.null,created_at.gte.${startIso},created_at.lte.${endIso})`,
          );
        count = filteredCount;
      } else {
        // No date filter - count all cases
        const { count: totalCount } = await ctx.supabase
          .from("cases")
          .select("id", { count: "exact", head: true })
          .eq("user_id", ctx.user.id);
        count = totalCount;
      }

      // Calculate pagination range
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;

      // Get paginated data with all relations
      let dataQuery = ctx.supabase
        .from("cases")
        .select(
          `
          id,
          status,
          source,
          type,
          created_at,
          scheduled_at,
          metadata,
          patients (
            id,
            name,
            species,
            breed,
            owner_name,
            owner_email,
            owner_phone
          ),
          transcriptions (
            id,
            transcript
          ),
          soap_notes (
            id,
            subjective,
            objective,
            assessment,
            plan
          ),
          discharge_summaries (
            id,
            content,
            created_at
          ),
          scheduled_discharge_calls (
            id,
            status,
            scheduled_for,
            ended_at,
            ended_reason,
            vapi_call_id,
            transcript,
            recording_url,
            duration_seconds,
            created_at
          ),
          scheduled_discharge_emails (
            id,
            status,
            scheduled_for,
            sent_at,
            created_at
          )
        `,
        )
        .eq("user_id", ctx.user.id);

      // Apply date filter by scheduled_at (with created_at fallback when scheduled_at is null)
      // Cases are shown on the day they are scheduled for, or created_at if not scheduled
      if (hasDateFilter && startDate && endDate) {
        const startIso = startDate.toISOString();
        const endIso = endDate.toISOString();

        // Use .or() to implement COALESCE(scheduled_at, created_at) logic
        dataQuery = dataQuery.or(
          `and(scheduled_at.gte.${startIso},scheduled_at.lte.${endIso}),and(scheduled_at.is.null,created_at.gte.${startIso},created_at.lte.${endIso})`,
        );
      }

      // Execute query - skip pagination if fetchAll is true
      let data;
      let error;
      if (input.fetchAll) {
        const result = await dataQuery.order("scheduled_at", {
          ascending: false,
          nullsFirst: false,
        });
        data = result.data;
        error = result.error;
      } else {
        const result = await dataQuery
          .order("scheduled_at", { ascending: false, nullsFirst: false })
          .range(from, to);
        data = result.data;
        error = result.error;
      }

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch cases",
          cause: error,
        });
      }

      // Fetch user settings for test mode
      const { data: userSettings } = await ctx.supabase
        .from("users")
        .select("test_mode_enabled, test_contact_email, test_contact_phone")
        .eq("id", ctx.user.id)
        .single();

      const testModeEnabled = userSettings?.test_mode_enabled ?? false;
      const testContactEmail = userSettings?.test_contact_email ?? null;
      const testContactPhone = userSettings?.test_contact_phone ?? null;

      // Apply readiness filtering if requested
      let filteredCases = data ?? [];
      const userEmail = ctx.user.email;

      if (input.readinessFilter !== "all" && filteredCases.length > 0) {
        filteredCases = filteredCases.filter((caseData) => {
          // Type assertion: the query returns data compatible with BackendCase structure
          // The query may not include all BackendCase fields, but has the fields needed for readiness check
          const readiness = checkCaseDischargeReadiness(
            caseData as unknown as BackendCase,
            userEmail,
            testModeEnabled,
            testContactEmail,
            testContactPhone,
          );
          if (input.readinessFilter === "ready_for_discharge") {
            return readiness.isReady;
          }
          if (input.readinessFilter === "not_ready") {
            return !readiness.isReady;
          }
          return true;
        });
      }

      // Sort cases: no discharge attempts first, then by readiness, then by date
      const sortedCases = filteredCases.sort((a, b) => {
        // Check if cases have any discharge attempts
        const aHasDischarge =
          (a.scheduled_discharge_calls?.length ?? 0) > 0 ||
          (a.scheduled_discharge_emails?.length ?? 0) > 0;
        const bHasDischarge =
          (b.scheduled_discharge_calls?.length ?? 0) > 0 ||
          (b.scheduled_discharge_emails?.length ?? 0) > 0;

        // Primary sort: cases without discharge attempts first
        if (!aHasDischarge && bHasDischarge) return -1;
        if (aHasDischarge && !bHasDischarge) return 1;

        const aReadiness = checkCaseDischargeReadiness(
          a as unknown as BackendCase,
          userEmail,
          testModeEnabled,
          testContactEmail,
          testContactPhone,
        );
        const bReadiness = checkCaseDischargeReadiness(
          b as unknown as BackendCase,
          userEmail,
          testModeEnabled,
          testContactEmail,
          testContactPhone,
        );

        // Secondary sort: ready cases first
        if (aReadiness.isReady && !bReadiness.isReady) return -1;
        if (!aReadiness.isReady && bReadiness.isReady) return 1;

        // Tertiary sort: by scheduled_at (with created_at fallback), newest first
        const aDate = a.scheduled_at ?? a.created_at;
        const bDate = b.scheduled_at ?? b.created_at;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      // When fetchAll is true, use the actual data length for pagination info
      const totalCases = input.fetchAll ? sortedCases.length : (count ?? 0);

      return {
        cases: sortedCases,
        pagination: {
          page: input.fetchAll ? 1 : input.page,
          pageSize: input.fetchAll ? totalCases : input.pageSize,
          total: totalCases,
          totalPages: input.fetchAll
            ? 1
            : Math.ceil(totalCases / input.pageSize),
        },
        date: startDate
          ? startDate.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0], // Return start date in YYYY-MM-DD format, or today if no filter
        userEmail: ctx.user.email, // Include user email for transform layer
        testModeSettings: {
          enabled: testModeEnabled,
          testContactEmail,
          testContactPhone,
        },
      };
    }),

  /**
   * Get the most recent date that has at least one case for the current user
   * Used for auto-navigation on initial page load
   * Uses scheduled_at with fallback to created_at when scheduled_at is null
   */
  getMostRecentCaseDate: protectedProcedure.query(async ({ ctx }) => {
    // Query to find the most recent case by scheduled_at (with created_at fallback)
    // We need both fields to determine the effective date
    const { data, error } = await ctx.supabase
      .from("cases")
      .select("scheduled_at, created_at")
      .eq("user_id", ctx.user.id)
      .order("scheduled_at", { ascending: false, nullsFirst: false })
      .limit(10); // Get a few cases to find the most recent by effective date

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch most recent case date",
        cause: error,
      });
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Find the case with the most recent effective date (scheduled_at ?? created_at)
    let mostRecentDate: Date | null = null;
    for (const caseData of data) {
      const effectiveDate = caseData.scheduled_at ?? caseData.created_at;
      if (effectiveDate) {
        const date = new Date(effectiveDate);
        if (!mostRecentDate || date > mostRecentDate) {
          mostRecentDate = date;
        }
      }
    }

    if (!mostRecentDate) {
      return null;
    }

    return mostRecentDate.toISOString().split("T")[0] ?? null;
  }),

  /**
   * Get single case with all related data (user's own cases only)
   */
  getCaseDetail: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // First check if case exists and belongs to user
      const { data: caseCheck, error: caseCheckError } = await ctx.supabase
        .from("cases")
        .select("id, user_id")
        .eq("id", input.id)
        .single();

      if (caseCheckError ?? !caseCheck) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
          cause: caseCheckError,
        });
      }

      // Verify ownership
      if (caseCheck.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this case",
        });
      }

      // Now fetch full case details with all relations (using left joins)
      // Note: Supabase doesn't support ordering in nested selects, so we'll sort in JS
      const { data, error } = await ctx.supabase
        .from("cases")
        .select(
          `
          id, status, type, visibility, created_at, updated_at, scheduled_at,
          source, external_id, metadata,
          patients (
            id, name, species, breed,
            owner_name, owner_email, owner_phone,
            date_of_birth, sex, weight_kg
          ),
          transcriptions (id, transcript, created_at),
          soap_notes (id, subjective, objective, assessment, plan, created_at),
          discharge_summaries (id, content, created_at),
          vital_signs (
            id, temperature, temperature_unit, pulse, respiration,
            weight, weight_unit, systolic, diastolic, notes,
            measured_at, source, created_at
          ),
          scheduled_discharge_calls (
            id, status, scheduled_for, ended_at, ended_reason, started_at,
            vapi_call_id, transcript, transcript_messages, call_analysis,
            summary, success_evaluation, structured_data, user_sentiment,
            recording_url, stereo_recording_url, duration_seconds, cost, created_at
          ),
          scheduled_discharge_emails (
            id, status, scheduled_for, sent_at, created_at
          )
        `,
        )
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch case details",
          cause: error,
        });
      }

      // Sort related data by date (newest first)
      if (data) {
        if (Array.isArray(data.transcriptions)) {
          data.transcriptions.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
        }
        if (Array.isArray(data.soap_notes)) {
          data.soap_notes.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
        }
        if (Array.isArray(data.discharge_summaries)) {
          data.discharge_summaries.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
        }
        if (Array.isArray(data.scheduled_discharge_calls)) {
          data.scheduled_discharge_calls.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
        }
        if (Array.isArray(data.scheduled_discharge_emails)) {
          data.scheduled_discharge_emails.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
        }
      }

      return data;
    }),

  /**
   * Update patient information (any field)
   */
  updatePatientInfo: protectedProcedure
    .input(
      z.object({
        patientId: z.string().uuid(),
        name: z.string().optional(),
        species: z.string().optional(),
        breed: z.string().optional(),
        ownerName: z.string().optional(),
        ownerEmail: z.string().email().optional().or(z.literal("")),
        ownerPhone: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Build update object only with defined fields
      const updateData: Record<string, string | null> = {};

      if (input.name !== undefined) updateData.name = input.name;
      if (input.species !== undefined) updateData.species = input.species;
      if (input.breed !== undefined) updateData.breed = input.breed;
      if (input.ownerName !== undefined) {
        updateData.owner_name = input.ownerName;
      }
      if (input.ownerEmail !== undefined) {
        updateData.owner_email = input.ownerEmail ?? null; // Empty string becomes null
      }
      if (input.ownerPhone !== undefined) {
        updateData.owner_phone = input.ownerPhone;
      }

      // Early return if no updates
      if (Object.keys(updateData).length === 0) {
        return { success: true };
      }

      const { error } = await ctx.supabase
        .from("patients")
        .update(updateData)
        .eq("id", input.patientId)
        .eq("user_id", ctx.user.id); // Security: only update own patients

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update patient information",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Trigger discharge email/call with flexible requirements
   */
  triggerDischarge: protectedProcedure
    .input(
      z.object({
        caseId: z.string().uuid(),
        patientId: z.string().uuid(),
        patientData: z.object({
          name: z.string().optional(),
          species: z.string().optional(),
          breed: z.string().optional(),
          ownerName: z.string().optional(),
          ownerEmail: z.string().email().optional().or(z.literal("")),
          ownerPhone: z.string().optional(),
        }),
        dischargeType: z.enum(["email", "call", "both"]),
        scheduledAt: z.string().datetime().optional(), // ISO 8601 datetime string
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const warnings: string[] = [];

      // Normalize phone and email to proper formats before any processing
      // Phone: E.164 format (+1XXXXXXXXXX for US numbers)
      // Email: lowercase, trimmed
      const normalizedPhone = input.patientData.ownerPhone
        ? normalizeToE164(input.patientData.ownerPhone)
        : undefined;
      const normalizedEmail =
        input.patientData.ownerEmail !== undefined &&
        input.patientData.ownerEmail !== ""
          ? normalizeEmail(input.patientData.ownerEmail)
          : input.patientData.ownerEmail; // preserve empty string for clearing

      // Step 1: Update patient record with any provided data
      const updateData: Record<string, string | null> = {};
      if (input.patientData.name) {
        updateData.name = input.patientData.name;
      }
      if (input.patientData.species) {
        updateData.species = input.patientData.species;
      }
      if (input.patientData.breed) {
        updateData.breed = input.patientData.breed;
      }
      if (input.patientData.ownerName) {
        updateData.owner_name = input.patientData.ownerName;
      }
      if (input.patientData.ownerEmail !== undefined) {
        // Allow clearing the email by converting empty string to null
        // Use normalized email for proper format
        updateData.owner_email = normalizedEmail ?? null;
      }
      if (normalizedPhone) {
        // Use normalized phone in E.164 format
        updateData.owner_phone = normalizedPhone;
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await ctx.supabase
          .from("patients")
          .update(updateData)
          .eq("id", input.patientId)
          .eq("user_id", ctx.user.id);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update patient information",
            cause: error,
          });
        }
      }

      // Step 2: Build orchestration steps
      // Note: User settings (clinic_name, clinic_phone) are retrieved by the orchestrator
      // if needed, so we don't need to fetch them here
      // Always extract entities fresh before generating summary to ensure up-to-date data
      const orchestrationSteps: Record<string, unknown> = {
        extractEntities: true, // Always run fresh entity extraction
        generateSummary: true,
        prepareEmail: false,
        scheduleEmail: false,
        scheduleCall: false,
      };

      // Parse scheduledAt if provided, otherwise use user's default override or system defaults
      // Always use server time to avoid timezone and clock drift issues
      const serverNow = new Date();
      let scheduledFor: Date | undefined;

      if (input.scheduledAt) {
        const clientScheduledTime = new Date(input.scheduledAt);
        // Validate that the scheduled time is in the future (using server time)
        if (clientScheduledTime <= serverNow) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Scheduled time must be in the future",
          });
        }
        scheduledFor = clientScheduledTime;
      }
      // If not provided, the orchestrator/service will use user's default override or system defaults

      // Handle email discharge
      if (input.dischargeType === "email" || input.dischargeType === "both") {
        if (normalizedEmail) {
          orchestrationSteps.prepareEmail = true;
          orchestrationSteps.scheduleEmail = {
            recipientEmail: normalizedEmail,
            recipientName: input.patientData.ownerName ?? "Pet Owner",
            scheduledFor,
          };
        } else {
          warnings.push("Email skipped - no email address provided");
        }
      }

      // Handle call discharge
      if (input.dischargeType === "call" || input.dischargeType === "both") {
        if (normalizedPhone) {
          orchestrationSteps.scheduleCall = {
            phoneNumber: normalizedPhone,
            scheduledFor,
          };
        } else {
          warnings.push("Call skipped - no phone number provided");
        }
      }

      // Step 4: Call discharge orchestrator via internal API
      try {
        const session = await ctx.supabase.auth.getSession();
        const token = session.data.session?.access_token;

        // Use absolute URL for server-side fetch (required for Next.js server components)
        // In development, use localhost; in production, use the configured site URL or default to production
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL ??
          (process.env.NODE_ENV === "development"
            ? "http://localhost:3000"
            : "https://odisai.net");

        console.log("[triggerDischarge] Calling orchestrator", {
          baseUrl,
          caseId: input.caseId,
          hasToken: !!token,
        });

        const response = await fetch(`${baseUrl}/api/discharge/orchestrate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            input: {
              existingCase: { caseId: input.caseId },
            },
            steps: orchestrationSteps,
          }),
        });

        console.log("[triggerDischarge] Response status:", response.status);

        const result = await response.json().catch(() => ({}));

        // Handle partial success: if the orchestrator returns 500 but critical steps succeeded
        if (!response.ok) {
          console.error(
            "[triggerDischarge] Error response:",
            JSON.stringify(result, null, 2),
          );

          // Check if the intended actions actually succeeded despite the error
          const intendedCall =
            input.dischargeType === "call" || input.dischargeType === "both";
          const intendedEmail =
            input.dischargeType === "email" || input.dischargeType === "both";

          const callSucceeded = Boolean(result.data?.call?.callId);
          const emailSucceeded = Boolean(result.data?.emailSchedule?.emailId);

          // If the intended actions succeeded, treat as partial success
          const criticalActionSucceeded =
            (intendedCall && callSucceeded) ||
            (intendedEmail && emailSucceeded);

          if (criticalActionSucceeded) {
            console.log(
              "[triggerDischarge] Partial success - critical actions completed despite orchestrator error",
              {
                callSucceeded: !!callSucceeded,
                emailSucceeded: !!emailSucceeded,
                failedSteps: result.data?.failedSteps,
              },
            );

            // Add failed steps as warnings
            if (
              result.data?.failedSteps &&
              result.data.failedSteps.length > 0
            ) {
              warnings.push(
                `Some optional steps failed: ${(
                  result.data.failedSteps as string[]
                ).join(", ")}`,
              );
            }

            return {
              success: true,
              warnings,
              data: result.data,
              partialSuccess: true, // Flag to indicate not all steps succeeded
            };
          }

          // Critical actions failed - throw error
          throw new Error(
            result.error ??
              `HTTP ${response.status}: Failed to trigger discharge`,
          );
        }

        return {
          success: true,
          warnings,
          data: result.data,
        };
      } catch (error) {
        console.error("[triggerDischarge] Exception:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to trigger discharge",
        });
      }
    }),

  /**
   * Get user's VAPI discharge settings
   * Enriches with clinic table data when available, falls back to user table for backward compatibility
   */
  getDischargeSettings: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("users")
      .select(
        "clinic_name, clinic_phone, clinic_email, emergency_phone, first_name, last_name, test_mode_enabled, test_contact_name, test_contact_email, test_contact_phone, voicemail_detection_enabled, voicemail_hangup_on_detection, voicemail_message, default_schedule_delay_minutes, preferred_email_start_time, preferred_email_end_time, preferred_call_start_time, preferred_call_end_time, email_delay_days, call_delay_days, max_call_retries, batch_include_idexx_notes, batch_include_manual_transcriptions",
      )
      .eq("id", ctx.user.id)
      .single();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch discharge settings",
        cause: error,
      });
    }

    // Get clinic data from clinic table (preferred) with fallback to user table
    const clinic = await getClinicByUserId(ctx.user.id, ctx.supabase);
    const clinicName = clinic?.name ?? data?.clinic_name ?? "";
    const clinicPhone = clinic?.phone ?? data?.clinic_phone ?? "";
    const clinicEmail = clinic?.email ?? data?.clinic_email ?? "";

    // Build vet name from first and last name
    const vetName =
      data?.first_name && data?.last_name
        ? `${data.first_name} ${data.last_name}`
        : "";

    // Convert TIME columns to HH:mm format for frontend
    const formatTime = (time: string | null): string | null => {
      if (!time) return null;
      // TIME columns come as "HH:MM:SS", extract "HH:MM"
      return time.substring(0, 5);
    };

    return {
      clinicName,
      clinicPhone,
      clinicEmail,
      emergencyPhone: data?.emergency_phone ?? clinicPhone ?? "",
      vetName,
      testModeEnabled: data?.test_mode_enabled ?? false,
      testContactName: data?.test_contact_name ?? "",
      testContactEmail: data?.test_contact_email ?? "",
      testContactPhone: data?.test_contact_phone ?? "",
      voicemailDetectionEnabled: data?.voicemail_detection_enabled ?? false,
      voicemailHangupOnDetection: data?.voicemail_hangup_on_detection ?? false,
      voicemailMessage: data?.voicemail_message ?? null,
      defaultScheduleDelayMinutes: data?.default_schedule_delay_minutes ?? null,
      // Email branding settings from clinic table
      primaryColor: clinic?.primary_color ?? "#2563EB",
      logoUrl: clinic?.logo_url ?? null,
      emailHeaderText: clinic?.email_header_text ?? null,
      emailFooterText: clinic?.email_footer_text ?? null,
      // Outbound discharge scheduling settings
      preferredEmailStartTime:
        formatTime(data?.preferred_email_start_time) ?? "09:00",
      preferredEmailEndTime:
        formatTime(data?.preferred_email_end_time) ?? "12:00",
      preferredCallStartTime:
        formatTime(data?.preferred_call_start_time) ?? "14:00",
      preferredCallEndTime:
        formatTime(data?.preferred_call_end_time) ?? "17:00",
      emailDelayDays: data?.email_delay_days ?? 1,
      callDelayDays: data?.call_delay_days ?? 2,
      maxCallRetries: data?.max_call_retries ?? 3,
      // Batch discharge preferences
      batchIncludeIdexxNotes: data?.batch_include_idexx_notes ?? true,
      batchIncludeManualTranscriptions:
        data?.batch_include_manual_transcriptions ?? true,
      // VAPI configuration - inbound calls
      inboundPhoneNumberId: clinic?.inbound_phone_number_id ?? null,
      inboundAssistantId: clinic?.inbound_assistant_id ?? null,
      // VAPI configuration - outbound calls
      outboundPhoneNumberId: clinic?.phone_number_id ?? null,
      outboundAssistantId: clinic?.outbound_assistant_id ?? null,
    };
  }),

  /**
   * Update user's VAPI discharge settings
   */
  updateDischargeSettings: protectedProcedure
    .input(
      z.object({
        clinicName: z.string().optional(),
        clinicPhone: z.string().optional(),
        emergencyPhone: z.string().optional(),
        clinicEmail: z.string().email().optional(),
        testModeEnabled: z.boolean().optional(),
        testContactName: z.string().optional(),
        testContactEmail: z.string().optional(),
        testContactPhone: z.string().optional(),
        voicemailDetectionEnabled: z.boolean().optional(),
        voicemailHangupOnDetection: z.boolean().optional(),
        voicemailMessage: z.string().nullable().optional(),
        defaultScheduleDelayMinutes: z
          .number()
          .int()
          .min(0)
          .nullable()
          .optional(),
        // Email branding settings
        primaryColor: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format")
          .optional(),
        logoUrl: z
          .union([z.string().url(), z.literal(""), z.null()])
          .optional(),
        emailHeaderText: z.string().nullable().optional(),
        emailFooterText: z.string().nullable().optional(),
        // Outbound discharge scheduling settings
        preferredEmailStartTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .nullable()
          .optional(),
        preferredEmailEndTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .nullable()
          .optional(),
        preferredCallStartTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .nullable()
          .optional(),
        preferredCallEndTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .nullable()
          .optional(),
        emailDelayDays: z.number().int().min(0).max(30).nullable().optional(),
        callDelayDays: z.number().int().min(0).max(30).nullable().optional(),
        maxCallRetries: z.number().int().min(0).max(10).nullable().optional(),
        // Batch discharge preferences
        batchIncludeIdexxNotes: z.boolean().optional(),
        batchIncludeManualTranscriptions: z.boolean().optional(),
        // VAPI configuration - inbound calls
        inboundPhoneNumberId: z.string().nullable().optional(),
        inboundAssistantId: z.string().nullable().optional(),
        // VAPI configuration - outbound calls
        outboundPhoneNumberId: z.string().nullable().optional(),
        outboundAssistantId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Build update object only with defined fields for users table
      const userUpdateData: Record<string, string | boolean | number | null> =
        {};

      if (input.clinicName !== undefined) {
        userUpdateData.clinic_name = input.clinicName;
      }
      if (input.clinicPhone !== undefined) {
        userUpdateData.clinic_phone = input.clinicPhone;
      }
      if (input.clinicEmail !== undefined) {
        userUpdateData.clinic_email = input.clinicEmail;
      }
      if (input.emergencyPhone !== undefined) {
        userUpdateData.emergency_phone = input.emergencyPhone;
      }
      if (input.testModeEnabled !== undefined) {
        userUpdateData.test_mode_enabled = input.testModeEnabled;
      }
      if (input.testContactName !== undefined) {
        userUpdateData.test_contact_name = input.testContactName;
      }
      if (input.testContactEmail !== undefined) {
        userUpdateData.test_contact_email = input.testContactEmail;
      }
      if (input.testContactPhone !== undefined) {
        userUpdateData.test_contact_phone = input.testContactPhone;
      }
      if (input.voicemailDetectionEnabled !== undefined) {
        userUpdateData.voicemail_detection_enabled =
          input.voicemailDetectionEnabled;
      }
      if (input.voicemailHangupOnDetection !== undefined) {
        userUpdateData.voicemail_hangup_on_detection =
          input.voicemailHangupOnDetection;
      }
      if (input.voicemailMessage !== undefined) {
        userUpdateData.voicemail_message = input.voicemailMessage;
      }
      if (input.defaultScheduleDelayMinutes !== undefined) {
        userUpdateData.default_schedule_delay_minutes =
          input.defaultScheduleDelayMinutes;
      }
      // Outbound discharge scheduling settings
      if (input.preferredEmailStartTime !== undefined) {
        userUpdateData.preferred_email_start_time =
          input.preferredEmailStartTime
            ? `${input.preferredEmailStartTime}:00`
            : null;
      }
      if (input.preferredEmailEndTime !== undefined) {
        userUpdateData.preferred_email_end_time = input.preferredEmailEndTime
          ? `${input.preferredEmailEndTime}:00`
          : null;
      }
      if (input.preferredCallStartTime !== undefined) {
        userUpdateData.preferred_call_start_time = input.preferredCallStartTime
          ? `${input.preferredCallStartTime}:00`
          : null;
      }
      if (input.preferredCallEndTime !== undefined) {
        userUpdateData.preferred_call_end_time = input.preferredCallEndTime
          ? `${input.preferredCallEndTime}:00`
          : null;
      }
      if (input.emailDelayDays !== undefined) {
        userUpdateData.email_delay_days = input.emailDelayDays;
      }
      if (input.callDelayDays !== undefined) {
        userUpdateData.call_delay_days = input.callDelayDays;
      }
      if (input.maxCallRetries !== undefined) {
        userUpdateData.max_call_retries = input.maxCallRetries;
      }
      // Batch discharge preferences
      if (input.batchIncludeIdexxNotes !== undefined) {
        userUpdateData.batch_include_idexx_notes = input.batchIncludeIdexxNotes;
      }
      if (input.batchIncludeManualTranscriptions !== undefined) {
        userUpdateData.batch_include_manual_transcriptions =
          input.batchIncludeManualTranscriptions;
      }

      // Update users table if there are user fields to update
      if (Object.keys(userUpdateData).length > 0) {
        const { error } = await ctx.supabase
          .from("users")
          .update(userUpdateData)
          .eq("id", ctx.user.id);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update discharge settings",
            cause: error,
          });
        }
      }

      // Build update object for clinic branding and VAPI configuration fields
      const clinicUpdateData: Record<string, string | null> = {};

      if (input.primaryColor !== undefined) {
        clinicUpdateData.primary_color = input.primaryColor;
      }
      if (input.logoUrl !== undefined) {
        // Convert empty string to null for database consistency
        clinicUpdateData.logo_url = input.logoUrl === "" ? null : input.logoUrl;
      }
      if (input.emailHeaderText !== undefined) {
        clinicUpdateData.email_header_text = input.emailHeaderText;
      }
      if (input.emailFooterText !== undefined) {
        clinicUpdateData.email_footer_text = input.emailFooterText;
      }
      // VAPI configuration - inbound calls
      if (input.inboundPhoneNumberId !== undefined) {
        clinicUpdateData.inbound_phone_number_id = input.inboundPhoneNumberId;
      }
      if (input.inboundAssistantId !== undefined) {
        clinicUpdateData.inbound_assistant_id = input.inboundAssistantId;
      }
      // VAPI configuration - outbound calls
      if (input.outboundPhoneNumberId !== undefined) {
        clinicUpdateData.phone_number_id = input.outboundPhoneNumberId;
      }
      if (input.outboundAssistantId !== undefined) {
        clinicUpdateData.outbound_assistant_id = input.outboundAssistantId;
      }

      // Update clinic table if there are branding fields to update
      if (Object.keys(clinicUpdateData).length > 0) {
        // Get user's clinic
        const clinic = await getClinicByUserId(ctx.user.id, ctx.supabase);

        if (clinic?.id) {
          const { error: clinicError } = await ctx.supabase
            .from("clinics")
            .update(clinicUpdateData)
            .eq("id", clinic.id);

          if (clinicError) {
            console.error(
              "[updateDischargeSettings] Failed to update clinic branding",
              {
                clinicId: clinic.id,
                error: clinicError,
              },
            );
            // Don't throw error - branding update is optional
            // The user settings were already saved successfully
          }
        } else {
          console.warn(
            "[updateDischargeSettings] No clinic found for user, skipping branding update",
            { userId: ctx.user.id },
          );
        }
      }

      return { success: true };
    }),

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  /**
   * [ADMIN] List all cases with optional filters
   */
  listCases: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z
          .enum(["draft", "ongoing", "completed", "reviewed"])
          .optional(),
        type: z
          .enum(["checkup", "emergency", "surgery", "follow_up"])
          .optional(),
        visibility: z.enum(["public", "private"]).optional(),
        userId: z.string().uuid().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.serviceClient
        .from("cases")
        .select(
          `
          *,
          user:users(id, email, first_name, last_name),
          patient:patients(id, name, species, breed, owner_name)
        `,
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (input.status) {
        query = query.eq("status", input.status);
      }

      if (input.type) {
        query = query.eq("type", input.type);
      }

      if (input.visibility) {
        query = query.eq("visibility", input.visibility);
      }

      if (input.userId) {
        query = query.eq("user_id", input.userId);
      }

      if (input.dateFrom) {
        query = query.gte("created_at", input.dateFrom);
      }

      if (input.dateTo) {
        query = query.lte("created_at", input.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch cases",
          cause: error,
        });
      }

      // Apply search filter if provided
      let filteredData = data;
      if (input.search && data) {
        const searchLower = input.search.toLowerCase();
        filteredData = data.filter((c) => {
          const patientName =
            (c.patient as unknown as { name?: string })?.name?.toLowerCase() ??
            "";
          const ownerName =
            (
              c.patient as unknown as { owner_name?: string }
            )?.owner_name?.toLowerCase() ?? "";
          return (
            patientName.includes(searchLower) ?? ownerName.includes(searchLower)
          );
        });
      }

      return filteredData;
    }),

  /**
   * [ADMIN] Get single case with all related data
   */
  getCase: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("cases")
        .select(
          `
          *,
          user:users(id, email, first_name, last_name),
          patient:patients(*),
          soap_notes(*),
          discharge_summaries(*),
          transcriptions(*)
        `,
        )
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * [ADMIN] Update case (any field)
   */
  updateCase: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: caseSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("cases")
        .update(input.data)
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update case",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Delete case (user can only delete their own cases)
   */
  deleteMyCase: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // First verify the case belongs to the user
      const { data: caseData, error: fetchError } = await ctx.supabase
        .from("cases")
        .select("id, user_id")
        .eq("id", input.id)
        .single();

      if (fetchError ?? !caseData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
          cause: fetchError,
        });
      }

      if (caseData.user_id !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own cases",
        });
      }

      // Delete the case (cascade will handle related records)
      const { error } = await ctx.supabase
        .from("cases")
        .delete()
        .eq("id", input.id)
        .eq("user_id", userId); // Double-check ownership in delete query

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete case",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * [ADMIN] Delete case (hard delete)
   */
  deleteCase: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.serviceClient
        .from("cases")
        .delete()
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete case",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * [ADMIN] Bulk create cases with patients
   * Creates one case + one patient per entry
   */
  bulkCreateCases: adminProcedure
    .input(
      z.array(
        z.object({
          userId: z.string().uuid(),
          patientName: z.string().min(2),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const results = {
        successful: [] as Array<{
          caseId: string;
          patientId: string;
          patientName: string;
        }>,
        failed: [] as Array<{ patientName: string; error: string }>,
      };

      // Process each entry
      for (const entry of input) {
        try {
          // 1. Verify user exists
          const { data: user, error: userError } = await ctx.serviceClient
            .from("users")
            .select("id")
            .eq("id", entry.userId)
            .single();

          if (userError ?? !user) {
            results.failed.push({
              patientName: entry.patientName,
              error: "User not found",
            });
            continue;
          }

          // 2. Create patient
          const { data: patient, error: patientError } = await ctx.serviceClient
            .from("patients")
            .insert({
              name: entry.patientName,
              user_id: entry.userId,
            })
            .select()
            .single();

          if (patientError ?? !patient) {
            results.failed.push({
              patientName: entry.patientName,
              error: `Failed to create patient: ${
                patientError?.message ?? "Unknown error"
              }`,
            });
            continue;
          }

          // 3. Create case with defaults
          const { data: caseData, error: caseError } = await ctx.serviceClient
            .from("cases")
            .insert({
              user_id: entry.userId,
              status: "draft" as const,
              type: "checkup" as const,
              visibility: "private" as const,
            })
            .select()
            .single();

          if (caseError ?? !caseData) {
            // Clean up patient if case creation fails
            await ctx.serviceClient
              .from("patients")
              .delete()
              .eq("id", patient.id);

            results.failed.push({
              patientName: entry.patientName,
              error: `Failed to create case: ${
                caseError?.message ?? "Unknown error"
              }`,
            });
            continue;
          }

          // 4. Link patient to case
          const { error: updateError } = await ctx.serviceClient
            .from("patients")
            .update({ case_id: caseData.id })
            .eq("id", patient.id);

          if (updateError) {
            // Clean up both if linking fails
            await ctx.serviceClient
              .from("cases")
              .delete()
              .eq("id", caseData.id);
            await ctx.serviceClient
              .from("patients")
              .delete()
              .eq("id", patient.id);

            results.failed.push({
              patientName: entry.patientName,
              error: `Failed to link patient to case: ${updateError.message}`,
            });
            continue;
          }

          results.successful.push({
            caseId: caseData.id,
            patientId: patient.id,
            patientName: entry.patientName,
          });
        } catch (error) {
          results.failed.push({
            patientName: entry.patientName,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    }),

  /**
   * [ADMIN] Get case statistics for dashboard
   */
  getCaseStats: adminProcedure.query(async ({ ctx }) => {
    // Total cases
    const { count: totalCases } = await ctx.serviceClient
      .from("cases")
      .select("*", { count: "exact", head: true });

    // Cases by status
    const { data: statusData } = await ctx.serviceClient
      .from("cases")
      .select("status")
      .not("status", "is", null);

    // Cases by type
    const { data: typeData } = await ctx.serviceClient
      .from("cases")
      .select("type")
      .not("type", "is", null);

    const stats = {
      totalCases: totalCases ?? 0,
      byStatus: {
        draft: statusData?.filter((c) => c.status === "draft").length ?? 0,
        ongoing: statusData?.filter((c) => c.status === "ongoing").length ?? 0,
        completed:
          statusData?.filter((c) => c.status === "completed").length ?? 0,
        reviewed:
          statusData?.filter((c) => c.status === "reviewed").length ?? 0,
      },
      byType: {
        checkup: typeData?.filter((c) => c.type === "checkup").length ?? 0,
        emergency: typeData?.filter((c) => c.type === "emergency").length ?? 0,
        surgery: typeData?.filter((c) => c.type === "surgery").length ?? 0,
        follow_up: typeData?.filter((c) => c.type === "follow_up").length ?? 0,
      },
    };

    return stats;
  }),

  /**
   * [ADMIN] Get time series data for dashboard charts
   */
  getTimeSeriesStats: adminProcedure
    .input(
      z.object({
        days: z.number().min(7).max(90).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - input.days);
      const startDate = daysAgo.toISOString();

      // Fetch cases created in the time period
      const { data: casesData } = await ctx.serviceClient
        .from("cases")
        .select("created_at, status")
        .gte("created_at", startDate)
        .order("created_at", { ascending: true });

      // Fetch SOAP notes created in the time period
      const { data: soapNotesData } = await ctx.serviceClient
        .from("soap_notes")
        .select("created_at")
        .gte("created_at", startDate)
        .order("created_at", { ascending: true });

      // Fetch discharge summaries created in the time period
      const { data: dischargeSummariesData } = await ctx.serviceClient
        .from("discharge_summaries")
        .select("created_at")
        .gte("created_at", startDate)
        .order("created_at", { ascending: true });

      // Generate array of dates for the period
      const dateArray: string[] = [];
      for (let i = 0; i < input.days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (input.days - 1 - i));
        dateArray.push(date.toISOString().split("T")[0] ?? "");
      }

      // Helper function to count items by date
      const countByDate = (
        data: Array<{ created_at: string }> | null,
      ): Record<string, number> => {
        const counts: Record<string, number> = {};
        dateArray.forEach((date) => (counts[date] = 0));

        data?.forEach((item) => {
          const date = item.created_at.split("T")[0];
          if (date && counts[date] !== undefined) {
            counts[date]++;
          }
        });

        return counts;
      };

      // Process data
      const casesByDate = countByDate(casesData ?? []);
      const soapNotesByDate = countByDate(soapNotesData ?? []);
      const dischargeSummariesByDate = countByDate(
        dischargeSummariesData ?? [],
      );

      // Count completed cases by date
      const completedCasesByDate: Record<string, number> = {};
      dateArray.forEach((date) => (completedCasesByDate[date] = 0));
      casesData
        ?.filter((c) => c.status === "completed")
        .forEach((item) => {
          const date = (item.created_at as string).split("T")[0];
          if (date && completedCasesByDate[date] !== undefined) {
            completedCasesByDate[date]++;
          }
        });

      // Format for chart consumption
      const chartData = dateArray.map((date) => ({
        date,
        casesCreated: casesByDate[date] ?? 0,
        casesCompleted: completedCasesByDate[date] ?? 0,
        soapNotes: soapNotesByDate[date] ?? 0,
        dischargeSummaries: dischargeSummariesByDate[date] ?? 0,
      }));

      // Calculate totals
      const totals = {
        casesCreated: Object.values(casesByDate).reduce((a, b) => a + b, 0),
        casesCompleted: Object.values(completedCasesByDate).reduce(
          (a, b) => a + b,
          0,
        ),
        soapNotes: Object.values(soapNotesByDate).reduce((a, b) => a + b, 0),
        dischargeSummaries: Object.values(dischargeSummariesByDate).reduce(
          (a, b) => a + b,
          0,
        ),
      };

      return {
        chartData,
        totals,
      };
    }),

  /**
   * Get eligible cases for batch discharge processing
   * Includes:
   * - Cases with discharge summaries
   * - IDEXX Neo cases with consultation_notes in metadata
   * - Manual cases with transcriptions or SOAP notes
   */
  getEligibleCasesForBatch: protectedProcedure.query(async ({ ctx }) => {
    // Get user's batch preferences
    const { data: userSettings } = await ctx.supabase
      .from("users")
      .select("batch_include_idexx_notes, batch_include_manual_transcriptions")
      .eq("id", ctx.user.id)
      .single();

    const includeIdexxNotes = userSettings?.batch_include_idexx_notes ?? true;
    const includeManualTranscriptions =
      userSettings?.batch_include_manual_transcriptions ?? true;

    // Query all cases with related data (not requiring discharge_summaries)
    const { data: cases, error } = await ctx.supabase
      .from("cases")
      .select(
        `
          id,
          source,
          metadata,
          created_at,
          scheduled_at,
          patients!inner (
            id,
            name,
            owner_name,
            owner_email,
            owner_phone
          ),
          discharge_summaries (
            id
          ),
          transcriptions (
            id,
            transcript
          ),
          soap_notes (
            id,
            subjective,
            objective,
            assessment,
            plan
          ),
          scheduled_discharge_emails (
            id,
            status
          ),
          scheduled_discharge_calls (
            id,
            status
          )
        `,
      )
      .eq("user_id", ctx.user.id)
      .order("scheduled_at", { ascending: false, nullsFirst: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch eligible cases",
        cause: error,
      });
    }

    // Filter for eligible cases
    const eligibleCases = [];

    for (const caseData of cases ?? []) {
      // Extract patient data
      const patient = Array.isArray(caseData.patients)
        ? caseData.patients[0]
        : caseData.patients;

      if (!patient) continue;

      // Check if has valid contact info
      const hasEmail = !!patient.owner_email;
      const hasPhone = !!patient.owner_phone;

      if (!hasEmail && !hasPhone) continue;

      // Check if already scheduled
      const hasScheduledEmail = Array.isArray(
        caseData.scheduled_discharge_emails,
      )
        ? caseData.scheduled_discharge_emails.some(
            (e: { status: string }) =>
              e.status === "queued" || e.status === "sent",
          )
        : false;

      const hasScheduledCall = Array.isArray(caseData.scheduled_discharge_calls)
        ? caseData.scheduled_discharge_calls.some((c: { status: string }) =>
            ["queued", "ringing", "in_progress", "completed"].includes(
              c.status,
            ),
          )
        : false;

      // Don't skip - we want to show all cases and let UI filter by status
      // Old behavior: if (hasScheduledEmail || hasScheduledCall) continue;

      // Check for discharge content eligibility
      const hasDischargeSummary = Array.isArray(caseData.discharge_summaries)
        ? caseData.discharge_summaries.length > 0
        : !!caseData.discharge_summaries;

      // Check for IDEXX Neo consultation notes
      const metadata = caseData.metadata as {
        idexx?: { consultation_notes?: string; notes?: string };
      } | null;
      const isIdexxSource =
        caseData.source === "idexx_neo" ||
        caseData.source === "idexx_extension";
      const hasIdexxNotes =
        isIdexxSource &&
        (Boolean(metadata?.idexx?.consultation_notes) ||
          Boolean(metadata?.idexx?.notes));

      // Check for transcriptions
      const transcriptions = caseData.transcriptions as Array<{
        id: string;
        transcript: string | null;
      }> | null;
      const hasTranscription = Array.isArray(transcriptions)
        ? transcriptions.some((t) => t.transcript && t.transcript.length > 50)
        : false;

      // Check for SOAP notes
      const soapNotes = caseData.soap_notes as Array<{
        id: string;
        subjective?: string | null;
        objective?: string | null;
        assessment?: string | null;
        plan?: string | null;
      }> | null;
      const hasSoapNotes = Array.isArray(soapNotes)
        ? soapNotes.some(
            (s) =>
              Boolean(s.subjective) ||
              Boolean(s.objective) ||
              Boolean(s.assessment) ||
              Boolean(s.plan),
          )
        : false;

      // Determine eligibility based on settings and content
      let isEligible = hasDischargeSummary; // Always include if has discharge summary

      // Include IDEXX cases with notes if enabled
      if (includeIdexxNotes && hasIdexxNotes) {
        isEligible = true;
      }

      // Include manual cases with transcriptions/SOAP if enabled
      if (includeManualTranscriptions && (hasTranscription || hasSoapNotes)) {
        isEligible = true;
      }

      if (!isEligible) continue;

      eligibleCases.push({
        id: caseData.id,
        patientId: patient.id,
        patientName: patient.name ?? "Unknown Patient",
        ownerName: patient.owner_name,
        ownerEmail: patient.owner_email,
        ownerPhone: patient.owner_phone,
        source: caseData.source,
        hasEmail,
        hasPhone,
        hasDischargeSummary,
        hasIdexxNotes,
        hasTranscription,
        hasSoapNotes,
        createdAt: caseData.created_at,
        scheduledAt: caseData.scheduled_at,
        // Email/Call status
        emailSent: hasScheduledEmail,
        callSent: hasScheduledCall,
      });
    }

    return eligibleCases;
  }),

  /**
   * Create a new discharge batch
   */
  createDischargeBatch: protectedProcedure
    .input(
      z.object({
        caseIds: z.array(z.string().uuid()),
        emailScheduleTime: z.string().datetime().nullable(),
        callScheduleTime: z.string().datetime().nullable(),
        emailsEnabled: z.boolean().default(true),
        callsEnabled: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create batch record
      const { data: batch, error: batchError } = await ctx.supabase
        .from("discharge_batches")
        .insert({
          user_id: ctx.user.id,
          status: "pending",
          total_cases: input.caseIds.length,
          email_schedule_time: input.emailsEnabled
            ? input.emailScheduleTime
            : null,
          call_schedule_time: input.callsEnabled
            ? input.callScheduleTime
            : null,
          emails_enabled: input.emailsEnabled,
          calls_enabled: input.callsEnabled,
        })
        .select("id")
        .single();

      if (batchError ?? !batch) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create batch",
          cause: batchError,
        });
      }

      // Create batch items for each case
      const batchItems = input.caseIds.map((caseId) => ({
        batch_id: batch.id,
        case_id: caseId,
        status: "pending",
      }));

      const { error: itemsError } = await ctx.supabase
        .from("discharge_batch_items")
        .insert(batchItems);

      if (itemsError) {
        // Rollback batch creation
        await ctx.supabase
          .from("discharge_batches")
          .delete()
          .eq("id", batch.id);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create batch items",
          cause: itemsError,
        });
      }

      return { batchId: batch.id };
    }),

  /**
   * Get batch status and progress
   */
  getBatchStatus: protectedProcedure
    .input(z.object({ batchId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get batch details
      const { data: batch, error: batchError } = await ctx.supabase
        .from("discharge_batches")
        .select(
          `
          *,
          discharge_batch_items (
            id,
            case_id,
            status,
            email_scheduled,
            call_scheduled,
            error_message,
            processed_at
          )
        `,
        )
        .eq("id", input.batchId)
        .eq("user_id", ctx.user.id)
        .single();

      if (batchError ?? !batch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Batch not found",
        });
      }

      // Get case details for items
      const batchItems = batch.discharge_batch_items as Array<{
        case_id: string;
      }>;
      const caseIds = batchItems.map((item) => item.case_id);
      const { data: cases } = await ctx.supabase
        .from("cases")
        .select(
          `
          id,
          patients (
            name
          )
        `,
        )
        .in("id", caseIds);

      // Map patient names to items
      const itemsWithDetails = batchItems.map((item) => {
        const caseData = cases?.find((c) => c.id === item.case_id);
        const patient = Array.isArray(caseData?.patients)
          ? caseData.patients[0]
          : caseData?.patients;

        return {
          ...item,
          patientName: patient?.name ?? "Unknown Patient",
        };
      });

      return {
        ...batch,
        discharge_batch_items: itemsWithDetails,
      };
    }),

  /**
   * Cancel a batch operation
   */
  cancelBatch: protectedProcedure
    .input(z.object({ batchId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("discharge_batches")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", input.batchId)
        .eq("user_id", ctx.user.id)
        .eq("status", "processing"); // Only cancel if still processing

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel batch",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Get recent batch operations
   */
  getRecentBatches: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: batches, error } = await ctx.supabase
        .from("discharge_batches")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch batches",
          cause: error,
        });
      }

      return batches ?? [];
    }),
});

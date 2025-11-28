import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { checkCaseDischargeReadiness } from "~/lib/utils/discharge-readiness";
import type { BackendCase } from "~/types/dashboard";

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
        date: z.string().optional(), // ISO date string (YYYY-MM-DD)
        readinessFilter: z
          .enum(["all", "ready_for_discharge", "not_ready"])
          .optional()
          .default("all"),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Parse date or use today
      const selectedDate = input.date ? new Date(input.date) : new Date();
      selectedDate.setUTCHours(0, 0, 0, 0);

      // Calculate end of day
      const endOfDay = new Date(selectedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      // Get total count - filter cases created on the selected date
      const { count } = await ctx.supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.user.id)
        .gte("created_at", selectedDate.toISOString())
        .lte("created_at", endOfDay.toISOString());

      // Calculate pagination range
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;

      // Get paginated data with all relations
      const { data, error } = await ctx.supabase
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
          patients!inner (
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
        .eq("user_id", ctx.user.id)
        .gte("created_at", selectedDate.toISOString())
        .lte("created_at", endOfDay.toISOString())
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch cases",
          cause: error,
        });
      }

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

      // Sort cases by readiness: ready cases first, then by created_at
      const sortedCases = filteredCases.sort((a, b) => {
        const aReadiness = checkCaseDischargeReadiness(
          a as unknown as BackendCase,
          userEmail,
        );
        const bReadiness = checkCaseDischargeReadiness(
          b as unknown as BackendCase,
          userEmail,
        );

        // Primary sort: ready cases first
        if (aReadiness.isReady && !bReadiness.isReady) return -1;
        if (!aReadiness.isReady && bReadiness.isReady) return 1;

        // Secondary sort: by created_at (newest first)
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      return {
        cases: sortedCases,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / input.pageSize),
        },
        date: selectedDate.toISOString().split("T")[0], // Return date in YYYY-MM-DD format
        userEmail: ctx.user.email, // Include user email for transform layer
      };
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

      if (caseCheckError || !caseCheck) {
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
        updateData.owner_email = input.ownerEmail || null; // Empty string becomes null
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
        updateData.owner_email = input.patientData.ownerEmail || null;
      }
      if (input.patientData.ownerPhone) {
        updateData.owner_phone = input.patientData.ownerPhone;
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
      const orchestrationSteps: Record<string, unknown> = {
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
        if (input.patientData.ownerEmail) {
          orchestrationSteps.prepareEmail = true;
          orchestrationSteps.scheduleEmail = {
            recipientEmail: input.patientData.ownerEmail,
            recipientName: input.patientData.ownerName ?? "Pet Owner",
            scheduledFor,
          };
        } else {
          warnings.push("Email skipped - no email address provided");
        }
      }

      // Handle call discharge
      if (input.dischargeType === "call" || input.dischargeType === "both") {
        if (input.patientData.ownerPhone) {
          orchestrationSteps.scheduleCall = {
            phoneNumber: input.patientData.ownerPhone,
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

          const callSucceeded = result.data?.call?.callId;
          const emailSucceeded = result.data?.emailSchedule?.emailId;

          // If the intended actions succeeded, treat as partial success
          const criticalActionSucceeded =
            (intendedCall && callSucceeded) ??
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
   */
  getDischargeSettings: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("users")
      .select(
        "clinic_name, clinic_phone, clinic_email, emergency_phone, first_name, last_name, test_mode_enabled, test_contact_name, test_contact_email, test_contact_phone, voicemail_detection_enabled, default_schedule_delay_minutes",
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

    // Build vet name from first and last name
    const vetName =
      data?.first_name && data?.last_name
        ? `${data.first_name} ${data.last_name}`
        : "";

    return {
      clinicName: data?.clinic_name ?? "",
      clinicPhone: data?.clinic_phone ?? "",
      clinicEmail: data?.clinic_email ?? "",
      emergencyPhone: data?.emergency_phone ?? data?.clinic_phone ?? "",
      vetName,
      testModeEnabled: data?.test_mode_enabled ?? false,
      testContactName: data?.test_contact_name ?? "",
      testContactEmail: data?.test_contact_email ?? "",
      testContactPhone: data?.test_contact_phone ?? "",
      voicemailDetectionEnabled: data?.voicemail_detection_enabled ?? false,
      defaultScheduleDelayMinutes: data?.default_schedule_delay_minutes ?? null,
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
        defaultScheduleDelayMinutes: z
          .number()
          .int()
          .min(0)
          .nullable()
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Build update object only with defined fields
      const updateData: Record<string, string | boolean | number | null> = {};

      if (input.clinicName !== undefined) {
        updateData.clinic_name = input.clinicName;
      }
      if (input.clinicPhone !== undefined) {
        updateData.clinic_phone = input.clinicPhone;
      }
      if (input.clinicEmail !== undefined) {
        updateData.clinic_email = input.clinicEmail;
      }
      if (input.emergencyPhone !== undefined) {
        updateData.emergency_phone = input.emergencyPhone;
      }
      if (input.testModeEnabled !== undefined) {
        updateData.test_mode_enabled = input.testModeEnabled;
      }
      if (input.testContactName !== undefined) {
        updateData.test_contact_name = input.testContactName;
      }
      if (input.testContactEmail !== undefined) {
        updateData.test_contact_email = input.testContactEmail;
      }
      if (input.testContactPhone !== undefined) {
        updateData.test_contact_phone = input.testContactPhone;
      }
      if (input.voicemailDetectionEnabled !== undefined) {
        updateData.voicemail_detection_enabled =
          input.voicemailDetectionEnabled;
      }
      if (input.defaultScheduleDelayMinutes !== undefined) {
        updateData.default_schedule_delay_minutes =
          input.defaultScheduleDelayMinutes;
      }

      const { error } = await ctx.supabase
        .from("users")
        .update(updateData)
        .eq("id", ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update discharge settings",
          cause: error,
        });
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
            patientName.includes(searchLower) || ownerName.includes(searchLower)
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

      if (fetchError || !caseData) {
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

          if (userError || !user) {
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

          if (patientError || !patient) {
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

          if (caseError || !caseData) {
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
});

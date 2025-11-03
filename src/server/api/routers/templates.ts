import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const soapTemplateSchema = z.object({
  template_id: z.string(),
  template_name: z.string().min(1, "Template name is required"),
  display_name: z.string().min(1, "Display name is required"),
  person_name: z.string().min(1, "Person name is required"),
  icon_name: z.string().min(1, "Icon name is required"),
  is_default: z.boolean().default(false),
  user_id: z.string().uuid().nullable().optional(),

  // SOAP sections (template and prompt pairs)
  subjective_template: z.string().nullable().optional(),
  subjective_prompt: z.string().nullable().optional(),
  objective_template: z.string().nullable().optional(),
  objective_prompt: z.string().nullable().optional(),
  assessment_template: z.string().nullable().optional(),
  assessment_prompt: z.string().nullable().optional(),
  plan_template: z.string().nullable().optional(),
  plan_prompt: z.string().nullable().optional(),
  client_instructions_template: z.string().nullable().optional(),
  client_instructions_prompt: z.string().nullable().optional(),
  system_prompt_addition: z.string().nullable().optional(),
});

const dischargeSummaryTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  content: z.string().min(1, "Template content is required"),
  is_default: z.boolean().default(false),
  user_id: z.string().uuid(),
});

const userSchema = z.object({
  email: z.string().email("Valid email is required"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  role: z.enum(["veterinarian", "vet_tech", "admin", "practice_owner", "client"]),
  clinic_name: z.string().optional(),
  clinic_email: z.string().email().optional(),
  clinic_phone: z.string().optional(),
  license_number: z.string().optional(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const templatesRouter = createTRPCRouter({
  // ==========================================================================
  // SOAP TEMPLATES
  // ==========================================================================

  /**
   * List all SOAP templates (admin only)
   */
  listSoapTemplates: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        userId: z.string().uuid().optional(), // Filter by user
      })
    )
    .query(async ({ ctx, input }) => {
      // Use service client to bypass RLS and get user joins
      let query = ctx.serviceClient
        .from("temp_soap_templates")
        .select("*, user:users(id, email, first_name, last_name)")
        .order("created_at", { ascending: false });

      if (input.search) {
        query = query.or(
          `template_name.ilike.%${input.search}%,display_name.ilike.%${input.search}%`
        );
      }

      if (input.userId) {
        query = query.eq("user_id", input.userId);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch SOAP templates",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Get single SOAP template by ID
   */
  getSoapTemplate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("temp_soap_templates")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SOAP template not found",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Create SOAP template
   */
  createSoapTemplate: adminProcedure
    .input(soapTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("temp_soap_templates")
        .insert(input)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create SOAP template",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Update SOAP template (including reassigning to different user)
   */
  updateSoapTemplate: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: soapTemplateSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("temp_soap_templates")
        .update(input.data)
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update SOAP template",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Delete SOAP template
   */
  deleteSoapTemplate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.serviceClient
        .from("temp_soap_templates")
        .delete()
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete SOAP template",
          cause: error,
        });
      }

      return { success: true };
    }),

  // ==========================================================================
  // DISCHARGE SUMMARY TEMPLATES
  // ==========================================================================

  /**
   * List all discharge summary templates (admin only)
   */
  listDischargeSummaryTemplates: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        userId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.serviceClient
        .from("temp_discharge_summary_templates")
        .select("*, user:users(id, email, first_name, last_name)")
        .order("created_at", { ascending: false });

      if (input.search) {
        query = query.ilike("name", `%${input.search}%`);
      }

      if (input.userId) {
        query = query.eq("user_id", input.userId);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch discharge summary templates",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Get single discharge summary template by ID
   */
  getDischargeSummaryTemplate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("temp_discharge_summary_templates")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Discharge summary template not found",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Create discharge summary template
   */
  createDischargeSummaryTemplate: adminProcedure
    .input(dischargeSummaryTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("temp_discharge_summary_templates")
        .insert(input)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create discharge summary template",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Update discharge summary template
   */
  updateDischargeSummaryTemplate: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: dischargeSummaryTemplateSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("temp_discharge_summary_templates")
        .update(input.data)
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update discharge summary template",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Delete discharge summary template
   */
  deleteDischargeSummaryTemplate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.serviceClient
        .from("temp_discharge_summary_templates")
        .delete()
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete discharge summary template",
          cause: error,
        });
      }

      return { success: true };
    }),

  // ==========================================================================
  // USER MANAGEMENT
  // ==========================================================================

  /**
   * List all users (with optional search and pagination)
   */
  listUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(["veterinarian", "vet_tech", "admin", "practice_owner", "client"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.serviceClient
        .from("users")
        .select("*")
        .order("email");

      if (input?.search) {
        query = query.or(
          `email.ilike.%${input.search}%,first_name.ilike.%${input.search}%,last_name.ilike.%${input.search}%`
        );
      }

      if (input?.role) {
        query = query.eq("role", input.role);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch users",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Get single user by ID
   */
  getUser: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("users")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Create new user (creates both auth.users and public.users)
   * Note: Requires Supabase Auth Admin API
   */
  createUser: adminProcedure
    .input(userSchema.extend({ password: z.string().min(8, "Password must be at least 8 characters") }))
    .mutation(async ({ ctx, input }) => {
      // This would require Supabase Auth Admin API integration
      // For now, return error instructing to use Supabase dashboard
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "User creation requires Supabase Auth Admin API integration. Please create users through the Supabase dashboard for now.",
      });
    }),

  /**
   * Update user profile
   */
  updateUser: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: userSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("users")
        .update(input.data)
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Delete user (hard delete from both auth.users and public.users)
   * Note: Requires Supabase Auth Admin API
   */
  deleteUser: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Delete from public.users (auth.users will cascade if properly configured)
      const { error } = await ctx.serviceClient
        .from("users")
        .delete()
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete user",
          cause: error,
        });
      }

      return { success: true };
    }),
});

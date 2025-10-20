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
      let query = ctx.supabase
        .from("temp_soap_templates")
        .select("*, user:users(id, email, full_name)")
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
      const { data, error } = await ctx.supabase
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
      const { data, error } = await ctx.supabase
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
      const { data, error } = await ctx.supabase
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
      const { error } = await ctx.supabase
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
  // USER MANAGEMENT
  // ==========================================================================

  /**
   * Get all users for assignment dropdown
   */
  listUsers: adminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("users")
      .select("id, email, full_name, role")
      .order("email");

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch users",
        cause: error,
      });
    }

    return data;
  }),
});

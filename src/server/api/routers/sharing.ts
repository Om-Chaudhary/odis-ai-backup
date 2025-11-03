import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const shareEntitySchema = z.object({
  entityId: z.string().uuid(),
  userIds: z.array(z.string().uuid()).min(1, "At least one user must be selected"),
});

const unshareEntitySchema = z.object({
  entityId: z.string().uuid(),
  userId: z.string().uuid(),
});

const listSharesSchema = z.object({
  entityId: z.string().uuid(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const sharingRouter = createTRPCRouter({
  // ==========================================================================
  // SOAP TEMPLATE SHARING
  // ==========================================================================

  /**
   * Share SOAP template with specific users
   */
  shareSoapTemplate: adminProcedure
    .input(shareEntitySchema)
    .mutation(async ({ ctx, input }) => {
      // First verify template exists
      const { data: template, error: templateError } = await ctx.serviceClient
        .from("temp_soap_templates")
        .select("id")
        .eq("id", input.entityId)
        .single();

      if (templateError ?? !template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SOAP template not found",
          cause: templateError,
        });
      }

      // Create share records (insert ignore duplicates)
      const shareRecords = input.userIds.map((userId) => ({
        template_id: input.entityId,
        shared_with_user_id: userId,
      }));

      const { data, error } = await ctx.serviceClient
        .from("soap_template_shares")
        .upsert(shareRecords, { onConflict: "template_id,shared_with_user_id" })
        .select();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to share SOAP template",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Unshare SOAP template from a specific user
   */
  unshareSoapTemplate: adminProcedure
    .input(unshareEntitySchema)
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.serviceClient
        .from("soap_template_shares")
        .delete()
        .eq("template_id", input.entityId)
        .eq("shared_with_user_id", input.userId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unshare SOAP template",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * List all users who have access to a SOAP template
   */
  listSoapTemplateShares: adminProcedure
    .input(listSharesSchema)
    .query(async ({ ctx, input }) => {
      // Get shares
      const { data: shares, error: sharesError } = await ctx.serviceClient
        .from("soap_template_shares")
        .select("*")
        .eq("template_id", input.entityId)
        .order("created_at", { ascending: false });

      if (sharesError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch SOAP template shares",
          cause: sharesError,
        });
      }

      if (!shares || shares.length === 0) {
        return [];
      }

      // Get user details for each share
      const userIds = shares.map((share) => share.shared_with_user_id);
      const { data: users, error: usersError } = await ctx.serviceClient
        .from("users")
        .select("id, email, first_name, last_name, role")
        .in("id", userIds);

      if (usersError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user details",
          cause: usersError,
        });
      }

      // Combine shares with user data
      const sharesWithUsers = shares.map((share) => ({
        ...share,
        user: users?.find((user) => user.id === share.shared_with_user_id) ?? null,
      }));

      return sharesWithUsers;
    }),

  // ==========================================================================
  // DISCHARGE TEMPLATE SHARING
  // ==========================================================================

  /**
   * Share discharge summary template with specific users
   */
  shareDischargeTemplate: adminProcedure
    .input(shareEntitySchema)
    .mutation(async ({ ctx, input }) => {
      // First verify template exists
      const { data: template, error: templateError } = await ctx.serviceClient
        .from("temp_discharge_summary_templates")
        .select("id")
        .eq("id", input.entityId)
        .single();

      if (templateError ?? !template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Discharge template not found",
          cause: templateError,
        });
      }

      // Create share records
      const shareRecords = input.userIds.map((userId) => ({
        template_id: input.entityId,
        shared_with_user_id: userId,
      }));

      const { data, error } = await ctx.serviceClient
        .from("discharge_template_shares")
        .upsert(shareRecords, { onConflict: "template_id,shared_with_user_id" })
        .select();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to share discharge template",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Unshare discharge template from a specific user
   */
  unshareDischargeTemplate: adminProcedure
    .input(unshareEntitySchema)
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.serviceClient
        .from("discharge_template_shares")
        .delete()
        .eq("template_id", input.entityId)
        .eq("shared_with_user_id", input.userId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unshare discharge template",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * List all users who have access to a discharge template
   */
  listDischargeTemplateShares: adminProcedure
    .input(listSharesSchema)
    .query(async ({ ctx, input }) => {
      // Get shares
      const { data: shares, error: sharesError } = await ctx.serviceClient
        .from("discharge_template_shares")
        .select("*")
        .eq("template_id", input.entityId)
        .order("created_at", { ascending: false });

      if (sharesError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch discharge template shares",
          cause: sharesError,
        });
      }

      if (!shares || shares.length === 0) {
        return [];
      }

      // Get user details for each share
      const userIds = shares.map((share) => share.shared_with_user_id);
      const { data: users, error: usersError } = await ctx.serviceClient
        .from("users")
        .select("id, email, first_name, last_name, role")
        .in("id", userIds);

      if (usersError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user details",
          cause: usersError,
        });
      }

      // Combine shares with user data
      const sharesWithUsers = shares.map((share) => ({
        ...share,
        user: users?.find((user) => user.id === share.shared_with_user_id) ?? null,
      }));

      return sharesWithUsers;
    }),

  // ==========================================================================
  // CASE SHARING
  // ==========================================================================

  /**
   * Share case with specific users
   */
  shareCase: adminProcedure
    .input(shareEntitySchema)
    .mutation(async ({ ctx, input }) => {
      // First verify case exists
      const { data: caseData, error: caseError } = await ctx.serviceClient
        .from("cases")
        .select("id")
        .eq("id", input.entityId)
        .single();

      if (caseError ?? !caseData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
          cause: caseError,
        });
      }

      // Create share records (include who shared it)
      const shareRecords = input.userIds.map((userId) => ({
        case_id: input.entityId,
        shared_with_user_id: userId,
        shared_by_user_id: ctx.session.user.id,
      }));

      const { data, error } = await ctx.serviceClient
        .from("case_shares")
        .upsert(shareRecords, { onConflict: "case_id,shared_with_user_id" })
        .select();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to share case",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Unshare case from a specific user
   */
  unshareCase: adminProcedure
    .input(unshareEntitySchema)
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.serviceClient
        .from("case_shares")
        .delete()
        .eq("case_id", input.entityId)
        .eq("shared_with_user_id", input.userId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unshare case",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * List all users who have access to a case
   */
  listCaseShares: adminProcedure
    .input(listSharesSchema)
    .query(async ({ ctx, input }) => {
      // Get shares
      const { data: shares, error: sharesError } = await ctx.serviceClient
        .from("case_shares")
        .select("*")
        .eq("case_id", input.entityId)
        .order("created_at", { ascending: false });

      if (sharesError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch case shares",
          cause: sharesError,
        });
      }

      if (!shares || shares.length === 0) {
        return [];
      }

      // Get user details for each share
      const userIds = shares.map((share) => share.shared_with_user_id);
      const { data: users, error: usersError } = await ctx.serviceClient
        .from("users")
        .select("id, email, first_name, last_name, role")
        .in("id", userIds);

      if (usersError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user details",
          cause: usersError,
        });
      }

      // Combine shares with user data
      const sharesWithUsers = shares.map((share) => ({
        ...share,
        user: users?.find((user) => user.id === share.shared_with_user_id) ?? null,
      }));

      return sharesWithUsers;
    }),

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  /**
   * Bulk update shares for any entity type (replaces all shares)
   */
  updateEntityShares: adminProcedure
    .input(
      z.object({
        entityType: z.enum(["soap_template", "discharge_template", "case"]),
        entityId: z.string().uuid(),
        userIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tableMap = {
        soap_template: "soap_template_shares",
        discharge_template: "discharge_template_shares",
        case: "case_shares",
      } as const;

      const columnMap = {
        soap_template: "template_id",
        discharge_template: "template_id",
        case: "case_id",
      } as const;

      const tableName = tableMap[input.entityType];
      const columnName = columnMap[input.entityType];

      // Delete all existing shares
      const { error: deleteError } = await ctx.serviceClient
        .from(tableName)
        .delete()
        .eq(columnName, input.entityId);

      if (deleteError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to remove existing shares`,
          cause: deleteError,
        });
      }

      // If no users specified, we're done (unshare all)
      if (input.userIds.length === 0) {
        return { success: true, count: 0 };
      }

      // Insert new shares
      const shareRecords = input.userIds.map((userId) => {
        const record: Record<string, string> = {
          [columnName]: input.entityId,
          shared_with_user_id: userId,
        };

        // Add shared_by_user_id for cases (case_shares table has this column)
        if (input.entityType === "case") {
          record.shared_by_user_id = ctx.session.user.id;
        }

        return record;
      });

      const { data, error: insertError } = await ctx.serviceClient
        .from(tableName)
        .insert(shareRecords)
        .select();

      if (insertError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create new shares`,
          cause: insertError,
        });
      }

      return { success: true, count: data?.length ?? 0 };
    }),
});

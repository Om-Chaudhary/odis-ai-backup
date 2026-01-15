/**
 * Onboarding Router
 *
 * Handles user onboarding flow including:
 * - Checking onboarding status
 * - Creating new clinics with extended fields
 * - Validating and accepting email invitations
 * - Completing user profiles
 */

import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  createClinicSchema,
  completeProfileSchema,
  validateInvitationTokenSchema,
  acceptInvitationSchema,
  type OnboardingStatus,
  type InvitationInfo,
} from "./schemas";

// Type helper for Supabase joined clinic data
type ClinicJoin = {
  id: string;
  name: string;
  slug: string;
} | null;

type ClinicJoinMinimal = {
  id: string;
  name: string;
} | null;

type ClinicJoinSlug = {
  slug: string;
} | null;

export const onboardingRouter = createTRPCRouter({
  /**
   * Get onboarding status for the current user
   *
   * Returns whether the user has:
   * - A clinic association (via user_clinic_access or legacy clinic_name)
   * - A completed profile (first_name, last_name set)
   * - Completed onboarding (onboarding_completed = true)
   * - Any pending invitations to their email
   */
  getStatus: protectedProcedure.query(
    async ({ ctx }): Promise<OnboardingStatus> => {
      const userId = ctx.user.id;
      const userEmail = ctx.user.email;

      // Get user profile
      const { data: profile, error: profileError } = await ctx.supabase
        .from("users")
        .select("first_name, last_name, email, onboarding_completed")
        .eq("id", userId)
        .single();

      if (profileError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user profile",
        });
      }

      // Get user's clinic access from junction table
      const { data: clinicAccess } = await ctx.supabase
        .from("user_clinic_access")
        .select(
          `
        is_primary,
        clinics (
          id,
          name,
          slug
        )
      `,
        )
        .eq("user_id", userId);

      const clinics =
        clinicAccess
          ?.filter((access) => access.clinics !== null)
          .map((access) => {
            const clinic = access.clinics as unknown as ClinicJoin;
            return {
              id: clinic!.id,
              name: clinic!.name,
              slug: clinic!.slug,
              isPrimary: access.is_primary,
            };
          }) ?? [];

      // Check for pending invitations to user's email
      let pendingInvitation: OnboardingStatus["pendingInvitation"] = null;
      if (userEmail) {
        const { data: invitation } = await ctx.supabase
          .from("clinic_invitations")
          .select(
            `
          token,
          role,
          clinics (
            id,
            name
          )
        `,
          )
          .eq("status", "pending")
          .ilike("email", userEmail)
          .gt("expires_at", new Date().toISOString())
          .limit(1)
          .maybeSingle();

        if (invitation?.clinics) {
          const clinic = invitation.clinics as unknown as ClinicJoinMinimal;
          pendingInvitation = {
            clinicName: clinic!.name,
            clinicId: clinic!.id,
            role: invitation.role,
            token: invitation.token,
          };
        }
      }

      const hasClinic = clinics.length > 0;
      const hasProfile = Boolean(profile?.first_name && profile?.last_name);
      const isComplete = profile?.onboarding_completed === true;

      return {
        hasClinic,
        hasProfile,
        isComplete,
        clinics,
        profile: profile
          ? {
              firstName: profile.first_name,
              lastName: profile.last_name,
              email: profile.email,
            }
          : null,
        pendingInvitation,
      };
    },
  ),

  /**
   * Create a new clinic and assign the current user as owner
   *
   * Extended clinic creation includes:
   * - Basic info (name, phone, email, address)
   * - PIMS type selection
   * - Business hours configuration
   * - Timezone setting
   */
  createClinic: protectedProcedure
    .input(createClinicSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Generate slug from clinic name
      const baseSlug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Check for existing slug and make unique if needed
      let slug = baseSlug;
      let attempt = 1;
      while (attempt <= 5) {
        const { data: existing } = await ctx.supabase
          .from("clinics")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (!existing) break;
        slug = `${baseSlug}-${attempt + 1}`;
        attempt++;
      }

      // Create the clinic
      const { data: clinic, error: clinicError } = await ctx.supabase
        .from("clinics")
        .insert({
          name: input.name.trim(),
          slug,
          phone: input.phone ?? null,
          email: input.email ?? null,
          address: input.address ?? null,
          timezone: input.timezone,
          pims_type: input.pimsType,
          business_hours: input.businessHours ?? null,
          is_active: true,
        })
        .select("id, name, slug")
        .single();

      if (clinicError || !clinic) {
        // Check for unique constraint violation
        if (clinicError?.code === "23505") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A clinic with this name already exists",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create clinic",
          cause: clinicError,
        });
      }

      // Check if user has any existing clinic access (to determine is_primary)
      const { data: existingAccess } = await ctx.supabase
        .from("user_clinic_access")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      const isFirstClinic = !existingAccess || existingAccess.length === 0;

      // Create user_clinic_access record with owner role
      const { error: accessError } = await ctx.supabase
        .from("user_clinic_access")
        .insert({
          user_id: userId,
          clinic_id: clinic.id,
          role: "owner",
          is_primary: isFirstClinic,
          granted_by: userId,
          granted_at: new Date().toISOString(),
        });

      if (accessError) {
        // Rollback clinic creation on access error
        await ctx.supabase.from("clinics").delete().eq("id", clinic.id);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assign clinic ownership",
          cause: accessError,
        });
      }

      return {
        success: true,
        clinic: {
          id: clinic.id,
          name: clinic.name,
          slug: clinic.slug,
        },
      };
    }),

  /**
   * Validate an invitation token (public - can be called before login)
   *
   * Returns information about the invitation without accepting it.
   * Used to show the user what clinic they're being invited to.
   */
  validateInvitationToken: publicProcedure
    .input(validateInvitationTokenSchema)
    .query(async ({ ctx, input }): Promise<InvitationInfo> => {
      const { data: invitation, error } = await ctx.supabase
        .from("clinic_invitations")
        .select(
          `
          id,
          email,
          role,
          status,
          expires_at,
          clinics (
            id,
            name
          )
        `,
        )
        .eq("token", input.token)
        .maybeSingle();

      if (error || !invitation) {
        return {
          valid: false,
          clinicId: null,
          clinicName: null,
          role: null,
          email: null,
          error: "Invitation not found",
        };
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        return {
          valid: false,
          clinicId: null,
          clinicName: null,
          role: null,
          email: null,
          error: "Invitation has expired",
        };
      }

      // Check if already accepted or revoked
      if (invitation.status !== "pending") {
        return {
          valid: false,
          clinicId: null,
          clinicName: null,
          role: null,
          email: null,
          error:
            invitation.status === "accepted"
              ? "Invitation has already been accepted"
              : "Invitation is no longer valid",
        };
      }

      const clinic = invitation.clinics as unknown as ClinicJoinMinimal;

      return {
        valid: true,
        clinicId: clinic?.id ?? null,
        clinicName: clinic?.name ?? null,
        role: invitation.role,
        email: invitation.email,
      };
    }),

  /**
   * Accept an invitation and join the clinic
   *
   * Uses the database function `accept_clinic_invitation` which handles:
   * - Validating the token
   * - Creating user_clinic_access record
   * - Marking invitation as accepted
   * - Setting is_primary if this is the user's first clinic
   */
  acceptInvitation: protectedProcedure
    .input(acceptInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Call the database function to accept the invitation
      const { data, error } = await ctx.supabase.rpc(
        "accept_clinic_invitation",
        {
          p_token: input.token,
          p_user_id: userId,
        },
      );

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to accept invitation",
          cause: error,
        });
      }

      const result = data as {
        success: boolean;
        error?: string;
        clinic_id?: string;
        clinic_name?: string;
        role?: string;
        is_primary?: boolean;
        already_member?: boolean;
      };

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error ?? "Failed to accept invitation",
        });
      }

      return {
        success: true,
        clinicId: result.clinic_id,
        clinicName: result.clinic_name,
        role: result.role,
        isPrimary: result.is_primary ?? false,
        alreadyMember: result.already_member ?? false,
      };
    }),

  /**
   * Complete user profile and mark onboarding as done
   *
   * Final step of onboarding - sets user's name, optional role,
   * and marks onboarding_completed = true.
   */
  completeProfile: protectedProcedure
    .input(completeProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verify user has at least one clinic before completing onboarding
      const { data: clinicAccess } = await ctx.supabase
        .from("user_clinic_access")
        .select("clinic_id")
        .eq("user_id", userId)
        .limit(1);

      if (!clinicAccess || clinicAccess.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You must be associated with a clinic before completing onboarding",
        });
      }

      // Update user profile
      const { error: updateError } = await ctx.supabase
        .from("users")
        .update({
          first_name: input.firstName.trim(),
          last_name: input.lastName.trim(),
          license_number: input.licenseNumber ?? null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
          cause: updateError,
        });
      }

      // Get the user's primary clinic for redirect
      const { data: primaryClinic } = await ctx.supabase
        .from("user_clinic_access")
        .select(
          `
          clinics (
            slug
          )
        `,
        )
        .eq("user_id", userId)
        .eq("is_primary", true)
        .maybeSingle();

      // Fall back to first clinic if no primary
      const primaryClinicData =
        primaryClinic?.clinics as unknown as ClinicJoinSlug;
      let clinicSlug = primaryClinicData?.slug;

      if (!clinicSlug && clinicAccess.length > 0 && clinicAccess[0]) {
        const { data: firstClinic } = await ctx.supabase
          .from("clinics")
          .select("slug")
          .eq("id", clinicAccess[0].clinic_id)
          .single();
        clinicSlug = firstClinic?.slug;
      }

      return {
        success: true,
        redirectTo: clinicSlug ? `/dashboard/${clinicSlug}` : "/dashboard",
      };
    }),

  /**
   * Check if user has pending invitations for their email
   *
   * Helper to show invitation badge or prompt on login
   */
  checkPendingInvitations: protectedProcedure.query(async ({ ctx }) => {
    const userEmail = ctx.user.email;

    if (!userEmail) {
      return { hasPending: false, count: 0 };
    }

    const { data: invitations, error } = await ctx.supabase
      .from("clinic_invitations")
      .select("id")
      .eq("status", "pending")
      .ilike("email", userEmail)
      .gt("expires_at", new Date().toISOString());

    if (error) {
      return { hasPending: false, count: 0 };
    }

    return {
      hasPending: invitations.length > 0,
      count: invitations.length,
    };
  }),
});

import { createTRPCRouter, orgAdminProcedure } from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  inviteTeamMemberSchema,
  updateTeamMemberRoleSchema,
  removeTeamMemberSchema,
  listTeamMembersSchema,
} from "./schemas";
import { env } from "@odis-ai/shared/env";

/**
 * Team Router
 *
 * Handles team member management using Clerk's native organization features.
 * All procedures require org:admin or org:owner role.
 */
export const teamRouter = createTRPCRouter({
  /**
   * Invite a team member to the organization
   *
   * Uses Clerk's native organization invitation system.
   * The invited user will receive an email with a link to accept the invitation.
   */
  invite: orgAdminProcedure
    .input(inviteTeamMemberSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Organization membership required",
        });
      }

      const client = await clerkClient();

      try {
        // Create Clerk organization invitation
        const invitation = await client.organizations.createOrganizationInvitation({
          organizationId: ctx.orgId,
          emailAddress: input.email,
          role: input.role,
          redirectUrl: `${env.NEXT_PUBLIC_SITE_URL}/accept-invitation`,
        });

        return {
          success: true,
          invitationId: invitation.id,
          email: input.email,
          message: `Invitation sent to ${input.email}`,
        };
      } catch (error) {
        console.error("[Team Invite] Error creating invitation:", error);

        // Handle specific Clerk errors
        if (error instanceof Error) {
          if (error.message.includes("already exists")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This user is already a member of the organization",
            });
          }
          if (error.message.includes("pending invitation")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "There is already a pending invitation for this email",
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send invitation",
          cause: error,
        });
      }
    }),

  /**
   * List team members in the organization
   *
   * Returns all members with their roles and metadata.
   */
  list: orgAdminProcedure
    .input(listTeamMembersSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Organization membership required",
        });
      }

      const client = await clerkClient();

      try {
        // Get organization memberships
        const response = await client.organizations.getOrganizationMembershipList({
          organizationId: ctx.orgId,
          limit: input.limit,
          offset: input.offset,
        });

        // Transform to simpler format
        const members = response.data.map((membership) => ({
          id: membership.publicUserData?.userId ?? "",
          email:
            membership.publicUserData?.identifier ??
            membership.publicUserData?.userId ??
            "",
          firstName: membership.publicUserData?.firstName ?? "",
          lastName: membership.publicUserData?.lastName ?? "",
          imageUrl: membership.publicUserData?.imageUrl ?? "",
          role: membership.role,
          createdAt: membership.createdAt,
        }));

        return {
          members,
          total: response.totalCount,
        };
      } catch (error) {
        console.error("[Team List] Error fetching members:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch team members",
          cause: error,
        });
      }
    }),

  /**
   * Update a team member's role
   *
   * Changes the Clerk organization role for a member.
   */
  updateRole: orgAdminProcedure
    .input(updateTeamMemberRoleSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Organization membership required",
        });
      }

      const client = await clerkClient();

      try {
        await client.organizations.updateOrganizationMembership({
          organizationId: ctx.orgId,
          userId: input.userId,
          role: input.role,
        });

        return {
          success: true,
          message: "Role updated successfully",
        };
      } catch (error) {
        console.error("[Team Update Role] Error updating role:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update member role",
          cause: error,
        });
      }
    }),

  /**
   * Remove a team member from the organization
   *
   * Removes the user's membership from the Clerk organization.
   */
  remove: orgAdminProcedure
    .input(removeTeamMemberSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Organization membership required",
        });
      }

      // Prevent removing yourself
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot remove yourself from the organization",
        });
      }

      const client = await clerkClient();

      try {
        await client.organizations.deleteOrganizationMembership({
          organizationId: ctx.orgId,
          userId: input.userId,
        });

        return {
          success: true,
          message: "Team member removed successfully",
        };
      } catch (error) {
        console.error("[Team Remove] Error removing member:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove team member",
          cause: error,
        });
      }
    }),

  /**
   * List pending invitations
   *
   * Returns all pending organization invitations.
   */
  listInvitations: orgAdminProcedure
    .input(listTeamMembersSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Organization membership required",
        });
      }

      const client = await clerkClient();

      try {
        const response = await client.organizations.getOrganizationInvitationList({
          organizationId: ctx.orgId,
          limit: input.limit,
          offset: input.offset,
          status: ["pending"],
        });

        const invitations = response.data.map((invitation) => ({
          id: invitation.id,
          email: invitation.emailAddress,
          role: invitation.role,
          status: invitation.status,
          createdAt: invitation.createdAt,
        }));

        return {
          invitations,
          total: response.totalCount,
        };
      } catch (error) {
        console.error("[Team Invitations] Error fetching invitations:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch pending invitations",
          cause: error,
        });
      }
    }),

  /**
   * Revoke a pending invitation
   *
   * Cancels a pending organization invitation.
   */
  revokeInvitation: orgAdminProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Organization membership required",
        });
      }

      const client = await clerkClient();

      try {
        await client.organizations.revokeOrganizationInvitation({
          organizationId: ctx.orgId,
          invitationId: input.invitationId,
        });

        return {
          success: true,
          message: "Invitation revoked successfully",
        };
      } catch (error) {
        console.error("[Team Revoke] Error revoking invitation:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to revoke invitation",
          cause: error,
        });
      }
    }),
});

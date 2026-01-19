import { z } from "zod";

/**
 * Schema for inviting a team member to the organization
 *
 * Uses Clerk's organization invitations, so we only need:
 * - email: The email address to invite
 * - role: The Clerk organization role to assign
 */
export const inviteTeamMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z
    .enum(["org:owner", "org:admin", "org:veterinarian", "org:member", "org:viewer"])
    .default("org:member")
    .describe("Clerk organization role"),
});

/**
 * Schema for updating a team member's role
 */
export const updateTeamMemberRoleSchema = z.object({
  userId: z.string().describe("Clerk user ID"),
  role: z
    .enum(["org:owner", "org:admin", "org:veterinarian", "org:member", "org:viewer"])
    .describe("New Clerk organization role"),
});

/**
 * Schema for removing a team member from the organization
 */
export const removeTeamMemberSchema = z.object({
  userId: z.string().describe("Clerk user ID to remove"),
});

/**
 * Schema for listing team members
 */
export const listTeamMembersSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

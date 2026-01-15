/**
 * Clinic Invitation Service
 *
 * Handles email-based invitations for users to join clinics.
 * Supports creating, validating, accepting, and revoking invitations.
 */

import type { Database } from "@odis-ai/shared/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";

type SupabaseClientType = SupabaseClient<Database>;

const logger = loggers.database.child("invitations");

/**
 * Invitation role types
 */
export type InvitationRole = "admin" | "member" | "viewer";

/**
 * Invitation status types
 */
export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

/**
 * Result of creating an invitation
 */
export interface CreateInvitationResult {
  id: string;
  token: string;
  email: string;
  role: InvitationRole;
  expiresAt: Date;
}

/**
 * Validated invitation info
 */
export interface ValidatedInvitation {
  id: string;
  clinicId: string;
  clinicName: string;
  role: InvitationRole;
  email: string;
  expiresAt: Date;
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Clinic invitation with clinic details
 */
export interface ClinicInvitationWithDetails {
  id: string;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  invitedBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  acceptedBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  acceptedAt?: Date | null;
}

/**
 * Create a new clinic invitation
 *
 * Creates an invitation record with a unique token that can be sent via email.
 * The token is valid for 7 days by default.
 *
 * @param clinicId - Clinic to invite user to
 * @param email - Email address to invite
 * @param role - Role to assign when invitation is accepted
 * @param invitedBy - User ID of the person creating the invitation
 * @param supabase - Supabase client (should be service role for admin operations)
 * @param expiresInDays - Number of days until invitation expires (default: 7)
 * @returns Invitation details including the unique token, or null on failure
 */
export async function createClinicInvitation(
  clinicId: string,
  email: string,
  role: InvitationRole,
  invitedBy: string,
  supabase: SupabaseClientType,
  expiresInDays = 7,
): Promise<CreateInvitationResult | null> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    logger.error("Invalid email format for invitation", { email, clinicId });
    return null;
  }

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Check for existing pending invitation
  const { data: existing } = await supabase
    .from("clinic_invitations")
    .select("id, token, expires_at")
    .eq("clinic_id", clinicId)
    .ilike("email", email)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existing) {
    logger.info("Pending invitation already exists, returning existing", {
      invitationId: existing.id,
      clinicId,
      email,
    });
    return {
      id: existing.id,
      token: existing.token,
      email,
      role,
      expiresAt: new Date(existing.expires_at),
    };
  }

  // Create new invitation
  const { data: invitation, error } = await supabase
    .from("clinic_invitations")
    .insert({
      clinic_id: clinicId,
      email: email.toLowerCase().trim(),
      role,
      invited_by: invitedBy,
      expires_at: expiresAt.toISOString(),
      status: "pending",
    })
    .select("id, token, expires_at")
    .single();

  if (error || !invitation) {
    logger.error("Failed to create clinic invitation", {
      clinicId,
      email,
      role,
      error: error?.message,
      errorCode: error?.code,
    });
    return null;
  }

  logger.info("Created clinic invitation", {
    invitationId: invitation.id,
    clinicId,
    email,
    role,
    invitedBy,
    expiresAt: expiresAt.toISOString(),
  });

  return {
    id: invitation.id,
    token: invitation.token,
    email,
    role,
    expiresAt: new Date(invitation.expires_at),
  };
}

/**
 * Validate an invitation token
 *
 * Checks if a token is valid, not expired, and still pending.
 * Returns full invitation details including clinic name.
 *
 * @param token - Invitation token (UUID)
 * @param supabase - Supabase client
 * @returns Validated invitation info or null if invalid
 */
export async function validateInvitationToken(
  token: string,
  supabase: SupabaseClientType,
): Promise<ValidatedInvitation | null> {
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    logger.error("Invalid invitation token format", {
      token: token.substring(0, 8) + "...",
    });
    return null;
  }

  const { data: invitation, error } = await supabase
    .from("clinic_invitations")
    .select(
      `
      id,
      email,
      role,
      status,
      expires_at,
      clinic_id,
      clinics (
        id,
        name
      ),
      invited_by,
      users!clinic_invitations_invited_by_fkey (
        id,
        first_name,
        last_name,
        email
      )
    `,
    )
    .eq("token", token)
    .maybeSingle();

  if (error || !invitation) {
    logger.debug("Invitation token not found", {
      token: token.substring(0, 8) + "...",
    });
    return null;
  }

  // Check status
  if (invitation.status !== "pending") {
    logger.debug("Invitation is not pending", {
      token: token.substring(0, 8) + "...",
      status: invitation.status,
    });
    return null;
  }

  // Check expiration
  if (new Date(invitation.expires_at) < new Date()) {
    logger.debug("Invitation has expired", {
      token: token.substring(0, 8) + "...",
      expiresAt: invitation.expires_at,
    });
    return null;
  }

  // Type cast for joined data
  const clinic = invitation.clinics as unknown as { id: string; name: string };
  const inviter = invitation.users as unknown as {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };

  const inviterName = [inviter?.first_name, inviter?.last_name]
    .filter(Boolean)
    .join(" ");

  return {
    id: invitation.id,
    clinicId: invitation.clinic_id,
    clinicName: clinic?.name ?? "Unknown Clinic",
    role: invitation.role as InvitationRole,
    email: invitation.email,
    expiresAt: new Date(invitation.expires_at),
    invitedBy: {
      id: inviter?.id ?? invitation.invited_by,
      name: inviterName || "Team Member",
      email: inviter?.email ?? "",
    },
  };
}

/**
 * Revoke a pending invitation
 *
 * Marks an invitation as revoked so it can no longer be used.
 *
 * @param invitationId - ID of the invitation to revoke
 * @param supabase - Supabase client
 * @returns true if revoked successfully, false otherwise
 */
export async function revokeInvitation(
  invitationId: string,
  supabase: SupabaseClientType,
): Promise<boolean> {
  const { error } = await supabase
    .from("clinic_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("status", "pending");

  if (error) {
    logger.error("Failed to revoke invitation", {
      invitationId,
      error: error.message,
    });
    return false;
  }

  logger.info("Revoked invitation", { invitationId });
  return true;
}

/**
 * Resend an invitation (creates new token, extends expiry)
 *
 * Revokes the old invitation and creates a new one with a fresh token.
 *
 * @param invitationId - ID of the invitation to resend
 * @param supabase - Supabase client
 * @returns New invitation details or null on failure
 */
export async function resendInvitation(
  invitationId: string,
  supabase: SupabaseClientType,
): Promise<CreateInvitationResult | null> {
  // Get existing invitation
  const { data: existing, error: findError } = await supabase
    .from("clinic_invitations")
    .select("clinic_id, email, role, invited_by")
    .eq("id", invitationId)
    .eq("status", "pending")
    .single();

  if (findError || !existing) {
    logger.error("Could not find pending invitation to resend", {
      invitationId,
    });
    return null;
  }

  // Revoke old invitation
  await revokeInvitation(invitationId, supabase);

  // Create new invitation
  return createClinicInvitation(
    existing.clinic_id,
    existing.email,
    existing.role as InvitationRole,
    existing.invited_by,
    supabase,
  );
}

/**
 * Get all invitations for a clinic
 *
 * Returns all invitations (pending, accepted, revoked, expired) for a clinic.
 *
 * @param clinicId - Clinic ID
 * @param supabase - Supabase client
 * @param status - Optional filter by status
 * @returns Array of invitations with details
 */
export async function getClinicInvitations(
  clinicId: string,
  supabase: SupabaseClientType,
  status?: InvitationStatus,
): Promise<ClinicInvitationWithDetails[]> {
  let query = supabase
    .from("clinic_invitations")
    .select(
      `
      id,
      email,
      role,
      status,
      expires_at,
      created_at,
      accepted_at,
      invited_by,
      accepted_by,
      inviter:users!clinic_invitations_invited_by_fkey (
        id,
        first_name,
        last_name,
        email
      ),
      accepter:users!clinic_invitations_accepted_by_fkey (
        id,
        first_name,
        last_name,
        email
      )
    `,
    )
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: invitations, error } = await query;

  if (error || !invitations) {
    logger.error("Failed to get clinic invitations", {
      clinicId,
      error: error?.message,
    });
    return [];
  }

  return invitations.map((inv) => {
    // Type cast for joined data
    const inviter = inv.inviter as unknown as {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;

    const accepter = inv.accepter as unknown as {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;

    return {
      id: inv.id,
      email: inv.email,
      role: inv.role as InvitationRole,
      status: inv.status as InvitationStatus,
      expiresAt: new Date(inv.expires_at),
      createdAt: new Date(inv.created_at),
      invitedBy: {
        id: inviter?.id ?? inv.invited_by,
        firstName: inviter?.first_name ?? null,
        lastName: inviter?.last_name ?? null,
        email: inviter?.email ?? null,
      },
      acceptedBy: accepter
        ? {
            id: accepter.id,
            firstName: accepter.first_name,
            lastName: accepter.last_name,
            email: accepter.email,
          }
        : null,
      acceptedAt: inv.accepted_at ? new Date(inv.accepted_at) : null,
    };
  });
}

/**
 * Check if an email already has access to a clinic
 *
 * Useful before sending an invitation to avoid redundant invites.
 *
 * @param email - Email to check
 * @param clinicId - Clinic ID
 * @param supabase - Supabase client
 * @returns true if user with this email already has access
 */
export async function emailHasClinicAccess(
  email: string,
  clinicId: string,
  supabase: SupabaseClientType,
): Promise<boolean> {
  // Find user by email
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (!user) {
    return false;
  }

  // Check if user has access to clinic
  const { data: access } = await supabase
    .from("user_clinic_access")
    .select("id")
    .eq("user_id", user.id)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  return !!access;
}

/**
 * Get pending invitation count for a clinic
 *
 * @param clinicId - Clinic ID
 * @param supabase - Supabase client
 * @returns Number of pending invitations
 */
export async function getPendingInvitationCount(
  clinicId: string,
  supabase: SupabaseClientType,
): Promise<number> {
  const { count, error } = await supabase
    .from("clinic_invitations")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());

  if (error) {
    logger.error("Failed to get pending invitation count", {
      clinicId,
      error: error.message,
    });
    return 0;
  }

  return count ?? 0;
}

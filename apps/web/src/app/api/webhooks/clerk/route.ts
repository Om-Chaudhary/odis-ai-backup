/**
 * Clerk Webhook Route
 *
 * Next.js API route handler for Clerk webhook events.
 * Syncs Clerk users and organizations to Supabase database for hybrid auth.
 *
 * ACCOUNT LINKING:
 * When a user signs up via Clerk (web app) with an email that already exists
 * in Supabase Auth (iOS app), their accounts are automatically linked:
 * - Preserves existing user data (name, avatar) from iOS app
 * - Preserves existing clinic access and relationships
 * - Updates role if joining via Clerk Organization
 * - Maintains is_primary clinic setting from iOS usage
 *
 * Supported Events:
 * - user.created: New user signed up via Clerk (auto-links to iOS account if exists)
 * - user.updated: User profile updated
 * - organization.created: New clinic/organization created
 * - organization.updated: Clinic settings updated
 * - organizationMembership.created: User added to clinic (preserves existing access)
 * - organizationMembership.updated: User role changed
 * - organizationMembership.deleted: User removed from clinic
 *
 * @see https://clerk.com/docs/integrations/webhooks
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { loggers } from "@odis-ai/shared/logger";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { env } from "@odis-ai/shared/env";

const logger = loggers.webhook.child("clerk-route");

/**
 * Map Clerk organization roles to ODIS AI clinic roles
 */
const ROLE_MAP: Record<string, string> = {
  "org:owner": "owner",
  "org:admin": "admin",
  "org:veterinarian": "veterinarian",
  "org:member": "member",
  "org:viewer": "viewer",
  admin: "admin",
  basic_member: "member",
};

/**
 * Supported webhook event types
 */
const SUPPORTED_EVENTS = [
  "user.created",
  "user.updated",
  "organization.created",
  "organization.updated",
  "organizationMembership.created",
  "organizationMembership.updated",
  "organizationMembership.deleted",
] as const;

/**
 * Handle incoming webhook from Clerk
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    logger.info("Clerk webhook received", {
      timestamp: new Date().toISOString(),
      contentLength: body.length,
      hasHeaders: !!(svixId && svixTimestamp && svixSignature),
    });

    // Verify webhook secret is configured
    const webhookSecret = env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("CLERK_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    // Verify required headers
    if (!svixId || !svixTimestamp || !svixSignature) {
      logger.warn("Missing svix headers");
      return NextResponse.json({ error: "Missing headers" }, { status: 400 });
    }

    // Verify webhook signature
    let event: WebhookEvent;
    try {
      const wh = new Webhook(webhookSecret);
      event = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as WebhookEvent;
    } catch (err) {
      logger.warn("Invalid webhook signature", {
        error: (err as Error).message,
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    logger.info("Webhook signature verified", {
      eventType: event.type,
    });

    // Create service client (bypasses RLS for webhook processing)
    const supabase = await createServiceClient();

    // Process the webhook event
    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const {
          id,
          email_addresses,
          primary_email_address_id,
          first_name,
          last_name,
          image_url,
        } = event.data;

        // Get primary email
        const primaryEmail = email_addresses.find(
          (e) => e.id === primary_email_address_id,
        )?.email_address;

        if (!primaryEmail) {
          logger.warn("User has no primary email", {
            clerkUserId: id,
            primaryEmailAddressId: primary_email_address_id,
            emailAddressCount: email_addresses.length,
          });
          break;
        }

        // Check for existing Supabase Auth user (from iOS app)
        const { data: existingUser } = await supabase
          .from("users")
          .select("*")
          .eq("email", primaryEmail)
          .is("clerk_user_id", null) // Only link if not already linked to Clerk
          .single();

        if (existingUser && event.type === "user.created") {
          // ACCOUNT LINKING: Link Clerk account to existing iOS user
          const { error: linkError } = await supabase
            .from("users")
            .update({
              clerk_user_id: id,
              // Preserve existing iOS user data, only update if Clerk has better data
              first_name: first_name ?? existingUser.first_name,
              last_name: last_name ?? existingUser.last_name,
              avatar_url: image_url ?? existingUser.avatar_url,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingUser.id);

          if (linkError) {
            logger.logError(
              "Failed to link Clerk account to existing iOS user",
              linkError as Error,
              {
                supabaseUserId: existingUser.id,
                clerkUserId: id,
                email: primaryEmail,
              },
            );
            throw linkError;
          }

          logger.info(
            "Account linked: Clerk account linked to existing iOS user",
            {
              supabaseUserId: existingUser.id,
              clerkUserId: id,
              email: primaryEmail,
              hadExistingData: !!(
                existingUser.first_name ?? existingUser.last_name
              ),
            },
          );
        } else {
          // No existing user or user.updated event - upsert as normal
          const { error } = await supabase.from("users").upsert(
            {
              clerk_user_id: id,
              email: primaryEmail,
              first_name: first_name ?? null,
              last_name: last_name ?? null,
              avatar_url: image_url ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "clerk_user_id" },
          );

          if (error) {
            logger.logError("Failed to sync user", error as Error, {
              clerkUserId: id,
              email: primaryEmail,
            });
            throw error;
          }

          logger.info("User synced successfully", {
            clerkUserId: id,
            email: primaryEmail,
            eventType: event.type,
            wasNewUser: !existingUser,
          });
        }
        break;
      }

      case "organization.created":
      case "organization.updated": {
        const { id, name, slug } = event.data;

        // Upsert clinic to Supabase
        const { error } = await supabase.from("clinics").upsert(
          {
            clerk_org_id: id,
            name,
            slug,
            is_active: true,
            pims_type: "none", // Default, can be updated later
            updated_at: new Date().toISOString(),
          },
          { onConflict: "clerk_org_id" },
        );

        if (error) {
          logger.logError("Failed to sync organization", error as Error, {
            clerkOrgId: id,
            name,
            slug,
          });
          throw error;
        }

        logger.info("Organization synced successfully", {
          clerkOrgId: id,
          name,
          slug,
          eventType: event.type,
        });
        break;
      }

      case "organizationMembership.created":
      case "organizationMembership.updated": {
        const { organization, public_user_data, role } = event.data;

        // Map Clerk role to ODIS AI role
        const mappedRole = ROLE_MAP[role] ?? "member";

        // Try to get clinic by Clerk org ID
        let { data: clinic } = await supabase
          .from("clinics")
          .select("id")
          .eq("clerk_org_id", organization.id)
          .single();

        // If clinic not found, create it (handles race condition when org and membership events arrive together)
        if (!clinic) {
          logger.info(
            "Clinic not found, creating from organization membership event",
            {
              clerkOrgId: organization.id,
              orgName: organization.name,
              orgSlug: organization.slug,
            },
          );

          // Create the clinic from the organization data included in the membership event
          const { data: newClinic, error: createError } = await supabase
            .from("clinics")
            .insert({
              clerk_org_id: organization.id,
              name: organization.name,
              slug: organization.slug,
              is_active: true,
              pims_type: "none",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (createError) {
            // Handle unique constraint violation (org was created by concurrent request)
            if (createError.code === "23505") {
              // Retry fetching the clinic
              const { data: retryClinic } = await supabase
                .from("clinics")
                .select("id")
                .eq("clerk_org_id", organization.id)
                .single();

              if (retryClinic) {
                clinic = retryClinic;
              } else {
                logger.warn("Clinic still not found after retry", {
                  clerkOrgId: organization.id,
                });
                break;
              }
            } else {
              logger.logError(
                "Failed to create clinic from membership event",
                createError as Error,
                {
                  clerkOrgId: organization.id,
                },
              );
              throw createError;
            }
          } else {
            clinic = newClinic;
            logger.info("Clinic created from membership event", {
              clinicId: clinic.id,
              clerkOrgId: organization.id,
            });
          }
        }

        // Get user by Clerk user ID
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_user_id", public_user_data.user_id)
          .single();

        if (userError || !user) {
          logger.warn("User not found", {
            clerkUserId: public_user_data.user_id,
            error: userError?.message,
          });
          break;
        }

        // Check for existing clinic access (from iOS app usage)
        const { data: existingAccess } = await supabase
          .from("user_clinic_access")
          .select("*")
          .eq("user_id", user.id)
          .eq("clinic_id", clinic.id)
          .single();

        // If user already has access to this clinic (from iOS), preserve is_primary
        if (existingAccess) {
          // Update role but preserve is_primary setting
          const { error: updateError } = await supabase
            .from("user_clinic_access")
            .update({
              role: mappedRole,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
            .eq("clinic_id", clinic.id);

          if (updateError) {
            logger.logError(
              "Failed to update existing clinic access",
              updateError as Error,
              {
                userId: user.id,
                clinicId: clinic.id,
                role: mappedRole,
              },
            );
            throw updateError;
          }

          logger.info("Updated existing clinic access for linked account", {
            userId: user.id,
            clinicId: clinic.id,
            role: mappedRole,
            wasPrimary: existingAccess.is_primary,
            eventType: event.type,
          });
        } else {
          // New clinic access - check if this is the user's first clinic
          const { count } = await supabase
            .from("user_clinic_access")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          const isPrimary = (count ?? 0) === 0;

          // Create new clinic access
          const { error: accessError } = await supabase
            .from("user_clinic_access")
            .insert({
              user_id: user.id,
              clinic_id: clinic.id,
              role: mappedRole,
              is_primary: isPrimary,
            });

          if (accessError) {
            logger.logError(
              "Failed to create clinic access",
              accessError as Error,
              {
                userId: user.id,
                clinicId: clinic.id,
                role: mappedRole,
              },
            );
            throw accessError;
          }

          logger.info("Organization membership synced successfully", {
            userId: user.id,
            clinicId: clinic.id,
            role: mappedRole,
            isPrimary,
            eventType: event.type,
          });
        }
        break;
      }

      case "organizationMembership.deleted": {
        const { organization, public_user_data } = event.data;

        // Get clinic by Clerk org ID
        const { data: clinic } = await supabase
          .from("clinics")
          .select("id")
          .eq("clerk_org_id", organization.id)
          .single();

        if (!clinic) {
          logger.warn("Clinic not found for organization deletion", {
            clerkOrgId: organization.id,
          });
          break;
        }

        // Get user by Clerk user ID
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_user_id", public_user_data.user_id)
          .single();

        if (!user) {
          logger.warn("User not found for membership deletion", {
            clerkUserId: public_user_data.user_id,
          });
          break;
        }

        // Remove clinic access
        const { error } = await supabase
          .from("user_clinic_access")
          .delete()
          .eq("user_id", user.id)
          .eq("clinic_id", clinic.id);

        if (error) {
          logger.logError(
            "Failed to remove organization membership",
            error as Error,
            {
              userId: user.id,
              clinicId: clinic.id,
            },
          );
          throw error;
        }

        logger.info("Organization membership removed successfully", {
          userId: user.id,
          clinicId: clinic.id,
        });
        break;
      }

      default:
        logger.info("Unhandled webhook event type", {
          eventType: (event as WebhookEvent).type,
        });
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    logger.logError("Clerk webhook processing failed", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Clerk webhook endpoint is active",
    supportedEvents: SUPPORTED_EVENTS,
  });
}

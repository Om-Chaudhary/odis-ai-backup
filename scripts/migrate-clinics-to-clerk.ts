/**
 * Migrate existing clinics to Clerk Organizations
 *
 * This script helps migrate existing Supabase-only clinics to Clerk Organizations.
 *
 * PREREQUISITES:
 * 1. Ensure you have CLERK_SECRET_KEY in your .env
 * 2. Review the list of clinics to migrate
 *
 * PROCESS:
 * This script will:
 * 1. Fetch all clinics without clerk_org_id
 * 2. For each clinic, create a Clerk Organization
 * 3. Update the clinic record with the new clerk_org_id
 * 4. Add existing clinic members to the Clerk Organization
 *
 * USAGE:
 * pnpm tsx scripts/migrate-clinics-to-clerk.ts [--dry-run]
 */

import { createServiceClient } from "@odis-ai/data-access/db/server";
import { loggers } from "@odis-ai/shared/logger";
import { clerkClient } from "@clerk/express";

const logger = loggers.scripts.child("migrate-clinics-to-clerk");

const DRY_RUN = process.argv.includes("--dry-run");

interface ClinicToMigrate {
  id: string;
  name: string;
  slug: string | null;
  members: Array<{
    user_id: string;
    role: string;
    clerk_user_id: string | null;
    email: string;
    first_name: string | null;
    last_name: string | null;
  }>;
}

/**
 * Generate a slug from clinic name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Map ODIS AI roles to Clerk roles
 */
function mapToClerkRole(role: string): string {
  const roleMap: Record<string, string> = {
    owner: "org:owner",
    admin: "org:admin",
    veterinarian: "org:veterinarian",
    member: "org:member",
    viewer: "org:viewer",
  };
  return roleMap[role] || "org:member";
}

/**
 * Main migration function
 */
async function main() {
  logger.info(
    DRY_RUN
      ? "DRY RUN MODE - No changes will be made"
      : "LIVE MODE - Creating Clerk organizations",
  );

  const supabase = await createServiceClient();

  // 1. Fetch all clinics without clerk_org_id
  const { data: clinics, error: clinicsError } = await supabase
    .from("clinics")
    .select("id, name, slug")
    .is("clerk_org_id", null);

  if (clinicsError) {
    logger.logError("Failed to fetch clinics", clinicsError);
    process.exit(1);
  }

  if (!clinics || clinics.length === 0) {
    logger.info(
      "No clinics to migrate - all clinics already have clerk_org_id",
    );
    return;
  }

  logger.info(`Found ${clinics.length} clinic(s) to migrate:`, {
    clinics: clinics.map((c) => c.name),
  });

  // 2. For each clinic, fetch members
  const clinicsWithMembers: ClinicToMigrate[] = [];

  for (const clinic of clinics) {
    const { data: members, error: membersError } = await supabase
      .from("user_clinic_access")
      .select(
        `
        user_id,
        role,
        users!inner (
          clerk_user_id,
          email,
          first_name,
          last_name
        )
      `,
      )
      .eq("clinic_id", clinic.id);

    if (membersError) {
      logger.warn(`Failed to fetch members for clinic ${clinic.name}`, {
        error: membersError,
      });
      continue;
    }

    const flattenedMembers = (members || []).map((m: any) => ({
      user_id: m.user_id,
      role: m.role,
      clerk_user_id: m.users.clerk_user_id,
      email: m.users.email,
      first_name: m.users.first_name,
      last_name: m.users.last_name,
    }));

    clinicsWithMembers.push({
      id: clinic.id,
      name: clinic.name,
      slug: clinic.slug,
      members: flattenedMembers,
    });

    logger.info(`Clinic: ${clinic.name}`, {
      totalMembers: flattenedMembers.length,
      membersWithClerkAccounts: flattenedMembers.filter((m) => m.clerk_user_id)
        .length,
    });
  }

  if (DRY_RUN) {
    logger.info("DRY RUN - Would migrate the following clinics:", {
      clinics: clinicsWithMembers.map((c) => ({
        name: c.name,
        slug: c.slug || generateSlug(c.name),
        memberCount: c.members.length,
      })),
    });
    return;
  }

  // 3. Create Clerk Organizations and add members
  for (const clinic of clinicsWithMembers) {
    try {
      logger.info(`Creating Clerk Organization for: ${clinic.name}`);

      // Create Clerk Organization
      const slug = clinic.slug || generateSlug(clinic.name);
      const organization = await clerkClient.organizations.createOrganization({
        name: clinic.name,
        slug,
        createdBy: undefined, // System-created
      });

      logger.info(`✅ Created Clerk Organization: ${clinic.name}`, {
        clerkOrgId: organization.id,
        slug: organization.slug,
      });

      // Update clinic with clerk_org_id
      const { error: updateError } = await supabase
        .from("clinics")
        .update({
          clerk_org_id: organization.id,
          slug: organization.slug, // Ensure slug is consistent
          updated_at: new Date().toISOString(),
        })
        .eq("id", clinic.id);

      if (updateError) {
        logger.logError(
          `Failed to update clinic ${clinic.name} with clerk_org_id`,
          updateError,
        );
        continue;
      }

      logger.info(`✅ Updated clinic ${clinic.name} with clerk_org_id`);

      // Add members who have Clerk accounts
      const membersWithClerk = clinic.members.filter((m) => m.clerk_user_id);

      for (const member of membersWithClerk) {
        try {
          const clerkRole = mapToClerkRole(member.role);

          await clerkClient.organizations.createOrganizationMembership({
            organizationId: organization.id,
            userId: member.clerk_user_id!,
            role: clerkRole,
          });

          logger.info(`  ✅ Added member: ${member.email} as ${clerkRole}`);
        } catch (memberError: any) {
          // If user is already a member, that's fine
          if (memberError?.status === 422) {
            logger.info(
              `  ℹ️ Member ${member.email} already exists in organization`,
            );
          } else {
            logger.warn(`  ⚠️ Failed to add member ${member.email}`, {
              error: memberError?.message || String(memberError),
            });
          }
        }
      }

      const membersWithoutClerk = clinic.members.filter(
        (m) => !m.clerk_user_id,
      );
      if (membersWithoutClerk.length > 0) {
        logger.info(
          `  ℹ️ ${membersWithoutClerk.length} member(s) don't have Clerk accounts yet:`,
          {
            emails: membersWithoutClerk.map((m) => m.email),
            note: "They will be added when they sign in via web app",
          },
        );
      }
    } catch (error: any) {
      logger.logError(`Failed to migrate clinic: ${clinic.name}`, error);
      logger.error("Error details:", {
        message: error?.message,
        status: error?.status,
        errors: error?.errors,
      });
    }
  }

  logger.info("✅ Migration complete!");
}

main().catch((error) => {
  logger.logError("Migration script failed", error);
  process.exit(1);
});

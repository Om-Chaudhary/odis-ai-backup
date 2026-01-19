/**
 * Migrate pilot clinics to Clerk Organizations
 *
 * This script migrates the two pilot clinics to Clerk:
 * - Alum Rock Animal Hospital (garrybath@hotmail.com)
 * - Del Valle Pet Hospital (jattvc@gmail.com)
 *
 * USAGE:
 * pnpm tsx scripts/migrate-pilot-clinics.ts [--dry-run]
 */

import { createServiceClient } from "@odis-ai/data-access/db/server";
import { loggers } from "@odis-ai/shared/logger";
import { clerkClient } from "@clerk/clerk-sdk-node";

const logger = loggers.scripts.child("migrate-pilot-clinics");

const DRY_RUN = process.argv.includes("--dry-run");

// Pilot clinic owners
const PILOT_CLINICS = [
  {
    clinicName: "Alum Rock Animal Hospital",
    ownerEmail: "garrybath@hotmail.com",
    slug: "alum-rock-animal-hospital",
  },
  {
    clinicName: "Del Valle Pet Hospital",
    ownerEmail: "jattvc@gmail.com",
    slug: "del-valle-pet-hospital",
  },
];

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
      ? "🔍 DRY RUN MODE - No changes will be made"
      : "🚀 LIVE MODE - Migrating pilot clinics to Clerk",
  );

  const supabase = await createServiceClient();

  for (const pilotClinic of PILOT_CLINICS) {
    logger.info(`\n${"=".repeat(60)}`);
    logger.info(`Processing: ${pilotClinic.clinicName}`);
    logger.info(`${"=".repeat(60)}\n`);

    try {
      // 1. Find the clinic in Supabase
      const { data: clinic, error: clinicError } = await supabase
        .from("clinics")
        .select("id, name, slug, clerk_org_id")
        .ilike("name", `%${pilotClinic.clinicName}%`)
        .single();

      if (clinicError || !clinic) {
        logger.error(`❌ Clinic not found: ${pilotClinic.clinicName}`, {
          error: clinicError?.message,
        });
        continue;
      }

      logger.info(`✅ Found clinic in database:`, {
        id: clinic.id,
        name: clinic.name,
        hasClerkOrg: !!clinic.clerk_org_id,
      });

      if (clinic.clerk_org_id) {
        logger.info(
          `ℹ️  Clinic already has Clerk Organization ID: ${clinic.clerk_org_id}`,
        );
        logger.info(`   Skipping organization creation...`);
        continue;
      }

      // 2. Find all members of the clinic
      const { data: members, error: membersError } = await supabase
        .from("user_clinic_access")
        .select(
          `
          user_id,
          role,
          is_primary,
          users!inner (
            id,
            email,
            first_name,
            last_name,
            clerk_user_id
          )
        `,
        )
        .eq("clinic_id", clinic.id);

      if (membersError) {
        logger.error(`❌ Failed to fetch members for ${clinic.name}`, {
          error: membersError.message,
        });
        continue;
      }

      const flatMembers = (members || []).map((m: any) => ({
        user_id: m.user_id,
        role: m.role,
        is_primary: m.is_primary,
        email: m.users.email,
        first_name: m.users.first_name,
        last_name: m.users.last_name,
        clerk_user_id: m.users.clerk_user_id,
      }));

      logger.info(`📋 Clinic has ${flatMembers.length} member(s):`);
      for (const member of flatMembers) {
        const name =
          member.first_name || member.last_name
            ? `${member.first_name || ""} ${member.last_name || ""}`.trim()
            : "No name";
        logger.info(
          `   - ${member.email} (${name}) - Role: ${member.role} ${member.clerk_user_id ? "✅ Has Clerk" : "❌ No Clerk"}`,
        );
      }

      // 3. Find the owner user
      const owner = flatMembers.find(
        (m) => m.email.toLowerCase() === pilotClinic.ownerEmail.toLowerCase(),
      );

      if (!owner) {
        logger.error(`❌ Owner not found: ${pilotClinic.ownerEmail}`);
        logger.info(
          `   Available emails:`,
          flatMembers.map((m) => m.email),
        );
        continue;
      }

      logger.info(`\n✅ Found owner: ${owner.email}`);

      // Check if owner has Clerk account
      if (!owner.clerk_user_id) {
        logger.warn(
          `⚠️  Owner ${owner.email} does not have a Clerk account yet`,
        );
        logger.info(`   Next steps for this owner:`);
        logger.info(
          `   1. Ask them to sign up at your web app with email: ${owner.email}`,
        );
        logger.info(
          `   2. They will be automatically linked to their existing account`,
        );
        logger.info(`   3. Then invite them to the organization\n`);
        continue;
      }

      logger.info(`✅ Owner has Clerk account: ${owner.clerk_user_id}`);

      if (DRY_RUN) {
        logger.info(`\n[DRY RUN] Would create Clerk Organization:`);
        logger.info(`   Name: ${clinic.name}`);
        logger.info(`   Slug: ${pilotClinic.slug}`);
        logger.info(`   Created by: ${owner.email} (${owner.clerk_user_id})`);
        logger.info(
          `   Would add ${flatMembers.filter((m) => m.clerk_user_id).length} member(s) with Clerk accounts`,
        );
        continue;
      }

      // 4. Create Clerk Organization
      logger.info(`\n🏗️  Creating Clerk Organization...`);

      const organization = await clerkClient.organizations.createOrganization({
        name: clinic.name,
        slug: pilotClinic.slug,
        createdBy: owner.clerk_user_id,
      });

      logger.info(`✅ Created Clerk Organization:`, {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      });

      // 5. Update clinic with clerk_org_id
      const { error: updateError } = await supabase
        .from("clinics")
        .update({
          clerk_org_id: organization.id,
          slug: organization.slug,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clinic.id);

      if (updateError) {
        logger.error(`❌ Failed to update clinic with clerk_org_id`, {
          error: updateError.message,
        });
        // Try to delete the Clerk org if database update failed
        try {
          await clerkClient.organizations.deleteOrganization(organization.id);
          logger.info(`🗑️  Rolled back: Deleted Clerk Organization`);
        } catch (rollbackError) {
          logger.error(
            `❌ Failed to rollback Clerk Organization`,
            rollbackError,
          );
        }
        continue;
      }

      logger.info(`✅ Updated clinic record with clerk_org_id`);

      // 6. Add all members who have Clerk accounts
      const membersWithClerk = flatMembers.filter((m) => m.clerk_user_id);

      logger.info(
        `\n👥 Adding ${membersWithClerk.length} member(s) to organization...`,
      );

      for (const member of membersWithClerk) {
        try {
          const clerkRole = mapToClerkRole(member.role);

          // Check if already a member (in case of creator)
          const { data: existingMemberships } =
            await clerkClient.organizations.getOrganizationMembershipList({
              organizationId: organization.id,
              limit: 500,
            });

          const alreadyMember = existingMemberships.data.some(
            (m) => m.publicUserData?.userId === member.clerk_user_id,
          );

          if (alreadyMember) {
            logger.info(
              `   ✅ ${member.email} is already a member (organization creator)`,
            );
            continue;
          }

          await clerkClient.organizations.createOrganizationMembership({
            organizationId: organization.id,
            userId: member.clerk_user_id!,
            role: clerkRole,
          });

          logger.info(`   ✅ Added ${member.email} as ${clerkRole}`);
        } catch (memberError: any) {
          if (memberError?.status === 422) {
            logger.info(`   ℹ️  ${member.email} already in organization`);
          } else {
            logger.warn(`   ⚠️  Failed to add ${member.email}:`, {
              error: memberError?.message || String(memberError),
            });
          }
        }
      }

      // 7. List members without Clerk accounts (need invites)
      const membersWithoutClerk = flatMembers.filter((m) => !m.clerk_user_id);
      if (membersWithoutClerk.length > 0) {
        logger.info(
          `\n📧 Members to invite to Clerk (don't have accounts yet):`,
        );
        for (const member of membersWithoutClerk) {
          logger.info(`   - ${member.email} (${member.role})`);
        }
        logger.info(`\n   💡 You can invite them via:`);
        logger.info(
          `   1. Clerk Dashboard → Organizations → ${organization.name} → Invite`,
        );
        logger.info(
          `   2. Or they can sign up at the web app and be automatically linked`,
        );
      }

      logger.info(`\n✅ Successfully migrated: ${clinic.name}\n`);
    } catch (error: any) {
      logger.error(`❌ Failed to migrate ${pilotClinic.clinicName}:`, {
        error: error?.message || String(error),
        status: error?.status,
        errors: error?.errors,
      });
    }
  }

  logger.info(`\n${"=".repeat(60)}`);
  logger.info(`✅ Migration complete!`);
  logger.info(`${"=".repeat(60)}\n`);

  if (DRY_RUN) {
    logger.info(
      `💡 This was a dry run. Run without --dry-run to apply changes.`,
    );
  }
}

main().catch((error) => {
  logger.logError("Migration script failed", error);
  process.exit(1);
});

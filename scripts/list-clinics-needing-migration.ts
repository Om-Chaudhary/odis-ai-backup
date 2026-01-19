/**
 * List clinics that need Clerk Organization migration
 *
 * This script lists all clinics that don't have a clerk_org_id yet.
 *
 * USAGE:
 * pnpm tsx scripts/list-clinics-needing-migration.ts
 */

import { createServiceClient } from "@odis-ai/data-access/db/server";
import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.scripts.child("list-clinics-needing-migration");

async function main() {
  const supabase = await createServiceClient();

  // Fetch all clinics without clerk_org_id
  const { data: clinics, error: clinicsError } = await supabase
    .from("clinics")
    .select(
      `
      id,
      name,
      slug,
      is_active,
      user_clinic_access (
        user_id,
        role,
        users (
          email,
          first_name,
          last_name,
          clerk_user_id
        )
      )
    `,
    )
    .is("clerk_org_id", null);

  if (clinicsError) {
    logger.logError("Failed to fetch clinics", clinicsError);
    process.exit(1);
  }

  if (!clinics || clinics.length === 0) {
    logger.info("✅ All clinics have been migrated to Clerk Organizations");
    return;
  }

  logger.info(`\nFound ${clinics.length} clinic(s) needing migration:\n`);

  for (const clinic of clinics) {
    const members = clinic.user_clinic_access || [];
    const membersWithClerk = members.filter((m: any) => m.users?.clerk_user_id);
    const owners = members.filter((m: any) => m.role === "owner");

    console.log(`📋 ${clinic.name}`);
    console.log(`   ID: ${clinic.id}`);
    console.log(`   Active: ${clinic.is_active ? "Yes" : "No"}`);
    console.log(`   Total Members: ${members.length}`);
    console.log(`   Members with Clerk: ${membersWithClerk.length}`);

    if (owners.length > 0) {
      console.log(`   Owner(s):`);
      for (const owner of owners) {
        const user = owner.users;
        const name =
          user.first_name || user.last_name
            ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
            : "No name";
        console.log(
          `     - ${user.email} (${name}) ${user.clerk_user_id ? "✅ Has Clerk" : "❌ No Clerk"}`,
        );
      }
    }

    console.log("");
  }

  logger.info("\n💡 Next steps:");
  logger.info("1. Review the list above");
  logger.info("2. Run: pnpm tsx scripts/migrate-clinics-to-clerk.ts --dry-run");
  logger.info("3. If dry run looks good, run without --dry-run flag\n");
}

main().catch((error) => {
  logger.logError("Script failed", error);
  process.exit(1);
});

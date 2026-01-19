/**
 * Check the current status of pilot clinics
 *
 * Verifies the state of Alum Rock and Del Valle before migration
 *
 * USAGE:
 * pnpm tsx scripts/check-pilot-clinic-status.ts
 */

import { createServiceClient } from "@odis-ai/data-access/db/server";
import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.scripts.child("check-pilot-clinic-status");

const PILOT_CLINICS = [
  {
    name: "Alum Rock Animal Hospital",
    ownerEmail: "garrybath@hotmail.com",
  },
  {
    name: "Del Valle Pet Hospital",
    ownerEmail: "jattvc@gmail.com",
  },
];

async function main() {
  const supabase = await createServiceClient();

  logger.info("\n📊 Pilot Clinic Status Check\n");
  logger.info("=".repeat(70) + "\n");

  for (const pilotClinic of PILOT_CLINICS) {
    logger.info(`🏥 ${pilotClinic.name}`);
    logger.info("-".repeat(70));

    // Find clinic
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id, name, slug, clerk_org_id, is_active")
      .ilike("name", `%${pilotClinic.name}%`)
      .single();

    if (clinicError || !clinic) {
      logger.error(`❌ Clinic not found in database\n`);
      continue;
    }

    logger.info(`Clinic ID: ${clinic.id}`);
    logger.info(`Active: ${clinic.is_active ? "Yes" : "No"}`);
    logger.info(
      `Has Clerk Org: ${clinic.clerk_org_id ? `Yes (${clinic.clerk_org_id})` : "No"}`,
    );
    logger.info(`Slug: ${clinic.slug || "(none)"}\n`);

    // Find owner
    const { data: ownerData, error: ownerError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, clerk_user_id")
      .ilike("email", pilotClinic.ownerEmail)
      .single();

    if (ownerError || !ownerData) {
      logger.warn(`⚠️  Owner not found: ${pilotClinic.ownerEmail}`);
    } else {
      const ownerName =
        ownerData.first_name || ownerData.last_name
          ? `${ownerData.first_name || ""} ${ownerData.last_name || ""}`.trim()
          : "(No name)";

      logger.info(`Owner: ${ownerData.email} ${ownerName}`);
      logger.info(
        `Owner has Clerk: ${ownerData.clerk_user_id ? `Yes (${ownerData.clerk_user_id})` : "❌ No"}`,
      );

      // Check if owner has access to clinic
      const { data: access } = await supabase
        .from("user_clinic_access")
        .select("role, is_primary")
        .eq("user_id", ownerData.id)
        .eq("clinic_id", clinic.id)
        .single();

      if (access) {
        logger.info(
          `Owner Role: ${access.role} ${access.is_primary ? "(Primary)" : ""}`,
        );
      } else {
        logger.warn(`⚠️  Owner does not have clinic access record!`);
      }
    }

    // Find all clinic members
    const { data: members, error: membersError } = await supabase
      .from("user_clinic_access")
      .select(
        `
        role,
        is_primary,
        users!inner (
          email,
          first_name,
          last_name,
          clerk_user_id
        )
      `,
      )
      .eq("clinic_id", clinic.id);

    if (membersError) {
      logger.error(`Failed to fetch members: ${membersError.message}`);
    } else if (members && members.length > 0) {
      logger.info(`\nAll Members (${members.length}):`);
      for (const member of members) {
        const user = member.users as any;
        const name =
          user.first_name || user.last_name
            ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
            : "(No name)";
        const clerkStatus = user.clerk_user_id ? "✅" : "❌";
        const primaryBadge = member.is_primary ? " [PRIMARY]" : "";

        logger.info(
          `  ${clerkStatus} ${user.email} - ${member.role}${primaryBadge} ${name}`,
        );
      }
    } else {
      logger.warn(`⚠️  No members found for this clinic`);
    }

    logger.info("\n" + "=".repeat(70) + "\n");
  }

  logger.info("✅ Status check complete\n");
  logger.info("Next Steps:");
  logger.info(
    "1. Ensure owners have Clerk accounts (they need to sign up at web app)",
  );
  logger.info("2. Run: pnpm tsx scripts/migrate-pilot-clinics.ts --dry-run");
  logger.info("3. Review the dry run output");
  logger.info(
    "4. Run: pnpm tsx scripts/migrate-pilot-clinics.ts (without --dry-run)\n",
  );
}

main().catch((error) => {
  logger.logError("Script failed", error);
  process.exit(1);
});

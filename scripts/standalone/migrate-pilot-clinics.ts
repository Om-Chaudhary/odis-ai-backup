/**
 * Migrate pilot clinics to Clerk Organizations (Standalone version)
 *
 * This script migrates the two pilot clinics to Clerk:
 * - Alum Rock Animal Hospital (garrybath@hotmail.com)
 * - Del Valle Pet Hospital (jattvc@gmail.com)
 *
 * USAGE:
 * CLERK_SECRET_KEY=sk_xxx SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   pnpm tsx scripts/standalone/migrate-pilot-clinics.ts [--dry-run]
 */

import { createClerkClient } from "@clerk/express";
import { createClient } from "@supabase/supabase-js";

// Get env vars
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CLERK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   CLERK_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

async function main() {
  console.log(
    DRY_RUN
      ? "🔍 DRY RUN MODE - No changes will be made"
      : "🚀 LIVE MODE - Migrating pilot clinics to Clerk",
  );
  console.log("");

  for (const pilotClinic of PILOT_CLINICS) {
    console.log(`${"=".repeat(60)}`);
    console.log(`Processing: ${pilotClinic.clinicName}`);
    console.log(`${"=".repeat(60)}\n`);

    try {
      // 1. Find the clinic in Supabase
      const { data: clinic, error: clinicError } = await supabase
        .from("clinics")
        .select("id, name, slug, clerk_org_id")
        .ilike("name", `%${pilotClinic.clinicName}%`)
        .single();

      if (clinicError || !clinic) {
        console.error(`❌ Clinic not found: ${pilotClinic.clinicName}`, {
          error: clinicError?.message,
        });
        continue;
      }

      console.log(`✅ Found clinic in database:`);
      console.log(`   ID: ${clinic.id}`);
      console.log(`   Name: ${clinic.name}`);
      console.log(`   Has Clerk Org: ${!!clinic.clerk_org_id}`);

      if (clinic.clerk_org_id) {
        console.log(
          `ℹ️  Clinic already has Clerk Organization ID: ${clinic.clerk_org_id}`,
        );
        console.log(`   Skipping organization creation...\n`);
        continue;
      }

      // 2. Find all members of the clinic
      const { data: clinicAccess, error: accessError } = await supabase
        .from("user_clinic_access")
        .select("user_id, role, is_primary")
        .eq("clinic_id", clinic.id);

      if (accessError) {
        console.error(`❌ Failed to fetch clinic access for ${clinic.name}`, {
          error: accessError.message,
        });
        continue;
      }

      if (!clinicAccess || clinicAccess.length === 0) {
        console.log(`ℹ️  No members found for ${clinic.name}`);
        continue;
      }

      // 3. Get user details for all members
      const userIds = clinicAccess.map((access) => access.user_id);
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, clerk_user_id")
        .in("id", userIds);

      if (usersError) {
        console.error(`❌ Failed to fetch user details for ${clinic.name}`, {
          error: usersError.message,
        });
        continue;
      }

      // 4. Combine clinic access with user details
      const flatMembers = clinicAccess.map((access) => {
        const user = users?.find((u) => u.id === access.user_id);
        return {
          user_id: access.user_id,
          role: access.role,
          is_primary: access.is_primary,
          email: user?.email || "",
          first_name: user?.first_name || null,
          last_name: user?.last_name || null,
          clerk_user_id: user?.clerk_user_id || null,
        };
      });

      console.log(`📋 Clinic has ${flatMembers.length} member(s):`);
      for (const member of flatMembers) {
        const name =
          member.first_name || member.last_name
            ? `${member.first_name || ""} ${member.last_name || ""}`.trim()
            : "No name";
        console.log(
          `   - ${member.email} (${name}) - Role: ${member.role} ${member.clerk_user_id ? "✅ Has Clerk" : "❌ No Clerk"}`,
        );
      }

      // 5. Find the owner user
      const owner = flatMembers.find(
        (m) => m.email.toLowerCase() === pilotClinic.ownerEmail.toLowerCase(),
      );

      if (!owner) {
        console.error(`❌ Owner not found: ${pilotClinic.ownerEmail}`);
        console.log(
          `   Available emails:`,
          flatMembers.map((m) => m.email),
        );
        continue;
      }

      console.log(`\n✅ Found owner: ${owner.email}`);

      // Check if owner has Clerk account
      if (!owner.clerk_user_id) {
        console.log(
          `⚠️  Owner ${owner.email} does not have a Clerk account yet`,
        );
        console.log(`   Next steps for this owner:`);
        console.log(
          `   1. Ask them to sign up at your web app with email: ${owner.email}`,
        );
        console.log(
          `   2. They will be automatically linked to their existing account`,
        );
        console.log(`   3. Then run this script again\n`);
        continue;
      }

      console.log(`✅ Owner has Clerk account: ${owner.clerk_user_id}`);

      if (DRY_RUN) {
        console.log(`\n[DRY RUN] Would create Clerk Organization:`);
        console.log(`   Name: ${clinic.name}`);
        console.log(`   Slug: ${pilotClinic.slug}`);
        console.log(`   Created by: ${owner.email} (${owner.clerk_user_id})`);
        console.log(
          `   Would add ${flatMembers.filter((m) => m.clerk_user_id).length} member(s) with Clerk accounts\n`,
        );
        continue;
      }

      // 6. Create Clerk Organization
      console.log(`\n🏗️  Creating Clerk Organization...`);

      const organization = await clerkClient.organizations.createOrganization({
        name: clinic.name,
        slug: pilotClinic.slug,
        createdBy: owner.clerk_user_id,
      });

      console.log(`✅ Created Clerk Organization:`);
      console.log(`   ID: ${organization.id}`);
      console.log(`   Name: ${organization.name}`);
      console.log(`   Slug: ${organization.slug}`);

      // 7. Update clinic with clerk_org_id
      const { error: updateError } = await supabase
        .from("clinics")
        .update({
          clerk_org_id: organization.id,
          slug: organization.slug,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clinic.id);

      if (updateError) {
        console.error(`❌ Failed to update clinic with clerk_org_id`, {
          error: updateError.message,
        });
        // Try to delete the Clerk org if database update failed
        try {
          await clerkClient.organizations.deleteOrganization(organization.id);
          console.log(`🗑️  Rolled back: Deleted Clerk Organization`);
        } catch (rollbackError) {
          console.error(
            `❌ Failed to rollback Clerk Organization`,
            rollbackError,
          );
        }
        continue;
      }

      console.log(`✅ Updated clinic record with clerk_org_id`);

      // 8. Add all members who have Clerk accounts
      const membersWithClerk = flatMembers.filter((m) => m.clerk_user_id);

      console.log(
        `\n👥 Adding ${membersWithClerk.length} member(s) to organization...`,
      );

      for (const member of membersWithClerk) {
        try {
          const clerkRole = mapToClerkRole(member.role);

          // Check if already a member (in case of creator)
          const existingMemberships =
            await clerkClient.organizations.getOrganizationMembershipList({
              organizationId: organization.id,
              limit: 500,
            });

          const alreadyMember =
            existingMemberships?.data?.some(
              (m) => m.publicUserData?.userId === member.clerk_user_id,
            ) || false;

          if (alreadyMember) {
            console.log(
              `   ✅ ${member.email} is already a member (organization creator)`,
            );
            continue;
          }

          await clerkClient.organizations.createOrganizationMembership({
            organizationId: organization.id,
            userId: member.clerk_user_id!,
            role: clerkRole,
          });

          console.log(`   ✅ Added ${member.email} as ${clerkRole}`);
        } catch (memberError: any) {
          if (memberError?.status === 422) {
            console.log(`   ℹ️  ${member.email} already in organization`);
          } else {
            console.log(`   ⚠️  Failed to add ${member.email}:`, {
              error: memberError?.message || String(memberError),
            });
          }
        }
      }

      // 9. List members without Clerk accounts (need invites)
      const membersWithoutClerk = flatMembers.filter((m) => !m.clerk_user_id);
      if (membersWithoutClerk.length > 0) {
        console.log(
          `\n📧 Members to invite to Clerk (don't have accounts yet):`,
        );
        for (const member of membersWithoutClerk) {
          console.log(`   - ${member.email} (${member.role})`);
        }
        console.log(`\n   💡 You can invite them via:`);
        console.log(
          `   1. Clerk Dashboard → Organizations → ${organization.name} → Invite`,
        );
        console.log(
          `   2. Or they can sign up at the web app and be automatically linked`,
        );
      }

      console.log(`\n✅ Successfully migrated: ${clinic.name}\n`);
    } catch (error: any) {
      console.error(`❌ Failed to migrate ${pilotClinic.clinicName}:`, {
        error: error?.message || String(error),
        status: error?.status,
        errors: error?.errors,
      });
    }
  }

  console.log(`${"=".repeat(60)}`);
  console.log(`✅ Migration complete!`);
  console.log(`${"=".repeat(60)}\n`);

  if (DRY_RUN) {
    console.log(
      `💡 This was a dry run. Run without --dry-run to apply changes.`,
    );
  }
}

main().catch((error) => {
  console.error("Migration script failed", error);
  process.exit(1);
});

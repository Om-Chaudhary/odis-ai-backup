/**
 * Link Clerk account to existing Supabase user
 *
 * Use this when a user signed up with Clerk but the webhook didn't link their account
 *
 * USAGE:
 * pnpm tsx scripts/link-clerk-account.ts <email>
 *
 * Required env vars:
 * - CLERK_SECRET_KEY
 * - SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClerkClient } from "@clerk/express";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";

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
const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Email required");
    console.log("Usage: pnpm tsx scripts/link-clerk-account.ts <email>");
    process.exit(1);
  }

  console.log(`🔗 Linking Clerk account for: ${email}\n`);

  // 1. Find Clerk user
  const clerkUsers = await clerkClient.users.getUserList({
    emailAddress: [email],
  });

  if (clerkUsers.data.length === 0) {
    console.error(`❌ No Clerk user found with email: ${email}`);
    console.log(`   User needs to sign up at the web app first`);
    process.exit(1);
  }

  const clerkUser = clerkUsers.data[0];
  console.log(`✅ Found Clerk user: ${clerkUser.id}`);

  // 2. Find Supabase user
  const { data: supabaseUser, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (userError || !supabaseUser) {
    console.error(`❌ No Supabase user found with email: ${email}`);
    console.log(`   Use sync-clerk-user.ts to create a new user record`);
    process.exit(1);
  }

  console.log(`✅ Found Supabase user: ${supabaseUser.id}`);

  // 3. Check if already linked
  if (supabaseUser.clerk_user_id) {
    if (supabaseUser.clerk_user_id === clerkUser.id) {
      console.log(`✅ Account already linked!`);
      process.exit(0);
    } else {
      console.log(
        `⚠️  User already linked to different Clerk account: ${supabaseUser.clerk_user_id}`,
      );
      console.log(
        `   This might be a problem. Check if there are duplicate accounts.`,
      );
      process.exit(1);
    }
  }

  // 4. Link accounts
  console.log(`\n🔗 Linking accounts...`);

  const { error: updateError } = await supabase
    .from("users")
    .update({
      clerk_user_id: clerkUser.id,
      // Update name/avatar if Clerk has better data
      first_name: clerkUser.firstName || supabaseUser.first_name,
      last_name: clerkUser.lastName || supabaseUser.last_name,
      avatar_url: clerkUser.imageUrl || supabaseUser.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", supabaseUser.id);

  if (updateError) {
    console.error(`❌ Failed to link accounts:`, updateError);
    process.exit(1);
  }

  console.log(`✅ Successfully linked accounts!`);
  console.log(`   Supabase ID: ${supabaseUser.id}`);
  console.log(`   Clerk ID: ${clerkUser.id}`);
  console.log(`   Email: ${email}\n`);

  // 5. Check organizations and sync clinic access
  const orgs = await clerkClient.users.getOrganizationMembershipList({
    userId: clerkUser.id,
  });

  if (orgs.data.length > 0) {
    console.log(`📋 User is in ${orgs.data.length} organization(s):`);

    for (const membership of orgs.data) {
      console.log(`\n   Organization: ${membership.organization.name}`);
      console.log(`   Role: ${membership.role}`);

      // Find clinic with this clerk_org_id
      const { data: clinic } = await supabase
        .from("clinics")
        .select("id, name")
        .eq("clerk_org_id", membership.organization.id)
        .single();

      if (clinic) {
        // Check if user already has access
        const { data: existingAccess } = await supabase
          .from("user_clinic_access")
          .select("*")
          .eq("user_id", supabaseUser.id)
          .eq("clinic_id", clinic.id)
          .single();

        if (existingAccess) {
          console.log(`   ✅ Already has access to: ${clinic.name}`);
        } else {
          // Add clinic access
          const roleMap: Record<string, string> = {
            "org:owner": "owner",
            "org:admin": "admin",
            "org:veterinarian": "veterinarian",
            "org:member": "member",
            "org:viewer": "viewer",
          };

          const role = roleMap[membership.role] || "member";

          // Check if this is the user's first clinic
          const { count } = await supabase
            .from("user_clinic_access")
            .select("*", { count: "exact", head: true })
            .eq("user_id", supabaseUser.id);

          const isPrimary = (count ?? 0) === 0;

          const { error: accessError } = await supabase
            .from("user_clinic_access")
            .insert({
              user_id: supabaseUser.id,
              clinic_id: clinic.id,
              role,
              is_primary: isPrimary,
            });

          if (accessError) {
            console.log(
              `   ⚠️  Failed to add clinic access: ${accessError.message}`,
            );
          } else {
            console.log(
              `   ✅ Added access to: ${clinic.name} (${role}${isPrimary ? ", primary" : ""})`,
            );
          }
        }
      } else {
        console.log(
          `   ⚠️  No clinic found for organization: ${membership.organization.name}`,
        );
        console.log(
          `      Run clinic migration script to link this organization`,
        );
      }
    }
  }

  console.log(`\n✅ Account linking complete! User can now sign in.\n`);
}

main().catch((error) => {
  console.error("Script failed", error);
  process.exit(1);
});

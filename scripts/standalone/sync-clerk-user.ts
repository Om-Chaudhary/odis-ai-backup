/**
 * Manually sync a Clerk user to Supabase (Standalone version)
 *
 * Use this when a user signed up with Clerk but no Supabase record was created
 *
 * USAGE:
 * CLERK_SECRET_KEY=sk_xxx SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   pnpm tsx scripts/standalone/sync-clerk-user.ts <email>
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

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Email required");
    console.log(
      "Usage: pnpm tsx scripts/standalone/sync-clerk-user.ts <email>",
    );
    process.exit(1);
  }

  console.log(`🔄 Syncing Clerk user to Supabase: ${email}\n`);

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
  console.log(`✅ Found Clerk user:`);
  console.log(`   ID: ${clerkUser.id}`);
  console.log(`   Email: ${clerkUser.emailAddresses[0]?.emailAddress}`);
  console.log(
    `   Name: ${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`,
  );

  // 2. Check if already exists in Supabase
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_user_id", clerkUser.id)
    .single();

  if (existingUser) {
    console.log(`✅ User already synced to Supabase: ${existingUser.id}`);
    process.exit(0);
  }

  // Check by email (might be unlinked)
  const { data: emailUser } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (emailUser && !emailUser.clerk_user_id) {
    console.log(`⚠️  Found existing Supabase user without Clerk link`);
    console.log(
      `   Use link-clerk-account.ts to link instead of creating new record`,
    );
    process.exit(1);
  }

  // 3. Create new user record
  console.log(`\n🆕 Creating new Supabase user record...`);

  const primaryEmail =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress || email;

  const { data: newUser, error: insertError } = await supabase
    .from("users")
    .insert({
      clerk_user_id: clerkUser.id,
      email: primaryEmail,
      first_name: clerkUser.firstName || null,
      last_name: clerkUser.lastName || null,
      avatar_url: clerkUser.imageUrl || null,
    })
    .select()
    .single();

  if (insertError) {
    console.error(`❌ Failed to create user:`, insertError);
    process.exit(1);
  }

  console.log(`✅ Created Supabase user: ${newUser.id}`);

  // 4. Check organizations and create clinic access
  const orgs = await clerkClient.users.getOrganizationMembershipList({
    userId: clerkUser.id,
  });

  if (orgs.data.length > 0) {
    console.log(`\n📋 Adding user to ${orgs.data.length} organization(s)...`);

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
        // Map Clerk role to ODIS role
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
          .eq("user_id", newUser.id);

        const isPrimary = (count ?? 0) === 0;

        const { error: accessError } = await supabase
          .from("user_clinic_access")
          .insert({
            user_id: newUser.id,
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
      } else {
        console.log(
          `   ⚠️  No clinic found for organization: ${membership.organization.name}`,
        );
        console.log(`      Clerk org ID: ${membership.organization.id}`);
        console.log(`      Run clinic migration to sync this organization`);
      }
    }
  } else {
    console.log(`\nℹ️  User is not in any organizations yet`);
    console.log(`   They can create/join an organization in the app`);
  }

  console.log(`\n✅ User sync complete! User can now sign in.\n`);
}

main().catch((error) => {
  console.error("Script failed", error);
  process.exit(1);
});

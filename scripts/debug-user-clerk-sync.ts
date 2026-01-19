/**
 * Debug user Clerk sync status
 *
 * Checks if a user's Clerk account is properly synced to Supabase
 *
 * USAGE:
 * pnpm tsx scripts/debug-user-clerk-sync.ts <email>
 *
 * Required env vars:
 * - CLERK_SECRET_KEY
 * - SUPABASE_URL (or use --supabase-url flag)
 * - SUPABASE_SERVICE_ROLE_KEY (or use --service-key flag)
 */

import { createClerkClient } from "@clerk/express";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";

// Get env vars with fallback to CLI args
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY is required");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  console.error("Set them as environment variables or in .env file");
  process.exit(1);
}

const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });
const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

const log = (level: string, message: string, data?: any) => {
  const prefix = level === "error" ? "❌" : level === "warn" ? "⚠️" : "ℹ️";
  console.log(`${prefix} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Email required");
    console.log("Usage: pnpm tsx scripts/debug-user-clerk-sync.ts <email>");
    process.exit(1);
  }

  console.log(`\n🔍 Debugging user sync for: ${email}\n`);

  // 1. Check Clerk
  console.log("1️⃣ Checking Clerk...");
  try {
    const clerkUsers = await clerkClient.users.getUserList({
      emailAddress: [email],
    });

    if (clerkUsers.data.length === 0) {
      console.log(`❌ No Clerk user found with email: ${email}`);
      console.log(`   User needs to sign up at the web app first\n`);
    } else {
      const clerkUser = clerkUsers.data[0];
      console.log(`✅ Found Clerk user:`);
      console.log(`   Clerk User ID: ${clerkUser.id}`);
      console.log(`   Email: ${clerkUser.emailAddresses[0]?.emailAddress}`);
      console.log(
        `   Name: ${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`,
      );
      console.log(
        `   Created: ${new Date(clerkUser.createdAt).toLocaleString()}`,
      );

      // Check organizations
      const orgs = await clerkClient.users.getOrganizationMembershipList({
        userId: clerkUser.id,
      });

      if (orgs.data.length > 0) {
        console.log(`\n   Organizations (${orgs.data.length}):`);
        for (const org of orgs.data) {
          console.log(`     - ${org.organization.name} (${org.role})`);
        }
      } else {
        console.log(`   ⚠️  Not a member of any organizations`);
      }

      console.log("");

      // Check if synced to Supabase
      console.log("2️⃣ Checking Supabase sync...");
      const { data: supabaseUser, error } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_user_id", clerkUser.id)
        .single();

      if (error || !supabaseUser) {
        console.log(`❌ Clerk user NOT synced to Supabase!`);
        console.log(
          `   clerk_user_id: ${clerkUser.id} not found in users table`,
        );
        console.log(
          `\n   This is the problem! The webhook didn't sync the user.`,
        );
        console.log(`   Possible causes:`);
        console.log(`   - Webhook failed to fire`);
        console.log(`   - Webhook endpoint not reachable`);
        console.log(`   - Error during webhook processing\n`);

        // Check if user exists by email (might be an account linking issue)
        const { data: emailUser } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();

        if (emailUser) {
          console.log(`   ℹ️  Found existing Supabase user with same email:`);
          console.log(`      Supabase ID: ${emailUser.id}`);
          console.log(
            `      clerk_user_id: ${emailUser.clerk_user_id || "(null - NOT LINKED)"}`,
          );
          console.log(`      Email: ${emailUser.email}`);
          console.log(
            `\n   ✅ Solution: Link the accounts by updating clerk_user_id:`,
          );
          console.log(
            `      Run: pnpm tsx scripts/link-clerk-account.ts ${email}\n`,
          );
        } else {
          console.log(`   ✅ Solution: Manually create the user record:`);
          console.log(
            `      Run: pnpm tsx scripts/sync-clerk-user.ts ${email}\n`,
          );
        }
      } else {
        console.log(`✅ User synced to Supabase:`);
        console.log(`   Supabase ID: ${supabaseUser.id}`);
        console.log(`   Clerk User ID: ${supabaseUser.clerk_user_id}`);
        console.log(`   Email: ${supabaseUser.email}`);
        console.log(
          `   Name: ${supabaseUser.first_name || ""} ${supabaseUser.last_name || ""}`,
        );

        // Check clinic access
        console.log("\n3️⃣ Checking clinic access...");
        const { data: clinicAccess } = await supabase
          .from("user_clinic_access")
          .select(
            `
            role,
            is_primary,
            clinics (
              id,
              name,
              clerk_org_id
            )
          `,
          )
          .eq("user_id", supabaseUser.id);

        if (!clinicAccess || clinicAccess.length === 0) {
          console.log(`⚠️  User has no clinic access`);
          console.log(`   User needs to:`);
          console.log(`   1. Create a new clinic (organization) in Clerk`);
          console.log(`   2. OR be invited to an existing organization\n`);
        } else {
          console.log(
            `✅ User has access to ${clinicAccess.length} clinic(s):`,
          );
          for (const access of clinicAccess) {
            const clinic = access.clinics as any;
            console.log(`   - ${clinic.name}`);
            console.log(
              `     Role: ${access.role} ${access.is_primary ? "(Primary)" : ""}`,
            );
            console.log(
              `     Clerk Org ID: ${clinic.clerk_org_id || "❌ NOT LINKED TO CLERK"}`,
            );
          }
          console.log("");
        }

        console.log(
          "✅ All checks passed! User should be able to access the app.\n",
        );
      }
    }
  } catch (error: any) {
    console.error("Error checking Clerk:", error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
  }
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});

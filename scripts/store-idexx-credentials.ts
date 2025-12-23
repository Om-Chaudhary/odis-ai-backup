/**
 * Script to store encrypted IDEXX credentials
 *
 * Usage:
 *   pnpm tsx scripts/store-idexx-credentials.ts
 *
 * Before running:
 *   1. Set ENCRYPTION_KEY in your environment
 *   2. Update the userId, clinicId, and credentials below
 */

/* eslint-disable @nx/enforce-module-boundaries */
import { IdexxCredentialManager } from "@odis-ai/idexx";

async function main() {
  // ===========================================
  // CONFIGURE THESE VALUES
  // ===========================================

  // Get user ID from your users table
  const userId = "YOUR_USER_UUID_HERE";

  // Get clinic ID from your clinics table (or null if not clinic-specific)
  const clinicId: string | null = "YOUR_CLINIC_UUID_HERE";

  // Your IDEXX Neo login credentials
  const idexxUsername = "your-idexx-username";
  const idexxPassword = "your-idexx-password";

  // ===========================================

  // Verify encryption key is set
  if (!process.env.ENCRYPTION_KEY) {
    console.error("❌ ENCRYPTION_KEY environment variable is not set!");
    console.log("\nSet it with:");
    console.log('  export ENCRYPTION_KEY="your-32-character-key-here"');
    process.exit(1);
  }

  console.log("🔐 Storing IDEXX credentials...\n");
  console.log(`  User ID: ${userId}`);
  console.log(`  Clinic ID: ${clinicId ?? "(none)"}`);
  console.log(`  Username: ${idexxUsername}`);
  console.log(`  Password: ${"*".repeat(idexxPassword.length)}`);

  try {
    // Create credential manager (uses service client internally)
    const credentialManager = await IdexxCredentialManager.create();

    // Store the credentials (automatically encrypts)
    const result = await credentialManager.storeCredentials(
      userId,
      clinicId,
      idexxUsername,
      idexxPassword,
    );

    console.log("\n✅ Credentials stored successfully!");
    console.log(`  Credential ID: ${result.id}`);

    // Verify by retrieving them
    console.log("\n🔍 Verifying credentials can be retrieved...");
    const retrieved = await credentialManager.getCredentials(userId, clinicId);

    if (retrieved) {
      console.log("✅ Credentials verified!");
      console.log(`  Decrypted username: ${retrieved.username}`);
      console.log(
        `  Decrypted password: ${"*".repeat(retrieved.password.length)}`,
      );
    } else {
      console.log("❌ Could not retrieve credentials");
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main().catch(console.error);

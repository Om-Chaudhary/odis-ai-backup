#!/usr/bin/env node
/**
 * Script to update database types from Supabase
 *
 * Generates TypeScript types from Supabase database schema to:
 *   libs/shared/types/src/database.types.ts
 *
 * Usage:
 *   pnpm update-types
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL or PROJECT_REF environment variable
 *   - Supabase CLI will be installed via npx if not present
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync, existsSync, writeFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load environment variables from .env or .env.local file
 */
function loadEnvFile() {
  const rootDir = process.cwd();
  const envPath = path.join(rootDir, ".env");
  const envLocalPath = path.join(rootDir, ".env.local");

  let envFilePath = null;
  if (existsSync(envPath)) {
    envFilePath = envPath;
  } else if (existsSync(envLocalPath)) {
    envFilePath = envLocalPath;
  }

  if (!envFilePath) {
    return;
  }

  try {
    const envContent = readFileSync(envFilePath, "utf-8");
    const lines = envContent.split("\n");

    for (const line of lines) {
      // Skip comments and empty lines
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      // Parse KEY=VALUE format
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match && match[1] && match[2] !== undefined) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        // Only set if not already in process.env (env vars take precedence)
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch (error) {
    // Silently fail if we can't read the file
    console.warn(`⚠️  Could not read ${envFilePath}:`, error);
  }
}

/**
 * Fix known issues in generated Supabase types
 * This addresses TypeScript linting errors that occur in generated code
 */
function fixGeneratedTypes(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  let content = readFileSync(filePath, "utf-8");
  let modified = false;

  // Fix: Remove redundant 'never' in union type for CompositeTypes
  // When CompositeTypes is empty, keyof DefaultSchema["CompositeTypes"] is 'never'
  // This creates a redundant union: never | { schema: ... }
  // We fix it by conditionally including the keyof only when it's not never
  // Pattern matches the Supabase-generated format (handles both single-line and multiline):
  //   PublicCompositeTypeNameOrOptions extends
  //     | keyof DefaultSchema["CompositeTypes"]
  //     | { schema: keyof DatabaseWithoutInternals },
  // Use a more flexible pattern that matches the key structure
  const compositeTypesRegex =
    /(export type CompositeTypes<\s*PublicCompositeTypeNameOrOptions extends\s*[\s\n]*\| keyof DefaultSchema\["CompositeTypes"\]\s*[\s\n]*\| \{ schema: keyof DatabaseWithoutInternals \},)/s;

  if (
    compositeTypesRegex.test(content) &&
    !content.includes('keyof DefaultSchema["CompositeTypes"] extends never')
  ) {
    content = content.replace(
      compositeTypesRegex,
      `export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] extends never
    ? { schema: keyof DatabaseWithoutInternals }
    : keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },`,
    );
    modified = true;
  }

  if (modified) {
    writeFileSync(filePath, content, "utf-8");
    console.log("🔧 Fixed redundant 'never' type in CompositeTypes");
  }
}

// Load environment variables from .env or .env.local
loadEnvFile();

// Get project ref from NEXT_PUBLIC_SUPABASE_URL or PROJECT_REF
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const projectRefEnv = process.env.PROJECT_REF || "";

let projectRef = projectRefEnv;

// Extract project ref from URL if not set
if (!projectRef && supabaseUrl) {
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (match && match[1]) {
    projectRef = match[1];
  }
}

if (!projectRef) {
  console.error("❌ Error: Could not determine Supabase project ref.");
  console.error("");
  console.error("Please set one of the following:");
  console.error(
    "  - NEXT_PUBLIC_SUPABASE_URL (e.g., https://your-ref.supabase.co)",
  );
  console.error("  - PROJECT_REF (e.g., your-ref)");
  console.error("");
  process.exit(1);
}

console.log(`📦 Generating types for project: ${projectRef}`);

// Check if project is linked
const supabaseConfigPath = path.join(process.cwd(), ".supabase", "config.toml");
if (!existsSync(supabaseConfigPath)) {
  console.warn(
    "⚠️  Project not linked. Attempting to use --project-id instead...",
  );
  console.warn("   For faster, non-hanging execution, run:");
  console.warn(`   npx supabase link --project-ref ${projectRef}`);
  console.warn("");
}

try {
  // Generate to libs/shared/types for the Nx monorepo structure
  const outputPath = path.join(
    process.cwd(),
    "libs",
    "shared",
    "types",
    "src",
    "database.types.ts",
  );

  // Try --linked first (faster, no auth prompt), fallback to --project-id
  let command;
  if (existsSync(supabaseConfigPath)) {
    command = `npx supabase gen types typescript --linked > "${outputPath}"`;
  } else {
    command = `npx supabase gen types typescript --project-id "${projectRef}" > "${outputPath}"`;
    console.warn("⚠️  Using --project-id (may prompt for authentication)");
  }

  execSync(command, {
    stdio: "inherit",
    env: { ...process.env },
    timeout: 60000, // 60 second timeout to prevent infinite hanging
  });

  // Fix known issues in generated types
  fixGeneratedTypes(outputPath);

  console.log(`✅ Types generated successfully at: ${outputPath}`);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("❌ Failed to generate types:", errorMessage);
  console.error("");
  console.error("Troubleshooting:");
  console.error("1. Make sure you're logged in: npx supabase login");
  console.error(
    `2. Link your project: npx supabase link --project-ref ${projectRef}`,
  );
  console.error("3. Then run this script again");
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Script to update database types from Supabase
 *
 * Generates TypeScript types from Supabase database schema to:
 *   libs/types/src/database.types.ts
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
import { readFileSync, existsSync } from "fs";

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

try {
  // Generate to libs/types for the Nx monorepo structure
  const outputPath = path.join(
    process.cwd(),
    "libs",
    "types",
    "src",
    "database.types.ts",
  );
  const command = `npx supabase gen types --lang=typescript --project-id "${projectRef}" > "${outputPath}"`;

  execSync(command, {
    stdio: "inherit",
    env: { ...process.env },
  });

  console.log(`✅ Types generated successfully at: ${outputPath}`);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("❌ Failed to generate types:", errorMessage);
  process.exit(1);
}

/**
 * PIMS Sync Service Configuration
 *
 * Environment variable validation and configuration export.
 * Uses Zod for runtime validation following monorepo patterns.
 */

import { z } from "zod";

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),

  // Supabase configuration
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // Encryption configuration (used by @odis-ai/shared/crypto for credential decryption)
  IDEXX_ENCRYPTION_KEY: z
    .string()
    .min(32, "IDEXX_ENCRYPTION_KEY must be at least 32 characters"),

  // Browser configuration
  HEADLESS: z
    .string()
    .transform((val) => val !== "false")
    .default("true"),
  SYNC_TIMEOUT_MS: z.coerce.number().default(300000), // 5 minutes

  // Scheduler configuration
  ENABLE_SCHEDULER: z
    .string()
    .transform((val) => val !== "false")
    .default("true"),
});

/**
 * Parsed and validated configuration
 */
function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment configuration:");
    console.error(result.error.format());
    throw new Error("Invalid environment configuration");
  }

  return result.data;
}

export const config = loadConfig();

export type Config = z.infer<typeof envSchema>;

// Re-export constants
export * from "./constants";

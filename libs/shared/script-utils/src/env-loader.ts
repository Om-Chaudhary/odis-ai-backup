/**
 * Environment variable loading utilities for scripts
 */
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

interface LoadEnvOptions {
  /** Required environment variables that must be present */
  required?: string[];
  /** Optional: path to project root (defaults to process.cwd()) */
  projectRoot?: string;
}

/**
 * Loads environment variables from .env.local and .env files
 * Validates that required variables are present
 *
 * @example
 * loadScriptEnv({ required: ["SUPABASE_SERVICE_ROLE_KEY"] });
 */
export function loadScriptEnv(options: LoadEnvOptions = {}): void {
  const { required = [], projectRoot = process.cwd() } = options;

  // Load .env.local first (takes precedence), then .env
  const envLocalPath = resolve(projectRoot, ".env.local");
  const envPath = resolve(projectRoot, ".env");

  if (existsSync(envLocalPath)) {
    config({ path: envLocalPath });
  }
  if (existsSync(envPath)) {
    config({ path: envPath });
  }

  // Validate required variables
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

/**
 * Gets an environment variable or throws if not present
 *
 * @example
 * const apiKey = requireEnv("API_KEY");
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 *
 * @example
 * const limit = optionalEnv("LIMIT", "100");
 */
export function optionalEnv(name: string, defaultValue = ""): string {
  return process.env[name] ?? defaultValue;
}

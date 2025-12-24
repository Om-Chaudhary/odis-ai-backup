/**
 * Extension Environment Configuration
 *
 * Environment variables are injected at build time via Vite's define config.
 * For Chrome extensions, we use process.env.CEB_* variables.
 */

export interface ExtensionEnv {
  CEB_SUPABASE_URL: string;
  CEB_SUPABASE_ANON_KEY: string;
  CEB_API_URL: string;
  CEB_DEV: string;
  NODE_ENV: string;
}

// These values are replaced at build time by Vite
const env: ExtensionEnv = {
  CEB_SUPABASE_URL: process.env.CEB_SUPABASE_URL ?? "",
  CEB_SUPABASE_ANON_KEY: process.env.CEB_SUPABASE_ANON_KEY ?? "",
  CEB_API_URL: process.env.CEB_API_URL ?? "",
  CEB_DEV: process.env.CEB_DEV ?? "false",
  NODE_ENV: process.env.NODE_ENV ?? "production",
};

export const IS_DEV = env.CEB_DEV === "true" || env.NODE_ENV === "development";
export const IS_PROD = !IS_DEV;
export const IS_FIREFOX = false; // Set via build flag if needed

export default env;

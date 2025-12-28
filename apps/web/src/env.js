import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Environment detection helper
const getEnvironment = () => {
  if (process.env.NODE_ENV === "production") {
    // In production, check for environment-specific variables
    if (process.env.VERCEL_ENV === "preview") return "staging";
    return "production";
  }
  return "development";
};

const currentEnv = getEnvironment();

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    // AI Configuration
    ANTHROPIC_API_KEY: z.string().optional(),
    // VAPI Configuration
    VAPI_PRIVATE_KEY: z.string().optional(),
    VAPI_ASSISTANT_ID: z.string().optional(),
    VAPI_PHONE_NUMBER_ID: z.string().optional(),
    VAPI_WEBHOOK_SECRET: z.string().optional(),
    VAPI_DEFAULT_INBOUND_ASSISTANT_ID: z.string().optional(),
    // Email Configuration
    RESEND_API_KEY: z.string().min(1),
    // IDEXX Credential Encryption
    IDEXX_ENCRYPTION_KEY: z.string().min(32), // Minimum 32 bytes (256 bits) for AES-256
    // IDEXX Sync Service URL (for cron-triggered schedule syncs)
    IDEXX_SYNC_SERVICE_URL: z.string().url().optional(),
    // Environment identifier
    APP_ENV: z
      .enum(["development", "staging", "production"])
      .default(currentEnv),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    // Site URL for SEO and canonical links
    NEXT_PUBLIC_SITE_URL: z.string().url().default("https://odisai.net"),
    // Environment identifier for client-side
    NEXT_PUBLIC_APP_ENV: z
      .enum(["development", "staging", "production"])
      .default(currentEnv),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    VAPI_PRIVATE_KEY: process.env.VAPI_PRIVATE_KEY,
    VAPI_ASSISTANT_ID: process.env.VAPI_ASSISTANT_ID,
    VAPI_PHONE_NUMBER_ID: process.env.VAPI_PHONE_NUMBER_ID,
    VAPI_WEBHOOK_SECRET: process.env.VAPI_WEBHOOK_SECRET,
    VAPI_DEFAULT_INBOUND_ASSISTANT_ID:
      process.env.VAPI_DEFAULT_INBOUND_ASSISTANT_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    IDEXX_ENCRYPTION_KEY: process.env.IDEXX_ENCRYPTION_KEY,
    IDEXX_SYNC_SERVICE_URL: process.env.IDEXX_SYNC_SERVICE_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    APP_ENV: currentEnv,
    NEXT_PUBLIC_APP_ENV: currentEnv,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});

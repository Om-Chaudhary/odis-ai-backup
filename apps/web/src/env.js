import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Environment detection helper
const getEnvironment = () => {
  if (process.env.NODE_ENV === "production") {
    if (process.env.VERCEL_ENV === "preview") return "staging";
    return "production";
  }
  return "development";
};

const currentEnv = getEnvironment();

export const env = createEnv({
  /**
   * Server-side environment variables schema.
   * These are only available on the server and will throw if accessed on the client.
   */
  server: {
    // =========================================================================
    // CORE
    // =========================================================================
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_ENV: z
      .enum(["development", "staging", "production"])
      .default(currentEnv),

    // =========================================================================
    // SUPABASE
    // =========================================================================
    SUPABASE_URL: z.string().url().optional(), // Used by pims-sync service
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    // =========================================================================
    // CLERK (Auth)
    // =========================================================================
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_WEBHOOK_SECRET: z.string().min(1),

    // =========================================================================
    // ANTHROPIC (Claude API)
    // =========================================================================
    ANTHROPIC_API_KEY: z.string().min(1),

    // =========================================================================
    // VAPI (Voice AI Platform)
    // =========================================================================
    VAPI_PRIVATE_KEY: z.string().min(1),
    VAPI_ASSISTANT_ID: z.string().optional(),
    VAPI_PHONE_NUMBER_ID: z.string().optional(),
    VAPI_WEBHOOK_SECRET: z.string().min(1),
    VAPI_DEFAULT_INBOUND_ASSISTANT_ID: z.string().optional(),

    // =========================================================================
    // QSTASH (Upstash Message Queue)
    // =========================================================================
    QSTASH_TOKEN: z.string().min(1),
    QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
    QSTASH_NEXT_SIGNING_KEY: z.string().min(1),
    QSTASH_URL: z.string().url().default("https://qstash.upstash.io"),

    // =========================================================================
    // IDEXX INTEGRATION
    // =========================================================================
    IDEXX_ENCRYPTION_KEY: z.string().min(32), // AES-256 requires 32+ bytes
    IDEXX_SYNC_SERVICE_URL: z.string().url().optional(),

    // =========================================================================
    // PIMS SYNC SERVICE
    // =========================================================================
    PIMS_SYNC_URL: z.string().url().optional(),
    PIMS_SYNC_API_KEY: z.string().optional(),

    // =========================================================================
    // RESEND (Email)
    // =========================================================================
    RESEND_API_KEY: z.string().min(1),

    // =========================================================================
    // SLACK NOTIFICATIONS
    // =========================================================================
    SLACK_BOT_TOKEN: z.string().optional(),
    SLACK_SIGNING_SECRET: z.string().optional(),
    SLACK_CHANNEL_ID: z.string().optional(),

    // =========================================================================
    // SANITY CMS
    // =========================================================================
    SANITY_API_TOKEN: z.string().optional(),

    // =========================================================================
    // POSTHOG (Server-side Analytics)
    // =========================================================================
    POSTHOG_PROJECT_API_KEY: z.string().optional(),
    POSTHOG_PERSONAL_API_KEY: z.string().optional(),

    // =========================================================================
    // SENTRY (Error Tracking)
    // =========================================================================
    SENTRY_AUTH_TOKEN: z.string().optional(),

    // =========================================================================
    // DEVELOPMENT OPTIONS
    // =========================================================================
    HEADLESS: z
      .string()
      .transform((val) => val === "true")
      .default("true"),
    PORT: z.string().default("3000"),
    SKIP_QSTASH_VERIFY: z
      .string()
      .transform((val) => val === "true")
      .default("false"),
    PLAYWRIGHT_SLOW_MO: z.string().default("0"),
  },

  /**
   * Client-side environment variables schema.
   * These are exposed to the client via the NEXT_PUBLIC_ prefix.
   */
  client: {
    // =========================================================================
    // CORE
    // =========================================================================
    NEXT_PUBLIC_APP_ENV: z
      .enum(["development", "staging", "production"])
      .default(currentEnv),
    NEXT_PUBLIC_SITE_URL: z
      .string()
      .url()
      .default("https://odis-ai-web.vercel.app"),

    // =========================================================================
    // SUPABASE
    // =========================================================================
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

    // =========================================================================
    // CLERK (Auth)
    // =========================================================================
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().optional(),
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().optional(),

    // =========================================================================
    // VAPI (Voice AI Platform)
    // =========================================================================
    NEXT_PUBLIC_VAPI_PUBLIC_KEY: z.string().optional(),

    // =========================================================================
    // STRIPE (Payment Links)
    // =========================================================================
    NEXT_PUBLIC_STRIPE_LINK_INBOUND: z.string().url().optional(),
    NEXT_PUBLIC_STRIPE_LINK_PROFESSIONAL: z.string().url().optional(),
    NEXT_PUBLIC_STRIPE_LINK_ENTERPRISE: z.string().url().optional(),
    NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL: z.string().url().optional(),

    // =========================================================================
    // SANITY CMS
    // =========================================================================
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().optional(),
    NEXT_PUBLIC_SANITY_DATASET: z.string().default("production"),

    // =========================================================================
    // POSTHOG (Client-side Analytics)
    // =========================================================================
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

    // =========================================================================
    // PIMS SYNC SERVICE
    // =========================================================================
    NEXT_PUBLIC_PIMS_SYNC_URL: z.string().url().optional(),

    // =========================================================================
    // SENTRY (Error Tracking)
    // =========================================================================
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: z
      .enum(["development", "staging", "production"])
      .default("production"),
  },

  /**
   * Runtime environment variable mapping.
   * Required because process.env can't be destructured in Edge runtimes.
   */
  runtimeEnv: {
    // Core
    NODE_ENV: process.env.NODE_ENV,
    APP_ENV: currentEnv,
    NEXT_PUBLIC_APP_ENV: currentEnv,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,

    // Supabase
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

    // Clerk
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:
      process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:
      process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,

    // Anthropic
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,

    // VAPI
    VAPI_PRIVATE_KEY: process.env.VAPI_PRIVATE_KEY,
    VAPI_ASSISTANT_ID: process.env.VAPI_ASSISTANT_ID,
    VAPI_PHONE_NUMBER_ID: process.env.VAPI_PHONE_NUMBER_ID,
    VAPI_WEBHOOK_SECRET: process.env.VAPI_WEBHOOK_SECRET,
    VAPI_DEFAULT_INBOUND_ASSISTANT_ID:
      process.env.VAPI_DEFAULT_INBOUND_ASSISTANT_ID,
    NEXT_PUBLIC_VAPI_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,

    // QStash
    QSTASH_TOKEN: process.env.QSTASH_TOKEN,
    QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
    QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
    QSTASH_URL: process.env.QSTASH_URL,

    // IDEXX
    IDEXX_ENCRYPTION_KEY: process.env.IDEXX_ENCRYPTION_KEY,
    IDEXX_SYNC_SERVICE_URL: process.env.IDEXX_SYNC_SERVICE_URL,

    // PIMS Sync
    PIMS_SYNC_URL: process.env.PIMS_SYNC_URL,
    PIMS_SYNC_API_KEY: process.env.PIMS_SYNC_API_KEY,
    NEXT_PUBLIC_PIMS_SYNC_URL: process.env.NEXT_PUBLIC_PIMS_SYNC_URL,

    // Resend
    RESEND_API_KEY: process.env.RESEND_API_KEY,

    // Slack
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
    SLACK_CHANNEL_ID: process.env.SLACK_CHANNEL_ID,

    // Stripe
    NEXT_PUBLIC_STRIPE_LINK_INBOUND:
      process.env.NEXT_PUBLIC_STRIPE_LINK_INBOUND,
    NEXT_PUBLIC_STRIPE_LINK_PROFESSIONAL:
      process.env.NEXT_PUBLIC_STRIPE_LINK_PROFESSIONAL,
    NEXT_PUBLIC_STRIPE_LINK_ENTERPRISE:
      process.env.NEXT_PUBLIC_STRIPE_LINK_ENTERPRISE,
    NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL:
      process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL,

    // Sanity
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    SANITY_API_TOKEN: process.env.SANITY_API_TOKEN,

    // PostHog
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    POSTHOG_PROJECT_API_KEY: process.env.POSTHOG_PROJECT_API_KEY,
    POSTHOG_PERSONAL_API_KEY: process.env.POSTHOG_PERSONAL_API_KEY,

    // Sentry
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,

    // Development
    HEADLESS: process.env.HEADLESS,
    PORT: process.env.PORT,
    SKIP_QSTASH_VERIFY: process.env.SKIP_QSTASH_VERIFY,
    PLAYWRIGHT_SLOW_MO: process.env.PLAYWRIGHT_SLOW_MO,
  },

  /**
   * Skip validation during Docker builds or when explicitly requested.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Treat empty strings as undefined for cleaner validation.
   */
  emptyStringAsUndefined: true,
});

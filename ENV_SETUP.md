# Environment Variables Setup

This monorepo uses app-specific environment configuration following Nx best practices.

## Quick Start

Each app has an `.env.example` file documenting required variables. To set up:

```bash
# Web app
cp apps/web/.env.example apps/web/.env.local

# Mobile app
cp apps/mobile/.env.example apps/mobile/.env.local

# IDEXX sync service
cp apps/idexx-sync/.env.example apps/idexx-sync/.env.local

# Docs site
cp apps/docs/.env.example apps/docs/.env.local
```

Then edit each `.env.local` file with your actual values.

---

## App-Specific Configuration

### Web App (`apps/web`)

**File**: `apps/web/.env.local`
**Validator**: `libs/shared/env/src/index.ts`
**Prefix**: `NEXT_PUBLIC_` for client-side variables

**Required Variables**:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `RESEND_API_KEY` - Email sending via Resend
- `IDEXX_ENCRYPTION_KEY` - Encryption key for IDEXX credentials (min 32 chars)
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog analytics

**Optional Variables**:
- Clerk authentication (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
- VAPI voice AI (`VAPI_PRIVATE_KEY`, `VAPI_ASSISTANT_ID`)
- Slack integration (`SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`)
- Anthropic AI (`ANTHROPIC_API_KEY`)

---

### Mobile App (`apps/mobile`)

**File**: `apps/mobile/.env.local`
**Prefix**: `EXPO_PUBLIC_` for client-side variables (Expo convention)

**Required Variables**:
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication
- `EXPO_PUBLIC_API_URL` - Backend API URL

**Optional Variables**:
- `EXPO_PUBLIC_SUPABASE_URL` - If accessing Supabase directly
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - If accessing Supabase directly

**Local Development**: Use your machine's IP address for API URL:
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.x:3000
```

---

### IDEXX Sync Service (`apps/idexx-sync`)

**File**: `apps/idexx-sync/.env.local`

**Required Variables**:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `IDEXX_ENCRYPTION_KEY` - Encryption key (min 32 chars, must match web app)

**Configuration**:
- `PORT` - Server port (default: 3001)
- `SYNC_INTERVAL_MINUTES` - How often to sync (default: 15)
- `HEADLESS` - Run Chrome in headless mode (true for production)

---

### Docs Site (`apps/docs`)

**File**: `apps/docs/.env.local`

**Required Variables**:
- `SITE_URL` - Documentation site URL

**Optional Variables**:
- Algolia search configuration
- Google Analytics

---

## Environment Prefixes

Different frameworks use different prefixes for client-side variables:

| Framework | Client Prefix | Example |
|-----------|---------------|---------|
| Next.js   | `NEXT_PUBLIC_` | `NEXT_PUBLIC_API_URL` |
| Expo      | `EXPO_PUBLIC_` | `EXPO_PUBLIC_API_URL` |
| Node.js   | None (all server-side) | `API_KEY` |

**Security Note**: Variables with public prefixes are **embedded in the bundle** and exposed to the browser. Never put secrets in `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` variables.

---

## Shared Environment Library

The `@odis-ai/shared/env` library provides type-safe environment validation using `@t3-oss/env-nextjs` and Zod.

**Usage in Web App**:
```typescript
import { env } from "@odis-ai/shared/env";

// Server-side only
const apiKey = env.VAPI_PRIVATE_KEY;

// Client-side accessible
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
```

**Validation**: On build/dev start, the library validates all environment variables against the schema. Missing or invalid variables will throw an error.

**Skip Validation**: For Docker builds or CI environments where env vars aren't available at build time:
```bash
SKIP_ENV_VALIDATION=true pnpm build
```

---

## Creating App-Specific Validators

For apps with unique requirements (like Expo), create app-specific validators:

```typescript
// apps/mobile/src/lib/env.ts
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  client: {
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    EXPO_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: {
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  },
});
```

---

## Getting Credentials

### Supabase
1. Visit https://supabase.com/dashboard
2. Select your project
3. Go to **Settings → API**
4. Copy `URL`, `anon key`, and `service_role key`

### Clerk (Optional)
1. Visit https://dashboard.clerk.com
2. Select your application
3. Go to **API Keys**
4. Copy publishable and secret keys
5. Enable Google OAuth in **User & Authentication → Social Connections**

### VAPI Voice AI
1. Visit https://vapi.ai/dashboard
2. Go to **API Keys**
3. Copy private key
4. Create assistants and phone numbers, copy their IDs

### Resend Email
1. Visit https://resend.com/api-keys
2. Create an API key
3. Verify your sending domain

### PostHog Analytics
1. Visit https://posthog.com
2. Create a project
3. Copy the project API key

---

## Troubleshooting

### Build fails with "Invalid environment variables"
- Check that all required variables are set in `.env.local`
- Ensure values match the expected format (URLs should include `https://`)
- Check for typos in variable names

### Mobile app can't connect to local API
- Use your machine's IP address, not `localhost`
- Ensure web app is running and accessible
- Check firewall settings

### IDEXX sync service fails to authenticate
- Verify `IDEXX_ENCRYPTION_KEY` matches the key used in web app
- Check that the key is at least 32 characters

### Environment variables not updating
- Restart the dev server after changing `.env.local`
- For mobile, restart Metro bundler with cache clear: `npx expo start -c`

---

## Security Best Practices

1. **Never commit `.env.local` files** - They're gitignored for a reason
2. **Keep secrets server-side** - Don't use `NEXT_PUBLIC_` or `EXPO_PUBLIC_` for secrets
3. **Rotate keys regularly** - Especially for production environments
4. **Use different keys per environment** - Don't reuse production keys in development
5. **Encrypt sensitive data** - Like IDEXX credentials in the database

---

## CI/CD Configuration

For Vercel, Railway, or other deployment platforms:

1. Add all required environment variables in the platform's dashboard
2. Use environment-specific values (production keys for production)
3. Set `APP_ENV=production` to enable production mode
4. For preview deployments, set `APP_ENV=staging`

**Vercel Example**:
- Production: Set all variables in **Settings → Environment Variables → Production**
- Preview: Set same variables in **Preview** scope with staging values
- Development: Use local `.env.local` file

---

## Quick Reference

```bash
# Check which variables are required
cat apps/{app-name}/.env.example

# Copy example to local (first time setup)
cp apps/{app-name}/.env.example apps/{app-name}/.env.local

# Validate environment (Next.js apps)
pnpm dev  # Will fail if required vars are missing

# Skip validation (for CI/Docker)
SKIP_ENV_VALIDATION=true pnpm build
```

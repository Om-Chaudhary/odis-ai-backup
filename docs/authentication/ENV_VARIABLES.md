# Environment Variables Reference

## Authentication (Clerk)

### Required for Production

```bash
# Clerk Secret Key (Server-only - NEVER expose to browser)
CLERK_SECRET_KEY="sk_live_..."

# Clerk Publishable Key (Client-safe)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."

# Webhook Secret (For verifying webhook signatures)
CLERK_WEBHOOK_SECRET="whsec_..."

# Clerk Domain (For Supabase third-party auth)
# Format: your-app.clerk.accounts.dev
CLERK_DOMAIN="odis-ai.clerk.accounts.dev"
```

### Optional (Routing Configuration)

```bash
# Clerk route configuration (defaults shown)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
```

---

## Getting Values

| Variable                            | Location                                       | Steps                                                        |
| ----------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `CLERK_SECRET_KEY`                  | [Clerk Dashboard](https://dashboard.clerk.com) | Configure > API Keys > Copy Secret Key                       |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard](https://dashboard.clerk.com) | Configure > API Keys > Copy Publishable Key                  |
| `CLERK_WEBHOOK_SECRET`              | [Clerk Dashboard](https://dashboard.clerk.com) | Configure > Webhooks > Create Endpoint > Copy Signing Secret |
| `CLERK_DOMAIN`                      | [Clerk Dashboard](https://dashboard.clerk.com) | Configure > Domains > Copy Primary Domain                    |

---

## Validation

All environment variables are validated at build time using `@t3-oss/env-nextjs`. Invalid or missing variables will cause the build to fail with a clear error message.

### Server Variables

Validated in:

- `libs/shared/env/src/index.ts`
- `apps/web/src/env.js`

### Client Variables

Client variables (prefixed with `NEXT_PUBLIC_`) are validated and safe to expose to the browser.

---

## Development vs Production

### Development (.env.local)

```bash
# Use test/development keys
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_DOMAIN="your-app-dev.clerk.accounts.dev"
```

### Production (Vercel/Railway)

```bash
# Use production keys
CLERK_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_DOMAIN="your-app.clerk.accounts.dev"
```

**Security Note**: Never commit `.env.local` or any file containing secrets to git. Use Vercel/Railway environment variable management for production.

---

## Testing Setup

To verify your environment variables are configured correctly:

```bash
# Verify local env vars are loaded
pnpm dev

# Build succeeds with all required vars
pnpm build

# TypeScript validation passes
pnpm typecheck:all
```

If any required variables are missing or invalid, you'll see a clear error message indicating which variable needs to be fixed.

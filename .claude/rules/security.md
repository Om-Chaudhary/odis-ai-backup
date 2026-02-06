# Security Rules

## Supabase RLS

- `createServerClient()` respects Row Level Security. Use this by default.
- `createServiceClient()` bypasses RLS. ONLY use in: webhook handlers (VAPI, QStash), admin-only server actions, background jobs.

## Environment Variables

- `NEXT_PUBLIC_*` variables are exposed to the browser. NEVER store secrets in public env vars.
- Server-only secrets: `SUPABASE_SERVICE_ROLE_KEY`, `VAPI_PRIVATE_KEY`, `QSTASH_TOKEN`, etc.

## Webhook Verification

- VAPI webhooks: verify using `VAPI_WEBHOOK_SECRET`
- QStash webhooks: use built-in verification middleware from `@upstash/qstash`

## Authentication

- tRPC protected procedures enforce auth automatically
- Server Actions must check session explicitly
- Auth proxy at `apps/web/src/proxy.ts` handles Clerk + Supabase hybrid auth

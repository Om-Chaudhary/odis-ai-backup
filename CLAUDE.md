# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
pnpm dev              # Start Next.js dev server with Turbopack
pnpm build            # Create production build
pnpm start            # Run production server
pnpm preview          # Build and start production server

# Code Quality
pnpm check            # Run linting and type checking
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues automatically
pnpm typecheck        # Run TypeScript compiler check

# Formatting
pnpm format:check     # Check code formatting
pnpm format:write     # Auto-format code with Prettier

# Supabase
pnpm update-types     # Generate TypeScript types from Supabase schema
                      # Requires PROJECT_REF environment variable
```

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **API**: tRPC + Next.js Server Actions
- **CMS**: Sanity.io
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Analytics**: PostHog
- **AI Integration**: Retell AI (voice calls)

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-protected routes
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes (webhooks, tRPC)
│   ├── dashboard/         # User dashboard
│   │   └── calls/         # Retell AI call management
│   └── blog/              # Sanity CMS blog
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── admin/            # Admin-specific components
│   ├── dashboard/        # Dashboard components
│   └── blocks/           # Content blocks
├── server/               # Server-side code
│   ├── actions/          # Next.js Server Actions
│   │   ├── auth.ts       # Authentication actions
│   │   └── retell.ts     # Retell AI call actions
│   └── api/              # tRPC setup
│       ├── trpc.ts       # tRPC context & procedures
│       ├── root.ts       # App router
│       └── routers/      # tRPC routers (domain-specific)
├── lib/                  # Shared utilities
│   ├── supabase/         # Supabase clients
│   │   ├── server.ts     # Server-side client (with auth)
│   │   └── client.ts     # Client-side client
│   ├── retell/           # Retell AI SDK wrapper
│   └── utils.ts          # Utility functions
├── hooks/                # Custom React hooks
│   └── use-call-polling.ts  # Polling hook with adaptive intervals
└── sanity/               # Sanity CMS configuration
    ├── lib/              # Sanity client
    └── schemaTypes/      # Content schemas
```

## Key Architectural Patterns

### Dual API Architecture

The application uses **two parallel API systems**:

1. **tRPC** (`src/server/api/`)
   - Type-safe RPC calls
   - Used for real-time queries and mutations
   - Protected procedures require authentication
   - Routers organized by domain (cases, templates, users, etc.)

2. **Next.js Server Actions** (`src/server/actions/`)
   - Server-side form handling
   - Direct Supabase operations
   - Used for Retell AI integration
   - Simpler than tRPC for straightforward operations

**When to use which:**

- Use **tRPC** for complex queries, real-time features, or when you need client-side invalidation
- Use **Server Actions** for form submissions, simple CRUD, or webhook handlers

### Supabase Client Pattern

Two distinct Supabase clients exist:

```typescript
// Standard client (respects RLS, uses cookies)
import { createClient } from "~/lib/supabase/server";
const supabase = await createClient();

// Service client (bypasses RLS, admin operations)
import { createServiceClient } from "~/lib/supabase/server";
const supabase = await createServiceClient();
```

**Critical:** Service client bypasses Row Level Security. Only use for admin operations or when RLS would block legitimate access (e.g., webhook handlers).

### React Hook Patterns for Polling

When implementing polling with React hooks, use the **ref pattern** to avoid unstable callback references:

```typescript
// ❌ WRONG - Creates unstable references
const loadData = useCallback(async () => {
  // ...
}, [data.length]); // data.length causes recreation

const hasActiveItems = useCallback(() => {
  return data.some((item) => item.active);
}, [data]); // data causes recreation

// ✅ CORRECT - Stable references with refs
const dataRef = useRef(data);
useEffect(() => {
  dataRef.current = data;
}, [data]);

const loadData = useCallback(async () => {
  const isInitial = isInitialRef.current;
  // ...
}, [selectedFilter]); // Only external dependencies

const hasActiveItems = useCallback(() => {
  return dataRef.current.some((item) => item.active);
}, []); // Empty dependencies - stable reference
```

**Why this matters:** Unstable callback references cause polling intervals to reset constantly, breaking the steady polling cadence.

## Retell AI Integration

Voice call management system using Retell AI SDK.

### Setup Required

1. Add environment variables to `.env.local`:

   ```bash
   RETELL_API_KEY=key_xxx
   RETELL_FROM_NUMBER=+1234567890
   RETELL_AGENT_ID=agent_xxx
   ```

2. Configure webhook in Retell AI dashboard:
   - URL: `https://yourdomain.com/api/webhooks/retell`
   - Events: `call_started`, `call_ended`

3. Database table `retell_calls` stores call history

### Key Files

- **Server Actions**: `src/server/actions/retell.ts` - Call operations
- **Webhook Handler**: `src/app/api/webhooks/retell/route.ts` - Receives Retell events
- **SDK Wrapper**: `src/lib/retell/client.ts` - Type-safe Retell SDK
- **Dashboard UI**: `src/app/dashboard/calls/` - Call management interface

### Auto-refresh Pattern

The calls dashboard uses adaptive polling:

- 5s interval when calls are in progress
- 30s interval when all calls completed/failed
- Pauses when browser tab hidden (Page Visibility API)

See `src/hooks/use-call-polling.ts` for the implementation pattern.

## Environment Variables

Required variables (see `.env.example`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=        # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Anon/public key
SUPABASE_SERVICE_ROLE_KEY=       # Service role key (admin)

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=   # Sanity project ID
NEXT_PUBLIC_SANITY_DATASET=      # Usually "production"
NEXT_PUBLIC_SANITY_API_VERSION=  # API version (e.g., "2025-10-13")

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=         # PostHog project key
NEXT_PUBLIC_POSTHOG_HOST=        # Usually "https://us.i.posthog.com"

# Retell AI (optional)
RETELL_API_KEY=                  # Retell AI API key
RETELL_FROM_NUMBER=              # Default caller ID
RETELL_AGENT_ID=                 # Default AI agent
```

## Code Style & Pre-commit Hooks

This project uses **husky** and **lint-staged** for automatic code quality:

- **On commit**: Runs ESLint and Prettier on staged files
- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier with Tailwind CSS plugin

Changes are auto-formatted on commit, so focus on logic - formatting is handled automatically.

## Important Implementation Notes

### Server Actions vs. API Routes

Server Actions are the preferred pattern for most server-side operations:

```typescript
// ✅ Preferred: Server Action
"use server";

export async function createCall(data: CreateCallInput) {
  const supabase = await createClient();
  // ... implementation
}

// ❌ Avoid: API Route (unless needed for webhooks)
export async function POST(request: Request) {
  // Only use for external webhooks or non-Next.js clients
}
```

### Authentication Checks

Use tRPC's `protectedProcedure` or manual checks in Server Actions:

```typescript
// tRPC
export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure // Automatic auth check
    .query(({ ctx }) => {
      // ctx.user is guaranteed non-null
    }),
});

// Server Action
export async function updateProfile(data: ProfileData) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }
  // ... implementation
}
```

### Webhook Security

Webhook handlers must verify signatures:

```typescript
// src/app/api/webhooks/retell/route.ts
function verifySignature(request: NextRequest): boolean {
  const signature = request.headers.get("x-retell-signature");
  const apiKey = process.env.RETELL_API_KEY;
  return signature === apiKey;
}

export async function POST(request: NextRequest) {
  if (!verifySignature(request)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  // ... handle webhook
}
```

## Sanity CMS Integration

Blog content is managed through Sanity Studio:

- **Studio URL**: `/studio`
- **Content Types**: Defined in `src/sanity/schemaTypes/`
- **Client**: `src/sanity/lib/client.ts`

Sanity content is fetched server-side and cached by Next.js.

## Testing Strategy

Currently no test suite exists. When adding tests:

- Use React Testing Library for component tests
- Use Vitest or Jest as test runner
- Mock Supabase calls in tests
- Test Server Actions with actual Supabase test instance

## Common Gotchas

1. **Supabase RLS**: Service client bypasses RLS. Use regular client unless you specifically need admin access.

2. **React Hook Dependencies**: When using `useCallback` or `useEffect` with data-dependent logic, use refs to avoid creating unstable references that break polling/intervals.

3. **Server vs Client Components**: Remember that Server Components can't use hooks or browser APIs. Mark components with `"use client"` when needed.

4. **tRPC Context**: The context is created per-request with the authenticated user. Don't store mutable state in context.

5. **Environment Variables**: Variables starting with `NEXT_PUBLIC_` are exposed to the browser. Never put secrets in public env vars.

## Documentation

- **Retell AI Setup**: See `RETELL_SETUP.md` for complete webhook and database configuration
- **Auto-refresh Architecture**: See `AUTO_REFRESH_ARCHITECTURE.md` for polling implementation details

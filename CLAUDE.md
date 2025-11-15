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
- **AI Integration**: VAPI (voice calls)

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-protected routes
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes (webhooks, tRPC)
│   ├── dashboard/         # User dashboard
│   │   └── calls/         # VAPI call management
│   └── blog/              # Sanity CMS blog
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── admin/            # Admin-specific components
│   ├── dashboard/        # Dashboard components
│   └── blocks/           # Content blocks
├── server/               # Server-side code
│   ├── actions/          # Next.js Server Actions
│   │   └── auth.ts       # Authentication actions
│   └── api/              # tRPC setup
│       ├── trpc.ts       # tRPC context & procedures
│       ├── root.ts       # App router
│       └── routers/      # tRPC routers (domain-specific)
├── lib/                  # Shared utilities
│   ├── supabase/         # Supabase clients
│   │   ├── server.ts     # Server-side client (with auth)
│   │   └── client.ts     # Client-side client
│   ├── vapi/             # VAPI AI SDK wrapper
│   │   ├── client.ts     # VAPI client utilities
│   │   ├── validators.ts # Input validation
│   │   ├── types.ts      # TypeScript types
│   │   └── knowledge-base/ # Domain-specific veterinary knowledge
│   ├── idexx/            # IDEXX data transformation
│   ├── qstash/           # QStash scheduling client
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

## VAPI AI Integration

Voice call management system using VAPI SDK for automated post-appointment follow-ups.

### Architecture Overview

The VAPI integration consists of:

1. **Scheduling System**: Schedule calls for future execution using QStash
2. **Execution System**: Make outbound calls via VAPI
3. **Webhook System**: Receive real-time call status updates
4. **Knowledge Base**: Domain-specific veterinary knowledge for natural conversations
5. **IDEXX Integration**: Transform IDEXX Neo data into call variables

### Setup Required

1. Add environment variables to `.env.local`:

   ```bash
   # VAPI Configuration
   VAPI_PRIVATE_KEY=your_private_key     # For server-side operations
   VAPI_ASSISTANT_ID=assistant_id        # Default assistant to use
   VAPI_PHONE_NUMBER_ID=phone_id         # Outbound caller ID
   NEXT_PUBLIC_VAPI_PUBLIC_KEY=pub_key   # For browser-based calls (optional)
   VAPI_WEBHOOK_SECRET=webhook_secret    # For webhook signature verification

   # QStash (for scheduled calls)
   QSTASH_TOKEN=qstash_token
   QSTASH_CURRENT_SIGNING_KEY=signing_key
   QSTASH_NEXT_SIGNING_KEY=next_key

   # Site URL (for webhook callbacks)
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

2. Configure webhook in VAPI dashboard:
   - URL: `https://yourdomain.com/api/webhooks/vapi`
   - Events: All events (status-update, end-of-call-report, hang)
   - Set webhook secret for signature verification

3. Database table `vapi_calls` stores call history

### Key Files

**API Routes**:

- `src/app/api/calls/schedule/route.ts` - Schedule new calls with QStash
- `src/app/api/calls/execute/route.ts` - Execute scheduled calls via VAPI
- `src/app/api/webhooks/vapi/route.ts` - Receive VAPI webhook events
- `src/app/api/webhooks/execute-call/route.ts` - QStash webhook for execution

**Core Libraries**:

- `src/lib/vapi/client.ts` - VAPI client wrapper with type safety
- `src/lib/vapi/validators.ts` - Zod schemas for input validation
- `src/lib/vapi/types.ts` - TypeScript type definitions
- `src/lib/vapi/knowledge-base/` - Domain-specific veterinary knowledge
- `src/lib/qstash/client.ts` - QStash scheduling client
- `src/lib/idexx/transformer.ts` - IDEXX data transformation

**UI Components**:

- `src/components/dashboard/quick-call-dialog.tsx` - Quick call interface

### Call Flow

1. **Schedule Call** → POST `/api/calls/schedule`
   - Validates input data (phone, pet name, owner name, etc.)
   - Stores in `vapi_calls` table with status="queued"
   - Schedules execution via QStash for future time

2. **Execute Call** → POST `/api/calls/execute` (via QStash)
   - Retrieves call from database
   - Transforms data into dynamic variables
   - Creates VAPI call with assistant overrides
   - Updates status to "in-progress"

3. **Track Progress** → Webhook at `/api/webhooks/vapi`
   - Receives status updates (queued, ringing, in-progress, ended)
   - Updates database in real-time
   - Handles automatic retries for failed calls (busy, no-answer, voicemail)
   - Stores transcript, recording, and cost data

### Dynamic Variables System

VAPI uses dynamic variables to personalize each call. Variables are passed via `assistantOverrides.variableValues`:

```typescript
{
  // Core identification
  pet_name: "Max",
  owner_name: "John Smith",
  vet_name: "Dr. Sarah Johnson",

  // Clinic information
  clinic_name: "Happy Paws Veterinary",
  clinic_phone: "555-123-4567",
  emergency_phone: "555-999-8888",

  // Call context
  appointment_date: "January 15th",
  call_type: "discharge" | "follow-up",

  // Clinical details
  discharge_summary_content: "...",
  medications: "...",
  next_steps: "...",

  // Conditional fields
  sub_type: "wellness" | "vaccination",  // For discharge
  condition: "ear infection",            // For follow-up
  recheck_date: "January 30th",
}
```

Variables are referenced in assistant prompts using `{{variable_name}}` syntax.

### Knowledge Base Structure

Domain-specific knowledge organized by specialty in `src/lib/vapi/knowledge-base/`:

- `behavioral.ts` - Behavioral issues and training
- `cardiac.ts` - Heart conditions
- `dental.ts` - Dental procedures and care
- `dermatological.ts` - Skin conditions
- `endocrine.ts` - Diabetes, thyroid, etc.
- `gastrointestinal.ts` - Digestive issues
- `neurological.ts` - Seizures, neurological conditions
- `ophthalmic.ts` - Eye conditions
- `orthopedic.ts` - Bone and joint issues
- `pain-management.ts` - Pain medication protocols
- `post-surgical.ts` - Post-operative care
- `respiratory.ts` - Breathing issues
- `urinary.ts` - Urinary tract issues
- `wound-care.ts` - Wound management

Each file exports FAQs and instructions for that domain. The assistant can reference this knowledge during calls.

### IDEXX Integration

Transform IDEXX Neo discharge summary data into VAPI call variables:

```typescript
import { transformIdexxToCallVariables } from "~/lib/idexx/transformer";

const variables = transformIdexxToCallVariables(idexxData);
// Returns properly formatted variables for VAPI
```

Handles date formatting, phone number formatting, and field mapping from IDEXX structure.

### Retry Logic

Failed calls automatically retry with exponential backoff:

- **Retry conditions**: dial-busy, dial-no-answer, voicemail
- **Max retries**: 3 attempts
- **Backoff**: 5, 10, 20 minutes
- **Tracking**: Retry count stored in call metadata

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

# VAPI AI (voice calls)
VAPI_PRIVATE_KEY=                # VAPI private API key
VAPI_ASSISTANT_ID=               # Default assistant ID
VAPI_PHONE_NUMBER_ID=            # Outbound phone number ID
NEXT_PUBLIC_VAPI_PUBLIC_KEY=     # Public key for browser calls
VAPI_WEBHOOK_SECRET=             # Webhook signature secret

# QStash (scheduled calls)
QSTASH_TOKEN=                    # QStash API token
QSTASH_CURRENT_SIGNING_KEY=      # Current signing key
QSTASH_NEXT_SIGNING_KEY=         # Next signing key

# Site Configuration
NEXT_PUBLIC_SITE_URL=            # Site URL for webhooks
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

- **VAPI Integration**: See `VAPI_VARIABLES_IMPLEMENTATION.md` for dynamic variables setup
- **VAPI Prompt**: See `VAPI_ASSISTANT_PROMPT.md` for assistant prompt configuration
- **Auto-refresh Architecture**: See `AUTO_REFRESH_ARCHITECTURE.md` for polling implementation details

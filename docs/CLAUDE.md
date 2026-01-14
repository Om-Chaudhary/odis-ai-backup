# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note**: For comprehensive guidance, see the main [AGENTS.md](../AGENTS.md) file.

## Development Commands

```bash
# Development
pnpm dev              # Start Next.js dev server (nx dev web)
pnpm build            # Create production build (nx build web)

# Code Quality
pnpm check            # Run linting and type checking (all projects)
pnpm lint:all         # Lint all projects
pnpm typecheck:all    # TypeScript check all projects

# Testing
pnpm test:all         # Run all tests
nx test <project>     # Test specific project

# Formatting
pnpm format:check     # Check code formatting
pnpm format:write     # Auto-format code with Prettier

# Supabase
pnpm update-types     # Generate TypeScript types from Supabase schema
```

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Runtime**: React 19
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **API**: tRPC + Next.js Server Actions
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Analytics**: PostHog
- **Voice AI**: VAPI
- **Monorepo**: Nx

### Workspace Structure

```
apps/
  web/                      # Next.js 16 application
  docs/                     # Docusaurus documentation site
  idexx-sync/               # Headless IDEXX sync service

libs/
  shared/                   # Cross-cutting concerns
    types/                  # TypeScript types
    validators/             # Zod schemas (95%+ coverage)
    util/                   # Utilities
    ui/                     # shadcn/ui components
    hooks/                  # React hooks
    logger/                 # Structured logging
    testing/                # Test utilities

  data-access/              # Database layer
    db/                     # Supabase clients + repos
    repository-interfaces/  # Repository contracts
    repository-impl/        # Concrete implementations
    api/                    # API helpers

  domain/                   # Business logic
    cases/data-access/      # CasesService
    discharge/data-access/  # DischargeOrchestrator
    clinics/util/           # Clinic configuration
    auth/util/              # Auth utilities

  integrations/             # External services
    vapi/                   # VAPI voice AI
    idexx/                  # IDEXX transforms
    qstash/                 # QStash scheduling
    resend/                 # Email sending
    slack/                  # Slack notifications
```

## Key Architectural Patterns

### Import Conventions

All imports use the `@odis-ai/` namespace with domain grouping:

```typescript
// Shared
import type { Database, DashboardCase } from "@odis-ai/shared/types";
import { dischargeSchema } from "@odis-ai/shared/validators";
import { Button, Card } from "@odis-ai/shared/ui";
import { loggers } from "@odis-ai/shared/logger";

// Data Access
import { createServerClient, createServiceClient } from "@odis-ai/data-access/db";
import type { ICasesRepository } from "@odis-ai/data-access/repository-interfaces";
import { CasesRepository } from "@odis-ai/data-access/repository-impl";

// Domain
import { CasesService } from "@odis-ai/domain/cases";
import { DischargeOrchestrator } from "@odis-ai/domain/discharge";
import { getClinicByUserId } from "@odis-ai/domain/clinics";

// Integrations
import { createPhoneCall } from "@odis-ai/integrations/vapi";
import { scheduleCallExecution } from "@odis-ai/integrations/qstash";

// Web app internal (use sparingly)
import { something } from "~/lib/something";
```

### Supabase Client Pattern

```typescript
// Standard client (respects RLS, uses cookies)
import { createServerClient } from "@odis-ai/data-access/db";
const supabase = await createServerClient();

// Service client (bypasses RLS - admin/webhook only)
import { createServiceClient } from "@odis-ai/data-access/db";
const supabase = await createServiceClient();
```

**Critical:** Service client bypasses Row Level Security. Only use for admin operations or webhook handlers.

### Dual API Architecture

1. **tRPC** (`apps/web/src/server/api/routers/`)
   - Type-safe RPC calls
   - Routers: dashboard, cases, outbound, inbound, admin
   - Protected procedures require authentication

2. **Server Actions** (`apps/web/src/server/actions/`)
   - Server-side form handling
   - Simpler than tRPC for straightforward operations

**When to use which:**
- Use **tRPC** for complex queries, real-time features
- Use **Server Actions** for form submissions, simple CRUD

### React Hook Patterns for Polling

Use the **ref pattern** to avoid unstable callback references:

```typescript
// ✅ CORRECT - Stable references with refs
const dataRef = useRef(data);
useEffect(() => {
  dataRef.current = data;
}, [data]);

const hasActiveItems = useCallback(() => {
  return dataRef.current.some((item) => item.active);
}, []); // Empty dependencies - stable reference
```

## VAPI Voice AI Integration

Voice call management system using VAPI SDK for automated calls.

### Key Locations

**Libraries** (`libs/integrations/vapi/`):
- `src/` - VAPI client, validators, types
- `webhooks/` - Webhook handlers
- `tools/` - Tool registry
- `inbound/` - Inbound call handling

**API Routes** (`apps/web/src/app/api/`):
- `calls/schedule/` - Schedule new calls
- `webhooks/vapi/` - VAPI webhook events
- `webhooks/execute-call/` - QStash execution webhook
- `vapi/tools/` - VAPI tool endpoints

### Call Flow

1. **Schedule Call** → POST `/api/calls/schedule`
2. **Execute Call** → QStash triggers execution via VAPI
3. **Track Progress** → Webhook at `/api/webhooks/vapi`

### Dynamic Variables

Variables passed via `assistantOverrides.variableValues`:

```typescript
{
  pet_name: "Max",
  owner_name: "John Smith",
  clinic_name: "Happy Paws Veterinary",
  clinic_phone: "555-123-4567",
  call_type: "discharge" | "follow-up",
  discharge_summary_content: "...",
}
```

### Retry Logic

Failed calls automatically retry with exponential backoff:
- **Retry conditions**: dial-busy, dial-no-answer, voicemail
- **Max retries**: 3 attempts
- **Backoff**: 5, 10, 20 minutes

## Environment Variables

Required variables (see `.env.example`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# VAPI AI
VAPI_PRIVATE_KEY=
VAPI_ASSISTANT_ID=
VAPI_PHONE_NUMBER_ID=
VAPI_WEBHOOK_SECRET=

# QStash
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# Site Configuration
NEXT_PUBLIC_SITE_URL=
```

**Important**: Variables starting with `NEXT_PUBLIC_` are exposed to the browser. Never put secrets in public env vars.

## Testing

Tests are colocated within each library in `__tests__/` directories:

```
libs/shared/validators/src/__tests__/
libs/domain/discharge/data-access/src/__tests__/
apps/web/src/server/actions/__tests__/
```

Run tests:
```bash
pnpm test:all                  # All projects
nx test <project>              # Specific project
nx test <project> -t "name"    # Specific test
```

## Common Gotchas

1. **Supabase RLS**: Service client bypasses RLS. Use regular client unless you need admin access.

2. **React Hook Dependencies**: Use refs to avoid unstable references that break polling/intervals.

3. **Server vs Client Components**: Server Components can't use hooks. Mark with `"use client"` when needed.

4. **Import Paths**: Always use `@odis-ai/` namespace imports, not relative paths across libraries.

5. **Domain Grouping**: Libraries are organized by domain (shared, data-access, domain, integrations).

## Key Documentation

| Document | Purpose |
|----------|---------|
| [AGENTS.md](../AGENTS.md) | **Primary AI assistant guide** |
| [CORE_LIBS.md](architecture/CORE_LIBS.md) | Library inventory |
| [TESTING_STRATEGY.md](testing/TESTING_STRATEGY.md) | Testing approach |
| [API_REFERENCE.md](api/API_REFERENCE.md) | API documentation |
| [NX_BEST_PRACTICES.md](architecture/NX_BEST_PRACTICES.md) | Nx conventions |

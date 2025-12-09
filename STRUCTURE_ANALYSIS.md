# ODIS AI Web Repository - Complete Structure Analysis

## Overview

**Repository**: `/Users/s0381806/Development/odis-ai-web`
**Framework**: Next.js 15 with App Router
**Language**: TypeScript (strict mode)
**Package Manager**: pnpm
**Type**: Create T3 App starter project with Next.js + Supabase

## Project Metadata

- **Project Name**: odis-ai-web
- **Version**: 0.1.0
- **Node Version**: 20+
- **TypeScript Target**: ES2022
- **Next.js Version**: 15.2.3
- **React Version**: 19.0.0

## Directory Structure

```
/Users/s0381806/Development/odis-ai-web/
├── src/                           # Source code
│   ├── app/                       # Next.js App Router
│   ├── components/                # React components
│   ├── server/                    # Server-side logic
│   ├── lib/                       # Utility libraries
│   ├── hooks/                     # Custom React hooks
│   ├── types/                     # TypeScript types
│   ├── trpc/                      # tRPC client setup
│   ├── test/                      # Test utilities
│   ├── styles/                    # Global styles
│   ├── middleware.ts              # Next.js middleware
│   └── env.js                     # Environment validation
├── public/                        # Static assets
├── docs/                          # Documentation
├── migrations/                    # SQL migrations
├── supabase/                      # Supabase config & migrations
├── .husky/                        # Git hooks
├── .vscode/                       # VS Code config
├── .vercel/                       # Vercel deployment config
├── .env.example                   # Env template
├── .env.local                     # Local env (gitignored)
├── next.config.js                 # Next.js configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies
├── pnpm-lock.yaml                 # Dependency lock file
├── CLAUDE.md                      # AI assistant guide
├── README.md                      # Project documentation
├── prettier.config.js             # Code formatting
├── postcss.config.js              # PostCSS configuration
├── components.json                # UI component config
├── vitest.config.ts               # Test configuration
└── vercel.json                    # Vercel configuration
```

---

## 1. Application Routes & Pages

### Root Pages (Public)

- **`/`** → `src/app/page.tsx` - Landing/home page
- **`/blog`** → `src/app/blog/page.tsx` - Blog listing
- **`/blog/[slug]`** → `src/app/blog/[slug]/page.tsx` - Individual blog post
- **`/case-studies`** → `src/app/case-studies/page.tsx` - Case studies listing
- **`/case-studies/[slug]`** → `src/app/case-studies/[slug]/page.tsx` - Individual case study
- **`/privacy-policy`** → `src/app/privacy-policy/page.tsx` - Privacy policy
- **`/terms-of-service`** → `src/app/terms-of-service/page.tsx` - Terms of service
- **`/support`** → `src/app/support/page.tsx` - Support hub
- **`/hands-free`** → `src/app/hands-free/page.tsx` - Hands-free demo
- **`/save-time`** → `src/app/save-time/page.tsx` - Feature showcase
- **`/demo*`** → Multiple demo pages (demo, demo1, demo2, demo3)

### Authentication Routes (Protected)

- **`/(auth)/login`** → `src/app/(auth)/login/page.tsx` - Login page
- **`/(auth)/signup`** → `src/app/(auth)/signup/page.tsx` - Signup/onboarding
- **`/auth/callback`** → `src/app/auth/callback/route.ts` - OAuth callback handler

### Dashboard Routes (Protected)

- **`/dashboard`** → `src/app/dashboard/page.tsx` - Dashboard home/overview
- **`/dashboard/cases`** → `src/app/dashboard/cases/page.tsx` - Cases listing
- **`/dashboard/cases/[id]`** → `src/app/dashboard/cases/[id]/page.tsx` - Case detail view
- **`/dashboard/discharges/[id]`** → `src/app/dashboard/discharges/[id]/page.tsx` - Discharge detail
- **`/dashboard/calls/inbound`** → `src/app/dashboard/calls/inbound/page.tsx` - Inbound calls
- **`/dashboard/settings`** → `src/app/dashboard/settings/page.tsx` - User settings
- **`/calls/[id]`** → `src/app/calls/[id]/page.tsx` - Individual call view

### Admin Routes (Protected - Admin Only)

- **`/admin`** → `src/app/admin/page.tsx` - Admin dashboard
- **`/admin/cases`** → `src/app/admin/cases/page.tsx` - Case management
- **`/admin/cases/[id]`** → `src/app/admin/cases/[id]/page.tsx` - Case details
- **`/admin/users`** → `src/app/admin/users/page.tsx` - User management
- **`/admin/users/[id]`** → `src/app/admin/users/[id]/page.tsx` - User details
- **`/admin/users/new`** → `src/app/admin/users/new/page.tsx` - Create user
- **`/admin/templates/soap`** → `src/app/admin/templates/soap/page.tsx` - SOAP templates
- **`/admin/templates/soap/[id]`** → `src/app/admin/templates/soap/[id]/page.tsx` - Edit SOAP template
- **`/admin/templates/soap/new`** → `src/app/admin/templates/soap/new/page.tsx` - Create SOAP template
- **`/admin/templates/discharge`** → `src/app/admin/templates/discharge/page.tsx` - Discharge templates
- **`/admin/templates/discharge/[id]`** → `src/app/admin/templates/discharge/[id]/page.tsx` - Edit discharge template
- **`/admin/templates/discharge/new`** → `src/app/admin/templates/discharge/new/page.tsx` - Create discharge template
- **`/admin/feature-flags`** → `src/app/admin/feature-flags/page.tsx` - Feature toggle management
- **`/admin/soap-playground`** → `src/app/admin/soap-playground/page.tsx` - SOAP note generation testing
- **`/admin/vapi-test`** → `src/app/admin/vapi-test/page.tsx` - VAPI call testing

### Special Routes

- **`/not-found`** → `src/app/not-found.tsx` - 404 page
- **`/robots.ts`** → SEO robots.txt generation
- **`/sitemap.ts`** → SEO sitemap generation

---

## 2. API Routes & Endpoints

### File Structure

```
src/app/api/
├── calls/                    # VAPI call management
│   └── schedule/            # Schedule calls
├── cases/                    # Case management
│   ├── find-by-patient/    # Find cases by patient
│   └── ingest/             # Ingest case data
├── discharge/               # Discharge operations
│   └── orchestrate/         # Orchestrate discharge process
├── generate/                # Content generation
│   ├── route.ts            # Main generation endpoint
│   ├── discharge-summary/  # Discharge summary generation
│   └── discharge-email/    # Discharge email generation
├── generate-soap/           # SOAP note generation
│   └── route.ts
├── idexx/                   # IDEXX data integration
│   ├── configure-credentials/
│   └── validate-credentials/
├── normalize/               # AI normalization
│   └── route.ts
├── schedule/                # Scheduling operations
│   └── sync/               # Sync schedules
├── send/                    # Send operations
│   └── discharge-email/    # Send discharge emails
├── trpc/                    # tRPC endpoint
│   └── [trpc]/route.ts
└── webhooks/                # Webhook handlers
    ├── execute-call/       # Call execution webhook
    ├── execute-discharge-email/ # Email execution webhook
    ├── retell/            # Retell AI webhooks
    └── vapi/              # VAPI webhooks
```

### Endpoint Details

#### Call Management

- `POST /api/calls/schedule` - Schedule new VAPI calls with QStash
- `POST /api/webhooks/execute-call` - QStash webhook for call execution
- `POST /api/webhooks/vapi` - VAPI webhook for call status updates

#### Case Management

- `POST /api/cases/ingest` - Ingest case data
- `POST /api/cases/find-by-patient` - Find cases by patient ID

#### Discharge Operations

- `POST /api/discharge/orchestrate` - Orchestrate discharge workflow
- `POST /api/generate/discharge-summary` - Generate discharge summary
- `POST /api/generate/discharge-email` - Generate discharge email
- `POST /api/send/discharge-email` - Send discharge email
- `POST /api/webhooks/execute-discharge-email` - Handle email execution

#### SOAP/Generation

- `POST /api/generate/` - Main generation endpoint
- `POST /api/generate-soap` - Generate SOAP notes
- `POST /api/normalize` - AI-powered entity normalization

#### Integration

- `POST /api/idexx/validate-credentials` - Validate IDEXX credentials
- `POST /api/idexx/configure-credentials` - Configure IDEXX integration
- `POST /api/schedule/sync` - Sync schedules

#### tRPC

- `POST /api/trpc/[trpc]` - tRPC router handler

#### Webhooks

- `POST /api/webhooks/retell` - Retell AI webhook handler
- `POST /api/webhooks/vapi` - VAPI webhook handler

---

## 3. tRPC Routers

### File Structure

```
src/server/api/
├── trpc.ts                  # tRPC context and procedures setup
├── root.ts                  # Main app router
└── routers/
    ├── cases.ts            # Case queries & mutations
    ├── dashboard.ts        # Dashboard data
    ├── inbound-calls.ts    # Inbound call management
    ├── playground.ts       # Playground/testing
    ├── sharing.ts          # Content sharing
    ├── templates.ts        # Template management
    ├── users.ts            # User operations
    └── waitlist.ts         # Waitlist operations
```

### Router Details

**Cases Router** (`src/server/api/routers/cases.ts`)

- Query/mutation procedures for case management
- Case filtering and searching
- Case creation and updates

**Dashboard Router** (`src/server/api/routers/dashboard.ts`)

- Dashboard statistics
- Recent activity
- Case summaries

**Inbound Calls Router** (`src/server/api/routers/inbound-calls.ts`)

- Inbound call management
- Call history
- Call metrics

**Templates Router** (`src/server/api/routers/templates.ts`)

- SOAP template CRUD
- Discharge template CRUD
- Template publishing

**Users Router** (`src/server/api/routers/users.ts`)

- User profile operations
- User management (admin)
- Role assignments

**Sharing Router** (`src/server/api/routers/sharing.ts`)

- Content sharing functionality
- Share link generation
- Access control

**Waitlist Router** (`src/server/api/routers/waitlist.ts`)

- Waitlist signup
- Status checking

**Playground Router** (`src/server/api/routers/playground.ts`)

- Testing endpoints for development

### Procedure Types

```typescript
// Public (unauthenticated)
publicProcedure
  .query() / .mutation()

// Protected (authenticated)
protectedProcedure
  .query() / .mutation()

// Admin-only
adminProcedure
  .query() / .mutation()
```

---

## 4. Component Structure

### Component Organization

```
src/components/
├── ui/                      # Shadcn/UI primitives
│   ├── accordion.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── skeleton.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   └── ... (30+ UI components)
├── admin/                   # Admin-specific components
│   ├── UserForm.tsx
│   ├── SoapTemplateForm.tsx
│   ├── DischargeTemplateForm.tsx
│   ├── CaseMultiAddDialog.tsx
│   └── ...
├── dashboard/               # Dashboard components
│   ├── case-detail-client.tsx
│   ├── case-list-item-compact.tsx
│   ├── case-card.tsx
│   ├── dashboard-content.tsx
│   ├── discharge-management-client.tsx
│   ├── inbound-calls-client.tsx
│   ├── app-sidebar.tsx
│   └── ... (60+ dashboard components)
├── calls/                   # Call management
│   └── call-detail-view.tsx
├── blocks/                  # Content blocks
│   └── pricing.tsx
├── hero/                    # Hero sections
│   ├── HeroTwoColumn.tsx
│   ├── ProcessAnimation.tsx
├── onboarding/              # Onboarding flow
│   ├── OnboardingContainer.tsx
│   ├── AccountStep.tsx
│   ├── PIMSStep.tsx
│   └── StepIndicator.tsx
├── legal/                   # Legal components
│   └── compliance-document.tsx
├── profile-page/            # Profile page
├── Navigation.tsx           # Main navigation
├── Footer.tsx               # Footer
├── CTA.tsx                  # Call-to-action
├── FAQ.tsx                  # FAQ section
├── Testimonials.tsx         # Testimonials
├── TrustLogos.tsx           # Trust badges
├── BlogLayout.tsx           # Blog layout
├── DarkModeWrapper.tsx      # Dark mode wrapper
├── ClientPostHogProvider.tsx # Analytics provider
└── WaitlistModal.tsx        # Waitlist modal
```

### Key Components

**Admin Components**

- `UserForm.tsx` - User creation/editing
- `SoapTemplateForm.tsx` - SOAP template editor
- `DischargeTemplateForm.tsx` - Discharge template editor
- `CaseMultiAddDialog.tsx` - Bulk case addition

**Dashboard Components**

- `case-detail-client.tsx` - Case details view
- `case-list-item-compact.tsx` - Compact case list item
- `case-card.tsx` - Case card display
- `discharge-management-client.tsx` - Discharge management
- `inbound-calls-client.tsx` - Inbound calls list
- `app-sidebar.tsx` - Navigation sidebar
- `dashboard-stats.tsx` - Statistics display
- `dashboard-tabs.tsx` - Tab navigation
- `filter-button-group.tsx` - Filter buttons
- `pagination-controls.tsx` - Pagination

**UI Components (Shadcn)**

- Data display: Table, Badge, Progress, Skeleton
- Forms: Input, Label, Checkbox, Radio, Select, Textarea
- Layout: Card, Separator, Tabs, Accordion
- Modals: Dialog, AlertDialog, Popover
- Navigation: Breadcrumb, Sidebar, Sheet
- Status: Spinner, Tooltip

---

## 5. Server-Side Code

### File Structure

```
src/server/
├── actions/                 # Next.js Server Actions
│   ├── auth.ts             # Authentication actions
│   ├── patients.ts         # Patient operations
│   └── retell.ts           # Retell AI operations
├── api/
│   ├── trpc.ts             # tRPC setup & context
│   ├── root.ts             # Main router
│   └── routers/            # Domain-specific routers
```

### Server Actions

**Authentication** (`src/server/actions/auth.ts`)

- Login/logout
- Signup
- Password reset
- Email verification

**Patients** (`src/server/actions/patients.ts`)

- Patient creation
- Patient updates
- Patient search

**Retell AI** (`src/server/actions/retell.ts`)

- Retell call integration
- Call status updates

---

## 6. Library & Utility Code

### File Structure

```
src/lib/
├── supabase/                # Supabase integration
│   ├── server.ts           # Server-side client
│   ├── client.ts           # Client-side client
│   └── middleware.ts       # Auth middleware
├── vapi/                    # VAPI AI integration
│   ├── client.ts           # VAPI client wrapper
│   ├── validators.ts       # Input validation
│   ├── types.ts            # TypeScript types
│   ├── simple-types.ts     # Simple type definitions
│   ├── utils.ts            # Utility functions
│   ├── extract-variables.ts # Variable extraction
│   ├── inbound-calls.ts    # Inbound call handling
│   ├── call-manager.ts     # Call management
│   └── knowledge-base/     # Medical knowledge base
│       ├── behavioral.ts
│       ├── cardiac.ts
│       ├── dental.ts
│       ├── dermatological.ts
│       ├── endocrine.ts
│       ├── gastrointestinal.ts
│       ├── general.ts
│       ├── neurological.ts
│       ├── ophthalmic.ts
│       ├── orthopedic.ts
│       ├── pain-management.ts
│       ├── post-surgical.ts
│       ├── respiratory.ts
│       ├── urinary.ts
│       ├── wound-care.ts
│       └── index.ts
├── idexx/                   # IDEXX integration
│   ├── types.ts            # IDEXX data types
│   ├── validation.ts       # Input validation
│   ├── transformer.ts      # Data transformation
│   └── credential-manager.ts # Credential handling
├── ai/                      # AI integration
│   ├── normalize-scribe.ts # Scribe normalization
│   └── generate-discharge.ts # Discharge generation
├── api/                     # API utilities
│   ├── auth.ts             # Authentication helpers
│   ├── cors.ts             # CORS helpers
│   ├── errors.ts           # Error handling
│   └── response.ts         # Response formatting
├── clinics/                 # Clinic management
│   ├── types.ts
│   ├── constants.ts
│   └── utils.ts
├── crypto/                  # Encryption
│   └── aes-encryption.ts   # AES-256-GCM
├── db/                      # Database utilities
│   └── scribe-transactions.ts
├── repositories/            # Data access layer
│   ├── base.ts             # Base repository
│   ├── call-repository.ts  # Call data access
│   ├── email-repository.ts # Email data access
│   ├── user-repository.ts  # User data access
│   └── types.ts            # Repository types
├── services/                # Business logic
│   ├── cases-service.ts    # Case business logic
│   ├── discharge-orchestrator.ts # Discharge workflow
│   └── execution-plan.ts   # Execution planning
├── qstash/                  # QStash integration
│   └── client.ts           # QStash client
├── resend/                  # Email service
│   └── client.ts           # Resend client
├── retell/                  # Retell AI
│   ├── client.ts           # Retell client
│   └── validators.ts       # Validation
├── logger/                  # Logging
│   └── index.ts            # Logger setup
├── posthog.ts              # Analytics setup
├── llamaindex/             # LlamaIndex integration
│   ├── config.ts           # Configuration
│   ├── init.ts             # Initialization
│   └── utils.ts            # Utilities
├── utils.ts                # General utilities
├── utils/                  # Specific utilities
│   ├── business-hours.ts
│   ├── dashboard-helpers.ts
│   ├── date-grouping.ts
│   ├── date-ranges.ts
│   ├── discharge-readiness.ts
│   ├── phone-formatting.ts
│   └── phone.ts
├── validators/             # Validation schemas
│   ├── discharge.ts
│   ├── orchestration.ts
│   └── scribe.ts
├── schedule/               # Scheduling
│   └── validators.ts
├── constants/              # Constants
│   └── auth.ts
├── transforms/             # Data transformation
│   └── case-transforms.ts
├── mock-data.ts            # Mock data for testing
└── transforms/
    └── case-transforms.ts
```

### Supabase Clients

```typescript
// Standard client (respects RLS, uses cookies)
import { createClient } from "~/lib/supabase/server";
const supabase = await createClient();

// Service client (bypasses RLS, admin operations)
import { createServiceClient } from "~/lib/supabase/server";
const supabase = await createServiceClient();
```

### VAPI Integration

The VAPI directory contains:

- Voice call management
- Knowledge base for veterinary specialties
- Dynamic variable system for personalized calls
- Webhook handlers for call status updates
- Integration with IDEXX data

---

## 7. Custom Hooks

```
src/hooks/
├── use-debounce.ts         # Debounce values
├── use-event-listener.ts   # Event listening
├── use-isomorphic-layout-effect.tsx # SSR-safe layout effect
├── use-media-query.ts      # Media query detection
├── use-mobile.ts           # Mobile device detection
├── use-on-click-outside.tsx # Click outside detection
├── use-toast.ts            # Toast notifications
├── useDeviceDetection.ts   # Device type detection
├── useScrollTracking.ts    # Scroll tracking
└── useSectionVisibility.ts # Section visibility
```

---

## 8. Types & Data Models

### File Structure

```
src/types/
├── case.ts                 # Case types
├── case-study.ts          # Case study types
├── dashboard.ts           # Dashboard types
├── orchestration.ts       # Orchestration types
├── patient.ts             # Patient types
├── services.ts            # Service types
└── supabase.ts            # Supabase types

src/database.types.ts      # Auto-generated Supabase types
src/data/
└── case-studies.ts        # Case study data
```

---

## 9. tRPC Client Setup

```typescript
// src/trpc/Provider.tsx - React Query provider setup
// src/trpc/client.ts - tRPC client configuration

// Usage in components:
import { api } from "~/trpc/react";
const { data } = api.cases.getAll.useQuery();
```

---

## 11. Testing Setup

### Test Configuration

```
src/test/
├── setup.ts                # Test environment setup
├── utils.tsx               # Test utilities
├── api-utils.ts           # API testing utilities
└── __examples__/           # Example tests
    ├── api-route.test.ts
    ├── component.test.tsx
    └── lib-function.test.ts
```

### Test Runner

- **Framework**: Vitest
- **Testing Library**: React Testing Library
- **DOM**: Happy DOM / JSDOM

---

## 10. Environment Variables

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=        # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Anon key
SUPABASE_SERVICE_ROLE_KEY=       # Service role

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=         # PostHog key
NEXT_PUBLIC_POSTHOG_HOST=        # PostHog host

# VAPI AI
VAPI_PRIVATE_KEY=                # Private API key
VAPI_ASSISTANT_ID=               # Assistant ID
VAPI_PHONE_NUMBER_ID=            # Phone number ID
NEXT_PUBLIC_VAPI_PUBLIC_KEY=    # Public key
VAPI_WEBHOOK_SECRET=             # Webhook secret

# QStash
QSTASH_TOKEN=                    # QStash token
QSTASH_CURRENT_SIGNING_KEY=      # Current key
QSTASH_NEXT_SIGNING_KEY=         # Next key

# AI & Integrations
ANTHROPIC_API_KEY=               # Claude API (optional)
RESEND_API_KEY=                  # Email API
IDEXX_ENCRYPTION_KEY=            # Credential encryption

# Site
NEXT_PUBLIC_SITE_URL=            # Domain for webhooks
NODE_ENV=                        # development/production
```

---

## 13. Configuration Files

### next.config.js

- Turbopack configuration
- PostHog rewrites
- Image optimization (WebP, AVIF)
- Security headers (CSP, X-Frame-Options, etc.)
- SEO optimizations
- Remote image patterns (Unsplash, Sanity CDN)

### tsconfig.json

- Strict mode enabled
- ES2022 target
- Path aliases (`~/` → `./src/`)
- JSX preserved (handled by Next.js)

### vitest.config.ts

- Test environment configuration
- Coverage setup
- UI mode for test exploration

### prettier.config.js

- Code formatting rules
- Tailwind CSS plugin integration

### components.json

- Shadcn/UI component configuration
- Aliases and paths

---

## 11. Database & Migrations

### Supabase Migrations

```
supabase/migrations/
├── 20251201000000_migrate_pilot_clinics_to_schedule_schema.sql
├── 20251115022703_create_scheduled_discharge_emails.sql
├── 20251125100000_add_emergency_phone_to_users.sql
├── 20251130000001_create_available_slots_function.sql
├── 20250115000000_add_voicemail_detection_flag.sql
├── 20251130000000_create_schedule_sync_schema.sql
├── 20251127000001_create_clinic_assistants.sql
├── 20250128000000_add_default_schedule_delay_minutes.sql
├── 20251126000000_ensure_call_status_not_null.sql
├── 20251127000000_create_inbound_vapi_calls.sql
├── 20251116000000_rename_vapi_calls_to_scheduled_discharge_calls.sql
└── 20251125000000_add_test_mode_to_users.sql

migrations/
└── create_normalized_data_table.sql
```

### Key Tables (inferred from code)

- `users` - User profiles and roles
- `cases` - Veterinary case records
- `vapi_calls` / `scheduled_discharge_calls` - Call records
- `inbound_vapi_calls` - Inbound call tracking
- `scheduled_discharge_emails` - Email queue
- `clinic_assistants` - VAPI assistant configuration
- `normalized_data` - AI-normalized information

---

## 12. Styling & Design

### Styling Stack

- **CSS Framework**: Tailwind CSS 4
- **Component Library**: Shadcn/UI (Radix primitives)
- **Icons**: Lucide React
- **Animations**: Framer Motion, Canvas Confetti
- **Charts**: Recharts

### Global Styles

```
src/styles/globals.css
```

### Font Configuration

- Outfit (branding)
- Inter (body)
- Lora (serif)
- Geist Mono (code)

---

## 13. Middleware & Authentication

### Middleware Flow

```typescript
// src/middleware.ts
- Handles session updates via Supabase
- Refreshes user authentication
- Manages secure cookies
```

### Protected Routes Pattern

- Auth guard middleware
- Protected by `/(auth)` group layout
- Admin-only routes checked in tRPC/Server Actions
- Row Level Security (RLS) in Supabase

---

## 17. Code Quality Tools

### ESLint

- Configuration: `eslint.config.js`
- Rules from `eslint-config-next`
- TypeScript support via typescript-eslint
- Drizzle ORM plugin

### Prettier

- Configuration: `prettier.config.js`
- Tailwind CSS plugin for class sorting

### Type Checking

- TypeScript strict mode
- Runtime validation with Zod
- `tsc --noEmit` for type checking

### Pre-commit Hooks

- Husky for git hooks
- Lint-staged for file-specific linting
- Auto-fixes on commit

---

## 18. Deployment Configuration

### Vercel Configuration

- `vercel.json` - Deployment settings
- `.vercel/project.json` - Project metadata
- `next.config.js` - Build optimization

### Key Deployment Notes

- Turbopack enabled for faster builds
- ESLint disabled during builds (migration in progress)
- PostHog rewrites for analytics
- Image optimization enabled

---

## 19. Documentation

### Docs Directory Structure

```
docs/
├── README.md
├── QUICK_REFERENCE.md
├── CLAUDE.md                  # AI assistant guide
├── api/                       # API documentation
├── architecture/              # Architecture decisions
├── compliance/                # Legal & compliance
├── dashboard/                 # Dashboard guides
├── deployment/                # Deployment guides
├── development/               # Development guides
├── implementation/            # Implementation guides
├── integrations/              # Integration guides
├── reference/                 # Reference docs
├── testing/                   # Test guides
└── vapi/                      # VAPI documentation
```

---

## 20. Key Files for Migration Planning

### Critical Files (Must Migrate)

**Configuration**

- `/Users/s0381806/Development/odis-ai-web/next.config.js`
- `/Users/s0381806/Development/odis-ai-web/tsconfig.json`
- `/Users/s0381806/Development/odis-ai-web/package.json`
- `/Users/s0381806/Development/odis-ai-web/src/env.js`
- `/Users/s0381806/Development/odis-ai-web/.env.example`

**Core Setup**

- `/Users/s0381806/Development/odis-ai-web/src/middleware.ts`
- `/Users/s0381806/Development/odis-ai-web/src/app/layout.tsx`
- `/Users/s0381806/Development/odis-ai-web/src/lib/supabase/server.ts`
- `/Users/s0381806/Development/odis-ai-web/src/server/api/trpc.ts`
- `/Users/s0381806/Development/odis-ai-web/src/server/api/root.ts`

**Database**

- `/Users/s0381806/Development/odis-ai-web/supabase/migrations/*.sql`
- `/Users/s0381806/Development/odis-ai-web/migrations/*.sql`

**Styles**

- `/Users/s0381806/Development/odis-ai-web/src/styles/globals.css`
- `/Users/s0381806/Development/odis-ai-web/tailwind.config.ts` (if exists)
- `/Users/s0381806/Development/odis-ai-web/postcss.config.js`

**Critical Libraries**

- `/Users/s0381806/Development/odis-ai-web/src/lib/supabase/*.ts`
- `/Users/s0381806/Development/odis-ai-web/src/lib/vapi/**/*.ts`
- `/Users/s0381806/Development/odis-ai-web/src/lib/idexx/**/*.ts`
- `/Users/s0381806/Development/odis-ai-web/src/lib/qstash/client.ts`
- `/Users/s0381806/Development/odis-ai-web/src/lib/resend/client.ts`

**Server Code**

- All files in `/Users/s0381806/Development/odis-ai-web/src/server/`
- All routers in `/Users/s0381806/Development/odis-ai-web/src/server/api/routers/`

**Key Components** (100+ components)

- Dashboard components: `src/components/dashboard/`
- Admin components: `src/components/admin/`
- UI primitives: `src/components/ui/`

---

## 21. Key Dependencies Summary

### Framework & Core

- `next@15.2.3` - React framework
- `react@19.0.0` - UI library
- `typescript@5.8.2` - Type system

### API & Data

- `@trpc/server@11.6.0` - Type-safe RPC
- `@trpc/client@11.6.0` - tRPC client
- `@trpc/react-query@11.6.0` - React integration
- `@tanstack/react-query@5.90.3` - Data fetching
- `@supabase/supabase-js@2.75.0` - Database client
- `@supabase/ssr@0.7.0` - SSR utilities
- `superjson@2.2.2` - JSON serialization

### Validation & Types

- `zod@3.25.76` - Schema validation
- `@t3-oss/env-nextjs@0.12.0` - Environment validation

### UI & Styling

- `@radix-ui/*` - UI primitives (30+ packages)
- `tailwindcss@4.0.15` - Utility CSS
- `class-variance-authority@0.7.1` - Component variants
- `tailwind-merge@3.3.1` - Class merging
- `shadcn@3.4.2` - Component system
- `lucide-react@0.545.0` - Icons

### AI & Integrations

- `@anthropic-ai/sdk@0.69.0` - Claude API
- `@llamaindex/anthropic@0.3.26` - LlamaIndex
- `llamaindex@0.12.0` - RAG framework
- `@vapi-ai/server-sdk@0.10.2` - VAPI voice
- `@vapi-ai/web@2.5.0` - VAPI browser
- `@upstash/qstash@2.7.29` - Task queue
- `retell-sdk@4.56.0` - Retell AI
- `resend@6.4.2` - Email service

### Analytics

- `posthog-js@1.275.1` - Frontend analytics
- `posthog-node@5.9.5` - Backend analytics

### Forms & UI

- `react-hook-form@7.65.0` - Form management
- `@hookform/resolvers@5.2.2` - Form resolvers
- `framer-motion@12.23.24` - Animations
- `embla-carousel-react@8.6.0` - Carousel
- `recharts@2.15.4` - Charts
- `sonner@2.0.7` - Toast notifications

### Dev Tools

- `vitest@4.0.13` - Test runner
- `@testing-library/react@16.3.0` - Component testing
- `eslint@9.23.0` - Linting
- `prettier@3.5.3` - Code formatting
- `husky@9.1.7` - Git hooks
- `tailwindcss@4.0.15` - CSS generation

---

## 22. Critical Implementation Patterns

### Authentication Pattern

1. Supabase Auth provides session
2. Middleware refreshes session on each request
3. Server components access user via `createClient()`
4. tRPC context retrieves user from Supabase
5. Protected routes use `protectedProcedure`

### API Request Pattern

- Client → tRPC (preferred for real-time/complex)
- Client → Server Action (form submissions)
- Client → API Route (webhooks/external integrations)
- Server-to-Server → API Route (webhooks)

### Data Fetching Pattern

- Server Components: Direct Supabase queries
- Client Components: tRPC or React Query
- Real-time: Supabase subscriptions or polling

### Error Handling

- tRPC error formatting with Zod validation
- Try-catch blocks in Server Actions
- Error boundaries in components
- Typed error responses

---

## 23. Notable Architecture Decisions

1. **Dual API Pattern**: tRPC for main app, Server Actions for webhooks/forms
2. **Service Client Separation**: Separate RLS-bypassing client for admin operations
3. **Env Validation at Runtime**: Using t3-oss/env-nextjs for compile-time safety
4. **Component Library Strategy**: Shadcn/UI for easy customization
5. **Knowledge Base Architecture**: Modular veterinary knowledge organization by specialty
6. **Webhook Pattern**: QStash for reliable asynchronous task execution

---

## Summary: Migration Checklist

### Phase 1: Core Setup

- [ ] Copy environment configuration (env.js, tsconfig.json, next.config.js)
- [ ] Copy package.json and install dependencies
- [ ] Copy database schema and migrations
- [ ] Set up Supabase clients and middleware

### Phase 2: Layout & Styling

- [ ] Copy app layout and root routes
- [ ] Copy global styles and Tailwind config
- [ ] Copy all UI component library
- [ ] Copy font configuration

### Phase 3: tRPC & Server Code

- [ ] Copy tRPC setup and all routers
- [ ] Copy Server Actions
- [ ] Copy all API routes
- [ ] Copy all utility libraries

### Phase 4: Components & Pages

- [ ] Copy all dashboard components
- [ ] Copy all admin components
- [ ] Copy all page components
- [ ] Copy custom hooks

### Phase 5: Integration & Testing

- [ ] Set up PostHog analytics
- [ ] Configure VAPI & QStash
- [ ] Copy test utilities

### Phase 6: Documentation

- [ ] Copy CLAUDE.md and docs
- [ ] Update environment templates
- [ ] Document migration decisions

---

## File Count Summary

- **Total TypeScript/TSX files**: ~350+
- **API routes**: 20+
- **tRPC routers**: 8
- **Components**: 150+
- **Utility functions**: 50+
- **Database migrations**: 12+
- **Configuration files**: 10+

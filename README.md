# ODIS AI

> **Veterinary Technology Platform** - Automating patient discharge calls and case management with AI-powered voice assistants

[![CI](https://github.com/odis-ai/odis-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/odis-ai/odis-ai/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Private-red.svg)](LICENSE)
[![pnpm](https://img.shields.io/badge/pnpm-10.23.0-blue)](https://pnpm.io/)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0-green)](https://nodejs.org/)

ODIS AI is a veterinary technology platform that automates patient discharge calls and case management using voice AI. Core capabilities include automated discharge calls via VAPI, headless IDEXX Neo synchronization, and intelligent case workflow automation.

## Features

- **Voice AI Automation** - Automated discharge and inbound calls via VAPI integration
- **Case Management** - Veterinary case tracking with SOAP notes and workflow automation
- **IDEXX Integration** - Headless sync service for IDEXX Neo veterinary software
- **Discharge Orchestration** - Batch scheduling, staggered calls, and retry logic
- **Real-time Dashboard** - Monitor cases, calls, and clinic activity
- **Multi-tenant** - Support for multiple clinics with custom configurations

## Tech Stack

### Core Technologies

- **Framework** - [Next.js 16](https://nextjs.org/) (App Router) with [React 19](https://react.dev/)
- **Language** - [TypeScript](https://www.typescriptlang.org/) (strict mode)
- **Database** - [Supabase](https://supabase.com/) (PostgreSQL)
- **API** - [tRPC](https://trpc.io/) for type-safe APIs
- **Styling** - [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components** - [shadcn/ui](https://ui.shadcn.com/) (59+ components)
- **Monorepo** - [Nx](https://nx.dev/) workspace

### Key Integrations

- **Voice AI** - [VAPI](https://vapi.ai/) for voice calls
- **Scheduling** - [QStash](https://upstash.com/qstash) for job scheduling
- **Email** - [Resend](https://resend.com/) for transactional emails
- **Notifications** - [Slack](https://slack.com/) integration
- **AI** - [Anthropic Claude](https://anthropic.com/) via LlamaIndex
- **Analytics** - [PostHog](https://posthog.com/) for product analytics

## Quick Start

### Prerequisites

- Node.js >= 20.0
- pnpm 10.23.0+
- PostgreSQL (via Supabase)

### Installation

```bash
# Clone the repository
git clone https://github.com/odis-ai/odis-ai.git
cd odis-ai

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Configure your environment variables
# Edit .env.local with your credentials

# Start development server
pnpm dev
```

The dashboard will be available at [http://localhost:3000](http://localhost:3000).

### Environment Setup

See `.env.example` for required environment variables. Key variables include:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `VAPI_API_KEY` - VAPI API key for voice calls
- `QSTASH_*` - QStash credentials for scheduling
- `SLACK_*` - Slack webhook URLs for notifications

## Development

### Available Commands

```bash
# Development
pnpm dev                    # Start Next.js dev server
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm preview                # Build and start production server

# Code Quality
pnpm lint                   # Lint web app
pnpm lint:all               # Lint all projects
pnpm typecheck              # TypeScript check (web)
pnpm typecheck:all          # TypeScript check (all)
pnpm check                  # Run lint + typecheck (all)
pnpm format:check           # Check code formatting
pnpm format:write           # Format code

# Testing
pnpm test:all               # Run all tests
pnpm test:libs              # Test library projects only
pnpm test:coverage          # Generate coverage report
pnpm test:watch             # Run tests in watch mode
pnpm test:ui                # Open Vitest UI

# Nx Commands
pnpm graph                  # View dependency graph
pnpm docs:nx                # Regenerate Nx documentation
nx affected -t lint,test    # Run tasks on affected projects
nx test <project>           # Test specific project
nx test <project> -t "name" # Run specific test

# Documentation
pnpm docs:dev               # Start Docusaurus dev server
pnpm docs:build             # Build documentation
pnpm docs:serve             # Serve built documentation

# Other
pnpm update-types           # Update Supabase types
pnpm kill-dev               # Kill dev servers
```

### Project Structure

```
odis-ai/
├── apps/
│   ├── web/                 # Next.js 16 application
│   │   ├── src/
│   │   │   ├── app/         # Next.js App Router
│   │   │   ├── server/      # tRPC routers, server actions
│   │   │   └── components/  # React components
│   │   └── public/
│   ├── docs/                # Docusaurus documentation
│   └── idexx-sync/          # IDEXX Neo sync service (Express + Playwright)
│
├── libs/
│   ├── shared/              # Cross-cutting concerns
│   │   ├── types/           # TypeScript types (Database, Case, Patient)
│   │   ├── validators/      # Zod schemas (95%+ test coverage)
│   │   ├── util/            # Utilities (transforms, dates, phone)
│   │   ├── ui/              # shadcn/ui components (59+)
│   │   ├── hooks/           # React hooks
│   │   ├── logger/          # Structured logging
│   │   ├── crypto/          # AES encryption
│   │   ├── constants/       # Shared constants
│   │   ├── env/             # Environment validation
│   │   ├── styles/          # Global CSS + Tailwind
│   │   ├── testing/         # Test utilities, mocks
│   │   └── email/           # Email templates (React Email)
│   │
│   ├── data-access/         # Database layer
│   │   ├── db/              # Main re-export (clients + repos)
│   │   ├── supabase-client/ # Supabase client initialization
│   │   ├── repository-interfaces/  # Repository contracts
│   │   ├── repository-impl/ # Concrete implementations
│   │   ├── api/             # API helpers (auth, CORS, responses)
│   │   └── entities/        # Domain entities
│   │
│   ├── domain/              # Business logic
│   │   ├── cases/           # CasesService (case management)
│   │   ├── discharge/       # DischargeOrchestrator, batch processor
│   │   ├── shared/          # ExecutionPlan, shared utilities
│   │   ├── clinics/         # Clinic config, VAPI helpers
│   │   └── auth/            # Authentication utilities
│   │
│   └── integrations/        # External services
│       ├── vapi/            # VAPI voice AI integration
│       ├── idexx/           # IDEXX Neo transforms
│       ├── qstash/          # QStash scheduling
│       ├── resend/          # Email sending
│       ├── slack/           # Slack notifications
│       ├── ai/              # LlamaIndex/Anthropic
│       └── stripe/          # Payment processing
│
├── docs/                    # Documentation
│   ├── architecture/        # Architecture docs
│   ├── api/                 # API reference
│   ├── reference/           # Nx inventory, guides
│   └── testing/             # Testing strategy
│
├── scripts/                 # Build and maintenance scripts
├── supabase/                # Supabase configuration
└── tools/                   # Development tools
```

### Import Paths

All libraries use the `@odis-ai/` namespace for domain-grouped imports:

```typescript
// Shared
import type { DashboardCase, Database } from "@odis-ai/shared/types";
import { dischargeSchema } from "@odis-ai/shared/validators";
import { transformBackendCase } from "@odis-ai/shared/util";
import { Button, Card } from "@odis-ai/shared/ui";

// Data Access
import { createServerClient } from "@odis-ai/data-access/db";
import type { ICasesRepository } from "@odis-ai/data-access/repository-interfaces";

// Domain
import { CasesService } from "@odis-ai/domain/cases";
import { DischargeOrchestrator } from "@odis-ai/domain/discharge";

// Integrations
import { createPhoneCall } from "@odis-ai/integrations/vapi";
import { scheduleCallExecution } from "@odis-ai/integrations/qstash";
```

## Architecture

### Key Patterns

#### Repository Pattern + Dependency Injection

Services accept repository interfaces for testability:

```typescript
// Interfaces in @odis-ai/data-access/repository-interfaces
interface ICasesRepository {
  findById(id: string): Promise<Case | null>;
  create(data: CreateCaseInput): Promise<Case>;
}

// Concrete implementations in @odis-ai/data-access/repository-impl
class CasesRepository implements ICasesRepository { ... }

// Services accept interfaces (DI)
class CasesService {
  constructor(
    private casesRepo: ICasesRepository,
    private callRepo: ICallRepository
  ) {}
}
```

#### Supabase Client Pattern

```typescript
// Standard client (RLS-enabled, uses cookies)
import { createServerClient } from "@odis-ai/data-access/db";

// Service client (bypasses RLS - admin/webhook paths ONLY)
import { createServiceClient } from "@odis-ai/data-access/db";
```

#### React Patterns

- Default to Server Components
- Minimize `"use client"` usage
- Wrap client components in Suspense with fallback
- Use refs for polling stability

### Security

- **Service Client**: `createServiceClient()` bypasses Row Level Security - use ONLY in webhooks and admin-only server actions
- **Environment Variables**: `NEXT_PUBLIC_*` variables are exposed to browser - NEVER store secrets
- **Webhook Verification**: Always verify signatures (VAPI, QStash)
- **Authentication**: Supabase Auth for user sessions, tRPC protected procedures enforce auth

## Testing

Framework: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)
Coverage Target: **70% lines/functions/branches**

```bash
# Run all tests
pnpm test:all

# Run specific project tests
nx test <project>

# Run specific test
nx test <project> -t "test name"

# Watch mode
nx test <project> --watch

# Coverage
nx test <project> --coverage
pnpm test:coverage:all
```

Tests are colocated in `__tests__/` directories. See [`docs/testing/TESTING_STRATEGY.md`](docs/testing/TESTING_STRATEGY.md) for details.

## Documentation

- [AGENTS.md](AGENTS.md) - AI agent coding guidelines (comprehensive)
- [CLAUDE.md](CLAUDE.md) - Quick reference for Claude Code
- [Nx Projects Inventory](docs/reference/NX_PROJECTS.md) - Auto-generated project docs
- [Testing Strategy](docs/testing/TESTING_STRATEGY.md) - Testing guidelines
- [Core Libraries](docs/architecture/CORE_LIBS.md) - Shared library documentation
- [Nx Best Practices](docs/architecture/NX_BEST_PRACTICES.md) - Monorepo guidelines
- [API Reference](docs/api/API_REFERENCE.md) - API documentation

## Deployment

The application is deployed on [Vercel](https://vercel.com/):

- **Production**: [odis-ai.vercel.app](https://odis-ai.vercel.app)
- **Preview**: Automatic preview deployments for all branches

### Environment Variables

Configure these in Vercel project settings:

- Supabase credentials
- VAPI API key
- QStash credentials
- Slack webhook URLs
- Resend API key
- Anthropic API key

## Contributing

1. Create a new branch from `main`
2. Make your changes
3. Run quality checks: `pnpm check`
4. Run tests: `pnpm test:all`
5. Create a pull request

### Commit Convention

We use [conventional commits](https://www.conventionalcommits.org/):

```
type(scope): description

Examples:
feat(vapi): add retry logic for failed calls
fix(dashboard): correct case count calculation
refactor(db): split repository implementations
docs(readme): update installation instructions
test(validators): add discharge schema tests
```

**Scopes:**

- `web` - Next.js frontend
- `extension` - Chrome extension, IDEXX Neo
- `cases` - Case management, SOAP notes
- `clinics` - Clinic config, multi-tenant
- `vapi` - VAPI voice AI
- `outbound` - Discharge calls/emails
- `inbound` - Incoming calls, booking
- `dashboard` - Widgets, analytics
- `ui` - Shared components
- `util` - Utilities
- `db` - Supabase

## License

Private - ODIS AI Platform

## Support

For support, contact the ODIS AI team or open an issue in the repository.

---

**Built with** [Next.js](https://nextjs.org/) · [React](https://react.dev/) · [TypeScript](https://www.typescriptlang.org/) · [Nx](https://nx.dev/) · [Supabase](https://supabase.com/) · [VAPI](https://vapi.ai/)

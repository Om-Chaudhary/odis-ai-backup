# Core Libraries (Domain-Grouped Architecture)

> Inventory of libraries in the Nx workspace organized by domain. See `AGENTS.md` for import conventions.

**Last Updated**: December 2024  
**Total Libraries**: 28  
**Architecture**: Domain-grouped (`shared/`, `data-access/`, `domain/`, `integrations/`, `extension/`)

---

## Shared Libraries (`libs/shared/`)

Cross-cutting concerns used across the entire monorepo.

### @odis-ai/shared/types

- **Purpose**: Shared TypeScript types and interfaces
- **Key exports**: `Database`, `DashboardCase`, `DashboardStats`, `CaseData`, `PatientInfo`, `OrchestrationStep`
- **Platform**: neutral

### @odis-ai/shared/validators

- **Purpose**: Zod validation schemas for API requests, webhooks, data integrity
- **Key exports**: `dischargeSchema`, `dischargeSummarySchema`, `assessmentQuestionsSchema`, `orchestrationSchema`, `scheduleSchema`, `scribeSchema`
- **Test coverage**: 236+ tests, 95%+ coverage
- **Platform**: neutral

### @odis-ai/shared/util

- **Purpose**: Shared utility functions
- **Key exports**: `transformBackendCaseToDashboardCase`, `isWithinBusinessHours`, `getNextBusinessHourSlot`, `formatPhoneNumber`, `cn`
- **Platform**: neutral

### @odis-ai/shared/ui

- **Purpose**: shadcn/ui React components
- **Components**: 59 components (Button, Card, DataTable, Dialog, etc.)
- **Platform**: browser

### @odis-ai/shared/hooks

- **Purpose**: Shared React hooks
- **Key exports**: `useCallPolling`, `useToast`, `useMediaQuery`, `useOnClickOutside`
- **Platform**: browser

### @odis-ai/shared/logger

- **Purpose**: Structured logging with namespaces
- **Key exports**: `loggers`, `createLogger`, `Logger`
- **Usage**: Use namespaces per domain (e.g., `vapi-webhook`, `db-repo`, `qstash-runner`)
- **Platform**: neutral

### @odis-ai/shared/crypto

- **Purpose**: AES encryption helpers
- **Key exports**: `encrypt`, `decrypt`
- **Platform**: neutral

### @odis-ai/shared/constants

- **Purpose**: Shared constants and configuration values
- **Platform**: neutral

### @odis-ai/shared/env

- **Purpose**: Environment variable validation (t3-env)
- **Platform**: neutral

### @odis-ai/shared/styles

- **Purpose**: Global CSS and Tailwind configuration
- **Platform**: browser

### @odis-ai/shared/testing

- **Purpose**: Test utilities, mocks, fixtures
- **Key exports**: `createMockSupabaseClient`, test fixtures, custom matchers
- **Platform**: neutral

### @odis-ai/shared/email

- **Purpose**: Email template rendering (React Email)
- **Platform**: node

---

## Data Access Libraries (`libs/data-access/`)

Database layer with repository pattern implementation.

### @odis-ai/data-access/db

- **Purpose**: Main re-export of Supabase clients and repositories
- **Key exports**: `createServerClient`, `createBrowserClient`, `createServiceClient`, repository interfaces and implementations
- **Note**: Convenience re-export; prefer specific imports for clarity
- **Platform**: node

### @odis-ai/data-access/supabase-client

- **Purpose**: Supabase client initialization
- **Key exports**: `createServerClient`, `createBrowserClient`, `createServiceClient`, `createProxyClient`
- **Platform**: node + browser

### @odis-ai/data-access/repository-interfaces

- **Purpose**: Repository contracts for dependency injection
- **Key exports**: `ICasesRepository`, `IUserRepository`, `ICallRepository`, `IEmailRepository`
- **Usage**: Services accept these interfaces for testability
- **Platform**: node

### @odis-ai/data-access/repository-impl

- **Purpose**: Concrete Supabase implementations
- **Key exports**: `CasesRepository`, `UserRepository`, `CallRepository`, `EmailRepository`, `BaseRepository`
- **Platform**: node

### @odis-ai/data-access/api

- **Purpose**: API helpers for server actions and routes
- **Key exports**: `getAuthHeaders`, `corsHeaders`, `createApiResponse`, `ApiError`
- **Platform**: node

### @odis-ai/data-access/entities

- **Purpose**: Domain entity helpers
- **Key exports**: Scribe transaction entities
- **Platform**: node

---

## Domain Libraries (`libs/domain/`)

Business logic and feature-specific services.

### @odis-ai/domain/cases

- **Purpose**: Case management service layer
- **Key exports**: `CasesService`
- **Features**: Case CRUD, ingestion, status management, scheduling
- **Dependencies**: Repository interfaces, VAPI, QStash
- **Platform**: node

### @odis-ai/domain/discharge

- **Purpose**: Discharge workflow orchestration
- **Key exports**: `DischargeOrchestrator`, `DischargeBatchProcessor`
- **Features**: Batch processing, staggered scheduling, retry logic, call/email execution
- **Test coverage**: Comprehensive batch stagger tests
- **Platform**: node

### @odis-ai/domain/shared

- **Purpose**: Shared service utilities
- **Key exports**: `ExecutionPlan`, service interfaces
- **Platform**: node

### @odis-ai/domain/clinics

- **Purpose**: Clinic configuration and VAPI config helpers
- **Key exports**: `getClinicByUserId`, `getVapiConfig`, `getClinicConfig`
- **Platform**: neutral

### @odis-ai/domain/auth

- **Purpose**: Authentication utilities
- **Platform**: neutral

---

## Integration Libraries (`libs/integrations/`)

External service integrations.

### @odis-ai/integrations/vapi

- **Purpose**: VAPI voice AI integration (main library)
- **Key exports**: `createPhoneCall`, `validateVariables`, `extractVariables`, webhook handlers, tool registry
- **Sub-modules**:
  - `webhooks/` - Webhook handlers (end-of-call, status-update, etc.)
  - `tools/` - Tool registry and executor
  - `knowledge-base/` - Medical specialty knowledge bases
- **Interface**: `ICallClient` for testing
- **Platform**: node

### @odis-ai/integrations/idexx

- **Purpose**: IDEXX Neo integration
- **Key exports**: `transformIdexxData`, `CredentialManager`, `validateIdexxData`
- **Platform**: node

### @odis-ai/integrations/qstash

- **Purpose**: QStash scheduling for delayed execution
- **Key exports**: `scheduleCallExecution`, `QStashClient`
- **Interface**: `IScheduler` for testing
- **Platform**: node

### @odis-ai/integrations/resend

- **Purpose**: Email sending via Resend
- **Key exports**: `sendEmail`, `ResendClient`
- **Interface**: `IEmailClient` for testing
- **Platform**: node

### @odis-ai/integrations/slack

- **Purpose**: Slack notifications and OAuth
- **Key exports**: Slack client, message formatters
- **Platform**: node

### @odis-ai/integrations/ai

- **Purpose**: AI/LLM utilities (LlamaIndex, Anthropic)
- **Platform**: node

### @odis-ai/integrations/retell

- **Purpose**: Legacy Retell integration
- **Status**: Deprecated - use VAPI
- **Platform**: node

---

## Extension Libraries (`libs/extension/`)

Chrome extension specific libraries.

### @odis-ai/extension/shared

- **Purpose**: Shared extension utilities
- **Key exports**: Extension hooks, utilities
- **Platform**: browser

### @odis-ai/extension/storage

- **Purpose**: Storage abstractions for Chrome extension
- **Key exports**: `StorageArea`, storage hooks
- **Platform**: browser

### @odis-ai/extension/env

- **Purpose**: Extension environment configuration
- **Platform**: browser

---

## Dependency Tiers

```
Tier 0 (Foundation):     env, constants, crypto, logger, styles
Tier 1 (Utilities):      types, validators, util, hooks
Tier 2 (Data):           db, api, supabase-client, repository-*
Tier 3 (Domain):         clinics, email, auth
Tier 4 (Integration):    vapi, idexx, qstash, resend, slack, ai
Tier 5 (Orchestration):  domain/cases, domain/discharge
Tier 6 (Application):    apps/web, apps/chrome-extension
```

---

## Related Documentation

- [AGENTS.md](../../AGENTS.md) - Import conventions and patterns
- [NX_BEST_PRACTICES.md](./NX_BEST_PRACTICES.md) - Nx workspace conventions
- [NX_PROJECTS.md](../reference/NX_PROJECTS.md) - Generated project inventory
- [TESTING_STRATEGY.md](../testing/TESTING_STRATEGY.md) - Testing approach

---

_Regenerate Nx inventory with `pnpm docs:nx`_

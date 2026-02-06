# Import Conventions & Patterns

## Imports

All imports use the `@odis-ai/` namespace with domain grouping. See `tsconfig.base.json` for all path aliases.

```typescript
import type { DashboardCase } from "@odis-ai/shared/types";
import { dischargeSchema } from "@odis-ai/shared/validators";
import { Button } from "@odis-ai/shared/ui";
import { createServerClient } from "@odis-ai/data-access/db";
import type { ICasesRepository } from "@odis-ai/data-access/repository-interfaces";
import { CasesService } from "@odis-ai/domain/cases";
import { createPhoneCall } from "@odis-ai/integrations/vapi";
```

Web app internal imports use `~/` prefix sparingly: `import { something } from "~/lib/something";`

## Repository Pattern

Services accept interface contracts from `@odis-ai/data-access/repository-interfaces` for testability. Concrete implementations live in `@odis-ai/data-access/repository-impl`. New services should follow this pattern.

## tRPC Routers

Located at `apps/web/src/server/api/routers/`. Organized by domain: dashboard, cases, outbound, inbound, inbound-calls, admin, settings, subscription, team. Each router has `index.ts`, `schemas.ts`, and optionally a `procedures/` subdirectory.

## Server Actions vs API Routes

- **Server Actions** (`apps/web/src/server/actions/`): Internal form handling, simple mutations
- **API Routes** (`apps/web/src/app/api/`): Webhooks, external integrations, cron jobs, VAPI endpoints

## Nx Tasks

Always run tasks through `nx` (not the underlying tool directly): `nx run`, `nx run-many`, `nx affected`. Use `nx_workspace`, `nx_project_details`, and `nx_docs` MCP tools for exploration.

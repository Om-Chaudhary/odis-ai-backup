# Migration Guide: apps/pims-sync to libs/integrations/idexx

This guide explains how to migrate from the old `apps/pims-sync` browser service to the new `libs/integrations/idexx` library structure.

## Summary of Changes

### Phase 1 (Completed)

- ✅ Created `IPimsProvider` interface in `libs/domain/sync/data-access`
- ✅ Defined standard PIMS data types (credentials, schedule, appointments, consultations)

### Phase 2 (This Phase)

- ✅ Created `libs/integrations/idexx/src/browser/` - Browser automation
- ✅ Created `libs/integrations/idexx/src/provider/` - IDEXX provider implementation
- ✅ Updated tsconfig.base.json paths
- ⏳ Need to update `apps/pims-sync` to use new library

## Migration Steps for apps/pims-sync

### 1. Update Imports

**Before:**

```typescript
// apps/pims-sync/src/services/browser-service.ts
import { BrowserService } from "./services/browser-service";
import { BrowserPool } from "./services/browser-pool";
```

**After:**

```typescript
// Use library imports
import {
  BrowserService,
  BrowserPool,
} from "@odis-ai/integrations/idexx/browser";
import { IdexxProvider } from "@odis-ai/integrations/idexx/provider";
```

### 2. Update Express Routes

**Before:**

```typescript
// apps/pims-sync/src/routes/idexx.ts
app.post("/api/sync", async (req, res) => {
  const browserService = new BrowserService();
  // ... manual scraping logic
});
```

**After:**

```typescript
// apps/pims-sync/src/routes/sync.ts
import { IdexxProvider } from "@odis-ai/integrations/idexx/provider";
import { BrowserService } from "@odis-ai/integrations/idexx/browser";

app.post("/api/sync/idexx", async (req, res) => {
  const browserService = new BrowserService({ headless: true });
  const provider = new IdexxProvider({
    browserService,
    baseUrl: process.env.IDEXX_BASE_URL,
    debug: process.env.NODE_ENV === "development",
  });

  try {
    // Authenticate
    const authenticated = await provider.authenticate({
      username: req.body.username,
      password: req.body.password,
      companyId: req.body.companyId,
    });

    if (!authenticated) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    // Fetch appointments
    const appointments = await provider.fetchAppointments(
      new Date(req.body.startDate),
      new Date(req.body.endDate),
    );

    res.json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await provider.close();
  }
});
```

### 3. Update Service Layer

**Before:**

```typescript
// apps/pims-sync/src/services/sync-service.ts
export class SyncService {
  constructor(private browserService: BrowserService) {}

  async syncIdexx(credentials: any) {
    // Manual scraping logic
    const page = await this.browserService.createPage();
    await page.goto("https://us.idexxneo.com/login");
    // ... more manual logic
  }
}
```

**After:**

```typescript
// apps/pims-sync/src/services/sync-orchestrator.ts
import type { IPimsProvider } from "@odis-ai/domain/sync";
import { IdexxProvider } from "@odis-ai/integrations/idexx/provider";

export class SyncOrchestrator {
  constructor(private provider: IPimsProvider) {}

  async syncAppointments(startDate: Date, endDate: Date) {
    if (!this.provider.isAuthenticated()) {
      throw new Error("Provider not authenticated");
    }

    // Use provider interface
    const appointments = await this.provider.fetchAppointments(
      startDate,
      endDate,
    );

    // Process appointments
    for (const appointment of appointments) {
      if (appointment.consultationId) {
        const consultation = await this.provider.fetchConsultation(
          appointment.consultationId,
        );
        // Store to database...
      }
    }

    return { success: true, count: appointments.length };
  }
}
```

### 4. Update App Initialization

**Before:**

```typescript
// apps/pims-sync/src/index.ts
import express from "express";
import { BrowserService } from "./services/browser-service";

const app = express();
const browserService = new BrowserService();

// Use globally
```

**After:**

```typescript
// apps/pims-sync/src/index.ts
import express from "express";
import { BrowserService } from "@odis-ai/integrations/idexx/browser";
import { IdexxProvider } from "@odis-ai/integrations/idexx/provider";

const app = express();

// Create provider factory
function createIdexxProvider() {
  const browserService = new BrowserService({
    headless: process.env.HEADLESS !== "false",
    defaultTimeout: 30000,
  });

  return new IdexxProvider({
    browserService,
    baseUrl: process.env.IDEXX_BASE_URL ?? "https://us.idexxneo.com",
    debug: process.env.NODE_ENV === "development",
  });
}

// Use in routes with proper lifecycle
app.post("/sync", async (req, res) => {
  const provider = createIdexxProvider();
  try {
    // Use provider
  } finally {
    await provider.close();
  }
});
```

### 5. Remove Old Files

After migration, remove these files from `apps/pims-sync`:

```bash
# Delete migrated files
rm apps/pims-sync/src/services/browser-service.ts
rm apps/pims-sync/src/services/browser-pool.ts
rm apps/pims-sync/src/scrapers/idexx-scraper.ts # If exists
```

## Benefits of Migration

1. **Separation of Concerns**: Business logic in libs, app orchestration in apps
2. **Reusability**: Browser automation and IDEXX provider can be used across apps
3. **Type Safety**: IPimsProvider interface ensures consistency
4. **Testability**: Libraries are easier to test in isolation
5. **Maintainability**: Clear module boundaries
6. **Extensibility**: Easy to add new PIMS providers (ezyVet, Cornerstone, etc.)

## Future PIMS Providers

After IDEXX migration is complete, adding new PIMS providers is straightforward:

```typescript
// libs/integrations/ezyvet/src/provider/ezyvet-provider.ts
export class EzyVetProvider implements IPimsProvider {
  readonly name = "ezyVet";

  async authenticate(credentials: PimsCredentials): Promise<boolean> {
    // ezyVet-specific authentication
  }

  async fetchAppointments(start: Date, end: Date): Promise<PimsAppointment[]> {
    // ezyVet-specific API calls
  }

  // ... implement other interface methods
}
```

Then in `apps/pims-sync`:

```typescript
// apps/pims-sync/src/providers/index.ts
import { IdexxProvider } from "@odis-ai/integrations/idexx/provider";
import { EzyVetProvider } from "@odis-ai/integrations/ezyvet/provider";

export function createProvider(type: string) {
  switch (type) {
    case "idexx":
      return new IdexxProvider({
        /* config */
      });
    case "ezyvet":
      return new EzyVetProvider({
        /* config */
      });
    default:
      throw new Error(`Unknown PIMS provider: ${type}`);
  }
}
```

## Testing

After migration, test the following:

1. **Authentication**: Verify login flow works
2. **Schedule Fetch**: Confirm schedule config retrieval
3. **Appointments**: Test date range queries
4. **Consultations**: Verify SOAP note fetching
5. **Error Handling**: Test invalid credentials, network errors
6. **Cleanup**: Ensure browser resources are released

## Rollback Plan

If issues arise, the old code remains in `apps/pims-sync` until fully validated. Rollback by reverting imports:

```typescript
// Rollback to old imports
import { BrowserService } from "./services/browser-service";
```

## Questions?

Contact the platform team or open an issue in the repository.

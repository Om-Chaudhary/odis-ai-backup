# @odis-ai/integrations/idexx

IDEXX Neo integration library for ODIS AI.

## Features

- **Browser Automation** - Playwright-based browser service and pool for web scraping
- **PIMS Provider** - IPimsProvider implementation for IDEXX Neo
- **Data Transformation** - Convert IDEXX data to ODIS AI format
- **Credential Management** - Secure credential storage with AES-256-GCM encryption

## Installation

```bash
pnpm install
```

## Usage

### Browser Service

```typescript
import { BrowserService } from "@odis-ai/integrations/idexx/browser";

const browserService = new BrowserService({
  headless: true,
  defaultTimeout: 30000,
});

// Launch browser
await browserService.launch();

// Create a page
const session = await browserService.createPage();
await browserService.navigateTo(session.page, "https://us.idexxneo.com");

// Cleanup
await browserService.close();
```

### Browser Pool

```typescript
import { BrowserPool } from "@odis-ai/integrations/idexx/browser";

const pool = new BrowserPool({
  maxBrowsers: 3,
  maxContextsPerBrowser: 5,
});

// Use pool with automatic acquire/release
await pool.withPage(async (session) => {
  await session.page.goto("https://example.com");
  const title = await session.page.title();
  return title;
});

// Cleanup
await pool.close();
```

### IDEXX Provider

```typescript
import { IdexxProvider } from "@odis-ai/integrations/idexx/provider";
import { BrowserService } from "@odis-ai/integrations/idexx/browser";

const browserService = new BrowserService({ headless: true });
const provider = new IdexxProvider({
  browserService,
  baseUrl: "https://us.idexxneo.com",
  debug: true,
});

// Authenticate
const success = await provider.authenticate({
  username: "user@example.com",
  password: "password",
  companyId: "12345",
});

// Fetch schedule config
const config = await provider.fetchScheduleConfig();

// Fetch appointments
const appointments = await provider.fetchAppointments(
  new Date("2025-01-01"),
  new Date("2025-01-31"),
);

// Fetch consultation
const consultation = await provider.fetchConsultation("consultation-id");

// Cleanup
await provider.close();
```

### Data Transformation

```typescript
import { transformIdexxToCallRequest } from "@odis-ai/integrations/idexx";
import type { IdexxPageData } from "@odis-ai/integrations/idexx";

const idexxData: IdexxPageData = {
  pageData: {
    patient: { name: "Max", species: "Dog", breed: "Labrador" },
    client: { name: "John Doe", phone: "555-1234", email: "john@example.com" },
    consultation: {
      id: 123,
      consultationId: "C123",
      reason: "Wellness check",
      notes: "Patient is healthy",
      date: "2025-01-15",
      status: "completed",
    },
    clinic: {
      name: "ABC Vet Clinic",
      phone: "555-5678",
      email: "abc@vet.com",
      id: 1,
      companyId: 100,
    },
    providers: [
      {
        name: "Dr. Smith",
        email: "smith@vet.com",
        id: 1,
        licenseNumber: "VET123",
        userType: "Vet",
        companyId: 100,
      },
    ],
  },
};

const callRequest = transformIdexxToCallRequest(
  idexxData,
  new Date("2025-01-16T10:00:00Z"),
  "Follow-up call",
);
```

### Credential Management

```typescript
import { IdexxCredentialManager } from "@odis-ai/integrations/idexx";

const manager = await IdexxCredentialManager.create();

// Store credentials
await manager.storeCredentials(
  "user-id",
  "clinic-id",
  "username",
  "password",
  "company-id",
);

// Retrieve credentials
const credentials = await manager.getCredentials("user-id", "clinic-id");

// Check status
const status = await manager.getCredentialStatus("user-id", "clinic-id");
```

## Architecture

### Directory Structure

```
libs/integrations/idexx/src/
├── browser/              # Browser automation
│   ├── browser-service.ts  # Browser lifecycle management
│   ├── browser-pool.ts     # Browser pooling for concurrency
│   ├── types.ts            # Browser types
│   └── index.ts
├── provider/             # PIMS provider implementation
│   ├── idexx-provider.ts   # Main provider class (IPimsProvider)
│   ├── auth-client.ts      # Authentication client
│   ├── schedule-client.ts  # Schedule/appointment client
│   ├── consultation-client.ts # Consultation client
│   ├── types.ts            # Provider types
│   └── index.ts
├── transformer.ts        # Data transformations
├── validation.ts         # Credential validation
├── types.ts              # IDEXX data types
├── credential-manager.ts # Credential storage
└── index.ts              # Main export
```

### Import Paths

```typescript
// Main library (all exports)
import { ... } from '@odis-ai/integrations/idexx';

// Browser automation only
import { ... } from '@odis-ai/integrations/idexx/browser';

// PIMS provider only
import { ... } from '@odis-ai/integrations/idexx/provider';
```

## Testing

```bash
# Run tests
nx test integrations-idexx

# Run with coverage
nx test integrations-idexx --coverage

# Watch mode
nx test integrations-idexx --watch
```

## Type Checking

```bash
nx typecheck integrations-idexx
```

## Dependencies

- `playwright` - Browser automation
- `@odis-ai/domain/sync` - PIMS provider interfaces
- `@odis-ai/data-access/db` - Database access
- `@odis-ai/shared/crypto` - Encryption utilities

## Related

- [libs/domain/sync](../../domain/sync/data-access/README.md) - PIMS provider interfaces
- [apps/pims-sync](../../../apps/pims-sync/README.md) - PIMS sync service

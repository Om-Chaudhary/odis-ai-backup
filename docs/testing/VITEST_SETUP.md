# Vitest Testing Setup for Nx Monorepo

This project uses [Vitest](https://vitest.dev/) for unit and integration testing, configured for scalable testing across an Nx monorepo.

## Quick Start

```bash
# Run all tests
pnpm test:all

# Run tests for web app only
pnpm test

# Run tests for all libraries
pnpm test:libs

# Run tests with coverage
pnpm test:coverage:all

# Run tests for affected projects only (CI-optimized)
pnpm test:affected

# Run tests in watch mode
pnpm test:watch

# Run tests with interactive UI
pnpm test:ui
```

## Workspace Architecture

```
odis-ai-web/
├── vitest.workspace.ts       # Workspace configuration
├── vitest.shared.ts          # Shared configuration factory
├── apps/
│   └── web/
│       ├── vitest.config.ts  # Web app test config
│       └── src/test/         # Web-specific test utilities
│           ├── setup.ts      # Global test setup
│           ├── utils.tsx     # React testing utilities
│           └── api-utils.ts  # API route testing
└── libs/
    ├── testing/              # @odis-ai/testing - Shared test utilities
    │   └── src/
    │       ├── index.ts      # Main exports
    │       ├── utils/        # API, React, assertions
    │       ├── mocks/        # Supabase, VAPI, Next.js mocks
    │       ├── fixtures/     # User, case, call fixtures
    │       ├── setup/        # Node/React setup helpers
    │       └── matchers.ts   # Custom Vitest matchers
    ├── vapi/
    │   └── vitest.config.ts  # VAPI lib test config
    ├── services/
    │   └── vitest.config.ts  # Services lib test config
    ├── validators/
    │   └── vitest.config.ts  # Validators lib test config
    ├── db/
    │   └── vitest.config.ts  # DB lib test config
    └── ...                   # Other libs (add vitest.config.ts as needed)
```

## Configuration Levels

### 1. Workspace Configuration (`vitest.workspace.ts`)

Defines all test projects in the workspace:

```typescript
import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "apps/web/vitest.config.ts",
  "libs/*/vitest.config.ts",
]);
```

### 2. Project Configuration (per project `vitest.config.ts`)

Each project has its own configuration:

```typescript
// libs/my-lib/vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [
    tsconfigPaths({
      root: path.resolve(__dirname, "../.."),
    }),
  ],
  test: {
    name: "my-lib",
    globals: true,
    environment: "node", // or "happy-dom" for React components
    root: __dirname,
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    setupFiles: [], // Add setup files if needed
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: path.resolve(__dirname, "coverage"),
    },
  },
});
```

## Shared Testing Library (`@odis-ai/testing`)

### Installation

The testing library is available via the workspace path alias:

```typescript
import { createMockSupabaseClient, createMockUser } from "@odis-ai/testing";
```

### Available Utilities

#### API Testing

```typescript
import {
  createMockRequest,
  createAuthenticatedRequest,
  createCookieRequest,
  getJsonResponse,
  createMockContext,
  expectErrorResponse,
  expectSuccessResponse,
} from "@odis-ai/testing";

// Create a mock request
const request = createMockRequest({
  method: "POST",
  url: "http://localhost:3000/api/test",
  body: { data: "test" },
  headers: { "X-Custom": "value" },
});

// Create authenticated request
const authRequest = createAuthenticatedRequest("bearer-token", {
  method: "POST",
  body: { data: "test" },
});

// Assert error response
await expectErrorResponse(response, 400, "validation failed");

// Assert success response
const data = await expectSuccessResponse(response);
```

#### Supabase Mocks

```typescript
import {
  createMockSupabaseClient,
  createMockQueryBuilder,
  createMockSupabaseAuth,
} from "@odis-ai/testing";

// Full client mock
const { client, auth, from, rpc } = createMockSupabaseClient({
  user: createMockUser({ email: "test@example.com" }),
});

// Mock query builder with specific response
const queryBuilder = createMockQueryBuilder({
  data: [{ id: 1, name: "Test" }],
  error: null,
});

// Mock auth
const auth = createMockSupabaseAuth(user, session);
auth.getUser.mockResolvedValue({ data: { user }, error: null });
```

#### VAPI Mocks

```typescript
import {
  createMockVapiCall,
  createMockVapiWebhook,
  createMockVapiClient,
  createMockVariableValues,
} from "@odis-ai/testing";

// Mock VAPI call
const call = createMockVapiCall({
  status: "ended",
  transcript: "Hello...",
});

// Mock webhook payload
const webhook = createMockVapiWebhook("end-of-call-report", {
  endedReason: "assistant-ended-call",
});

// Mock VAPI client
const vapiClient = createMockVapiClient();
vapiClient.calls.create.mockResolvedValue(call);
```

#### Fixtures

```typescript
import {
  // Users
  createMockUser,
  createMockSession,
  createMockClinic,
  createMockClinicUser,
  createAuthenticatedContext,
  // Cases
  createMockPatient,
  createMockCase,
  createMockCaseWithPatient,
  createMockCaseList,
  // Calls
  createMockCallRecord,
  createMockScheduledCall,
  createMockInboundCall,
  createMockCallList,
} from "@odis-ai/testing";

// Create authenticated context for tests
const ctx = createAuthenticatedContext({
  userId: "user-123",
  clinicId: "clinic-456",
  role: "admin",
});
```

#### Assertions

```typescript
import {
  expectCalledWith,
  expectCalledTimes,
  expectNotCalled,
  expectAsyncError,
  waitForCondition,
} from "@odis-ai/testing";

expectCalledWith(mockFn, "arg1", "arg2");
expectCalledTimes(mockFn, 3);
await expectAsyncError(asyncFn, /error message/);
await waitForCondition(() => items.length > 0, { timeout: 5000 });
```

### Setup Files

For Node.js tests:

```typescript
// libs/my-lib/src/test-setup.ts
import { nodeSetup } from "@odis-ai/testing/setup/node";
nodeSetup();
```

For React tests:

```typescript
// apps/web/src/test/setup.ts
import { reactSetup } from "@odis-ai/testing/setup/react";
reactSetup();
```

### Custom Matchers

```typescript
import "@odis-ai/testing/matchers";

// Use custom matchers
expect("2024-01-15T10:30:00Z").toBeISODate();
expect("550e8400-e29b-41d4-a716-446655440000").toBeUUID();
expect("+15551234567").toBeE164Phone();
expect("test@example.com").toBeEmail();
expect(response).toBeApiSuccess({ data: expected });
expect(response).toBeApiError(400, "validation");
expect(value).toPassZodSchema(myZodSchema);
```

## Adding Tests to a New Library

1. **Create vitest.config.ts** in the library root:

```typescript
// libs/new-lib/vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [
    tsconfigPaths({
      root: path.resolve(__dirname, "../.."),
    }),
  ],
  test: {
    name: "new-lib",
    globals: true,
    environment: "node",
    root: __dirname,
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
```

2. **Create test files** in `src/__tests__/` or alongside source files:

```typescript
// libs/new-lib/src/__tests__/my-function.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { myFunction } from "../my-function";
import { createMockSupabaseClient } from "@odis-ai/testing";

describe("myFunction", () => {
  const { client } = createMockSupabaseClient();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should do something", () => {
    const result = myFunction(client);
    expect(result).toBeDefined();
  });
});
```

3. **Run tests**:

```bash
# Run specific lib tests
nx test new-lib

# Run with coverage
nx test new-lib --coverage
```

## Coverage Configuration

### Per-Project Coverage

Coverage is configured in each project's `vitest.config.ts`:

```typescript
coverage: {
  provider: "v8",
  reporter: ["text", "json", "html", "lcov"],
  reportsDirectory: path.resolve(__dirname, "coverage"),
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  },
  exclude: [
    "node_modules/",
    "**/*.d.ts",
    "**/*.config.*",
    "**/*.test.ts",
    "**/*.spec.ts",
  ],
}
```

### Aggregated Coverage

For workspace-wide coverage reports:

```bash
pnpm test:coverage:all
```

Coverage reports are generated in each project's `coverage/` directory.

## Nx Integration

### Running Tests via Nx

```bash
# Run specific project
nx test web
nx test vapi

# Run multiple projects
nx run-many -t test --projects=vapi,services,validators

# Run affected tests (for CI)
nx affected -t test

# With options
nx test web --coverage --watch
```

### Nx Caching

Tests are cached by Nx based on:

- Source files in the project
- Test files
- Dependencies from other projects

This means repeated test runs are instant if nothing changed.

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Tests
  run: pnpm test:affected --base=main

- name: Run Tests with Coverage
  run: pnpm test:coverage:all

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: apps/web/coverage/lcov.info,libs/*/coverage/lcov.info
```

## Troubleshooting

### Module Resolution Errors

Ensure `vite-tsconfig-paths` is configured with the workspace root:

```typescript
tsconfigPaths({
  root: path.resolve(__dirname, "../.."),
});
```

### React Query Errors

Use the custom `render` function from `@odis-ai/testing/utils/react`:

```typescript
import { renderWithProviders } from "@odis-ai/testing/utils/react";

const { getByText } = renderWithProviders(<MyComponent />);
```

### Environment Variable Errors

Use the setup helpers to configure test environment:

```typescript
import { setupTestEnv } from "@odis-ai/testing/setup/node";

setupTestEnv({
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  // ... other vars
});
```

### Tests Not Found

Check the `include` pattern in your `vitest.config.ts`:

```typescript
include: ["src/**/*.{test,spec}.{ts,tsx}"],
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest Workspace Mode](https://vitest.dev/guide/workspace)
- [Nx + Vitest](https://nx.dev/recipes/testing/vitest)
- [Testing Library Documentation](https://testing-library.com/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)

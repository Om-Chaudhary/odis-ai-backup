# Vitest Configuration Reference

> Quick reference for test configuration across the ODIS AI monorepo.
> All configs are now standardized with consistent coverage thresholds.

---

## Standard Configuration Template

All library projects use this standardized configuration:

```typescript
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
    name: "project-name", // Unique test suite name
    globals: true, // Use describe/it without imports
    environment: "node", // "node" for libs, "happy-dom" for React
    root: __dirname,
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    passWithNoTests: true,
    setupFiles: [], // Add setup file if needed
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: path.resolve(__dirname, "coverage"),
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
      exclude: [
        "node_modules/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/index.ts",
        "**/types/**",
      ],
    },
  },
});
```

---

## Project-Specific Configurations

### Web App (`apps/web`)

| Setting      | Value                 | Notes                       |
| ------------ | --------------------- | --------------------------- |
| Environment  | `happy-dom`           | Browser-like environment    |
| Setup File   | `./src/test/setup.ts` | Mocks Next.js, browser APIs |
| React Plugin | Yes                   | `@vitejs/plugin-react`      |
| Alias        | `~` → `./src`         | For `~/lib/...` imports     |

### Chrome Extension (`apps/chrome-extension`)

| Setting     | Value                 | Notes                                   |
| ----------- | --------------------- | --------------------------------------- |
| Environment | `jsdom`               | Full DOM environment                    |
| Setup File  | `./src/test/setup.ts` | Mocks Chrome APIs                       |
| Executor    | `@nx/vitest:test`     | Updated from deprecated `@nx/vite:test` |

### Libraries (all `libs/*`)

| Setting     | Value       | Notes                         |
| ----------- | ----------- | ----------------------------- |
| Environment | `node`      | Server-side testing           |
| Setup File  | None        | Uses shared testing utilities |
| Thresholds  | 60/60/50/60 | Enforced coverage minimums    |

---

## Coverage Thresholds

All projects now use consistent coverage thresholds:

```typescript
thresholds: {
  lines: 60,        // Minimum 60% line coverage
  functions: 60,    // Minimum 60% function coverage
  branches: 50,     // Minimum 50% branch coverage
  statements: 60,   // Minimum 60% statement coverage
}
```

**Note:** These are minimums. Target 80%+ for critical business logic.

---

## Test Commands

```bash
# Run specific project tests
nx test <project-name>
nx test shared-validators
nx test domain-discharge-data-access

# Run with coverage
nx test <project-name> --coverage

# Run specific test file
nx test <project-name> -t "test name pattern"

# Run all tests
pnpm test:all

# Run affected tests only
nx affected -t test

# Watch mode
pnpm test:watch

# CI mode (all projects with coverage)
pnpm test:ci
```

---

## Test File Naming

| Pattern      | Use Case                       |
| ------------ | ------------------------------ |
| `*.test.ts`  | Unit tests (preferred)         |
| `*.test.tsx` | React component tests          |
| `*.spec.ts`  | Also supported but less common |

**Location:** Always in `src/__tests__/` directory:

```
libs/shared/validators/src/
├── __tests__/
│   ├── discharge.test.ts
│   ├── schedule.test.ts
│   └── ...
├── discharge.ts
├── schedule.ts
└── index.ts
```

---

## Nx Executor Configuration

All projects use `@nx/vitest:test` executor in `project.json`:

```json
{
  "test": {
    "executor": "@nx/vitest:test",
    "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
    "options": {
      "configFile": "{projectRoot}/vitest.config.ts",
      "passWithNoTests": true
    }
  }
}
```

**Important:** The deprecated `@nx/vite:test` executor has been removed from all projects.

---

## Setup Files

### Web App Setup (`apps/web/src/test/setup.ts`)

Provides:

- Environment variables (NODE_ENV, Supabase keys, etc.)
- Next.js mocks (navigation, cache, headers)
- Browser API mocks (matchMedia, ResizeObserver, etc.)
- Jest-DOM matchers

### Chrome Extension Setup (`apps/chrome-extension/src/test/setup.ts`)

Provides:

- Chrome API mock (storage, runtime, tabs, identity)
- Jest-DOM matchers

### Shared Testing Utilities (`@odis-ai/shared/testing`)

Import in any test:

```typescript
import {
  createMockSupabaseClient,
  createMockVapiClient,
  createMockCase,
  createMockUser,
} from "@odis-ai/shared/testing";
```

---

## Troubleshooting

### "No test files found"

This is expected for projects without tests yet. The `passWithNoTests: true` setting prevents this from failing CI.

### Deprecation Warning: `url.parse()`

```
[DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized...
```

This comes from Node.js internals in dependencies. It's harmless and will be fixed upstream.

### stderr Output in Tests

Some tests (like `auth.test.ts`) show expected error messages in stderr:

```
Error fetching user profile: { message: 'Not found' }
```

This is intentional - the tests verify error handling paths that log to console.

---

## Files Changed in Config Cleanup

| File                                       | Change                                        |
| ------------------------------------------ | --------------------------------------------- |
| `apps/chrome-extension/project.json`       | Executor: `@nx/vite:test` → `@nx/vitest:test` |
| `apps/idexx-sync/project.json`             | Executor: `@nx/vite:test` → `@nx/vitest:test` |
| `apps/web/vitest.config.ts`                | Added coverage thresholds                     |
| `libs/integrations/slack/vitest.config.ts` | Added coverage thresholds                     |
| `libs/integrations/idexx/vitest.config.ts` | Added coverage thresholds                     |

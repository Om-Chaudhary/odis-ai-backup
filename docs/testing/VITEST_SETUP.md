# Vitest Testing Setup

This project uses [Vitest](https://vitest.dev/) for unit and integration testing, configured with best practices for Next.js App Router projects.

## Quick Start

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

## Project Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup and mocks
│   ├── utils.tsx             # React testing utilities
│   ├── api-utils.ts          # API route testing utilities
│   └── __examples__/         # Example test files
│       ├── api-route.test.ts
│       ├── component.test.tsx
│       └── lib-function.test.ts
```

## Configuration

### Vitest Config

The `vitest.config.ts` file configures:

- React plugin for JSX support
- jsdom environment for DOM testing
- Path aliases (`~/*` → `./src/*`)
- Coverage reporting
- Test file patterns

### TypeScript Config

The `tsconfig.test.json` extends the main config and:

- Includes Vitest global types
- Includes testing-library types
- Includes test files and setup files

## Testing Utilities

### React Component Testing

Use the custom `render` function from `src/test/utils.tsx` which includes React Query provider:

```tsx
import { render, screen } from "~/test/utils";
import { MyComponent } from "~/components/MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### API Route Testing

Use utilities from `src/test/api-utils.ts` to test Next.js API routes:

```ts
import { describe, it, expect, vi } from "vitest";
import { POST } from "~/app/api/my-route/route";
import {
  createMockRequest,
  createAuthenticatedRequest,
  getJsonResponse,
  createMockContext,
} from "~/test/api-utils";

describe("POST /api/my-route", () => {
  it("handles request", async () => {
    const request = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/my-route",
      body: { data: "test" },
    });

    const context = createMockContext();
    const response = await POST(request, context);
    const data = await getJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success", true);
  });

  it("handles authenticated request", async () => {
    const request = createAuthenticatedRequest("bearer-token", {
      method: "POST",
      url: "http://localhost:3000/api/my-route",
      body: { data: "test" },
    });

    // Test authenticated route...
  });
});
```

### API Route Utilities

- `createMockRequest()` - Create a mock NextRequest
- `createAuthenticatedRequest()` - Create request with Bearer token
- `createCookieRequest()` - Create request with cookies
- `getJsonResponse()` - Extract JSON from Response
- `createMockUser()` - Create mock Supabase user
- `createMockContext()` - Create route context with params

## Global Mocks

The `src/test/setup.ts` file sets up:

- **Next.js Navigation** - Mocks `useRouter`, `useSearchParams`, `usePathname`
- **Next.js Image** - Mocks `next/image` component
- **Environment Variables** - Sets test environment variables
- **Console Suppression** - Suppresses known React warnings

## Best Practices

### 1. Test Structure

```ts
describe("Feature Name", () => {
  beforeEach(() => {
    // Setup before each test
  });

  it("should do something", () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### 2. Mocking Dependencies

```ts
import { vi } from "vitest";

// Mock at the top level
vi.mock("~/lib/my-service", () => ({
  MyService: {
    doSomething: vi.fn(),
  },
}));
```

### 3. Testing Async Code

```ts
it("handles async operations", async () => {
  const result = await myAsyncFunction();
  expect(result).toBeDefined();
});
```

### 4. Testing API Routes

- Mock Supabase clients
- Mock authentication helpers
- Test both success and error cases
- Test authentication/authorization

### 5. Testing Components

- Test user interactions with `@testing-library/user-event`
- Test accessibility with `@testing-library/jest-dom`
- Use `screen` queries for better practices
- Test error states and loading states

## Coverage

Run coverage reports:

```bash
pnpm test:coverage
```

Coverage reports are generated in the `coverage/` directory. The config excludes:

- Test files themselves
- Configuration files
- Type definitions
- Mock data

## CI/CD Integration

Tests run automatically in CI. Make sure to:

1. Set up test environment variables
2. Run `pnpm test:run` in CI pipeline
3. Optionally generate coverage reports

## Troubleshooting

### Tests fail with module resolution errors

Ensure path aliases are correctly configured in `vitest.config.ts` and `tsconfig.test.json`.

### React Query errors in tests

The custom `render` function in `src/test/utils.tsx` includes React Query provider. Use it instead of the default `render` from `@testing-library/react`.

### Next.js API route testing issues

Make sure to mock:

- Supabase clients (`~/lib/supabase/server`)
- Authentication helpers (`~/lib/api/auth`)
- Any external services

### Environment variable errors

Test environment variables are set in `src/test/setup.ts`. If you need additional variables, add them there.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)

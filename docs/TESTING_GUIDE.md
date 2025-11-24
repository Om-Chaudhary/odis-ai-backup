# Testing Guide

This guide provides comprehensive documentation for writing and running tests in the ODIS AI Web application.

## Table of Contents

- [Getting Started](#getting-started)
- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Mocking Strategies](#mocking-strategies)
- [CI/CD Integration](#cicd-integration)
- [Coverage Requirements](#coverage-requirements)

## Getting Started

### Installation

All testing dependencies are already configured. To install them:

```bash
pnpm install
```

### First Test Run

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (recommended for development)
pnpm test:watch

# Run tests with UI (Vitest UI)
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

## Testing Stack

### Core Technologies

- **Vitest 2.1.8**: Fast, Vite-powered test runner (Jest-compatible API)
- **React Testing Library 16.1.0**: Component testing utilities
- **@testing-library/jest-dom 6.6.3**: Custom DOM matchers
- **jsdom 25.0.1**: DOM implementation for Node.js
- **@vitest/ui**: Interactive test UI
- **@vitest/coverage-v8**: Code coverage using V8

### Why Vitest?

- Native ESM support (Next.js 15 requirement)
- 10x faster than Jest for modern projects
- Built-in TypeScript support
- Excellent Next.js 15 compatibility
- Jest-compatible API (easy migration)
- Built-in coverage with V8

## Running Tests

### Basic Commands

```bash
# Run all tests once
pnpm test

# Watch mode (re-runs tests on file changes)
pnpm test:watch

# Interactive UI (browser-based test runner)
pnpm test:ui

# Coverage report (HTML + terminal)
pnpm test:coverage
```

### Advanced Usage

```bash
# Run specific test file
pnpm test src/app/page.test.tsx

# Run tests matching pattern
pnpm test --grep "Landing Page"

# Run tests in specific directory
pnpm test src/hooks/

# Run with verbose output
pnpm test --reporter=verbose

# Update snapshots (if using snapshot testing)
pnpm test -u
```

### CI/CD Commands

```bash
# CI mode (no watch, fail on coverage thresholds)
pnpm test --run --coverage
```

## Writing Tests

### File Structure

```
src/
├── app/
│   └── page.test.tsx           # Tests for page.tsx
├── components/
│   └── Navigation.test.tsx     # Tests for Navigation.tsx
├── hooks/
│   └── useDeviceDetection.test.ts
└── test/
    ├── setup.ts                # Global test setup
    └── utils/
        └── test-utils.tsx      # Custom render utilities
```

### Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Spec files: `*.spec.ts` or `*.spec.tsx` (alternative)
- Co-located with source files (recommended)

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "~/test/utils/test-utils";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Feature Group", () => {
    it("should do something specific", () => {
      render(<MyComponent />);

      expect(screen.getByText("Hello")).toBeInTheDocument();
    });
  });
});
```

### Component Testing Example

```typescript
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "~/test/utils/test-utils";
import Button from "./Button";

describe("Button Component", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await fireEvent.click(screen.getByText("Click me"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Click me</Button>);

    const button = screen.getByText("Click me");
    expect(button).toHaveClass("custom-class");
  });
});
```

### Hook Testing Example

```typescript
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

describe("useCounter Hook", () => {
  it("initializes with default value", () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it("increments counter", () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### Async Testing Example

```typescript
import { describe, it, expect, waitFor } from "vitest";
import { render, screen } from "~/test/utils/test-utils";
import UserProfile from "./UserProfile";

describe("UserProfile", () => {
  it("loads and displays user data", async () => {
    render(<UserProfile userId="123" />);

    // Initially shows loading state
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });
});
```

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ BAD: Testing implementation details
it("sets state to true", () => {
  const { result } = renderHook(() => useToggle());
  expect(result.current.isOpen).toBe(false);
});

// ✅ GOOD: Testing user-facing behavior
it("shows modal when button is clicked", async () => {
  render(<ModalWithToggle />);

  await fireEvent.click(screen.getByText("Open"));

  expect(screen.getByRole("dialog")).toBeInTheDocument();
});
```

### 2. Use Accessible Queries

```typescript
// ❌ BAD: Using fragile selectors
screen.getByClassName("submit-button");
container.querySelector("#user-name");

// ✅ GOOD: Using accessible queries
screen.getByRole("button", { name: "Submit" });
screen.getByLabelText("Username");
screen.getByText("Welcome back");
```

### 3. Mock External Dependencies

```typescript
// Mock API calls
vi.mock("~/lib/api/users", () => ({
  fetchUser: vi.fn(() => Promise.resolve({ name: "John" })),
}));

// Mock complex components
vi.mock("~/components/ComplexChart", () => ({
  default: () => <div>Chart Mock</div>,
}));
```

### 4. Clean Up After Each Test

```typescript
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup(); // Already configured in src/test/setup.ts
  vi.clearAllMocks();
});
```

### 5. Group Related Tests

```typescript
describe("UserAuthentication", () => {
  describe("Login", () => {
    it("shows error for invalid credentials", () => {});
    it("redirects on successful login", () => {});
  });

  describe("Logout", () => {
    it("clears session data", () => {});
    it("redirects to home page", () => {});
  });
});
```

### 6. Use Custom Test Utilities

```typescript
// Use the custom render with providers
import { render } from "~/test/utils/test-utils";

// Instead of the default React Testing Library render
// import { render } from "@testing-library/react";
```

## Mocking Strategies

### PostHog Analytics

PostHog is globally mocked in `src/test/setup.ts`:

```typescript
import { usePostHog } from "posthog-js/react";

// In your test
const mockPostHog = usePostHog();
expect(mockPostHog.capture).toHaveBeenCalledWith("event_name", {});
```

### Next.js Router

```typescript
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/current/path",
  useSearchParams: () => new URLSearchParams("?key=value"),
}));
```

### Window APIs

```typescript
// Mock window dimensions
import { mockWindowDimensions } from "~/test/utils/test-utils";

mockWindowDimensions(375, 667); // Mobile

// Mock scroll position
import { triggerScroll } from "~/test/utils/test-utils";

triggerScroll(500);
```

### API Calls (tRPC)

```typescript
// Mock tRPC router
vi.mock("~/trpc/client", () => ({
  api: {
    users: {
      getById: {
        useQuery: () => ({
          data: { id: "1", name: "John" },
          isLoading: false,
          error: null,
        }),
      },
    },
  },
}));
```

### Environment Variables

```typescript
beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "https://test.api.com";
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_API_URL;
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```

### Pre-commit Hook (Husky)

```bash
# .husky/pre-commit
pnpm test --run --changed
```

## Coverage Requirements

### Current Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  },
}
```

### Viewing Coverage

```bash
# Generate coverage report
pnpm test:coverage

# Open HTML report
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

### Coverage Reports

- **Text**: Terminal output
- **HTML**: `coverage/index.html` (interactive browser view)
- **LCOV**: `coverage/lcov.info` (for CI/CD tools)
- **JSON**: `coverage/coverage-final.json` (programmatic access)

## Testing Checklist

Before committing new components:

- [ ] Unit tests for all public methods/props
- [ ] Integration tests for complex interactions
- [ ] Accessibility tests (ARIA attributes, keyboard navigation)
- [ ] Responsive design tests (mobile, tablet, desktop)
- [ ] Error state tests (loading, error, empty states)
- [ ] Analytics tracking tests (if applicable)
- [ ] Edge cases and boundary conditions
- [ ] Coverage meets thresholds (70%+)

## Common Patterns

### Testing Forms

```typescript
import { render, screen, fireEvent, waitFor } from "~/test/utils/test-utils";

it("submits form with valid data", async () => {
  const onSubmit = vi.fn();
  render(<LoginForm onSubmit={onSubmit} />);

  await fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "user@example.com" },
  });

  await fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
  });

  await fireEvent.click(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
  });
});
```

### Testing Modals/Dialogs

```typescript
it("opens and closes modal", async () => {
  render(<ModalComponent />);

  // Initially closed
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

  // Open modal
  await fireEvent.click(screen.getByText("Open Modal"));
  expect(screen.getByRole("dialog")).toBeInTheDocument();

  // Close modal
  await fireEvent.click(screen.getByLabelText("Close"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
```

### Testing Animations

```typescript
import { waitForAnimation } from "~/test/utils/test-utils";

it("animates element on mount", async () => {
  const { container } = render(<AnimatedComponent />);

  const element = container.querySelector(".animated");
  expect(element).toHaveClass("opacity-0");

  await waitForAnimation(500);

  expect(element).toHaveClass("opacity-100");
});
```

## Troubleshooting

### Tests Fail with "window is not defined"

Use `jsdom` environment (already configured):

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
  },
});
```

### Mock Not Working

Ensure mock is defined before import:

```typescript
// ✅ CORRECT ORDER
vi.mock("~/lib/api");
import { fetchData } from "~/lib/api";

// ❌ WRONG ORDER
import { fetchData } from "~/lib/api";
vi.mock("~/lib/api"); // Too late!
```

### Coverage Not Updating

Clear coverage cache:

```bash
rm -rf coverage/
pnpm test:coverage
```

### Slow Tests

Use `concurrent` for independent tests:

```typescript
describe.concurrent("Independent Tests", () => {
  it("test 1", async () => {});
  it("test 2", async () => {});
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Next.js Testing Guide](https://nextjs.org/docs/testing/vitest)

## Support

For questions or issues:

1. Check existing tests in `src/` directories
2. Review this guide
3. Consult team documentation
4. Ask in #engineering-testing Slack channel

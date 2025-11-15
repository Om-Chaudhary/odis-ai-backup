# Testing Quick Start Guide

Get started with testing in 5 minutes.

## Installation

```bash
pnpm install
```

## Run Tests

```bash
# Run all tests
pnpm test

# Watch mode (auto-rerun on changes)
pnpm test:watch

# Coverage report
pnpm test:coverage

# Interactive UI
pnpm test:ui
```

## Write Your First Test

### 1. Create Test File

Next to your component:

```
src/components/Button.tsx
src/components/Button.test.tsx  ← Create this
```

### 2. Basic Test Template

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "~/test/utils/test-utils";
import Button from "./Button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);

    expect(screen.getByText("Click me")).toBeInTheDocument();
  });
});
```

### 3. Run Your Test

```bash
pnpm test Button.test.tsx
```

## Common Patterns

### Test User Interaction

```typescript
import { fireEvent } from "~/test/utils/test-utils";

it("handles click", async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click</Button>);

  await fireEvent.click(screen.getByText("Click"));

  expect(onClick).toHaveBeenCalledTimes(1);
});
```

### Test Async Data Loading

```typescript
import { waitFor } from "~/test/utils/test-utils";

it("loads data", async () => {
  render(<UserProfile userId="123" />);

  await waitFor(() => {
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
```

### Test Hooks

```typescript
import { renderHook, act } from "@testing-library/react";

it("increments counter", () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

### Test Responsive Design

```typescript
import { mockWindowDimensions } from "~/test/utils/test-utils";

it("shows mobile menu on small screens", () => {
  mockWindowDimensions(375, 667); // Mobile

  render(<Navigation />);

  expect(screen.getByLabelText("Mobile menu")).toBeInTheDocument();
});
```

## Useful Queries

```typescript
// By text content
screen.getByText("Hello")

// By role (best for accessibility)
screen.getByRole("button", { name: "Submit" })

// By label
screen.getByLabelText("Email")

// By test ID (last resort)
screen.getByTestId("custom-element")

// Query variants
screen.getBy...    // Throws if not found
screen.queryBy...  // Returns null if not found
screen.findBy...   // Async, waits for element
```

## Mock PostHog Events

```typescript
import { usePostHog } from "posthog-js/react";

it("tracks button click", async () => {
  const mockPostHog = usePostHog();

  render(<Button />);
  await fireEvent.click(screen.getByText("Click"));

  expect(mockPostHog.capture).toHaveBeenCalledWith("button_clicked", {});
});
```

## Check Coverage

```bash
pnpm test:coverage

# View HTML report
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

## Before Committing

```bash
# Run the full check
pnpm check

# Or individually
pnpm lint
pnpm typecheck
pnpm test
```

## Need Help?

- **Full Guide**: `docs/TESTING_GUIDE.md`
- **Examples**: See `src/app/page.test.tsx` and `src/hooks/*.test.ts`
- **Debugging**: Use `screen.debug()` to see current DOM
- **CI Failures**: Check `.github/workflows/test.yml`

## Pro Tips

1. **Use watch mode** - Tests rerun on file save

   ```bash
   pnpm test:watch
   ```

2. **Test behavior, not implementation** - Test what users see/do

3. **Use accessible queries** - Prefer `getByRole` over `getByTestId`

4. **Mock external dependencies** - Don't make real API calls

5. **Keep tests simple** - One assertion per test is fine

6. **Name tests descriptively** - "should do X when Y happens"

## Common Issues

### "Cannot find module '~/...'"

Path aliases are configured. Use:

```typescript
import { render } from "~/test/utils/test-utils";
```

### "window is not defined"

Already handled in setup. If needed:

```typescript
// vitest.config.ts
test: {
  environment: "jsdom";
}
```

### Mock not working

Define mock before import:

```typescript
vi.mock("~/lib/api"); // ← Must be first
import { fetchData } from "~/lib/api";
```

### Tests too slow

Use `.concurrent` for independent tests:

```typescript
describe.concurrent("Fast Tests", () => {
  it("test 1", async () => {});
  it("test 2", async () => {});
});
```

## File Structure

```
src/
├── app/
│   └── page.test.tsx
├── components/
│   └── Button.test.tsx
├── hooks/
│   └── useCounter.test.ts
└── test/
    ├── setup.ts          # Global setup
    └── utils/
        └── test-utils.tsx # Custom utilities
```

That's it! Start testing! 🚀

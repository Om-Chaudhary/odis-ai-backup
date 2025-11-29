# Component Development Commands

Complete reference for component development workflows.

## Component Scaffolding

### Create New Component

```bash
# Using shadcn/ui CLI
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add card
```

### Component File Structure

```typescript
// src/components/dashboard/my-component.tsx
"use client";

import { type ComponentProps } from "react";
import { cn } from "~/lib/utils";

interface MyComponentProps extends ComponentProps<"div"> {
  // Component-specific props
}

export function MyComponent({ className, ...props }: MyComponentProps) {
  return (
    <div className={cn("base-styles", className)} {...props}>
      {/* Component content */}
    </div>
  );
}
```

## Visual Testing

### Test Component in Browser

```typescript
// 1. Navigate to component test page
browser_navigate("http://localhost:3000/test/my-component");

// 2. Get component snapshot
const snapshot = browser_snapshot();
const component = snapshot.find((el) => el.name === "My Component");

// 3. Test default state
browser_take_screenshot("my-component-default.png", {
  element: "My Component",
  ref: component.ref,
});

// 4. Test interactive states
browser_hover(component.name, component.ref);
browser_wait_for({ time: 0.3 });
browser_take_screenshot("my-component-hover.png", {
  element: "My Component",
  ref: component.ref,
});

// 5. Test responsive breakpoints
const breakpoints = [
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1920, height: 1080 },
];

for (const bp of breakpoints) {
  browser_resize(bp.width, bp.height);
  browser_wait_for({ time: 0.5 });
  browser_take_screenshot(`my-component-${bp.name}.png`, {
    element: "My Component",
    ref: component.ref,
  });
}
```

### Measure Component Dimensions

```typescript
const dimensions = browser_evaluate(() => {
  const element = document.querySelector('[data-testid="my-component"]');
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    padding: {
      top: parseInt(getComputedStyle(element).paddingTop),
      right: parseInt(getComputedStyle(element).paddingRight),
      bottom: parseInt(getComputedStyle(element).paddingBottom),
      left: parseInt(getComputedStyle(element).paddingLeft),
    },
    margin: {
      top: parseInt(getComputedStyle(element).marginTop),
      right: parseInt(getComputedStyle(element).marginRight),
      bottom: parseInt(getComputedStyle(element).marginBottom),
      left: parseInt(getComputedStyle(element).marginLeft),
    },
  };
});
```

## Styling Verification

### Check Tailwind Classes

```typescript
// Verify component uses correct Tailwind classes
const classes = browser_evaluate(() => {
  const element = document.querySelector('[data-testid="my-component"]');
  return element?.className.split(" ") || [];
});

// Check for design system compliance
const hasDesignSystemClasses = classes.some(
  (cls) =>
    cls.startsWith("text-") ||
    cls.startsWith("bg-") ||
    cls.startsWith("border-"),
);
```

### Verify Responsive Design

```typescript
// Test mobile
browser_resize(375, 667);
browser_wait_for({ time: 0.5 });
const mobileLayout = browser_evaluate(() => {
  const element = document.querySelector('[data-testid="my-component"]');
  return {
    display: getComputedStyle(element).display,
    flexDirection: getComputedStyle(element).flexDirection,
    width: element.getBoundingClientRect().width,
  };
});

// Test desktop
browser_resize(1920, 1080);
browser_wait_for({ time: 0.5 });
const desktopLayout = browser_evaluate(() => {
  const element = document.querySelector('[data-testid="my-component"]');
  return {
    display: getComputedStyle(element).display,
    flexDirection: getComputedStyle(element).flexDirection,
    width: element.getBoundingClientRect().width,
  };
});
```

## Integration Testing

### Test with Parent Component

```typescript
// 1. Navigate to page using component
browser_navigate("http://localhost:3000/dashboard");

// 2. Find component in context
const snapshot = browser_snapshot();
const component = snapshot.find((el) => el.name === "My Component");

// 3. Test interactions
browser_click(component.name, component.ref);
browser_wait_for({ text: "Expected result" });

// 4. Verify state changes
const state = browser_evaluate(() => {
  // Check parent component state
  return window.location.search; // or other state indicators
});
```

## Accessibility Testing

### Check ARIA Labels

```typescript
const snapshot = browser_snapshot();
const component = snapshot.find((el) => el.name === "My Component");

// Verify accessibility
const accessibility = {
  hasLabel: !!component.name,
  hasRole: !!component.role,
  isFocusable: component.state?.focusable !== false,
};
```

### Test Keyboard Navigation

```typescript
// Tab to component
browser_press_key("Tab");
browser_press_key("Tab"); // Continue until component is focused

// Check focus indicator
browser_take_screenshot("my-component-focus.png", {
  element: "My Component",
  ref: component.ref,
});

// Test keyboard interaction
browser_press_key("Enter"); // or Space
browser_wait_for({ text: "Expected action" });
```

## Best Practices

### Component Structure

1. **Use TypeScript interfaces** for props
2. **Extend HTML element props** for flexibility
3. **Use `cn()` utility** for className merging
4. **Add data-testid** for testing
5. **Follow design system** patterns

### Visual Testing

1. **Test all states** (default, hover, active, disabled)
2. **Test responsive breakpoints** (mobile, tablet, desktop)
3. **Verify styling consistency** with design system
4. **Check accessibility** (ARIA labels, keyboard nav)
5. **Document visual issues** found

### Integration

1. **Test in context** with parent components
2. **Verify prop passing** correctly
3. **Check state management** integration
4. **Test error boundaries** if applicable

## Related Documentation

- [Component Development README](./README.md) - Overview
- [Browser Testing](../browser-testing/) - Visual testing tools
- [Dashboard Components](../../dashboard/03-COMPONENTS/) - Component docs

---

**Last Updated**: 2025-01-27

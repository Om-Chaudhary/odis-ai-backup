# Visual Testing Commands

Complete reference for visual testing commands using Playwright MCP.

## Overview

This document provides all available commands for visual testing workflows. All commands use Playwright MCP tools.

## Navigation Commands

### Navigate to URL

```typescript
// Navigate to a page
browser_navigate("http://localhost:3000/dashboard");

// Navigate with query parameters
browser_navigate("http://localhost:3000/dashboard?tab=cases&status=ongoing");
```

**Use Cases:**

- Initial page load testing
- Deep linking verification
- URL state testing

### Browser Navigation

```typescript
// Go back in browser history
browser_navigate_back();
```

**Use Cases:**

- Browser history testing
- Back button functionality
- State persistence after navigation

### Resize Viewport

```typescript
// Desktop sizes
browser_resize(1920, 1080); // Full HD
browser_resize(1440, 900); // MacBook
browser_resize(1280, 720); // Standard desktop

// Tablet sizes
browser_resize(768, 1024); // iPad

// Mobile sizes
browser_resize(375, 667); // iPhone SE
browser_resize(414, 896); // iPhone 11 Pro Max
```

**Use Cases:**

- Responsive design testing
- Viewport-specific layouts
- Mobile/tablet/desktop verification

## Screenshot Commands

### Basic Screenshot

```typescript
// Take full-page screenshot
browser_take_screenshot("dashboard-desktop.png");

// Take screenshot of specific element
browser_take_screenshot("stat-card.png", {
  element: "Stat card component",
  ref: "[data-testid='stat-card']",
});
```

**Use Cases:**

- Visual regression testing
- Documentation
- Bug reporting
- Before/after comparisons

### Screenshot Options

```typescript
// Full page screenshot
browser_take_screenshot("full-page.png", {
  fullPage: true,
});

// Specific format
browser_take_screenshot("screenshot.jpeg", {
  type: "jpeg",
});
```

## Page Inspection Commands

### Accessibility Snapshot

```typescript
// Get full page accessibility tree
const snapshot = browser_snapshot();

// Use snapshot to understand page structure
// Returns: Array of elements with roles, names, states
```

**Use Cases:**

- Understanding page structure
- Accessibility verification
- Element discovery
- AI-friendly page representation

**Example Output:**

```json
{
  "role": "button",
  "name": "Create Case",
  "ref": "button-123",
  "state": { "disabled": false }
}
```

### JavaScript Evaluation

```typescript
// Measure element dimensions
browser_evaluate(() => {
  const card = document.querySelector('[data-testid="stat-card"]');
  return {
    width: card.getBoundingClientRect().width,
    height: card.getBoundingClientRect().height,
  };
});

// Check sidebar state
browser_evaluate(() => {
  const sidebar = document.querySelector('[class*="sidebar"]');
  return {
    visible: sidebar?.getBoundingClientRect().width > 0,
    width: sidebar?.getBoundingClientRect().width,
  };
});

// Get URL state
browser_evaluate(() => {
  return {
    url: window.location.href,
    searchParams: Object.fromEntries(
      new URLSearchParams(window.location.search),
    ),
  };
});
```

**Use Cases:**

- Precise measurements
- State verification
- Dynamic content checking
- Performance metrics

### Console Messages

```typescript
// Get all console messages
const messages = browser_console_messages();

// Check for errors
const errors = messages.filter((m) => m.level === "error");
```

**Use Cases:**

- Error detection
- Warning identification
- Debug information
- Runtime issues

### Network Requests

```typescript
// Get all network requests
const requests = browser_network_requests();

// Filter by type
const apiCalls = requests.filter((r) => r.url.includes("/api/"));
```

**Use Cases:**

- API call verification
- Performance analysis
- Error tracking
- Request/response validation

## Interaction Commands

### Click Element

```typescript
// Click by element description
browser_click("Create Case button", "button-123");

// Click by ref from snapshot
const snapshot = browser_snapshot();
const button = snapshot.find((el) => el.name === "Create Case");
browser_click(button.name, button.ref);
```

**Use Cases:**

- Button testing
- Link verification
- Navigation testing
- Modal triggers

### Type Text

```typescript
// Type in input field
browser_type("Search input", "input-456", "test query");

// Type slowly (for key handlers)
browser_type("Search input", "input-456", "test query", {
  slowly: true,
});

// Submit after typing
browser_type("Search input", "input-456", "test query", {
  submit: true,
});
```

**Use Cases:**

- Form testing
- Search functionality
- Input validation
- Autocomplete testing

### Hover Element

```typescript
// Hover over element
browser_hover("Tooltip trigger", "tooltip-789");
```

**Use Cases:**

- Tooltip testing
- Hover states
- Dropdown menus
- Interactive elements

### Press Key

```typescript
// Press Enter
browser_press_key("Enter");

// Press Escape
browser_press_key("Escape");

// Press Tab
browser_press_key("Tab");

// Arrow keys
browser_press_key("ArrowDown");
browser_press_key("ArrowUp");
```

**Use Cases:**

- Keyboard navigation
- Accessibility testing
- Form submission
- Modal closing

### Select Option

```typescript
// Select dropdown option
browser_select_option("Status filter", "select-101", ["ongoing"]);

// Multi-select
browser_select_option("Tags filter", "select-102", ["urgent", "follow-up"]);
```

**Use Cases:**

- Dropdown testing
- Filter functionality
- Multi-select forms
- Option validation

## Utility Commands

### Wait For Conditions

```typescript
// Wait for text to appear
browser_wait_for({ text: "Loading complete" });

// Wait for text to disappear
browser_wait_for({ textGone: "Loading..." });

// Wait for time
browser_wait_for({ time: 2 }); // Wait 2 seconds
```

**Use Cases:**

- Async content loading
- Animation completion
- State transitions
- Network requests

### Tab Management

```typescript
// Get current tab
browser_tabs("get");

// Switch to tab
browser_tabs("switch", 0);

// Close tab
browser_tabs("close", 1);
```

**Use Cases:**

- Multi-tab testing
- Tab switching
- Window management

## Common Workflows

### Visual Regression Test

```typescript
// 1. Navigate to page
browser_navigate("http://localhost:3000/dashboard");

// 2. Set viewport
browser_resize(1920, 1080);

// 3. Wait for load
browser_wait_for({ textGone: "Loading..." });

// 4. Take screenshot
browser_take_screenshot("dashboard-baseline.png");

// 5. Make changes (in code)

// 6. Refresh and compare
browser_navigate("http://localhost:3000/dashboard");
browser_take_screenshot("dashboard-after.png");
```

### Responsive Design Test

```typescript
const viewports = [
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  browser_resize(viewport.width, viewport.height);
  browser_wait_for({ time: 1 }); // Wait for layout
  browser_take_screenshot(`dashboard-${viewport.name}.png`);
}
```

### Component Isolation Test

```typescript
// 1. Navigate to component page
browser_navigate("http://localhost:3000/dashboard?tab=overview");

// 2. Get component snapshot
const snapshot = browser_snapshot();
const component = snapshot.find((el) => el.name === "Stat Card");

// 3. Measure component
const dimensions = browser_evaluate(() => {
  const card = document.querySelector('[data-testid="stat-card"]');
  return card.getBoundingClientRect();
});

// 4. Test interactions
browser_hover(component.name, component.ref);
browser_take_screenshot("stat-card-hover.png");

// 5. Click and verify
browser_click(component.name, component.ref);
browser_wait_for({ text: "Details" });
```

### Accessibility Test

```typescript
// 1. Get accessibility snapshot
const snapshot = browser_snapshot();

// 2. Check for ARIA labels
const buttons = snapshot.filter((el) => el.role === "button");
const missingLabels = buttons.filter((btn) => !btn.name);

// 3. Test keyboard navigation
browser_press_key("Tab"); // First focusable element
browser_press_key("Tab"); // Second focusable element

// 4. Verify focus indicators
browser_take_screenshot("keyboard-focus.png");

// 5. Test screen reader compatibility
// (Check snapshot for proper roles and names)
```

## Best Practices

### Screenshot Naming

Use descriptive, sequential names:

- `01-initial-desktop.png`
- `02-sidebar-expanded.png`
- `03-sidebar-collapsed.png`
- `04-mobile-view.png`

### Wait Strategies

Always wait for content to load:

```typescript
// Wait for loading to complete
browser_wait_for({ textGone: "Loading..." });

// Wait for specific content
browser_wait_for({ text: "Dashboard" });

// Wait for animations
browser_wait_for({ time: 0.5 });
```

### Error Handling

Check console and network for errors:

```typescript
// After interaction, check for errors
const messages = browser_console_messages();
const errors = messages.filter((m) => m.level === "error");
if (errors.length > 0) {
  // Document errors
}
```

### State Management

Test different states:

```typescript
// Test sidebar expanded
// Test sidebar collapsed
// Test different filters
// Test different tabs
```

## Related Documentation

- [Tool Comparison](./tool-comparison.md) - Why Playwright MCP
- [Browser Testing README](./README.md) - Overview
- [Dashboard Testing Guide](../../dashboard/07-TESTING/) - Real examples

---

**Last Updated**: 2025-01-27

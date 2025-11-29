# General Browser Test Template

## Quick Start Template

Copy this template and customize with your specific test steps.

```typescript
// ============================================
// SETUP - Customize these values
// ============================================

const TEST_URL = "http://localhost:3000/dashboard"; // Change to your test URL
const TEST_NAME = "my-test"; // Change to descriptive test name
const DESKTOP_VIEWPORT = { width: 1920, height: 1080 };
const TABLET_VIEWPORT = { width: 768, height: 1024 };
const MOBILE_VIEWPORT = { width: 375, height: 667 };

// ============================================
// STEP 1: Navigate and Initial Setup
// ============================================

browser_navigate(TEST_URL);
browser_wait_for({ textGone: "Loading..." }); // Adjust loading indicator text if needed
browser_take_screenshot(`${TEST_NAME}-01-initial.png`);

// ============================================
// STEP 2: Get Page Snapshot
// ============================================

const snapshot = browser_snapshot();
console.log("Page snapshot captured");

// ============================================
// STEP 3: Desktop Viewport Testing
// ============================================

browser_resize(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
browser_wait_for({ time: 0.5 }); // Wait for layout to settle
browser_take_screenshot(`${TEST_NAME}-02-desktop.png`);

// ADD YOUR DESKTOP TEST STEPS HERE
// Example:
// const button = snapshot.find(el => el.name === "Click Me");
// if (button) {
//   browser_click(button.name, button.ref);
//   browser_wait_for({ time: 0.5 });
//   browser_take_screenshot(`${TEST_NAME}-03-after-click.png`);
// }

// ============================================
// STEP 4: Tablet Viewport Testing
// ============================================

browser_resize(TABLET_VIEWPORT.width, TABLET_VIEWPORT.height);
browser_wait_for({ time: 0.5 });
browser_take_screenshot(`${TEST_NAME}-04-tablet.png`);

// ADD YOUR TABLET TEST STEPS HERE

// ============================================
// STEP 5: Mobile Viewport Testing
// ============================================

browser_resize(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height);
browser_wait_for({ time: 0.5 });
browser_take_screenshot(`${TEST_NAME}-05-mobile.png`);

// ADD YOUR MOBILE TEST STEPS HERE

// ============================================
// STEP 6: Interactions (Customize as needed)
// ============================================

// Reset to desktop for interactions
browser_resize(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
browser_wait_for({ time: 0.5 });

// ADD YOUR INTERACTION TESTS HERE
// Examples:

// Click a button:
// const button = snapshot.find(el => el.name === "Button Name");
// if (button) {
//   browser_click(button.name, button.ref);
//   browser_wait_for({ time: 0.5 });
//   browser_take_screenshot(`${TEST_NAME}-06-after-click.png`);
// }

// Type in an input:
// const input = snapshot.find(el => el.role === "textbox" && el.name?.includes("Search"));
// if (input) {
//   browser_type(input.name, input.ref, "test query");
//   browser_wait_for({ time: 0.5 });
//   browser_take_screenshot(`${TEST_NAME}-07-after-search.png`);
// }

// Hover over element:
// const hoverTarget = snapshot.find(el => el.name === "Hover Target");
// if (hoverTarget) {
//   browser_hover(hoverTarget.name, hoverTarget.ref);
//   browser_wait_for({ time: 0.3 });
//   browser_take_screenshot(`${TEST_NAME}-08-hover-state.png`);
// }

// Select dropdown option:
// const dropdown = snapshot.find(el => el.name === "Dropdown Name");
// if (dropdown) {
//   browser_select_option(dropdown.name, dropdown.ref, ["Option 1"]);
//   browser_wait_for({ time: 0.5 });
//   browser_take_screenshot(`${TEST_NAME}-09-after-select.png`);
// }

// ============================================
// STEP 7: Measurements (Optional)
// ============================================

// Measure element dimensions:
// const dimensions = browser_evaluate(() => {
//   const element = document.querySelector('[data-testid="my-element"]');
//   if (!element) return null;
//   const rect = element.getBoundingClientRect();
//   return {
//     width: rect.width,
//     height: rect.height,
//     x: rect.x,
//     y: rect.y
//   };
// });
// console.log("Element dimensions:", dimensions);

// Get URL state:
// const urlState = browser_evaluate(() => {
//   const params = new URLSearchParams(window.location.search);
//   return {
//     pathname: window.location.pathname,
//     params: Object.fromEntries(params.entries())
//   };
// });
// console.log("URL State:", urlState);

// ============================================
// STEP 8: Error Checking
// ============================================

const messages = browser_console_messages();
const errors = messages.filter((m) => m.level === "error");
if (errors.length > 0) {
  console.error("Console errors found:", errors);
} else {
  console.log("No console errors");
}

// Check network requests:
// const requests = browser_network_requests();
// const failedRequests = requests.filter(req => req.status >= 400);
// if (failedRequests.length > 0) {
//   console.error("Failed requests:", failedRequests);
// }

// ============================================
// STEP 9: Final Screenshot
// ============================================

browser_take_screenshot(`${TEST_NAME}-10-final.png`);
console.log("Test complete");
```

## Common Patterns

### Pattern 1: Find and Click Element

```typescript
const element = snapshot.find(
  (el) =>
    el.name === "Exact Name" ||
    el.name?.includes("Partial Name") ||
    el.role === "button",
);
if (element) {
  browser_click(element.name, element.ref);
  browser_wait_for({ time: 0.5 });
  browser_take_screenshot("after-click.png");
}
```

### Pattern 2: Wait for Content

```typescript
// Wait for text to appear
browser_wait_for({ text: "Expected Text" });

// Wait for text to disappear
browser_wait_for({ textGone: "Loading..." });

// Wait for time
browser_wait_for({ time: 2 });
```

### Pattern 3: Filter Elements

```typescript
// Find all buttons
const buttons = snapshot.filter((el) => el.role === "button");

// Find elements by name pattern
const searchElements = snapshot.filter(
  (el) => el.name?.includes("Search") || el.name?.includes("Filter"),
);

// Find by data attribute (via evaluate)
const customElements = browser_evaluate(() => {
  return Array.from(
    document.querySelectorAll('[data-testid="my-element"]'),
  ).map((el) => ({
    text: el.textContent?.trim(),
    visible: el.getBoundingClientRect().width > 0,
  }));
});
```

### Pattern 4: Test Form Submission

```typescript
// Fill form fields
const nameInput = snapshot.find((el) => el.name?.includes("Name"));
const emailInput = snapshot.find((el) => el.name?.includes("Email"));
const submitButton = snapshot.find((el) => el.name?.includes("Submit"));

if (nameInput) browser_type(nameInput.name, nameInput.ref, "Test Name");
if (emailInput)
  browser_type(emailInput.name, emailInput.ref, "test@example.com");
if (submitButton) {
  browser_click(submitButton.name, submitButton.ref);
  browser_wait_for({ text: "Success" }); // Wait for success message
  browser_take_screenshot("form-submitted.png");
}
```

### Pattern 5: Test Navigation

```typescript
// Click navigation link
const navLink = snapshot.find((el) => el.name === "Dashboard");
if (navLink) {
  browser_click(navLink.name, navLink.ref);
  browser_wait_for({ textGone: "Loading..." });
  browser_take_screenshot("after-navigation.png");
}

// Test browser back button
browser_navigate_back();
browser_wait_for({ time: 0.5 });
browser_take_screenshot("after-back-button.png");
```

### Pattern 6: Test Accordion/Collapsible

```typescript
const accordion = snapshot.find(
  (el) => el.name?.includes("Section") && el.role === "button",
);
if (accordion) {
  // Expand
  browser_click(accordion.name, accordion.ref);
  browser_wait_for({ time: 0.5 });
  browser_take_screenshot("accordion-expanded.png");

  // Collapse
  browser_click(accordion.name, accordion.ref);
  browser_wait_for({ time: 0.3 });
  browser_take_screenshot("accordion-collapsed.png");
}
```

### Pattern 7: Test Filtering/Search

```typescript
// Enter search query
const searchInput = snapshot.find(
  (el) => el.role === "textbox" && el.name?.includes("Search"),
);
if (searchInput) {
  browser_type(searchInput.name, searchInput.ref, "test query");
  browser_wait_for({ time: 0.5 });
  browser_take_screenshot("search-results.png");

  // Clear search
  browser_press_key("Escape");
  browser_wait_for({ time: 0.3 });
}
```

### Pattern 8: Test Multiple States

```typescript
// Test different filter states
const filters = ["All", "Active", "Completed"];
for (const filter of filters) {
  const filterButton = snapshot.find((el) => el.name === filter);
  if (filterButton) {
    browser_click(filterButton.name, filterButton.ref);
    browser_wait_for({ time: 0.5 });
    browser_take_screenshot(`filter-${filter.toLowerCase()}.png`);
  }
}
```

## Tips

1. **Screenshot Naming**: Use descriptive, sequential names: `01-initial.png`, `02-after-action.png`
2. **Wait Times**: Adjust wait times based on your app's performance (0.3s for animations, 0.5s for data loads, 1-2s for API calls)
3. **Error Handling**: Always check if elements exist before interacting
4. **Snapshots**: Get fresh snapshots after major state changes
5. **Console Checks**: Always check for console errors at the end
6. **Responsive**: Test all viewports if layout is important

## Quick Copy-Paste Sections

### Basic Setup

```typescript
browser_navigate("YOUR_URL");
browser_wait_for({ textGone: "Loading..." });
browser_resize(1920, 1080);
browser_take_screenshot("test.png");
```

### Find and Click

```typescript
const snapshot = browser_snapshot();
const button = snapshot.find((el) => el.name === "BUTTON_NAME");
if (button) {
  browser_click(button.name, button.ref);
  browser_wait_for({ time: 0.5 });
}
```

### Type in Input

```typescript
const input = snapshot.find((el) => el.role === "textbox");
if (input) {
  browser_type(input.name, input.ref, "TEXT_TO_TYPE");
  browser_wait_for({ time: 0.5 });
}
```

### Check Errors

```typescript
const messages = browser_console_messages();
const errors = messages.filter((m) => m.level === "error");
if (errors.length > 0) console.error("Errors:", errors);
```

---

**Last Updated**: 2025-01-27

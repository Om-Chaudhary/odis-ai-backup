# Component Visual Testing Example

## Scenario

Test a dashboard stat card component visually across different viewports and states.

## Command Sequence

```typescript
// 1. Navigate to dashboard
browser_navigate("http://localhost:3000/dashboard?tab=overview");

// 2. Wait for page load
browser_wait_for({ textGone: "Loading..." });

// 3. Get page snapshot to find component
const snapshot = browser_snapshot();
const statCard = snapshot.find(
  (el) => el.role === "region" && el.name?.includes("Total Cases"),
);

// 4. Test desktop viewport
browser_resize(1920, 1080);
browser_wait_for({ time: 0.5 }); // Wait for layout
browser_take_screenshot("stat-card-desktop.png", {
  element: "Total Cases stat card",
  ref: statCard.ref,
});

// 5. Test tablet viewport
browser_resize(768, 1024);
browser_wait_for({ time: 0.5 });
browser_take_screenshot("stat-card-tablet.png", {
  element: "Total Cases stat card",
  ref: statCard.ref,
});

// 6. Test mobile viewport
browser_resize(375, 667);
browser_wait_for({ time: 0.5 });
browser_take_screenshot("stat-card-mobile.png", {
  element: "Total Cases stat card",
  ref: statCard.ref,
});

// 7. Test hover state (desktop)
browser_resize(1920, 1080);
browser_wait_for({ time: 0.5 });
browser_hover(statCard.name, statCard.ref);
browser_wait_for({ time: 0.3 }); // Wait for hover animation
browser_take_screenshot("stat-card-hover.png", {
  element: "Total Cases stat card",
  ref: statCard.ref,
});

// 8. Measure dimensions
const dimensions = browser_evaluate(() => {
  const card = document.querySelector('[data-testid="stat-card-total-cases"]');
  if (!card) return null;
  const rect = card.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
  };
});

// 9. Check console for errors
const messages = browser_console_messages();
const errors = messages.filter((m) => m.level === "error");
if (errors.length > 0) {
  // Document errors found
}
```

## Expected Results

- Screenshots captured for all viewports
- Hover state captured
- Dimensions measured
- No console errors

## Documentation

Document findings:

- Visual consistency across viewports
- Hover state appearance
- Component dimensions
- Any visual issues found

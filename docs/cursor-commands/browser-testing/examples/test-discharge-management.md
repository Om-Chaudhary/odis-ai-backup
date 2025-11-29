# Test Discharge Management Interface

## Scenario

Test the discharge management interface at `/dashboard/cases` with all its features including date filtering, status filtering, search, and discharge actions.

## Command Sequence

```typescript
// 1. Navigate to discharge management page
browser_navigate("http://localhost:3000/dashboard/cases");

// 2. Wait for page load
browser_wait_for({ textGone: "Loading..." });

// 3. Take initial screenshot
browser_take_screenshot("01-discharge-management-initial.png");

// 4. Get page snapshot to understand structure
const snapshot = browser_snapshot();

// 5. Test date filtering - All Time
const allTimeFilter = snapshot.find(
  (el) => el.name?.includes("All Time") || el.name?.includes("All"),
);
if (allTimeFilter) {
  browser_click(allTimeFilter.name, allTimeFilter.ref);
  browser_wait_for({ time: 0.5 });
  browser_take_screenshot("02-date-filter-all-time.png");
}

// 6. Test date filtering - Last 3 Days
const threeDayFilter = snapshot.find(
  (el) => el.name?.includes("3D") || el.name?.includes("3 days"),
);
if (threeDayFilter) {
  browser_click(threeDayFilter.name, threeDayFilter.ref);
  browser_wait_for({ time: 1 }); // Wait for data to load
  browser_take_screenshot("03-date-filter-3d.png");
}

// 7. Test status filtering - Ready
const readyFilter = snapshot.find(
  (el) => el.name?.includes("Ready") && el.role === "button",
);
if (readyFilter) {
  browser_click(readyFilter.name, readyFilter.ref);
  browser_wait_for({ time: 0.5 });
  browser_take_screenshot("04-status-filter-ready.png");
}

// 8. Test search functionality
const searchInput = snapshot.find(
  (el) =>
    el.role === "textbox" &&
    (el.name?.includes("Search") || el.name?.includes("search")),
);
if (searchInput) {
  browser_type(searchInput.name, searchInput.ref, "Max");
  browser_wait_for({ time: 0.5 });
  browser_take_screenshot("05-search-results.png");

  // Clear search
  browser_press_key("Escape");
  browser_wait_for({ time: 0.3 });
}

// 9. Test day pagination (if visible)
const nextDayButton = snapshot.find(
  (el) => el.name?.includes("Next") || el.name?.includes(">"),
);
if (nextDayButton) {
  browser_click(nextDayButton.name, nextDayButton.ref);
  browser_wait_for({ time: 0.5 });
  browser_take_screenshot("06-next-day.png");
}

// 10. Test discharge action button (if ready case exists)
const dischargeButton = snapshot.find(
  (el) =>
    el.name?.includes("Discharge") ||
    el.name?.includes("Call") ||
    el.name?.includes("Email"),
);
if (dischargeButton) {
  browser_hover(dischargeButton.name, dischargeButton.ref);
  browser_wait_for({ time: 0.3 });
  browser_take_screenshot("07-discharge-button-hover.png");
}

// 11. Test responsive - Mobile view
browser_resize(375, 667);
browser_wait_for({ time: 0.5 });
browser_take_screenshot("08-discharge-management-mobile.png");

// 12. Test responsive - Tablet view
browser_resize(768, 1024);
browser_wait_for({ time: 0.5 });
browser_take_screenshot("09-discharge-management-tablet.png");

// 13. Check for console errors
const messages = browser_console_messages();
const errors = messages.filter((m) => m.level === "error");
if (errors.length > 0) {
  console.error("Errors found:", errors);
}

// 14. Verify URL state changes
const urlState = browser_evaluate(() => {
  const params = new URLSearchParams(window.location.search);
  return {
    pathname: window.location.pathname,
    params: Object.fromEntries(params.entries()),
  };
});
console.log("URL State:", urlState);
```

## Expected Results

- All filters work correctly
- Search filters results
- Date navigation works
- Discharge buttons are visible for ready cases
- Responsive layouts work on mobile/tablet
- No console errors
- URL state updates correctly

## What to Verify

1. **Date Filters**: All Time, Last Day, 3D, 30D buttons work
2. **Status Filters**: All, Ready, Pending, Completed, Failed filters work
3. **Search**: Filters by patient/owner name
4. **Day Pagination**: Previous/Next day buttons work
5. **Discharge Actions**: Buttons appear for ready cases
6. **Responsive**: Layout adapts to mobile/tablet
7. **URL State**: Query parameters update correctly

## Common Issues to Check

- Date filter doesn't update URL
- Status filter doesn't filter correctly
- Search doesn't work
- Discharge buttons missing for ready cases
- Layout breaks on mobile
- Console errors on filter changes

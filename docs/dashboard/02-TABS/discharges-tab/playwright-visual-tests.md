# Playwright MCP Visual Testing Guide

## Overview

This document outlines the visual testing strategy for the Discharge Management page using Playwright MCP. These tests verify the UI improvements and ensure consistent appearance across different browser sizes.

## Prerequisites

- Playwright MCP server configured and running
- Authenticated user session (tests require login)
- Test data: Cases with various dates and statuses

## Test Scenarios

### 1. Initial Load Testing

**Test Cases:**

- Page load with no cases today (should auto-navigate)
- Page load with cases today (should stay on today)
- Page load with no cases at all (empty state)

**Screenshot Locations:**

- Mobile (375px): `.playwright-mcp/screenshots/initial-load-mobile-*.png`
- Tablet (768px): `.playwright-mcp/screenshots/initial-load-tablet-*.png`
- Desktop (1920px): `.playwright-mcp/screenshots/initial-load-desktop-*.png`

**Steps:**

1. Navigate to `/dashboard/cases`
2. Wait for page to load
3. Take screenshot at each breakpoint
4. Verify auto-navigation behavior (if applicable)

### 2. Date Navigation Testing

**Test Cases:**

- Day navigation in "All Time" mode
- Day navigation in "Last Day" mode
- Date range mode (3D) - verify day navigation is hidden
- Date range mode (30D) - verify day navigation is hidden
- Transitions between modes

**Screenshot Locations:**

- `.playwright-mcp/screenshots/date-navigation-*.png`

**Steps:**

1. Set date range to "All Time"
2. Verify day navigation is visible
3. Take screenshot
4. Navigate to previous/next day
5. Take screenshot
6. Switch to "3D" mode
7. Verify day navigation is hidden, range indicator is shown
8. Take screenshot
9. Switch to "30D" mode
10. Take screenshot
11. Switch back to "All Time"
12. Verify smooth transition
13. Take screenshot

### 3. Search Bar Integration Testing

**Test Cases:**

- Search bar positioning in UnifiedFilterBar
- Responsive layout (mobile stacked, desktop horizontal)
- Search functionality with filters

**Screenshot Locations:**

- `.playwright-mcp/screenshots/search-bar-*.png`

**Steps:**

1. Navigate to page
2. Verify search bar is in filter row (not standalone)
3. Take screenshot at mobile (375px)
4. Take screenshot at tablet (768px)
5. Take screenshot at desktop (1024px)
6. Enter search term
7. Verify results filter correctly
8. Take screenshot

### 4. Filter Combinations Testing

**Test Cases:**

- All filter combinations (date range + status + readiness + search)
- Layout with long search terms
- Empty states with various filters

**Screenshot Locations:**

- `.playwright-mcp/screenshots/filter-combinations-*.png`

**Steps:**

1. Test each filter combination
2. Verify layout doesn't break
3. Test with long search terms
4. Test empty states
5. Take screenshots at each breakpoint

### 5. Cross-Browser Testing

**Test Cases:**

- Chrome
- Firefox
- Safari (if available)

**Screenshot Locations:**

- `.playwright-mcp/screenshots/cross-browser-*.png`

## Implementation Notes

### Browser Sizes

Test at these key breakpoints:

- **Mobile**: 375px width
- **Tablet**: 768px width
- **Desktop**: 1024px width
- **Large Desktop**: 1920px width

### Authentication

Since the page requires authentication, tests will need to:

1. Navigate to login page
2. Authenticate (may require test credentials or session setup)
3. Then navigate to `/dashboard/cases`

### Visual Regression

Compare screenshots before/after changes:

- Store baseline screenshots in `.playwright-mcp/baselines/`
- Compare new screenshots against baselines
- Flag any significant visual differences

## Running Tests

### Manual Testing with Playwright MCP

1. Use Playwright MCP browser tools to navigate and interact
2. Take screenshots at each breakpoint
3. Compare against expected behavior
4. Document any issues found

### Automated Testing (Future)

Consider setting up automated visual regression tests:

- Use Playwright test framework
- Store screenshots in version control
- Run on CI/CD pipeline
- Alert on visual regressions

## Expected Behaviors

### Day Navigation Mode ("All Time" or "Last Day")

- Day navigation controls visible
- Previous/Next day buttons functional
- Date display shows current date
- Case count displayed
- "Go to Today" link visible when not on today

### Range Mode ("3D" or "30D")

- Day navigation controls hidden
- Date range indicator displayed
- Shows formatted date range (e.g., "Last 3 days (Nov 27 - Nov 30)")
- Smooth transition when switching modes

### Search Bar

- Positioned as first element in filter row
- Full width on mobile
- Constrained width (max-w-sm) on desktop
- Search icon visible
- Placeholder text: "Search patients or owners..."

### Empty States

- Helpful messaging based on context
- "Go to Most Recent Cases" button when applicable
- Filter hints when filters are active
- Smooth animations

## Troubleshooting

### Common Issues

1. **Authentication Required**
   - Ensure test user credentials are available
   - May need to set up test session cookies

2. **No Test Data**
   - Create test cases with various dates
   - Ensure cases exist for testing auto-navigation

3. **Layout Shifts**
   - Check for missing loading states
   - Verify transitions are smooth
   - Check for content jumping

4. **Responsive Issues**
   - Verify breakpoints are correct
   - Check mobile/tablet/desktop layouts
   - Test with different viewport sizes

## Next Steps

1. Set up test authentication
2. Create test data scenarios
3. Run initial visual tests
4. Document baseline screenshots
5. Set up automated regression testing (optional)

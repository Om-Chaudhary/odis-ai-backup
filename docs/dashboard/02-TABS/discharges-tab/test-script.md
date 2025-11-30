# Discharge Management Visual Test Script

## Quick Test Checklist

Use this checklist to manually verify all functionality after implementation.

### ✅ Initial Load & Auto-Navigation

- [ ] **Test 1**: Load page with no cases today
  - Expected: Auto-navigates to most recent day with cases
  - Verify: Date changes automatically, cases appear
- [ ] **Test 2**: Load page with cases today
  - Expected: Stays on today, shows cases
  - Verify: No auto-navigation occurs
- [ ] **Test 3**: Load page with no cases at all
  - Expected: Shows empty state with helpful message
  - Verify: Message indicates no cases exist

### ✅ Date Range & Day Navigation

- [ ] **Test 4**: "All Time" mode
  - Expected: Day navigation visible and functional
  - Verify: Can navigate previous/next day
  - Screenshot: `all-time-mode.png`

- [ ] **Test 5**: "Last Day" mode
  - Expected: Day navigation visible and functional
  - Verify: Can navigate previous/next day
  - Screenshot: `last-day-mode.png`

- [ ] **Test 6**: "3D" mode
  - Expected: Day navigation hidden, range indicator shown
  - Verify: Shows "Last 3 days (Nov 27 - Nov 30)" format
  - Screenshot: `3d-mode.png`

- [ ] **Test 7**: "30D" mode
  - Expected: Day navigation hidden, range indicator shown
  - Verify: Shows "Last 30 days (Nov 1 - Nov 30)" format
  - Screenshot: `30d-mode.png`

- [ ] **Test 8**: Mode transitions
  - Expected: Smooth transitions between modes
  - Verify: No layout shifts, animations are smooth
  - Screenshot: `mode-transition.png`

### ✅ Search Bar Integration

- [ ] **Test 9**: Search bar positioning (Mobile 375px)
  - Expected: Search bar at top of filter row, full width
  - Verify: Proper spacing, aligned with other filters
  - Screenshot: `search-mobile-375px.png`

- [ ] **Test 10**: Search bar positioning (Tablet 768px)
  - Expected: Search bar in filter row, proper width
  - Verify: Filters in horizontal layout
  - Screenshot: `search-tablet-768px.png`

- [ ] **Test 11**: Search bar positioning (Desktop 1024px)
  - Expected: Search bar constrained width (max-w-sm), first in row
  - Verify: All filters aligned horizontally
  - Screenshot: `search-desktop-1024px.png`

- [ ] **Test 12**: Search functionality
  - Expected: Filters cases by patient/owner name
  - Verify: Results update as you type
  - Verify: Works with other filters

### ✅ Filter Combinations

- [ ] **Test 13**: Date range + Status filter
  - Expected: Both filters work together
  - Verify: Results match both criteria

- [ ] **Test 14**: Date range + Readiness filter
  - Expected: Both filters work together
  - Verify: Results match both criteria

- [ ] **Test 15**: Search + Status + Readiness
  - Expected: All filters work together
  - Verify: Results match all criteria

- [ ] **Test 16**: Long search terms
  - Expected: Layout doesn't break
  - Verify: Search input handles long text
  - Screenshot: `long-search-term.png`

### ✅ Empty States

- [ ] **Test 17**: Empty state - no cases for date
  - Expected: Shows "No cases found" with helpful message
  - Verify: "Go to Most Recent Cases" button appears (if applicable)
  - Screenshot: `empty-state-no-cases.png`

- [ ] **Test 18**: Empty state - filters applied
  - Expected: Shows "No cases match your filters"
  - Verify: Suggests adjusting filters
  - Screenshot: `empty-state-filtered.png`

- [ ] **Test 19**: Empty state - no cases at all
  - Expected: Shows "You don't have any cases yet"
  - Verify: Helpful onboarding message
  - Screenshot: `empty-state-no-data.png`

### ✅ Visual Indicators

- [ ] **Test 20**: Day mode indicator
  - Expected: Day navigation visible with proper styling
  - Verify: Glassmorphism effect, proper spacing

- [ ] **Test 21**: Range mode indicator
  - Expected: Teal-colored indicator box with dot
  - Verify: Shows formatted date range
  - Verify: Smooth transition from day mode

### ✅ Responsive Behavior

- [ ] **Test 22**: Mobile layout (375px)
  - Expected: All elements stack vertically
  - Verify: Search bar full width
  - Verify: Filters stack properly
  - Screenshot: `responsive-mobile-375px.png`

- [ ] **Test 23**: Tablet layout (768px)
  - Expected: Filters in horizontal row
  - Verify: Proper spacing and alignment
  - Screenshot: `responsive-tablet-768px.png`

- [ ] **Test 24**: Desktop layout (1024px+)
  - Expected: Optimal spacing and alignment
  - Verify: Max-width constraints respected
  - Screenshot: `responsive-desktop-1024px.png`

### ✅ Edge Cases

- [ ] **Test 25**: Single case scenario
  - Expected: Page displays correctly
  - Verify: All functionality works

- [ ] **Test 26**: Many cases (pagination)
  - Expected: Pagination works correctly
  - Verify: Filters work across pages

- [ ] **Test 27**: Rapid filter changes
  - Expected: No race conditions
  - Verify: UI updates correctly

- [ ] **Test 28**: Keyboard navigation
  - Expected: Arrow keys navigate days
  - Expected: 'T' key goes to today
  - Verify: Works when day navigation visible

## Screenshot Naming Convention

Store screenshots in `.playwright-mcp/screenshots/` with naming:

- `{feature}-{breakpoint}-{scenario}.png`
- Example: `search-mobile-375px.png`
- Example: `date-navigation-3d-mode.png`

## Notes

- All tests require authenticated user session
- Test data should include cases with various dates
- Compare screenshots against design specifications
- Document any visual regressions or issues found

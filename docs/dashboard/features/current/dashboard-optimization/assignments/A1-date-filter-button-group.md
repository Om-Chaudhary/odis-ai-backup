# Assignment A1: Date Filter Button Group

> **Status:** Ready for Assignment  
> **Difficulty:** Easy  
> **Dependencies:** None  
> **Estimated Time:** 2-3 days

## Overview

Replace the dropdown menu date selector with a modern button group/toggle button interface following modern dashboard conventions.

## Current Implementation

**File:** `src/components/dashboard/date-range-filter.tsx`

**Current Behavior:**

- Dropdown menu triggered by button
- Shows active preset label (e.g., "Last 30 Days")
- Requires click to see all options
- Options in dropdown with checkmarks

**Problems:**

- Extra click required to see options
- Less discoverable
- Doesn't follow modern dashboard patterns
- Slower interaction

## Target Design

See: [../specifications/date-filter-button-group.md](../specifications/date-filter-button-group.md)

## Implementation Details

### Files to Modify

1. `src/components/dashboard/date-range-filter.tsx` - Main component refactor
2. `src/components/dashboard/dashboard-navigation.tsx` - Layout adjustments if needed

### Key Changes

- Remove DropdownMenu, DropdownMenuTrigger, DropdownMenuContent
- Create button group container with rounded border
- Map presets to buttons with active/inactive states
- Maintain same state management (nuqs query params)

### Code Reference

See: [../specifications/date-filter-button-group.md](../specifications/date-filter-button-group.md) for detailed code structure.

## Acceptance Criteria

- [ ] All 4 presets visible as buttons
- [ ] Active preset clearly highlighted
- [ ] Single click changes date range
- [ ] Works on all dashboard tabs
- [ ] Responsive on mobile devices
- [ ] Maintains existing URL param behavior
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Visual state matches design spec

## Testing Checklist

- [ ] All 4 presets render correctly
- [ ] Active state highlights correctly
- [ ] Clicking button updates URL params
- [ ] Date range filtering works on all tabs
- [ ] Responsive layout works on mobile
- [ ] Keyboard navigation works
- [ ] Smooth transitions on state change

## Related Documentation

- [Design System - Button Groups](../design-system/button-group-examples.md)
- [Date Filter Patterns](../design-system/date-filter-patterns.md)
- [Implementation Guidelines](../implementation/README.md)

---

**Ready to Start:** Review specifications and begin implementation.

# Assignment A1: Date Filter Button Group Component

> **Status:** 🔄 Ready for Assignment  
> **Priority:** High  
> **Estimated Time:** 2-3 hours  
> **Dependencies:** None  
> **Can Work Concurrently:** Yes

## 📋 Overview

Create a reusable `DateFilterButtonGroup` component that replaces dropdown date filters across all dashboard tabs. This component provides a consistent, modern button group interface for date range selection.

## 🎯 Objectives

1. Create reusable date filter button group component
2. Replace dropdown date filters in Overview, Cases, and Discharges tabs
3. Integrate with URL query parameters using `nuqs`
4. Ensure consistent styling across all tabs

## ✅ Acceptance Criteria

- [ ] Component created at `src/components/dashboard/date-filter-button-group.tsx`
- [ ] Button group displays: `[All Time] [Day] [3D] [30D]`
- [ ] Active button highlighted with teal background (`#31aba3`)
- [ ] Inactive buttons use ghost variant
- [ ] URL query parameters update when selection changes
- [ ] Component works in Overview, Cases, and Discharges tabs
- [ ] Responsive on mobile/tablet/desktop
- [ ] Keyboard accessible
- [ ] Follows design system from `docs/dashboard/01-GENERAL/design-system.md`

## 📁 Files to Create/Modify

### New Files

- `src/components/dashboard/date-filter-button-group.tsx` (CREATE)

### Files to Modify

- `src/components/dashboard/overview-tab.tsx` (UPDATE - replace dropdown)
- `src/components/dashboard/cases-tab.tsx` (UPDATE - replace dropdown)
- `src/components/dashboard/discharges-tab.tsx` (UPDATE - integrate alongside day navigation)

## 🔧 Implementation Steps

### Step 1: Create Component

Create `src/components/dashboard/date-filter-button-group.tsx`:

```typescript
"use client";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useQueryState } from "nuqs";

type DateRangePreset = "all" | "1d" | "3d" | "30d";

interface DateFilterButtonGroupProps {
  value?: DateRangePreset;
  onChange?: (preset: DateRangePreset) => void;
  className?: string;
}

export function DateFilterButtonGroup({
  value: controlledValue,
  onChange: controlledOnChange,
  className,
}: DateFilterButtonGroupProps) {
  const [urlValue, setUrlValue] = useQueryState("dateRange", {
    defaultValue: "all",
    parse: (value) => (value as DateRangePreset) || "all",
    serialize: (value) => value,
  });

  const value = controlledValue ?? urlValue;
  const handleChange = controlledOnChange ?? setUrlValue;

  const presets: Array<{ value: DateRangePreset; label: string }> = [
    { value: "all", label: "All Time" },
    { value: "1d", label: "Day" },
    { value: "3d", label: "3D" },
    { value: "30d", label: "30D" },
  ];

  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1",
        className
      )}
    >
      {presets.map((preset) => (
        <Button
          key={preset.value}
          variant={value === preset.value ? "default" : "ghost"}
          size="sm"
          onClick={() => handleChange(preset.value)}
          className={cn(
            value === preset.value &&
              "bg-[#31aba3] text-white shadow-sm hover:bg-[#2a9a92]"
          )}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
```

### Step 2: Calculate Date Ranges

Add helper function to calculate actual dates:

```typescript
// src/lib/utils/date-ranges.ts
import { subDays, startOfDay, endOfDay } from "date-fns";

export function getDateRangeFromPreset(preset: "all" | "1d" | "3d" | "30d"): {
  startDate: Date | null;
  endDate: Date | null;
} {
  const now = new Date();

  switch (preset) {
    case "all":
      return { startDate: null, endDate: null };
    case "1d":
      return {
        startDate: startOfDay(subDays(now, 1)),
        endDate: endOfDay(now),
      };
    case "3d":
      return {
        startDate: startOfDay(subDays(now, 3)),
        endDate: endOfDay(now),
      };
    case "30d":
      return {
        startDate: startOfDay(subDays(now, 30)),
        endDate: endOfDay(now),
      };
  }
}
```

### Step 3: Update Overview Tab

Replace dropdown with button group:

```typescript
// In overview-tab.tsx
import { DateFilterButtonGroup } from "~/components/dashboard/date-filter-button-group";
import { getDateRangeFromPreset } from "~/lib/utils/date-ranges";
import { useQueryState } from "nuqs";

export function OverviewTab() {
  const [dateRange] = useQueryState("dateRange", {
    defaultValue: "all",
  });

  const { startDate, endDate } = getDateRangeFromPreset(
    (dateRange as "all" | "1d" | "3d" | "30d") ?? "all"
  );

  // Use startDate and endDate in queries
  // ...

  return (
    <div>
      <DateFilterButtonGroup />
      {/* Rest of component */}
    </div>
  );
}
```

### Step 4: Update Cases Tab

Similar integration as Overview tab.

### Step 5: Update Discharges Tab

Integrate alongside existing day navigation (see redesign plan for details).

## 🧪 Testing Requirements

1. **Visual Testing:**
   - [ ] Button group renders correctly
   - [ ] Active button has teal background
   - [ ] Inactive buttons are ghost style
   - [ ] Responsive on mobile/tablet/desktop

2. **Functional Testing:**
   - [ ] Clicking buttons updates selection
   - [ ] URL query parameter updates
   - [ ] Date ranges calculated correctly
   - [ ] Works in all three tabs

3. **Accessibility Testing:**
   - [ ] Keyboard navigation works
   - [ ] Screen reader announces selection
   - [ ] Focus indicators visible

## 📚 Related Documentation

- [Date Filter Button Group Spec](../03-COMPONENTS/date-filter-button-group.md)
- [Design System](../01-GENERAL/design-system.md)
- [Overview Tab Redesign](../02-TABS/overview-tab/redesign-plan.md)
- [Cases Tab Redesign](../02-TABS/cases-tab/redesign-plan.md)
- [Discharges Tab Redesign](../02-TABS/discharges-tab/redesign-plan.md)

## 🔗 Dependencies

- `nuqs` package (already installed)
- `date-fns` package (already installed)
- shadcn/ui Button component (already installed)

## ⚠️ Notes

- Component should be controlled or uncontrolled (supports both patterns)
- When used with URL state, it automatically syncs with query params
- Date ranges are calculated client-side for immediate feedback
- Backend queries should accept `startDate` and `endDate` parameters

---

**Ready for Assignment** ✅

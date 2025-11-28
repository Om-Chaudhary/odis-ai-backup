# Assignment A5: Cases Tab Filter Button Groups

> **Status:** 🔄 Ready for Assignment  
> **Priority:** High  
> **Estimated Time:** 3-4 hours  
> **Dependencies:** A1 (Date Filter Button Group)  
> **Can Work Concurrently:** After A1 complete

## 📋 Overview

Replace dropdown filters (Status and Source) in the Cases tab with button groups, matching the design pattern of the date filter button group. This provides a more consistent and discoverable filtering experience.

## 🎯 Objectives

1. Replace Status dropdown with button group
2. Replace Source dropdown with button group
3. Integrate date filter button group
4. Maintain all existing filter functionality
5. Update URL query parameters

## ✅ Acceptance Criteria

- [ ] Status filter uses button group (not dropdown)
- [ ] Source filter uses button group (not dropdown)
- [ ] Date filter button group integrated
- [ ] All filters persist in URL query params
- [ ] Filters reset pagination appropriately
- [ ] Styling matches design system
- [ ] Responsive on mobile/tablet/desktop
- [ ] Keyboard accessible

## 📁 Files to Modify

### Files to Modify

- `src/components/dashboard/cases-tab.tsx` (UPDATE - replace dropdowns)

## 🔧 Implementation Steps

### Step 1: Create Filter Button Group Component (Reusable)

```typescript
// src/components/dashboard/filter-button-group.tsx
"use client";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface FilterButtonGroupProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterButtonGroup<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterButtonGroupProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1",
        className
      )}
    >
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            value === option.value &&
              "bg-[#31aba3] text-white shadow-sm hover:bg-[#2a9a92]"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
```

### Step 2: Update Cases Tab - Status Filter

```typescript
// In cases-tab.tsx
import { FilterButtonGroup } from "~/components/dashboard/filter-button-group";
import { useQueryState } from "nuqs";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "reviewed", label: "Reviewed" },
] as const;

export function CasesTab() {
  const [statusFilter, setStatusFilter] = useQueryState("status", {
    defaultValue: "all",
  });

  // ... existing code ...

  return (
    <div>
      {/* Status Filter */}
      <div>
        <label className="mb-2 block text-sm font-medium">Status</label>
        <FilterButtonGroup
          options={STATUS_OPTIONS}
          value={statusFilter ?? "all"}
          onChange={(value) => {
            setStatusFilter(value === "all" ? null : value);
            setPage(1); // Reset pagination
          }}
        />
      </div>
    </div>
  );
}
```

### Step 3: Update Cases Tab - Source Filter

```typescript
const SOURCE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "manual", label: "Manual" },
  { value: "idexx_neo", label: "IDEXX Neo" },
  { value: "cornerstone", label: "Cornerstone" },
  { value: "ezyvet", label: "ezyVet" },
  { value: "avimark", label: "AVImark" },
] as const;

// Similar implementation as status filter
```

### Step 4: Integrate Date Filter

```typescript
import { DateFilterButtonGroup } from "~/components/dashboard/date-filter-button-group";

// Add date filter below header
<DateFilterButtonGroup />
```

## 🧪 Testing Requirements

1. **Visual Testing:**
   - [ ] Button groups render correctly
   - [ ] Active buttons have teal background
   - [ ] Inactive buttons are ghost style
   - [ ] Responsive on mobile/tablet/desktop

2. **Functional Testing:**
   - [ ] Status filter works correctly
   - [ ] Source filter works correctly
   - [ ] Date filter works correctly
   - [ ] Filters combine correctly (AND logic)
   - [ ] URL parameters update
   - [ ] Pagination resets on filter change

3. **Integration Testing:**
   - [ ] Works with search
   - [ ] Works with view mode toggle
   - [ ] Works with existing case queries

## 📚 Related Documentation

- [Cases Tab Redesign](../02-TABS/cases-tab/redesign-plan.md)
- [Date Filter Button Group Spec](../03-COMPONENTS/date-filter-button-group.md)
- [Design System](../01-GENERAL/design-system.md)

## 🔗 Dependencies

- **A1: Date Filter Button Group** - Should be completed first
- `nuqs` for URL state management
- shadcn/ui Button component

## ⚠️ Notes

- Button groups should wrap on mobile if needed
- Consider creating reusable FilterButtonGroup component
- Maintain backward compatibility with existing filter logic
- Ensure filters work with backend queries

---

**Ready for Assignment** ✅ (After A1 complete)

# Assignment A6: Cases Tab Quick Filters

> **Status:** 🔄 Ready for Assignment  
> **Priority:** Medium  
> **Estimated Time:** 2-3 hours  
> **Dependencies:** A5 (Filter Button Groups), A10 (Backend Metrics)  
> **Can Work Concurrently:** After A5 and A10 complete

## 📋 Overview

Create a Quick Filters component for the Cases tab that provides one-click filtering for common scenarios like "Missing Discharge", "Missing SOAP", "Today", "This Week", etc.

## 🎯 Objectives

1. Create QuickFilters component
2. Add quick filter chips to Cases tab
3. Support multiple selection
4. Integrate with existing filters
5. Update URL query parameters

## ✅ Acceptance Criteria

- [ ] QuickFilters component created
- [ ] Quick filters displayed as chips
- [ ] Multiple selection supported
- [ ] Active filters visually indicated
- [ ] Filters integrate with status/source filters
- [ ] URL query parameters update
- [ ] Responsive on mobile/tablet/desktop
- [ ] **Animations:** Smooth transitions on selection changes
- [ ] **Hover Effects:** Subtle scale (1.02x) on chip hover
- [ ] **Active State:** Smooth color transition when toggled
- [ ] **Icons:** Smooth icon animations

## 📁 Files to Create/Modify

### New Files

- `src/components/dashboard/quick-filters.tsx` (CREATE)

### Files to Modify

- `src/components/dashboard/cases-tab.tsx` (UPDATE - add quick filters)

## 🔧 Implementation Steps

### Step 1: Create QuickFilters Component

```typescript
// src/components/dashboard/quick-filters.tsx
"use client";

import { Button } from "~/components/ui/button";
import { LucideIcon, AlertCircle, FileText, Calendar, Clock } from "lucide-react";
import { cn } from "~/lib/utils";

export type QuickFilterId =
  | "missingDischarge"
  | "missingSoap"
  | "today"
  | "thisWeek"
  | "recent";

interface QuickFilter {
  id: QuickFilterId;
  label: string;
  icon: LucideIcon;
}

const QUICK_FILTERS: QuickFilter[] = [
  { id: "missingDischarge", label: "Missing Discharge", icon: AlertCircle },
  { id: "missingSoap", label: "Missing SOAP", icon: FileText },
  { id: "today", label: "Today", icon: Calendar },
  { id: "thisWeek", label: "This Week", icon: Calendar },
  { id: "recent", label: "Recent", icon: Clock },
];

interface QuickFiltersProps {
  selected: Set<QuickFilterId>;
  onChange: (selected: Set<QuickFilterId>) => void;
  className?: string;
}

export function QuickFilters({
  selected,
  onChange,
  className,
}: QuickFiltersProps) {
  const handleToggle = (filterId: QuickFilterId) => {
    const newSelected = new Set(selected);
    if (newSelected.has(filterId)) {
      newSelected.delete(filterId);
    } else {
      newSelected.add(filterId);
    }
    onChange(newSelected);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {QUICK_FILTERS.map((filter) => {
        const Icon = filter.icon;
        const isActive = selected.has(filter.id);

        return (
          <Button
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => handleToggle(filter.id)}
            className={cn(
              "transition-smooth hover:scale-[1.02]",
              isActive &&
                "bg-[#31aba3] text-white border-[#31aba3] hover:bg-[#2a9a92] shadow-sm"
            )}
          >
            <Icon className="transition-smooth mr-2 h-4 w-4" />
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}
```

### Step 2: Integrate in Cases Tab

```typescript
// In cases-tab.tsx
import { QuickFilters, type QuickFilterId } from "~/components/dashboard/quick-filters";
import { useQueryState } from "nuqs";

export function CasesTab() {
  const [quickFilters, setQuickFilters] = useQueryState("quickFilters", {
    defaultValue: "",
    parse: (value) => {
      if (!value) return new Set<QuickFilterId>();
      return new Set(value.split(",") as QuickFilterId[]);
    },
    serialize: (value) => {
      if (value.size === 0) return "";
      return Array.from(value).join(",");
    },
  });

  // Apply quick filters to query
  const queryFilters = useMemo(() => {
    const filters: {
      missingDischarge?: boolean;
      missingSoap?: boolean;
      startDate?: string;
      endDate?: string;
    } = {};

    if (quickFilters.has("missingDischarge")) {
      filters.missingDischarge = true;
    }
    if (quickFilters.has("missingSoap")) {
      filters.missingSoap = true;
    }
    if (quickFilters.has("today")) {
      const today = format(new Date(), "yyyy-MM-dd");
      filters.startDate = today;
      filters.endDate = today;
    }
    if (quickFilters.has("thisWeek")) {
      const weekStart = startOfWeek(new Date());
      filters.startDate = format(weekStart, "yyyy-MM-dd");
      filters.endDate = format(new Date(), "yyyy-MM-dd");
    }
    if (quickFilters.has("recent")) {
      const yesterday = subDays(new Date(), 1);
      filters.startDate = format(yesterday, "yyyy-MM-dd");
      filters.endDate = format(new Date(), "yyyy-MM-dd");
    }

    return filters;
  }, [quickFilters]);

  return (
    <div>
      {/* Quick Filters */}
      <div>
        <label className="mb-2 block text-sm font-medium">Quick Filters</label>
        <QuickFilters
          selected={quickFilters}
          onChange={(selected) => {
            setQuickFilters(selected);
            setPage(1); // Reset pagination
          }}
        />
      </div>
    </div>
  );
}
```

## 🧪 Testing Requirements

1. **Visual Testing:**
   - [ ] Quick filter chips render correctly
   - [ ] Active filters have teal background
   - [ ] Inactive filters are outline style
   - [ ] Icons display correctly
   - [ ] Responsive on mobile/tablet/desktop

2. **Functional Testing:**
   - [ ] Clicking toggles filter on/off
   - [ ] Multiple filters can be selected
   - [ ] Filters apply correctly to queries
   - [ ] URL parameters update
   - [ ] Works with other filters

3. **Integration Testing:**
   - [ ] Works with status filter
   - [ ] Works with source filter
   - [ ] Works with search
   - [ ] Works with date filter

## 🎨 Animation & Effects Requirements

**Animations:**

- Toggle: `transition-smooth` for color/background changes
- Hover: `hover:scale-[1.02]` for subtle feedback
- Icons: Smooth transitions on state change
- Active state: Smooth transition to teal background

**See:** [Animation and Effects Guidelines](../01-GENERAL/animation-and-effects.md)

## 📚 Related Documentation

- [Cases Tab Redesign](../02-TABS/cases-tab/redesign-plan.md)
- [Design System](../01-GENERAL/design-system.md)
- [Animation and Effects](../01-GENERAL/animation-and-effects.md)

## 🔗 Dependencies

- **A5: Filter Button Groups** - Should be completed first
- **A10: Backend Metrics** - For missing discharge/SOAP queries
- Backend support for quick filter queries

## ⚠️ Notes

- Quick filters should work alongside regular filters (AND logic)
- Consider clearing quick filters when regular filters change significantly
- Backend needs to support `missingDischarge` and `missingSoap` filter parameters
- Date-based quick filters should override date filter button group

---

**Ready for Assignment** ✅ (After A5 and A10 complete)

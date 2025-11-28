# Assignment A8: Discharges Tab Status Summary Bar

> **Status:** 🔄 Ready for Assignment  
> **Priority:** Medium  
> **Estimated Time:** 2-3 hours  
> **Dependencies:** None  
> **Can Work Concurrently:** Yes

## 📋 Overview

Create a Status Summary Bar component for the Discharges tab that provides a quick overview of discharge statuses with quick filter buttons.

## 🎯 Objectives

1. Create StatusSummaryBar component
2. Display case statistics (total, ready, pending, completed, failed)
3. Display scheduled calls and emails counts
4. Add quick filter buttons
5. Integrate with Discharges tab

## ✅ Acceptance Criteria

- [ ] StatusSummaryBar component created
- [ ] Shows accurate case counts
- [ ] Shows scheduled calls/emails counts
- [ ] Quick filter buttons functional
- [ ] Filters update case list
- [ ] Responsive on mobile/tablet/desktop
- [ ] Styling matches design system

## 📁 Files to Create/Modify

### New Files

- `src/components/dashboard/status-summary-bar.tsx` (CREATE)

### Files to Modify

- `src/components/dashboard/discharges-tab.tsx` (UPDATE - add summary bar)

## 🔧 Implementation Steps

### Step 1: Create StatusSummaryBar Component

```typescript
// src/components/dashboard/status-summary-bar.tsx
"use client";

import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface StatusSummaryBarProps {
  totalCases: number;
  readyCases: number;
  pendingCases: number;
  completedCases: number;
  failedCases: number;
  scheduledCalls: number;
  scheduledEmails: number;
  onFilterChange?: (filter: "all" | "ready" | "pending" | "completed" | "failed") => void;
  activeFilter?: string;
}

export function StatusSummaryBar({
  totalCases,
  readyCases,
  pendingCases,
  completedCases,
  failedCases,
  scheduledCalls,
  scheduledEmails,
  onFilterChange,
  activeFilter = "all",
}: StatusSummaryBarProps) {
  return (
    <Card className="border-teal-200/40 bg-gradient-to-br from-teal-50/20 via-white/70 to-white/70">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Summary Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700">{totalCases}</span>
              <span className="text-slate-500"> cases</span>
            </div>
            <div>
              <span className="font-medium text-emerald-700">{readyCases}</span>
              <span className="text-slate-500"> ready</span>
            </div>
            <div>
              <span className="font-medium text-amber-700">{pendingCases}</span>
              <span className="text-slate-500"> pending</span>
            </div>
            <div>
              <span className="font-medium text-blue-700">{scheduledCalls}</span>
              <span className="text-slate-500"> calls</span>
            </div>
            <div>
              <span className="font-medium text-blue-700">{scheduledEmails}</span>
              <span className="text-slate-500"> emails</span>
            </div>
          </div>

          {/* Quick Filters */}
          {onFilterChange && (
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1">
              <Button
                variant={activeFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("all")}
                className={cn(
                  activeFilter === "all" && "bg-[#31aba3] text-white"
                )}
              >
                All
              </Button>
              <Button
                variant={activeFilter === "ready" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("ready")}
              >
                Ready
              </Button>
              <Button
                variant={activeFilter === "pending" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("pending")}
              >
                Pending
              </Button>
              <Button
                variant={activeFilter === "completed" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("completed")}
              >
                Completed
              </Button>
              <Button
                variant={activeFilter === "failed" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("failed")}
              >
                Failed
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 2: Calculate Stats in Discharges Tab

```typescript
// In discharges-tab.tsx
const stats = useMemo(() => {
  const ready = cases.filter((c) => {
    const hasValidPhone = hasValidContact(c.patient.owner_phone);
    const hasValidEmail = hasValidContact(c.patient.owner_email);
    const hasNoDischarge =
      c.scheduled_discharge_calls.length === 0 &&
      c.scheduled_discharge_emails.length === 0;
    return (hasValidPhone || hasValidEmail) && hasNoDischarge;
  }).length;

  const pending = cases.filter((c) => {
    return (
      c.scheduled_discharge_calls.some((call) =>
        ["queued", "ringing", "in_progress"].includes(call.status ?? ""),
      ) ||
      c.scheduled_discharge_emails.some((email) => email.status === "queued")
    );
  }).length;

  // ... calculate other stats ...

  return {
    total: cases.length,
    ready,
    pending,
    completed,
    failed,
    scheduledCalls,
    scheduledEmails,
  };
}, [cases]);
```

### Step 3: Integrate in Discharges Tab

```typescript
import { StatusSummaryBar } from "~/components/dashboard/status-summary-bar";

// In component render:
<StatusSummaryBar
  {...stats}
  onFilterChange={(filter) => setStatusFilter(filter)}
  activeFilter={statusFilter}
/>
```

## 🧪 Testing Requirements

1. **Visual Testing:**
   - [ ] Summary bar renders correctly
   - [ ] Stats display accurately
   - [ ] Filter buttons work
   - [ ] Responsive on mobile/tablet/desktop

2. **Functional Testing:**
   - [ ] Stats calculated correctly
   - [ ] Filters update case list
   - [ ] Multiple filters work together
   - [ ] Handles zero cases gracefully

## 📚 Related Documentation

- [Discharges Tab Redesign](../02-TABS/discharges-tab/redesign-plan.md)
- [Design System](../01-GENERAL/design-system.md)

## 🔗 Dependencies

- shadcn/ui Card and Button components
- Existing case data structure

## ⚠️ Notes

- Stats should be calculated client-side from case data
- Consider memoizing calculations for performance
- Filter buttons should update URL query parameters
- Ready cases = valid contact + no discharge scheduled

---

**Ready for Assignment** ✅

# Assignment A3: Enhanced Stat Cards

> **Status:** 🔄 Ready for Assignment  
> **Priority:** High  
> **Estimated Time:** 2-3 hours  
> **Dependencies:** A10 (Backend Metrics Queries)  
> **Can Work Concurrently:** After A10 complete

## 📋 Overview

Enhance existing stat cards in the Overview tab to show trends, actionable context, and clickable navigation. Add new stat cards for missing discharges and SOAP coverage.

## 🎯 Objectives

1. Enhance existing stat cards with trends and context
2. Add new "Missing Discharges" stat card
3. Enhance "SOAP Notes" card to show coverage percentage
4. Make stat cards clickable where appropriate
5. Add trend indicators (↑↓)

## ✅ Acceptance Criteria

- [ ] Total Cases card shows trend indicator (↑ if increasing)
- [ ] Missing Discharges card added (or replaces one existing)
- [ ] SOAP Coverage card shows percentage and gap
- [ ] Communications card shows breakdown
- [ ] Clickable cards navigate to appropriate filters
- [ ] Trend icons display correctly (green up, red down)
- [ ] All cards follow design system
- [ ] Responsive on mobile/tablet/desktop

## 📁 Files to Create/Modify

### Files to Modify

- `src/components/dashboard/overview-tab.tsx` (UPDATE - enhance stat cards)

### Optional: Create Reusable Component

- `src/components/dashboard/stat-card.tsx` (CREATE - if doesn't exist)

## 🔧 Implementation Steps

### Step 1: Enhance Total Cases Card

```typescript
// In overview-tab.tsx
<StatCard
  title="Total Cases"
  value={stats?.total ?? 0}
  subtitle={
    stats?.thisWeek ? (
      <>
        <TrendingUp className="inline h-3 w-3 text-emerald-600" />
        <span className="ml-1">+{stats.thisWeek} this week</span>
      </>
    ) : (
      "No change this week"
    )
  }
  icon={FolderOpen}
  trend={stats?.thisWeek ? "up" : "stable"}
/>
```

### Step 2: Add Missing Discharges Card

```typescript
<StatCard
  title="Missing Discharges"
  value={stats?.casesNeedingDischarge?.thisWeek ?? 0}
  subtitle={`${stats?.casesNeedingDischarge?.total ?? 0} total`}
  icon={AlertCircle}
  variant="warning"
  onClick={() => {
    router.push("/dashboard?tab=cases&missingDischarge=true");
  }}
/>
```

### Step 3: Enhance SOAP Coverage Card

```typescript
<StatCard
  title="SOAP Coverage"
  value={`${stats?.soapCoverage?.percentage ?? 0}%`}
  subtitle={`${stats?.casesNeedingSoap?.total ?? 0} cases need SOAP`}
  icon={FileText}
  variant={stats?.soapCoverage?.percentage >= 80 ? "success" : "warning"}
  onClick={() => {
    router.push("/dashboard?tab=cases&missingSoap=true");
  }}
/>
```

### Step 4: Enhance Communications Card

```typescript
<StatCard
  title="Communications"
  value={(stats?.callsCompleted ?? 0) + (stats?.emailsSent ?? 0)}
  subtitle={
    <>
      {stats?.callsCompleted ?? 0} calls, {stats?.emailsSent ?? 0} emails
    </>
  }
  icon={Phone}
/>
```

### Step 5: Create/Update StatCard Component

If reusable component doesn't exist, create it:

```typescript
// src/components/dashboard/stat-card.tsx
"use client";

import { Card, CardContent } from "~/components/ui/card";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  icon: LucideIcon;
  trend?: "up" | "down" | "stable";
  variant?: "default" | "warning" | "success";
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  onClick,
}: StatCardProps) {
  const variantStyles = {
    default: "border-teal-200/40",
    warning: "border-amber-200/40 bg-gradient-to-br from-amber-50/20 via-white/70 to-white/70",
    success: "border-emerald-200/40",
  };

  return (
    <Card
      className={cn(
        "transition-smooth hover:shadow-lg cursor-pointer",
        variantStyles[variant],
        onClick && "hover:translate-y-[-1px]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {trend === "up" && (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              )}
              {trend === "down" && (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          <Icon className="h-12 w-12 text-[#31aba3]" />
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🧪 Testing Requirements

1. **Visual Testing:**
   - [ ] All stat cards render correctly
   - [ ] Trend icons display appropriately
   - [ ] Variant styling works (default, warning, success)
   - [ ] Hover effects work on clickable cards
   - [ ] Responsive on mobile/tablet/desktop

2. **Functional Testing:**
   - [ ] Clickable cards navigate correctly
   - [ ] Trend calculations are correct
   - [ ] Percentages display correctly
   - [ ] Handles missing data gracefully

3. **Data Testing:**
   - [ ] Uses data from enhanced `getCaseStats` query
   - [ ] Updates when date filter changes
   - [ ] Shows correct values

## 📚 Related Documentation

- [Overview Tab Redesign](../02-TABS/overview-tab/redesign-plan.md)
- [Design System](../01-GENERAL/design-system.md)
- [Backend Metrics Assignment](./A10-backend-metrics-queries.md)

## 🔗 Dependencies

- **A10: Backend Metrics Queries** - Must be completed first
- shadcn/ui Card component
- Lucide React icons

## ⚠️ Notes

- Stat cards should be clickable only when they have actionable destinations
- Trend indicators should only show when there's meaningful change
- Variant styling helps users quickly identify attention-needed metrics
- All cards should handle loading and error states gracefully

---

**Ready for Assignment** ✅ (After A10 complete)

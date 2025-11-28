# Completion Rate Queries

## Overview

Calculate completion rates for cases with discharge summaries (this week, this month, overall).

## Completion Rate Calculation

**Formula:**

- Completion Rate = (Cases with Discharge Summaries / Total Cases) \* 100

## This Week Completion Rate

```typescript
// Cases created this week
const casesThisWeek =
  allCases?.filter((c) => new Date(c.created_at) >= oneWeekAgo).length ?? 0;

// Cases created this week WITH discharge summaries
const completedThisWeek =
  allCases?.filter((c) => {
    const createdThisWeek = new Date(c.created_at) >= oneWeekAgo;
    const hasDischarge =
      c.discharge_summaries && c.discharge_summaries.length > 0;
    return createdThisWeek && hasDischarge;
  }).length ?? 0;

const percentage =
  casesThisWeek > 0 ? Math.round((completedThisWeek / casesThisWeek) * 100) : 0;
```

## This Month Completion Rate

Similar calculation but using `oneMonthAgo`:

```typescript
const casesThisMonth =
  allCases?.filter((c) => new Date(c.created_at) >= oneMonthAgo).length ?? 0;

const completedThisMonth =
  allCases?.filter((c) => {
    const createdThisMonth = new Date(c.created_at) >= oneMonthAgo;
    const hasDischarge =
      c.discharge_summaries && c.discharge_summaries.length > 0;
    return createdThisMonth && hasDischarge;
  }).length ?? 0;
```

## Overall Completion Rate

```typescript
const totalCases = allCases?.length ?? 0;
const completedTotal =
  allCases?.filter(
    (c) => c.discharge_summaries && c.discharge_summaries.length > 0,
  ).length ?? 0;

const overallPercentage =
  totalCases > 0 ? Math.round((completedTotal / totalCases) * 100) : 0;
```

## Return Format

```typescript
completionRate: {
  thisWeek: {
    completed: completedThisWeek,
    created: casesThisWeek,
    percentage: percentageThisWeek,
  },
  thisMonth: {
    completed: completedThisMonth,
    created: casesThisMonth,
    percentage: percentageThisMonth,
  },
  overall: {
    completed: completedTotal,
    total: totalCases,
    percentage: overallPercentage,
  },
}
```

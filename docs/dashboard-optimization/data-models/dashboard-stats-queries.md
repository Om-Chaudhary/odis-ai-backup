# Dashboard Stats Queries

## Overview

Backend queries for actionable dashboard metrics in the `getCaseStats` procedure.

## Location

**File:** `src/server/api/routers/dashboard.ts`  
**Procedure:** `getCaseStats`

## New Return Type

```typescript
{
  // Existing fields
  total: number;
  thisWeek: number;
  byStatus: {
    draft: number;
    ongoing: number;
    completed: number;
    reviewed: number;
  }
  bySource: Record<string, number>;
  soapNotes: number;
  dischargeSummaries: number;
  callsCompleted: number;
  emailsSent: number;

  // New fields
  casesNeedingDischarge: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  }
  casesNeedingSoap: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  }
  completionRate: {
    thisWeek: {
      completed: number;
      created: number;
      percentage: number;
    }
    thisMonth: {
      completed: number;
      created: number;
      percentage: number;
    }
    overall: {
      completed: number;
      total: number;
      percentage: number;
    }
  }
}
```

## Implementation Notes

- All queries filter by `user_id` (RLS)
- Date filters respect `startDate` and `endDate` params
- Use PostgreSQL `FILTER` clauses for efficiency
- Calculate percentages in TypeScript after fetching counts

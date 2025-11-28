# Assignment A2: Backend Metrics Queries

> **Status:** Ready for Assignment  
> **Difficulty:** Medium  
> **Dependencies:** None  
> **Estimated Time:** 2-3 days

## Overview

Add backend queries to support actionable dashboard metrics: cases needing discharge summaries, cases needing SOAP notes, and completion rates.

## Files to Modify

1. `src/server/api/routers/dashboard.ts` - Add queries to `getCaseStats`

## Requirements

### New Data Fields

Add to `getCaseStats` return value:

```typescript
{
  // ... existing fields
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

### SQL Queries

See: [../data-models/cases-needing-discharge-query.md](../data-models/cases-needing-discharge-query.md)
See: [../data-models/cases-needing-soap-query.md](../data-models/cases-needing-soap-query.md)
See: [../data-models/completion-rate-queries.md](../data-models/completion-rate-queries.md)

## Acceptance Criteria

- [ ] Queries return correct counts
- [ ] Time-based filtering works correctly (this week, this month)
- [ ] User-based filtering works (RLS respected)
- [ ] TypeScript types updated
- [ ] Queries are performant (indexed)
- [ ] Error handling implemented

## Testing Checklist

- [ ] Query returns correct total counts
- [ ] This week filter works correctly
- [ ] This month filter works correctly
- [ ] User filtering works (RLS)
- [ ] Handles empty results gracefully
- [ ] Performance is acceptable (< 200ms)

## Related Documentation

- [Data Models](../data-models/README.md)
- [Dashboard Stats Queries](../data-models/dashboard-stats-queries.md)
- [Dashboard Stats Types](../data-models/dashboard-stats-types.md)

---

**Ready to Start:** Review data model documentation and begin implementation.

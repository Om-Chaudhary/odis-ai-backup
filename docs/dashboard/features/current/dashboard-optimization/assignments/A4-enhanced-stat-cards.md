# Assignment A4: Enhanced Stat Cards & Layout

> **Status:** Ready for Assignment  
> **Difficulty:** Easy  
> **Dependencies:** A2 (Backend Metrics Queries)  
> **Estimated Time:** 1-2 days

## Overview

Enhance existing stat cards with actionable context and reorganize dashboard layout for better information hierarchy.

## Files to Modify

1. `src/components/dashboard/overview-tab.tsx` - Enhance stat card subtitles and reorder layout

## Part 1: Enhance Stat Cards

### Discharge Summaries Card

**Current:**

```
Discharge Summaries
170
Created
```

**Enhanced:**

```
Discharge Summaries
170
Created • 735 cases need discharge summaries
```

### SOAP Notes Card

**Current:**

```
SOAP Notes
182
Generated
```

**Enhanced:**

```
SOAP Notes
182
Generated • 410 cases need SOAP notes
```

### Implementation

Update the `StatCard` subtitle prop to include completion context:

```typescript
<StatCard
  title="Discharge Summaries"
  value={stats?.dischargeSummaries ?? 0}
  subtitle={
    <span>
      Created
      {stats?.casesNeedingDischarge?.total && (
        <> • {stats.casesNeedingDischarge.total} cases need discharge summaries</>
      )}
    </span>
  }
  icon={FileCheck}
/>
```

## Part 2: Layout Reorganization

### New Layout Order

**Above the Fold:**

1. Header (Title + Description)
2. 4 KPI Cards (Total Cases, Cases Needing Discharge, SOAP Coverage, Communications)
3. Weekly Activity Chart (condensed height: 250px)
4. Cases Needing Attention + Recent Cases (side-by-side)

**Below the Fold:** 5. Recent Activity Timeline (collapsed by default)

### Current Layout (for reference)

1. Header
2. 4 Stat Cards
3. Weekly Activity Chart
4. Case Sources + Recent Cases (side-by-side)
5. Recent Activity Timeline (expanded)

### Changes Needed

1. Remove `SourceBreakdownCard` (replaced by A3)
2. Move Recent Activity Timeline to bottom
3. Ensure proper spacing and responsive behavior
4. Condense Weekly Activity Chart height if needed

### Responsive Behavior

- Desktop: 2-column grid for Cases Needing Attention + Recent Cases
- Mobile: Stack vertically
- All cards maintain consistent spacing

## Data Source

Enhanced data comes from:

- `api.dashboard.getCaseStats.useQuery()`
- New fields added in A2: `casesNeedingDischarge`, `casesNeedingSoap`

## Acceptance Criteria

- [ ] Stat card subtitles display enhanced context
- [ ] Numbers match backend data
- [ ] Card layout remains clean and readable
- [ ] Layout order follows new hierarchy
- [ ] Cases Needing Attention card replaces Case Sources
- [ ] Recent Activity is at bottom
- [ ] Responsive layout works correctly
- [ ] Spacing is consistent

## Testing Checklist

- [ ] Enhanced subtitles display correctly
- [ ] Numbers are accurate
- [ ] Layout order is correct
- [ ] No layout breaks on different screen sizes
- [ ] All components render in correct order
- [ ] Visual hierarchy is clear

## Related Documentation

- [Enhanced Stat Cards Specification](../specifications/enhanced-stat-cards.md)
- [Layout Guidelines](../design-system/layout-guidelines.md)
- [Backend Metrics Queries](./A2-backend-metrics-queries.md)

---

**Ready to Start:** Complete A2 first, then begin implementation.

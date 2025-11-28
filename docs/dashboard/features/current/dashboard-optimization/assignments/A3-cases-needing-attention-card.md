# Assignment A3: Cases Needing Attention Card

> **Status:** Ready for Assignment  
> **Difficulty:** Medium  
> **Dependencies:** A2 (Backend Metrics Queries)  
> **Estimated Time:** 2-3 days

## Overview

Create a new "Cases Needing Attention" card component that replaces the low-value "Case Sources" card. This component displays actionable metrics showing cases that need discharge summaries or SOAP notes.

## Purpose

Replace the "Case Sources" breakdown (which shows mostly manual entries and isn't actionable) with a card that shows work that needs to be done - cases missing discharge summaries and SOAP notes.

## Files to Create/Modify

1. **Create:** `src/components/dashboard/cases-needing-attention-card.tsx`
2. **Modify:** `src/components/dashboard/overview-tab.tsx` - Replace `SourceBreakdownCard` with new component

## Component Specifications

### Props Interface

```typescript
interface CasesNeedingAttentionCardProps {
  casesNeedingDischarge: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  casesNeedingSoap: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  onViewDischarges?: () => void;
  onViewSoap?: () => void;
}
```

### Visual Design

```
┌─────────────────────────────────────────┐
│ Cases Needing Attention                 │
├─────────────────────────────────────────┤
│                                         │
│ Discharge Summaries                     │
│   183 this week • 735 total             │
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░ 65%           │
│                                         │
│ SOAP Notes                              │
│   187 this week • 410 total             │
│   ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░ 36%           │
│                                         │
│ [View Cases Missing Discharges]         │
│ [View Cases Missing SOAP]               │
└─────────────────────────────────────────┘
```

### Key Features

1. **Two Sections:**
   - Discharge Summaries needing attention
   - SOAP Notes needing attention

2. **Metrics Display:**
   - Large, bold numbers for "this week" count
   - Secondary text for total count
   - Progress bar showing percentage incomplete
   - Visual priority with teal accents

3. **Action Buttons:**
   - "View Cases Missing Discharges" - Links to filtered case view
   - "View Cases Missing SOAP" - Links to filtered case view
   - Buttons styled with teal accent

4. **Visual Design:**
   - Matches existing dashboard card style
   - Uses teal (#31aba3) for emphasis
   - Clear visual hierarchy
   - Responsive layout

## Implementation Details

### Component Structure

```typescript
export function CasesNeedingAttentionCard({
  casesNeedingDischarge,
  casesNeedingSoap,
  onViewDischarges,
  onViewSoap,
}: CasesNeedingAttentionCardProps) {
  // Calculate percentages
  // Render sections with progress bars
  // Include action buttons
}
```

### Styling

- Card matches existing dashboard cards
- Use `Card`, `CardHeader`, `CardTitle`, `CardContent` from shadcn/ui
- Teal accent colors for highlights
- Progress bars using existing UI patterns

### Progress Bar Calculation

For Discharge Summaries:

- Percentage = (total cases - cases with discharge) / total cases
- Display as visual progress bar

For SOAP Notes:

- Percentage = (total cases - cases with SOAP) / total cases
- Display as visual progress bar

### Action Button Behavior

- Navigate to cases tab with filter applied
- Use URL params to filter: `?missing=discharge` or `?missing=soap`
- Or use tRPC query filtering

## Integration

### In overview-tab.tsx

Replace:

```typescript
{stats?.bySource && Object.keys(stats.bySource).length > 0 && (
  <SourceBreakdownCard bySource={stats.bySource} />
)}
```

With:

```typescript
{stats?.casesNeedingDischarge && (
  <CasesNeedingAttentionCard
    casesNeedingDischarge={stats.casesNeedingDischarge}
    casesNeedingSoap={stats.casesNeedingSoap}
    onViewDischarges={() => {
      // Navigate to cases tab with filter
    }}
    onViewSoap={() => {
      // Navigate to cases tab with filter
    }}
  />
)}
```

## Data Source

Component receives data from:

- `api.dashboard.getCaseStats.useQuery()`
- Fields: `casesNeedingDischarge`, `casesNeedingSoap` (from A2)

## Acceptance Criteria

- [ ] Card displays correct counts
- [ ] Progress bars show correct percentages
- [ ] "This week" counts are highlighted
- [ ] Total counts are visible but secondary
- [ ] Action buttons navigate correctly
- [ ] Matches dashboard design system
- [ ] Responsive on mobile
- [ ] Hover states on buttons work
- [ ] Empty states handled gracefully

## Testing Checklist

- [ ] Component renders with provided data
- [ ] Progress bars calculate correctly
- [ ] Buttons trigger navigation/filtering
- [ ] Responsive layout works
- [ ] Matches visual design
- [ ] Handles zero values gracefully
- [ ] Handles missing data gracefully

## Related Documentation

- [Component Specification](../specifications/cases-needing-attention-card.md)
- [Backend Metrics Queries](./A2-backend-metrics-queries.md)
- [Design System - Metrics Display](../design-system/metrics-display-patterns.md)

---

**Ready to Start:** Complete A2 first, then begin implementation.

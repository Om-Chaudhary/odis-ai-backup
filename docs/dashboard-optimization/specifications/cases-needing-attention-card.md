# Cases Needing Attention Card - Specification

## Overview

Card component displaying actionable metrics for cases needing discharge summaries and SOAP notes.

## Visual Design

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

## Component Props

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

## Section Design

### Discharge Summaries Section

- **Label:** "Discharge Summaries"
- **Primary Metric:** "183 this week" (large, bold, teal)
- **Secondary Metric:** "• 735 total" (smaller, muted)
- **Progress Bar:** Shows percentage incomplete (65%)
- **Action Button:** "View Cases Missing Discharges"

### SOAP Notes Section

- **Label:** "SOAP Notes"
- **Primary Metric:** "187 this week" (large, bold, teal)
- **Secondary Metric:** "• 410 total" (smaller, muted)
- **Progress Bar:** Shows percentage incomplete (36%)
- **Action Button:** "View Cases Missing SOAP"

## Styling

- Card matches existing dashboard card style
- Teal accents for emphasis (#31aba3)
- Progress bars use teal color
- Action buttons use outline variant with teal

## Progress Bar Calculation

- Total cases needed = casesNeedingDischarge.total
- Percentage = (total needed / total cases) \* 100
- Visual progress bar shows incomplete percentage

## Behavior

- Click action buttons to filter/view cases
- Navigate to cases tab with URL params or tRPC filters
- Hover states on buttons

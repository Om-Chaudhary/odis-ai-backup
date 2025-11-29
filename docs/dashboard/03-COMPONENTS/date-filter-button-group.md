# Date Filter Button Group - Specification

## Overview

Replace dropdown menu with modern button group for date range selection.

## Current Implementation

Uses `DropdownMenu` component with trigger button.

## Target Design

### Desktop Layout

```
┌────────────────────────────────────────────────────┐
│ [All Time] [Last Day] [3 Days] [30 Days]          │
│  (ghost)     (ghost)    (ghost)   (active/teal)   │
└────────────────────────────────────────────────────┘
```

### Mobile Layout

**Option 1: Stacked**

```
┌─────────────────────┐
│ [All Time]          │
│ [Last Day]          │
│ [3 Days]            │
│ [30 Days] ✓         │
└─────────────────────┘
```

**Option 2: Scrollable Horizontal**

```
┌─────────────────────┐
│ [All] [1d] [3d] [30d] │
│       (scrollable)    │
└─────────────────────┘
```

## Component Structure

### Presets

```typescript
const presets: DatePreset[] = [
  {
    label: "All Time",
    value: "all",
    description: "View all data",
    getRange: () => null,
  },
  {
    label: "Last Day",
    value: "1d",
    description: "Past 24 hours",
    getRange: () => {
      const end = endOfToday();
      const start = subDays(end, 1);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    },
  },
  {
    label: "Last 3 Days",
    value: "3d",
    description: "Past 3 days",
    getRange: () => {
      const end = endOfToday();
      const start = subDays(end, 3);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    },
  },
  {
    label: "Last 30 Days",
    value: "30d",
    description: "Past month",
    getRange: () => {
      const end = endOfToday();
      const start = subDays(end, 30);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    },
  },
];
```

## Styling Specifications

### Container

```typescript
className = "inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50/50";
```

### Active Button

- Background: `bg-[#31aba3]` (teal)
- Text: `text-white`
- Shadow: `shadow-sm`
- Hover: `hover:bg-[#2a9a92]` (darker teal)

### Inactive Button

- Background: Transparent
- Text: `text-slate-700`
- Hover: `hover:bg-slate-100 hover:text-slate-900`

### Responsive

- Desktop: `flex-row` horizontal layout
- Mobile: `flex-col` stacked OR horizontal scroll

## Behavior

- Single click selects preset
- Updates URL query params immediately
- Active state visually distinct
- Smooth transitions

## State Management

Uses `nuqs` for URL state:

- `dateRange` query param (e.g., "30d")
- `startDate` and `endDate` query params (when preset selected)

## Accessibility

- Keyboard navigation (Tab, Arrow keys, Enter)
- ARIA labels
- Focus states visible

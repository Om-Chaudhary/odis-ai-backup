# Dashboard Navigation System

## Overview

The dashboard now features a unified navigation system that combines tab-based navigation with date range presets. This provides an intuitive, modern interface for filtering dashboard data.

## Architecture

### Components

#### 1. **DashboardNavigation** (New)

**Location:** `src/components/dashboard/dashboard-navigation.tsx`

The main navigation component that combines:

- **Tab Navigation** (Overview, Cases, Discharges)
- **Date Range Presets** (dropdown menu)

Features:

- Responsive flex layout (stacks on mobile)
- Smooth animations
- URL-based state management via `nuqs`

```typescript
// Usage in dashboard-content-with-tabs.tsx
<DashboardNavigation />
```

#### 2. **DateRangePresets** (Refactored)

**Location:** `src/components/dashboard/date-range-filter.tsx`

Replaced the date picker dialog with a preset-based dropdown menu.

**Available Presets:**

- **All Time** - No date filter (shows all data)
- **Last Day** - Past 24 hours
- **Last 3 Days** - Past 3 days
- **Last 30 Days** - Past month

**Features:**

- Quick access dropdown menu
- Visual indicators (checkmark) for active preset
- Preset descriptions
- Automatic URL parameter updates

**URL Parameters:**

- `dateRange` - Current preset (all, 1d, 3d, 30d)
- `startDate` - ISO date string (auto-calculated from preset)
- `endDate` - ISO date string (auto-calculated from preset)

#### 3. **DashboardTabs** (Deprecated)

**Location:** `src/components/dashboard/dashboard-tabs.tsx`

Marked as deprecated. Use `DashboardNavigation` instead.

### Data Flow

```
User Selects Preset (Dropdown)
         ↓
DateRangePresets Handler
         ↓
Updates URL Params (dateRange, startDate, endDate)
         ↓
Child Components Re-render
         ↓
tRPC Queries Execute with Date Filters
         ↓
Dashboard Data Updates
```

## Usage

### In Your Dashboard

Replace old tab-based navigation with the new unified navigation:

```typescript
// Before (deprecated)
import { DashboardTabs } from "./dashboard-tabs";
<DashboardTabs />

// After (new)
import { DashboardNavigation } from "./dashboard-navigation";
<DashboardNavigation />
```

### Accessing Date Filters in Child Components

Child components (OverviewTab, CasesTab, DischargesTab) access the date filters via URL parameters:

```typescript
interface ChildTabProps {
  startDate?: string | null;
  endDate?: string | null;
}

export function OverviewTab({ startDate, endDate }: ChildTabProps) {
  // Use startDate and endDate in your queries
  const { data } = api.dashboard.getCaseStats.useQuery({
    startDate,
    endDate,
  });
  // ...
}
```

## Date Calculation Logic

### Preset Ranges (All timestamps in user's local timezone)

**Last Day:**

```
Start: Yesterday at 00:00:00
End:   Today at 23:59:59
Range: 24-hour window
```

**Last 3 Days:**

```
Start: 3 days ago at 00:00:00
End:   Today at 23:59:59
Range: 72-hour window
```

**Last 30 Days:**

```
Start: 30 days ago at 00:00:00
End:   Today at 23:59:59
Range: 30-day window
```

## UI/UX Features

### Responsive Design

- **Desktop:** Tab navigation and date presets side-by-side
- **Mobile:** Components stack vertically with full width
- Smooth animations on load (`animate-fade-in-down`)

### Visual Feedback

- **Active State:** Checkmark icon on selected preset
- **Hover Effects:** Smooth color transitions
- **Button States:** Outline style for accessibility

### Accessibility

- Keyboard navigable dropdown menu
- Clear labels and descriptions
- Semantic HTML structure

## Backend Integration

### Router Updates

The following dashboard router procedures now support date range filters:

```typescript
// All procedures accept optional date range parameters
.input(
  z.object({
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    // ... other parameters
  }),
)
```

**Updated Procedures:**

- `getCaseStats` - Overall case statistics
- `getRecentActivity` - Recent activities timeline
- `getWeeklyActivity` - Weekly activity chart
- `getAllCases` - Case list with pagination

**Implementation Details:**

- Dates are ISO strings (YYYY-MM-DD format)
- End date filters include the entire day (11:59:59)
- Null/undefined dates mean no filter applied

## Extending the Navigation

### Adding New Date Presets

To add a new preset, update the `presets` array in `date-range-filter.tsx`:

```typescript
const presets: DatePreset[] = [
  // ... existing presets
  {
    label: "Last Week",
    value: "7d",
    description: "Past 7 days",
    getRange: () => {
      const end = endOfToday();
      const start = subDays(end, 7);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    },
  },
];
```

### Customizing Colors

The date range button uses the following Tailwind classes:

- `variant="outline"` - Base style
- `hover:bg-slate-50` - Hover effect
- Active state indicator: Teal checkmark (`text-[#31aba3]`)

## Performance Considerations

- **URL-based State:** Enables browser history and link sharing
- **Memoization:** Child components only re-render when tab or dates change
- **Query Deduplication:** tRPC automatically dedupes identical requests
- **Lazy Evaluation:** Dates are calculated only when preset is selected

## Testing the Implementation

### Smoke Tests

- [ ] Select each date preset and verify data updates
- [ ] Check URL parameters change correctly
- [ ] Verify browser back/forward works
- [ ] Share a filtered dashboard link and verify it loads correctly

### Data Verification

- [ ] "Last Day" shows only today's data
- [ ] "Last 3 Days" shows 3 days of data
- [ ] "Last 30 Days" shows 30 days of data
- [ ] "All Time" shows unfiltered data

## Files Modified

- ✅ `src/components/dashboard/date-range-filter.tsx` - Refactored to presets
- ✅ `src/components/dashboard/dashboard-navigation.tsx` - New unified navigation
- ✅ `src/components/dashboard/dashboard-content-with-tabs.tsx` - Updated to use new navigation
- ✅ `src/components/dashboard/dashboard-tabs.tsx` - Marked as deprecated
- ✅ `src/components/dashboard/overview-tab.tsx` - Enhanced animations
- ✅ `src/components/dashboard/cases-tab.tsx` - Enhanced animations
- ✅ `src/components/dashboard/discharges-tab.tsx` - Props updated
- ✅ `src/server/api/routers/dashboard.ts` - Date filter support added

## Future Enhancements

- [ ] Custom date range picker (modal with calendar)
- [ ] Date range templates per user
- [ ] API integration for saved date filters
- [ ] More granular presets (hourly, weekly, quarterly, yearly)
- [ ] Date range comparison (e.g., "Last 30 days vs Previous 30 days")

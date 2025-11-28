# Dashboard Date Filtering - Quick Start Guide

## 🚀 Quick Overview

The dashboard now features **preset-based date range filtering** integrated directly into the main navigation. No more dialogs—just click and filter!

### What Users See

```
┌─────────────────────────────────────────────┐
│ [📊 Overview] [📁 Cases] [📞 Discharges]   📅 Last 30 Days │
└─────────────────────────────────────────────┘
```

Click the date button to see:

```
┌────────────────────────────┐
│ DATE RANGE                 │
├────────────────────────────┤
│ ✓ All Time                 │
├────────────────────────────┤
│   Last Day (24 hours)      │
├────────────────────────────┤
│   Last 3 Days              │
├────────────────────────────┤
│   Last 30 Days             │
└────────────────────────────┘
```

## 🛠 For Developers

### The New Component Structure

```
DashboardNavigation
├── Tab Navigation (existing)
└── DateRangePresets (new)
```

**Location:** `src/components/dashboard/dashboard-navigation.tsx`

### How to Use It

**In your page/layout:**

```tsx
import { DashboardContentWithTabs } from "~/components/dashboard/dashboard-content-with-tabs";

export default function DashboardPage() {
  return <DashboardContentWithTabs />;
}
```

That's it! The component handles everything:

- Tab selection
- Date range selection
- URL state management
- Data filtering

### Accessing Date Filters in Child Components

Child components receive date parameters:

```tsx
interface TabProps {
  startDate?: string | null;
  endDate?: string | null;
}

export function OverviewTab({ startDate, endDate }: TabProps) {
  const { data } = api.dashboard.getCaseStats.useQuery({
    startDate, // Pass through to API
    endDate,
  });

  return <div>{/* render data */}</div>;
}
```

### Backend: Updated Router Procedures

Your tRPC router now supports date filtering:

```typescript
// src/server/api/routers/dashboard.ts

export const dashboardRouter = createTRPCRouter({
  getCaseStats: protectedProcedure
    .input(
      z.object({
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("cases")
        .select("...")
        .eq("user_id", ctx.user.id);

      if (input.startDate) {
        query = query.gte("created_at", input.startDate);
      }
      if (input.endDate) {
        const end = new Date(input.endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }

      // ... rest of query
    }),
});
```

## 📅 Date Preset Details

### Preset: All Time

- **Duration:** Unlimited
- **Use Case:** Seeing all historical data
- **URL State:** `dateRange=all` (no start/end dates)
- **API Call:** `getCaseStats({})`

### Preset: Last Day

- **Duration:** Past 24 hours (today)
- **Use Case:** Monitoring today's activity
- **Calculation:** `endOfToday() - 1 day`
- **URL State:**
  ```
  dateRange=1d
  startDate=2025-11-27
  endDate=2025-11-28
  ```
- **API Call:** `getCaseStats({ startDate, endDate })`

### Preset: Last 3 Days

- **Duration:** 72-hour window
- **Use Case:** Recent activity analysis
- **Calculation:** `endOfToday() - 3 days`
- **URL State:**
  ```
  dateRange=3d
  startDate=2025-11-25
  endDate=2025-11-28
  ```

### Preset: Last 30 Days

- **Duration:** Monthly data
- **Use Case:** Trend analysis
- **Calculation:** `endOfToday() - 30 days`
- **URL State:**
  ```
  dateRange=30d
  startDate=2025-10-29
  endDate=2025-11-28
  ```

## 🔗 URL Structure

### No Filter Selected

```
https://yourapp.com/dashboard?tab=overview&dateRange=all
```

### With Date Filter

```
https://yourapp.com/dashboard
  ?tab=cases
  &dateRange=30d
  &startDate=2025-10-29
  &endDate=2025-11-28
```

### Shareable Link

Users can share their current dashboard view:

```
// Share this URL with a colleague
https://yourapp.com/dashboard?tab=overview&dateRange=30d&startDate=2025-10-29&endDate=2025-11-28

// They see the exact same view
```

## 🎨 UI Features

### Visual Indicators

- **Active Preset:** Green checkmark (✓)
- **Label + Description:** Clear labeling for each option
- **Responsive:** Works on mobile, tablet, desktop
- **Icons:** Calendar icon in button

### Animations

- Smooth dropdown open/close
- Hover effects on options
- Page content fades in when loaded

## 🧪 Testing the Feature

### Test Each Preset

1. **All Time:** Should see all data, no date filters
2. **Last Day:** Should see only today's data
3. **Last 3 Days:** Should see 3 days of data
4. **Last 30 Days:** Should see 30 days of data

### Test URL Sharing

1. Select "Last 3 Days"
2. Copy URL
3. Share with another user
4. They should see the same date filter applied

### Test Browser History

1. Select "Last Day"
2. Select "Last 30 Days"
3. Click browser back button
4. Should go back to "Last Day"

## 🛠 Common Tasks

### Add a New Preset

**File:** `src/components/dashboard/date-range-filter.tsx`

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

### Change Colors

**File:** Any component using `text-[#31aba3]`

Replace `#31aba3` with your brand color:

```tsx
// Before
<Check className="h-4 w-4 text-[#31aba3]" />

// After
<Check className="h-4 w-4 text-emerald-600" />
```

### Disable Date Filtering for Certain Tabs

**In:** `DischargesTab` component

The DischargesTab uses its own date navigation (`DayPaginationControls`). To integrate it with the global date presets, pass the date range through:

```tsx
export function DischargesTab({ startDate, endDate }: TabProps) {
  // Use startDate/endDate in your queries instead of manual date navigation
}
```

## 📊 Analytics & Metrics

### Affected Dashboard Data

✅ Case counts
✅ SOAP notes
✅ Discharge summaries
✅ Call statistics
✅ Weekly activity charts
✅ Recent activity timeline
✅ Case statistics

### Unaffected Components

- User profile
- Settings
- Authentication
- Discharge settings (independent query)

## 🐛 Troubleshooting

### Issue: Date filter not applying

**Solution:** Check that your tRPC procedure accepts `startDate` and `endDate` parameters

### Issue: URLs not updating

**Solution:** Verify `nuqs` is properly configured in your Next.js project

### Issue: Animations laggy

**Solution:** Check that animations use `transform` and `opacity` (not `width`/`height`)

### Issue: Mobile layout broken

**Solution:** Verify Tailwind responsive classes (sm:, lg:) are applied correctly

## 📚 Reference Files

| File                                                       | Purpose                                  |
| ---------------------------------------------------------- | ---------------------------------------- |
| `src/components/dashboard/dashboard-navigation.tsx`        | Main navigation with tabs + date presets |
| `src/components/dashboard/date-range-filter.tsx`           | Date range preset dropdown               |
| `src/components/dashboard/dashboard-content-with-tabs.tsx` | Container coordinating everything        |
| `src/server/api/routers/dashboard.ts`                      | Backend filtering logic                  |
| `DASHBOARD_NAVIGATION.md`                                  | Technical deep-dive                      |
| `COMPONENT_ARCHITECTURE.md`                                | Component hierarchy & flow               |
| `DASHBOARD_UI_IMPROVEMENTS.md`                             | Animation & styling details              |

## 🎯 Next Steps

1. **Test the feature** - Try all presets on each tab
2. **Share URLs** - Test that filtered views are shareable
3. **Check performance** - Monitor database query performance
4. **Get feedback** - See what users think of the UX
5. **Iterate** - Add more presets or refinements based on feedback

## ✨ Key Features

✅ **URL-Based State** - Filters persist across page reloads and are shareable
✅ **Preset-Based** - Quick selection, no date picker complexity
✅ **Responsive** - Works on all device sizes
✅ **Performant** - GPU-accelerated animations at 60fps
✅ **Accessible** - Keyboard navigable, screen reader compatible
✅ **Type-Safe** - Full TypeScript support
✅ **Documented** - Comprehensive inline comments and guides

## 📞 Support

For questions or issues:

1. Check COMPONENT_ARCHITECTURE.md for technical details
2. Review DASHBOARD_NAVIGATION.md for implementation guide
3. Look at DASHBOARD_UI_IMPROVEMENTS.md for styling/animation info
4. Reference IMPLEMENTATION_SUMMARY.md for overview of changes

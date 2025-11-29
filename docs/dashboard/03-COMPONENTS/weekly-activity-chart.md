# Weekly Activity Chart - Component Documentation

> **Component:** `WeeklyActivityChart`  
> **Location:** `src/components/dashboard/weekly-activity-chart.tsx`  
> **Used In:** Overview Tab  
> **Last Updated:** 2025-11-28

## 📊 Overview

Displays a weekly activity chart showing cases created and calls completed over the last 7 days. Uses Recharts AreaChart for visualization.

## 🎯 Purpose

Provides visual trend analysis of case creation and communication activity over time, helping users understand workload patterns and activity levels.

## 📐 Component Structure

### Props

```typescript
interface WeeklyActivityChartProps {
  data: Array<{
    date: string; // Date in YYYY-MM-DD format
    cases: number; // Number of cases created
    calls: number; // Number of calls completed
  }>;
}
```

### Data Format

**Input Data:**

```typescript
[
  { date: "2024-11-21", cases: 8, calls: 0 },
  { date: "2024-11-22", cases: 4, calls: 0 },
  { date: "2024-11-23", cases: 13, calls: 0 },
  { date: "2024-11-24", cases: 4, calls: 0 },
  { date: "2024-11-25", cases: 5, calls: 0 },
  { date: "2024-11-26", cases: 4, calls: 4 },
  { date: "2024-11-27", cases: 0, calls: 1 },
];
```

## 🎨 Visual Design

### Chart Layout

```
┌─────────────────────────────────────┐
│ Weekly Activity                      │
│ [Bar Chart Icon]                    │
├─────────────────────────────────────┤
│                                     │
│  16│                                │
│  12│     ▓▓▓                         │
│   8│  ▓▓▓▓▓▓▓▓▓▓▓                   │
│   4│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│   0│────────────────────────────────│
│     Nov 21 22 23 24 25 26 27        │
│                                     │
│ Cases (teal)  Calls (purple)        │
└─────────────────────────────────────┘
```

### Styling

**Container:**

- Card with gradient background
- Border: `border-teal-200/40`
- Shadow: `shadow-lg shadow-teal-500/5`
- Padding: `p-6`

**Chart:**

- Type: AreaChart (from Recharts)
- Height: 300px (to be reduced to 250px per redesign)
- Responsive width
- Smooth curves

**Data Series:**

- **Cases:** Teal color (`#31aba3`)
- **Calls:** Purple color (from chart config)

**Axes:**

- X-axis: Dates formatted as "Nov 21", "Nov 22", etc.
- Y-axis: Count (auto-scaled, typically 0-16)

**Legend:**

- Bottom of chart
- Color-coded squares
- Labels: "Cases", "Calls"

## 🔧 Implementation Details

### Chart Configuration

```typescript
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart";

const chartConfig = {
  cases: {
    label: "Cases",
    color: "hsl(var(--chart-1))",  // Teal
  },
  calls: {
    label: "Calls",
    color: "hsl(var(--chart-2))",  // Purple
  },
};

<ChartContainer config={chartConfig} className="h-[300px] w-full">
  <AreaChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis
      dataKey="date"
      tickFormatter={(value) => format(new Date(value), "MMM d")}
    />
    <YAxis />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Legend />
    <Area
      type="monotone"
      dataKey="cases"
      stroke={chartConfig.cases.color}
      fill={chartConfig.cases.color}
      fillOpacity={0.6}
    />
    <Area
      type="monotone"
      dataKey="calls"
      stroke={chartConfig.calls.color}
      fill={chartConfig.calls.color}
      fillOpacity={0.6}
    />
  </AreaChart>
</ChartContainer>
```

### Data Fetching

**Query:**

```typescript
const { data: weeklyData } = api.dashboard.getWeeklyActivity.useQuery({
  startDate,
  endDate,
});
```

**Backend Response:**

```typescript
Array<{
  date: string; // YYYY-MM-DD
  cases: number;
  calls: number;
}>;
```

## 📱 Responsive Behavior

### Desktop (> 1024px)

- Full width chart
- Height: 300px (250px after redesign)
- All labels visible
- Hover tooltips

### Tablet (640px - 1024px)

- Full width chart
- Height: 250px
- Condensed labels if needed

### Mobile (< 640px)

- Full width chart
- Height: 200px
- Simplified labels
- Touch-friendly tooltips

## 🎯 Future Enhancements

1. **Interactive Features:**
   - Click on bar to filter cases for that day
   - Hover for detailed breakdown
   - Zoom/pan for longer time ranges

2. **Additional Metrics:**
   - Emails sent
   - SOAP notes generated
   - Discharge summaries created

3. **Time Range Selection:**
   - Toggle between 7 days, 30 days, 90 days
   - Custom date range picker

4. **Chart Type Options:**
   - Toggle between area chart and bar chart
   - Line chart for trends

## 📝 Related Documentation

- **Overview Tab:** `../../02-TABS/overview-tab/redesign-plan.md`
- **Design System:** `../../01-GENERAL/design-system.md`
- **Component Implementation:** `src/components/dashboard/weekly-activity-chart.tsx`

---

**Last Updated:** 2025-11-28  
**Status:** Documented, redesign planned (height reduction)

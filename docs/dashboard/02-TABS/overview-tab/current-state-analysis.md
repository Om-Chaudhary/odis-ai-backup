# Overview Tab - Current State Analysis

> **Tab:** Overview (`/dashboard?tab=overview`)  
> **Last Updated:** 2025-11-28  
> **Purpose:** Comprehensive documentation of current Overview tab implementation

## 📊 Current Implementation Overview

The Overview tab provides high-level metrics, activity trends, and recent case information. It's the default landing page for the dashboard.

## 🎛️ Current Layout Structure

### Above the Fold

```
┌─────────────────────────────────────────┐
│ Header: Overview                         │
│ View your case statistics and recent     │
│ activity                                 │
│ [All Time ▼]                             │
├─────────────────────────────────────────┤
│ Row 1: Stat Cards (4 cards)              │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │Total│ │SOAP │ │Disch│ │Comm │        │
│ │Cases│ │Notes│ │arge │ │unic │        │
│ │ 289 │ │ 302 │ │ 177 │ │  5  │        │
│ └─────┘ └─────┘ └─────┘ └─────┘        │
├─────────────────────────────────────────┤
│ Row 2: Weekly Activity Chart             │
│ ┌─────────────────────────────────────┐ │
│ │ Weekly Activity (Bar Chart)         │ │
│ │ Nov 21-27, Cases & Calls            │ │
│ │ Height: ~300px                      │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Row 3: Case Sources + Recent Cases       │
│ ┌──────────────┐ ┌──────────────────┐ │
│ │ Case Sources │ │ Recent Cases      │ │
│ │ Manual: 289  │ │ [5 case items]   │ │
│ │ (100%)       │ │                   │ │
│ └──────────────┘ └──────────────────┘ │
└─────────────────────────────────────────┘
```

### Below the Fold

```
┌─────────────────────────────────────────┐
│ Activity Timeline                        │
│ ┌─────────────────────────────────────┐ │
│ │ Recent Activity (Always Expanded)   │ │
│ │ • Case created for Max              │ │
│ │   2 minutes ago                     │ │
│ │ • Discharge summary generated        │ │
│ │   15 minutes ago                     │ │
│ │ • SOAP note created                  │ │
│ │   1 hour ago                         │ │
│ │ ... (10-15 items total)              │ │
│ │ Height: ~400-500px                   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 📈 Stat Cards

### 1. Total Cases

**Component:** `StatCard`  
**Icon:** `FolderOpen`  
**Value:** Total number of cases (e.g., 289)  
**Subtitle:** "X this week" (e.g., "35 this week")  
**Trend:** Up arrow (green) if cases increased this week

**Data Source:**

```typescript
api.dashboard.getCaseStats.useQuery({ startDate, endDate });
// Returns: { total: number, thisWeek: number }
```

**Display:**

- Large number (text-3xl, bold)
- Trend icon (TrendingUp if thisWeek > 0)
- Subtitle with week count
- Icon on right side

### 2. SOAP Notes

**Component:** `StatCard`  
**Icon:** `FileText`  
**Value:** Total SOAP notes generated (e.g., 302)  
**Subtitle:** "Generated"  
**Trend:** None (static count)

**Data Source:**

```typescript
api.dashboard.getCaseStats.useQuery({ startDate, endDate });
// Returns: { soapNotes: number }
```

**Display:**

- Large number
- Static subtitle
- Icon on right side

### 3. Discharge Summaries

**Component:** `StatCard`  
**Icon:** `FileCheck`  
**Value:** Total discharge summaries created (e.g., 177)  
**Subtitle:** "Created"  
**Trend:** None (static count)

**Data Source:**

```typescript
api.dashboard.getCaseStats.useQuery({ startDate, endDate });
// Returns: { dischargeSummaries: number }
```

**Display:**

- Large number
- Static subtitle
- Icon on right side

### 4. Communications

**Component:** `StatCard`  
**Icon:** `Phone`  
**Value:** Total communications (calls + emails) (e.g., 5)  
**Subtitle:** "X calls, Y emails" (e.g., "5 calls, 0 emails")  
**Trend:** None (static count)

**Data Source:**

```typescript
api.dashboard.getCaseStats.useQuery({ startDate, endDate });
// Returns: { callsCompleted: number, emailsSent: number }
```

**Display:**

- Large number (sum of calls + emails)
- Subtitle with breakdown
- Icon on right side

## 📊 Weekly Activity Chart

**Component:** `WeeklyActivityChart`  
**Type:** Bar chart (Recharts AreaChart)  
**Height:** ~300px  
**Data Range:** Last 7 days (Nov 21-27 in example)

**Data Series:**

1. **Cases** (Teal bars)
   - Cases created per day
   - Primary metric
2. **Calls** (Purple bars)
   - Calls completed per day
   - Secondary metric

**Chart Features:**

- X-axis: Dates (formatted as "Nov 21", "Nov 22", etc.)
- Y-axis: Count (0-16 in example, auto-scaled)
- Legend: "Cases" (teal), "Calls" (purple)
- Tooltip: Shows exact values on hover

**Data Source:**

```typescript
api.dashboard.getWeeklyActivity.useQuery({ startDate, endDate });
// Returns: Array of { date: string, cases: number, calls: number }
```

**Visual Design:**

- Card container with gradient background
- Chart title: "Weekly Activity"
- Bar chart icon in header
- Responsive width

## 📋 Case Sources Card

**Component:** `SourceBreakdownCard`  
**Purpose:** Shows breakdown of cases by source

**Current Display:**

- Title: "Case Sources"
- Single entry: "Manual" with progress bar
- Shows count and percentage (e.g., "289 (100%)")

**Data Source:**

```typescript
api.dashboard.getCaseStats.useQuery({ startDate, endDate });
// Returns: { bySource: Record<string, number> }
```

**Source Types:**

- `manual` - Manually created cases
- `idexx_neo` - IDEXX Neo imports
- `cornerstone` - Cornerstone PMS imports
- `ezyvet` - ezyVet imports
- `avimark` - AVImark imports

**Visual Design:**

- Progress bars for each source
- Color-coded by source type:
  - Manual: Slate
  - IDEXX Neo: Blue
  - Cornerstone: Purple
  - ezyVet: Green
  - AVImark: Orange
- Shows count and percentage

**Issues:**

- ⚠️ Not actionable - mostly shows manual entries
- ⚠️ Low value - doesn't drive decisions
- ⚠️ Will be replaced with "Cases Needing Attention" card

## 📝 Recent Cases List

**Component:** `RecentCasesList`  
**Purpose:** Shows 5 most recent cases

**Display:**

- Title: "Recent Cases"
- "View All" link (navigates to Cases tab)
- List of 5 case items

**Case Item Display:**

- Patient name (e.g., "Rocky", "Desmond")
- Owner name (e.g., "Unknown", "Taylor Allen")
- Status badge (e.g., "draft")
- Relative timestamp (e.g., "2 days ago")
- Clickable link to case detail page

**Data Source:**

```typescript
api.dashboard.getAllCases.useQuery({
  page: 1,
  pageSize: 5,
  startDate,
  endDate,
});
// Returns: { cases: Case[], pagination: {...} }
```

**Visual Design:**

- Card container
- List items with hover states
- Status badges
- Links to case detail pages

## ⏱️ Activity Timeline

**Component:** `ActivityTimeline`  
**Location:** Below the fold (requires scrolling)  
**Height:** ~400-500px (always expanded)  
**Purpose:** Shows recent activity across all cases

**Display:**

- Title: "Recent Activity"
- Activity icon in header
- Timeline of activity items (10-15 items)
- Always expanded (no collapse option)

**Activity Item Types:**

- Case created
- SOAP note created
- Discharge summary generated
- Call scheduled/completed
- Email sent
- Status changed

**Activity Item Display:**

- Icon based on activity type
- Description text
- Relative timestamp (e.g., "2 minutes ago")
- Timeline line connecting items
- Link to related case (if applicable)

**Data Source:**

```typescript
api.dashboard.getRecentActivity.useQuery({ startDate, endDate });
// Returns: ActivityItem[]
```

**Issues:**

- ⚠️ Always expanded - takes too much space
- ⚠️ Below the fold - not immediately visible
- ⚠️ Should be collapsible (show 3-5 items by default)

## 🎛️ Date Filter

**Location:** Top right, above stat cards  
**Component:** Dropdown button  
**Current State:** "All Time" button with calendar icon

**Options:**

- All Time (default)
- Additional options in dropdown (not visible in current implementation)

**Implementation:**

- Uses `nuqs` for URL state
- Query parameters: `startDate`, `endDate`
- Affects all data queries on the tab

**Future Enhancement:**

- Replace with button group: `[All Time] [Day] [3D] [30D]`
- See: `../../03-COMPONENTS/date-filter-button-group.md`

## 🔄 Data Fetching

### Queries Used

1. **`api.dashboard.getCaseStats`**
   - Returns: Total cases, SOAP notes, discharge summaries, communications, bySource
   - Used for: Stat cards, Case Sources card

2. **`api.dashboard.getWeeklyActivity`**
   - Returns: Daily activity data for last 7 days
   - Used for: Weekly Activity Chart

3. **`api.dashboard.getRecentActivity`**
   - Returns: Recent activity items
   - Used for: Activity Timeline

4. **`api.dashboard.getAllCases`**
   - Returns: Recent cases (first 5)
   - Used for: Recent Cases List

### Loading States

- All queries use React Query
- Skeleton loading component: `OverviewTabSkeleton`
- Shows loading placeholders for all sections

## 📱 Responsive Behavior

### Mobile (< 640px)

- Stat cards: 1 column (stacked)
- Weekly chart: Full width, reduced height
- Case Sources + Recent Cases: Stacked vertically
- Activity Timeline: Full width

### Tablet (640px - 1024px)

- Stat cards: 2 columns
- Weekly chart: Full width
- Case Sources + Recent Cases: 2 columns
- Activity Timeline: Full width

### Desktop (> 1024px)

- Stat cards: 4 columns
- Weekly chart: Full width
- Case Sources + Recent Cases: 2 columns side-by-side
- Activity Timeline: Full width

## 🎨 Visual Design

### Stat Cards

- Gradient background: `from-white/70 via-teal-50/20 to-white/70`
- Border: `border-teal-200/40`
- Shadow: `shadow-lg shadow-teal-500/5`
- Hover: Enhanced shadow and gradient
- Icon: Circular background with teal tint

### Weekly Activity Chart

- Card container with gradient
- Chart uses Recharts library
- Teal for cases, purple for calls
- Responsive width

### Case Sources Card

- Same card styling as stat cards
- Progress bars with source-specific colors
- Percentage display

### Recent Cases List

- Same card styling
- List items with hover states
- Status badges
- Clickable links

### Activity Timeline

- Same card styling
- Timeline line connecting items
- Icons for each activity type
- Relative timestamps

## ⚠️ Current Issues

1. **Case Sources Card** - Low value, not actionable
2. **Activity Timeline** - Always expanded, takes too much space
3. **Stat Cards** - Lack context (no trends, no actionable info)
4. **No Priority Indicators** - Can't see what needs attention
5. **Requires Scrolling** - Initial view doesn't show actionable info
6. **Date Filter** - Uses dropdown instead of button group

## ✅ Current Features Summary

### Implemented ✅

- [x] 4 stat cards with key metrics
- [x] Weekly activity chart
- [x] Case sources breakdown
- [x] Recent cases list (5 items)
- [x] Activity timeline (always expanded)
- [x] Date filter (dropdown)
- [x] Responsive layout
- [x] Loading states
- [x] Empty states

### Planned Enhancements 🔄

- [ ] Replace Case Sources with "Cases Needing Attention" card
- [ ] Make Activity Timeline collapsible
- [ ] Add trends to stat cards
- [ ] Add actionable context to stat cards
- [ ] Replace date filter dropdown with button group
- [ ] Add completion rate metrics
- [ ] Add cases needing discharge/SOAP counts

## 📝 Related Documentation

- **Redesign Plan:** `redesign-plan.md`
- **Component Implementation:** `src/components/dashboard/overview-tab.tsx`
- **Stat Card Component:** `src/components/dashboard/overview-tab.tsx` (StatCard function)
- **Weekly Chart:** `src/components/dashboard/weekly-activity-chart.tsx`
- **Activity Timeline:** `src/components/dashboard/activity-timeline.tsx`
- **Date Filter Component:** `../../03-COMPONENTS/date-filter-button-group.md`

---

**Last Updated:** 2025-11-28  
**Status:** Current implementation documented, redesign in progress

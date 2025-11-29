# Overview Tab - Complete Redesign Plan

> **Tab:** Overview (`/dashboard?tab=overview`)  
> **Purpose:** High-level metrics, actionable insights, and recent activity  
> **Priority:** Highest - First thing users see  
> **Status:** In Progress  
> **Last Updated:** 2025-11-28

## 🎯 Redesign Goals

1. **Prioritize Actionable Metrics** - Show what needs attention first
2. **Condense Activity Timeline** - Make it expandable, not always full-height
3. **Add Cases Needing Attention** - Replace low-value "Case Sources" card
4. **Enhance Stat Cards** - Add context, trends, and actionable information
5. **Optimize Visual Hierarchy** - Most important info above the fold
6. **Replace Date Filter** - Use button group instead of dropdown
7. **Improve Information Density** - Show more actionable data without clutter

## 📊 Current State Analysis

**See:** `current-state-analysis.md` for comprehensive documentation

### Current Layout

```
┌─────────────────────────────────────────┐
│ Header + Description                     │
│ [All Time ▼]                             │
├─────────────────────────────────────────┤
│ 4 Stat Cards (Grid)                      │
│ - Total Cases (289, +35 this week)     │
│ - SOAP Notes (302, Generated)            │
│ - Discharge Summaries (177, Created)    │
│ - Communications (5, 5 calls, 0 emails) │
├─────────────────────────────────────────┤
│ Weekly Activity Chart (Full Height)      │
│ (~300px height)                          │
├─────────────────────────────────────────┤
│ Case Sources + Recent Cases (2 cols)     │
│ - Case Sources: Manual (289, 100%)      │
│ - Recent Cases List (5 items)            │
├─────────────────────────────────────────┤
│ Activity Timeline (Always Expanded)      │
│ (~400-500px height)                      │
└─────────────────────────────────────────┘
```

### Issues Identified

1. ❌ **Case Sources** - Mostly manual entries, not actionable
2. ❌ **Activity Timeline** - Always expanded, takes too much space (~400-500px)
3. ❌ **Stat Cards** - Lack context (no trends, no actionable info)
4. ❌ **No Priority Indicators** - Can't see what needs attention
5. ❌ **Requires Scrolling** - Initial view doesn't show actionable info
6. ❌ **Date Filter** - Uses dropdown instead of button group
7. ❌ **No Completion Metrics** - Can't see completion rates or gaps

## 🎨 Redesigned Layout

### Above the Fold (Priority 1)

```
┌─────────────────────────────────────────┐
│ Header: Overview                         │
│ View your case statistics and recent     │
│ activity                                 │
│                                          │
│ Date Filter: [All Time] [Day] [3D] [30D]│
│ (Button group, prominent position)       │
├─────────────────────────────────────────┤
│ Row 1: Key Performance Indicators        │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───┐│
│ │ Total   │ │ Missing │ │ SOAP    │ │Com││
│ │ Cases   │ │Discharge│ │Coverage │ │mun││
│ │ 1,234 ↑ │ │ 183 ⚠️  │ │ 85% ✓   │ │245││
│ │+17/wk   │ │735 total│ │410 need │ │   ││
│ └─────────┘ └─────────┘ └─────────┘ └───┘│
├─────────────────────────────────────────┤
│ Row 2: Action Items                      │
│ ┌───────────────────────┐ ┌───────────┐ │
│ │ Cases Needing         │ │ Recent    │ │
│ │ Attention             │ │ Cases     │ │
│ │                       │ │           │ │
│ │ Discharge: 183 (week) │ │ [5 cases] │ │
│ │ SOAP: 187 (week)      │ │           │ │
│ │                       │ │           │ │
│ │ [View Missing] [Fix]  │ │ [View All]│ │
│ └───────────────────────┘ └───────────┘ │
├─────────────────────────────────────────┤
│ Row 3: Trends (Condensed)                │
│ ┌─────────────────────────────────────┐ │
│ │ Weekly Activity Chart               │ │
│ │ (Reduced height: ~250px)            │ │
│ │ Nov 21-27, Cases & Calls            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Key Changes:**

- Date filter moved to prominent position below header
- Stat cards enhanced with trends and actionable context
- New "Cases Needing Attention" card replaces "Case Sources"
- Weekly chart height reduced from 300px to 250px
- All actionable information visible without scrolling

### Below the Fold (Priority 2)

```
┌─────────────────────────────────────────┐
│ Recent Activity Timeline                 │
│ ┌─────────────────────────────────────┐ │
│ │ [Collapsed - Shows 3-5 items]       │ │
│ │ • Case created for Max              │ │
│ │   2 minutes ago                      │ │
│ │ • Discharge summary generated        │ │
│ │   15 minutes ago                     │ │
│ │ • SOAP note created                  │ │
│ │   1 hour ago                         │ │
│ │                                     │ │
│ │ [Show More ▼] (5 more items)        │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Key Changes:**

- Collapsed by default (shows 3-5 items)
- Expandable to show all items
- Saves significant vertical space (~300-400px)

## 🧩 Component Changes

### 1. Enhanced Stat Cards

**Current:** Simple count + subtitle  
**New:** Count + trend + actionable context

#### Total Cases Card (ENHANCED)

**Current Display:**

```
┌─────────────────────┐
│ Total Cases         │
│ 289                 │
│ 35 this week        │
│ [Folder Icon]       │
└─────────────────────┘
```

**New Display:**

```
┌─────────────────────┐
│ Total Cases         │
│ 289 ↑              │
│ +35 this week       │
│                     │
│ [Folder Icon]       │
└─────────────────────┘
```

**Implementation:**

```typescript
<StatCard
  title="Total Cases"
  value={stats?.total ?? 0}
  subtitle={
    <span>
      {stats?.thisWeek ? (
        <>
          <TrendingUp className="inline h-3 w-3 text-emerald-600" />
          <span className="ml-1">+{stats.thisWeek} this week</span>
        </>
      ) : (
        "No change this week"
      )}
    </span>
  }
  icon={FolderOpen}
  trend={stats?.thisWeek ? "up" : "stable"}
/>
```

**Features:**

- Trend indicator (↑ green if increasing, ↓ red if decreasing, - if stable)
- Week-over-week comparison
- Color-coded trend icon

#### Missing Discharges Card (NEW)

**Replaces:** One of the existing stat cards (or adds as 5th card)

**Display:**

```
┌─────────────────────┐
│ Missing Discharges  │
│ 183 ⚠️             │
│ 735 total           │
│                     │
│ [Alert Icon]        │
└─────────────────────┘
```

**Implementation:**

```typescript
<StatCard
  title="Missing Discharges"
  value={stats?.casesNeedingDischarge?.thisWeek ?? 0}
  subtitle={
    <span>
      {stats?.casesNeedingDischarge?.total ?? 0} total
    </span>
  }
  icon={AlertCircle}
  variant="warning"  // Amber/warning styling
  onClick={() => {
    // Navigate to Cases tab with filter: missingDischarge=true
    router.push("/dashboard?tab=cases&missingDischarge=true");
  }}
/>
```

**Features:**

- Warning/amber styling to indicate attention needed
- Clickable - navigates to Cases tab with filter applied
- Shows both "this week" and "total" counts

#### SOAP Coverage Card (ENHANCED)

**Current Display:**

```
┌─────────────────────┐
│ SOAP Notes          │
│ 302                 │
│ Generated           │
│ [File Icon]         │
└─────────────────────┘
```

**New Display:**

```
┌─────────────────────┐
│ SOAP Coverage       │
│ 85% ✓              │
│ 410 cases need SOAP │
│                     │
│ [File Icon]         │
└─────────────────────┘
```

**Implementation:**

```typescript
<StatCard
  title="SOAP Coverage"
  value={`${stats?.soapCoverage?.percentage ?? 0}%`}
  subtitle={
    <span>
      {stats?.casesNeedingSoap?.total ?? 0} cases need SOAP
    </span>
  }
  icon={FileText}
  variant={stats?.soapCoverage?.percentage >= 80 ? "success" : "warning"}
  onClick={() => {
    router.push("/dashboard?tab=cases&missingSoap=true");
  }}
/>
```

**Features:**

- Percentage-based metric (more actionable than raw count)
- Shows gap (cases needing SOAP)
- Color-coded: Green if ≥80%, Amber if <80%
- Clickable - navigates to Cases tab with filter

#### Communications Card (ENHANCED)

**Current Display:**

```
┌─────────────────────┐
│ Communications      │
│ 5                   │
│ 5 calls, 0 emails   │
│ [Phone Icon]        │
└─────────────────────┘
```

**New Display:**

```
┌─────────────────────┐
│ Communications      │
│ 245                 │
│ 180 calls, 65 emails│
│                     │
│ [Phone Icon]        │
└─────────────────────┘
```

**Implementation:**

```typescript
<StatCard
  title="Communications"
  value={(stats?.callsCompleted ?? 0) + (stats?.emailsSent ?? 0)}
  subtitle={
    <span>
      <NumberTicker value={stats?.callsCompleted ?? 0} delay={1400} /> calls,{" "}
      <NumberTicker value={stats?.emailsSent ?? 0} delay={1400} /> emails
    </span>
  }
  icon={Phone}
/>
```

**Features:**

- Breakdown of calls vs emails
- Animated number ticker for visual appeal
- Clear communication metrics

### 2. Cases Needing Attention Card (NEW)

**Replaces:** Case Sources Breakdown card

**Component:** `CasesNeedingAttentionCard`

**Display:**

```
┌─────────────────────────────────────┐
│ Cases Needing Attention             │
│ ⚠️ Priority Action Items            │
├─────────────────────────────────────┤
│                                     │
│ Discharge Summaries                 │
│ ┌───────────────────────────────┐  │
│ │ 183 this week                 │  │
│ │ 735 total                     │  │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░ 65%   │  │
│ └───────────────────────────────┘  │
│                                     │
│ SOAP Notes                          │
│ ┌───────────────────────────────┐  │
│ │ 187 this week                 │  │
│ │ 410 total                     │  │
│ │ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░ 36%  │  │
│ └───────────────────────────────┘  │
│                                     │
│ [View Cases Missing Discharges]     │
│ [View Cases Missing SOAP]           │
└─────────────────────────────────────┘
```

**Implementation:**

```typescript
// src/components/dashboard/cases-needing-attention-card.tsx
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
  totalCases: number;
  onViewDischarges?: () => void;
  onViewSoap?: () => void;
}

export function CasesNeedingAttentionCard({
  casesNeedingDischarge,
  casesNeedingSoap,
  totalCases,
  onViewDischarges,
  onViewSoap,
}: CasesNeedingAttentionCardProps) {
  const dischargePercentage = totalCases > 0
    ? Math.round((casesNeedingDischarge.total / totalCases) * 100)
    : 0;

  const soapPercentage = totalCases > 0
    ? Math.round((casesNeedingSoap.total / totalCases) * 100)
    : 0;

  return (
    <Card className="border-amber-200/40 bg-gradient-to-br from-amber-50/20 via-white/70 to-white/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Cases Needing Attention
        </CardTitle>
        <CardDescription>Priority action items requiring attention</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Discharge Summaries Section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-medium text-slate-900">Discharge Summaries</h4>
            <Badge variant="outline" className="border-amber-500 text-amber-700">
              {casesNeedingDischarge.thisWeek} this week
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">
                {casesNeedingDischarge.total}
              </span>
              <span className="text-sm text-slate-600">total</span>
            </div>
            <Progress value={dischargePercentage} className="h-2" />
            <p className="text-xs text-slate-500">
              {dischargePercentage}% of cases missing discharge summaries
            </p>
          </div>
        </div>

        {/* SOAP Notes Section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-medium text-slate-900">SOAP Notes</h4>
            <Badge variant="outline" className="border-amber-500 text-amber-700">
              {casesNeedingSoap.thisWeek} this week
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">
                {casesNeedingSoap.total}
              </span>
              <span className="text-sm text-slate-600">total</span>
            </div>
            <Progress value={soapPercentage} className="h-2" />
            <p className="text-xs text-slate-500">
              {soapPercentage}% of cases missing SOAP notes
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50"
            onClick={onViewDischarges}
          >
            View Cases Missing Discharges
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50"
            onClick={onViewSoap}
          >
            View Cases Missing SOAP
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Features:**

- Highlighted numbers (amber badges for urgency)
- Time-based breakdown (this week / total)
- Progress bars showing percentage incomplete
- Quick action buttons
- Visual priority (amber border and background tint)
- Clickable buttons navigate to Cases tab with filters

**Action Button Behavior:**

```typescript
const handleViewDischarges = () => {
  router.push("/dashboard?tab=cases&missingDischarge=true");
};

const handleViewSoap = () => {
  router.push("/dashboard?tab=cases&missingSoap=true");
};
```

### 3. Condensed Activity Timeline

**Current:** Always expanded, ~400-500px  
**New:** Collapsed by default, expandable

**Implementation:**

```typescript
// src/components/dashboard/activity-timeline.tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

const INITIAL_ITEMS_TO_SHOW = 5;

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const itemsToShow = isExpanded
    ? activities
    : activities.slice(0, INITIAL_ITEMS_TO_SHOW);

  const hasMore = activities.length > INITIAL_ITEMS_TO_SHOW;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-slate-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {itemsToShow.map((activity, index) => (
            <ActivityItemComponent
              key={activity.id}
              activity={activity}
              isLast={index === itemsToShow.length - 1 && !hasMore}
            />
          ))}
        </div>

        {hasMore && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="mt-4 w-full"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Show More ({activities.length - INITIAL_ITEMS_TO_SHOW} more items)
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-0">
                {activities.slice(INITIAL_ITEMS_TO_SHOW).map((activity, index) => (
                  <ActivityItemComponent
                    key={activity.id}
                    activity={activity}
                    isLast={index === activities.slice(INITIAL_ITEMS_TO_SHOW).length - 1}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
```

**Features:**

- Shows 5 items by default
- "Show More" button to expand
- "Show Less" button to collapse
- Smooth animation using Collapsible component
- Saves ~300-400px of vertical space

### 4. Enhanced Weekly Activity Chart

**Changes:**

- Reduce height from 300px to 250px
- Keep all functionality
- Optimize for above-the-fold placement

**Implementation:**

```typescript
// src/components/dashboard/weekly-activity-chart.tsx
<Card>
  <CardHeader>
    <CardTitle>Weekly Activity</CardTitle>
  </CardHeader>
  <CardContent>
    <ChartContainer
      config={chartConfig}
      className="h-[250px] w-full"  // Reduced from h-[300px]
    >
      <AreaChart data={data}>
        {/* Chart configuration */}
      </AreaChart>
    </ChartContainer>
  </CardContent>
</Card>
```

### 5. Date Filter Integration

**Replace:** Dropdown button  
**With:** Button group

**Implementation:**

```typescript
import { DateFilterButtonGroup } from "~/components/dashboard/date-filter-button-group";

// In overview-tab.tsx
<DateFilterButtonGroup
  value={dateRange}
  onChange={(range) => {
    setStartDate(range?.startDate);
    setEndDate(range?.endDate);
  }}
/>
```

**See:** `../../03-COMPONENTS/date-filter-button-group.md` for component specification

## 📋 Backend Changes Required

### Enhanced `getCaseStats` Query

**File:** `src/server/api/routers/dashboard.ts`

**Current Return Type:**

```typescript
{
  total: number;
  thisWeek: number;
  soapNotes: number;
  dischargeSummaries: number;
  callsCompleted: number;
  emailsSent: number;
  bySource: Record<string, number>;
}
```

**New Return Type:**

```typescript
{
  // Existing fields
  total: number;
  thisWeek: number;
  soapNotes: number;
  dischargeSummaries: number;
  callsCompleted: number;
  emailsSent: number;
  bySource: Record<string, number>;

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
  soapCoverage: {
    percentage: number;
    totalCases: number;
    casesWithSoap: number;
    casesNeedingSoap: number;
  }
  dischargeCoverage: {
    percentage: number;
    totalCases: number;
    casesWithDischarge: number;
    casesNeedingDischarge: number;
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

**Query Implementation:**

```typescript
getCaseStats: protectedProcedure
  .input(
    z.object({
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const startDate = input.startDate ? new Date(input.startDate) : undefined;
    const endDate = input.endDate ? new Date(input.endDate) : undefined;

    // ... existing queries ...

    // Get cases needing discharge summaries
    let casesNeedingDischargeQuery = ctx.supabase
      .from("cases")
      .select("id, created_at", { count: "exact" })
      .eq("user_id", userId)
      .is("discharge_summaries.id", null);  // Cases without discharge summaries

    if (startDate) {
      casesNeedingDischargeQuery = casesNeedingDischargeQuery.gte(
        "created_at",
        startDate.toISOString(),
      );
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      casesNeedingDischargeQuery = casesNeedingDischargeQuery.lte(
        "created_at",
        end.toISOString(),
      );
    }

    const { count: totalNeedingDischarge } = await casesNeedingDischargeQuery;

    // Get cases needing discharge this week
    const weekStart = startOfWeek(new Date());
    const { count: thisWeekNeedingDischarge } = await ctx.supabase
      .from("cases")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .is("discharge_summaries.id", null)
      .gte("created_at", weekStart.toISOString());

    // Get cases needing SOAP notes
    let casesNeedingSoapQuery = ctx.supabase
      .from("cases")
      .select("id, created_at", { count: "exact" })
      .eq("user_id", userId)
      .is("soap_notes.id", null);  // Cases without SOAP notes

    if (startDate) {
      casesNeedingSoapQuery = casesNeedingSoapQuery.gte(
        "created_at",
        startDate.toISOString(),
      );
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      casesNeedingSoapQuery = casesNeedingSoapQuery.lte(
        "created_at",
        end.toISOString(),
      );
    }

    const { count: totalNeedingSoap } = await casesNeedingSoapQuery;

    // Get cases needing SOAP this week
    const { count: thisWeekNeedingSoap } = await ctx.supabase
      .from("cases")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .is("soap_notes.id", null)
      .gte("created_at", weekStart.toISOString());

    // Calculate SOAP coverage
    const totalCases = total ?? 0;
    const casesWithSoap = totalCases - (totalNeedingSoap ?? 0);
    const soapCoveragePercentage =
      totalCases > 0 ? Math.round((casesWithSoap / totalCases) * 100) : 0;

    // Calculate discharge coverage
    const casesWithDischarge = totalCases - (totalNeedingDischarge ?? 0);
    const dischargeCoveragePercentage =
      totalCases > 0
        ? Math.round((casesWithDischarge / totalCases) * 100)
        : 0;

    // Calculate completion rate
    const completedCases = cases?.filter((c) => c.status === "completed").length ?? 0;
    const completionRateOverall =
      totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;

    return {
      // ... existing fields ...
      casesNeedingDischarge: {
        total: totalNeedingDischarge ?? 0,
        thisWeek: thisWeekNeedingDischarge ?? 0,
        thisMonth: 0, // Calculate if needed
      },
      casesNeedingSoap: {
        total: totalNeedingSoap ?? 0,
        thisWeek: thisWeekNeedingSoap ?? 0,
        thisMonth: 0, // Calculate if needed
      },
      soapCoverage: {
        percentage: soapCoveragePercentage,
        totalCases,
        casesWithSoap,
        casesNeedingSoap: totalNeedingSoap ?? 0,
      },
      dischargeCoverage: {
        percentage: dischargeCoveragePercentage,
        totalCases,
        casesWithDischarge,
        casesNeedingDischarge: totalNeedingDischarge ?? 0,
      },
      completionRate: {
        overall: {
          completed: completedCases,
          total: totalCases,
          percentage: completionRateOverall,
        },
        // Calculate thisWeek and thisMonth if needed
      },
    };
  }),
```

## 🔧 Files to Modify

### Components

1. **`src/components/dashboard/overview-tab.tsx`** (MAJOR UPDATE)
   - Remove `SourceBreakdownCard` component
   - Add `CasesNeedingAttentionCard` component
   - Enhance existing `StatCard` components with trends
   - Add new stat cards (Missing Discharges, SOAP Coverage)
   - Reorganize layout order
   - Integrate `DateFilterButtonGroup`
   - Update data fetching to use new stats fields

2. **`src/components/dashboard/activity-timeline.tsx`** (REFACTOR)
   - Add `Collapsible` wrapper
   - Add collapsed/expanded states
   - Show 5 items by default
   - Add "Show More" / "Show Less" button
   - Smooth animation

3. **`src/components/dashboard/cases-needing-attention-card.tsx`** (NEW)
   - Display cases needing discharge summaries
   - Display cases needing SOAP notes
   - Progress bars for visual indication
   - Action buttons for filtering
   - Amber/warning styling

4. **`src/components/dashboard/stat-card.tsx`** (ENHANCE or create if doesn't exist)
   - Add trend indicators (↑↓)
   - Add actionable context
   - Add variant prop (default, warning, success)
   - Add onClick handler for clickable cards
   - Improve subtitle formatting

5. **`src/components/dashboard/weekly-activity-chart.tsx`** (MINOR UPDATE)
   - Reduce height from 300px to 250px
   - Ensure responsive behavior maintained

### Backend

6. **`src/server/api/routers/dashboard.ts`**
   - Enhance `getCaseStats` query
   - Add cases needing discharge calculation
   - Add cases needing SOAP calculation
   - Add coverage percentage calculations
   - Add completion rate calculations
   - Update return types

### Types

7. **`src/types/dashboard.ts`**
   - Add `CasesNeedingAttention` type
   - Add `CoverageMetrics` type
   - Add `CompletionRate` type
   - Update `DashboardStats` type

## ✅ Acceptance Criteria

### Phase 1: Stat Cards Enhancement ✅

- [ ] Total Cases card shows trend indicator
- [ ] Missing Discharges card added (or replaces one existing)
- [ ] SOAP Coverage card shows percentage and gap
- [ ] Communications card shows breakdown
- [ ] All stat cards have consistent styling
- [ ] Clickable cards navigate to appropriate filters

### Phase 2: Cases Needing Attention Card ✅

- [ ] Card replaces Case Sources card
- [ ] Shows discharge summaries needing attention
- [ ] Shows SOAP notes needing attention
- [ ] Progress bars display percentage incomplete
- [ ] Action buttons navigate to Cases tab with filters
- [ ] Amber/warning styling for visual priority

### Phase 3: Activity Timeline Condensation ✅

- [ ] Timeline collapsed by default (shows 5 items)
- [ ] "Show More" button expands to show all
- [ ] "Show Less" button collapses back
- [ ] Smooth animation on expand/collapse
- [ ] Saves significant vertical space

### Phase 4: Chart Optimization ✅

- [ ] Weekly chart height reduced to 250px
- [ ] All functionality maintained
- [ ] Responsive behavior maintained

### Phase 5: Date Filter Integration ✅

- [ ] Date filter uses button group (not dropdown)
- [ ] Positioned prominently below header
- [ ] Consistent with other tabs

### General Requirements ✅

- [ ] Initial view shows actionable information without scrolling
- [ ] All components follow design system
- [ ] Smooth animations and transitions
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] Error states handled gracefully
- [ ] Keyboard navigation supported
- [ ] Screen reader accessible

## 📐 Visual Priority

**Tier 1 (Always Visible - Above the Fold):**

1. Header with title and description
2. Date filter button group
3. 4 Enhanced KPI Cards (with trends and context)
4. Cases Needing Attention Card
5. Recent Cases List
6. Weekly Activity Chart (condensed to 250px)

**Tier 2 (Scrollable - Below the Fold):**

7. Activity Timeline (collapsed by default, shows 5 items)

## 🎨 Design Specifications

### Stat Cards

**Enhanced Card Structure:**

```typescript
<Card className="transition-smooth hover:shadow-lg">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-3xl font-bold">{value}</p>
          {trend && <TrendIcon className="h-4 w-4" />}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
      <Icon className="h-12 w-12 text-[#31aba3]" />
    </div>
  </CardContent>
</Card>
```

**Variant Styling:**

- Default: Standard teal accent
- Warning: Amber border and background tint
- Success: Green accent for positive metrics

### Cases Needing Attention Card

**Container:**

```css
border-amber-200/40
bg-gradient-to-br from-amber-50/20 via-white/70 to-white/70
```

**Progress Bars:**

- Height: `h-2` (8px)
- Color: Amber (`bg-amber-500`)
- Shows percentage incomplete

**Action Buttons:**

- Outline variant with amber border
- Full width in mobile, side-by-side on desktop
- Hover: Amber background tint

### Activity Timeline

**Collapsed State:**

- Shows first 5 items
- "Show More" button at bottom
- Height: ~200-250px

**Expanded State:**

- Shows all items
- "Show Less" button at bottom
- Height: ~400-500px (depending on item count)

**Animation:**

- Smooth expand/collapse using Collapsible component
- Duration: 200ms ease

## 🔄 State Management

### URL Query Parameters

```typescript
// Date filter
startDate?: string;  // YYYY-MM-DD
endDate?: string;    // YYYY-MM-DD
dateRange?: string;  // "all" | "1d" | "3d" | "30d"
```

### Local State

```typescript
const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
```

## 📱 Responsive Behavior

### Mobile (< 640px)

- Stat cards: 1 column (stacked)
- Cases Needing Attention: Full width
- Recent Cases: Full width
- Weekly chart: Full width, reduced height
- Activity Timeline: Full width, collapsed by default

### Tablet (640px - 1024px)

- Stat cards: 2 columns
- Cases Needing Attention + Recent Cases: 2 columns
- Weekly chart: Full width
- Activity Timeline: Full width

### Desktop (> 1024px)

- Stat cards: 4 columns
- Cases Needing Attention + Recent Cases: 2 columns side-by-side
- Weekly chart: Full width
- Activity Timeline: Full width

## 🚀 Performance Optimizations

1. **Memoized Calculations** - Use `useMemo` for coverage percentages
2. **Optimistic Updates** - Update UI immediately when filters change
3. **Lazy Loading** - Load activity timeline items on expand (future)
4. **Debounced Date Filter** - Prevent excessive queries on rapid changes

## 📝 Related Documentation

- **Current State Analysis:** `current-state-analysis.md`
- **Cases Needing Attention Card Spec:** `../../03-COMPONENTS/cases-needing-attention-card.md`
- **Date Filter Component:** `../../03-COMPONENTS/date-filter-button-group.md`
- **Design System:** `../../01-GENERAL/design-system.md`
- **Component Implementation:** `src/components/dashboard/overview-tab.tsx`

---

**Next Steps:**

1. Implement backend queries for cases needing discharge/SOAP
2. Create Cases Needing Attention card component
3. Enhance stat cards with trends
4. Refactor Activity Timeline to be collapsible
5. Integrate date filter button group
6. Test responsive behavior

**Status:** Planning complete, ready for implementation

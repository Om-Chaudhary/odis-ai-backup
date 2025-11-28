# Overview Tab - Complete Redesign Plan

> **Tab:** Overview (`/dashboard?tab=overview`)  
> **Purpose:** High-level metrics, actionable insights, and recent activity  
> **Priority:** Highest - First thing users see

## 🎯 Redesign Goals

1. **Prioritize Actionable Metrics** - Show what needs attention first
2. **Condense Activity Timeline** - Make it expandable, not always full-height
3. **Add Cases Needing Attention** - Replace low-value "Case Sources" card
4. **Enhance Stat Cards** - Add context and trends
5. **Optimize Visual Hierarchy** - Most important info above the fold

## 📊 Current State Analysis

### Current Layout

```
┌─────────────────────────────────────────┐
│ Header + Description                     │
├─────────────────────────────────────────┤
│ 4 Stat Cards (Grid)                      │
│ - Total Cases                            │
│ - SOAP Notes                             │
│ - Discharge Summaries                    │
│ - Communications                         │
├─────────────────────────────────────────┤
│ Weekly Activity Chart (Full Height)      │
│ (~300px height)                          │
├─────────────────────────────────────────┤
│ Case Sources + Recent Cases (2 cols)     │
│ - Case Sources Breakdown                 │
│ - Recent Cases List (5 items)            │
├─────────────────────────────────────────┤
│ Activity Timeline (Always Expanded)      │
│ (~400-500px height)                      │
└─────────────────────────────────────────┘
```

### Issues Identified

1. ❌ **Case Sources** - Mostly manual entries, not actionable
2. ❌ **Activity Timeline** - Always expanded, takes too much space
3. ❌ **Stat Cards** - Lack context (no trends, no actionable info)
4. ❌ **No Priority Indicators** - Can't see what needs attention
5. ❌ **Requires Scrolling** - Initial view doesn't show actionable info

## 🎨 Redesigned Layout

### Above the Fold (Priority 1)

```
┌─────────────────────────────────────────┐
│ Header: Overview                         │
│ Date Filter: [All Time] [Day] [3D] [30D]│
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
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Below the Fold (Priority 2)

```
┌─────────────────────────────────────────┐
│ Recent Activity Timeline                 │
│ ┌─────────────────────────────────────┐ │
│ │ [Collapsed - Shows 3-5 items]       │ │
│ │ • Latest activity item              │ │
│ │ • Previous activity                 │ │
│ │ • Earlier activity                  │ │
│ │                                     │ │
│ │ [Show More ▼] (Expandable)          │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🧩 Component Changes

### 1. Enhanced Stat Cards

**Current:** Simple count + subtitle  
**New:** Count + trend + actionable context

**Total Cases Card:**

```
┌─────────────────────┐
│ Total Cases         │
│ 1,234 ↑            │
│ +17 this week       │
│                     │
│ [Icon]              │
└─────────────────────┘
```

**Cases Needing Discharge (NEW):**

```
┌─────────────────────┐
│ Missing Discharges  │
│ 183 ⚠️             │
│ 735 total           │
│                     │
│ [Icon]              │
└─────────────────────┘
```

**SOAP Notes Coverage (ENHANCED):**

```
┌─────────────────────┐
│ SOAP Coverage       │
│ 85% ✓              │
│ 410 cases need SOAP │
│                     │
│ [Icon]              │
└─────────────────────┘
```

**Communications (ENHANCED):**

```
┌─────────────────────┐
│ Communications      │
│ 245                │
│ 180 calls, 65 emails│
│                     │
│ [Icon]              │
└─────────────────────┘
```

### 2. Cases Needing Attention Card (NEW)

**Replaces:** Case Sources Breakdown

```
┌─────────────────────────────────────┐
│ Cases Needing Attention             │
├─────────────────────────────────────┤
│                                     │
│ Discharge Summaries                 │
│ ┌───────────────────────────────┐  │
│ │ 183 this week                 │  │
│ │ 735 total                     │  │
│ └───────────────────────────────┘  │
│                                     │
│ SOAP Notes                          │
│ ┌───────────────────────────────┐  │
│ │ 187 this week                 │  │
│ │ 410 total                     │  │
│ └───────────────────────────────┘  │
│                                     │
│ [View Missing Discharges]           │
│ [View Missing SOAP Notes]           │
└─────────────────────────────────────┘
```

**Features:**

- Highlighted numbers (red/amber badges)
- Time-based breakdown (this week / total)
- Quick action buttons
- Visual priority (colored border or icon)

### 3. Condensed Activity Timeline

**Current:** Always expanded, ~400-500px  
**New:** Collapsed by default, expandable

**Collapsed State (3-5 items):**

```
┌─────────────────────────────────────┐
│ Recent Activity                     │
├─────────────────────────────────────┤
│ • Case created for Max               │
│   2 minutes ago                      │
│ • Discharge summary generated        │
│   15 minutes ago                     │
│ • SOAP note created                  │
│   1 hour ago                         │
│                                     │
│ [Show More ▼] (5 more items)        │
└─────────────────────────────────────┘
```

**Expanded State:**

```
┌─────────────────────────────────────┐
│ Recent Activity                     │
│ [Show Less ▲]                       │
├─────────────────────────────────────┤
│ Full timeline with:                 │
│ - Timeline line                     │
│ - All 10-15 items                   │
│ - Full details                      │
└─────────────────────────────────────┘
```

**Implementation:**

- Use `Collapsible` component from shadcn/ui
- Default: Collapsed (shows 3-5 items)
- Click to expand: Shows all items
- Smooth animation

### 4. Enhanced Weekly Activity Chart

**Changes:**

- Reduce height from 300px to 250px
- Keep all functionality
- Optimize for above-the-fold placement

## 📋 Backend Changes Required

### New Metrics Queries

See: `data-models/dashboard-stats-queries.md`

**New Fields in `getCaseStats`:**

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

## 🔧 Files to Modify

### Components

1. **`src/components/dashboard/overview-tab.tsx`**
   - Remove `SourceBreakdownCard`
   - Add `CasesNeedingAttentionCard`
   - Enhance existing `StatCard` components
   - Reorganize layout order

2. **`src/components/dashboard/activity-timeline.tsx`**
   - Refactor to use `Collapsible`
   - Add collapsed/expanded states
   - Create compact view component

3. **`src/components/dashboard/cases-needing-attention-card.tsx`** (NEW)
   - Display cases needing discharge summaries
   - Display cases needing SOAP notes
   - Action buttons for filtering

4. **`src/components/dashboard/stat-card.tsx`** (ENHANCE)
   - Add trend indicators (↑↓)
   - Add actionable context
   - Improve subtitle formatting

### Backend

5. **`src/server/api/routers/dashboard.ts`**
   - Enhance `getCaseStats` query
   - Add new metrics calculations
   - Update return types

## ✅ Acceptance Criteria

- [ ] Initial view shows actionable information without scrolling
- [ ] Cases needing attention card replaces case sources
- [ ] Activity timeline is collapsed by default
- [ ] All stat cards show trends or actionable context
- [ ] Weekly chart height reduced to 250px
- [ ] Date filter uses button group (not dropdown)
- [ ] All components follow design system
- [ ] Smooth animations and transitions
- [ ] Responsive on mobile/tablet/desktop

## 📐 Visual Priority

**Tier 1 (Always Visible):**

1. 4 Enhanced KPI Cards
2. Cases Needing Attention Card
3. Recent Cases List
4. Weekly Activity Chart (condensed)

**Tier 2 (Scrollable):** 5. Activity Timeline (collapsed by default)

## 🎨 Design Specifications

See: `specifications/cases-needing-attention-card.md`  
See: `01-GENERAL/design-system.md`

**Key Design Elements:**

- Card gradient backgrounds
- Teal primary color (#31aba3)
- Consistent spacing (4px multiples)
- Smooth transitions (200ms)
- Status color coding (amber for warnings)

---

**Next Steps:** See `assignments/A3-cases-needing-attention-card.md` and `assignments/A4-enhanced-stat-cards.md`

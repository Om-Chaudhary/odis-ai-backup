# Cases Tab - Complete Redesign Plan

> **Tab:** Cases (`/dashboard?tab=cases`)  
> **Purpose:** Browse, search, and manage all veterinary cases  
> **Priority:** High - Core functionality

## 🎯 Redesign Goals

1. **Improve Search & Filter Experience** - Better discoverability and faster filtering
2. **Standardize View Modes** - Consistent grid/list toggle
3. **Enhance Case Cards** - More information at a glance
4. **Optimize Performance** - Better pagination and loading
5. **Add Quick Actions** - Common actions accessible from cards

## 📊 Current State Analysis

### Current Layout

```
┌─────────────────────────────────────────┐
│ Header: All Cases                        │
│ [Grid/List Toggle] [New Case]           │
├─────────────────────────────────────────┤
│ Search: [________________________]      │
│ Filters: [Status ▼] [Source ▼]         │
├─────────────────────────────────────────┤
│ Cases Grid/List                          │
│ ┌────┐ ┌────┐ ┌────┐                   │
│ │Card│ │Card│ │Card│                   │
│ └────┘ └────┘ └────┘                   │
├─────────────────────────────────────────┤
│ Pagination: [Previous] [Next]           │
└─────────────────────────────────────────┘
```

### Issues Identified

1. ⚠️ **Filter Dropdowns** - Should use button groups for consistency
2. ⚠️ **Limited Case Information** - Cards could show more at a glance
3. ⚠️ **No Quick Actions** - Must navigate to detail page for actions
4. ⚠️ **Date Filter Missing** - Should respect global date filter
5. ⚠️ **No Bulk Actions** - Can't select multiple cases

## 🎨 Redesigned Layout

### Enhanced Header

```
┌─────────────────────────────────────────┐
│ All Cases                                │
│ Manage and track all your veterinary cases│
│                                          │
│ [Grid/List] [New Case] [Export]         │
├─────────────────────────────────────────┤
│ Date Filter: [All Time] [Day] [3D] [30D]│
└─────────────────────────────────────────┘
```

### Enhanced Filters

```
┌─────────────────────────────────────────┐
│ Search: [________________________]      │
│                                         │
│ Status: [All] [Draft] [Ongoing] [Done] │
│ Source: [All] [Manual] [IDEXX] [...    │
│                                         │
│ Quick Filters:                          │
│ [Missing Discharge] [Missing SOAP]     │
│ [Recent Today] [This Week]             │
└─────────────────────────────────────────┘
```

### Enhanced Case Cards

**Grid View:**

```
┌──────────────────────────┐
│ Max (Canine)             │
│ John Smith               │
│ ──────────────────────── │
│ Status: [Ongoing]        │
│ Created: 2 hours ago     │
│                          │
│ ✓ SOAP Note              │
│ ⚠️ Missing Discharge     │
│                          │
│ [View] [Quick Actions ▼] │
└──────────────────────────┘
```

**List View:**

```
┌─────────────────────────────────────────┐
│ Max | John Smith | Ongoing | 2h ago     │
│ ✓ SOAP | ⚠️ Discharge | [Actions]       │
└─────────────────────────────────────────┘
```

## 🧩 Component Changes

### 1. Enhanced Search Bar

**Current:** Basic input  
**New:** Search with suggestions

```typescript
<Input
  placeholder="Search by patient, owner, case ID..."
  value={search}
  onChange={handleSearch}
  // Add suggestions dropdown
  // Add search filters (patient, owner, case ID)
/>
```

**Features:**

- Search by patient name
- Search by owner name
- Search by case ID
- Recent searches
- Search suggestions

### 2. Button Group Filters

**Replace:** Dropdown selects  
**With:** Button groups (consistent with date filter)

```typescript
// Status Filter
<div className="button-group">
  <Button variant={status === "all" ? "default" : "ghost"}>
    All
  </Button>
  <Button variant={status === "draft" ? "default" : "ghost"}>
    Draft
  </Button>
  <Button variant={status === "ongoing" ? "default" : "ghost"}>
    Ongoing
  </Button>
  <Button variant={status === "completed" ? "default" : "ghost"}>
    Completed
  </Button>
</div>
```

### 3. Enhanced Case Cards

**Show More Information:**

- Patient name + species
- Owner name
- Status badge
- Created time (relative)
- SOAP note indicator (✓ or ⚠️)
- Discharge summary indicator (✓ or ⚠️)
- Quick action dropdown

**Status Badges:**

```typescript
// Color-coded status
<Badge variant="draft">Draft</Badge>
<Badge variant="ongoing">Ongoing</Badge>
<Badge variant="completed">Completed</Badge>
<Badge variant="reviewed">Reviewed</Badge>
```

**Quick Actions:**

- View Details
- Generate SOAP Note
- Generate Discharge Summary
- Schedule Call
- Schedule Email
- Edit Case

### 4. Quick Filters

**New Component:** Quick filter chips

```
[Missing Discharge] [Missing SOAP] [Recent Today] [This Week]
```

**Features:**

- One-click filtering
- Multiple selection
- Visual indication when active
- Clear all option

### 5. Bulk Actions (Future Enhancement)

**Select Multiple Cases:**

- Checkbox on each card
- Select all option
- Bulk actions menu:
  - Generate discharge summaries
  - Export selected
  - Change status
  - Archive

## 🔧 Files to Modify

### Components

1. **`src/components/dashboard/cases-tab.tsx`**
   - Replace dropdown filters with button groups
   - Add quick filters component
   - Enhance case cards
   - Add date filter integration
   - Improve search experience

2. **`src/components/dashboard/case-list-card.tsx`** (ENHANCE)
   - Add more information display
   - Add status badges
   - Add completion indicators
   - Add quick actions dropdown

3. **`src/components/dashboard/case-list-item-compact.tsx`** (ENHANCE)
   - Improve information density
   - Add quick actions
   - Better status indication

4. **`src/components/dashboard/quick-filters.tsx`** (NEW)
   - Quick filter chips
   - Multiple selection
   - Clear all functionality

### Backend

5. **`src/server/api/routers/dashboard.ts`**
   - Enhance `getAllCases` query
   - Add quick filter support
   - Add bulk operation endpoints (future)

## ✅ Acceptance Criteria

- [ ] Date filter integrated (button group)
- [ ] Status filter uses button group (not dropdown)
- [ ] Source filter uses button group (not dropdown)
- [ ] Quick filters component added
- [ ] Case cards show more information
- [ ] Quick actions available on cards
- [ ] Search has suggestions/autocomplete
- [ ] Grid/list view consistent with design system
- [ ] Responsive on all screen sizes
- [ ] Loading states implemented
- [ ] Empty states implemented

## 📐 Visual Priority

**Above the Fold:**

1. Header with actions
2. Date filter
3. Search bar
4. Filter buttons
5. First row of case cards

**Below the Fold:** 6. Remaining case cards 7. Pagination

## 🎨 Design Specifications

**Filter Button Groups:**

- Connected buttons (no gaps)
- Active state: Teal background (#31aba3)
- Inactive state: Ghost/outline
- Smooth transitions

**Case Cards:**

- Gradient background (standard card style)
- Status badges with color coding
- Completion indicators (✓ green, ⚠️ amber)
- Hover: Subtle shadow increase
- Quick action dropdown menu

**Quick Filters:**

- Chip/badge style
- Multiple selection
- Active: Teal border + background tint
- Hover: Slight scale (1.02x)

---

**Next Steps:** Implement filter button groups, enhance case cards, add quick filters

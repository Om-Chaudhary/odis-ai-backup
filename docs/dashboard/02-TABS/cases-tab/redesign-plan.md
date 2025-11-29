# Cases Tab - Complete Redesign Plan

> **Tab:** Cases (`/dashboard?tab=cases`)  
> **Purpose:** Browse, search, and manage all veterinary cases  
> **Priority:** High - Core functionality  
> **Status:** In Progress  
> **Last Updated:** 2025-11-28

## 🎯 Redesign Goals

1. **Improve Search & Filter Experience** - Better discoverability and faster filtering
2. **Standardize View Modes** - Consistent grid/list toggle with enhanced information display
3. **Enhance Case Cards** - More actionable information at a glance
4. **Optimize Performance** - Better pagination, loading states, and data fetching
5. **Add Quick Actions** - Common actions accessible directly from cards
6. **Replace Dropdowns with Button Groups** - Consistent with design system and date filter pattern
7. **Add Quick Filter Chips** - One-click filtering for common scenarios

## 📊 Current State Analysis

### Current Layout

```
┌─────────────────────────────────────────┐
│ Header: All Cases                        │
│ [Grid/List Toggle] [New Case]           │
│ [All Time ▼]                            │
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
│ Showing 1 to 20 of 289 cases            │
└─────────────────────────────────────────┘
```

### Current Implementation Details

**See:** `current-state-analysis.md` for comprehensive documentation

**Key Components:**

- `cases-tab.tsx` - Main tab component
- `case-list-card.tsx` - Grid view card component
- `case-list-item-compact.tsx` - List view item component

**Current Filters:**

1. **Date Filter** - Dropdown button (to be replaced)
2. **Search** - Text input (patient/owner name)
3. **Status Filter** - Dropdown (All, Draft, Ongoing, Completed, Reviewed)
4. **Source Filter** - Dropdown (All, Manual, IDEXX Neo, Cornerstone, ezyVet, AVImark)

**Current View Modes:**

- Grid View (default) - 3-column layout
- List View - Compact horizontal rows

### Issues Identified

1. ⚠️ **Filter Dropdowns** - Should use button groups for consistency with date filter pattern
2. ⚠️ **Limited Case Information** - Cards show basic info but could be more actionable
3. ⚠️ **No Quick Actions** - Must navigate to detail page for common actions
4. ⚠️ **Date Filter Inconsistent** - Uses dropdown instead of button group
5. ⚠️ **No Quick Filters** - Can't quickly filter by "Missing Discharge" or "Missing SOAP"
6. ⚠️ **No Bulk Actions** - Can't select multiple cases for batch operations
7. ⚠️ **Search Limited** - Only searches patient/owner name, not case ID or other fields
8. ⚠️ **No Sort Options** - Cases displayed in default order only

## 🎨 Redesigned Layout

### Enhanced Header

```
┌─────────────────────────────────────────┐
│ All Cases                                │
│ Manage and track all your veterinary cases│
│                                          │
│ [Grid] [List] [New Case] [Export ▼]     │
├─────────────────────────────────────────┤
│ Date Filter: [All Time] [Day] [3D] [30D]│
│ (Button group, consistent with Overview)│
└─────────────────────────────────────────┘
```

**Changes:**

- Date filter moved to prominent position below header
- Uses button group instead of dropdown
- Export button added (dropdown for CSV, PDF options)
- View toggles remain in header

### Enhanced Filters Section

```
┌─────────────────────────────────────────┐
│ Search: [________________________]      │
│         [🔍 Patient] [👤 Owner] [ID]    │
│                                         │
│ Status: [All] [Draft] [Ongoing] [Done] │
│         [Completed] [Reviewed]          │
│                                         │
│ Source: [All] [Manual] [IDEXX] [Corner]│
│         [ezyVet] [AVImark]              │
│                                         │
│ Quick Filters:                          │
│ [⚠️ Missing Discharge] [⚠️ Missing SOAP]│
│ [📅 Today] [📅 This Week] [🆕 Recent]   │
└─────────────────────────────────────────┘
```

**Key Features:**

- Search with field selectors (Patient, Owner, Case ID)
- Status filter as button group (6 options)
- Source filter as button group (6 options)
- Quick filter chips for common scenarios
- All filters visible and accessible

### Enhanced Case Cards (Grid View)

```
┌──────────────────────────────────────┐
│ 🐕 Max (Canine)                      │
│ 👤 John Smith                        │
│ ──────────────────────────────────── │
│ Status: [Ongoing]                    │
│ Source: [Manual]                      │
│ Created: 2 hours ago                  │
│                                       │
│ Completion Status:                    │
│ ✓ SOAP Note (Nov 28, 2:30 PM)       │
│ ⚠️ Missing Discharge Summary         │
│ ⏳ Call Scheduled (Nov 29, 10:00 AM) │
│ ✓ Email Sent (Nov 28, 3:15 PM)      │
│                                       │
│ [View Details] [Quick Actions ▼]     │
└──────────────────────────────────────┘
```

**Enhanced Information:**

- Patient name with species icon
- Owner name with icon
- Status badge (color-coded)
- Source badge
- Created timestamp (relative)
- Detailed completion indicators:
  - ✓ Completed items with timestamp
  - ⚠️ Missing items highlighted
  - ⏳ Scheduled items with time
- Quick action dropdown menu

### Enhanced List View

```
┌─────────────────────────────────────────────────────────────┐
│ 🐕 Max | 👤 John Smith | [Ongoing] | Manual | 2h ago        │
│ ✓ SOAP | ⚠️ Discharge | ⏳ Call | ✓ Email | [View] [Actions]│
└─────────────────────────────────────────────────────────────┘
```

**Compact Information:**

- Single row layout
- All key info visible
- Status and source badges inline
- Completion indicators as icons
- Quick actions on right

## 🧩 Component Changes

### 1. Enhanced Search Bar

**Current:** Basic input with placeholder  
**New:** Advanced search with field selection and suggestions

**Implementation:**

```typescript
<div className="relative">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  <Input
    placeholder="Search by patient, owner, case ID..."
    className="pl-9 pr-24"
    value={search}
    onChange={handleSearch}
  />
  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
    <Button
      variant={searchField === "patient" ? "default" : "ghost"}
      size="sm"
      onClick={() => setSearchField("patient")}
    >
      Patient
    </Button>
    <Button
      variant={searchField === "owner" ? "default" : "ghost"}
      size="sm"
      onClick={() => setSearchField("owner")}
    >
      Owner
    </Button>
    <Button
      variant={searchField === "id" ? "default" : "ghost"}
      size="sm"
      onClick={() => setSearchField("id")}
    >
      ID
    </Button>
  </div>
</div>
```

**Features:**

- Field selector buttons (Patient, Owner, Case ID)
- Search suggestions dropdown (future)
- Recent searches (future)
- Search history (future)

**Backend Changes:**

- Update `getAllCases` to support field-specific search
- Add case ID search capability

### 2. Button Group Filters

**Replace:** Dropdown selects  
**With:** Button groups (consistent with date filter)

**Status Filter Button Group:**

```typescript
<div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1">
  <Button
    variant={statusFilter === "all" ? "default" : "ghost"}
    size="sm"
    onClick={() => setStatusFilter("all")}
    className={cn(
      statusFilter === "all" && "bg-[#31aba3] text-white"
    )}
  >
    All
  </Button>
  <Button
    variant={statusFilter === "draft" ? "default" : "ghost"}
    size="sm"
    onClick={() => setStatusFilter("draft")}
  >
    Draft
  </Button>
  <Button
    variant={statusFilter === "ongoing" ? "default" : "ghost"}
    size="sm"
    onClick={() => setStatusFilter("ongoing")}
  >
    Ongoing
  </Button>
  <Button
    variant={statusFilter === "completed" ? "default" : "ghost"}
    size="sm"
    onClick={() => setStatusFilter("completed")}
  >
    Completed
  </Button>
  <Button
    variant={statusFilter === "reviewed" ? "default" : "ghost"}
    size="sm"
    onClick={() => setStatusFilter("reviewed")}
  >
    Reviewed
  </Button>
</div>
```

**Source Filter Button Group:**

```typescript
<div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1">
  <Button
    variant={sourceFilter === "all" ? "default" : "ghost"}
    size="sm"
    onClick={() => setSourceFilter("all")}
  >
    All
  </Button>
  <Button
    variant={sourceFilter === "manual" ? "default" : "ghost"}
    size="sm"
    onClick={() => setSourceFilter("manual")}
  >
    Manual
  </Button>
  <Button
    variant={sourceFilter === "idexx_neo" ? "default" : "ghost"}
    size="sm"
    onClick={() => setSourceFilter("idexx_neo")}
  >
    IDEXX Neo
  </Button>
  <Button
    variant={sourceFilter === "cornerstone" ? "default" : "ghost"}
    size="sm"
    onClick={() => setSourceFilter("cornerstone")}
  >
    Cornerstone
  </Button>
  <Button
    variant={sourceFilter === "ezyvet" ? "default" : "ghost"}
    size="sm"
    onClick={() => setSourceFilter("ezyvet")}
  >
    ezyVet
  </Button>
  <Button
    variant={sourceFilter === "avimark" ? "default" : "ghost"}
    size="sm"
    onClick={() => setSourceFilter("avimark")}
  >
    AVImark
  </Button>
</div>
```

**Styling:**

- Container: `rounded-lg border border-slate-200 bg-slate-50/50 p-1`
- Active button: `bg-[#31aba3] text-white`
- Inactive button: `ghost` variant
- Smooth transitions: `transition-smooth`

### 3. Quick Filters Component (NEW)

**Purpose:** One-click filtering for common scenarios

**Implementation:**

```typescript
// src/components/dashboard/quick-filters.tsx
interface QuickFilter {
  id: string;
  label: string;
  icon: LucideIcon;
  filter: () => void;
  active: boolean;
}

export function QuickFilters({
  filters,
  onFilterChange,
}: {
  filters: QuickFilter[];
  onFilterChange: (filterId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={filter.active ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            filter.active && "bg-[#31aba3] text-white border-[#31aba3]"
          )}
        >
          <filter.icon className="mr-2 h-4 w-4" />
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
```

**Quick Filter Options:**

1. **Missing Discharge** - Cases without discharge summaries
2. **Missing SOAP** - Cases without SOAP notes
3. **Today** - Cases created today
4. **This Week** - Cases created this week
5. **Recent** - Cases created in last 24 hours
6. **Needs Attention** - Cases with missing items or errors

**Backend Support:**

- Add `missingDischarge: boolean` filter
- Add `missingSoap: boolean` filter
- Add date range filters for "Today", "This Week", "Recent"

### 4. Enhanced Case Cards

**Grid View Enhancements:**

```typescript
// Enhanced CaseListCard component
<Card className="transition-smooth hover:shadow-lg">
  <CardContent className="p-6">
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-2">
          <SpeciesIcon species={caseData.patient.species} />
          <h3 className="font-semibold">{caseData.patient.name}</h3>
          <Badge variant="outline">{caseData.patient.species}</Badge>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          👤 {caseData.patient.owner_name || "Unknown Owner"}
        </p>
      </div>
      <StatusBadge status={caseData.status} />
    </div>

    {/* Metadata */}
    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
      <div className="flex items-center gap-1">
        <SourceIcon source={caseData.source} />
        <span>{getSourceLabel(caseData.source)}</span>
      </div>
      <div className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        <span>Created {formatDistanceToNow(new Date(caseData.created_at))} ago</span>
      </div>
    </div>

    {/* Completion Status */}
    <div className="space-y-2 mb-4">
      <CompletionIndicator
        type="soap"
        completed={!!caseData.soap_notes?.length}
        timestamp={caseData.soap_notes?.[0]?.created_at}
      />
      <CompletionIndicator
        type="discharge"
        completed={!!caseData.discharge_summaries?.length}
        timestamp={caseData.discharge_summaries?.[0]?.created_at}
      />
      <CompletionIndicator
        type="call"
        scheduled={caseData.scheduled_call}
        timestamp={caseData.scheduled_call?.scheduled_at}
      />
      <CompletionIndicator
        type="email"
        sent={caseData.sent_email}
        timestamp={caseData.sent_email?.sent_at}
      />
    </div>

    {/* Actions */}
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/cases/${caseData.id}`}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleGenerateSoap(caseData.id)}>
            Generate SOAP Note
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleGenerateDischarge(caseData.id)}>
            Generate Discharge Summary
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleScheduleCall(caseData.id)}>
            Schedule Call
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleScheduleEmail(caseData.id)}>
            Schedule Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </CardContent>
</Card>
```

**Completion Indicator Component:**

```typescript
function CompletionIndicator({
  type,
  completed,
  scheduled,
  sent,
  timestamp,
}: {
  type: "soap" | "discharge" | "call" | "email";
  completed?: boolean;
  scheduled?: boolean;
  sent?: boolean;
  timestamp?: string;
}) {
  const icon = {
    soap: FileText,
    discharge: FileCheck,
    call: Phone,
    email: Mail,
  }[type];

  const label = {
    soap: "SOAP Note",
    discharge: "Discharge Summary",
    call: "Call",
    email: "Email",
  }[type];

  if (completed || sent) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <span className="text-slate-700">{label}</span>
        {timestamp && (
          <span className="text-xs text-slate-500">
            ({format(new Date(timestamp), "MMM d, h:mm a")})
          </span>
        )}
      </div>
    );
  }

  if (scheduled) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-amber-600" />
        <span className="text-slate-700">{label} Scheduled</span>
        {timestamp && (
          <span className="text-xs text-slate-500">
            ({format(new Date(timestamp), "MMM d, h:mm a")})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <span className="text-amber-700">Missing {label}</span>
    </div>
  );
}
```

### 5. Enhanced List View

**Compact Item Enhancements:**

```typescript
// Enhanced CaseListItemCompact component
<Card className="transition-smooth hover:bg-slate-50">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      {/* Left: Info */}
      <div className="flex items-center gap-4 flex-1">
        <SpeciesIcon species={caseData.patient.species} className="h-5 w-5" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{caseData.patient.name}</span>
            <StatusBadge status={caseData.status} size="sm" />
            <SourceBadge source={caseData.source} size="sm" />
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span>👤 {caseData.patient.owner_name || "Unknown"}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(caseData.created_at))} ago</span>
          </div>
        </div>
      </div>

      {/* Center: Completion Indicators */}
      <div className="flex items-center gap-3">
        <CompletionIcon
          type="soap"
          completed={!!caseData.soap_notes?.length}
          size="sm"
        />
        <CompletionIcon
          type="discharge"
          completed={!!caseData.discharge_summaries?.length}
          size="sm"
        />
        <CompletionIcon
          type="call"
          scheduled={!!caseData.scheduled_call}
          size="sm"
        />
        <CompletionIcon
          type="email"
          sent={!!caseData.sent_email}
          size="sm"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/cases/${caseData.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        <QuickActionsMenu caseId={caseData.id} />
      </div>
    </div>
  </CardContent>
</Card>
```

### 6. Date Filter Integration

**Replace dropdown with button group:**

```typescript
import { DateFilterButtonGroup } from "~/components/dashboard/date-filter-button-group";

// In cases-tab.tsx
<DateFilterButtonGroup
  value={dateRange}
  onChange={(range) => {
    setStartDate(range?.startDate);
    setEndDate(range?.endDate);
    setPage(1);
  }}
/>
```

**See:** `../../03-COMPONENTS/date-filter-button-group.md` for component specification

### 7. Bulk Actions (Future Enhancement)

**Select Multiple Cases:**

```typescript
const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());

// Add checkbox to cards
<Checkbox
  checked={selectedCases.has(caseData.id)}
  onCheckedChange={(checked) => {
    const newSelected = new Set(selectedCases);
    if (checked) {
      newSelected.add(caseData.id);
    } else {
      newSelected.delete(caseData.id);
    }
    setSelectedCases(newSelected);
  }}
/>

// Bulk actions bar (appears when cases selected)
{selectedCases.size > 0 && (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
    <div className="flex items-center justify-between max-w-7xl mx-auto">
      <span>{selectedCases.size} cases selected</span>
      <div className="flex gap-2">
        <Button onClick={handleBulkGenerateDischarge}>
          Generate Discharge Summaries
        </Button>
        <Button onClick={handleBulkExport}>
          Export Selected
        </Button>
        <Button variant="outline" onClick={() => setSelectedCases(new Set())}>
          Clear Selection
        </Button>
      </div>
    </div>
  </div>
)}
```

## 🔧 Files to Modify

### Components

1. **`src/components/dashboard/cases-tab.tsx`** (MAJOR UPDATE)
   - Replace dropdown filters with button groups
   - Add `QuickFilters` component
   - Integrate `DateFilterButtonGroup`
   - Add search field selector
   - Add bulk selection state (future)
   - Enhance filter state management

2. **`src/components/dashboard/case-list-card.tsx`** (ENHANCE)
   - Add detailed completion indicators
   - Add status and source badges
   - Add quick actions dropdown menu
   - Improve information hierarchy
   - Add timestamps for completed items

3. **`src/components/dashboard/case-list-item-compact.tsx`** (ENHANCE)
   - Improve information density
   - Add inline completion icons
   - Add quick actions menu
   - Better status indication
   - Optimize for horizontal scanning

4. **`src/components/dashboard/quick-filters.tsx`** (NEW)
   - Quick filter chip component
   - Multiple selection support
   - Clear all functionality
   - Icon support for each filter

5. **`src/components/dashboard/completion-indicator.tsx`** (NEW)
   - Reusable completion status component
   - Supports completed, scheduled, missing states
   - Timestamp display
   - Icon-based for compact views

6. **`src/components/dashboard/quick-actions-menu.tsx`** (NEW)
   - Dropdown menu with common actions
   - Context-aware actions (based on case state)
   - Keyboard shortcuts support

### Backend

7. **`src/server/api/routers/dashboard.ts`**
   - Enhance `getAllCases` query:
     - Add `missingDischarge` filter
     - Add `missingSoap` filter
     - Add field-specific search (patient, owner, caseId)
     - Add date range filters
   - Add bulk operation endpoints (future):
     - `bulkGenerateDischarge`
     - `bulkExportCases`
     - `bulkUpdateStatus`

### Types

8. **`src/types/dashboard.ts`**
   - Add `QuickFilter` type
   - Add `CompletionStatus` type
   - Add `BulkAction` type (future)

## ✅ Acceptance Criteria

### Phase 1: Filter Improvements ✅

- [ ] Date filter uses button group (not dropdown)
- [ ] Status filter uses button group (not dropdown)
- [ ] Source filter uses button group (not dropdown)
- [ ] Quick filters component added and functional
- [ ] All filters persist in URL query params
- [ ] Filters reset pagination appropriately

### Phase 2: Enhanced Display ✅

- [ ] Case cards show detailed completion status
- [ ] Case cards show timestamps for completed items
- [ ] List view shows completion indicators inline
- [ ] Status badges are color-coded and consistent
- [ ] Source badges are styled appropriately

### Phase 3: Quick Actions ✅

- [ ] Quick actions menu on each card
- [ ] Quick actions menu on list items
- [ ] Actions are context-aware (disabled when not applicable)
- [ ] Actions provide visual feedback
- [ ] Actions update UI optimistically

### Phase 4: Search Enhancement ✅

- [ ] Search field selector (Patient, Owner, ID)
- [ ] Search works with selected field
- [ ] Search suggestions (future)
- [ ] Recent searches (future)

### Phase 5: Bulk Actions (Future) 🔄

- [ ] Checkbox selection on cards
- [ ] Select all functionality
- [ ] Bulk actions bar appears when items selected
- [ ] Bulk generate discharge summaries
- [ ] Bulk export functionality

### General Requirements ✅

- [ ] All components follow design system
- [ ] Smooth animations and transitions
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] Error states handled gracefully
- [ ] Keyboard navigation supported
- [ ] Screen reader accessible

## 📐 Visual Priority

**Above the Fold:**

1. Header with title and description
2. Date filter button group
3. Search bar with field selector
4. Status and Source filter button groups
5. Quick filter chips
6. First row of case cards (grid) or first 5 cases (list)

**Below the Fold:**

7. Remaining case cards
8. Pagination controls
9. Bulk actions bar (when items selected)

## 🎨 Design Specifications

### Filter Button Groups

**Container:**

```css
.inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1
```

**Active Button:**

```css
bg-[#31aba3] text-white shadow-sm
```

**Inactive Button:**

```css
bg-transparent text-slate-700 hover:bg-slate-100
```

**Spacing:**

- Buttons: No gap (connected)
- Between filter groups: `gap-4` (16px)

### Quick Filter Chips

**Container:**

```css
flex flex-wrap gap-2
```

**Active Chip:**

```css
bg-[#31aba3] text-white border-[#31aba3]
```

**Inactive Chip:**

```css
border-slate-200 text-slate-700 hover:border-[#31aba3] hover:text-[#31aba3]
```

### Case Cards

**Grid Card:**

- Padding: `p-6` (24px)
- Border radius: `rounded-xl` (12px)
- Border: `border border-teal-200/40`
- Background: Gradient card style
- Hover: `hover:shadow-lg` with `translateY(-1px)`

**List Item:**

- Padding: `p-4` (16px)
- Border radius: `rounded-lg` (8px)
- Border: `border border-slate-200`
- Background: `bg-white`
- Hover: `hover:bg-slate-50`

### Completion Indicators

**Completed:**

- Icon: `CheckCircle2` (green: `text-emerald-600`)
- Text: Standard slate color

**Scheduled:**

- Icon: `Clock` (amber: `text-amber-600`)
- Text: Standard slate color

**Missing:**

- Icon: `AlertCircle` (amber: `text-amber-600`)
- Text: Amber (`text-amber-700`)

## 🔄 State Management

### URL Query Parameters

```typescript
// Date filter
startDate?: string;  // YYYY-MM-DD
endDate?: string;     // YYYY-MM-DD
dateRange?: string;   // "all" | "1d" | "3d" | "30d"

// Filters
status?: "draft" | "ongoing" | "completed" | "reviewed";
source?: "manual" | "idexx_neo" | "cornerstone" | "ezyvet" | "avimark";
search?: string;
searchField?: "patient" | "owner" | "id";

// Quick filters (computed from other params)
missingDischarge?: boolean;
missingSoap?: boolean;

// Pagination
page?: number;  // Default: 1

// View mode (localStorage)
viewMode?: "grid" | "list";
```

### Local State

```typescript
const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
const [quickFilters, setQuickFilters] = useState<Set<string>>(new Set());
```

## 📱 Responsive Behavior

### Mobile (< 640px)

- Filters stack vertically
- Button groups wrap to multiple rows
- Grid view: 1 column
- List view: Full width, compact
- Quick filters: Wrap to multiple rows
- Bulk actions: Full-width bar at bottom

### Tablet (640px - 1024px)

- Filters in 2 columns
- Button groups: Horizontal, may wrap
- Grid view: 2 columns
- List view: Standard width
- Quick filters: 2-3 per row

### Desktop (> 1024px)

- All filters in single row
- Button groups: All buttons visible
- Grid view: 3 columns
- List view: Spacious, all info visible
- Quick filters: All in single row

## 🚀 Performance Optimizations

1. **Debounced Search** - Wait 300ms after typing stops
2. **Memoized Filtered Results** - Use `useMemo` for filtered cases
3. **Virtual Scrolling** (Future) - For large lists (1000+ cases)
4. **Lazy Loading** - Load more cases on scroll (future)
5. **Optimistic Updates** - Update UI immediately, sync with server

## 📝 Related Documentation

- **Current State Analysis:** `current-state-analysis.md`
- **Date Filter Component:** `../../03-COMPONENTS/date-filter-button-group.md`
- **Design System:** `../../01-GENERAL/design-system.md`
- **Component Implementation:** `src/components/dashboard/cases-tab.tsx`

---

**Next Steps:**

1. Implement date filter button group
2. Replace status/source dropdowns with button groups
3. Add quick filters component
4. Enhance case cards with completion indicators
5. Add quick actions menu

**Status:** Planning complete, ready for implementation

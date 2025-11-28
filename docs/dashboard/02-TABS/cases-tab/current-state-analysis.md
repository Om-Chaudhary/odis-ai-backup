# Cases Tab - Current State Analysis

> **Tab:** Cases (`/dashboard?tab=cases`)  
> **Last Updated:** 2025-11-28  
> **Purpose:** Comprehensive documentation of all filters, view options, and controls

## 📊 Current Implementation Overview

The Cases tab provides a comprehensive interface for browsing, searching, and managing all veterinary cases with multiple filtering and view options.

## 🎛️ Filter & View Controls

### 1. Date Filter

**Location:** Top right, above the view toggles  
**Component:** Button with calendar icon  
**Current State:** Dropdown button (to be replaced with button group per redesign plan)

**Options:**

- **All Time** (default) - Shows all cases regardless of date
- Additional options likely available in dropdown (not visible in current implementation)

**Implementation:**

- Uses `nuqs` for URL state management
- Query parameter: `startDate` and `endDate` (when date range selected)
- Query parameter: `dateRange` (when preset selected, e.g., "30d")

**Future Enhancement:**

- Replace with button group: `[All Time] [Last Day] [3 Days] [30 Days]`
- See: `03-COMPONENTS/date-filter-button-group.md`

---

### 2. View Mode Toggle

**Location:** Top right, next to "All Time" button  
**Component:** Two-button toggle group (Grid/List icons)  
**State Management:** localStorage (`cases-view-mode`)

**Options:**

#### Grid View (Default)

- **Icon:** LayoutGrid (4-square grid icon)
- **Layout:** 3-column grid on desktop (`sm:grid-cols-2 lg:grid-cols-3`)
- **Component:** `CaseListCard`
- **Features:**
  - Card-based layout
  - More visual space per case
  - Better for browsing/scanning
  - Shows more details at a glance

#### List View

- **Icon:** List (horizontal lines icon)
- **Layout:** Single column, compact rows
- **Component:** `CaseListItemCompact`
- **Features:**
  - Dense information display
  - Better for comparing multiple cases
  - More cases visible without scrolling
  - Horizontal layout with action icons

**Persistence:**

- View preference saved to `localStorage`
- Restored on page load
- Key: `cases-view-mode`

---

### 3. Search Filter

**Location:** Top left, below header  
**Component:** Input field with search icon  
**Placeholder:** "Search by patient or owner name..."

**Functionality:**

- **Real-time search** - Filters as you type
- **Search Fields:**
  - Patient name
  - Owner name
  - Case ID (implied, not explicitly stated)
- **Behavior:**
  - Resets pagination to page 1 on search
  - Client-side filtering (for current page)
  - Server-side filtering (via tRPC query parameter)

**Implementation:**

```typescript
search: search || undefined; // Passed to tRPC query
```

---

### 4. Status Filter

**Location:** Top right, next to search bar  
**Component:** Dropdown select (`Select` from shadcn/ui)  
**Width:** 150px  
**Icon:** Filter icon (funnel)

**Options:**

1. **All Status** (default) - Shows all cases regardless of status
2. **Draft** - Cases in draft state
3. **Ongoing** - Active cases in progress
4. **Completed** - Finished cases
5. **Reviewed** - Cases that have been reviewed

**Behavior:**

- Resets pagination to page 1 on filter change
- Passes `status` parameter to tRPC query
- Value `undefined` when "All Status" selected

**Implementation:**

```typescript
status: statusFilter as
  | "draft"
  | "ongoing"
  | "completed"
  | "reviewed"
  | undefined;
```

**Future Enhancement:**

- Replace dropdown with button group for consistency
- See redesign plan for button group pattern

---

### 5. Source Filter

**Location:** Top right, next to Status filter  
**Component:** Dropdown select (`Select` from shadcn/ui)  
**Width:** 150px  
**Icon:** Filter icon (funnel)

**Options:**

1. **All Sources** (default) - Shows cases from all sources
2. **Manual** - Manually created cases
3. **IDEXX Neo** - Cases imported from IDEXX Neo
4. **Cornerstone** - Cases from Cornerstone PMS
5. **ezyVet** - Cases from ezyVet PMS
6. **AVImark** - Cases from AVImark PMS

**Behavior:**

- Resets pagination to page 1 on filter change
- Passes `source` parameter to tRPC query
- Value `undefined` when "All Sources" selected

**Implementation:**

```typescript
source: sourceFilter; // String value or undefined
```

**Future Enhancement:**

- Replace dropdown with button group for consistency
- See redesign plan for button group pattern

---

## 📋 Case Display Information

### Grid View Card (`CaseListCard`)

Each case card displays:

1. **Patient Information:**
   - Patient name (e.g., "Rocky", "Desmond", "Bailey")
   - Species icon (paw print/animal icon)
   - Owner name (or "Unknown" if not set)

2. **Case Metadata:**
   - Status badge (Draft, Ongoing, Completed, Reviewed)
   - Source label (Manual, IDEXX Neo, etc.)
   - Created date (relative, e.g., "Created 2 days ago")

3. **Completion Indicators:**
   - ✓ SOAP Note (checked if SOAP note exists)
   - ✓ Summary (checked if discharge summary exists)
   - ✓ Call (checked if call scheduled/completed)
   - ✓ Email (checked if email scheduled/sent)

4. **Actions:**
   - "View Details" button (eye icon)
   - Links to case detail page

### List View Item (`CaseListItemCompact`)

Each list item displays:

1. **Left Side:**
   - Patient name
   - Status badge
   - Source label
   - Owner name (if available)

2. **Right Side:**
   - Action icons (SOAP, Summary, Call, Email)
   - "View" button

---

## 🔄 Pagination

**Location:** Bottom of case list  
**Component:** Previous/Next buttons with count display

**Display:**

```
Showing 1 to 20 of 289 cases
[Previous] [Next]
```

**Behavior:**

- Page size: 20 cases per page
- Server-side pagination
- Resets to page 1 when filters/search change
- Disabled states:
  - Previous: disabled on page 1
  - Next: disabled on last page

**Implementation:**

```typescript
page: number; // Current page (1-indexed)
pageSize: 20; // Fixed page size
```

---

## 🎯 Action Buttons

### New Case Button

**Location:** Top right, next to view toggles  
**Component:** Primary button with Plus icon  
**Label:** "+ New Case"  
**Action:** Navigates to `/dashboard/cases?action=new`

---

## 📱 Responsive Behavior

### Mobile (< 640px)

- Single column grid
- Stacked filters (search above, dropdowns below)
- Full-width search bar
- Compact list view items

### Tablet (640px - 1024px)

- 2-column grid
- Side-by-side filters
- Standard list view

### Desktop (> 1024px)

- 3-column grid
- All filters in single row
- Spacious list view

---

## 🔗 API Integration

### tRPC Query: `api.dashboard.getAllCases`

**Parameters:**

```typescript
{
  page: number;                    // Current page (1-indexed)
  pageSize: number;                // Items per page (20)
  status?: "draft" | "ongoing" | "completed" | "reviewed";
  source?: string;                 // Source filter value
  search?: string;                 // Search query
  startDate?: string;              // Date filter start (YYYY-MM-DD)
  endDate?: string;                // Date filter end (YYYY-MM-DD)
}
```

**Response:**

```typescript
{
  cases: Case[];                   // Array of case objects
  pagination: {
    total: number;                 // Total cases matching filters
    totalPages: number;             // Total number of pages
    currentPage: number;           // Current page number
    pageSize: number;              // Items per page
  };
}
```

---

## 🎨 Visual Design

### Filter Bar

- **Layout:** Flex row on desktop, column on mobile
- **Spacing:** `gap-2` (8px) between filters
- **Search:** Full width with icon on left
- **Dropdowns:** Fixed width (150px) with filter icon

### View Toggle

- **Container:** Rounded border with white background
- **Buttons:** Small size (h-8) with icons only
- **Active State:** Default variant (teal background)
- **Inactive State:** Ghost variant (transparent)

### Case Cards (Grid)

- **Background:** Gradient card style
- **Border:** Teal border with opacity
- **Spacing:** `gap-4` (16px) between cards
- **Hover:** Subtle shadow increase and transform

### List Items

- **Background:** White cards
- **Border:** Light green border
- **Spacing:** `space-y-2` (8px) between items
- **Layout:** Horizontal flex with info on left, actions on right

---

## ✅ Current Features Summary

### Implemented ✅

- [x] Search by patient/owner name
- [x] Status filter (dropdown)
- [x] Source filter (dropdown)
- [x] Date filter (button, dropdown menu)
- [x] Grid/List view toggle
- [x] Pagination (server-side)
- [x] Responsive layout
- [x] View preference persistence (localStorage)
- [x] Case cards with completion indicators
- [x] Compact list view

### Planned Enhancements 🔄

- [ ] Replace date filter dropdown with button group
- [ ] Replace status filter dropdown with button group
- [ ] Replace source filter dropdown with button group
- [ ] Add quick filter chips (Missing Discharge, Missing SOAP, etc.)
- [ ] Add bulk selection and actions
- [ ] Enhanced search with autocomplete/suggestions
- [ ] Sort options (by date, status, patient name)
- [ ] Export filtered cases

---

## 📝 Related Documentation

- **Redesign Plan:** `redesign-plan.md`
- **Date Filter Component:** `../../03-COMPONENTS/date-filter-button-group.md`
- **Component Implementation:** `src/components/dashboard/cases-tab.tsx`
- **Case Card Component:** `src/components/dashboard/case-list-card.tsx`
- **List Item Component:** `src/components/dashboard/case-list-item-compact.tsx`

---

**Last Updated:** 2025-11-28  
**Status:** Current implementation documented, redesign in progress

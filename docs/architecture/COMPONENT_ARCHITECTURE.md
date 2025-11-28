# Dashboard Component Architecture

## Component Hierarchy

```
DashboardPage (Server Component)
└── DashboardContentWithTabs (Client Component)
    ├── DashboardNavigation (NEW)
    │   ├── Tabs Component
    │   │   ├── TabsTrigger (Overview)
    │   │   ├── TabsTrigger (Cases)
    │   │   └── TabsTrigger (Discharges)
    │   │
    │   └── DateRangePresets (NEW)
    │       ├── DropdownMenuTrigger (Button)
    │       └── DropdownMenuContent
    │           ├── DropdownMenuLabel
    │           ├── DropdownMenuSeparator
    │           └── DropdownMenuGroup
    │               ├── DropdownMenuItem (All Time)
    │               ├── DropdownMenuItem (Last Day)
    │               ├── DropdownMenuItem (Last 3 Days)
    │               └── DropdownMenuItem (Last 30 Days)
    │
    └── Tab Content Components
        ├── OverviewTab (if tab === "overview")
        │   ├── StatCard × 4
        │   ├── WeeklyActivityChart
        │   ├── SourceBreakdownCard
        │   ├── RecentCasesList
        │   └── ActivityTimeline
        │
        ├── CasesTab (if tab === "cases")
        │   ├── Header
        │   ├── SearchInput
        │   ├── StatusFilter
        │   ├── SourceFilter
        │   ├── CaseListItemComponent × N
        │   └── PaginationControls
        │
        └── DischargesTab (if tab === "discharges")
            ├── SearchInput
            ├── DatePaginationControls
            ├── CaseCard × N
            ├── SettingsPanel
            └── DebugModal
```

## Component Responsibilities

### DashboardNavigation (NEW)

**Purpose:** Unified navigation combining tabs and date range selection

**Props:** None (uses URL state via `nuqs`)

**State:**

- `tab` - Current active tab
- `dateRange` - Current active preset
- `startDate` - Calculated start date
- `endDate` - Calculated end date

**Children:**

- Tabs component (tab selection)
- DateRangePresets component (date range selection)

**Output:** URL parameters updated

---

### DateRangePresets (REFACTORED)

**Purpose:** Date range preset selection via dropdown menu

**Props:** None (uses URL state via `nuqs`)

**Internal State:**

```typescript
const [dateRange, setDateRange] = useQueryState("dateRange");
const [, setStartDate] = useQueryState("startDate");
const [, setEndDate] = useQueryState("endDate");
```

**Presets:**

```typescript
interface DatePreset {
  label: string; // Display name
  value: DateRange; // Unique identifier
  description: string; // Short description
  getRange: () => {
    // Function to calculate dates
    startDate: string; // ISO date string
    endDate: string; // ISO date string
  } | null; // null for "All Time"
}
```

**Handler:**

```typescript
handleSelectPreset(preset) → {
  setDateRange(preset.value)
  setStartDate(calculated)
  setEndDate(calculated)
}
```

**Output:** Button showing active preset + Dropdown menu

---

### DashboardContentWithTabs (UPDATED)

**Purpose:** Main content container coordinating tabs and date filters

**Props:** None (reads from URL)

**State:**

```typescript
const [tab] = useQueryState("tab");
const [startDate] = useQueryState("startDate");
const [endDate] = useQueryState("endDate");
```

**Flow:**

1. Render `DashboardNavigation` (handles tab + date selection)
2. Render appropriate tab component based on `tab` value
3. Pass `startDate` and `endDate` to tab component
4. Tab component uses dates in queries

**Output:** Navigation + Active tab content

---

### OverviewTab (ENHANCED)

**Purpose:** Dashboard overview with stats and charts

**Props:**

```typescript
interface OverviewTabProps {
  startDate?: string | null;
  endDate?: string | null;
}
```

**Queries:**

```typescript
// All queries now accept date range parameters
api.dashboard.getCaseStats.useQuery({ startDate, endDate });
api.dashboard.getRecentActivity.useQuery({ startDate, endDate });
api.dashboard.getWeeklyActivity.useQuery({ startDate, endDate });
api.dashboard.getAllCases.useQuery({
  page: 1,
  pageSize: 5,
  startDate,
  endDate,
});
```

**Children:**

- StatCard × 4 (with staggered animations)
- WeeklyActivityChart (stagger-5)
- SourceBreakdownCard (stagger-6)
- RecentCasesList (stagger-6)
- ActivityTimeline (stagger-6)

**Animations:**

- Cards fade in with cascading stagger
- Hover effects on stat cards
- Smooth transitions throughout

---

### CasesTab (ENHANCED)

**Purpose:** Case list with search, filters, and pagination

**Props:**

```typescript
interface CasesTabProps {
  startDate?: string | null;
  endDate?: string | null;
}
```

**Local State:**

```typescript
const [page, setPage] = useState(1);
const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState<string>();
const [sourceFilter, setSourceFilter] = useState<string>();
```

**Query:**

```typescript
api.dashboard.getAllCases.useQuery({
  page,
  pageSize: 20,
  status: statusFilter,
  source: sourceFilter,
  search,
  startDate,
  endDate, // NEW parameter
});
```

**Children:**

- Header (animate-fade-in-down)
- Search input
- Status filter dropdown
- Source filter dropdown
- Case list items (staggered with 0.05s delays)
- Pagination controls

**Animations:**

- Header fades down
- Filters stagger in (stagger-1)
- Cases cascade in (0.05s per item)
- Pagination fades up (stagger-5)

---

### DischargesTab

**Purpose:** Discharge management with date-based navigation

**Props:**

```typescript
interface DischargesTabProps {
  startDate?: string | null;
  endDate?: string | null;
}
```

**Note:** DischargesTab has its own date navigation (DayPaginationControls) and uses a separate query (`listMyCasesToday`) that isn't currently enhanced with date range filters from the global preset.

**Future Enhancement:** Could integrate global date range with day pagination.

---

## Data Flow Diagram

### URL State → Component Props → Queries → Backend Filtering

```
URL Query Parameters
├── ?tab=overview
├── ?dateRange=30d
├── ?startDate=2025-10-29
└── ?endDate=2025-11-28
        ↓
useQueryState() hooks in child components
        ↓
Props passed through component tree
        ↓
        ├─ OverviewTab { startDate, endDate }
        ├─ CasesTab { startDate, endDate }
        └─ DischargesTab { startDate, endDate }
        ↓
tRPC query calls
        ├─ getCaseStats({ startDate, endDate })
        ├─ getRecentActivity({ startDate, endDate })
        ├─ getWeeklyActivity({ startDate, endDate })
        ├─ getAllCases({ ..., startDate, endDate })
        └─ [Plus other queries without date filtering]
        ↓
Backend Router Procedures
        ├─ Supabase query builder
        ├─ .gte("created_at", startDate)
        ├─ .lte("created_at", endDate)
        └─ .select() → Data with filters applied
        ↓
Response with filtered data
        ↓
Components re-render with new data
        ↓
UI Updated
```

## Event Flow

### When User Selects Date Preset

```
User clicks dropdown
        ↓
onClick handler triggers
        ↓
handleSelectPreset(preset)
        ↓
   ├─ setDateRange(preset.value)        → Updates URL
   ├─ setStartDate(calculated)          → Updates URL
   └─ setEndDate(calculated)            → Updates URL
        ↓
useQueryState() in child components detect change
        ↓
Child components re-render with new startDate/endDate
        ↓
tRPC queries execute with new parameters
        ↓
Backend filters data
        ↓
UI updates with filtered results
```

### When User Switches Tabs

```
User clicks tab trigger
        ↓
onValueChange handler triggers
        ↓
setTab(value as TabValue)
        ↓
URL updated: ?tab=cases (example)
        ↓
DashboardContentWithTabs detects tab change
        ↓
Conditional rendering switches active tab
        ↓
Active tab component mounts/renders
        ↓
Tab component inherits current startDate/endDate
        ↓
Queries execute for new tab with current date range
        ↓
New tab content displays with date-filtered data
```

## Query Parameter Priority

**Highest Priority:** Tab selection

- Always required
- Defaults to "overview"
- Controls which content renders

**Medium Priority:** Date range preset

- Optional
- Defaults to "all" (no filter)
- Determines which data is shown

**Lowest Priority:** Individual start/end dates

- Auto-calculated from preset
- Rarely set directly by user
- Used in API calls

## Component State Distribution

### Server-Side (URL)

- `tab` - Which dashboard section
- `dateRange` - Which preset selected
- `startDate` - ISO date string (calculated)
- `endDate` - ISO date string (calculated)

### Client-Side Local (Component)

- **CasesTab:**
  - `page` - Current pagination
  - `search` - Search query
  - `statusFilter` - Status filter
  - `sourceFilter` - Source filter

- **DischargesTab:**
  - `currentDate` - Day navigation
  - `currentPage` - Pagination
  - `searchTerm` - Search query
  - `loadingCase` - Loading state
  - `settings` - Discharge settings

### Backend/Query Cache (tRPC)

- Query results (cached)
- Query parameters
- Deduplication state

## Memoization & Performance

### Components That Render Conditionally

- **OverviewTab** - Renders only when tab === "overview"
- **CasesTab** - Renders only when tab === "cases"
- **DischargesTab** - Renders only when tab === "discharges"

### Memoization Strategy

- Tab content components not explicitly memoized
- tRPC handles query result caching
- URL state changes trigger re-renders only when needed

### Query Deduplication

- tRPC automatically dedupes identical queries
- Same parameters = reused cache
- Different date ranges = new queries

## Future Improvements

### 1. Extract Preset Logic

Move date preset calculations to a utility:

```typescript
// lib/utils/date-presets.ts
export const calculateDateRange = (preset: DateRange) => { ... }
```

### 2. Memoize Preset Calculations

```typescript
const dateRange = useMemo(() => {
  return calculateDateRange(preset);
}, [preset]);
```

### 3. Add Custom Date Range

Create modal for arbitrary date selection:

```typescript
interface DateRangeModalProps {
  onSelect: (startDate, endDate) => void;
}
```

### 4. Persist User Preferences

Save preferred date range to user profile:

```typescript
localStorage.setItem("preferredDateRange", preset);
```

### 5. Add Preset Templates

Server-side templates for organization-wide presets:

```typescript
api.dashboard.getDateRangeTemplates.useQuery();
```

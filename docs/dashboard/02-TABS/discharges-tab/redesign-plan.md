# Discharges Tab - Complete Redesign Plan

> **Tab:** Discharges (`/dashboard?tab=discharges`)  
> **Purpose:** Manage automated discharge calls and emails for today's cases  
> **Priority:** High - Core workflow functionality  
> **Status:** In Progress  
> **Last Updated:** 2025-11-28

## 🎯 Redesign Goals

1. ✅ **Reposition Date Navigator** - Move from center to top of page, properly aligned (Completed 2024-11-28)
2. 🔄 **Enhance Day Navigation** - Better date selection and indication (Date picker - future enhancement)
3. 🔄 **Improve Case Cards** - More actionable information and better status display
4. 🔄 **Standardize Actions** - Consistent with other tabs
5. 🔄 **Add Bulk Operations** - Handle multiple cases efficiently
6. 🔄 **Better Status Indicators** - Clear discharge status at a glance
7. 🔄 **Integrate Date Filter** - Respect global date filter button group
8. 🔄 **Add Status Summary** - Quick overview of discharge statuses

## 📊 Current State Analysis

**See:** `current-state-analysis.md` for comprehensive documentation

### Current Layout

```
┌─────────────────────────────────────────┐
│ Discharge Management                     │
│ [Test Mode Badge] [Refresh] [Settings]  │
│                                          │
│ Description: Manage automated follow-up  │
│ calls and emails for today's cases       │
├─────────────────────────────────────────┤
│ Search: [________________________]      │
├─────────────────────────────────────────┤
│ Date Navigation: [←] Today, Nov 28 [→]  │ ← Now at top (✅ Completed)
│ Showing 0 cases                          │
├─────────────────────────────────────────┤
│ Case Cards (Grid)                       │
│ ┌────┐ ┌────┐ ┌────┐                   │
│ │Card│ │Card│ │Card│                   │
│ └────┘ └────┘ └────┘                   │
└─────────────────────────────────────────┘
```

### Issues Identified

1. ✅ **Date Navigator Placement** - Fixed: Now at top (2024-11-28)
2. ✅ **Date Navigator Alignment** - Fixed: Properly aligned (2024-11-28)
3. ⚠️ **Limited Date Navigation** - Only forward/backward, no date picker
4. ⚠️ **No Global Date Filter** - Doesn't respect dashboard date filter button group
5. ⚠️ **Test Mode Prominence** - Could be more obvious
6. ⚠️ **No Bulk Actions** - Must trigger discharges one by one
7. ⚠️ **Case Card Information** - Could show more discharge status details
8. ⚠️ **No Status Summary** - Can't see overview of all discharge statuses
9. ⚠️ **No Quick Filters** - Can't filter by status (ready, pending, completed, failed)

## 🎨 Redesigned Layout

### Enhanced Layout (Future)

```
┌─────────────────────────────────────────┐
│ Discharge Management                     │
│ Manage automated follow-up calls and     │
│ emails for today's cases                 │
│                                          │
│ [Test Mode: ON ⚠️] [Refresh] [Settings]│
├─────────────────────────────────────────┤
│ Date Filter: [All Time] [Day] [3D] [30D]│
│ Date Navigation: [←] Today, Nov 28 [→]   │
│ [📅 Date Picker]                        │
├─────────────────────────────────────────┤
│ Status Summary Bar                       │
│ 12 cases | 8 ready | 2 pending | 1 failed│
│ 6 calls scheduled | 3 emails scheduled  │
├─────────────────────────────────────────┤
│ Search: [________________________]      │
│ Quick Filters: [Ready] [Pending] [All] │
├─────────────────────────────────────────┤
│ Case Cards (Grid)                       │
│ ┌────┐ ┌────┐ ┌────┐                   │
│ │Card│ │Card│ │Card│                   │
│ └────┘ └────┘ └────┘                   │
└─────────────────────────────────────────┘
```

### Enhanced Case Cards

**Current Display:**

```
┌──────────────────────────┐
│ Max (Canine)             │
│ John Smith               │
│ ──────────────────────── │
│ Phone: [value]           │
│ Email: [value]           │
│                          │
│ [Trigger Call]           │
│ [Trigger Email]          │
│ [Edit Patient Info]     │
└──────────────────────────┘
```

**Enhanced Display:**

```
┌──────────────────────────────────────┐
│ 🐕 Max (Canine)                       │
│ 👤 John Smith                         │
│ ──────────────────────────────────── │
│ Contact Information:                  │
│ ✓ Phone: (555) 123-4567               │
│ ✓ Email: john@example.com             │
│                                       │
│ Discharge Status:                     │
│ 📞 Call: ⏳ Scheduled (Nov 29, 10 AM)│
│ 📧 Email: ✅ Sent (Nov 28, 3:15 PM)  │
│                                       │
│ Last Activity: 2 hours ago              │
│                                       │
│ [Trigger Call] [Trigger Email]        │
│ [Edit Info] [View Details]            │
└──────────────────────────────────────┘
```

**Status Indicators:**

- ✅ Green: Valid contact info, Completed
- ⚠️ Amber: Missing contact info, Pending
- ⏳ Blue: In Progress, Scheduled
- ❌ Red: Failed, Error

## 🧩 Component Changes

### 1. Date Navigator Redesign ✅ COMPLETED (2024-11-28)

**Status:** Completed  
**Implementation Date:** 2024-11-28

**Previous State:**

- Positioned in center of page
- Poorly aligned with other elements
- Smaller buttons
- Less prominent

**Current State:**

- Positioned at top of page (after header, before search)
- Properly aligned with other top controls
- Larger buttons (h-10 w-10)
- Enhanced typography
- Better visual hierarchy

**Component Structure:**

```typescript
{/* Top Controls: Date Navigation and Search */}
<div className="space-y-4">
  {/* Date Navigation - Prominently positioned at top */}
  <DayPaginationControls
    currentDate={currentDate}
    onDateChange={(date) => {
      setCurrentDate(date);
      setCurrentPage(1); // Reset to first page when changing date
    }}
    totalItems={casesData.pagination.total}
    isLoading={isLoading}
  />

  {/* Search Filter */}
  <div className="flex items-center gap-2">
    <Search className="absolute top-2.5 left-2.5 h-4 w-4" />
    <Input
      type="search"
      placeholder="Search patients or owners..."
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
      }}
    />
  </div>
</div>
```

**Styling:**

- Buttons: `h-10 w-10` (larger, more clickable)
- Date text: `text-sm sm:text-base` (responsive)
- Container: Proper spacing with `space-y-4`
- Borders: `rounded-lg` for modern look

**Future Enhancements:**

- Calendar date picker modal
- Quick date presets (Today, Yesterday, This Week)
- Enhanced visual indication of current date
- Integration with global date filter

### 2. Integrated Date Filter

**Add:** Global date filter support alongside day navigation

**Implementation:**

```typescript
import { DateFilterButtonGroup } from "~/components/dashboard/date-filter-button-group";
import { useQueryState } from "nuqs";

export function DischargesTab({
  startDate: _startDate,
  endDate: _endDate,
}: {
  startDate?: string | null;
  endDate?: string | null;
}) {
  const [globalDateRange, setGlobalDateRange] = useQueryState("dateRange");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Merge global date filter with day navigation
  const effectiveDateRange = useMemo(() => {
    if (globalDateRange && globalDateRange !== "all") {
      // Use global date filter
      const [startDate, endDate] = getDateRangeFromPreset(globalDateRange);
      return { startDate, endDate };
    }
    // Use day navigation
    const dateString = format(currentDate, "yyyy-MM-dd");
    return { startDate: dateString, endDate: dateString };
  }, [globalDateRange, currentDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>...</div>

      {/* Date Filter + Day Navigation */}
      <div className="space-y-4">
        {/* Global Date Filter */}
        <DateFilterButtonGroup
          value={globalDateRange ?? "all"}
          onChange={(range) => {
            if (range === "all") {
              setGlobalDateRange(null);
            } else {
              setGlobalDateRange(range);
            }
          }}
        />

        {/* Day Navigation (shown when date filter is "all" or "1d") */}
        {(!globalDateRange || globalDateRange === "all" || globalDateRange === "1d") && (
          <DayPaginationControls
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            totalItems={casesData.pagination.total}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Rest of content */}
    </div>
  );
}
```

**Behavior:**

- Global date filter takes precedence when set
- Day navigation shown when filter is "All Time" or "Last Day"
- Day navigation hidden when filter is "3 Days" or "30 Days"
- Smooth transition between modes

### 3. Status Summary Bar (NEW)

**Purpose:** Quick overview of discharge statuses

**Component:** `StatusSummaryBar`

**Display:**

```
┌─────────────────────────────────────────┐
│ Summary: 12 cases | 8 ready | 2 pending │
│ 6 calls scheduled | 3 emails scheduled   │
│ [Filter: All] [Ready] [Pending] [Failed] │
└─────────────────────────────────────────┘
```

**Implementation:**

```typescript
// src/components/dashboard/status-summary-bar.tsx
interface StatusSummaryBarProps {
  totalCases: number;
  readyCases: number;      // Cases with valid contacts, no discharge scheduled
  pendingCases: number;    // Cases with discharge in progress
  completedCases: number;  // Cases with completed discharge
  failedCases: number;     // Cases with failed discharge
  scheduledCalls: number;
  scheduledEmails: number;
  onFilterChange?: (filter: "all" | "ready" | "pending" | "completed" | "failed") => void;
  activeFilter?: string;
}

export function StatusSummaryBar({
  totalCases,
  readyCases,
  pendingCases,
  completedCases,
  failedCases,
  scheduledCalls,
  scheduledEmails,
  onFilterChange,
  activeFilter = "all",
}: StatusSummaryBarProps) {
  return (
    <Card className="border-teal-200/40 bg-gradient-to-br from-teal-50/20 via-white/70 to-white/70">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Summary Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700">{totalCases}</span>
              <span className="text-slate-500"> cases</span>
            </div>
            <div>
              <span className="font-medium text-emerald-700">{readyCases}</span>
              <span className="text-slate-500"> ready</span>
            </div>
            <div>
              <span className="font-medium text-amber-700">{pendingCases}</span>
              <span className="text-slate-500"> pending</span>
            </div>
            <div>
              <span className="font-medium text-blue-700">{scheduledCalls}</span>
              <span className="text-slate-500"> calls</span>
            </div>
            <div>
              <span className="font-medium text-blue-700">{scheduledEmails}</span>
              <span className="text-slate-500"> emails</span>
            </div>
          </div>

          {/* Quick Filters */}
          {onFilterChange && (
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1">
              <Button
                variant={activeFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("all")}
                className={cn(
                  activeFilter === "all" && "bg-[#31aba3] text-white"
                )}
              >
                All
              </Button>
              <Button
                variant={activeFilter === "ready" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("ready")}
              >
                Ready
              </Button>
              <Button
                variant={activeFilter === "pending" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("pending")}
              >
                Pending
              </Button>
              <Button
                variant={activeFilter === "completed" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("completed")}
              >
                Completed
              </Button>
              <Button
                variant={activeFilter === "failed" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("failed")}
              >
                Failed
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Features:**

- Quick stats overview
- Color-coded counts (ready=green, pending=amber, etc.)
- Quick filter buttons
- Responsive layout

**Data Calculation:**

```typescript
const stats = useMemo(() => {
  const ready = cases.filter((c) => {
    const hasValidPhone = hasValidContact(c.patient.owner_phone);
    const hasValidEmail = hasValidContact(c.patient.owner_email);
    const hasNoDischarge =
      c.scheduled_discharge_calls.length === 0 &&
      c.scheduled_discharge_emails.length === 0;
    return (hasValidPhone || hasValidEmail) && hasNoDischarge;
  }).length;

  const pending = cases.filter((c) => {
    return (
      c.scheduled_discharge_calls.some((call) =>
        ["queued", "ringing", "in_progress"].includes(call.status ?? ""),
      ) ||
      c.scheduled_discharge_emails.some((email) => email.status === "queued")
    );
  }).length;

  const completed = cases.filter((c) => {
    return (
      c.scheduled_discharge_calls.some((call) => call.status === "completed") ||
      c.scheduled_discharge_emails.some((email) => email.status === "sent")
    );
  }).length;

  const failed = cases.filter((c) => {
    return (
      c.scheduled_discharge_calls.some((call) => call.status === "failed") ||
      c.scheduled_discharge_emails.some((email) => email.status === "failed")
    );
  }).length;

  const scheduledCalls = cases.reduce((sum, c) => {
    return (
      sum +
      c.scheduled_discharge_calls.filter((call) =>
        ["queued", "ringing", "in_progress", "scheduled"].includes(
          call.status ?? "",
        ),
      ).length
    );
  }, 0);

  const scheduledEmails = cases.reduce((sum, c) => {
    return (
      sum +
      c.scheduled_discharge_emails.filter(
        (email) => email.status === "queued" || email.status === "scheduled",
      ).length
    );
  }, 0);

  return {
    total: cases.length,
    ready,
    pending,
    completed,
    failed,
    scheduledCalls,
    scheduledEmails,
  };
}, [cases]);
```

### 4. Enhanced Case Cards

**Current:** Basic information display  
**New:** Detailed status indicators and better organization

**Enhanced Card Structure:**

```typescript
// Enhanced CaseCard component
<Card className="transition-smooth hover:shadow-lg">
  <CardContent className="p-6">
    {/* Header */}
    <div className="mb-4">
      <div className="flex items-start justify-between">
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
        <StatusBadge status={getCaseWorkflowStatus(caseData)} />
      </div>
    </div>

    {/* Contact Information */}
    <div className="mb-4 space-y-2">
      <h4 className="text-xs font-medium text-slate-500 uppercase">Contact Information</h4>
      <div className="space-y-1">
        <ContactIndicator
          type="phone"
          value={effectivePhone}
          isValid={hasValidContact(effectivePhone)}
          testMode={testModeEnabled}
        />
        <ContactIndicator
          type="email"
          value={effectiveEmail}
          isValid={hasValidContact(effectiveEmail)}
          testMode={testModeEnabled}
        />
      </div>
    </div>

    {/* Discharge Status */}
    <div className="mb-4 space-y-2">
      <h4 className="text-xs font-medium text-slate-500 uppercase">Discharge Status</h4>
      <DischargeStatusIndicator
        type="call"
        calls={caseData.scheduled_discharge_calls}
        testMode={testModeEnabled}
      />
      <DischargeStatusIndicator
        type="email"
        emails={caseData.scheduled_discharge_emails}
        testMode={testModeEnabled}
      />
    </div>

    {/* Last Activity */}
    {lastActivity && (
      <div className="mb-4 text-xs text-slate-500">
        Last activity: {formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}
      </div>
    )}

    {/* Actions */}
    <div className="flex flex-col gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={() => onTriggerCall(caseData.id, caseData.patient.id)}
        disabled={isLoadingCall || !hasValidContact(effectivePhone)}
        className="w-full"
      >
        {isLoadingCall ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Phone className="mr-2 h-4 w-4" />
            Trigger Call
          </>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onTriggerEmail(caseData.id, caseData.patient.id)}
        disabled={isLoadingEmail || !hasValidContact(effectiveEmail)}
        className="w-full"
      >
        {isLoadingEmail ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Trigger Email
          </>
        )}
      </Button>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          className="flex-1"
        >
          <Edit2 className="mr-2 h-4 w-4" />
          Edit Info
        </Button>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="flex-1"
        >
          <Link href={`/dashboard/cases/${caseData.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
```

**Contact Indicator Component:**

```typescript
function ContactIndicator({
  type,
  value,
  isValid,
  testMode,
}: {
  type: "phone" | "email";
  value: string | undefined | null;
  isValid: boolean;
  testMode: boolean;
}) {
  const Icon = type === "phone" ? Phone : Mail;

  if (!isValid) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <span className="text-amber-700">
          {type === "phone" ? "Phone" : "Email"} required
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      <span className="text-slate-700">
        {type === "phone" ? "Phone" : "Email"}: {value}
      </span>
      {testMode && (
        <Badge variant="outline" className="text-xs">
          Test
        </Badge>
      )}
    </div>
  );
}
```

**Discharge Status Indicator Component:**

```typescript
function DischargeStatusIndicator({
  type,
  calls,
  emails,
  testMode,
}: {
  type: "call" | "email";
  calls?: Array<{ status?: string; scheduled_for?: string; ended_at?: string }>;
  emails?: Array<{ status?: string; scheduled_for?: string; sent_at?: string }>;
  testMode: boolean;
}) {
  const items = type === "call" ? calls : emails;
  const Icon = type === "call" ? Phone : Mail;

  if (!items || items.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-slate-400" />
        <span className="text-slate-600">Not scheduled</span>
      </div>
    );
  }

  const latest = items[items.length - 1];
  const status = latest.status;

  if (status === "completed" || status === "sent") {
    const timestamp = type === "call" ? latest.ended_at : latest.sent_at;
    return (
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <span className="text-slate-700">
          {type === "call" ? "Call" : "Email"} completed
        </span>
        {timestamp && (
          <span className="text-xs text-slate-500">
            ({format(new Date(timestamp), "MMM d, h:mm a")})
          </span>
        )}
      </div>
    );
  }

  if (["queued", "ringing", "in_progress"].includes(status ?? "")) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-blue-700">
          {type === "call" ? "Call" : "Email"} in progress
        </span>
      </div>
    );
  }

  if (status === "scheduled" && latest.scheduled_for) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-amber-600" />
        <span className="text-slate-700">
          {type === "call" ? "Call" : "Email"} scheduled
        </span>
        <span className="text-xs text-slate-500">
          ({format(new Date(latest.scheduled_for), "MMM d, h:mm a")})
        </span>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <span className="text-red-700">
          {type === "call" ? "Call" : "Email"} failed
        </span>
      </div>
    );
  }

  return null;
}
```

### 5. Enhanced Test Mode Indicator

**Current:** Small badge next to title  
**New:** More prominent, multiple indicators

**Implementation:**

```typescript
// Banner at top of page (when test mode enabled)
{settings.testModeEnabled && (
  <div className="mb-4 rounded-lg border-2 border-amber-500/50 bg-amber-50/50 p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <TestTube className="h-5 w-5 text-amber-600" />
        <div>
          <p className="font-medium text-amber-900">Test Mode Active</p>
          <p className="text-sm text-amber-700">
            All discharge calls and emails will use test contact information
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/dashboard/settings")}
        className="border-amber-500 text-amber-700 hover:bg-amber-100"
      >
        Configure Settings
      </Button>
    </div>
  </div>
)}

// Badge in header (always visible when enabled)
{settings.testModeEnabled && (
  <Badge
    variant="outline"
    className="animate-pulse-glow gap-1 border-amber-500/50 bg-amber-50 text-amber-700"
  >
    <TestTube className="h-3 w-3" />
    Test Mode Active
  </Badge>
)}
```

### 6. Bulk Actions (Future Enhancement)

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

// Bulk actions bar
{selectedCases.size > 0 && (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-50">
    <div className="flex items-center justify-between max-w-7xl mx-auto">
      <span className="font-medium">
        {selectedCases.size} case{selectedCases.size !== 1 ? "s" : ""} selected
      </span>
      <div className="flex gap-2">
        <Button
          onClick={handleBulkTriggerCalls}
          disabled={!canBulkTriggerCalls}
        >
          Trigger Calls ({selectedCases.size})
        </Button>
        <Button
          variant="outline"
          onClick={handleBulkTriggerEmails}
          disabled={!canBulkTriggerEmails}
        >
          Trigger Emails ({selectedCases.size})
        </Button>
        <Button
          variant="ghost"
          onClick={() => setSelectedCases(new Set())}
        >
          Clear Selection
        </Button>
      </div>
    </div>
  </div>
)}
```

## 🔧 Files to Modify

### Components

1. **`src/components/dashboard/discharges-tab.tsx`** (UPDATE)
   - ✅ Repositioned date navigator (completed)
   - ✅ Improved layout structure (completed)
   - 🔄 Integrate `DateFilterButtonGroup`
   - 🔄 Add `StatusSummaryBar` component
   - 🔄 Add quick filters
   - 🔄 Add bulk selection state (future)
   - 🔄 Enhance test mode visibility

2. **`src/components/dashboard/case-card.tsx`** (ENHANCE)
   - Add detailed contact indicators
   - Add discharge status indicators with timestamps
   - Add last activity timestamp
   - Improve error display
   - Add "View Details" button
   - Enhance visual hierarchy

3. **`src/components/dashboard/day-pagination-controls.tsx`** (ENHANCED ✅)
   - ✅ Improved visual design (completed)
   - ✅ Enhanced typography (completed)
   - ✅ Better alignment (completed)
   - 🔄 Add date picker modal (future)
   - 🔄 Add quick date presets (future)

4. **`src/components/dashboard/status-summary-bar.tsx`** (NEW)
   - Show case statistics
   - Show discharge status summary
   - Quick filter buttons
   - Responsive layout

5. **`src/components/dashboard/contact-indicator.tsx`** (NEW)
   - Display contact information with validation
   - Show test mode indicator
   - Visual feedback for missing contacts

6. **`src/components/dashboard/discharge-status-indicator.tsx`** (NEW)
   - Display call/email status
   - Show timestamps
   - Color-coded status indicators

### Backend

7. **`src/server/api/routers/cases.ts`**
   - Enhance `listMyCasesToday` to support date ranges (when global filter used)
   - Add status summary calculation
   - Add bulk discharge operations (future)

## ✅ Acceptance Criteria

### Completed ✅

- [x] **Date navigator repositioned to top** - Moved from center to top of page after header (2024-11-28)
- [x] **Date navigator properly aligned** - Consistent spacing and alignment with other top controls (2024-11-28)
- [x] **Enhanced date navigator styling** - Larger buttons, better typography, improved visual hierarchy (2024-11-28)

### Phase 1: Date Filter Integration 🔄

- [ ] Date filter button group integrated
- [ ] Works alongside day navigation
- [ ] Proper state management
- [ ] Smooth transitions

### Phase 2: Status Summary Bar 🔄

- [ ] Status summary bar added
- [ ] Shows accurate counts
- [ ] Quick filter buttons functional
- [ ] Responsive layout

### Phase 3: Enhanced Case Cards 🔄

- [ ] Contact indicators with validation
- [ ] Discharge status indicators with timestamps
- [ ] Last activity display
- [ ] Better error messages
- [ ] "View Details" button

### Phase 4: Test Mode Enhancement 🔄

- [ ] Prominent banner when enabled
- [ ] Badge in header
- [ ] Warning on action buttons
- [ ] Settings link prominent

### Phase 5: Bulk Actions (Future) 🔄

- [ ] Checkbox selection on cards
- [ ] Select all functionality
- [ ] Bulk actions bar
- [ ] Bulk trigger calls
- [ ] Bulk trigger emails

### General Requirements ✅

- [ ] All components follow design system
- [ ] Smooth animations and transitions
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading states implemented
- [ ] Error states handled gracefully
- [ ] Keyboard navigation supported
- [ ] Screen reader accessible

## 📐 Visual Priority

**Above the Fold (Current):**

1. Header with test mode indicator
2. ✅ Date Navigator (prominently positioned)
3. Search filter
4. First row of case cards

**Above the Fold (Future):**

1. Header with test mode indicator
2. Date filter button group
3. Day navigation (when applicable)
4. Status summary bar
5. Search + quick filters
6. First row of case cards

**Below the Fold:** Remaining case cards, Pagination (if needed)

## 🎨 Design Specifications

### Status Indicators

**Color Coding:**

- ✅ Green (`text-emerald-600`): Ready/Completed
- ⚠️ Amber (`text-amber-600`): Needs Attention/Pending
- ❌ Red (`text-red-600`): Failed/Error
- ⏳ Blue (`text-blue-600`): In Progress

### Case Cards

**Structure:**

- Gradient background (standard card style)
- Status badges for discharge calls/emails
- Contact validation icons (✓ or ⚠️)
- Clear action buttons
- Error messages in colored callout boxes
- Hover: Subtle shadow increase

### Status Summary Bar

**Container:**

```css
border-teal-200/40
bg-gradient-to-br from-teal-50/20 via-white/70 to-white/70
```

**Stats:**

- Color-coded by status type
- Responsive layout (stacks on mobile)

### Test Mode Banner

**Container:**

```css
border-2 border-amber-500/50
bg-amber-50/50
```

**Content:**

- Icon + text
- Settings button
- Prominent but not intrusive

## 🔄 State Management

### URL Query Parameters

```typescript
// Date filter
dateRange?: "all" | "1d" | "3d" | "30d";
startDate?: string;  // YYYY-MM-DD
endDate?: string;    // YYYY-MM-DD

// Day navigation (when dateRange is "all" or "1d")
date?: string;  // YYYY-MM-DD

// Status filter
statusFilter?: "all" | "ready" | "pending" | "completed" | "failed";

// Search
search?: string;
```

### Local State

```typescript
const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
const [statusFilter, setStatusFilter] = useState<
  "all" | "ready" | "pending" | "completed" | "failed"
>("all");
```

## 📱 Responsive Behavior

### Mobile (< 640px)

- Date filter: Stacked or horizontal scroll
- Day navigation: Full width
- Status summary: Stacked stats
- Case cards: 1 column
- Bulk actions: Full-width bar at bottom

### Tablet (640px - 1024px)

- Date filter: Horizontal
- Day navigation: Standard
- Status summary: 2 columns
- Case cards: 2 columns

### Desktop (> 1024px)

- Date filter: All buttons visible
- Day navigation: Standard
- Status summary: Single row
- Case cards: 3 columns

## 🚀 Performance Optimizations

1. **Memoized Stats** - Calculate status summary with `useMemo`
2. **Optimistic Updates** - Update UI immediately on actions
3. **Debounced Search** - Wait 300ms after typing stops
4. **Lazy Loading** - Load more cases on scroll (future)

## 📝 Related Documentation

- **Current State Analysis:** `current-state-analysis.md`
- **Date Filter Component:** `../../03-COMPONENTS/date-filter-button-group.md`
- **Day Pagination Component:** `src/components/dashboard/day-pagination-controls.tsx`
- **Case Card Component:** `src/components/dashboard/case-card.tsx`
- **Design System:** `../../01-GENERAL/design-system.md`

---

**Next Steps:**

1. Integrate date filter button group
2. Create status summary bar component
3. Enhance case cards with detailed indicators
4. Improve test mode visibility
5. Add bulk actions (future)

**Status:** Date navigator completed, other enhancements in progress

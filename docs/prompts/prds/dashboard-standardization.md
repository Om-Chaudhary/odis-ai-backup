# PRD: Dashboard Standardization & Enterprise Polish

> Unify inbound/outbound dashboards with shared components, consistent patterns, and enterprise-grade UI polish.

## Overview

The inbound and outbound dashboards share significant architectural patterns but have diverged in implementation. This PRD standardizes both dashboards with:

1. Shared component extraction to reduce duplication
2. Consistent UI patterns across both views
3. Missing enterprise features (row actions, bulk selection)
4. Visual polish and accessibility improvements

**Track**: Frontend-only (no backend changes required)
**Parallel-Safe**: Yes - can be implemented alongside Appointment Workflow PRD

---

## Implementation Guidelines

### Using Claude Code Design Skill

For all UI component work in this PRD, **use the `/frontend-design` skill** to ensure enterprise-grade design quality:

```
/frontend-design Create a polished row action menu dropdown with icons, hover states, and keyboard navigation
```

**When to invoke `/frontend-design`**:

- Creating new shared components (DASH-01, DASH-03, DASH-05)
- Updating visual presentation (DASH-02, DASH-08)
- Adding new UI patterns (DASH-04, DASH-06)
- Any component that will be visible to end users

### Enterprise Design Principles

All components must meet these enterprise standards:

1. **Visual Consistency**
   - Use existing design tokens (colors, spacing, typography)
   - Match glassmorphism theme (backdrop-blur, subtle gradients)
   - Consistent icon sizing (h-4 w-4 for inline, h-5 w-5 for actions)

2. **Interaction Polish**
   - Hover states on all interactive elements
   - Focus rings for keyboard navigation (ring-2 ring-primary)
   - Smooth transitions (transition-colors, 150ms)
   - Loading states with skeletons, not spinners

3. **Accessibility**
   - ARIA labels on all interactive elements
   - Keyboard navigation support (Tab, Enter, Escape)
   - Focus trap in modals/dropdowns
   - Color contrast ratios (WCAG AA minimum)

4. **Responsive Behavior**
   - Graceful column hiding in compact mode
   - Touch-friendly tap targets (min 44px)
   - Text truncation with tooltips for overflow

5. **Empty/Error States**
   - Meaningful empty state messaging
   - Graceful error handling with recovery options
   - Em dash (—) for missing values, never blank

---

## Current State Analysis

### Duplicated Components

| Component    | Inbound                    | Outbound                       | Differences                 |
| ------------ | -------------------------- | ------------------------------ | --------------------------- |
| Split Layout | `inbound-split-layout.tsx` | `outbound-split-layout.tsx`    | Nearly identical, 55% split |
| Table        | `inbound-table.tsx`        | `outbound-case-table.tsx`      | Outbound has selection      |
| Bulk Actions | None                       | `outbound-bulk-action-bar.tsx` | Only in outbound            |
| Row Actions  | None                       | None                           | Missing in both             |

### Pattern Inconsistencies

| Pattern            | Inbound       | Outbound      |
| ------------------ | ------------- | ------------- |
| Contact Display    | Phone primary | Phone primary |
| Checkbox Selection | No            | Yes           |
| Bulk Actions       | No            | Yes           |
| Row Actions Menu   | No            | No            |
| Duration Format    | Smart format  | Smart format  |

---

## Goals

1. **Extract shared components** to `components/dashboard/shared/`
2. **Add missing features** to inbound (selection, bulk actions, row actions)
3. **Standardize patterns** across both dashboards
4. **Improve UX** with contact hierarchy and row actions

---

## Implementation Tickets

### DASH-01: Extract DashboardSplitLayout

**Priority**: P0 (Blocker for other work)

**Description**: Create unified split layout component from duplicate implementations.

**Current Files**:

- `apps/web/src/components/dashboard/inbound/inbound-split-layout.tsx`
- `apps/web/src/components/dashboard/outbound/outbound-split-layout.tsx`

**New File**:

- `apps/web/src/components/dashboard/shared/layouts/dashboard-split-layout.tsx`

**Props Interface**:

```typescript
interface DashboardSplitLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  showRightPanel: boolean;
  onCloseRightPanel: () => void;
  selectedRowPosition?: { top: number; height: number } | null;
  leftPanelMinSize?: number; // Default: 40
  rightPanelDefaultSize?: number; // Default: 55
  className?: string;
}
```

**Implementation Notes**:

- Use `react-resizable-panels` (already installed)
- Maintain glassmorphism styling (backdrop-blur, gradients)
- Support tab connection effect for selected row
- Close button (X) in top-right of right panel

**Migration Path**:

1. Create new shared component
2. Update `inbound-client.tsx` to use shared component
3. Update outbound to use shared component
4. Delete old duplicate files

**Acceptance Criteria**:

- [ ] Both dashboards use shared component
- [ ] Visual appearance unchanged
- [ ] Tab connection effect works
- [ ] Keyboard close (Escape) works
- [ ] Resize behavior identical

---

### DASH-02: Update CallerDisplay - Name Primary

**Priority**: P1

**Description**: When contact name is known, display it prominently with phone secondary.

**File**: `apps/web/src/components/dashboard/inbound/table/table-cells.tsx`

**Current Behavior**:

```tsx
// Phone always primary
<span className="text-sm font-semibold">{formattedPhone}</span>
<span className="text-xs text-muted-foreground">
  {petName && <><PawPrint /> {petName}</>}
  {callerName && ` · ${callerName}`}
</span>
```

**New Behavior**:

```tsx
// Name primary when available
{
  callerName ? (
    <>
      <span className="text-sm font-semibold">{callerName}</span>
      <span className="text-muted-foreground text-xs">{formattedPhone}</span>
    </>
  ) : (
    <span className="text-sm font-semibold">{formattedPhone}</span>
  );
}
{
  petName && (
    <div className="text-muted-foreground flex items-center gap-1 text-xs">
      <PawPrint className="h-3 w-3" />
      <span>{petName}</span>
    </div>
  );
}
```

**Edge Cases**:

- No caller name: Show phone as primary
- Very long names: Truncate with ellipsis (`truncate` class)
- Loading state: Show phone while name loads

**Acceptance Criteria**:

- [ ] Name displays primary when available
- [ ] Phone displays primary when no name
- [ ] Pet name always shows below
- [ ] Loading state shows skeleton or phone

---

### DASH-03: Create RowActionMenu Component

**Priority**: P1

**Description**: Reusable dropdown menu for row actions in both dashboards.

**New File**: `apps/web/src/components/dashboard/shared/row-action-menu.tsx`

**Props Interface**:

```typescript
interface RowAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

interface RowActionMenuProps {
  actions: RowAction[];
  triggerClassName?: string;
}
```

**Standard Actions (Inbound)**:

```typescript
const inboundRowActions: RowAction[] = [
  { id: "play", label: "Play Recording", icon: Play, onClick: () => {} },
  {
    id: "transcript",
    label: "View Transcript",
    icon: FileText,
    onClick: () => {},
  },
  { id: "note", label: "Add Note", icon: StickyNote, onClick: () => {} },
  { id: "copy", label: "Copy Phone Number", icon: Copy, onClick: () => {} },
];
```

**Implementation Notes**:

- Use `DropdownMenu` from `@odis-ai/shared/ui`
- Trigger is `MoreVertical` (⋮) icon button
- Stop propagation on trigger click (prevent row selection)
- Show toast on copy action

**Acceptance Criteria**:

- [ ] Menu opens on click
- [ ] Actions fire correctly
- [ ] Copy shows toast confirmation
- [ ] Does not trigger row selection

---

### DASH-04: Add Row Actions to Inbound Table

**Priority**: P1 (Depends on DASH-03)

**Description**: Add action menu column to inbound call table.

**File**: `apps/web/src/components/dashboard/inbound/table/rows/call-row.tsx`

**Changes**:

1. Add actions column (last column, 8% width)
2. Import and use `RowActionMenu` component
3. Implement action handlers:
   - **Play Recording**: Open recording URL in new tab or modal player
   - **View Transcript**: Scroll to transcript in detail panel (or select row)
   - **Add Note**: Open note input dialog (requires notes field - see DASH-09)
   - **Copy Phone**: Copy to clipboard, show toast

**Column Width Adjustments**:

```tsx
// Full width
Caller: 28%  // Was 32%
Outcome: 18% // Was 20%
Duration: 12% // Was 14%
Date/Time: 20% // Was 22%
Actions: 8%   // NEW

// Compact mode
Caller: 40%  // Was 45%
Outcome: 22% // Was 25%
Date/Time: 26% // Was 30%
Actions: 12%  // NEW (or hide)
```

**Acceptance Criteria**:

- [ ] Action menu visible on each row
- [ ] All 4 actions work correctly
- [ ] Menu hidden in compact mode (optional)
- [ ] Keyboard accessible

---

### DASH-05: Generalize BulkActionBar Component

**Priority**: P1

**Description**: Extract outbound bulk action bar to shared component with generic actions.

**Current File**: `apps/web/src/components/dashboard/outbound/outbound-bulk-action-bar.tsx`

**New File**: `apps/web/src/components/dashboard/shared/bulk-action-bar.tsx`

**Props Interface**:

```typescript
interface BulkAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive";
  loading?: boolean;
  disabled?: boolean;
}

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
  isHidden?: boolean;
  className?: string;
}
```

**Outbound Usage** (migration):

```tsx
<BulkActionBar
  selectedCount={selectedCaseIds.length}
  onClearSelection={() => setSelectedForBulk(new Set())}
  actions={[
    {
      id: "schedule",
      label: "Schedule Multiple",
      icon: Calendar,
      onClick: handleScheduleMultiple,
    },
    {
      id: "cancel",
      label: "Cancel Scheduled",
      icon: XCircle,
      onClick: handleCancelSelected,
      variant: "destructive",
      loading: isCancelling,
    },
  ]}
/>
```

**Inbound Usage** (new):

```tsx
<BulkActionBar
  selectedCount={selectedCallIds.length}
  onClearSelection={() => setSelectedCalls(new Set())}
  actions={[
    {
      id: "confirm",
      label: "Mark All Confirmed",
      icon: CheckCircle,
      onClick: handleBulkConfirm,
    },
    {
      id: "export",
      label: "Export Selected",
      icon: Download,
      onClick: handleExportSelected,
    },
  ]}
/>
```

**Acceptance Criteria**:

- [ ] Outbound migrated to shared component
- [ ] Actions are configurable via props
- [ ] Styling consistent
- [ ] Hidden when count is 0

---

### DASH-06: Add Checkbox Selection to Inbound Table

**Priority**: P1 (Depends on DASH-05)

**Description**: Add multi-select capability to inbound table matching outbound pattern.

**Files**:

- `apps/web/src/components/dashboard/inbound/table/inbound-table.tsx`
- `apps/web/src/components/dashboard/inbound/table/rows/call-row.tsx`
- `apps/web/src/components/dashboard/inbound/inbound-client.tsx`

**Implementation Pattern** (from outbound):

```tsx
// Parent state
const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set());

// Toggle handler
const handleToggleBulkSelect = (callId: string) => {
  setSelectedForBulk((prev) => {
    const next = new Set(prev);
    if (next.has(callId)) {
      next.delete(callId);
    } else {
      next.add(callId);
    }
    return next;
  });
};

// Select all handler
const handleSelectAll = () => {
  if (selectedForBulk.size === calls.length) {
    setSelectedForBulk(new Set());
  } else {
    setSelectedForBulk(new Set(calls.map((c) => c.id)));
  }
};
```

**Header Checkbox**:

```tsx
<Checkbox
  checked={selectedForBulk.size === calls.length && calls.length > 0}
  onCheckedChange={handleSelectAll}
  aria-label="Select all"
/>
```

**Row Checkbox**:

```tsx
<Checkbox
  checked={selectedForBulk.has(call.id)}
  onCheckedChange={() => onToggleBulkSelect(call.id)}
  onClick={(e) => e.stopPropagation()} // Prevent row selection
  aria-label={`Select ${call.customer_phone}`}
/>
```

**Visibility**:

- Show checkboxes only when detail panel is closed (`!isCompact`)
- Or always show (user preference)

**Acceptance Criteria**:

- [ ] Header checkbox toggles all
- [ ] Row checkboxes toggle individual
- [ ] Clicking checkbox doesn't select row
- [ ] Count displays in bulk action bar
- [ ] Clear selection works

---

### DASH-07: Standardize Duration Formatting

**Priority**: P2

**Description**: Ensure consistent duration display across both dashboards.

**File**: `libs/shared/util/src/format-duration.ts` (or create)

**Format Rules**:

```typescript
function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "—";

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

// Examples:
// 45 → "45s"
// 90 → "1m 30s"
// 3665 → "1h 1m"
```

**Files to Update**:

- `apps/web/src/components/dashboard/inbound/table/table-cells.tsx`
- `apps/web/src/components/dashboard/outbound/` (if different)

**Acceptance Criteria**:

- [ ] Duration format consistent
- [ ] Null/undefined shows em dash
- [ ] Hours display correctly

---

### DASH-08: Empty State Handling

**Priority**: P2

**Description**: Ensure missing values display consistently.

**Changes**:

- Missing outcome: Show `—` (em dash) instead of blank
- Missing duration: Show `—`
- Missing caller name: Phone only (already handled)

**Implementation**:

```tsx
// In OutcomeBadge or cell renderer
if (!outcome || outcome === "null") {
  return <span className="text-muted-foreground">—</span>;
}
```

**Acceptance Criteria**:

- [ ] No blank cells in table
- [ ] Em dash used consistently
- [ ] Muted color for placeholders

---

### DASH-09: Add Notes Field Support

**Priority**: P3 (Optional enhancement)

**Description**: Enable "Add Note" action by supporting notes on inbound calls.

**Schema Check**: Does `inbound_vapi_calls` have a notes field?

- If yes: Implement note UI
- If no: Add to Appointment Workflow PRD (schema change)

**UI Components**:

1. Note input dialog (modal)
2. Note display in detail panel
3. Note indicator in table row

**This ticket is contingent on schema availability.**

---

### DASH-10: Search Placeholder Improvement

**Priority**: P3

**Description**: Add helpful placeholder text to inbound search.

**File**: `apps/web/src/components/dashboard/inbound/inbound-client.tsx` (or search component)

**Current**: Generic placeholder or none
**New**: `"Search by phone, name, or notes..."`

**Acceptance Criteria**:

- [ ] Placeholder text displays
- [ ] Search works across specified fields

---

## File Structure After Implementation

```
apps/web/src/components/dashboard/
├── shared/
│   ├── layouts/
│   │   └── dashboard-split-layout.tsx    # NEW (from DASH-01)
│   ├── bulk-action-bar.tsx               # NEW (from DASH-05)
│   ├── row-action-menu.tsx               # NEW (from DASH-03)
│   ├── data-table/
│   │   └── data-table-empty-state.tsx    # Existing
│   ├── attention-badge-group.tsx         # Existing
│   └── index.ts                          # Updated exports
│
├── inbound/
│   ├── inbound-client.tsx                # Updated (selection state)
│   ├── inbound-split-layout.tsx          # DELETE (moved to shared)
│   └── table/
│       ├── table-cells.tsx               # Updated (DASH-02)
│       ├── inbound-table.tsx             # Updated (DASH-06)
│       └── rows/
│           └── call-row.tsx              # Updated (DASH-04, DASH-06)
│
└── outbound/
    ├── outbound-split-layout.tsx         # DELETE (moved to shared)
    ├── outbound-bulk-action-bar.tsx      # DELETE (moved to shared)
    └── outbound-case-table.tsx           # Updated (use shared)
```

---

## Testing Checklist

### Manual Testing

- [ ] Inbound dashboard loads without errors
- [ ] Outbound dashboard loads without errors
- [ ] Split layout resize works in both
- [ ] Row selection works in both
- [ ] Checkbox selection works in inbound
- [ ] Bulk action bar appears on selection
- [ ] Row action menu works
- [ ] Copy phone shows toast
- [ ] All keyboard navigation preserved

### Automated Tests

- [ ] `nx test web` passes
- [ ] No TypeScript errors
- [ ] No lint errors

---

## Dependencies

**None** - This PRD is self-contained and requires no backend changes.

**Parallel-Safe With**: Appointment Workflow PRD

- Merge point: `call-detail.tsx` (both PRDs modify)
- Resolution: Appointment PRD adds confirmation panel section, this PRD adds row actions

---

## Rollout

1. Merge shared components first (DASH-01, DASH-03, DASH-05)
2. Migrate outbound to shared components
3. Add features to inbound (DASH-02, DASH-04, DASH-06)
4. Polish tickets (DASH-07, DASH-08, DASH-09, DASH-10)

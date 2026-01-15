# Inbound Dashboard Enterprise Polish

Code Segment: Dashboard UI
Description: Comprehensive UI/UX improvements to bring the After Hours Inbound Dashboard to enterprise-grade polish. Covers header/navigation, sidebar, data table enhancements, filtering, and visual refinements.
PRD Date: January 15, 2026
Priority: High
Status: Draft

## Overview

This PRD outlines UI/UX improvements to elevate the After Hours Inbound Dashboard to enterprise-grade polish, with a focus on **appointment confirmation workflow** for clinics without direct PIM integrations.

## Current State

The inbound dashboard displays call records with columns (Caller, Outcome, Duration, Date/Time) and sidebar navigation with outcome filters. Key gaps:

- No workflow for confirming appointments booked via AI
- Phone number displayed primary even when contact name is known
- Missing row actions and bulk operations
- No shared component architecture between inbound/outbound dashboards

## Goals

1. **Appointment Review Workflow**: Enable staff to easily view and confirm AI-booked appointments in their external PIM
2. **Enterprise Polish**: Standardize patterns across inbound/outbound dashboards
3. **Shared Components**: Extract reusable components to reduce code duplication
4. **Visual Consistency**: Professional polish matching enterprise expectations

---

## Part 1: Appointment Confirmation Workflow

### Context

Most veterinary clinics use a PIM (Practice Information Management) system that doesn't have direct API integration with OdisAI. When our AI agent books an appointment during an after-hours call, clinic staff need to:

1. See the appointment details captured by the AI
2. Manually enter it into their PIM system
3. Mark it as confirmed in OdisAI

Only clinics with direct integrations (e.g., IDEXX Neo) will have automatic scheduling.

### Proposed Workflow States

**For Appointment Outcomes:**

```
Pending Review → Confirmed → (optional) Cancelled
```

- **Pending Review**: AI booked an appointment, staff hasn't confirmed in PIM yet
- **Confirmed**: Staff manually entered in PIM and confirmed in OdisAI
- **Cancelled**: Appointment was cancelled (client called back, no-show, etc.)

### UI Requirements

**Sidebar Filter Addition:**

- Add "Pending Confirmation" filter under Appointments in `InboundNavigation`
- Badge count showing unconfirmed appointments
- Visual urgency indicator (dot or highlight) for appointments awaiting confirmation

**Appointment Detail Panel:**

- Clear display of appointment details captured:
  - Requested date/time
  - Pet name & species
  - Reason for visit
  - Client contact info
  - Any special notes from call
- **Primary CTA**: "Mark as Confirmed" button
- **Secondary**: "Mark as Cancelled" with reason dropdown
- Timestamp of when confirmed + who confirmed

**Table Enhancements:**

- Appointment rows show confirmation status badge
- "Pending" appointments have subtle highlight (similar to outbound attention styling)
- Quick-confirm action in row menu for fast workflow

### Schema Changes Needed

```sql
-- Add to inbound_vapi_calls or create appointment_confirmations table
confirmation_status: 'pending' | 'confirmed' | 'cancelled'
confirmed_at: timestamp
confirmed_by: user_id
cancellation_reason: text (nullable)
```

### API Endpoints Needed

```tsx
// New tRPC procedures
inboundCalls.confirmAppointment({ callId, notes? })
inboundCalls.cancelAppointment({ callId, reason })
inboundCalls.getPendingAppointments({ clinicId })
```

---

## Part 2: Shared Component Architecture

### Components to Extract

Create shared components in `components/dashboard/shared/` that both inbound and outbound can use:

**1. `DashboardSplitLayout`**

- Extract from `InboundSplitLayout` / `OutboundSplitLayout`
- Props: `leftPanel`, `rightPanel`, `showRightPanel`, `onClose`
- Consistent glassmorphism styling

**2. `BulkActionBar`**

- Extract from `OutboundBulkActionBar`
- Generic actions passed as props
- Floating bottom bar pattern

**3. `DataTableWithSelection`**

- Checkbox column, select-all, keyboard navigation
- Consistent row styling (selected, hover, attention states)
- Already partially exists in `shared/data-table/`

**4. `RowActionMenu`**

- Generic dropdown menu for row actions
- Consistent styling and positioning

### File Structure

```
components/dashboard/shared/
├── layouts/
│   └── dashboard-split-layout.tsx    # NEW
├── data-table/
│   ├── data-table-with-selection.tsx # ENHANCE
│   ├── row-action-menu.tsx           # NEW
│   └── bulk-action-bar.tsx           # MOVE from outbound
└── index.ts
```

---

## Part 3: Table Improvements

### Contact Display Hierarchy

**Change**: When contact name exists, show name as primary.

Update `CallerDisplay` in `table-cells.tsx`:

```tsx
// Current: Phone primary, name secondary
// New: Name primary (when available), phone secondary

<div className="flex flex-col gap-0.5">
  {callerName ? (
    <>
      <span className="text-sm font-semibold">{callerName}</span>
      <span className="text-muted-foreground text-xs">{formattedPhone}</span>
    </>
  ) : (
    <span className="text-sm font-semibold">{formattedPhone}</span>
  )}
  {petName && (
    <div className="text-muted-foreground flex items-center gap-1 text-xs">
      <PawPrint className="h-3 w-3" />
      <span>{petName}</span>
    </div>
  )}
</div>
```

### Row Actions Menu

Add `⋮` menu to each row with actions:

- **Play Recording** → Opens VAPI recording URL
- **View Transcript** → Scrolls to/opens transcript in detail panel
- **Add Note** → Opens note input (requires notes field)
- **Copy Phone Number** → Copies to clipboard with toast confirmation

### Bulk Selection

- Add checkbox column (reuse pattern from `OutboundCaseTable`)
- Bulk actions for appointments: "Mark All as Confirmed"
- Bulk export for appointments

---

## Part 4: Filtering & Navigation

### Why No Date Range Picker

Inbound after-hours calls have significantly lower volume than discharge cases:

- Outbound: Dozens of discharges per day → needs date navigation
- Inbound: ~10-30 calls per day → paginated list is sufficient

The existing pagination (25/50/100 per page) with outcome filters in sidebar provides adequate navigation. Adding a date picker would add complexity without proportional benefit.

### Double Sidebar is Sufficient

Current architecture:

- **Left Sidebar 1**: Main navigation (Overview, Inbound, Outbound, Settings)
- **Left Sidebar 2**: Contextual filters (All Calls, Appointments, Callback, Info, Emergency)

This pattern is sufficient. Quick filter chips above the table would be redundant.

### Search Enhancement

- Add placeholder text: "Search by phone, name, or notes..."
- Ensure search works across: `customer_phone`, caller name (from lookup), transcript content

---

## Part 5: Export Functionality

### Scope: Appointments Only

Export is specifically for **appointment data** to help with:

- Reconciliation with PIM system
- Weekly reports to clinic owners
- Audit trail of AI-booked appointments

### Export Fields

```
Date, Time, Client Name, Phone, Pet Name, Appointment Type,
Requested DateTime, Confirmation Status, Confirmed By, Notes
```

### UI

- Export button in header when viewing Appointments filter
- Options: CSV, PDF
- Respects current filter (e.g., "Export Pending Only")

---

## Part 6: Visual Polish

### Duration Formatting

Standardize to smart formatting:

- Under 1 minute: `45s`
- 1+ minutes: `1m 27s`
- Consistent across table

### Outcome Badge Colors (Already Implemented)

Verify current `OutcomeBadge` colors match semantic meaning:

- 🔴 Emergency Triage → `orange-500` (high urgency)
- 🟡 Callback Request → `amber-500` (action needed)
- 🔵 Clinic Info → `blue-500` (informational)
- 🟢 Scheduled Appointment → `emerald-500` (positive)
- ⚫ Cancelled → `slate-500` (neutral)

### Empty States

- Empty outcome: Show `—` (em dash) instead of blank
- Zero calls: Already handled by `DataTableEmptyState`

---

## Implementation Plan

### Sprint 1: Foundation

| Ticket | Description                                               | Estimate |
| ------ | --------------------------------------------------------- | -------- |
| INB-01 | Extract `DashboardSplitLayout` shared component           | 2h       |
| INB-02 | Update `CallerDisplay` - name primary when available      | 1h       |
| INB-03 | Add row action menu component                             | 3h       |
| INB-04 | Implement row actions (recording, transcript, copy phone) | 2h       |

### Sprint 2: Appointment Workflow

| Ticket | Description                                                  | Estimate |
| ------ | ------------------------------------------------------------ | -------- |
| INB-05 | Schema: Add confirmation_status fields to inbound_vapi_calls | 1h       |
| INB-06 | API: confirmAppointment, cancelAppointment procedures        | 2h       |
| INB-07 | API: getPendingAppointments with count                       | 1h       |
| INB-08 | UI: "Pending Confirmation" sidebar filter with badge         | 2h       |
| INB-09 | UI: Appointment confirmation panel in CallDetail             | 4h       |
| INB-10 | UI: Confirmation status badge in table rows                  | 1h       |

### Sprint 3: Bulk & Export

| Ticket | Description                                  | Estimate |
| ------ | -------------------------------------------- | -------- |
| INB-11 | Extract `BulkActionBar` to shared components | 2h       |
| INB-12 | Add checkbox selection to inbound table      | 2h       |
| INB-13 | Bulk "Mark as Confirmed" for appointments    | 2h       |
| INB-14 | Export appointments to CSV                   | 3h       |
| INB-15 | Add note field to calls + Add Note action    | 2h       |

### Sprint 4: Polish

| Ticket | Description                          | Estimate |
| ------ | ------------------------------------ | -------- |
| INB-16 | Standardize duration formatting      | 1h       |
| INB-17 | Empty outcome state handling         | 0.5h     |
| INB-18 | Search placeholder + scope indicator | 0.5h     |
| INB-19 | Verify outcome badge color semantics | 1h       |

---

## Design Assets Needed

- [ ] Lo-fi mockup: Appointment confirmation detail panel
- [ ] Lo-fi mockup: Row with action menu expanded
- [ ] Lo-fi mockup: Pending confirmation badge in sidebar
- [ ] Lo-fi mockup: Bulk action bar for inbound

---

## Success Metrics

- **Appointment confirmation time**: Time from call end to marked confirmed
- **Pending appointments age**: How long appointments sit unconfirmed
- **Export usage**: Track CSV downloads
- **Staff feedback**: Qualitative on workflow efficiency

---

## Open Questions (Resolved)

| Question                        | Resolution                                                |
| ------------------------------- | --------------------------------------------------------- |
| Date range picker needed?       | No - pagination sufficient for inbound volume             |
| Quick filter chips above table? | No - double sidebar is sufficient                         |
| Row actions scope?              | Play Recording, View Transcript, Add Note, Copy Phone     |
| Export scope?                   | Appointments only, not all calls                          |
| Workflow states?                | Pending Review → Confirmed → Cancelled (for appointments) |

---

## Technical References

**Existing Components to Reference:**

- `OutboundBulkActionBar` → Pattern for bulk actions
- `OutboundCaseTable` → Checkbox selection pattern
- `OutboundSplitLayout` → Split panel pattern
- `CallerDisplay` → Contact display (needs update)
- `OutcomeBadge` → Status badge styling

**Files to Modify:**

- `apps/web/src/components/dashboard/inbound/table/table-cells.tsx`
- `apps/web/src/components/dashboard/inbound/table/inbound-table.tsx`
- `apps/web/src/components/dashboard/inbound/detail/call-detail.tsx`
- `apps/web/src/components/dashboard/shell/inbound-navigation.tsx`
- `apps/web/src/server/api/routers/inbound/`

**New Files:**

- `apps/web/src/components/dashboard/shared/layouts/dashboard-split-layout.tsx`
- `apps/web/src/components/dashboard/shared/bulk-action-bar.tsx`
- `apps/web/src/components/dashboard/shared/row-action-menu.tsx`
- `apps/web/src/components/dashboard/inbound/detail/appointment-confirmation.tsx`

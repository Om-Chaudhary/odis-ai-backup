# PRD: Appointment Confirmation Workflow

> Enable clinic staff to review and confirm AI-booked appointments for manual entry into their PIM system.

## Overview

Most veterinary clinics use Practice Information Management (PIM) systems without direct API integration. When ODIS AI books an appointment during an after-hours call, staff need to:

1. See appointment details captured by the AI
2. Manually enter the appointment into their PIM
3. Mark it as confirmed in ODIS

This PRD implements a complete appointment review and confirmation workflow.

**Track**: Full-stack (schema + API + UI changes)
**Parallel-Safe**: Yes - can be implemented alongside Dashboard Standardization PRD

---

## Implementation Guidelines

### Using Claude Code Design Skill

For all UI component work in this PRD, **use the `/frontend-design` skill** to ensure enterprise-grade design quality:

```
/frontend-design Create an appointment confirmation card with patient details, action buttons, and status indicators
```

**When to invoke `/frontend-design`**:

- Creating the confirmation panel (APT-07)
- Designing status badges and indicators (APT-08)
- Building the sidebar filter with badge counts (APT-06)
- Any user-facing UI element

### Enterprise Design Principles

All components must meet these enterprise standards:

1. **Visual Urgency Hierarchy**
   - Pending appointments should draw attention (subtle amber highlight)
   - Confirmed appointments should recede (neutral styling)
   - Cancelled appointments clearly marked (strike-through or muted)

2. **Action Clarity**
   - Primary action prominent (Mark as Confirmed)
   - Destructive actions require confirmation (Cancel)
   - Clear affordances for all interactive elements

3. **Information Density**
   - All appointment details visible without scrolling
   - Logical grouping (client info, pet info, schedule info)
   - Scannable format for quick review

4. **Workflow Efficiency**
   - Bulk actions for processing multiple appointments
   - Keyboard shortcuts for power users
   - Clear visual feedback on state changes

---

## Workflow States

### Appointment Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI BOOKS APPOINTMENT                       │
│                              ↓                                  │
│                    status: 'pending'                            │
│                              ↓                                  │
│         ┌────────────────────┴────────────────────┐             │
│         ↓                                         ↓             │
│   Staff confirms in PIM                   Client cancels        │
│         ↓                                         ↓             │
│   status: 'confirmed'                     status: 'cancelled'   │
│   confirmed_by: user_id                   cancellation_reason   │
│   confirmed_at: timestamp                                       │
│         ↓                                                       │
│   (Future: Auto-verify with integrated PIM)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Status Definitions

| Status        | Description                            | UI Treatment                          |
| ------------- | -------------------------------------- | ------------------------------------- |
| `pending`     | AI booked, awaiting staff confirmation | Amber highlight, "Needs Review" badge |
| `confirmed`   | Staff entered in PIM and confirmed     | Green badge, shows who/when confirmed |
| `cancelled`   | Appointment cancelled                  | Muted styling, shows reason           |
| `rescheduled` | Date/time changed (existing)           | Blue badge, shows original vs new     |

---

## Schema Changes

### APT-01: Add Confirmation Audit Fields

**Priority**: P0 (Blocker for API work)

**Migration**: `supabase/migrations/YYYYMMDD_add_confirmation_fields.sql`

```sql
-- Add confirmation tracking fields to vapi_bookings
ALTER TABLE vapi_bookings
ADD COLUMN confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN confirmed_at TIMESTAMPTZ,
ADD COLUMN cancellation_reason TEXT;

-- Add index for pending appointments query
CREATE INDEX idx_vapi_bookings_pending_clinic
ON vapi_bookings (clinic_id, status)
WHERE status = 'pending';

-- Add index for confirmation audit
CREATE INDEX idx_vapi_bookings_confirmed_by
ON vapi_bookings (confirmed_by)
WHERE confirmed_by IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN vapi_bookings.confirmed_by IS 'User who confirmed appointment was entered in PIM';
COMMENT ON COLUMN vapi_bookings.confirmed_at IS 'Timestamp when staff confirmed appointment';
COMMENT ON COLUMN vapi_bookings.cancellation_reason IS 'Reason for cancellation (client requested, no-show, etc.)';
```

**After Migration**:

1. Run `pnpm update-types` to regenerate TypeScript types
2. Verify types in `libs/shared/types/src/database.types.ts`

**Acceptance Criteria**:

- [ ] Migration applies cleanly
- [ ] RLS policies still work
- [ ] Types regenerated correctly

---

## API Changes

### APT-02: Add confirmAppointment Procedure

**Priority**: P0

**File**: `apps/web/src/server/api/routers/inbound/procedures/confirm-appointment.ts`

**Input Schema**:

```typescript
export const confirmAppointmentInput = z.object({
  bookingId: z.string().uuid(),
  notes: z.string().optional(),
});
```

**Implementation**:

```typescript
export const confirmAppointment = protectedProcedure
  .input(confirmAppointmentInput)
  .mutation(async ({ ctx, input }) => {
    const { bookingId, notes } = input;
    const userId = ctx.session.user.id;
    const clinicId = ctx.session.user.user_metadata.clinic_id;

    const supabase = await createServerClient();

    // Verify booking belongs to user's clinic
    const { data: booking, error: fetchError } = await supabase
      .from("vapi_bookings")
      .select("id, clinic_id, status")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Appointment not found",
      });
    }

    if (booking.clinic_id !== clinicId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not authorized to confirm this appointment",
      });
    }

    if (booking.status === "confirmed") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Appointment is already confirmed",
      });
    }

    // Update to confirmed
    const { data, error } = await supabase
      .from("vapi_bookings")
      .update({
        status: "confirmed",
        confirmed_by: userId,
        confirmed_at: new Date().toISOString(),
        metadata: notes
          ? { ...booking.metadata, confirmation_notes: notes }
          : booking.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to confirm appointment",
      });
    }

    return { success: true, booking: data };
  });
```

**Acceptance Criteria**:

- [ ] Only pending appointments can be confirmed
- [ ] Clinic authorization enforced
- [ ] confirmed_by and confirmed_at set correctly
- [ ] Returns updated booking

---

### APT-03: Add cancelAppointment Procedure

**Priority**: P0

**File**: `apps/web/src/server/api/routers/inbound/procedures/cancel-appointment.ts`

**Input Schema**:

```typescript
export const cancelAppointmentInput = z.object({
  bookingId: z.string().uuid(),
  reason: z.enum([
    "client_requested",
    "no_show",
    "duplicate_booking",
    "incorrect_information",
    "other",
  ]),
  otherReason: z.string().optional(),
});
```

**Implementation**: Similar to confirmAppointment but sets:

- `status: 'cancelled'`
- `cancellation_reason: reason` (or otherReason if reason is 'other')

**Acceptance Criteria**:

- [ ] Reason is required
- [ ] "Other" reason allows free text
- [ ] Cannot cancel already cancelled appointments

---

### APT-04: Add getPendingAppointmentCount Procedure

**Priority**: P1

**File**: `apps/web/src/server/api/routers/inbound/procedures/get-pending-count.ts`

**Implementation**:

```typescript
export const getPendingAppointmentCount = protectedProcedure.query(
  async ({ ctx }) => {
    const clinicId = ctx.session.user.user_metadata.clinic_id;
    const supabase = await createServerClient();

    const { count, error } = await supabase
      .from("vapi_bookings")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .eq("status", "pending");

    if (error) {
      return { count: 0 };
    }

    return { count: count ?? 0 };
  },
);
```

**Usage**: Powers sidebar badge showing pending count

**Acceptance Criteria**:

- [ ] Returns accurate count
- [ ] Scoped to user's clinic
- [ ] Handles errors gracefully (returns 0)

---

### APT-05: Add bulkConfirmAppointments Procedure

**Priority**: P2

**File**: `apps/web/src/server/api/routers/inbound/procedures/bulk-confirm.ts`

**Input Schema**:

```typescript
export const bulkConfirmAppointmentsInput = z.object({
  bookingIds: z.array(z.string().uuid()).min(1).max(50),
});
```

**Implementation**:

- Verify all bookings belong to user's clinic
- Verify all bookings are pending
- Update all in single query
- Return success/failure counts

**Acceptance Criteria**:

- [ ] Max 50 appointments per batch
- [ ] Partial success handling (some may already be confirmed)
- [ ] Returns count of confirmed vs skipped

---

## UI Changes

### APT-06: Add Pending Confirmation Sidebar Filter

**Priority**: P1

**File**: `apps/web/src/components/dashboard/shell/inbound-navigation.tsx`

**Use `/frontend-design`** to create this component.

**Changes**:

1. Add "Pending Confirmation" nav item under Appointments section
2. Badge showing pending count from `getPendingAppointmentCount`
3. Visual urgency indicator (amber dot when count > 0)

**Design Specifications**:

```tsx
// Nav item structure
<NavItem
  href={`/dashboard/${clinicSlug}/inbound?outcome=appointment&status=pending`}
  icon={ClipboardCheck}
  label="Pending Confirmation"
  badge={pendingCount > 0 ? pendingCount : undefined}
  badgeVariant={pendingCount > 0 ? "warning" : "default"}
  showDot={pendingCount > 0}
  dotColor="amber"
/>
```

**Data Fetching**:

```tsx
// In inbound-navigation.tsx or parent
const { data: pendingData } = api.inbound.getPendingAppointmentCount.useQuery(
  undefined,
  { refetchInterval: 30000 }, // Refresh every 30 seconds
);
const pendingCount = pendingData?.count ?? 0;
```

**Acceptance Criteria**:

- [ ] Badge shows correct count
- [ ] Count updates when appointments confirmed
- [ ] Visual indicator draws attention
- [ ] Links to filtered view

---

### APT-07: Create Appointment Confirmation Panel

**Priority**: P1 (Core feature)

**File**: `apps/web/src/components/dashboard/inbound/detail/appointment-confirmation.tsx`

**Use `/frontend-design`** to create this component.

**Component Structure**:

```tsx
interface AppointmentConfirmationProps {
  booking: VapiBooking;
  onConfirm: () => void;
  onCancel: (reason: string) => void;
  isConfirming?: boolean;
  isCancelling?: boolean;
}

export function AppointmentConfirmation({
  booking,
  onConfirm,
  onCancel,
  isConfirming,
  isCancelling,
}: AppointmentConfirmationProps) {
  // ...
}
```

**Layout Sections**:

1. **Header**
   - Status badge (Pending Review / Confirmed / Cancelled)
   - Confirmation number (if exists)

2. **Appointment Details Card**

   ```
   ┌─────────────────────────────────────────┐
   │ 📅 Requested Appointment                │
   ├─────────────────────────────────────────┤
   │ Date:      Monday, Jan 20, 2026         │
   │ Time:      9:30 AM                       │
   │ Type:      Wellness Exam                 │
   └─────────────────────────────────────────┘
   ```

3. **Client Information Card**

   ```
   ┌─────────────────────────────────────────┐
   │ 👤 Client Information                   │
   ├─────────────────────────────────────────┤
   │ Name:      Sarah Johnson                 │
   │ Phone:     (555) 123-4567               │
   │ New Client: Yes                          │
   └─────────────────────────────────────────┘
   ```

4. **Pet Information Card**

   ```
   ┌─────────────────────────────────────────┐
   │ 🐾 Pet Information                      │
   ├─────────────────────────────────────────┤
   │ Name:      Bella                         │
   │ Species:   Dog                           │
   │ Breed:     Golden Retriever              │
   └─────────────────────────────────────────┘
   ```

5. **Reason/Notes Section**
   - Reason for visit from AI call
   - Any additional notes

6. **Action Buttons**

   ```tsx
   <div className="flex gap-3 border-t pt-4">
     <Button
       onClick={onConfirm}
       disabled={isConfirming || booking.status === "confirmed"}
       className="flex-1"
     >
       {isConfirming ? (
         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
       ) : (
         <CheckCircle className="mr-2 h-4 w-4" />
       )}
       Mark as Confirmed
     </Button>
     <Button
       variant="outline"
       onClick={() => setShowCancelDialog(true)}
       disabled={isCancelling || booking.status === "cancelled"}
     >
       <XCircle className="mr-2 h-4 w-4" />
       Cancel
     </Button>
   </div>
   ```

7. **Confirmation Audit (when confirmed)**
   ```
   ┌─────────────────────────────────────────┐
   │ ✓ Confirmed by Jane Smith               │
   │   January 15, 2026 at 8:45 AM           │
   └─────────────────────────────────────────┘
   ```

**Cancel Dialog**:

- Modal with reason dropdown
- "Other" option shows text input
- Confirm cancellation button (destructive variant)

**Acceptance Criteria**:

- [ ] All appointment details displayed clearly
- [ ] Confirm button works and shows loading state
- [ ] Cancel requires reason selection
- [ ] Confirmed state shows audit info
- [ ] Cannot re-confirm already confirmed

---

### APT-08: Add Confirmation Status Badge to Table

**Priority**: P2

**File**: `apps/web/src/components/dashboard/inbound/table/rows/call-row.tsx`

**Use `/frontend-design`** for badge styling.

**Changes**:

1. For calls with associated appointments, show confirmation status
2. Badge appears next to or replaces outcome badge for appointment outcomes

**Badge Variants**:

```tsx
const statusBadgeConfig = {
  pending: {
    label: "Needs Confirmation",
    variant: "warning", // amber
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    variant: "success", // green
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    variant: "secondary", // gray
    icon: XCircle,
  },
};
```

**Row Highlight for Pending**:

```tsx
<tr
  className={cn(
    'hover:bg-muted/50 transition-colors',
    isPendingConfirmation && 'bg-amber-50/50 dark:bg-amber-950/20'
  )}
>
```

**Acceptance Criteria**:

- [ ] Status badge visible on appointment rows
- [ ] Pending rows have subtle highlight
- [ ] Badge color matches semantic meaning

---

### APT-09: Add Quick Confirm Action to Row Menu

**Priority**: P2 (Depends on DASH-03 from Standardization PRD)

**Description**: Add "Mark as Confirmed" to row action menu for pending appointments.

**Implementation**:

```tsx
const appointmentActions: RowAction[] =
  hasAssociatedBooking && booking?.status === "pending"
    ? [
        {
          id: "quick-confirm",
          label: "Mark as Confirmed",
          icon: CheckCircle,
          onClick: () => handleQuickConfirm(booking.id),
        },
        ...baseActions,
      ]
    : baseActions;
```

**Acceptance Criteria**:

- [ ] Only shows for pending appointments
- [ ] Confirms immediately (no modal)
- [ ] Shows success toast
- [ ] Updates badge/highlight

---

### APT-10: Implement Appointment Export

**Priority**: P3

**Files**:

- `apps/web/src/server/api/routers/inbound/procedures/export-appointments.ts`
- `apps/web/src/components/dashboard/inbound/export-button.tsx`

**Export Fields**:

```typescript
interface AppointmentExport {
  date: string; // "2026-01-20"
  time: string; // "9:30 AM"
  clientName: string;
  clientPhone: string;
  petName: string;
  species: string;
  reason: string;
  status: string;
  confirmedBy: string; // User email or name
  confirmedAt: string; // Formatted date/time
  notes: string;
}
```

**Export Options**:

- Format: CSV (primary), PDF (future)
- Scope: Current filter (all, pending only, confirmed only)
- Date range: Last 7 days, 30 days, custom

**UI**:

```tsx
<Button variant="outline" onClick={handleExport}>
  <Download className="mr-2 h-4 w-4" />
  Export
</Button>
```

**Acceptance Criteria**:

- [ ] CSV downloads correctly
- [ ] All fields populated
- [ ] Respects current filter
- [ ] Phone numbers formatted

---

## Integration with Detail Panel

### APT-11: Wire Confirmation Panel to CallDetail

**Priority**: P1 (Depends on APT-07)

**File**: `apps/web/src/components/dashboard/inbound/detail/call-detail.tsx`

**Changes**:

1. Check if call has associated vapi_booking
2. If yes, fetch booking details
3. Render `AppointmentConfirmation` component in detail panel

**Data Flow**:

```tsx
// In call-detail.tsx
const { data: booking } = api.inbound.getBookingByCallId.useQuery(
  { vapiCallId: call.vapi_call_id },
  { enabled: !!call.vapi_call_id },
);

// In JSX, after call summary
{
  booking && (
    <AppointmentConfirmation
      booking={booking}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}
```

**New Procedure Needed**: `getBookingByCallId`

```typescript
export const getBookingByCallId = protectedProcedure
  .input(z.object({ vapiCallId: z.string() }))
  .query(async ({ ctx, input }) => {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from("vapi_bookings")
      .select("*")
      .eq("vapi_call_id", input.vapiCallId)
      .maybeSingle();
    return data;
  });
```

**Acceptance Criteria**:

- [ ] Confirmation panel appears for calls with bookings
- [ ] Actions update booking state
- [ ] Panel updates after confirmation

---

## File Structure After Implementation

```
apps/web/src/
├── server/api/routers/inbound/
│   ├── procedures/
│   │   ├── confirm-appointment.ts      # NEW (APT-02)
│   │   ├── cancel-appointment.ts       # NEW (APT-03)
│   │   ├── get-pending-count.ts        # NEW (APT-04)
│   │   ├── bulk-confirm.ts             # NEW (APT-05)
│   │   ├── get-booking-by-call.ts      # NEW (APT-11)
│   │   ├── export-appointments.ts      # NEW (APT-10)
│   │   └── ... existing procedures
│   ├── schemas.ts                      # Updated with new schemas
│   └── router.ts                       # Updated with new procedures
│
├── components/dashboard/
│   ├── inbound/
│   │   ├── detail/
│   │   │   ├── call-detail.tsx         # Updated (APT-11)
│   │   │   └── appointment-confirmation.tsx  # NEW (APT-07)
│   │   ├── table/
│   │   │   └── rows/
│   │   │       └── call-row.tsx        # Updated (APT-08, APT-09)
│   │   └── export-button.tsx           # NEW (APT-10)
│   └── shell/
│       └── inbound-navigation.tsx      # Updated (APT-06)
│
supabase/migrations/
└── YYYYMMDD_add_confirmation_fields.sql  # NEW (APT-01)
```

---

## Testing Checklist

### Unit Tests

- [ ] `confirmAppointment` validates input and authorization
- [ ] `cancelAppointment` requires reason
- [ ] `getPendingAppointmentCount` returns correct count
- [ ] `bulkConfirmAppointments` handles partial success

### Integration Tests

- [ ] Confirmation flow end-to-end
- [ ] Sidebar badge updates on confirmation
- [ ] Export generates valid CSV

### Manual Testing

- [ ] Create test appointment via VAPI webhook mock
- [ ] Confirm appointment and verify audit fields
- [ ] Cancel appointment with different reasons
- [ ] Bulk confirm multiple appointments
- [ ] Export appointments and verify data

---

## Rollout Plan

1. **Phase 1: Schema** (APT-01)
   - Apply migration
   - Regenerate types
   - Verify no breaking changes

2. **Phase 2: API** (APT-02, APT-03, APT-04, APT-05, APT-11)
   - Implement all new procedures
   - Add to router
   - Test with existing UI

3. **Phase 3: UI** (APT-06, APT-07, APT-08)
   - Build confirmation panel
   - Add sidebar filter
   - Add status badges

4. **Phase 4: Polish** (APT-09, APT-10)
   - Quick confirm action
   - Export functionality

---

## Dependencies

**Requires**: Schema migration (APT-01) before API work
**Parallel-Safe With**: Dashboard Standardization PRD

### Merge Points with Dashboard Standardization PRD

Both PRDs modify these files:

- `call-detail.tsx` - Add confirmation panel (APT) vs row actions (DASH)
- `call-row.tsx` - Add status badge (APT) vs action menu (DASH)

**Resolution Strategy**:

- PRDs can be implemented in parallel
- Final merge combines both changes
- Confirmation panel goes after call summary
- Status badge goes before/with outcome badge

---

## Success Metrics

| Metric            | Target      | Measurement                         |
| ----------------- | ----------- | ----------------------------------- |
| Confirmation time | < 5 min avg | Time from call end to confirmed     |
| Pending age       | < 24 hours  | Max time appointments sit pending   |
| Confirmation rate | > 95%       | Pending → Confirmed (not cancelled) |
| User satisfaction | Positive    | Staff feedback on workflow          |

# Outbound Discharge Sidebar Panel Audit

**Date**: 2024-12-24
**Scope**: `apps/web/src/components/dashboard/outbound/` sidebar/detail panel components

---

## 1. Component Architecture Overview

### File Hierarchy

```
outbound-case-detail.tsx           # Main container component
└── detail/
    ├── patient-owner-card.tsx     # Header: patient info, owner contact, status badge, delivery indicators
    ├── status-overview-card.tsx   # Scheduled/delivered status display
    ├── communications-intelligence-card.tsx  # AI call insights (summary, attention, urgent)
    ├── smart-action-section.tsx   # Context-aware action buttons
    │   ├── ready-to-send-actions.tsx
    │   ├── scheduled-actions.tsx
    │   ├── partial-delivery-actions.tsx
    │   └── completed-summary.tsx
    ├── communication-preview.tsx  # Call script/transcript + email preview cards
    │   └── communication-tabs/
    │       ├── call-tab-content.tsx
    │       └── email-tab-content.tsx
    └── workflow/                  # Timeline visualization (collapsible)
```

### Data Flow

```
list-cases.ts (tRPC procedure)
  └── deriveDeliveryStatus() → phoneSent, emailSent values
        ↓
OutboundCaseDetail (main component)
  └── transforms phoneSent/emailSent to booleans for child components
        ↓
Child Components (each has own conditional logic)
```

---

## 2. Status Value Mappings

### Source: `list-cases.ts:228-248`

```typescript
function deriveDeliveryStatus(status, hasContactInfo):
  - !hasContactInfo           → "not_applicable"
  - !status                   → null
  - "completed" | "sent"      → "sent"
  - "queued" | "ringing" | "in_progress" → "pending"
  - "failed"                  → "failed"
  - default                   → null
```

### Type Definition: `types.ts:79-84`

```typescript
export type DeliveryStatus =
  | "sent" // Successfully delivered
  | "pending" // Queued, waiting
  | "failed" // Failed to deliver
  | "not_applicable" // No contact info
  | null; // Not scheduled
```

---

## 3. Component Conditional Logic Analysis

### 3.1 PatientOwnerCard (`patient-owner-card.tsx:159-170`)

**DeliveryIndicator component:**

```typescript
function DeliveryIndicator({ status }: { status: DeliveryStatus }) {
  if (status === "sent")    → ✅ Green CheckCircle2
  if (status === "failed")  → ❌ Red XCircle
  if (status === "pending") → 🕐 Amber Clock
  return null;              // for null or "not_applicable"
}
```

**Current Behavior**: ✅ Correct - shows appropriate icons based on actual status

**Issue**: Does NOT show any indicator for `"not_applicable"` or `null` - user cannot distinguish between "not scheduled" and "no contact info"

---

### 3.2 StatusOverviewCard (`status-overview-card.tsx`)

**Visibility Logic (line 189-191):**

```typescript
if (!scheduledCallFor && !scheduledEmailFor) {
  return null; // Only shows if something is scheduled
}
```

**DeliveryItem Status Logic (line 62-83):**

```typescript
// CRITICAL BUG HERE
if (isPast || deliveryStatus === "sent") {
  status = "sent"; // Shows "delivered" ❌
  statusText = `${label} delivered`;
  statusColor = "green";
} else if (deliveryStatus === "failed") {
  status = "failed";
} else if (deliveryStatus === "pending") {
  status = "pending";
} else {
  // Default: "scheduled"
}
```

**🐛 BUG IDENTIFIED**: Line 68 - `isPast` check

- If `scheduledFor` time is in the past, it shows "delivered" regardless of actual delivery status
- This causes false "delivered" indicators when:
  - Call was scheduled but never executed
  - Call is still "queued" but past scheduled time
  - Email was scheduled but sending failed silently

---

### 3.3 CommunicationsIntelligenceCard (`communications-intelligence-card.tsx`)

**Visibility Logic (lines 51-65):**

```typescript
// Don't show if no call data available
if (!scheduledCall) return null;

const hasIntelligence = Boolean(
  scheduledCall.summary ??
  urgentReasonSummary ??
  needsAttention ??
  (attentionTypes && attentionTypes.length > 0),
);

// Don't show if no intelligence available
if (!hasIntelligence) return null;
```

**Current Behavior**: ✅ Correct - only shows when call exists AND has intelligence data

**Issue**: None identified - properly guards against showing empty card

---

### 3.4 SmartActionSection (`smart-action-section.tsx`)

**Routing Logic:**

```typescript
// Lines 65-79: Ready to Send
if (status === "ready" || status === "pending_review") {
  return <ReadyToSendActions ... />
}

// Lines 83-128: Scheduled
if (status === "scheduled") {
  // Check for partial scheduled state
  if (isPartialScheduled) {
    return <PartialDeliveryActions ... />
  }
  return <ScheduledActions ... />
}

// Lines 132-170: Completed or Failed
if (status === "completed" || status === "failed") {
  if (isPartialDelivery) {
    return <PartialDeliveryActions ... />
  }
  return <CompletedSummary ... />
}
```

**Partial Detection Logic (lines 91-97, 136-138):**

```typescript
const isPartialScheduled =
  ((phoneSent || phoneScheduled) &&
    !(emailSent || emailScheduled) &&
    hasOwnerEmail) ||
  ((emailSent || emailScheduled) &&
    !(phoneSent || phoneScheduled) &&
    hasOwnerPhone);

const isPartialDelivery =
  (phoneSent && !emailSent && hasOwnerEmail) ||
  (!phoneSent && emailSent && hasOwnerPhone);
```

**Current Behavior**: ✅ Mostly correct

**Issue**: The `phoneSent`/`emailSent` variables here are derived from `phoneStatus === "sent"` which is correct, but the naming is confusing since these are checking the _status_ not whether something was _scheduled_.

---

### 3.5 CommunicationPreview (`communication-preview.tsx`)

**Always renders both cards** - no visibility guards based on delivery status.

**Call Card Title Logic (line 62-63):**

```typescript
const callTitle =
  phoneSent && scheduledCall?.transcript ? "Call Transcript" : "Call Script";
```

**Email Card Title Logic (line 173):**

```typescript
<CardTitle>
  {emailSent ? "Email Sent" : "Email Preview"}
</CardTitle>
```

**CallTabContent Logic (`call-tab-content.tsx:38-108`):**

```typescript
// If phone was sent, show audio player
if (phoneWasSent && caseData.scheduledCall) {
  return <CallRecordingPlayer ... />
}

// If phone can be sent, show call script
if (phoneCanBeSent) {
  return <Card>Call Script</Card>
}

// If no phone available
if (!hasOwnerPhone) {
  return <Card>Call Not Available</Card>
}

// Fallback: show call script
return <Card>Call Script</Card>
```

**🐛 ISSUES IDENTIFIED**:

1. **Always shows both cards**: Even when phone/email is `"not_applicable"`, both preview cards appear
2. **Missing "scheduled" state display**: No visual indicator when something is scheduled but not yet sent
3. **Redundant fallback**: Lines 91-107 duplicate the `phoneCanBeSent` case

---

### 3.6 Main Component (outbound-case-detail.tsx)

**Key Variable Derivations (lines 174-198):**

```typescript
const isSentCase =
  caseData.status === "completed" || caseData.status === "failed";
const isScheduled = caseData.status === "scheduled";

const phoneSent = caseData.phoneSent === "sent"; // boolean conversion
const emailSent = caseData.emailSent === "sent"; // boolean conversion

const showScheduledCard =
  caseData.scheduledCallFor ?? caseData.scheduledEmailFor;

const showActionSection =
  caseData.status === "ready" ||
  caseData.status === "pending_review" ||
  caseData.status === "scheduled" ||
  caseData.status === "failed" ||
  (phoneSent && !emailSent && hasOwnerEmail) ||
  (!phoneSent && emailSent && hasOwnerPhone);
```

**🐛 ISSUES IDENTIFIED**:

1. **Loss of granularity**: Converting `DeliveryStatus` to boolean loses the distinction between `"pending"`, `"scheduled"`, and `null`
2. **Inconsistent naming**: `phoneSent` boolean doesn't match `caseData.phoneSent` which is a `DeliveryStatus`

---

## 4. Status Matrix: Current vs Expected Behavior

### Legend

- ✅ Correct behavior
- ⚠️ Suboptimal but functional
- ❌ Bug/incorrect behavior

### 4.1 Phone NOT_SENT × Email NOT_SENT

| Component                     | Expected                 | Actual                         | Status              |
| ----------------------------- | ------------------------ | ------------------------------ | ------------------- |
| PatientOwnerCard - Phone icon | No indicator (gray dash) | No indicator                   | ⚠️ Could be clearer |
| PatientOwnerCard - Email icon | No indicator (gray dash) | No indicator                   | ⚠️ Could be clearer |
| StatusOverviewCard            | Not visible              | Not visible                    | ✅                  |
| CommunicationsIntelligence    | Not visible              | Not visible (no scheduledCall) | ✅                  |
| SmartActionSection            | ReadyToSendActions       | ReadyToSendActions             | ✅                  |
| CommunicationPreview - Call   | "Call Script" card       | "Call Script" card             | ✅                  |
| CommunicationPreview - Email  | "Email Preview" card     | "Email Preview" card           | ✅                  |

### 4.2 Phone NOT_SENT × Email SCHEDULED

| Component                     | Expected                              | Actual                            | Status                     |
| ----------------------------- | ------------------------------------- | --------------------------------- | -------------------------- |
| PatientOwnerCard - Phone icon | No indicator                          | No indicator                      | ⚠️                         |
| PatientOwnerCard - Email icon | 🕐 Amber Clock (pending)              | 🕐 Amber Clock                    | ✅                         |
| StatusOverviewCard            | Shows email scheduled time            | Shows email scheduled (if future) | ✅                         |
| StatusOverviewCard - if past  | "Email pending"                       | "Email delivered" ❌              | ❌ **BUG**                 |
| SmartActionSection            | PartialDeliveryActions                | PartialDeliveryActions            | ✅                         |
| CommunicationPreview - Call   | "Call Script"                         | "Call Script"                     | ✅                         |
| CommunicationPreview - Email  | "Email Preview" (scheduled indicator) | "Email Preview"                   | ⚠️ Missing scheduled state |

### 4.3 Phone NOT_SENT × Email SENT

| Component                     | Expected                    | Actual                 | Status |
| ----------------------------- | --------------------------- | ---------------------- | ------ |
| PatientOwnerCard - Phone icon | No indicator                | No indicator           | ⚠️     |
| PatientOwnerCard - Email icon | ✅ Green check              | ✅ Green check         | ✅     |
| StatusOverviewCard            | "Email delivered" with time | "Email delivered"      | ✅     |
| SmartActionSection            | PartialDeliveryActions      | PartialDeliveryActions | ✅     |
| CommunicationPreview - Email  | "Email Sent" card           | "Email Sent" card      | ✅     |

### 4.4 Phone SCHEDULED × Email NOT_SENT

| Component                     | Expected                        | Actual                             | Status            |
| ----------------------------- | ------------------------------- | ---------------------------------- | ----------------- |
| PatientOwnerCard - Phone icon | 🕐 Amber Clock                  | 🕐 Amber Clock                     | ✅                |
| PatientOwnerCard - Email icon | No indicator                    | No indicator                       | ⚠️                |
| StatusOverviewCard            | "Call scheduled for [time]"     | Shows if future                    | ✅                |
| StatusOverviewCard - if past  | "Call pending"                  | "Call delivered" ❌                | ❌ **BUG**        |
| SmartActionSection            | PartialDeliveryActions          | PartialDeliveryActions             | ✅                |
| CommunicationsIntelligence    | Not visible (no transcript yet) | Depends on scheduledCall existence | ⚠️ May show empty |

### 4.5 Phone SCHEDULED × Email SCHEDULED

| Component                    | Expected             | Actual               | Status     |
| ---------------------------- | -------------------- | -------------------- | ---------- |
| PatientOwnerCard - Phone     | 🕐 Amber             | 🕐 Amber             | ✅         |
| PatientOwnerCard - Email     | 🕐 Amber             | 🕐 Amber             | ✅         |
| StatusOverviewCard           | Both scheduled times | Both shown if future | ✅         |
| StatusOverviewCard - if past | "Pending" for both   | "Delivered" ❌       | ❌ **BUG** |
| SmartActionSection           | ScheduledActions     | ScheduledActions     | ✅         |

### 4.6 Phone SCHEDULED × Email SENT

| Component                | Expected                        | Actual                 | Status |
| ------------------------ | ------------------------------- | ---------------------- | ------ |
| PatientOwnerCard - Phone | 🕐 Amber                        | 🕐 Amber               | ✅     |
| PatientOwnerCard - Email | ✅ Green                        | ✅ Green               | ✅     |
| StatusOverviewCard       | Call scheduled, Email delivered | Correct if call future | ✅     |
| SmartActionSection       | PartialDeliveryActions          | PartialDeliveryActions | ✅     |

### 4.7 Phone SENT × Email NOT_SENT

| Component                   | Expected                      | Actual                       | Status |
| --------------------------- | ----------------------------- | ---------------------------- | ------ |
| PatientOwnerCard - Phone    | ✅ Green                      | ✅ Green                     | ✅     |
| PatientOwnerCard - Email    | No indicator                  | No indicator                 | ⚠️     |
| StatusOverviewCard          | "Call delivered [time]"       | Shows correctly              | ✅     |
| CommunicationsIntelligence  | Shows call insights           | Shows if has data            | ✅     |
| CommunicationPreview - Call | "Call Transcript" with player | Correct if transcript exists | ✅     |
| SmartActionSection          | PartialDeliveryActions        | PartialDeliveryActions       | ✅     |

### 4.8 Phone SENT × Email SCHEDULED

| Component                          | Expected                               | Actual               | Status     |
| ---------------------------------- | -------------------------------------- | -------------------- | ---------- |
| All                                | Combination of 4.7 and scheduled email | Mostly correct       | ✅         |
| StatusOverviewCard - Email if past | "Email pending"                        | "Email delivered" ❌ | ❌ **BUG** |

### 4.9 Phone SENT × Email SENT (Fully Complete)

| Component                  | Expected                  | Actual               | Status |
| -------------------------- | ------------------------- | -------------------- | ------ |
| PatientOwnerCard           | Both ✅ green             | Both ✅ green        | ✅     |
| StatusOverviewCard         | Both delivered with times | Both delivered       | ✅     |
| CommunicationsIntelligence | Full insights             | Shows if data exists | ✅     |
| CommunicationPreview       | Transcript + Email Sent   | Correct              | ✅     |
| SmartActionSection         | CompletedSummary          | CompletedSummary     | ✅     |

---

## 5. Identified Bugs Summary

### Critical Bugs

#### BUG-001: False "Delivered" Status Display

**Location**: `status-overview-card.tsx:68`

```typescript
if (isPast || deliveryStatus === "sent")  // isPast check is incorrect
```

**Impact**: Shows "delivered" for items that are past their scheduled time but weren't actually delivered
**Severity**: HIGH - Misleads users about delivery status

### Medium Bugs

#### BUG-002: No Visual Distinction for "Not Applicable" vs "Not Scheduled"

**Location**: `patient-owner-card.tsx:159-170`
**Impact**: Users cannot tell if a channel wasn't sent because there's no contact info vs it just hasn't been scheduled
**Severity**: MEDIUM - UX confusion

#### BUG-003: Communication Preview Cards Always Visible

**Location**: `communication-preview.tsx`
**Impact**: Shows Call/Email cards even when contact info is missing
**Severity**: LOW - Unnecessary UI clutter

### Low Priority Issues

#### ISSUE-001: Boolean Conversion Loses Status Granularity

**Location**: `outbound-case-detail.tsx:197-198`
**Impact**: Child components can't distinguish between "pending", "scheduled", "null"
**Severity**: LOW - Architectural tech debt

#### ISSUE-002: Missing "Scheduled" Visual State in Previews

**Location**: `communication-preview.tsx`
**Impact**: No indication that content is scheduled vs just a preview
**Severity**: LOW - Missing feature

---

## 6. Proposed Fixes

### Fix BUG-001: StatusOverviewCard False Delivery

```typescript
// status-overview-card.tsx - Replace lines 62-83

function DeliveryItem({ ..., deliveryStatus, ... }) {
  // Determine status based ONLY on actual delivery status, not time
  let status: DeliveryItemStatus = "scheduled";
  let statusText = `${label} scheduled`;
  let statusColor: "purple" | "green" | "red" | "amber" = "purple";
  let StatusIcon = Clock;

  if (deliveryStatus === "sent") {
    status = "sent";
    statusText = `${label} delivered`;
    statusColor = "green";
    StatusIcon = CheckCircle2;
  } else if (deliveryStatus === "failed") {
    status = "failed";
    statusText = `${label} failed`;
    statusColor = "red";
    StatusIcon = XCircle;
  } else if (deliveryStatus === "pending") {
    // Distinguish between "scheduled for future" and "ready now"
    const scheduledDate = new Date(scheduledFor);
    const isPast = scheduledDate < new Date();

    if (isPast) {
      status = "pending";
      statusText = `${label} pending`;
      statusColor = "amber";
      StatusIcon = AlertCircle;
    } else {
      status = "scheduled";
      statusText = `${label} scheduled`;
      statusColor = "purple";
      StatusIcon = Clock;
    }
  }
  // ... rest of component
}
```

### Fix BUG-002: Add "Not Applicable" Indicator

```typescript
// patient-owner-card.tsx - Update DeliveryIndicator

function DeliveryIndicator({ status }: { status: DeliveryStatus }) {
  if (status === "sent")    return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  if (status === "failed")  return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  if (status === "pending") return <Clock className="h-3.5 w-3.5 text-amber-500" />;
  if (status === "not_applicable") return <MinusCircle className="h-3.5 w-3.5 text-slate-300" />;
  // null = not scheduled yet, show nothing or subtle indicator
  return null;
}
```

### Fix BUG-003: Conditional Communication Preview Cards

```typescript
// communication-preview.tsx - Add visibility guards

export function CommunicationPreview({ ..., hasOwnerPhone, hasOwnerEmail, ... }) {
  return (
    <div className="space-y-4">
      {/* Only show call card if phone contact exists */}
      {hasOwnerPhone && (
        <Card>
          {/* Call Script/Transcript card */}
        </Card>
      )}

      {/* Only show email card if email contact exists */}
      {hasOwnerEmail && (
        <Card>
          {/* Email Preview card */}
        </Card>
      )}
    </div>
  );
}
```

---

## 7. Recommended Component Restructure

### Create Single Source of Truth for Status Display

```typescript
// NEW FILE: detail/utils/status-display.ts

export type ChannelState =
  | "not_applicable"  // No contact info
  | "not_sent"        // Has contact, not scheduled
  | "scheduled"       // Scheduled for future
  | "pending"         // Past scheduled time, waiting
  | "in_progress"     // Currently executing
  | "sent"            // Successfully delivered
  | "failed";         // Failed to deliver

export interface ChannelStatus {
  state: ChannelState;
  scheduledFor: Date | null;
  deliveredAt: Date | null;
  failureReason: string | null;
}

export function deriveChannelState(
  deliveryStatus: DeliveryStatus,
  scheduledFor: string | null,
  hasContactInfo: boolean,
): ChannelState {
  if (!hasContactInfo) return "not_applicable";
  if (deliveryStatus === "sent") return "sent";
  if (deliveryStatus === "failed") return "failed";
  if (deliveryStatus === "pending") {
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      return "scheduled";
    }
    return "pending";
  }
  return "not_sent";
}

export function getStatusDisplay(state: ChannelState): {
  label: string;
  icon: LucideIcon;
  color: string;
  showInCard: boolean;
} {
  const displays: Record<ChannelState, ...> = {
    not_applicable: { label: "N/A", icon: MinusCircle, color: "slate", showInCard: false },
    not_sent: { label: "Not scheduled", icon: Circle, color: "slate", showInCard: false },
    scheduled: { label: "Scheduled", icon: Clock, color: "purple", showInCard: true },
    pending: { label: "Pending", icon: AlertCircle, color: "amber", showInCard: true },
    in_progress: { label: "In progress", icon: Loader2, color: "blue", showInCard: true },
    sent: { label: "Delivered", icon: CheckCircle2, color: "green", showInCard: true },
    failed: { label: "Failed", icon: XCircle, color: "red", showInCard: true },
  };
  return displays[state];
}
```

### Update Main Component to Use New Utils

```typescript
// outbound-case-detail.tsx

import { deriveChannelState, getStatusDisplay } from "./detail/utils/status-display";

// Inside component:
const phoneState = deriveChannelState(
  caseData.phoneSent,
  caseData.scheduledCallFor,
  hasOwnerPhone
);

const emailState = deriveChannelState(
  caseData.emailSent,
  caseData.scheduledEmailFor,
  hasOwnerEmail
);

// Pass these to child components instead of booleans
<StatusOverviewCard
  phoneState={phoneState}
  emailState={emailState}
  // ...
/>
```

---

## 8. Testing Checklist

After implementing fixes, verify each state combination in the browser:

- [ ] Phone: not_applicable, Email: not_applicable
- [ ] Phone: not_sent, Email: not_sent
- [ ] Phone: not_sent, Email: scheduled (future)
- [ ] Phone: not_sent, Email: scheduled (past) → should show "pending", not "delivered"
- [ ] Phone: not_sent, Email: sent
- [ ] Phone: scheduled (future), Email: not_sent
- [ ] Phone: scheduled (past), Email: not_sent → should show "pending", not "delivered"
- [ ] Phone: scheduled, Email: scheduled
- [ ] Phone: scheduled, Email: sent
- [ ] Phone: sent, Email: not_sent
- [ ] Phone: sent, Email: scheduled
- [ ] Phone: sent, Email: sent
- [ ] Phone: failed, Email: any
- [ ] Phone: any, Email: failed

---

## 9. Files Modified by This Audit

| File                               | Changes Needed                             |
| ---------------------------------- | ------------------------------------------ |
| `detail/status-overview-card.tsx`  | Fix BUG-001 (isPast logic)                 |
| `detail/patient-owner-card.tsx`    | Fix BUG-002 (add not_applicable indicator) |
| `detail/communication-preview.tsx` | Fix BUG-003 (conditional rendering)        |
| `detail/utils/status-display.ts`   | NEW FILE (centralized status logic)        |
| `outbound-case-detail.tsx`         | Refactor to use new status utils           |

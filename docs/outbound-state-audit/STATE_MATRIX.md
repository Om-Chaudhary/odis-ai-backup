# Outbound Dashboard Sidebar State Matrix

> Comprehensive audit of all phone/email state combinations in the outbound dashboard sidebar.
> Audit Date: December 25, 2024

## State Combinations Matrix

| #   | Phone Status | Email Status | Case Status      | Sidebar Behavior                                           | Status     |
| --- | ------------ | ------------ | ---------------- | ---------------------------------------------------------- | ---------- |
| 1   | `null`       | `null`       | `pending_review` | ReadyToSendActions (delivery toggles + schedule button)    | ✅ CORRECT |
| 2   | `failed`     | `null`       | `failed`         | CompletedSummary (failed state, no incorrect prompts)      | ✅ CORRECT |
| 3   | `null`       | `sent`       | `completed`      | PartialDeliveryActions (Schedule Remaining for Phone only) | ✅ FIXED   |
| 4   | `sent`       | `null`       | `completed`      | PartialDeliveryActions (Schedule Remaining for Email only) | ✅ FIXED   |
| 5   | `sent`       | `sent`       | `completed`      | CompletedSummary (clean, correct state)                    | ✅ CORRECT |
| 6   | `failed`     | `sent`       | `failed`         | CommunicationsIntelligence + no incorrect prompts          | ✅ FIXED   |
| 7   | `sent`       | `N/A`        | `completed`      | CompletedSummary (no email contact, correct)               | ✅ CORRECT |
| 8   | `failed`     | `N/A`        | `failed`         | CompletedSummary (failed state, correct)                   | ✅ CORRECT |

### Additional States (Not Captured)

| #   | Phone Status | Email Status | Case Status | Expected Behavior                            |
| --- | ------------ | ------------ | ----------- | -------------------------------------------- |
| 9   | `pending`    | `null`       | `scheduled` | StatusOverviewCard + PartialDeliveryActions  |
| 10  | `null`       | `pending`    | `scheduled` | StatusOverviewCard + PartialDeliveryActions  |
| 11  | `pending`    | `pending`    | `scheduled` | StatusOverviewCard + ScheduledActions        |
| 12  | `sent`       | `pending`    | `scheduled` | StatusOverviewCard + PartialDeliveryActions? |
| 13  | `pending`    | `sent`       | `scheduled` | StatusOverviewCard + PartialDeliveryActions? |
| 14  | `N/A`        | `sent`       | `completed` | CompletedSummary                             |
| 15  | `N/A`        | `failed`     | `failed`    | CompletedSummary                             |
| 16  | `failed`     | `failed`     | `failed`    | CompletedSummary                             |

---

## Bug Details

### Bug #1: Partial Delivery Shows "Scheduled" for Already-Sent Items

**Affected States:** #3, #4, #6

**Problem:** When one channel is sent and the other is null (not scheduled), `PartialDeliveryActions` incorrectly shows:

- "Phone call scheduled" or "Email scheduled" for the channel that was actually SENT
- Cancel button for an item that cannot be cancelled (already delivered)

**Root Cause:** `partial-delivery-actions.tsx` lines 56-63 use:

```typescript
const phoneScheduled = Boolean(scheduledCallFor); // BUG: scheduledCallFor persists after delivery
const emailScheduled = Boolean(scheduledEmailFor); // BUG: scheduledEmailFor persists after delivery
```

The `scheduledFor` timestamps remain in the database even after the item is delivered or failed. The component should check the actual `phoneStatus` and `emailStatus` instead.

**Visual Evidence:**

- State #3 (null/sent): Shows "Phone call scheduled" with cancel button, but phone was never scheduled
- State #4 (sent/null): Shows "Email scheduled" with cancel button, but email was never scheduled
- State #6 (failed/sent): Shows "Phone call scheduled" with cancel button, but phone failed

### Bug #2: Duplicate Information Display

**Affected States:** #3, #4, #6

**Problem:** When `StatusOverviewCard` is rendered alongside `PartialDeliveryActions`, similar information appears twice:

- StatusOverviewCard shows "Call delivered" / "Email delivered"
- PartialDeliveryActions shows "Remaining Channels" and "Completed Channels"

**Root Cause:** `outbound-case-detail.tsx` line 231-232:

```typescript
const showScheduledCard =
  caseData.scheduledCallFor ?? caseData.scheduledEmailFor;
```

This shows the StatusOverviewCard for ANY case with scheduledFor timestamps, even completed/failed cases where it's not useful.

### Bug #3: Duplicate Cancel Buttons (Potential)

**Affected States:** Fully scheduled cases (#11)

**Problem:** When both channels are scheduled:

- `StatusOverviewCard` has cancel button per channel (lines 192-201)
- `ScheduledActions` has "Cancel All" + individual cancel buttons (lines 78-111)

This creates 3-4 cancel buttons for the same action.

---

## Files Requiring Changes

| File                                                       | Change Required                                                |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| `detail/smart-action-section/partial-delivery-actions.tsx` | Fix status checking logic - use actual status not scheduledFor |
| `detail/smart-action-section/scheduled-actions.tsx`        | Remove duplicate cancel buttons                                |
| `outbound-case-detail.tsx`                                 | Fix `showScheduledCard` logic for completed/failed states      |

---

## Correct Behaviors (Reference)

### State #1: null/null (pending_review)

- Shows `ReadyToSendActions` with delivery toggles
- Phone and email checkboxes for user selection
- "Schedule Discharge" button
- Clean, appropriate for review state

### State #5: sent/sent (completed)

- Shows `CompletedSummary`
- Both channels marked as delivered
- No incorrect schedule prompts
- No duplicate information

### State #7: sent/N/A (completed)

- Shows `CompletedSummary`
- Phone marked as delivered
- Email correctly shows as N/A (no contact info)
- Clean state display

### State #8: failed/N/A (failed)

- Shows `CompletedSummary`
- Phone marked as failed
- Email correctly shows as N/A
- No incorrect prompts

---

## Fix Implementation Plan

### Fix 1: PartialDeliveryActions Status Logic

```typescript
// BEFORE (buggy):
const phoneScheduled = Boolean(scheduledCallFor);
const emailScheduled = Boolean(scheduledEmailFor);

// AFTER (correct):
const phoneScheduled = phoneStatus === "pending" && Boolean(scheduledCallFor);
const emailScheduled = emailStatus === "pending" && Boolean(scheduledEmailFor);
```

### Fix 2: Remove Duplicate Cancel from ScheduledActions

Remove the cancel button section entirely from `scheduled-actions.tsx` since `StatusOverviewCard` already provides inline cancel buttons.

### Fix 3: Conditional StatusOverviewCard

```typescript
// BEFORE:
const showScheduledCard =
  caseData.scheduledCallFor ?? caseData.scheduledEmailFor;

// AFTER:
const showScheduledCard =
  (caseData.scheduledCallFor && caseData.phoneSent === "pending") ||
  (caseData.scheduledEmailFor && caseData.emailSent === "pending");
```

---

## Screenshots

### Before Fix (captured during audit)

- `01-null-null-pending-review.png` - CORRECT
- `02-failed-null-failed.png` - CORRECT
- `03-null-sent-completed-BUG-duplicates.png` - BUG
- `04-sent-null-completed-BUG-duplicates.png` - BUG
- `05-sent-sent-completed-CORRECT.png` - CORRECT
- `06-failed-sent-failed-BUG-wrong-state.png` - BUG
- `07-sent-na-completed-CORRECT.png` - CORRECT
- `08-failed-na-failed-CORRECT.png` - CORRECT

### After Fix (verification screenshots)

- `after-01-null-sent-FIXED.png` - Shows only "Schedule Remaining" for Phone
- `after-02-sent-null-FIXED.png` - Shows only "Schedule Remaining" for Email
- `after-03-failed-sent-FIXED.png` - No incorrect schedule prompts
- `after-04-sent-sent-CORRECT.png` - Clean completed state

---

## Fix Verification Results

**Date:** December 25, 2024

### Changes Applied

| File                           | Change                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `scheduled-actions.tsx`        | Removed duplicate cancel buttons; now shows informational text only                    |
| `partial-delivery-actions.tsx` | Fixed status logic to check `phoneStatus === "pending"` instead of just `scheduledFor` |
| `outbound-case-detail.tsx`     | Fixed `showScheduledCard` to only show when items are actually pending                 |

### Verified States

| State                | Before Fix                                       | After Fix                                         | Status           |
| -------------------- | ------------------------------------------------ | ------------------------------------------------- | ---------------- |
| null/sent (MIKEY)    | Showed "Phone call scheduled" with cancel button | Shows "Schedule Remaining" with Phone option only | ✅ FIXED         |
| sent/null (TOSCA)    | Showed "Email scheduled" with cancel button      | Shows "Schedule Remaining" with Email option only | ✅ FIXED         |
| failed/sent (SMOKEY) | Showed "Phone call scheduled" with cancel button | No incorrect prompts, shows call summary          | ✅ FIXED         |
| sent/sent (LOBO)     | Already correct                                  | Still correct, no regressions                     | ✅ NO REGRESSION |

### Summary

All identified bugs have been fixed:

- ✅ No more duplicate cancel buttons
- ✅ No more incorrect "scheduled" status for sent/failed items
- ✅ StatusOverviewCard only shows for actually pending items
- ✅ PartialDeliveryActions now correctly identifies remaining vs completed channels

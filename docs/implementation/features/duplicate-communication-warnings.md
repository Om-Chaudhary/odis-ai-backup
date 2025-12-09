# Duplicate Communication Warnings

**Status**: Implemented ✅  
**Date**: December 9, 2025  
**Components Updated**: `case-card.tsx`, `discharge-list-item.tsx` (already had it)

## Overview

Implemented warning system to prevent duplicate discharge communications (emails and calls) from being sent to pet owners. Users now receive both visual indicators and confirmation dialogs when attempting to send communications that have already been sent or are in progress.

## Features Implemented

### 1. Visual Status Indicators

**Location**: Case cards in the dashboard

**Display**: Blue informational banner showing:

- "Discharge call already [status]" - for calls that are queued, in progress, completed, or failed
- "Discharge email already [status]" - for emails that are queued, sent, or failed

**Purpose**: Provides at-a-glance awareness of communication status before user takes action

**Example**:

```
ℹ️ Discharge call already completed
ℹ️ Discharge email already sent
```

### 2. Confirmation Dialogs

**Trigger**: When user clicks "Call" or "Email" button for a case that already has a communication in that channel

**Dialog Content**:

- **Title**: "Confirm Discharge Call" or "Confirm Discharge Email"
- **Message**: Explains that communication already exists with current status
- **Warning**: Notes that sending again may result in duplicate communications
- **Actions**: Cancel or "Yes, Send [Call/Email]"

**Statuses that trigger confirmation**:

- **Calls**: queued, ringing, in progress, completed, failed
- **Emails**: queued, sent, failed

### 3. Status Detection Logic

**Call Status Detection** (`getCallStatus()`):

- `completed` - Call successfully completed
- `failed` - Call failed
- `in progress` - Call is currently ringing or in progress
- `queued` - Call is scheduled but not yet started
- `scheduled` - No call exists (default, no warning shown)

**Email Status Detection** (`getEmailStatus()`):

- `sent` - Email successfully sent
- `failed` - Email failed to send
- `queued` - Email is scheduled but not yet sent
- `scheduled` - No email exists (default, no warning shown)

## Components Updated

### 1. `case-card.tsx`

**Changes**:

- Added `AlertDialog` imports
- Added state for `showCallConfirmation` and `showEmailConfirmation`
- Added `getCallStatus()` and `getEmailStatus()` helper functions
- Added `handleCallClick()` and `handleEmailClick()` handlers with status checking
- Added `confirmCall()` and `confirmEmail()` handlers
- Updated button click handlers to use new status-checking handlers
- Added visual status indicator banner
- Added two `AlertDialog` components at bottom of component

### 2. `discharge-list-item.tsx`

**Status**: Already had confirmation dialogs implemented (lines 646-690)

**Existing Features**:

- Confirmation dialogs for duplicate calls/emails
- Status-based button styling
- Combined status/action buttons showing current status

## User Experience

### Before Implementation

- Users could accidentally send duplicate communications
- No visual indication that communication was already sent
- Risk of annoying pet owners with multiple calls/emails

### After Implementation

- **Visual Awareness**: Blue banner clearly shows existing communications
- **Confirmation Required**: Dialog prevents accidental duplicate sends
- **Clear Status**: Users see exact status (completed, sent, failed, etc.)
- **Informed Decision**: Users can choose to send again if truly needed

## Example Scenarios

### Scenario 1: Call Already Completed

1. User opens dashboard, sees case card
2. Blue banner shows: "Discharge call already completed"
3. User clicks "Start Discharge Call" button
4. Dialog appears: "This case already has a call that is **completed**..."
5. User chooses to cancel (prevent duplicate) or confirm (intentional resend)

### Scenario 2: Email Already Sent

1. User reviews case needing follow-up
2. Visual indicator shows: "Discharge email already sent"
3. User clicks email icon
4. Dialog appears: "This case already has an email that is **sent**..."
5. User makes informed decision about resending

### Scenario 3: No Previous Communications

1. User views new case
2. No blue warning banner (clean interface)
3. User clicks call/email button
4. Action proceeds immediately without dialog
5. Communication sent normally

## Technical Implementation

### Status Checking Flow

```typescript
// 1. User clicks button
handleCallClick() {
  const status = getCallStatus(caseData);

  // 2. Check if already sent
  if (status !== "scheduled") {
    setShowCallConfirmation(true); // Show dialog
  } else {
    onTriggerCall(caseData.id); // Proceed immediately
  }
}

// 3. User confirms in dialog
confirmCall() {
  setShowCallConfirmation(false);
  onTriggerCall(caseData.id); // Now proceed
}
```

### Status Detection Logic

```typescript
function getCallStatus(caseData: DashboardCase): string {
  // Check latest call
  const latestCall = caseData.scheduled_discharge_calls[0];

  // Return human-readable status
  if (status === "completed") return "completed";
  if (status === "failed") return "failed";
  // ... etc

  return "scheduled"; // Default (no warning)
}
```

## Database Fields Used

**Tables**:

- `scheduled_discharge_calls` - Call records with status
- `scheduled_discharge_emails` - Email records with status

**Status Values**:

- **Calls**: `queued`, `ringing`, `in_progress`, `completed`, `failed`
- **Emails**: `queued`, `sent`, `failed`

## Testing Recommendations

### Manual Testing Scenarios

1. **Test Visual Indicators**:
   - Create case with completed call
   - Verify blue banner appears
   - Verify banner shows correct status

2. **Test Confirmation Dialogs**:
   - Click call button on case with existing call
   - Verify dialog appears with correct status
   - Test both Cancel and Confirm actions

3. **Test Multiple Statuses**:
   - Test with queued, in progress, completed, failed calls
   - Test with queued, sent, failed emails
   - Verify correct status displayed in each case

4. **Test New Cases**:
   - Create new case with no communications
   - Verify no warning banner
   - Verify buttons trigger actions immediately

5. **Test Both Components**:
   - Test in `case-card.tsx` (grid view)
   - Test in `discharge-list-item.tsx` (list view)
   - Verify consistent behavior

### Edge Cases

1. **Multiple Communications**: Case with multiple calls/emails (should check latest)
2. **Status Transitions**: Status changes while dialog is open
3. **Concurrent Actions**: Multiple users triggering same case
4. **Test Mode**: Verify warnings work correctly in test mode

## Future Enhancements

### Potential Improvements

1. **Timestamp Display**: Show when last communication was sent
2. **Communication History**: Link to view all communications for case
3. **Batch Operations**: Extend warnings to batch discharge operations
4. **User Preferences**: Allow disabling confirmations (power users)
5. **Retry Intelligence**: Suggest retry for failed communications

### Configuration Options

Could add user settings for:

- Enable/disable confirmation dialogs
- Enable/disable visual indicators
- Confirmation required for specific statuses only

## Related Documentation

- [Discharge Management](/docs/dashboard/02-TABS/discharges-tab.md)
- [Case Card Component](/docs/dashboard/03-COMPONENTS/case-card.md)
- [VAPI Integration](/docs/vapi/README.md)
- [Discharge Orchestrator](/docs/implementation/features/discharge-orchestrator.md)

## Summary

This feature significantly improves user experience by preventing accidental duplicate communications. The combination of visual indicators and confirmation dialogs provides multiple layers of protection while maintaining a smooth workflow for intentional actions.

**Key Benefits**:

- ✅ Prevents accidental duplicate communications
- ✅ Provides clear visual feedback
- ✅ Maintains user control (can still resend if needed)
- ✅ Improves pet owner experience (no duplicate calls/emails)
- ✅ Reduces support issues from confused owners

# Clinical Notes Requirement for Discharge

## Overview

As of this implementation, **all users must have clinical notes** (SOAP notes, transcriptions, or discharge summaries) before they can initiate discharge calls or emails. This is a mandatory requirement to ensure discharge communications contain relevant clinical content.

## Implementation

### 1. Data Model

Added `has_clinical_notes` boolean field to `DashboardCase` type:

```typescript
export interface DashboardCase {
  // ... other fields
  /** Indicates if this case has clinical notes (SOAP notes, transcriptions, or discharge summaries) */
  has_clinical_notes: boolean;
  // ... other fields
}
```

### 2. Transform Logic

The `transformBackendCaseToDashboardCase` function in `src/lib/transforms/case-transforms.ts` calculates this field:

```typescript
const hasSoapNotes = (backendCase.soap_notes?.length ?? 0) > 0;
const hasTranscriptions = (backendCase.transcriptions?.length ?? 0) > 0;
const hasDischargeSummaries =
  (backendCase.discharge_summaries?.length ?? 0) > 0;
const has_clinical_notes =
  hasSoapNotes || hasTranscriptions || hasDischargeSummaries;
```

A case is considered to have clinical notes if it has **any one** of:

- SOAP notes (`soap_notes` table)
- Transcriptions (`transcriptions` table)
- Discharge summaries (`discharge_summaries` table)

### 3. UI Indicators

#### Case List Cards (`discharge-list-item.tsx`)

**Visual Indicator:**

- Green badge with checkmark: "Notes Ready" (clinical notes present)
- Gray badge with file icon: "No Notes" (clinical notes missing)

**Button State:**

- Call and Email buttons are **disabled** when `has_clinical_notes` is `false`
- Tooltip explains: "Clinical notes required to start discharge call/email"

**Warning Message:**

- Red alert box displays when notes are missing:
  > "Clinical notes required: Add SOAP notes, transcription, or discharge summary to enable discharge actions"

#### Case Detail Page (`case-detail-client.tsx`)

**Validation:**

- `handleTriggerCall` checks `has_clinical_notes` before processing
- Shows error toast if notes are missing:
  > "Clinical notes required: Add SOAP notes, transcription, or discharge summary before starting discharge call"

### 4. User Experience

**Before Clinical Notes Added:**

1. Case cards show "No Notes" badge in gray
2. Call and Email buttons are disabled
3. Warning message explains what's needed
4. Users must add clinical content via:
   - SOAP notes entry
   - Voice transcription
   - Manual discharge summary

**After Clinical Notes Added:**

1. Case cards show "Notes Ready" badge in green
2. Call and Email buttons are enabled (if contact info is also valid)
3. Users can proceed with discharge workflow

## Backend Validation

The backend (`CasesService.scheduleDischargeCall`) already enforces this requirement:

```typescript
// From src/lib/services/cases-service.ts
if (!entities.soap_notes && !entities.transcription && !summaryContent) {
  throw new Error(
    "Case has no entities and no transcription available for extraction",
  );
}
```

This ensures that even if UI validation is bypassed, the backend will reject discharge attempts without clinical notes.

## Database Queries

To support this feature, ensure that case queries include the related tables:

```typescript
const { data } = await supabase.from("cases").select(`
    *,
    patients!inner(*),
    soap_notes(id, content, created_at),
    transcriptions(id, content, created_at),
    discharge_summaries(id, content, created_at),
    scheduled_discharge_calls(*),
    scheduled_discharge_emails(*)
  `);
// ... filters
```

The transform function will count these arrays to determine `has_clinical_notes`.

## Testing

### Manual Testing

1. **Case without notes:**
   - Create new case with patient info only
   - Verify "No Notes" badge displays
   - Verify Call/Email buttons are disabled
   - Verify warning message shows

2. **Case with notes:**
   - Add SOAP note, transcription, or discharge summary
   - Verify "Notes Ready" badge displays in green
   - Verify Call/Email buttons are enabled (if contact info valid)
   - Verify warning message disappears

3. **Attempt discharge without notes:**
   - Try to trigger call from detail page without notes
   - Verify error toast displays
   - Verify no API call is made

### Automated Testing

Future test cases should cover:

- Transform function correctly sets `has_clinical_notes`
- UI buttons are properly disabled/enabled based on flag
- Backend validation rejects calls without clinical content

## Migration Notes

**No database migration required** - this is a computed field based on existing data.

**Existing cases:**

- Cases with existing SOAP notes, transcriptions, or discharge summaries will automatically show as ready
- Cases without any clinical content will be blocked from discharge until content is added

## Related Files

- `/src/types/dashboard.ts` - Type definition
- `/src/lib/transforms/case-transforms.ts` - Transform logic
- `/src/components/dashboard/discharge-list-item.tsx` - List UI
- `/src/components/dashboard/case-detail-client.tsx` - Detail page UI
- `/src/lib/services/cases-service.ts` - Backend validation
- `/docs/testing/SCHEDULE_DISCHARGE_VERIFICATION.md` - Verification report

## Rationale

This requirement ensures:

1. **Quality Control**: Discharge communications contain actual clinical content
2. **Compliance**: Veterinary discharge summaries should be based on documented medical records
3. **User Experience**: Prevents errors from attempting to generate discharge content without source material
4. **Data Integrity**: Enforces that clinical documentation exists before patient discharge

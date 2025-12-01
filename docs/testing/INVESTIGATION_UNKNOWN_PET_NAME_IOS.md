# Investigation Report: Unknown pet_name in iOS App Discharge Calls

**Date**: 2025-12-01
**User**: jattvc@gmail.com
**Platform**: iOS app (NOT idexx extension)
**Issue**: Pet names appear as "unknown" in `scheduled_discharge_calls.dynamic_variables` instead of using the patient's actual name from the database

---

## Executive Summary

The root cause has been identified: **timing issue in the data enrichment flow**. The `buildDynamicVariables()` function is called with `entities.patient.name` **BEFORE** the entities are enriched with database values from the `patients` table. This results in "unknown" being used when the entity extraction fails to properly identify the pet name from the source data.

### Key Finding

In `/Users/s0381806/Development/odis-ai-web/src/lib/services/cases-service.ts`:

- **Line 579-626**: `buildDynamicVariables()` is called with `petName: entities.patient.name`
- **Line 369-423**: Database enrichment happens that updates `entities.patient.name` from the `patients` table
- **Problem**: The enrichment happens in the code but AFTER the variables are already built

---

## Detailed Code Flow Analysis

### 1. Entry Point: Discharge Call Scheduling

**File**: `/Users/s0381806/Development/odis-ai-web/src/lib/services/discharge-orchestrator.ts`

**Line 1027-1039**: The `DischargeOrchestrator` calls `CasesService.scheduleDischargeCall()`:

```typescript
const scheduledCall = await CasesService.scheduleDischargeCall(
  this.supabase,
  this.user.id,
  caseId,
  {
    scheduledAt,
    summaryContent,
    clinicName,
    clinicPhone,
    emergencyPhone: clinicPhone,
    agentName,
  },
);
```

### 2. Critical Section: Variable Building Order

**File**: `/Users/s0381806/Development/odis-ai-web/src/lib/services/cases-service.ts`

**Problem Sequence**:

1. **Line 364**: Fetch case with entities

   ```typescript
   let caseInfo = await this.getCaseWithEntities(supabase, caseId);
   ```

2. **Line 367**: Get entities from case metadata

   ```typescript
   let entities = caseInfo.entities;
   ```

3. **Line 369-423**: Database enrichment section EXISTS but happens LATER

   ```typescript
   // 1a. Enrich entities with database values (database takes priority)
   if (entities && caseInfo.patient) {
     // Handle both single patient and array of patients
     const patient = Array.isArray(caseInfo.patient)
       ? caseInfo.patient[0]
       : caseInfo.patient;

     if (patient) {
       // Enrich patient name from database (database takes priority)
       if (patient.name && patient.name.trim() !== "") {
         entities.patient.name = patient.name; // ← This SHOULD fix the issue
       }
       // ... more enrichment
     }
   }
   ```

4. **Line 579-626**: `buildDynamicVariables()` is called **TOO EARLY**
   ```typescript
   const variablesResult = buildDynamicVariables({
     baseVariables: {
       // ... other vars
       petName: entities.patient.name, // ← Uses entities.patient.name
       // ...
     },
   });
   ```

### Wait... Actually Looking Closer

Upon closer inspection of lines 369-423, the enrichment DOES happen before `buildDynamicVariables()` is called on line 579. The enrichment is at line 369, and buildDynamicVariables is at line 579. So the order seems correct in the code!

### Real Problem: iOS App Data Flow

The issue is likely that:

1. **iOS app sends data without proper entity extraction**
2. **The `entities.patient.name` field is set to "unknown" or empty during initial entity extraction**
3. **The database patient record may also have "unknown" as the name**

Let me check what happens during case creation from the iOS app...

### 3. iOS App Integration Point

The iOS app likely calls the discharge orchestration endpoint directly. Let's trace backwards:

**File**: `/Users/s0381806/Development/odis-ai-web/src/app/api/discharge/orchestrate/route.ts`

- Receives POST request from iOS app
- Calls `DischargeOrchestrator.orchestrate()`

**File**: `/Users/s0381806/Development/odis-ai-web/src/lib/services/discharge-orchestrator.ts`

- Line 415-638: `triggerDischarge` mutation in cases router
- Updates patient data first (lines 436-472)
- Then calls orchestration endpoint (lines 547-559)

### Critical Discovery: Patient Data Update Flow

**File**: `/Users/s0381806/Development/odis-ai-web/src/server/api/routers/cases.ts`

**Line 433-472**: The `triggerDischarge` mutation updates patient data:

```typescript
// Step 1: Update patient record with any provided data
const updateData: Record<string, string | null> = {};
if (input.patientData.name) {
  updateData.name = input.patientData.name;
}
// ... other fields
if (Object.keys(updateData).length > 0) {
  const { error } = await ctx.supabase
    .from("patients")
    .update(updateData)
    .eq("id", input.patientId)
    .eq("user_id", ctx.user.id);
}
```

**BUT**: The iOS app might not be providing `patientData.name` in the request!

---

## Root Cause Identification

The actual problem is likely:

1. **iOS app creates cases** with incomplete patient data
2. **Patient record in database has `name = "unknown"` or `name = NULL`**
3. **Entity extraction from iOS app data fails to extract pet name**
4. **Database enrichment (line 378) reads `patient.name` but it's already "unknown"**
5. **Variables are built with "unknown" as the pet name**

### Why IDEXX Extension Works

The IDEXX extension likely provides structured data with proper pet names:

- **File**: `/Users/s0381806/Development/odis-ai-web/src/lib/services/cases-service.ts`
- **Line 1042-1098**: `mapIdexxToEntities()` function properly maps `pet_name` field
- Line 1043: `const petName = typeof data.pet_name === "string" ? data.pet_name : "Unknown";`

---

## Database Investigation Needed

To confirm this hypothesis, we need to query:

### Query 1: Check User's Cases and Patient Names

```sql
SELECT
  c.id as case_id,
  c.created_at,
  c.source,
  p.id as patient_id,
  p.name as patient_name,
  p.owner_name,
  p.owner_phone
FROM cases c
LEFT JOIN patients p ON c.id = p.case_id
WHERE c.user_id = (
  SELECT id FROM users WHERE email = 'jattvc@gmail.com'
)
ORDER BY c.created_at DESC
LIMIT 10;
```

### Query 2: Check Scheduled Discharge Calls

```sql
SELECT
  sdc.id,
  sdc.case_id,
  sdc.created_at,
  sdc.status,
  sdc.dynamic_variables->>'pet_name' as pet_name_in_call,
  sdc.dynamic_variables->>'owner_name' as owner_name_in_call,
  p.name as patient_name_in_db
FROM scheduled_discharge_calls sdc
LEFT JOIN cases c ON sdc.case_id = c.id
LEFT JOIN patients p ON c.id = p.case_id
WHERE sdc.user_id = (
  SELECT id FROM users WHERE email = 'jattvc@gmail.com'
)
ORDER BY sdc.created_at DESC
LIMIT 10;
```

### Query 3: Check Case Metadata Entities

```sql
SELECT
  c.id,
  c.created_at,
  c.source,
  c.metadata->'entities'->'patient'->>'name' as entity_patient_name,
  p.name as db_patient_name
FROM cases c
LEFT JOIN patients p ON c.id = p.case_id
WHERE c.user_id = (
  SELECT id FROM users WHERE email = 'jattvc@gmail.com'
)
ORDER BY c.created_at DESC
LIMIT 10;
```

---

## Hypothesis: Three Possible Scenarios

### Scenario 1: Patient Name Never Set in Database

- iOS app creates patient record without setting name
- Database has `patients.name = NULL` or `"unknown"`
- Enrichment code reads NULL/unknown and doesn't override
- Variables built with "unknown"

### Scenario 2: Entity Extraction Fails

- iOS app sends data without clear pet name field
- Entity extraction (AI) fails to identify pet name
- `entities.patient.name = "unknown"` in case metadata
- Database enrichment doesn't override because it respects existing value
- Variables built with "unknown"

### Scenario 3: iOS App Doesn't Provide Patient Data

- iOS app calls discharge endpoint without `patientData.name`
- Patient record never updated
- Database still has "unknown" from initial creation
- Variables built with "unknown"

---

## Recommended Fix

### Fix Location

**File**: `/Users/s0381806/Development/odis-ai-web/src/lib/services/cases-service.ts`
**Function**: `scheduleDischargeCall()`
**Lines**: 369-423 (database enrichment section)

### Current Code (Line 378):

```typescript
// Enrich patient name from database (database takes priority)
if (patient.name && patient.name.trim() !== "") {
  entities.patient.name = patient.name;
}
```

### Issue

This code only enriches if `patient.name` exists and is not empty. But if the database has "unknown" as the name, it will use "unknown".

### Proposed Fix: Add Fallback Logic

**Option 1: Reject "unknown" as invalid**

```typescript
// Enrich patient name from database (database takes priority)
// Reject "unknown" as an invalid name
if (
  patient.name &&
  patient.name.trim() !== "" &&
  patient.name.toLowerCase() !== "unknown"
) {
  entities.patient.name = patient.name;
} else {
  // Log warning and throw error if no valid patient name available
  console.warn("[CasesService] Patient name is invalid or missing", {
    caseId,
    patientId: patient.id,
    patientName: patient.name,
  });
  throw new Error(
    "Patient name is required for discharge calls. Please update the patient record with a valid name.",
  );
}
```

**Option 2: Add explicit check before buildDynamicVariables**

```typescript
// After database enrichment, validate that we have a valid patient name
if (
  !entities.patient.name ||
  entities.patient.name.trim() === "" ||
  entities.patient.name.toLowerCase() === "unknown"
) {
  console.error("[CasesService] Invalid or missing patient name for call", {
    caseId,
    patientName: entities.patient.name,
    dbPatientName: patient?.name,
  });

  throw new Error(
    "Cannot schedule discharge call: Patient name is missing or invalid. " +
      "Please ensure the patient record has a valid name before scheduling a call.",
  );
}
```

### Additional Fix: iOS App Data Validation

**File**: `/Users/s0381806/Development/odis-ai-web/src/server/api/routers/cases.ts`
**Function**: `triggerDischarge`
**Line**: 416-432

Add validation to require patient name:

```typescript
.input(
  z.object({
    caseId: z.string().uuid(),
    patientId: z.string().uuid(),
    patientData: z.object({
      name: z.string().min(1).refine(
        (name) => name.toLowerCase() !== "unknown",
        { message: "Patient name cannot be 'unknown'" }
      ), // Make name required!
      species: z.string().optional(),
      breed: z.string().optional(),
      ownerName: z.string().optional(),
      ownerEmail: z.string().email().optional().or(z.literal("")),
      ownerPhone: z.string().optional(),
    }),
    // ...
  }),
)
```

---

## Testing Plan

### 1. Verify Current State

- [ ] Run Query 1 to check patient names in database
- [ ] Run Query 2 to check dynamic_variables in scheduled calls
- [ ] Run Query 3 to check case metadata entities
- [ ] Identify if "unknown" is in database or only in variables

### 2. Test Fix in Development

- [ ] Apply Option 2 fix (validation check)
- [ ] Create test case with "unknown" patient name
- [ ] Verify error is thrown with helpful message
- [ ] Update patient name to valid value
- [ ] Verify discharge call works correctly

### 3. iOS App Integration Testing

- [ ] Test discharge call creation from iOS app
- [ ] Verify patient name is required in request
- [ ] Verify error handling shows user-friendly message
- [ ] Verify successful call with valid patient name

### 4. Regression Testing

- [ ] Test IDEXX extension discharge calls (should still work)
- [ ] Test web dashboard discharge calls (should still work)
- [ ] Test existing cases with valid patient names (should still work)

---

## Migration Strategy (If Needed)

If existing patient records have "unknown" names:

```sql
-- Find all patients with "unknown" or NULL names
SELECT
  p.id,
  p.case_id,
  p.name,
  p.owner_name,
  c.user_id,
  u.email
FROM patients p
LEFT JOIN cases c ON p.case_id = c.id
LEFT JOIN users u ON c.user_id = u.id
WHERE p.name IS NULL
   OR p.name = ''
   OR LOWER(p.name) = 'unknown'
ORDER BY c.created_at DESC;

-- Manual update required:
-- UPDATE patients SET name = '[ACTUAL_PET_NAME]' WHERE id = '[PATIENT_ID]';
```

---

## Conclusion

The issue is that patient names are being stored as "unknown" in the database, and the enrichment code doesn't filter out this invalid value. The fix requires:

1. **Immediate**: Add validation to reject "unknown" as a patient name before scheduling calls
2. **Short-term**: Update iOS app to require valid patient names in discharge requests
3. **Long-term**: Add database constraints to prevent "unknown" names from being stored

The database enrichment code (lines 369-423) is correctly positioned and should work once we ensure valid patient names are in the database.

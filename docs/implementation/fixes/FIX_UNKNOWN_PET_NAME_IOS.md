# Fix: Unknown pet_name in iOS Discharge Calls

**Issue**: Pet names appear as "unknown" in `scheduled_discharge_calls` for iOS app users
**User Affected**: jattvc@gmail.com
**Priority**: High
**Root Cause**: Invalid/missing patient names in database not being validated before call scheduling

---

## Quick Summary

The database enrichment code correctly reads patient names from the `patients` table, but it doesn't validate that the name is actually valid (not "unknown", empty, or null). When iOS app creates cases without proper patient names, these invalid names propagate to discharge calls.

---

## Files to Modify

### 1. `/Users/s0381806/Development/odis-ai-web/src/lib/services/cases-service.ts`

**Location**: Inside `scheduleDischargeCall()` function
**Line**: After line 423 (after database enrichment section)

**Add validation check**:

```typescript
// After line 423, add:

// 1c. Validate that we have a valid patient name after enrichment
if (
  !entities.patient.name ||
  entities.patient.name.trim() === "" ||
  entities.patient.name.toLowerCase() === "unknown"
) {
  const patientId = Array.isArray(caseInfo.patient)
    ? caseInfo.patient[0]?.id
    : caseInfo.patient?.id;

  console.error(
    "[CasesService] Invalid or missing patient name for discharge call",
    {
      caseId,
      patientId,
      patientName: entities.patient.name,
      dbPatientName: Array.isArray(caseInfo.patient)
        ? caseInfo.patient[0]?.name
        : caseInfo.patient?.name,
      source: caseInfo.case.source,
    },
  );

  throw new Error(
    "Cannot schedule discharge call: Patient name is missing or invalid. " +
      "Please update the patient record with the pet's name before scheduling a discharge call.",
  );
}
```

**Why here?**

- After database enrichment completes
- Before entity extraction fallback logic (line 484)
- Before `buildDynamicVariables()` call (line 579)
- Ensures we catch invalid names early with a clear error message

---

### 2. `/Users/s0381806/Development/odis-ai-web/src/server/api/routers/cases.ts`

**Location**: `triggerDischarge` mutation input schema
**Line**: 421-428

**Current code**:

```typescript
patientData: z.object({
  name: z.string().optional(),
  species: z.string().optional(),
  // ...
}),
```

**Change to**:

```typescript
patientData: z.object({
  name: z.string().min(1).refine(
    (name) => name.toLowerCase() !== "unknown",
    { message: "Patient name cannot be 'unknown'. Please provide the pet's actual name." }
  ),
  species: z.string().optional(),
  // ...
}),
```

**Why?**

- Forces iOS app (and any client) to provide a valid patient name
- Rejects "unknown" as an invalid name at the API boundary
- Provides clear error message to users

---

## Testing Steps

### 1. Test Invalid Patient Name (Error Case)

```bash
# Expected: Should throw error with helpful message

# Setup: Create a test case with "unknown" patient name
curl -X POST http://localhost:3000/api/discharge/orchestrate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "existingCase": {
        "caseId": "CASE_ID_WITH_UNKNOWN_NAME"
      }
    },
    "steps": {
      "generateSummary": true,
      "scheduleCall": {
        "phoneNumber": "+15555551234"
      }
    }
  }'

# Expected Response:
# {
#   "error": "Cannot schedule discharge call: Patient name is missing or invalid..."
# }
```

### 2. Test Valid Patient Name (Success Case)

```bash
# Expected: Should succeed

# Setup: Update patient name first
curl -X POST http://localhost:3000/api/trpc/cases.updatePatientInfo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PATIENT_ID",
    "name": "Max"
  }'

# Then schedule discharge call
# Expected: Should succeed and create call with pet_name = "Max"
```

### 3. Test iOS App Integration

- Open iOS app
- Navigate to a case
- Try to schedule discharge call without patient name
  - Expected: Error message shown
- Add patient name
- Schedule discharge call
  - Expected: Success
- Verify in database: `dynamic_variables->>'pet_name'` should equal actual pet name

---

## Database Migration (If Needed)

If you find existing patients with "unknown" names that need fixing:

```sql
-- 1. Find affected patients
SELECT
  p.id,
  p.case_id,
  p.name,
  p.owner_name,
  c.created_at,
  u.email
FROM patients p
JOIN cases c ON p.case_id = c.id
JOIN users u ON c.user_id = u.id
WHERE p.name IS NULL
   OR p.name = ''
   OR LOWER(p.name) = 'unknown'
ORDER BY c.created_at DESC;

-- 2. Manual update (EXAMPLE - requires actual pet names):
-- UPDATE patients
-- SET name = 'ACTUAL_PET_NAME'
-- WHERE id = 'PATIENT_ID';
```

---

## Rollout Plan

### Phase 1: Add Validation (Immediate)

1. Deploy change to `cases-service.ts` (validation check)
2. Monitor error logs for cases hitting this error
3. Reach out to affected users to update patient names

### Phase 2: Fix iOS App (Short-term)

1. Deploy change to `cases.ts` (required name field)
2. Update iOS app to show error when name is missing
3. Add UI validation in iOS app to require name before discharge

### Phase 3: Database Constraints (Long-term)

Consider adding database check constraint:

```sql
ALTER TABLE patients
ADD CONSTRAINT patients_name_not_unknown
CHECK (name IS NOT NULL AND name != '' AND LOWER(name) != 'unknown');
```

**Note**: This would require fixing all existing records first!

---

## Monitoring

After deployment, monitor:

### Error Logs

```bash
# Look for validation errors
grep "Invalid or missing patient name for discharge call" logs/*.log
```

### Database Queries

```sql
-- Check if calls are still being created with "unknown" names
SELECT
  COUNT(*) as count,
  dynamic_variables->>'pet_name' as pet_name
FROM scheduled_discharge_calls
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY dynamic_variables->>'pet_name'
ORDER BY count DESC;
```

### User Impact

- Monitor support tickets related to discharge calls
- Check if error messages are clear and actionable
- Track time to resolution (how long until users fix their patient names)

---

## Success Criteria

- ✅ No new discharge calls created with pet_name = "unknown"
- ✅ Clear error messages shown to users when name is invalid
- ✅ Existing valid discharge calls continue to work
- ✅ IDEXX extension flow unaffected
- ✅ Zero regressions in web dashboard

---

## Rollback Plan

If issues arise:

1. **Remove validation check** from `cases-service.ts` (revert to accepting "unknown")
2. **Revert schema change** in `cases.ts` (make name optional again)
3. **Deploy previous version**
4. **Investigate root cause of rollback**

The validation is fail-safe: removing it returns to current behavior.

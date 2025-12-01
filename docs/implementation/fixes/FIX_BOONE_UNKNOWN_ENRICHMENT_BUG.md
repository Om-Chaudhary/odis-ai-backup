# Fix Implementation: Database Enrichment Lost After Re-fetch

**Issue**: Pet names show as "unknown" in discharge calls despite being correct in database
**Root Cause**: Database enrichment is lost when entities are re-fetched after transcription extraction
**Related Investigation**: `docs/testing/INVESTIGATION_BOONE_UNKNOWN_BUG.md`

## Summary

When a case has incomplete entities (missing breed/weight), the code:

1. Enriches entities with database values (name, owner_name) ✓
2. Detects incompleteness and extracts from transcription
3. **Re-fetches case and resets entities** ✗ ← Loses the enrichment

The fix: Extract enrichment logic into a reusable method and call it after both the initial fetch and the re-fetch.

## Implementation Plan

### Step 1: Create Enrichment Method

Add this method to the `CasesService` class (after line 919):

```typescript
/**
 * Enrich entities with database patient values
 *
 * Database values take priority over AI-extracted metadata values.
 * This ensures accurate patient information even when AI extraction fails.
 *
 * @param entities - The entities object to enrich (modified in place)
 * @param patient - Patient record from database (single or array)
 */
private enrichEntitiesWithPatient(
  entities: NormalizedEntities | undefined,
  patient: PatientRow | PatientRow[] | null,
): void {
  if (!entities || !patient) {
    return;
  }

  // Handle both single patient and array of patients
  const patientData = Array.isArray(patient) ? patient[0] : patient;

  if (!patientData) {
    return;
  }

  // Enrich patient name from database (database takes priority)
  if (patientData.name && patientData.name.trim() !== "") {
    entities.patient.name = patientData.name;
  }

  // Enrich patient demographics from database
  if (patientData.species) {
    entities.patient.species =
      patientData.species as NormalizedEntities["patient"]["species"];
  }
  if (patientData.breed) {
    entities.patient.breed = patientData.breed;
  }
  if (patientData.sex) {
    entities.patient.sex =
      patientData.sex as NormalizedEntities["patient"]["sex"];
  }
  if (patientData.weight_kg) {
    entities.patient.weight = `${patientData.weight_kg} kg`;
  }

  // Enrich owner information from database
  if (patientData.owner_name) {
    entities.patient.owner.name = patientData.owner_name;
  }
  if (patientData.owner_phone) {
    entities.patient.owner.phone = patientData.owner_phone;
  }
  if (patientData.owner_email) {
    entities.patient.owner.email = patientData.owner_email;
  }

  console.log(
    "[CasesService] Enriched entities with patient database values",
    {
      enrichedFields: {
        name: patientData.name,
        species: patientData.species,
        breed: patientData.breed,
        sex: patientData.sex,
        weight: patientData.weight_kg,
        ownerName: patientData.owner_name,
        ownerPhone: patientData.owner_phone,
      },
    },
  );
}
```

### Step 2: Replace First Enrichment Block (Lines 369-423)

**Replace this code** at lines 369-423:

```typescript
// OLD CODE (DELETE)
// 1a. Enrich entities with database values (database takes priority)
if (entities && caseInfo.patient) {
  const patient = Array.isArray(caseInfo.patient)
    ? caseInfo.patient[0]
    : caseInfo.patient;

  if (patient) {
    // Enrich patient name from database (database takes priority)
    if (patient.name && patient.name.trim() !== "") {
      entities.patient.name = patient.name;
    }

    // Enrich patient demographics from database
    if (patient.species) {
      entities.patient.species =
        patient.species as NormalizedEntities["patient"]["species"];
    }
    if (patient.breed) entities.patient.breed = patient.breed;
    if (patient.sex) {
      entities.patient.sex =
        patient.sex as NormalizedEntities["patient"]["sex"];
    }
    if (patient.weight_kg) {
      entities.patient.weight = `${patient.weight_kg} kg`;
    }

    // Enrich owner information from database
    if (patient.owner_name) {
      entities.patient.owner.name = patient.owner_name;
    }
    if (patient.owner_phone) {
      entities.patient.owner.phone = patient.owner_phone;
    }
    if (patient.owner_email) {
      entities.patient.owner.email = patient.owner_email;
    }

    console.log(
      "[CasesService] Enriched entities with patient database values",
      {
        caseId,
        enrichedFields: {
          name: patient.name,
          species: patient.species,
          breed: patient.breed,
          sex: patient.sex,
          weight: patient.weight_kg,
          ownerName: patient.owner_name,
          ownerPhone: patient.owner_phone,
        },
      },
    );
  }
}
```

**With this new code**:

```typescript
// NEW CODE (REPLACE)
// 1a. Enrich entities with database values (database takes priority)
this.enrichEntitiesWithPatient(entities, caseInfo.patient);
```

### Step 3: Add Enrichment After Re-fetch (After Line 540)

**Add this code** after line 540 (after `entities = caseInfo.entities;`):

```typescript
// Line 537-540 (existing code - keep as is)
// Refresh case info with updated entities
caseInfo = await this.getCaseWithEntities(supabase, caseId);
if (!caseInfo) throw new Error("Case not found after update");
entities = caseInfo.entities;

// NEW CODE (ADD AFTER LINE 540)
// Re-apply database enrichment after re-fetch
// This ensures database values take priority even after transcription extraction
this.enrichEntitiesWithPatient(entities, caseInfo.patient);
```

## Complete Diff

### Location 1: Add new method (after line 919)

```diff
  },

+ /**
+  * Enrich entities with database patient values
+  *
+  * Database values take priority over AI-extracted metadata values.
+  * This ensures accurate patient information even when AI extraction fails.
+  *
+  * @param entities - The entities object to enrich (modified in place)
+  * @param patient - Patient record from database (single or array)
+  */
+ private enrichEntitiesWithPatient(
+   entities: NormalizedEntities | undefined,
+   patient: PatientRow | PatientRow[] | null,
+ ): void {
+   if (!entities || !patient) {
+     return;
+   }
+
+   // Handle both single patient and array of patients
+   const patientData = Array.isArray(patient) ? patient[0] : patient;
+
+   if (!patientData) {
+     return;
+   }
+
+   // Enrich patient name from database (database takes priority)
+   if (patientData.name && patientData.name.trim() !== "") {
+     entities.patient.name = patientData.name;
+   }
+
+   // Enrich patient demographics from database
+   if (patientData.species) {
+     entities.patient.species =
+       patientData.species as NormalizedEntities["patient"]["species"];
+   }
+   if (patientData.breed) {
+     entities.patient.breed = patientData.breed;
+   }
+   if (patientData.sex) {
+     entities.patient.sex =
+       patientData.sex as NormalizedEntities["patient"]["sex"];
+   }
+   if (patientData.weight_kg) {
+     entities.patient.weight = `${patientData.weight_kg} kg`;
+   }
+
+   // Enrich owner information from database
+   if (patientData.owner_name) {
+     entities.patient.owner.name = patientData.owner_name;
+   }
+   if (patientData.owner_phone) {
+     entities.patient.owner.phone = patientData.owner_phone;
+   }
+   if (patientData.owner_email) {
+     entities.patient.owner.email = patientData.owner_email;
+   }
+
+   console.log(
+     "[CasesService] Enriched entities with patient database values",
+     {
+       enrichedFields: {
+         name: patientData.name,
+         species: patientData.species,
+         breed: patientData.breed,
+         sex: patientData.sex,
+         weight: patientData.weight_kg,
+         ownerName: patientData.owner_name,
+         ownerPhone: patientData.owner_phone,
+       },
+     },
+   );
+ }
+
  /**
   * Get list of extracted fields from entities
```

### Location 2: Replace enrichment block (lines 369-423)

```diff
  let entities = caseInfo.entities;

- // 1a. Enrich entities with database values (database takes priority)
- if (entities && caseInfo.patient) {
-   const patient = Array.isArray(caseInfo.patient)
-     ? caseInfo.patient[0]
-     : caseInfo.patient;
-
-   if (patient) {
-     // Enrich patient name from database (database takes priority)
-     if (patient.name && patient.name.trim() !== "") {
-       entities.patient.name = patient.name;
-     }
-
-     // Enrich patient demographics from database
-     if (patient.species) {
-       entities.patient.species =
-         patient.species as NormalizedEntities["patient"]["species"];
-     }
-     if (patient.breed) entities.patient.breed = patient.breed;
-     if (patient.sex) {
-       entities.patient.sex =
-         patient.sex as NormalizedEntities["patient"]["sex"];
-     }
-     if (patient.weight_kg) {
-       entities.patient.weight = `${patient.weight_kg} kg`;
-     }
-
-     // Enrich owner information from database
-     if (patient.owner_name) {
-       entities.patient.owner.name = patient.owner_name;
-     }
-     if (patient.owner_phone) {
-       entities.patient.owner.phone = patient.owner_phone;
-     }
-     if (patient.owner_email) {
-       entities.patient.owner.email = patient.owner_email;
-     }
-
-     console.log(
-       "[CasesService] Enriched entities with patient database values",
-       {
-         caseId,
-         enrichedFields: {
-           name: patient.name,
-           species: patient.species,
-           breed: patient.breed,
-           sex: patient.sex,
-           weight: patient.weight_kg,
-           ownerName: patient.owner_name,
-           ownerPhone: patient.owner_phone,
-         },
-       },
-     );
-   }
- }
+ // 1a. Enrich entities with database values (database takes priority)
+ this.enrichEntitiesWithPatient(entities, caseInfo.patient);

  // 1b. Enrich with client instructions from SOAP notes or discharge summaries
```

### Location 3: Add enrichment after re-fetch (after line 540)

```diff
  // Refresh case info with updated entities
  caseInfo = await this.getCaseWithEntities(supabase, caseId);
  if (!caseInfo) throw new Error("Case not found after update");
  entities = caseInfo.entities;
+
+ // Re-apply database enrichment after re-fetch
+ // This ensures database values take priority even after transcription extraction
+ this.enrichEntitiesWithPatient(entities, caseInfo.patient);
```

## Testing

### Manual Testing Steps

1. **Create test case via iOS app**:
   - Use user jattvc@gmail.com
   - Create case with missing breed/weight
   - Ensure patient record has actual name in database

2. **Schedule discharge call**:

   ```typescript
   // In dashboard or via API
   await casesService.scheduleDischargeCall(supabase, userId, caseId, {
     clinicName: "Test Clinic",
     agentName: "Sarah",
     clinicPhone: "+15555551234",
   });
   ```

3. **Verify dynamic_variables**:

   ```sql
   SELECT
     id,
     dynamic_variables->>'pet_name' as pet_name,
     dynamic_variables->>'owner_name' as owner_name,
     dynamic_variables->>'patient_name' as patient_name
   FROM scheduled_discharge_calls
   WHERE case_id = 'your-case-id';
   ```

4. **Expected results**:
   - `pet_name` should match patient.name from database
   - `owner_name` should match patient.owner_name from database
   - `patient_name` should match patient.name from database
   - None should be "unknown" if database has values

### Test Cases

| Scenario            | Patient Name in DB | Breed/Weight | Expected Result      |
| ------------------- | ------------------ | ------------ | -------------------- |
| Complete entities   | "Boone"            | Present      | "Boone"              |
| Incomplete entities | "Boone"            | Missing      | "Boone" ✓ (Fixed)    |
| No database record  | N/A                | Missing      | "unknown" (expected) |
| Empty name in DB    | ""                 | Missing      | "unknown" (expected) |

## Rollout Plan

### Phase 1: Deploy Fix (Low Risk)

1. Deploy the enrichment refactor
2. Monitor logs for enrichment console messages
3. Check first 10 discharge calls created after deploy

### Phase 2: Verify Historical Data

1. Query recent discharge calls with "unknown" pet_name
2. Compare with patient records in database
3. Document percentage of affected calls

### Phase 3: Optional Backfill

If needed, create a migration script to update existing discharge calls:

```typescript
// Migration script to fix historical data
async function backfillUnknownPetNames() {
  // Find all discharge calls with "unknown" pet_name
  const calls = await supabase
    .from("scheduled_discharge_calls")
    .select(
      `
      id,
      case_id,
      dynamic_variables,
      cases!inner(
        patient:patients(name, owner_name)
      )
    `,
    )
    .eq("dynamic_variables->>'pet_name'", "unknown")
    .limit(1000);

  for (const call of calls.data) {
    const patient = call.cases.patient;
    if (patient?.name && patient.name !== "unknown") {
      // Update dynamic_variables
      const updatedVars = {
        ...call.dynamic_variables,
        pet_name: patient.name,
        patient_name: patient.name,
        owner_name: patient.owner_name || call.dynamic_variables.owner_name,
      };

      await supabase
        .from("scheduled_discharge_calls")
        .update({ dynamic_variables: updatedVars })
        .eq("id", call.id);
    }
  }
}
```

## Monitoring

### Success Metrics

After deployment, monitor:

1. **Discharge calls with "unknown" pet_name**:

   ```sql
   SELECT COUNT(*) as unknown_count
   FROM scheduled_discharge_calls
   WHERE created_at > NOW() - INTERVAL '24 hours'
     AND dynamic_variables->>'pet_name' = 'unknown';
   ```

2. **Enrichment log frequency**:
   - Search logs for "Enriched entities with patient database values"
   - Should see 2 log entries per discharge call with incomplete entities

3. **Error rate**:
   - Monitor for any new errors in scheduleDischargeCall
   - Check for TypeScript errors related to enrichEntitiesWithPatient

### Expected Outcomes

- ✓ Reduction in discharge calls with "unknown" pet_name
- ✓ Two enrichment logs per call (initial + after re-fetch)
- ✓ No increase in error rate
- ✓ iOS app users see correct pet names in call variables

## Rollback Plan

If issues arise, rollback is safe:

1. Revert the three code changes
2. System returns to previous behavior (bug still exists but no new issues)
3. No database migrations needed
4. No data loss risk

The fix is purely logic-based with no schema changes, making rollback straightforward.

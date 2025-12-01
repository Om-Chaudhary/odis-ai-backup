# Investigation Report: Boone Case - Unknown Pet Name Bug

**Date**: December 1, 2025
**Case ID**: `a891e355-c021-4de4-abae-936b9ccd2ef4`
**User**: jattvc@gmail.com
**Pet Name**: Boone (showing as "unknown" in discharge call)
**Discharge Call ID**: `8c35a35b-3188-4b70-897c-a2570ed99099`

## Executive Summary

Found critical bug causing pet names to show as "unknown" in discharge calls even when the database has correct values. The bug occurs when entities are incomplete (missing breed/weight) and transcription extraction is triggered, causing the in-memory database enrichment to be lost.

## Database State

### Patient Record (Correct)

```
patient_id: 45129eba-f982-49c6-88f6-326eb844c640
name: "Boone" ✓
owner_name: "Taylor" ✓
created_at: 2025-12-01 18:16:51.799+00
```

### Discharge Call Record (Incorrect)

```
discharge_call_id: 8c35a35b-3188-4b70-897c-a2570ed99099
created_at: 2025-12-01 20:50:03.151771+00
status: "completed"
dynamic_variables.pet_name: "unknown" ✗
dynamic_variables.owner_name: "unknown" ✗
dynamic_variables.patient_name: "unknown" ✗
```

### Case Metadata (Source of Problem)

```json
{
  "entities": {
    "patient": {
      "name": "unknown",  ← Stored in metadata
      "age": "puppy",
      "sex": "unknown",
      "breed": "unknown",  ← Missing, triggers re-extraction
      "species": "dog",
      "weight": "unknown",  ← Missing, triggers re-extraction
      "owner": {
        "name": "unknown",  ← Stored in metadata
        "email": "unknown",
        "phone": "unknown"
      }
    }
  }
}
```

## Root Cause Analysis

### The Bug Location

**File**: `src/lib/services/cases-service.ts`
**Function**: `scheduleDischargeCall()`
**Lines**: 537-540

### Code Flow

#### Step 1: Database Enrichment (Lines 369-423) ✓

```typescript
// Enrich entities with database values
if (entities && caseInfo.patient) {
  const patient = Array.isArray(caseInfo.patient)
    ? caseInfo.patient[0]
    : caseInfo.patient;

  if (patient) {
    // This works correctly!
    if (patient.name && patient.name.trim() !== "") {
      entities.patient.name = patient.name; // Sets to "Boone" in memory
    }

    if (patient.owner_name) {
      entities.patient.owner.name = patient.owner_name; // Sets to "Taylor" in memory
    }
  }
}
```

**Result**: entities.patient.name = "Boone", entities.patient.owner.name = "Taylor" (in memory only)

#### Step 2: Incomplete Check (Line 484) ⚠️

```typescript
if (!entities || this.isEntitiesIncomplete(entities)) {
  // Returns TRUE because breed and weight are "unknown"
```

The check looks for missing: species, breed, age, weight

- Boone's case: Missing `breed` and `weight` → Returns TRUE

#### Step 3: Transcription Extraction (Lines 506-516) ⚠️

```typescript
// Extract entities from transcription
const extractedEntities = await extractEntitiesWithRetry(
  transcriptionData.transcript,
  "transcript",
);

// Merge with existing entities
entities = entities
  ? this.mergeEntitiesForExtraction(entities, extractedEntities)
  : extractedEntities;
```

**Result**: Extracted entities also have "unknown" for patient name, merged with enriched entities

#### Step 4: Database Update and Re-fetch (Lines 518-540) 🐛 **THE BUG**

```typescript
// Update case metadata with enriched entities
const updatedMetadata: CaseMetadata = {
  ...caseInfo.metadata,
  entities,
};

await supabase
  .from("cases")
  .update({ metadata: updatedMetadata })
  .eq("id", caseId);

// Refresh case info with updated entities
caseInfo = await this.getCaseWithEntities(supabase, caseId);
if (!caseInfo) throw new Error("Case not found after update");
entities = caseInfo.entities; // ← BUG: Resets to metadata without re-enrichment!
```

**The Problem**:

1. Line 518-527: Saves merged entities to database metadata
2. Line 538: Re-fetches case from database
3. Line 540: **Resets entities to `caseInfo.entities`** (the metadata)
4. **Database enrichment from lines 369-423 is LOST** because it was never applied to the saved metadata

#### Step 5: Variable Building (Lines 576-584) ✗

```typescript
// Build variables from entities (now has "unknown" again)
const extractedVars = extractVapiVariablesFromEntities(entities); // patient_name: "unknown"

const variablesResult = buildDynamicVariables({
  baseVariables: {
    petName: entities.patient.name, // "unknown"
    ownerName: entities.patient.owner.name, // "unknown"
    // ...
  },
});
```

**Result**: All variables have "unknown" values

## Why The Bug Exists

The database enrichment (lines 369-423) happens **before** checking if entities are incomplete. When entities are incomplete:

1. The code extracts from transcription
2. Merges extracted entities with enriched entities
3. **Saves to database** (but the database patient name is still "Boone", the metadata is what's saved)
4. **Re-fetches from database and resets entities** ← Loses the in-memory enrichment

The enrichment never gets applied to the metadata that's saved to the database, so when the code re-fetches, it gets un-enriched metadata.

## The Fix

### Option 1: Re-apply Enrichment After Re-fetch (Recommended)

After line 540, re-apply the database enrichment:

```typescript
// Line 537-540 (existing code)
caseInfo = await this.getCaseWithEntities(supabase, caseId);
if (!caseInfo) throw new Error("Case not found after update");
entities = caseInfo.entities;

// NEW: Re-apply database enrichment after re-fetch
if (entities && caseInfo.patient) {
  const patient = Array.isArray(caseInfo.patient)
    ? caseInfo.patient[0]
    : caseInfo.patient;

  if (patient) {
    if (patient.name && patient.name.trim() !== "") {
      entities.patient.name = patient.name;
    }
    if (patient.owner_name) {
      entities.patient.owner.name = patient.owner_name;
    }
    if (patient.owner_phone) {
      entities.patient.owner.phone = patient.owner_phone;
    }
    if (patient.owner_email) {
      entities.patient.owner.email = patient.owner_email;
    }
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
  }
}
```

### Option 2: Refactor Enrichment Into Separate Method

Extract the enrichment logic (lines 369-423) into a separate method and call it both:

- After initial fetch (line 369)
- After re-fetch (line 540)

```typescript
/**
 * Enrich entities with database patient values
 */
private enrichEntitiesWithPatient(
  entities: NormalizedEntities,
  patient: PatientRow | null
): void {
  if (!patient || !entities) return;

  // Enrich patient name
  if (patient.name && patient.name.trim() !== "") {
    entities.patient.name = patient.name;
  }

  // Enrich owner information
  if (patient.owner_name) {
    entities.patient.owner.name = patient.owner_name;
  }
  if (patient.owner_phone) {
    entities.patient.owner.phone = patient.owner_phone;
  }
  if (patient.owner_email) {
    entities.patient.owner.email = patient.owner_email;
  }

  // Enrich demographics
  if (patient.species) {
    entities.patient.species = patient.species as NormalizedEntities["patient"]["species"];
  }
  if (patient.breed) entities.patient.breed = patient.breed;
  if (patient.sex) {
    entities.patient.sex = patient.sex as NormalizedEntities["patient"]["sex"];
  }
  if (patient.weight_kg) {
    entities.patient.weight = `${patient.weight_kg} kg`;
  }
}
```

Then call it:

```typescript
// Line 369: After initial fetch
this.enrichEntitiesWithPatient(entities, caseInfo.patient);

// Line 540: After re-fetch
entities = caseInfo.entities;
this.enrichEntitiesWithPatient(entities, caseInfo.patient);
```

### Option 3: Don't Reset Entities After Re-fetch

After saving the merged entities to the database, don't re-fetch and reset. Use the in-memory enriched entities:

```typescript
// Lines 518-527: Save to database
await supabase
  .from("cases")
  .update({ metadata: updatedMetadata })
  .eq("id", caseId);

// Don't re-fetch - use the entities variable that's already enriched
// Remove lines 537-540
```

## Recommendation

**Use Option 2** (Refactor into separate method) because:

1. Eliminates code duplication
2. Ensures enrichment always happens consistently
3. Makes the code more maintainable
4. Provides a single source of truth for enrichment logic

## Testing Steps

1. Create a case via iOS app with incomplete entities (missing breed/weight)
2. Add patient record with actual name
3. Schedule discharge call
4. Verify dynamic_variables.pet_name matches patient.name from database
5. Verify dynamic_variables.owner_name matches patient.owner_name from database

## Affected Users

Any iOS app user whose cases have:

- Missing breed or weight (triggers re-extraction)
- Patient name stored in database but "unknown" in metadata
- This likely affects **most iOS app users** since the iOS app doesn't always capture breed/weight

## Impact

- **Severity**: High
- **User Experience**: Poor - calls use "unknown" instead of pet's actual name
- **Data**: Database has correct data, but it's not being used
- **Scope**: Affects iOS app users, not IDEXX extension users (they have complete data)

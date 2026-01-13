# Patient Duplicate Analysis Report

**Date:** 2026-01-12
**Analyst:** Database Administrator
**Status:** Analysis Complete

---

## Executive Summary

The ODIS AI platform has a **design-level issue** where repeat patients create duplicate patient records in the database. This is an intentional design choice (case-per-patient model) but causes data fragmentation and makes patient history tracking difficult.

---

## 1. Current Schema Structure

### 1.1 Relevant Tables

#### `patients` Table

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),      -- Links to clinic user
  case_id UUID REFERENCES cases(id),       -- One patient per case (1:1)
  name TEXT NOT NULL,
  species TEXT,
  breed TEXT,
  sex TEXT,
  weight_kg NUMERIC,
  date_of_birth DATE,
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  external_id TEXT,                        -- For IDEXX patient ID
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

**Key Observations:**

- **No `clinic_id`** - patients are linked via `user_id`, not directly to clinics
- **No unique constraints** on patient identity (name + owner combination)
- **One-to-one relationship** with cases via `case_id` foreign key
- **No patient deduplication** mechanism exists

#### `cases` Table

```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  external_id TEXT,                        -- 'idexx-appt-{appointmentId}' for IDEXX
  source TEXT,                             -- 'idexx_extension', 'mobile_app', 'manual'
  status CaseStatus,
  entity_extraction JSONB,                 -- Normalized entities from ingestion
  metadata JSONB,                          -- Full case metadata including IDEXX raw data
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Key Observations:**

- Cases have `external_id` for IDEXX appointment deduplication
- Cases are deduplicated by `external_id + user_id` (for same appointment re-ingestion)
- **No patient-level deduplication** across cases

#### `user_clinic_access` Table

```sql
CREATE TABLE user_clinic_access (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  role TEXT DEFAULT 'member',
  is_primary BOOLEAN DEFAULT false,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Data Flow Analysis

### 2.1 IDEXX Extension Path (garrybath@hotmail.com)

```
Chrome Extension
      |
      v
POST /api/cases/ingest (IDEXX format)
      |
      v
CasesService.ingest()
      |
      v
createOrUpdateCase()
      |
      +-- Check external_id (idexx-appt-{id})
      |   |
      |   +-- If exists: UPDATE case, DO NOT create patient
      |   +-- If not exists: CREATE case + CREATE new patient
      |
      v
Patient record created with case_id FK
```

**Issue:** Every NEW IDEXX appointment creates a new patient record, even for returning pets.

### 2.2 iOS Scribe Path (jattvc@gmail.com)

```
iOS Scribe App
      |
      v
POST /api/cases/ingest (text mode)
      |
      v
AI Entity Extraction (extractEntitiesWithRetry)
      |
      v
CasesService.ingest()
      |
      v
createOrUpdateCase()
      |
      +-- No external_id available
      +-- Always creates NEW case + NEW patient
      |
      v
Patient record created with case_id FK
```

**Issue:** No way to identify repeat patients from voice transcriptions.

---

## 3. Root Cause Analysis

### 3.1 Intentional Design Decision

From `case-crud.ts` line 81-83:

```typescript
// NOTE: Removed patient name/owner case matching.
// Each appointment should create a new case, even for returning patients.
// Only external_id matching (above) is kept for idempotent ingestion of the same appointment.
```

This was an intentional decision to:

1. Ensure each appointment gets its own case
2. Avoid incorrectly merging different visits
3. Keep case data isolated per visit

### 3.2 Unintended Consequences

1. **Patient Fragmentation**: "Max" belonging to "John Smith" may have 10+ patient records
2. **Lost Patient History**: No way to see all visits for a specific pet
3. **Data Redundancy**: Same owner contact info stored multiple times
4. **Contact Drift**: If owner updates phone number, old patient records have stale data

### 3.3 Evidence from Migrations

Migration `20251206000000_cleanup_idexx_duplicate_cases.sql` shows this was already identified:

```sql
-- This migration:
-- 1. Identifies duplicate case groups (same patient_name + owner_name from IDEXX)
-- 2. Keeps the most recent case per patient+owner combination
-- ...
-- 5. Cleans up orphaned patients not linked to any case
```

---

## 4. Specific Duplicate Examples

Based on the migration logic, duplicates are identified by:

```sql
GROUP BY UPPER(patient_name), UPPER(owner_name)
HAVING COUNT(*) > 1
```

This means any patient with:

- Same pet name (case-insensitive)
- Same owner name (case-insensitive)
- Same user_id (clinic)

...will have multiple patient records.

---

## 5. Recommended Schema Changes

### 5.1 Introduce Master Patient Record

Create a new `master_patients` table for canonical patient identity:

```sql
-- Migration: Create master patient records with deduplication
CREATE TABLE master_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),

  -- Unique patient identity
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT,            -- Optional, for fuzzy matching

  -- Demographics (latest values)
  species TEXT,
  breed TEXT,
  sex TEXT,
  weight_kg NUMERIC,
  date_of_birth DATE,

  -- Owner contact (single source of truth)
  owner_email TEXT,

  -- External system references
  idexx_patient_id TEXT,

  -- Metadata
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint for deduplication
  CONSTRAINT unique_patient_identity
    UNIQUE (clinic_id, LOWER(name), LOWER(owner_name))
);

-- Index for fast lookups
CREATE INDEX idx_master_patients_clinic_name
  ON master_patients(clinic_id, LOWER(name));

CREATE INDEX idx_master_patients_idexx_id
  ON master_patients(clinic_id, idexx_patient_id)
  WHERE idexx_patient_id IS NOT NULL;
```

### 5.2 Add master_patient_id to existing patients table

```sql
-- Add foreign key to existing patients table
ALTER TABLE patients
  ADD COLUMN master_patient_id UUID REFERENCES master_patients(id);

-- Index for efficient joins
CREATE INDEX idx_patients_master_patient_id ON patients(master_patient_id);
```

### 5.3 Add clinic_id to cases table

```sql
-- Add clinic_id for direct clinic association
ALTER TABLE cases
  ADD COLUMN clinic_id UUID REFERENCES clinics(id);

-- Backfill from user_clinic_access
UPDATE cases c
SET clinic_id = (
  SELECT clinic_id
  FROM user_clinic_access uca
  WHERE uca.user_id = c.user_id
    AND uca.is_primary = true
  LIMIT 1
);

-- Make it NOT NULL after backfill
ALTER TABLE cases
  ALTER COLUMN clinic_id SET NOT NULL;
```

### 5.4 Create patient matching function

```sql
CREATE OR REPLACE FUNCTION find_or_create_master_patient(
  p_clinic_id UUID,
  p_name TEXT,
  p_owner_name TEXT,
  p_owner_phone TEXT DEFAULT NULL,
  p_owner_email TEXT DEFAULT NULL,
  p_species TEXT DEFAULT NULL,
  p_breed TEXT DEFAULT NULL,
  p_sex TEXT DEFAULT NULL,
  p_idexx_patient_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_master_patient_id UUID;
BEGIN
  -- Try to find existing patient by exact match
  SELECT id INTO v_master_patient_id
  FROM master_patients
  WHERE clinic_id = p_clinic_id
    AND LOWER(name) = LOWER(p_name)
    AND LOWER(owner_name) = LOWER(p_owner_name);

  IF v_master_patient_id IS NOT NULL THEN
    -- Update last_seen and increment visit count
    UPDATE master_patients
    SET
      last_seen_at = NOW(),
      visit_count = visit_count + 1,
      -- Update contact info if provided (prefer newer data)
      owner_phone = COALESCE(p_owner_phone, owner_phone),
      owner_email = COALESCE(p_owner_email, owner_email),
      -- Update IDEXX ID if not set
      idexx_patient_id = COALESCE(idexx_patient_id, p_idexx_patient_id),
      updated_at = NOW()
    WHERE id = v_master_patient_id;

    RETURN v_master_patient_id;
  END IF;

  -- Create new master patient
  INSERT INTO master_patients (
    clinic_id, name, owner_name, owner_phone, owner_email,
    species, breed, sex, idexx_patient_id
  ) VALUES (
    p_clinic_id, p_name, p_owner_name, p_owner_phone, p_owner_email,
    p_species, p_breed, p_sex, p_idexx_patient_id
  )
  RETURNING id INTO v_master_patient_id;

  RETURN v_master_patient_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Migration Strategy

### Phase 1: Schema Addition (Non-Breaking)

1. Add `master_patients` table
2. Add `master_patient_id` column to `patients` (nullable)
3. Add `clinic_id` column to `cases` (nullable initially)

### Phase 2: Data Backfill

1. Create master patient records from existing patients
2. Link existing patients to master records
3. Populate `clinic_id` on cases

### Phase 3: Application Update

1. Update `CasesService.ingest()` to use `find_or_create_master_patient()`
2. Update patient creation to set `master_patient_id`
3. Add patient history endpoints

### Phase 4: Constraints (Optional)

1. Make `master_patient_id` NOT NULL (requires backfill complete)
2. Make `clinic_id` NOT NULL on cases

---

## 7. Backward Compatibility

The proposed changes are **fully backward compatible**:

1. **Existing queries continue to work** - `patients` table structure unchanged
2. **New column is nullable** - no data migration required initially
3. **Gradual adoption** - can link patients over time
4. **No API breaking changes** - ingest endpoint response unchanged

---

## 8. Benefits After Implementation

| Metric                             | Before            | After                        |
| ---------------------------------- | ----------------- | ---------------------------- |
| Patient records per repeat patient | N (one per visit) | 1 master + N visit records   |
| Contact info updates               | Manual per record | Single update propagates     |
| Patient history view               | Not possible      | Full visit history available |
| Data storage efficiency            | Low               | High (deduped demographics)  |
| IDEXX patient matching             | None              | By idexx_patient_id          |

---

## 9. Recommended Next Steps

1. **Review this analysis** with product team
2. **Decide on scope** - full master_patients or simpler approach
3. **Create migration files** - schema changes first
4. **Update application code** - CasesService.ingest()
5. **Backfill existing data** - create master records
6. **Add patient history UI** - new dashboard feature

---

## Appendix: Key File Locations

| File                                                                    | Purpose                         |
| ----------------------------------------------------------------------- | ------------------------------- |
| `/libs/shared/types/src/database.types.ts`                              | Auto-generated Supabase types   |
| `/libs/domain/cases/data-access/src/lib/case-crud.ts`                   | Case/patient creation logic     |
| `/libs/domain/cases/data-access/src/lib/cases-service.ts`               | Main ingestion service          |
| `/apps/web/src/app/api/cases/ingest/route.ts`                           | API endpoint for case ingestion |
| `/supabase/migrations/20251206000000_cleanup_idexx_duplicate_cases.sql` | Previous duplicate cleanup      |

---

_Report generated by database-administrator agent_

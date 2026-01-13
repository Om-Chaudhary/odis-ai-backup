# Modular Schema Proposal for Multi-Platform & Multi-PIMS Support

**Date:** 2026-01-13
**Updated:** 2026-01-13 (Clinic-Scoped Architecture)
**Status:** Proposal Ready for Review
**Compatibility:** 100% backward compatible with live iOS users

---

## Executive Summary

This proposal introduces a **clinic-scoped, normalized three-layer data model** that:

1. **Shifts from user-scoped to clinic-scoped data** - data belongs to clinics, not individual users
2. Separates **clients (owners)** from **patients (pets)** - standard veterinary data model
3. Preserves existing `patients` table as **per-visit snapshots** for backward compatibility
4. Adds **audit columns** (`created_by`, `updated_by`) for tracking who modified records
5. **Simplifies RLS from 18+ policies to 4 per table** using `user_clinic_access`
6. Creates `pims_mappings` for PIMS-agnostic external ID tracking
7. **Removes unused `case_shares` table** (dead code)

---

## 1. The Problem

### 1.1 Current Data Duplication

| Clinic                    | Total Patients | Unique (name+owner) | Duplicates    |
| ------------------------- | -------------- | ------------------- | ------------- |
| Alum Rock Animal Hospital | 1,601          | 1,281               | **320 (20%)** |
| Del Valle Pet Hospital    | 883            | 778                 | **105 (12%)** |

### 1.2 Multi-Pet Households Are Common

```
Owner: Feng Qiao       → 9 pets (currently 9 copies of contact info)
Owner: Tina (Rescue)   → 8 pets (currently 8 copies of contact info)
Owner: Tu Tran         → 7 pets (currently 7 copies of contact info)
Owner: Leroy Lee       → 7 pets (currently 7 copies of contact info)
```

### 1.3 Current Schema Issues

```
Current Model (Denormalized + User-Scoped):
┌─────────────┐      ┌─────────────────────────────────┐
│    cases    │──────│           patients              │
│  user_id ───┼──┐   │ • name (pet)                    │
│             │  │   │ • species, breed, sex           │
│             │  │   │ • owner_name    ← DUPLICATED    │
│             │  │   │ • owner_phone   ← DUPLICATED    │
│             │  │   │ • owner_email   ← DUPLICATED    │
│             │  │   │ • user_id ──────┼───────────────┼──┐
└─────────────┘  │   └─────────────────────────────────┘  │
                 │                                         │
                 └─────────── Data SILOED by user ─────────┘
```

**Data Duplication Problems:**

- Feng Qiao's phone stored 9 times (once per pet)
- Phone number change requires 9 updates
- No way to view "all pets for this owner"
- No patient visit history across cases

**User-Scoped Access Problems:**

- Each user only sees their own data by default
- Requires explicit `case_shares` for collaboration (not used)
- 18+ overlapping RLS policies on cases/patients tables
- When staff leaves, their `user_id` is orphaned on records
- Multi-clinic users: Confusing which `user_id` owns data

### 1.4 User-Scoped vs Clinic-Scoped Data

| Aspect            | Current (user_id)        | Proposed (clinic_id)              |
| ----------------- | ------------------------ | --------------------------------- |
| Data visibility   | Siloed per user          | Shared across clinic              |
| Default access    | Only own records         | All clinic records                |
| Sharing mechanism | Explicit `case_shares`   | Implicit via `user_clinic_access` |
| RLS complexity    | 18+ overlapping policies | 4 simple policies per table       |
| Multi-clinic      | Confusing (which user?)  | Clear (query by clinic)           |
| Staff turnover    | Data orphaned with user  | Data stays with clinic            |
| Audit trail       | User = owner             | `created_by`/`updated_by`         |
| Industry standard | ❌                       | ✅ (IDEXX, ezyVet, Shepherd)      |

---

## 2. Proposed Three-Layer Model

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLINIC LAYER                                    │
│  ┌─────────────┐                                                            │
│  │   clinics   │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     IDENTITY LAYER (New)                             │   │
│  │                                                                      │   │
│  │  ┌──────────────┐         ┌───────────────────┐                     │   │
│  │  │   clients    │   1:N   │ canonical_patients │                    │   │
│  │  │  (owners)    │────────▶│      (pets)        │                    │   │
│  │  │              │         │                    │                    │   │
│  │  │ • name       │         │ • name             │                    │   │
│  │  │ • phone      │         │ • species          │                    │   │
│  │  │ • email      │         │ • breed            │                    │   │
│  │  │ • address    │         │ • date_of_birth    │                    │   │
│  │  │              │         │ • client_id (FK)   │                    │   │
│  │  └──────────────┘         └─────────┬─────────┘                     │   │
│  │                                     │                                │   │
│  └─────────────────────────────────────┼────────────────────────────────┘   │
│                                        │                                    │
│                                        ▼ 1:N                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      VISIT LAYER (Existing)                          │   │
│  │                                                                      │   │
│  │  ┌─────────────┐         ┌──────────────────┐                       │   │
│  │  │    cases    │   1:1   │     patients     │                       │   │
│  │  │  (visits)   │────────▶│  (visit snapshot)│                       │   │
│  │  │             │         │                  │                       │   │
│  │  │ + clinic_id │         │ • weight_kg      │  ← Weight AT visit    │   │
│  │  │ + canonical_│         │ • owner_name     │  ← Kept for iOS       │   │
│  │  │   patient_id│         │ + canonical_     │                       │   │
│  │  │             │         │   patient_id     │  ← Links to identity  │   │
│  │  │             │         │ + client_id      │                       │   │
│  │  └─────────────┘         └──────────────────┘                       │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │ soap_notes  │  │transcripts  │  │ generations │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    INTEGRATION LAYER (New)                           │   │
│  │  ┌───────────────┐                                                   │   │
│  │  │ pims_mappings │  Maps any entity to external PIMS IDs            │   │
│  │  │               │  (IDEXX, ezyVet, Shepherd, etc.)                 │   │
│  │  └───────────────┘                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Layer Responsibilities

| Layer           | Tables                                  | Purpose                                       | Cardinality         |
| --------------- | --------------------------------------- | --------------------------------------------- | ------------------- |
| **Identity**    | `clients`, `canonical_patients`         | Single source of truth for owner/pet identity | 1 per unique entity |
| **Visit**       | `cases`, `patients`, `soap_notes`, etc. | Per-visit data and snapshots                  | Many per patient    |
| **Integration** | `pims_mappings`                         | External system references                    | Many per entity     |

### 2.3 Key Architectural Changes

1. **All tables get `clinic_id`** - Direct clinic association, no more deriving from `user_id`
2. **Audit columns on all tables** - `created_by` and `updated_by` track WHO, but don't scope access
3. **RLS via `user_clinic_access`** - Simple: "can access if you have clinic access"
4. **`user_id` preserved** - For backward compatibility, but NOT used for access control

---

## 3. New Table Definitions

### 3.1 `clients` - Pet Owners (Humans)

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Identity
  first_name TEXT,
  last_name TEXT,
  display_name TEXT NOT NULL,  -- "John Smith" or "Ace Kitty Rescue"

  -- Contact Info (SINGLE SOURCE OF TRUTH)
  phone TEXT,
  phone_secondary TEXT,
  email TEXT,

  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',

  -- Preferences
  preferred_contact_method TEXT DEFAULT 'phone',  -- 'phone', 'email', 'sms'
  communication_opt_out BOOLEAN DEFAULT false,

  -- Lifecycle
  is_active BOOLEAN NOT NULL DEFAULT true,
  first_visit_at TIMESTAMPTZ,
  last_visit_at TIMESTAMPTZ,

  -- Extensibility
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Deduplication constraint
  CONSTRAINT clients_unique_phone
    UNIQUE NULLS NOT DISTINCT (clinic_id, phone)
);

-- Indexes
CREATE INDEX idx_clients_clinic ON clients(clinic_id);
CREATE INDEX idx_clients_name ON clients(clinic_id, LOWER(display_name));
CREATE INDEX idx_clients_phone ON clients(clinic_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_clients_email ON clients(clinic_id, LOWER(email)) WHERE email IS NOT NULL;
```

**Key Design Decisions:**

- `display_name` is required (computed from first/last or entered directly)
- `phone` is the primary deduplication key (most reliable identifier)
- Contact preferences stored here for discharge call/email logic

### 3.2 `canonical_patients` - Pets (Animals)

```sql
CREATE TABLE canonical_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  species TEXT,      -- 'dog', 'cat', 'bird', 'rabbit', 'reptile', 'other'
  breed TEXT,
  sex TEXT,          -- 'male', 'female', 'male_neutered', 'female_spayed', 'unknown'
  color TEXT,

  -- Demographics (can be updated over time)
  date_of_birth DATE,
  microchip_id TEXT,

  -- Medical Flags
  is_deceased BOOLEAN DEFAULT false,
  deceased_at TIMESTAMPTZ,
  allergies TEXT[],
  chronic_conditions TEXT[],

  -- Lifecycle
  is_active BOOLEAN NOT NULL DEFAULT true,
  first_visit_at TIMESTAMPTZ,
  last_visit_at TIMESTAMPTZ,
  visit_count INTEGER DEFAULT 0,

  -- Extensibility
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One pet per name per owner
  CONSTRAINT canonical_patients_unique_per_client
    UNIQUE (client_id, LOWER(name))
);

-- Indexes
CREATE INDEX idx_canonical_patients_clinic ON canonical_patients(clinic_id);
CREATE INDEX idx_canonical_patients_client ON canonical_patients(client_id);
CREATE INDEX idx_canonical_patients_name ON canonical_patients(clinic_id, LOWER(name));
CREATE INDEX idx_canonical_patients_species ON canonical_patients(clinic_id, species);
```

**Key Design Decisions:**

- Named `canonical_patients` to avoid collision with existing `patients` table
- `client_id` is required - every pet has an owner
- `allergies` and `chronic_conditions` are arrays for medical history
- `visit_count` maintained by trigger for quick access

### 3.3 `pims_mappings` - External System References

```sql
CREATE TABLE pims_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What entity this maps to (polymorphic)
  entity_type TEXT NOT NULL,  -- 'client', 'canonical_patient', 'case'
  entity_id UUID NOT NULL,

  -- External system reference
  pims_type TEXT NOT NULL,    -- 'idexx_neo', 'ezyvet', 'shepherd', 'provet'
  external_id TEXT NOT NULL,  -- The ID in the external system

  -- Sync metadata
  external_data JSONB DEFAULT '{}',
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'active',  -- 'active', 'stale', 'conflict', 'deleted'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One external ID per entity per PIMS
  CONSTRAINT pims_mappings_unique
    UNIQUE (entity_type, entity_id, pims_type)
);

-- Indexes for lookup
CREATE INDEX idx_pims_mappings_lookup ON pims_mappings(pims_type, external_id);
CREATE INDEX idx_pims_mappings_entity ON pims_mappings(entity_type, entity_id);
```

**Key Design Decisions:**

- Polymorphic design supports any entity type
- Enables multi-PIMS support (clinic uses both IDEXX and ezyVet)
- `external_data` stores raw PIMS metadata for debugging
- Replaces the current `external_id` column approach

---

## 4. Modifications to Existing Tables

### 4.1 `cases` Table Additions

```sql
-- Add clinic_id for direct clinic-scoped queries (PRIMARY access control)
ALTER TABLE cases
  ADD COLUMN clinic_id UUID REFERENCES clinics(id);

-- Add link to canonical patient identity
ALTER TABLE cases
  ADD COLUMN canonical_patient_id UUID REFERENCES canonical_patients(id);

-- Add audit columns (track WHO, but don't scope access)
ALTER TABLE cases
  ADD COLUMN created_by UUID REFERENCES auth.users(id);
ALTER TABLE cases
  ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- Indexes
CREATE INDEX idx_cases_clinic ON cases(clinic_id);
CREATE INDEX idx_cases_canonical_patient ON cases(canonical_patient_id);
CREATE INDEX idx_cases_created_by ON cases(created_by);
```

**Note:** The existing `user_id` column is preserved for iOS backward compatibility.

- **`user_id`**: Preserved for iOS queries, will be deprecated after iOS update
- **`clinic_id`**: New primary access scope (used by RLS)
- **`created_by`**: Audit - who created this record
- **`updated_by`**: Audit - who last modified this record

### 4.2 `patients` Table Additions (Visit Snapshot)

The existing `patients` table becomes a **per-visit snapshot**:

```sql
-- Link to canonical patient identity
ALTER TABLE patients
  ADD COLUMN canonical_patient_id UUID REFERENCES canonical_patients(id);

-- Link directly to client for quick access
ALTER TABLE patients
  ADD COLUMN client_id UUID REFERENCES clients(id);

-- Add clinic_id for clinic-scoped access
ALTER TABLE patients
  ADD COLUMN clinic_id UUID REFERENCES clinics(id);

-- Add audit columns
ALTER TABLE patients
  ADD COLUMN created_by UUID REFERENCES auth.users(id);
ALTER TABLE patients
  ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- Indexes
CREATE INDEX idx_patients_canonical ON patients(canonical_patient_id);
CREATE INDEX idx_patients_client ON patients(client_id);
CREATE INDEX idx_patients_clinic ON patients(clinic_id);
```

**Why Keep `patients` Table:**

1. **iOS Backward Compatibility** - App expects `patients` with `case_id` and `user_id`
2. **Per-Visit Data** - `weight_kg` at time of visit is visit-specific
3. **Historical Record** - Preserves exactly what was recorded at each visit

**Column Preservation:**

- **`user_id`**: Preserved for iOS queries, deprecated after iOS update
- **`owner_name`, `owner_phone`, `owner_email`**: Preserved for iOS display

### 4.3 Complete Entity Relationship

```
┌──────────┐
│ clinics  │
└────┬─────┘
     │
     ├──────────────────────────────────────────────────────┐
     │                                                      │
     ▼                                                      ▼
┌──────────┐    1:N    ┌────────────────────┐    1:N    ┌──────────┐
│ clients  │──────────▶│ canonical_patients │──────────▶│  cases   │
│          │           │                    │           │          │
│ id       │           │ id                 │           │ id       │
│ phone    │           │ name               │           │ clinic_id│
│ email    │           │ client_id ─────────┼───────────│ canonical│
│ address  │           │ species            │           │ _patient_│
│          │           │ breed              │           │ id       │
└──────────┘           │ date_of_birth      │           └────┬─────┘
                       └────────────────────┘                │
                                                             │ 1:1
                                                             ▼
                                                      ┌──────────────┐
                                                      │   patients   │
                                                      │ (snapshot)   │
                                                      │              │
                                                      │ id           │
                                                      │ case_id      │
                                                      │ name         │
                                                      │ weight_kg    │
                                                      │ owner_name   │ ← Kept for iOS
                                                      │ canonical_   │
                                                      │  patient_id  │ ← NEW
                                                      │ client_id    │ ← NEW
                                                      └──────────────┘
```

---

## 5. Migration Strategy

### Phase 1: Schema Addition (Zero Risk)

All new columns are **nullable** - existing code continues to work unchanged.

```sql
-- Migration: 20260114_add_client_patient_identity_layer.sql

-- 1. Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT NOT NULL,
  phone TEXT,
  phone_secondary TEXT,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  preferred_contact_method TEXT DEFAULT 'phone',
  communication_opt_out BOOLEAN DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  first_visit_at TIMESTAMPTZ,
  last_visit_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clients_unique_phone UNIQUE NULLS NOT DISTINCT (clinic_id, phone)
);

-- 2. Create canonical_patients table
CREATE TABLE canonical_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT,
  breed TEXT,
  sex TEXT,
  color TEXT,
  date_of_birth DATE,
  microchip_id TEXT,
  is_deceased BOOLEAN DEFAULT false,
  deceased_at TIMESTAMPTZ,
  allergies TEXT[],
  chronic_conditions TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  first_visit_at TIMESTAMPTZ,
  last_visit_at TIMESTAMPTZ,
  visit_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT canonical_patients_unique_per_client UNIQUE (client_id, LOWER(name))
);

-- 3. Create pims_mappings table
CREATE TABLE pims_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  pims_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  external_data JSONB DEFAULT '{}',
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pims_mappings_unique UNIQUE (entity_type, entity_id, pims_type)
);

-- 4. Add columns to existing tables (all nullable for backward compat)
ALTER TABLE cases ADD COLUMN clinic_id UUID REFERENCES clinics(id);
ALTER TABLE cases ADD COLUMN canonical_patient_id UUID REFERENCES canonical_patients(id);

ALTER TABLE patients ADD COLUMN canonical_patient_id UUID REFERENCES canonical_patients(id);
ALTER TABLE patients ADD COLUMN client_id UUID REFERENCES clients(id);
ALTER TABLE patients ADD COLUMN clinic_id UUID REFERENCES clinics(id);

-- 5. Create all indexes
CREATE INDEX idx_clients_clinic ON clients(clinic_id);
CREATE INDEX idx_clients_name ON clients(clinic_id, LOWER(display_name));
CREATE INDEX idx_clients_phone ON clients(clinic_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_clients_email ON clients(clinic_id, LOWER(email)) WHERE email IS NOT NULL;

CREATE INDEX idx_canonical_patients_clinic ON canonical_patients(clinic_id);
CREATE INDEX idx_canonical_patients_client ON canonical_patients(client_id);
CREATE INDEX idx_canonical_patients_name ON canonical_patients(clinic_id, LOWER(name));

CREATE INDEX idx_pims_mappings_lookup ON pims_mappings(pims_type, external_id);
CREATE INDEX idx_pims_mappings_entity ON pims_mappings(entity_type, entity_id);

CREATE INDEX idx_cases_clinic ON cases(clinic_id);
CREATE INDEX idx_cases_canonical_patient ON cases(canonical_patient_id);

CREATE INDEX idx_patients_canonical ON patients(canonical_patient_id);
CREATE INDEX idx_patients_client ON patients(client_id);
CREATE INDEX idx_patients_clinic_new ON patients(clinic_id);
```

### Phase 2: Data Backfill

```sql
-- Step 1: Backfill clinic_id on cases
UPDATE cases c
SET clinic_id = (
  SELECT uca.clinic_id
  FROM user_clinic_access uca
  WHERE uca.user_id = c.user_id AND uca.is_primary = true
  LIMIT 1
)
WHERE c.clinic_id IS NULL;

-- Step 2: Backfill clinic_id on patients
UPDATE patients p
SET clinic_id = (
  SELECT uca.clinic_id
  FROM user_clinic_access uca
  WHERE uca.user_id = p.user_id AND uca.is_primary = true
  LIMIT 1
)
WHERE p.clinic_id IS NULL;

-- Step 3: Create clients from unique owner combinations
INSERT INTO clients (clinic_id, display_name, phone, email, first_visit_at, last_visit_at)
SELECT DISTINCT ON (p.clinic_id, COALESCE(p.owner_phone, LOWER(p.owner_name)))
  p.clinic_id,
  COALESCE(p.owner_name, 'Unknown Owner'),
  p.owner_phone,
  p.owner_email,
  MIN(p.created_at) OVER (PARTITION BY p.clinic_id, COALESCE(p.owner_phone, LOWER(p.owner_name))),
  MAX(p.created_at) OVER (PARTITION BY p.clinic_id, COALESCE(p.owner_phone, LOWER(p.owner_name)))
FROM patients p
WHERE p.clinic_id IS NOT NULL
  AND p.owner_name IS NOT NULL
ON CONFLICT (clinic_id, phone) DO NOTHING;

-- Step 4: Create canonical_patients from unique pet+owner combinations
INSERT INTO canonical_patients (
  clinic_id, client_id, name, species, breed, sex,
  first_visit_at, last_visit_at, visit_count
)
SELECT DISTINCT ON (cl.id, LOWER(p.name))
  p.clinic_id,
  cl.id,
  p.name,
  p.species,
  p.breed,
  p.sex,
  MIN(p.created_at) OVER w,
  MAX(p.created_at) OVER w,
  COUNT(*) OVER w
FROM patients p
JOIN clients cl ON cl.clinic_id = p.clinic_id
  AND (
    cl.phone = p.owner_phone
    OR (cl.phone IS NULL AND LOWER(cl.display_name) = LOWER(p.owner_name))
  )
WHERE p.clinic_id IS NOT NULL
WINDOW w AS (PARTITION BY cl.id, LOWER(p.name))
ON CONFLICT (client_id, LOWER(name)) DO NOTHING;

-- Step 5: Link patients to canonical records
UPDATE patients p
SET
  canonical_patient_id = cp.id,
  client_id = cp.client_id
FROM canonical_patients cp
JOIN clients cl ON cl.id = cp.client_id
WHERE cp.clinic_id = p.clinic_id
  AND LOWER(cp.name) = LOWER(p.name)
  AND (
    cl.phone = p.owner_phone
    OR (cl.phone IS NULL AND LOWER(cl.display_name) = LOWER(p.owner_name))
  )
  AND p.canonical_patient_id IS NULL;

-- Step 6: Link cases to canonical patients
UPDATE cases c
SET canonical_patient_id = p.canonical_patient_id
FROM patients p
WHERE p.case_id = c.id
  AND c.canonical_patient_id IS NULL
  AND p.canonical_patient_id IS NOT NULL;

-- Step 7: Migrate IDEXX external_ids to pims_mappings
INSERT INTO pims_mappings (entity_type, entity_id, pims_type, external_id)
SELECT 'case', id, 'idexx_neo', external_id
FROM cases
WHERE external_id IS NOT NULL AND external_id LIKE 'idexx-%'
ON CONFLICT DO NOTHING;
```

### Phase 3: Application Updates

```typescript
// libs/domain/cases/data-access/src/lib/client-patient-service.ts

export async function findOrCreateClient(
  supabase: SupabaseClient,
  clinicId: string,
  data: { name: string; phone?: string; email?: string },
): Promise<Client> {
  // Try to find by phone first (most reliable)
  if (data.phone) {
    const { data: existing } = await supabase
      .from("clients")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("phone", data.phone)
      .single();

    if (existing) {
      // Update email if we have a newer one
      if (data.email && !existing.email) {
        await supabase
          .from("clients")
          .update({ email: data.email })
          .eq("id", existing.id);
      }
      return existing;
    }
  }

  // Create new client
  const { data: created } = await supabase
    .from("clients")
    .insert({
      clinic_id: clinicId,
      display_name: data.name,
      phone: data.phone,
      email: data.email,
      first_visit_at: new Date().toISOString(),
    })
    .select()
    .single();

  return created;
}

export async function findOrCreateCanonicalPatient(
  supabase: SupabaseClient,
  clinicId: string,
  clientId: string,
  data: { name: string; species?: string; breed?: string; sex?: string },
): Promise<CanonicalPatient> {
  // Try to find existing pet for this client
  const { data: existing } = await supabase
    .from("canonical_patients")
    .select("*")
    .eq("client_id", clientId)
    .ilike("name", data.name)
    .single();

  if (existing) {
    // Update visit tracking
    await supabase
      .from("canonical_patients")
      .update({
        last_visit_at: new Date().toISOString(),
        visit_count: existing.visit_count + 1,
        // Update species/breed if we have better data
        species: data.species || existing.species,
        breed: data.breed || existing.breed,
      })
      .eq("id", existing.id);

    return { ...existing, visit_count: existing.visit_count + 1 };
  }

  // Create new canonical patient
  const { data: created } = await supabase
    .from("canonical_patients")
    .insert({
      clinic_id: clinicId,
      client_id: clientId,
      name: data.name,
      species: data.species,
      breed: data.breed,
      sex: data.sex,
      first_visit_at: new Date().toISOString(),
      last_visit_at: new Date().toISOString(),
      visit_count: 1,
    })
    .select()
    .single();

  return created;
}
```

**Updated Ingestion Flow:**

```typescript
// In CasesService.ingest()
async function ingest(payload: IngestPayload): Promise<Case> {
  const clinicId = await getClinicIdForUser(userId);

  // 1. Find or create client (owner)
  const client = await findOrCreateClient(supabase, clinicId, {
    name: entities.patient.owner.name,
    phone: entities.patient.owner.phone,
    email: entities.patient.owner.email,
  });

  // 2. Find or create canonical patient (pet)
  const canonicalPatient = await findOrCreateCanonicalPatient(
    supabase,
    clinicId,
    client.id,
    {
      name: entities.patient.name,
      species: entities.patient.species,
      breed: entities.patient.breed,
      sex: entities.patient.sex,
    },
  );

  // 3. Create case with new references
  const caseRecord = await createCase({
    ...existingLogic,
    clinic_id: clinicId,
    canonical_patient_id: canonicalPatient.id,
  });

  // 4. Create patient snapshot (for iOS compatibility)
  const patientSnapshot = await createPatient({
    ...existingLogic,
    clinic_id: clinicId,
    client_id: client.id,
    canonical_patient_id: canonicalPatient.id,
  });

  return caseRecord;
}
```

---

## 6. Query Patterns

### 6.1 Get All Clients for a Clinic

```sql
SELECT
  cl.*,
  COUNT(DISTINCT cp.id) as pet_count,
  COUNT(DISTINCT c.id) as total_visits,
  MAX(c.scheduled_at) as last_visit
FROM clients cl
LEFT JOIN canonical_patients cp ON cp.client_id = cl.id
LEFT JOIN cases c ON c.canonical_patient_id = cp.id
WHERE cl.clinic_id = :clinic_id AND cl.is_active = true
GROUP BY cl.id
ORDER BY last_visit DESC NULLS LAST;
```

### 6.2 Get All Pets for a Client

```sql
SELECT
  cp.*,
  COUNT(c.id) as visit_count,
  MAX(c.scheduled_at) as last_visit
FROM canonical_patients cp
LEFT JOIN cases c ON c.canonical_patient_id = cp.id
WHERE cp.client_id = :client_id AND cp.is_active = true
GROUP BY cp.id
ORDER BY last_visit DESC NULLS LAST;
```

### 6.3 Get Visit History for a Pet

```sql
SELECT
  c.*,
  p.weight_kg as visit_weight,
  sn.subjective, sn.objective, sn.assessment, sn.plan,
  ds.content as discharge_summary
FROM cases c
JOIN patients p ON p.case_id = c.id
LEFT JOIN soap_notes sn ON sn.case_id = c.id
LEFT JOIN discharge_summaries ds ON ds.case_id = c.id
WHERE c.canonical_patient_id = :canonical_patient_id
ORDER BY c.scheduled_at DESC NULLS LAST;
```

### 6.4 Find by PIMS External ID

```sql
SELECT cp.*, cl.*
FROM canonical_patients cp
JOIN clients cl ON cl.id = cp.client_id
JOIN pims_mappings pm ON pm.entity_type = 'canonical_patient' AND pm.entity_id = cp.id
WHERE pm.pims_type = :pims_type AND pm.external_id = :external_id;
```

### 6.5 iOS Queries (Unchanged)

```sql
-- This continues to work exactly as before
SELECT c.*, p.*
FROM cases c
LEFT JOIN patients p ON p.case_id = c.id
WHERE c.user_id = :user_id
ORDER BY c.scheduled_at DESC NULLS LAST;
```

---

## 7. RLS Policies

### 7.1 Philosophy: Clinic-Scoped Access

**Old approach (18+ policies per table):**

```sql
-- Complex, overlapping policies
"Users can read own patients by user_id"     → user_id = auth.uid()
"Users can view patients from own cases"     → cases.user_id = auth.uid()
"Users can read patients for shared cases"   → via case_shares table
-- ... 15 more policies
```

**New approach (4 policies per table):**

```sql
-- Simple: Can you access this clinic? Then you can access its data.
clinic_id IN (SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid())
```

### 7.2 Helper Function

```sql
-- Create a function for reusable clinic access check
CREATE OR REPLACE FUNCTION user_has_clinic_access(p_clinic_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_clinic_access
    WHERE user_id = auth.uid() AND clinic_id = p_clinic_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### 7.3 New Table Policies

```sql
-- ===========================================
-- CLIENTS TABLE
-- ===========================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_select ON clients FOR SELECT
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY clients_insert ON clients FOR INSERT
  WITH CHECK (user_has_clinic_access(clinic_id));

CREATE POLICY clients_update ON clients FOR UPDATE
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY clients_delete ON clients FOR DELETE
  USING (
    user_has_clinic_access(clinic_id)
    AND EXISTS (
      SELECT 1 FROM user_clinic_access
      WHERE user_id = auth.uid()
      AND clinic_id = clients.clinic_id
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY clients_service ON clients FOR ALL TO service_role USING (true);

-- ===========================================
-- CANONICAL_PATIENTS TABLE
-- ===========================================
ALTER TABLE canonical_patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY canonical_patients_select ON canonical_patients FOR SELECT
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY canonical_patients_insert ON canonical_patients FOR INSERT
  WITH CHECK (user_has_clinic_access(clinic_id));

CREATE POLICY canonical_patients_update ON canonical_patients FOR UPDATE
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY canonical_patients_delete ON canonical_patients FOR DELETE
  USING (
    user_has_clinic_access(clinic_id)
    AND EXISTS (
      SELECT 1 FROM user_clinic_access
      WHERE user_id = auth.uid()
      AND clinic_id = canonical_patients.clinic_id
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY canonical_patients_service ON canonical_patients FOR ALL TO service_role USING (true);

-- ===========================================
-- PIMS_MAPPINGS TABLE
-- ===========================================
ALTER TABLE pims_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY pims_mappings_select ON pims_mappings FOR SELECT
  USING (
    (entity_type = 'client' AND entity_id IN (SELECT id FROM clients)) OR
    (entity_type = 'canonical_patient' AND entity_id IN (SELECT id FROM canonical_patients)) OR
    (entity_type = 'case' AND entity_id IN (SELECT id FROM cases))
  );

CREATE POLICY pims_mappings_insert ON pims_mappings FOR INSERT
  WITH CHECK (
    (entity_type = 'client' AND entity_id IN (SELECT id FROM clients)) OR
    (entity_type = 'canonical_patient' AND entity_id IN (SELECT id FROM canonical_patients)) OR
    (entity_type = 'case' AND entity_id IN (SELECT id FROM cases))
  );

CREATE POLICY pims_mappings_service ON pims_mappings FOR ALL TO service_role USING (true);
```

### 7.4 Updated Policies for Existing Tables

After adding `clinic_id` to `cases` and `patients`, we can simplify their RLS:

```sql
-- ===========================================
-- CASES TABLE (Simplified)
-- ===========================================
-- Drop old overlapping policies
DROP POLICY IF EXISTS "Users can read owned and shared cases" ON cases;
DROP POLICY IF EXISTS "Users can insert own cases" ON cases;
DROP POLICY IF EXISTS "Users can update own cases" ON cases;
DROP POLICY IF EXISTS "Users can update cases shared with them" ON cases;
DROP POLICY IF EXISTS "Users can delete own cases" ON cases;
DROP POLICY IF EXISTS "Users can delete cases shared with them" ON cases;

-- New clinic-scoped policies
CREATE POLICY cases_select ON cases FOR SELECT
  USING (
    user_has_clinic_access(clinic_id)
    OR user_id = auth.uid()  -- Backward compat for iOS
  );

CREATE POLICY cases_insert ON cases FOR INSERT
  WITH CHECK (
    user_has_clinic_access(clinic_id)
    OR user_id = auth.uid()  -- Backward compat for iOS
  );

CREATE POLICY cases_update ON cases FOR UPDATE
  USING (
    user_has_clinic_access(clinic_id)
    OR user_id = auth.uid()  -- Backward compat for iOS
  );

CREATE POLICY cases_delete ON cases FOR DELETE
  USING (
    user_has_clinic_access(clinic_id)
    OR user_id = auth.uid()  -- Backward compat for iOS
  );

-- ===========================================
-- PATIENTS TABLE (Simplified)
-- ===========================================
-- Drop old overlapping policies
DROP POLICY IF EXISTS "Users can read own patients by user_id" ON patients;
DROP POLICY IF EXISTS "Users can view patients from own cases" ON patients;
DROP POLICY IF EXISTS "Users can read patients for shared cases" ON patients;
DROP POLICY IF EXISTS "Users can insert own patients by user_id" ON patients;
DROP POLICY IF EXISTS "Users can insert patients for own cases" ON patients;
DROP POLICY IF EXISTS "Users can insert patients for shared cases" ON patients;
DROP POLICY IF EXISTS "Users can update own patients by user_id" ON patients;
DROP POLICY IF EXISTS "Users can update patients from own cases" ON patients;
DROP POLICY IF EXISTS "Users can update patients for shared cases" ON patients;
DROP POLICY IF EXISTS "Users can delete own patients by user_id" ON patients;
DROP POLICY IF EXISTS "Users can delete patients for shared cases" ON patients;

-- New clinic-scoped policies
CREATE POLICY patients_select ON patients FOR SELECT
  USING (
    user_has_clinic_access(clinic_id)
    OR user_id = auth.uid()  -- Backward compat for iOS
  );

CREATE POLICY patients_insert ON patients FOR INSERT
  WITH CHECK (
    user_has_clinic_access(clinic_id)
    OR user_id = auth.uid()  -- Backward compat for iOS
  );

CREATE POLICY patients_update ON patients FOR UPDATE
  USING (
    user_has_clinic_access(clinic_id)
    OR user_id = auth.uid()  -- Backward compat for iOS
  );

CREATE POLICY patients_delete ON patients FOR DELETE
  USING (
    user_has_clinic_access(clinic_id)
    OR user_id = auth.uid()  -- Backward compat for iOS
  );
```

### 7.5 Drop Unused `case_shares` Table

```sql
-- case_shares is not used by iOS or web - safe to drop
DROP TABLE IF EXISTS case_shares CASCADE;
```

---

## 8. iOS Compatibility

### 8.1 What Stays the Same (No App Update Needed)

| Aspect                                              | Status                                                     |
| --------------------------------------------------- | ---------------------------------------------------------- |
| `patients` table structure                          | **Unchanged** - all existing columns preserved             |
| `patients.case_id` relationship                     | **Unchanged** - 1:1 with cases                             |
| `patients.owner_name`, `owner_phone`, `owner_email` | **Unchanged** - still populated                            |
| `cases.user_id` column                              | **Unchanged** - still used for queries                     |
| Query patterns                                      | **Unchanged** - `.eq("user_id", userId)` still works       |
| Field naming (snake_case)                           | **Unchanged**                                              |
| Enum values                                         | **Unchanged**                                              |
| RLS behavior                                        | **Unchanged** - `user_id = auth.uid()` still allows access |

### 8.2 What's Added (Ignored by Current App)

| New Column                      | iOS Impact                   |
| ------------------------------- | ---------------------------- |
| `patients.canonical_patient_id` | Ignored (not in Swift model) |
| `patients.client_id`            | Ignored (not in Swift model) |
| `patients.clinic_id`            | Ignored (not in Swift model) |
| `patients.created_by`           | Ignored (not in Swift model) |
| `patients.updated_by`           | Ignored (not in Swift model) |
| `cases.canonical_patient_id`    | Ignored (not in Swift model) |
| `cases.clinic_id`               | Ignored (not in Swift model) |
| `cases.created_by`              | Ignored (not in Swift model) |
| `cases.updated_by`              | Ignored (not in Swift model) |

### 8.3 Future iOS Update - Clinic-Scoped Queries

When updating the iOS app, make these changes:

**1. Add Clinic Access Model:**

```swift
// OdisAI/Models/ClinicAccess.swift (new file)
struct ClinicAccess: Identifiable, Codable {
    let id: UUID
    let clinicId: UUID
    let clinicName: String
    let role: String
    let isPrimary: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case clinicId = "clinic_id"
        case clinicName = "clinic_name"  // from joined clinics table
        case role
        case isPrimary = "is_primary"
    }
}
```

**2. Fetch User's Clinics on Login:**

```swift
// In AuthService.swift - after successful authentication
func fetchUserClinics() async throws -> [ClinicAccess] {
    let response: [ClinicAccess] = try await supabaseClient
        .from("user_clinic_access")
        .select("id, clinic_id, clinics(name), role, is_primary")
        .eq("user_id", currentUser.id.uuidString)
        .execute()
        .value

    return response
}

// Store active clinic
@Published var activeClinicId: UUID?
@Published var userClinics: [ClinicAccess] = []
```

**3. Update Case Queries (Future):**

```swift
// Current (user-scoped) - KEEP WORKING
let ownedCases: [Case.Response] = try await supabaseClient.from("cases")
    .select(ownedCasesSelect)
    .eq("user_id", value: userId.uuidString)  // Still works
    .execute()
    .value

// Future (clinic-scoped) - OPTIONAL UPGRADE
let clinicCases: [Case.Response] = try await supabaseClient.from("cases")
    .select(ownedCasesSelect)
    .eq("clinic_id", value: activeClinicId.uuidString)  // See ALL clinic data
    .execute()
    .value
```

**4. Update Case/Patient Creation (Future):**

```swift
// Current (sets user_id)
let caseData = CreateCaseRequest(
    id: caseId.uuidString,
    type: type.rawValue,
    user_id: currentUser.id  // Still works
)

// Future (sets both for transition period)
let caseData = CreateCaseRequest(
    id: caseId.uuidString,
    type: type.rawValue,
    user_id: currentUser.id,     // Backward compat
    clinic_id: activeClinicId,   // New
    created_by: currentUser.id   // Audit
)
```

### 8.4 iOS Update Timeline

| Phase                  | Change                               | Breaking?                  |
| ---------------------- | ------------------------------------ | -------------------------- |
| **Phase 1 (Now)**      | Backend adds columns, backfills data | No - iOS unchanged         |
| **Phase 2 (Week 2)**   | iOS optionally reads `clinic_id`     | No - fallback to `user_id` |
| **Phase 3 (Week 4)**   | iOS writes `clinic_id` on create     | No - both columns set      |
| **Phase 4 (Month 2)**  | iOS queries by `clinic_id`           | No - sees more data        |
| **Phase 5 (Month 3+)** | Deprecate `user_id` queries          | Requires force update      |

### 8.5 Future iOS Update Benefits

When iOS app is updated:

- **Clinic Dashboard** - See ALL cases from ALL staff at clinic
- **Patient history view** - "Show all visits for Max"
- **Multi-pet view** - "Show all pets for John Smith"
- **Contact auto-update** - Client phone change updates everywhere
- **Faster lookups** - Direct `clinic_id` filtering
- **Multi-clinic support** - Switch between clinics if user has access to multiple

---

## 9. Benefits Summary

### Data Normalization Benefits

| Before                        | After                                       |
| ----------------------------- | ------------------------------------------- |
| Feng Qiao's contact stored 9x | **Stored 1x in `clients`**                  |
| Phone change = 9 updates      | **Phone change = 1 update**                 |
| No "all pets for owner" view  | **Simple JOIN on `client_id`**              |
| No patient visit history      | **Full history via `canonical_patient_id`** |
| IDEXX-specific `external_id`  | **PIMS-agnostic `pims_mappings`**           |

### Clinic-Scoped Architecture Benefits

| Before                          | After                                 |
| ------------------------------- | ------------------------------------- |
| Data siloed per user            | **Shared across clinic staff**        |
| Queries via `user_id` → clinic  | **Direct `clinic_id` on all tables**  |
| 18+ overlapping RLS policies    | **4 simple policies per table**       |
| `case_shares` for collaboration | **Implicit via `user_clinic_access`** |
| Staff leaves → orphaned data    | **Data stays with clinic**            |
| Who owns record? User           | **Who created? `created_by` (audit)** |

### Compatibility

| Concern                | Status                                        |
| ---------------------- | --------------------------------------------- |
| iOS app breaks         | **❌ No - iOS unchanged, queries still work** |
| Web app breaks         | **❌ No - All backward compatible**           |
| IDEXX extension breaks | **❌ No - Uses service client**               |
| Existing data lost     | **❌ No - All columns preserved**             |

---

## 10. Implementation Checklist

### Phase 1: Schema (Day 1)

- [ ] Create migration `20260114_add_client_patient_identity_layer.sql`
  - [ ] Create `clients` table
  - [ ] Create `canonical_patients` table
  - [ ] Create `pims_mappings` table
  - [ ] Add `clinic_id`, `created_by`, `updated_by` to `cases`
  - [ ] Add `clinic_id`, `created_by`, `updated_by`, `canonical_patient_id`, `client_id` to `patients`
  - [ ] Create `user_has_clinic_access()` helper function
  - [ ] Drop `case_shares` table (unused)
- [ ] Deploy to staging
- [ ] Verify iOS app still works
- [ ] Deploy to production

### Phase 2: RLS Policies (Day 1-2)

- [ ] Create new simplified policies for `clients`, `canonical_patients`, `pims_mappings`
- [ ] Drop old overlapping policies on `cases` (6 policies)
- [ ] Drop old overlapping policies on `patients` (11 policies)
- [ ] Create new clinic-scoped + user fallback policies on `cases`
- [ ] Create new clinic-scoped + user fallback policies on `patients`
- [ ] Verify iOS app still has access via `user_id = auth.uid()`
- [ ] Verify web dashboard has access via `user_clinic_access`

### Phase 3: Backfill (Day 2-3)

- [ ] Backfill `clinic_id` on `cases` from `user_clinic_access`
- [ ] Backfill `clinic_id` on `patients` from `user_clinic_access`
- [ ] Backfill `created_by` from `user_id` on both tables
- [ ] Create `clients` from unique owner combinations
- [ ] Create `canonical_patients` from unique pet+owner combinations
- [ ] Link `patients` to `canonical_patient_id` and `client_id`
- [ ] Link `cases` to `canonical_patient_id`
- [ ] Migrate IDEXX `external_id` to `pims_mappings`
- [ ] Verify data integrity with spot checks

### Phase 4: Application (Week 2)

- [ ] Implement `findOrCreateClient()`
- [ ] Implement `findOrCreateCanonicalPatient()`
- [ ] Update `CasesService.ingest()` to populate new columns
- [ ] Update web to send `clinic_id` on case/patient creation
- [ ] Add tRPC endpoints for client/patient lookup
- [ ] Update dashboard to show client/patient views

### Phase 5: Polish (Week 3+)

- [ ] Add client merge UI
- [ ] Add patient history UI
- [ ] Update discharge call flow to use `clients.phone`
- [ ] Plan iOS app update for clinic-scoped queries

### Phase 6: iOS Update (Month 2+)

- [ ] Add `ClinicAccess` model
- [ ] Fetch user clinics on login
- [ ] Add `clinic_id` to `CreateCaseRequest`
- [ ] Update queries to use `clinic_id` (optional)
- [ ] Add clinic switcher UI (if multi-clinic)

---

## Appendix: File Locations

| Purpose        | Path                                                     |
| -------------- | -------------------------------------------------------- |
| Cases Service  | `libs/domain/cases/data-access/src/lib/cases-service.ts` |
| Case CRUD      | `libs/domain/cases/data-access/src/lib/case-crud.ts`     |
| Database Types | `libs/shared/types/src/database.types.ts`                |
| Migrations     | `supabase/migrations/`                                   |

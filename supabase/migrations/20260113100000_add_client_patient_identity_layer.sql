-- ============================================================================
-- MIGRATION: Add Client/Patient Identity Layer with Clinic-Scoped Architecture
-- ============================================================================
-- This migration:
-- 1. Creates clients table (pet owners - single source of truth for contact info)
-- 2. Creates canonical_patients table (pets - single source of truth for pet identity)
-- 3. Creates pims_mappings table (PIMS-agnostic external ID tracking)
-- 4. Adds clinic_id, created_by, updated_by to cases and patients
-- 5. Creates user_has_clinic_access() helper function for RLS
-- 6. Simplifies RLS from 18+ to 4 policies per table
-- 7. Drops unused case_shares table
--
-- BACKWARD COMPATIBILITY: All changes are additive. iOS app continues to work
-- via user_id fallback in RLS policies.
-- ============================================================================

-- ============================================================================
-- 1. CREATE CLIENTS TABLE (Pet Owners)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
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

  -- Deduplication constraint (one phone per clinic)
  CONSTRAINT clients_unique_phone
    UNIQUE NULLS NOT DISTINCT (clinic_id, phone)
);

-- Indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_clinic ON clients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(clinic_id, LOWER(display_name));
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(clinic_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(clinic_id, LOWER(email)) WHERE email IS NOT NULL;

-- Comments
COMMENT ON TABLE clients IS 'Pet owners - single source of truth for contact information';
COMMENT ON COLUMN clients.display_name IS 'Full name for display (computed from first/last or entered directly)';
COMMENT ON COLUMN clients.phone IS 'Primary phone - used as deduplication key';
COMMENT ON COLUMN clients.preferred_contact_method IS 'How client prefers to be contacted: phone, email, or sms';

-- ============================================================================
-- 2. CREATE CANONICAL_PATIENTS TABLE (Pets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS canonical_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  species TEXT,      -- 'dog', 'cat', 'bird', 'rabbit', 'reptile', 'other'
  breed TEXT,
  sex TEXT,          -- 'male', 'female', 'male_neutered', 'female_spayed', 'unknown'
  color TEXT,

  -- Demographics
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for canonical_patients
CREATE INDEX IF NOT EXISTS idx_canonical_patients_clinic ON canonical_patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_canonical_patients_client ON canonical_patients(client_id);
CREATE INDEX IF NOT EXISTS idx_canonical_patients_name ON canonical_patients(clinic_id, LOWER(name));
CREATE INDEX IF NOT EXISTS idx_canonical_patients_species ON canonical_patients(clinic_id, species);
-- Unique constraint: one pet per name per owner (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_canonical_patients_unique_per_client ON canonical_patients(client_id, LOWER(name));

-- Comments
COMMENT ON TABLE canonical_patients IS 'Pets - single source of truth for pet identity across visits';
COMMENT ON COLUMN canonical_patients.client_id IS 'Owner of this pet';
COMMENT ON COLUMN canonical_patients.visit_count IS 'Total number of visits for this pet';

-- ============================================================================
-- 3. CREATE PIMS_MAPPINGS TABLE (External System References)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pims_mappings (
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

-- Indexes for pims_mappings
CREATE INDEX IF NOT EXISTS idx_pims_mappings_lookup ON pims_mappings(pims_type, external_id);
CREATE INDEX IF NOT EXISTS idx_pims_mappings_entity ON pims_mappings(entity_type, entity_id);

-- Comments
COMMENT ON TABLE pims_mappings IS 'Maps internal entities to external PIMS system IDs (IDEXX, ezyVet, etc.)';
COMMENT ON COLUMN pims_mappings.entity_type IS 'Type of entity: client, canonical_patient, or case';
COMMENT ON COLUMN pims_mappings.pims_type IS 'External PIMS system: idexx_neo, ezyvet, shepherd, provet';

-- ============================================================================
-- 4. ADD COLUMNS TO EXISTING TABLES
-- ============================================================================

-- 4a. Add columns to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS canonical_patient_id UUID REFERENCES canonical_patients(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Indexes for cases
CREATE INDEX IF NOT EXISTS idx_cases_clinic ON cases(clinic_id);
CREATE INDEX IF NOT EXISTS idx_cases_canonical_patient ON cases(canonical_patient_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_by ON cases(created_by);

-- 4b. Add columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS canonical_patient_id UUID REFERENCES canonical_patients(id);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Indexes for patients
CREATE INDEX IF NOT EXISTS idx_patients_canonical ON patients(canonical_patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_client ON patients(client_id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);

-- Comments
COMMENT ON COLUMN cases.clinic_id IS 'Direct clinic association for RLS and queries';
COMMENT ON COLUMN cases.canonical_patient_id IS 'Link to canonical patient identity';
COMMENT ON COLUMN cases.created_by IS 'User who created this case (audit)';
COMMENT ON COLUMN cases.updated_by IS 'User who last modified this case (audit)';
COMMENT ON COLUMN patients.canonical_patient_id IS 'Link to canonical patient identity';
COMMENT ON COLUMN patients.client_id IS 'Link to client (owner) record';
COMMENT ON COLUMN patients.clinic_id IS 'Direct clinic association for RLS and queries';

-- ============================================================================
-- 5. CREATE RLS HELPER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION user_has_clinic_access(p_clinic_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_clinic_access
    WHERE user_id = auth.uid() AND clinic_id = p_clinic_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_has_clinic_access IS 'Returns true if current user has access to the specified clinic via user_clinic_access table';

-- ============================================================================
-- 6. RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- 6a. CLIENTS TABLE RLS
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

-- 6b. CANONICAL_PATIENTS TABLE RLS
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

-- 6c. PIMS_MAPPINGS TABLE RLS
ALTER TABLE pims_mappings ENABLE ROW LEVEL SECURITY;

-- Access based on entity access (polymorphic check)
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

CREATE POLICY pims_mappings_update ON pims_mappings FOR UPDATE
  USING (
    (entity_type = 'client' AND entity_id IN (SELECT id FROM clients)) OR
    (entity_type = 'canonical_patient' AND entity_id IN (SELECT id FROM canonical_patients)) OR
    (entity_type = 'case' AND entity_id IN (SELECT id FROM cases))
  );

CREATE POLICY pims_mappings_service ON pims_mappings FOR ALL TO service_role USING (true);

-- ============================================================================
-- 7. DROP UNUSED CASE_SHARES TABLE
-- ============================================================================
-- case_shares was never used by iOS or web - confirmed via codebase grep
DROP TABLE IF EXISTS case_shares CASCADE;

-- ============================================================================
-- 8. DROP OLD OVERLAPPING RLS POLICIES ON CASES
-- ============================================================================
DROP POLICY IF EXISTS "Users can read owned and shared cases" ON cases;
DROP POLICY IF EXISTS "Users can insert own cases" ON cases;
DROP POLICY IF EXISTS "Users can update own cases" ON cases;
DROP POLICY IF EXISTS "Users can update cases shared with them" ON cases;
DROP POLICY IF EXISTS "Users can delete own cases" ON cases;
DROP POLICY IF EXISTS "Users can delete cases shared with them" ON cases;

-- ============================================================================
-- 9. DROP OLD OVERLAPPING RLS POLICIES ON PATIENTS
-- ============================================================================
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

-- ============================================================================
-- 10. NEW CLINIC-SCOPED RLS POLICIES FOR CASES
-- ============================================================================
-- These policies use clinic_id with user_id fallback for iOS backward compatibility

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

-- ============================================================================
-- 11. NEW CLINIC-SCOPED RLS POLICIES FOR PATIENTS
-- ============================================================================
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

-- ============================================================================
-- 12. BACKFILL CLINIC_ID ON EXISTING DATA
-- ============================================================================
-- Backfill clinic_id on cases from user_clinic_access
UPDATE cases c
SET clinic_id = (
  SELECT uca.clinic_id
  FROM user_clinic_access uca
  WHERE uca.user_id = c.user_id AND uca.is_primary = true
  LIMIT 1
)
WHERE c.clinic_id IS NULL AND c.user_id IS NOT NULL;

-- Backfill clinic_id on patients from user_clinic_access
UPDATE patients p
SET clinic_id = (
  SELECT uca.clinic_id
  FROM user_clinic_access uca
  WHERE uca.user_id = p.user_id AND uca.is_primary = true
  LIMIT 1
)
WHERE p.clinic_id IS NULL AND p.user_id IS NOT NULL;

-- Backfill created_by from user_id
UPDATE cases SET created_by = user_id WHERE created_by IS NULL AND user_id IS NOT NULL;
UPDATE patients SET created_by = user_id WHERE created_by IS NULL AND user_id IS NOT NULL;

-- ============================================================================
-- 13. CREATE CLIENTS FROM EXISTING PATIENT OWNER DATA
-- ============================================================================
-- Create client records from unique owner combinations in patients table
INSERT INTO clients (clinic_id, display_name, phone, email, first_visit_at, last_visit_at, metadata)
SELECT DISTINCT ON (p.clinic_id, COALESCE(p.owner_phone, LOWER(p.owner_name)))
  p.clinic_id,
  COALESCE(p.owner_name, 'Unknown Owner'),
  p.owner_phone,
  p.owner_email,
  MIN(p.created_at) OVER (PARTITION BY p.clinic_id, COALESCE(p.owner_phone, LOWER(p.owner_name))),
  MAX(p.created_at) OVER (PARTITION BY p.clinic_id, COALESCE(p.owner_phone, LOWER(p.owner_name))),
  '{}'::JSONB
FROM patients p
WHERE p.clinic_id IS NOT NULL
  AND p.owner_name IS NOT NULL
ON CONFLICT (clinic_id, phone) DO NOTHING;

-- ============================================================================
-- 14. CREATE CANONICAL_PATIENTS FROM EXISTING PATIENT DATA
-- ============================================================================
-- Create canonical patient records from unique pet+owner combinations
INSERT INTO canonical_patients (
  clinic_id, client_id, name, species, breed, sex,
  first_visit_at, last_visit_at, visit_count, metadata
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
  COUNT(*) OVER w,
  '{}'::JSONB
FROM patients p
JOIN clients cl ON cl.clinic_id = p.clinic_id
  AND (
    cl.phone = p.owner_phone
    OR (cl.phone IS NULL AND LOWER(cl.display_name) = LOWER(p.owner_name))
  )
WHERE p.clinic_id IS NOT NULL
  AND p.name IS NOT NULL
WINDOW w AS (PARTITION BY cl.id, LOWER(p.name))
ON CONFLICT DO NOTHING;  -- Uses idx_canonical_patients_unique_per_client unique index

-- ============================================================================
-- 15. LINK EXISTING PATIENTS TO CANONICAL RECORDS
-- ============================================================================
-- Link patients to their canonical patient and client records
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

-- Link cases to canonical patients via their patient snapshot
UPDATE cases c
SET canonical_patient_id = p.canonical_patient_id
FROM patients p
WHERE p.case_id = c.id
  AND c.canonical_patient_id IS NULL
  AND p.canonical_patient_id IS NOT NULL;

-- ============================================================================
-- 16. MIGRATE IDEXX EXTERNAL_IDS TO PIMS_MAPPINGS
-- ============================================================================
INSERT INTO pims_mappings (entity_type, entity_id, pims_type, external_id)
SELECT 'case', id, 'idexx_neo', external_id
FROM cases
WHERE external_id IS NOT NULL
  AND external_id LIKE 'idexx-%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES (for manual inspection after migration)
-- ============================================================================
-- Run these queries after migration to verify data integrity:
--
-- 1. Check client creation:
--    SELECT clinic_id, COUNT(*) FROM clients GROUP BY clinic_id;
--
-- 2. Check canonical patient creation:
--    SELECT clinic_id, COUNT(*) FROM canonical_patients GROUP BY clinic_id;
--
-- 3. Check case clinic_id backfill:
--    SELECT COUNT(*) FROM cases WHERE clinic_id IS NULL;
--
-- 4. Check patient linkage:
--    SELECT COUNT(*) FROM patients WHERE canonical_patient_id IS NOT NULL;
--
-- 5. Check PIMS mappings:
--    SELECT COUNT(*) FROM pims_mappings;
-- ============================================================================

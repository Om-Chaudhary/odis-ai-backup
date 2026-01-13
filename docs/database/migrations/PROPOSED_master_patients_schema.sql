-- ============================================================================
-- PROPOSED MIGRATION: Master Patient Records for Deduplication
-- ============================================================================
-- Status: DRAFT - Requires review before execution
-- Author: Database Administrator
-- Date: 2026-01-12
--
-- Purpose:
--   This migration introduces a master_patients table to consolidate
--   patient identity across multiple visits/cases. It solves the problem
--   of duplicate patient records being created for repeat patients.
--
-- Approach:
--   - New master_patients table with unique constraint on (clinic_id, name, owner_name)
--   - Link existing patients table via master_patient_id FK
--   - Add clinic_id to cases table for direct clinic association
--   - Provide helper function for find-or-create pattern
--
-- Rollback:
--   See bottom of file for rollback statements
-- ============================================================================

-- ============================================================================
-- STEP 1: Create master_patients table
-- ============================================================================
CREATE TABLE IF NOT EXISTS master_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Clinic association (required)
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Core identity fields (used for uniqueness)
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,

  -- Demographics (updated with latest values on each visit)
  species TEXT,
  breed TEXT,
  sex TEXT,
  weight_kg NUMERIC(6,2),
  date_of_birth DATE,

  -- Owner contact info (single source of truth)
  owner_phone TEXT,
  owner_email TEXT,

  -- External system identifiers
  idexx_patient_id TEXT,              -- IDEXX Neo patient ID
  ezyvet_patient_id TEXT,             -- EzyVet patient ID (future)

  -- Visit tracking
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visit_count INTEGER NOT NULL DEFAULT 1,

  -- Flexible metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint for patient identity deduplication
-- Using expression index for case-insensitive matching
CREATE UNIQUE INDEX IF NOT EXISTS idx_master_patients_unique_identity
  ON master_patients (clinic_id, LOWER(TRIM(name)), LOWER(TRIM(owner_name)));

-- Fast lookup by clinic + patient name
CREATE INDEX IF NOT EXISTS idx_master_patients_clinic_name
  ON master_patients (clinic_id, LOWER(TRIM(name)));

-- Fast lookup by IDEXX patient ID
CREATE INDEX IF NOT EXISTS idx_master_patients_idexx_id
  ON master_patients (clinic_id, idexx_patient_id)
  WHERE idexx_patient_id IS NOT NULL;

-- ============================================================================
-- STEP 2: Add master_patient_id to existing patients table
-- ============================================================================
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS master_patient_id UUID REFERENCES master_patients(id);

CREATE INDEX IF NOT EXISTS idx_patients_master_patient_id
  ON patients (master_patient_id)
  WHERE master_patient_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Add clinic_id to cases table
-- ============================================================================
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);

CREATE INDEX IF NOT EXISTS idx_cases_clinic_id
  ON cases (clinic_id)
  WHERE clinic_id IS NOT NULL;

-- ============================================================================
-- STEP 4: Create helper function for find-or-create pattern
-- ============================================================================
CREATE OR REPLACE FUNCTION find_or_create_master_patient(
  p_clinic_id UUID,
  p_name TEXT,
  p_owner_name TEXT,
  p_owner_phone TEXT DEFAULT NULL,
  p_owner_email TEXT DEFAULT NULL,
  p_species TEXT DEFAULT NULL,
  p_breed TEXT DEFAULT NULL,
  p_sex TEXT DEFAULT NULL,
  p_weight_kg NUMERIC DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_idexx_patient_id TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_master_patient_id UUID;
  v_normalized_name TEXT;
  v_normalized_owner TEXT;
BEGIN
  -- Normalize inputs
  v_normalized_name := LOWER(TRIM(p_name));
  v_normalized_owner := LOWER(TRIM(p_owner_name));

  -- Input validation
  IF v_normalized_name = '' OR v_normalized_owner = '' THEN
    RAISE EXCEPTION 'Patient name and owner name are required';
  END IF;

  -- Try to find existing master patient
  SELECT id INTO v_master_patient_id
  FROM master_patients
  WHERE clinic_id = p_clinic_id
    AND LOWER(TRIM(name)) = v_normalized_name
    AND LOWER(TRIM(owner_name)) = v_normalized_owner;

  IF v_master_patient_id IS NOT NULL THEN
    -- Update existing master patient with latest info
    UPDATE master_patients
    SET
      last_seen_at = NOW(),
      visit_count = visit_count + 1,
      -- Update demographics if provided (prefer newer non-null values)
      species = COALESCE(p_species, species),
      breed = COALESCE(p_breed, breed),
      sex = COALESCE(p_sex, sex),
      weight_kg = COALESCE(p_weight_kg, weight_kg),
      date_of_birth = COALESCE(p_date_of_birth, date_of_birth),
      -- Update contact info if provided
      owner_phone = COALESCE(p_owner_phone, owner_phone),
      owner_email = COALESCE(p_owner_email, owner_email),
      -- Set IDEXX ID if not already set
      idexx_patient_id = COALESCE(idexx_patient_id, p_idexx_patient_id),
      updated_at = NOW()
    WHERE id = v_master_patient_id;

    RETURN v_master_patient_id;
  END IF;

  -- Create new master patient record
  INSERT INTO master_patients (
    clinic_id,
    name,
    owner_name,
    owner_phone,
    owner_email,
    species,
    breed,
    sex,
    weight_kg,
    date_of_birth,
    idexx_patient_id,
    first_seen_at,
    last_seen_at,
    visit_count
  ) VALUES (
    p_clinic_id,
    TRIM(p_name),
    TRIM(p_owner_name),
    p_owner_phone,
    p_owner_email,
    p_species,
    p_breed,
    p_sex,
    p_weight_kg,
    p_date_of_birth,
    p_idexx_patient_id,
    NOW(),
    NOW(),
    1
  )
  RETURNING id INTO v_master_patient_id;

  RETURN v_master_patient_id;
END;
$$;

-- ============================================================================
-- STEP 5: Create view for patient history
-- ============================================================================
CREATE OR REPLACE VIEW patient_visit_history AS
SELECT
  mp.id AS master_patient_id,
  mp.clinic_id,
  mp.name AS patient_name,
  mp.owner_name,
  mp.species,
  mp.breed,
  mp.visit_count,
  mp.first_seen_at,
  mp.last_seen_at,
  c.id AS case_id,
  c.status AS case_status,
  c.source AS case_source,
  c.scheduled_at,
  c.created_at AS visit_date,
  p.id AS patient_record_id
FROM master_patients mp
LEFT JOIN patients p ON p.master_patient_id = mp.id
LEFT JOIN cases c ON c.id = p.case_id
ORDER BY mp.id, c.created_at DESC;

-- ============================================================================
-- STEP 6: Enable RLS on master_patients
-- ============================================================================
ALTER TABLE master_patients ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view patients from clinics they have access to
CREATE POLICY "Users can view clinic patients"
  ON master_patients
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT uca.clinic_id
      FROM user_clinic_access uca
      WHERE uca.user_id = auth.uid()
    )
  );

-- Policy: Users can insert patients to clinics they have access to
CREATE POLICY "Users can create clinic patients"
  ON master_patients
  FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT uca.clinic_id
      FROM user_clinic_access uca
      WHERE uca.user_id = auth.uid()
    )
  );

-- Policy: Users can update patients from clinics they have access to
CREATE POLICY "Users can update clinic patients"
  ON master_patients
  FOR UPDATE
  USING (
    clinic_id IN (
      SELECT uca.clinic_id
      FROM user_clinic_access uca
      WHERE uca.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 7: Backfill existing data (RUN AFTER SCHEMA DEPLOYED)
-- ============================================================================
-- This should be run as a separate migration after the schema is in place
-- and application code is updated to set master_patient_id on new records.

/*
-- Backfill master_patients from existing patients
DO $$
DECLARE
  v_clinic_id UUID;
  v_user_id UUID;
  v_patient RECORD;
  v_master_id UUID;
  v_backfilled INT := 0;
BEGIN
  -- Process each unique patient (name + owner_name) per user
  FOR v_patient IN
    SELECT DISTINCT ON (user_id, LOWER(TRIM(name)), LOWER(TRIM(owner_name)))
      id,
      user_id,
      name,
      owner_name,
      owner_phone,
      owner_email,
      species,
      breed,
      sex,
      weight_kg,
      date_of_birth,
      external_id AS idexx_patient_id
    FROM patients
    WHERE master_patient_id IS NULL
    ORDER BY user_id, LOWER(TRIM(name)), LOWER(TRIM(owner_name)), created_at DESC
  LOOP
    -- Get clinic_id for this user
    SELECT clinic_id INTO v_clinic_id
    FROM user_clinic_access
    WHERE user_id = v_patient.user_id
      AND is_primary = true
    LIMIT 1;

    IF v_clinic_id IS NULL THEN
      RAISE WARNING 'No primary clinic found for user %', v_patient.user_id;
      CONTINUE;
    END IF;

    -- Create or find master patient
    v_master_id := find_or_create_master_patient(
      v_clinic_id,
      v_patient.name,
      v_patient.owner_name,
      v_patient.owner_phone,
      v_patient.owner_email,
      v_patient.species,
      v_patient.breed,
      v_patient.sex,
      v_patient.weight_kg,
      v_patient.date_of_birth,
      v_patient.idexx_patient_id
    );

    v_backfilled := v_backfilled + 1;
  END LOOP;

  RAISE NOTICE 'Backfilled % master patient records', v_backfilled;
END $$;

-- Link all existing patients to their master records
UPDATE patients p
SET master_patient_id = mp.id
FROM master_patients mp
JOIN user_clinic_access uca ON uca.clinic_id = mp.clinic_id
WHERE p.master_patient_id IS NULL
  AND p.user_id = uca.user_id
  AND LOWER(TRIM(p.name)) = LOWER(TRIM(mp.name))
  AND LOWER(TRIM(p.owner_name)) = LOWER(TRIM(mp.owner_name));

-- Backfill clinic_id on cases
UPDATE cases c
SET clinic_id = (
  SELECT uca.clinic_id
  FROM user_clinic_access uca
  WHERE uca.user_id = c.user_id
    AND uca.is_primary = true
  LIMIT 1
)
WHERE c.clinic_id IS NULL;
*/

-- ============================================================================
-- ROLLBACK STATEMENTS (if needed)
-- ============================================================================
/*
DROP VIEW IF EXISTS patient_visit_history;
DROP FUNCTION IF EXISTS find_or_create_master_patient;
DROP POLICY IF EXISTS "Users can view clinic patients" ON master_patients;
DROP POLICY IF EXISTS "Users can create clinic patients" ON master_patients;
DROP POLICY IF EXISTS "Users can update clinic patients" ON master_patients;
ALTER TABLE patients DROP COLUMN IF EXISTS master_patient_id;
ALTER TABLE cases DROP COLUMN IF EXISTS clinic_id;
DROP TABLE IF EXISTS master_patients;
*/

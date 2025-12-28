-- ============================================================================
-- ODIS AI Database Migration: Current State → Ideal Schema
-- ============================================================================
--
-- This migration transforms the existing database to the ideal schema.
-- It handles:
--   1. Creating new enums
--   2. Creating new tables (clients, patients_new, cases_new, calls, etc.)
--   3. Migrating and deduplicating data
--   4. Renaming old tables to _legacy
--   5. Renaming new tables to final names
--   6. Setting up RLS, indexes, triggers, functions
--
-- IMPORTANT: Run this in a transaction on a test branch first!
-- Use: SELECT * FROM supabase_functions.create_branch('schema-migration');
--
-- Estimated runtime: 5-15 minutes depending on data volume
--
-- ============================================================================

-- Start transaction
BEGIN;

-- ============================================================================
-- STEP 1: CREATE EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 2: CREATE NEW ENUMS
-- ============================================================================
-- Using DO blocks to handle "already exists" gracefully

DO $$
BEGIN
  -- External data source (PIMS-agnostic)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'external_source') THEN
    CREATE TYPE external_source AS ENUM (
      'manual', 'ios_scribe', 'idexx_neo', 'idexx_cornerstone', 'idexx_rhapsody',
      'avimark', 'evetpractice', 'shepherd', 'digitail', 'api', 'import'
    );
  END IF;

  -- Case visibility (may already exist as CaseVisibility)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_visibility_new') THEN
    CREATE TYPE case_visibility_new AS ENUM ('private', 'clinic', 'public');
  END IF;

  -- Case type (may already exist as CaseType)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_type_new') THEN
    CREATE TYPE case_type_new AS ENUM (
      'checkup', 'emergency', 'surgery', 'follow_up', 'dental',
      'vaccination', 'wellness', 'consultation', 'grooming', 'boarding', 'other'
    );
  END IF;

  -- Case status (may already exist as CaseStatus)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_status_new') THEN
    CREATE TYPE case_status_new AS ENUM (
      'draft', 'ongoing', 'completed', 'reviewed', 'archived', 'cancelled', 'pending_review'
    );
  END IF;

  -- Discharge status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discharge_status') THEN
    CREATE TYPE discharge_status AS ENUM (
      'not_started', 'call_scheduled', 'call_in_progress', 'call_completed',
      'email_scheduled', 'email_sent', 'completed', 'skipped'
    );
  END IF;

  -- Call direction
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_direction') THEN
    CREATE TYPE call_direction AS ENUM ('inbound', 'outbound');
  END IF;

  -- Call type
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_type_enum') THEN
    CREATE TYPE call_type_enum AS ENUM (
      'discharge', 'follow_up', 'appointment', 'general', 'emergency', 'reminder'
    );
  END IF;

  -- Call status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_status') THEN
    CREATE TYPE call_status AS ENUM (
      'queued', 'scheduled', 'ringing', 'in_progress', 'completed',
      'failed', 'cancelled', 'voicemail', 'no_answer', 'busy'
    );
  END IF;

  -- Sentiment
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sentiment') THEN
    CREATE TYPE sentiment AS ENUM ('positive', 'neutral', 'negative');
  END IF;

  -- Attention severity
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attention_severity_enum') THEN
    CREATE TYPE attention_severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;

  -- Call approach
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_approach') THEN
    CREATE TYPE call_approach AS ENUM ('brief_checkin', 'standard_assessment', 'detailed_monitoring');
  END IF;

  -- Clinical note type
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clinical_note_type') THEN
    CREATE TYPE clinical_note_type AS ENUM (
      'transcription', 'consultation_notes', 'clinical_notes', 'soap_draft', 'progress_notes'
    );
  END IF;

  -- Processing status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'processing_status_enum') THEN
    CREATE TYPE processing_status_enum AS ENUM ('recording', 'uploading', 'processing', 'completed', 'failed');
  END IF;

  -- Contact method
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_method') THEN
    CREATE TYPE contact_method AS ENUM ('phone', 'email', 'sms');
  END IF;

  -- Phone type
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'phone_type') THEN
    CREATE TYPE phone_type AS ENUM ('mobile', 'home', 'work');
  END IF;

  -- Animal sex
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'animal_sex') THEN
    CREATE TYPE animal_sex AS ENUM ('male', 'female', 'male_neutered', 'female_spayed', 'unknown');
  END IF;

  -- Weight unit
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'weight_unit') THEN
    CREATE TYPE weight_unit AS ENUM ('kg', 'lb');
  END IF;

  -- Template type
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_type') THEN
    CREATE TYPE template_type AS ENUM ('soap', 'discharge_summary', 'email', 'sms', 'prompt');
  END IF;
END$$;

-- ============================================================================
-- STEP 3: ENHANCE EXISTING CLINICS TABLE
-- ============================================================================

-- Add new columns to clinics
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS country text DEFAULT 'US';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Los_Angeles';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS business_hours jsonb;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS emergency_phone text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS emergency_instructions text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS vapi_assistant_id text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS vapi_phone_number_id text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS vapi_inbound_assistant_id text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;

-- Migrate existing VAPI fields
UPDATE clinics SET
  vapi_assistant_id = COALESCE(vapi_assistant_id, outbound_assistant_id),
  vapi_phone_number_id = COALESCE(vapi_phone_number_id, phone_number_id),
  vapi_inbound_assistant_id = COALESCE(vapi_inbound_assistant_id, inbound_assistant_id)
WHERE vapi_assistant_id IS NULL;

-- ============================================================================
-- STEP 4: ADD CLINIC_ID TO USERS TABLE
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_settings jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- Populate full_name from first_name + last_name
UPDATE users SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE full_name IS NULL;

-- Backfill clinic_id from clinic_name
UPDATE users u
SET clinic_id = c.id
FROM clinics c
WHERE LOWER(TRIM(u.clinic_name)) = LOWER(TRIM(c.name))
  AND u.clinic_id IS NULL;

-- Create clinics for users without a match
INSERT INTO clinics (name, pims_type, is_active, slug)
SELECT DISTINCT
  u.clinic_name,
  'idexx_neo',
  true,
  LOWER(REGEXP_REPLACE(u.clinic_name, '[^a-zA-Z0-9]+', '-', 'g'))
FROM users u
WHERE u.clinic_name IS NOT NULL
  AND u.clinic_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM clinics c WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(u.clinic_name))
  )
ON CONFLICT (slug) DO NOTHING;

-- Backfill again after clinic creation
UPDATE users u
SET clinic_id = c.id
FROM clinics c
WHERE LOWER(TRIM(u.clinic_name)) = LOWER(TRIM(c.name))
  AND u.clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);

-- ============================================================================
-- STEP 5: CREATE CLIENTS TABLE (Pet Owners)
-- ============================================================================

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Identity
  first_name text,
  last_name text,
  full_name text,

  -- Contact
  phone text NOT NULL,
  phone_type phone_type DEFAULT 'mobile',
  phone_secondary text,
  phone_secondary_type phone_type,
  email text,

  -- Address
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'US',

  -- External IDs
  external_ids jsonb DEFAULT '{}'::jsonb,
  external_source external_source,

  -- Preferences
  preferred_contact_method contact_method DEFAULT 'phone',
  preferred_contact_time text,
  language text DEFAULT 'en',
  communication_notes text,

  -- Flags
  is_active boolean DEFAULT true,
  do_not_contact boolean DEFAULT false,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_contacted_at timestamptz,

  CONSTRAINT clients_user_phone_unique UNIQUE(user_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_clinic_id ON clients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_full_name_trgm ON clients USING gin(full_name gin_trgm_ops);

-- Populate clients from existing patient owner data
INSERT INTO clients (user_id, clinic_id, full_name, phone, email, created_at)
SELECT DISTINCT ON (p.user_id, NULLIF(TRIM(p.owner_phone), ''))
  p.user_id,
  COALESCE(u.clinic_id, (SELECT id FROM clinics LIMIT 1)),
  p.owner_name,
  NULLIF(TRIM(p.owner_phone), ''),
  p.owner_email,
  MIN(p.created_at) OVER (PARTITION BY p.user_id, NULLIF(TRIM(p.owner_phone), ''))
FROM patients p
JOIN users u ON p.user_id = u.id
WHERE p.owner_phone IS NOT NULL
  AND TRIM(p.owner_phone) != ''
  AND p.user_id IS NOT NULL
  AND u.clinic_id IS NOT NULL
ON CONFLICT (user_id, phone) DO NOTHING;

-- Also populate from cases.metadata for IDEXX clients
INSERT INTO clients (user_id, clinic_id, full_name, phone, email, external_ids, external_source, created_at)
SELECT DISTINCT ON (c.user_id, NULLIF(TRIM(c.metadata->'idexx'->>'client_phone'), ''))
  c.user_id,
  COALESCE(u.clinic_id, (SELECT id FROM clinics LIMIT 1)),
  c.metadata->'idexx'->>'client_name',
  NULLIF(TRIM(c.metadata->'idexx'->>'client_phone'), ''),
  c.metadata->'idexx'->>'client_email',
  jsonb_build_object('idexx_neo', c.metadata->'idexx'->>'client_id'),
  'idexx_neo'::external_source,
  c.created_at
FROM cases c
JOIN users u ON c.user_id = u.id
WHERE c.metadata->'idexx'->>'client_phone' IS NOT NULL
  AND TRIM(c.metadata->'idexx'->>'client_phone') != ''
  AND c.user_id IS NOT NULL
  AND u.clinic_id IS NOT NULL
ON CONFLICT (user_id, phone) DO UPDATE SET
  external_ids = clients.external_ids || EXCLUDED.external_ids,
  external_source = COALESCE(clients.external_source, EXCLUDED.external_source);

-- ============================================================================
-- STEP 6: CREATE NEW PATIENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS patients_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Identity
  name text NOT NULL,
  species text,
  breed text,
  color text,
  sex animal_sex,
  date_of_birth date,

  -- Physical
  weight numeric(6,2),
  weight_unit weight_unit DEFAULT 'lb',

  -- Identification
  microchip_id text,

  -- External IDs
  external_ids jsonb DEFAULT '{}'::jsonb,
  external_source external_source,

  -- Medical
  allergies text[],
  medical_alerts text,
  notes text,

  -- Status
  is_active boolean DEFAULT true,
  is_deceased boolean DEFAULT false,
  deceased_at date,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Allow same name for different clients (different owners can have pets named "Max")
  CONSTRAINT patients_new_client_name_unique UNIQUE(client_id, name)
);

CREATE INDEX IF NOT EXISTS idx_patients_new_user_id ON patients_new(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_new_clinic_id ON patients_new(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_new_client_id ON patients_new(client_id);
CREATE INDEX IF NOT EXISTS idx_patients_new_name_trgm ON patients_new USING gin(name gin_trgm_ops);

-- Populate patients_new with deduplication
-- Group by (user_id, client_id, name) to deduplicate
INSERT INTO patients_new (
  user_id, clinic_id, client_id, name, species, breed, sex,
  weight, weight_unit, external_source, external_ids, created_at
)
SELECT DISTINCT ON (p.user_id, c.id, LOWER(p.name))
  p.user_id,
  u.clinic_id,
  c.id as client_id,
  p.name,
  p.species,
  p.breed,
  CASE
    WHEN LOWER(p.sex) IN ('male', 'm') THEN 'male'::animal_sex
    WHEN LOWER(p.sex) IN ('female', 'f') THEN 'female'::animal_sex
    WHEN LOWER(p.sex) IN ('male neutered', 'mn', 'neutered male', 'castrated') THEN 'male_neutered'::animal_sex
    WHEN LOWER(p.sex) IN ('female spayed', 'fs', 'spayed female', 'spayed') THEN 'female_spayed'::animal_sex
    ELSE 'unknown'::animal_sex
  END,
  p.weight_kg,
  'kg'::weight_unit,
  CASE
    WHEN p.source = 'idexx_extension' THEN 'idexx_neo'::external_source
    WHEN p.source = 'manual' THEN 'manual'::external_source
    ELSE 'manual'::external_source
  END,
  CASE
    WHEN p.external_id IS NOT NULL THEN jsonb_build_object('idexx_neo', p.external_id)
    ELSE '{}'::jsonb
  END,
  MIN(p.created_at) OVER (PARTITION BY p.user_id, c.id, LOWER(p.name))
FROM patients p
JOIN users u ON p.user_id = u.id
JOIN clients c ON c.user_id = p.user_id AND c.phone = NULLIF(TRIM(p.owner_phone), '')
WHERE p.name IS NOT NULL
  AND p.name != ''
  AND p.user_id IS NOT NULL
  AND u.clinic_id IS NOT NULL
ON CONFLICT (client_id, name) DO UPDATE SET
  species = COALESCE(EXCLUDED.species, patients_new.species),
  breed = COALESCE(EXCLUDED.breed, patients_new.breed),
  external_ids = patients_new.external_ids || EXCLUDED.external_ids;

-- ============================================================================
-- STEP 7: CREATE NEW CASES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cases_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients_new(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES providers(id) ON DELETE SET NULL,

  -- Classification (using text for now, will use enums after verification)
  visibility text DEFAULT 'private',
  case_type text DEFAULT 'checkup',
  status text DEFAULT 'draft',

  -- External IDs
  external_id text,
  external_appointment_id text,
  external_consultation_id text,
  external_source external_source,

  -- Normalized fields
  patient_name text,
  owner_name text,
  owner_phone text,
  provider_name text,
  visit_reason text,
  diagnosis_summary text,

  -- Scheduling
  scheduled_at timestamptz,
  appointment_date date,
  appointment_time time,

  -- Discharge workflow
  discharge_status discharge_status DEFAULT 'not_started',
  discharge_completed_at timestamptz,
  call_outcome text,

  -- Call intelligence
  call_approach call_approach,
  should_ask_clinical_questions boolean DEFAULT true,
  assessment_questions_count integer,

  -- AI data
  entity_extraction jsonb,
  pims_data jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Flags
  is_urgent boolean DEFAULT false,
  is_starred boolean DEFAULT false,

  -- Legacy reference
  legacy_case_id uuid,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cases_new_user_id ON cases_new(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_new_clinic_id ON cases_new(clinic_id);
CREATE INDEX IF NOT EXISTS idx_cases_new_patient_id ON cases_new(patient_id);
CREATE INDEX IF NOT EXISTS idx_cases_new_client_id ON cases_new(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_new_status ON cases_new(status);
CREATE INDEX IF NOT EXISTS idx_cases_new_external_id ON cases_new(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_new_created_at ON cases_new(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_new_legacy ON cases_new(legacy_case_id);

-- Migrate cases data
INSERT INTO cases_new (
  user_id, clinic_id, patient_id, client_id,
  visibility, case_type, status,
  external_id, external_appointment_id, external_consultation_id, external_source,
  patient_name, owner_name, owner_phone, provider_name, visit_reason,
  scheduled_at, entity_extraction, pims_data, metadata,
  is_urgent, is_starred, legacy_case_id, created_at, updated_at
)
SELECT
  old_c.user_id,
  u.clinic_id,
  pn.id as patient_id,
  cl.id as client_id,
  CASE old_c.visibility::text
    WHEN 'public' THEN 'public'
    WHEN 'private' THEN 'private'
    ELSE 'private'
  END,
  CASE old_c.type::text
    WHEN 'checkup' THEN 'checkup'
    WHEN 'emergency' THEN 'emergency'
    WHEN 'surgery' THEN 'surgery'
    WHEN 'follow_up' THEN 'follow_up'
    ELSE 'checkup'
  END,
  CASE old_c.status::text
    WHEN 'draft' THEN 'draft'
    WHEN 'ongoing' THEN 'ongoing'
    WHEN 'completed' THEN 'completed'
    WHEN 'reviewed' THEN 'reviewed'
    ELSE 'draft'
  END,
  old_c.external_id,
  old_c.metadata->'idexx'->>'appointment_id',
  old_c.metadata->'idexx'->>'consultation_id',
  CASE
    WHEN old_c.source = 'idexx_extension' THEN 'idexx_neo'::external_source
    WHEN old_c.source = 'manual' THEN 'manual'::external_source
    WHEN old_c.source = 'idexx_neo' THEN 'idexx_neo'::external_source
    ELSE 'manual'::external_source
  END,
  COALESCE(
    old_c.entity_extraction->'patient'->>'name',
    old_c.metadata->'idexx'->>'patient_name',
    old_p.name
  ),
  COALESCE(
    old_c.entity_extraction->'patient'->'owner'->>'name',
    old_c.metadata->'idexx'->>'client_name',
    old_p.owner_name
  ),
  COALESCE(
    old_c.entity_extraction->'patient'->'owner'->>'phone',
    old_c.metadata->'idexx'->>'client_phone',
    old_p.owner_phone
  ),
  old_c.metadata->'idexx'->>'provider_name',
  old_c.metadata->'idexx'->>'appointment_type',
  old_c.scheduled_at,
  old_c.entity_extraction,
  old_c.metadata->'idexx',
  old_c.metadata - 'idexx',
  COALESCE(old_c.is_urgent, false),
  COALESCE(old_c.is_starred, false),
  old_c.id,
  old_c.created_at,
  old_c.updated_at
FROM cases old_c
JOIN users u ON old_c.user_id = u.id
LEFT JOIN patients old_p ON old_p.case_id = old_c.id
LEFT JOIN clients cl ON cl.user_id = old_c.user_id
  AND cl.phone = COALESCE(
    NULLIF(TRIM(old_c.metadata->'idexx'->>'client_phone'), ''),
    NULLIF(TRIM(old_p.owner_phone), '')
  )
LEFT JOIN patients_new pn ON pn.client_id = cl.id
  AND LOWER(pn.name) = LOWER(COALESCE(
    old_c.metadata->'idexx'->>'patient_name',
    old_p.name
  ))
WHERE old_c.user_id IS NOT NULL
  AND u.clinic_id IS NOT NULL
  AND cl.id IS NOT NULL
  AND pn.id IS NOT NULL;

-- ============================================================================
-- STEP 8: CREATE UNIFIED CALLS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Direction & Type
  direction call_direction NOT NULL,
  call_type call_type_enum NOT NULL,

  -- Relationships
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  case_id uuid REFERENCES cases_new(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients_new(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,

  -- VAPI identifiers
  vapi_call_id text UNIQUE,
  assistant_id text,
  phone_number_id text,

  -- Contact
  customer_phone text NOT NULL,
  customer_name text,

  -- Status
  status call_status NOT NULL DEFAULT 'queued',

  -- Scheduling
  scheduled_for timestamptz,
  qstash_message_id text,

  -- Retry logic
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  next_retry_at timestamptz,

  -- Timing
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,

  -- Content
  transcript text,
  cleaned_transcript text,
  display_transcript text,
  transcript_messages jsonb,
  summary text,

  -- Recordings
  recording_url text,
  stereo_recording_url text,

  -- AI Analysis
  user_sentiment sentiment,
  success_evaluation text,
  call_analysis jsonb,

  -- Attention flags
  attention_severity attention_severity_enum,
  attention_summary text,
  attention_types text[],

  -- Outcomes
  outcome text,
  ended_reason text,

  -- Structured data
  structured_data jsonb,
  dynamic_variables jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Cost
  cost numeric(10, 4),

  -- Legacy reference
  legacy_call_id uuid,
  legacy_call_source text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calls_vapi_call_id ON calls(vapi_call_id) WHERE vapi_call_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_clinic_id ON calls(clinic_id);
CREATE INDEX IF NOT EXISTS idx_calls_case_id ON calls(case_id);
CREATE INDEX IF NOT EXISTS idx_calls_direction ON calls(direction);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_pending ON calls(scheduled_for) WHERE status IN ('queued', 'scheduled');

-- Migrate from scheduled_discharge_calls
INSERT INTO calls (
  direction, call_type, user_id, clinic_id, case_id,
  vapi_call_id, assistant_id, phone_number_id, customer_phone,
  status, scheduled_for, qstash_message_id,
  retry_count, max_retries,
  started_at, ended_at, duration_seconds,
  transcript, cleaned_transcript, transcript_messages, summary,
  recording_url, stereo_recording_url,
  user_sentiment, success_evaluation, call_analysis,
  attention_severity, attention_summary, attention_types,
  ended_reason, structured_data, dynamic_variables, metadata, cost,
  legacy_call_id, legacy_call_source, created_at, updated_at
)
SELECT
  'outbound'::call_direction,
  'discharge'::call_type_enum,
  sdc.user_id,
  COALESCE(u.clinic_id, (SELECT id FROM clinics LIMIT 1)),
  cn.id,
  sdc.vapi_call_id,
  sdc.assistant_id,
  sdc.phone_number_id,
  COALESCE(sdc.customer_phone, 'unknown'),
  CASE
    WHEN sdc.status = 'canceled' THEN 'cancelled'::call_status
    WHEN sdc.status = 'queued' THEN 'queued'::call_status
    WHEN sdc.status = 'scheduled' THEN 'scheduled'::call_status
    WHEN sdc.status = 'ringing' THEN 'ringing'::call_status
    WHEN sdc.status = 'in_progress' THEN 'in_progress'::call_status
    WHEN sdc.status = 'completed' THEN 'completed'::call_status
    WHEN sdc.status = 'failed' THEN 'failed'::call_status
    WHEN sdc.status = 'voicemail' THEN 'voicemail'::call_status
    WHEN sdc.status = 'no_answer' THEN 'no_answer'::call_status
    WHEN sdc.status = 'busy' THEN 'busy'::call_status
    ELSE 'queued'::call_status
  END,
  sdc.scheduled_for,
  sdc.qstash_message_id,
  COALESCE((sdc.metadata->>'retry_count')::integer, 0),
  COALESCE((sdc.metadata->>'max_retries')::integer, 3),
  sdc.started_at,
  sdc.ended_at,
  sdc.duration_seconds,
  sdc.transcript,
  sdc.cleaned_transcript,
  sdc.transcript_messages,
  sdc.summary,
  sdc.recording_url,
  sdc.stereo_recording_url,
  CASE
    WHEN sdc.user_sentiment = 'positive' THEN 'positive'::sentiment
    WHEN sdc.user_sentiment = 'neutral' THEN 'neutral'::sentiment
    WHEN sdc.user_sentiment = 'negative' THEN 'negative'::sentiment
    ELSE NULL
  END,
  sdc.success_evaluation,
  sdc.call_analysis,
  CASE
    WHEN sdc.attention_severity = 'low' THEN 'low'::attention_severity_enum
    WHEN sdc.attention_severity = 'medium' THEN 'medium'::attention_severity_enum
    WHEN sdc.attention_severity = 'high' THEN 'high'::attention_severity_enum
    WHEN sdc.attention_severity = 'critical' THEN 'critical'::attention_severity_enum
    ELSE NULL
  END,
  sdc.attention_summary,
  sdc.attention_types,
  sdc.ended_reason,
  sdc.structured_data,
  sdc.dynamic_variables,
  sdc.metadata - 'retry_count' - 'max_retries',
  sdc.cost,
  sdc.id,
  'scheduled_discharge_calls',
  sdc.created_at,
  sdc.updated_at
FROM scheduled_discharge_calls sdc
JOIN users u ON sdc.user_id = u.id
LEFT JOIN cases_new cn ON cn.legacy_case_id = sdc.case_id;

-- Migrate from inbound_vapi_calls
INSERT INTO calls (
  direction, call_type, user_id, clinic_id,
  vapi_call_id, assistant_id, phone_number_id, customer_phone, customer_name,
  status, started_at, ended_at, duration_seconds,
  transcript, cleaned_transcript, display_transcript, transcript_messages, summary,
  recording_url, stereo_recording_url,
  user_sentiment, success_evaluation, call_analysis,
  attention_severity, attention_summary, attention_types,
  outcome, ended_reason, structured_data, metadata, cost,
  legacy_call_id, legacy_call_source, created_at, updated_at
)
SELECT
  'inbound'::call_direction,
  'general'::call_type_enum,
  ivc.user_id,
  COALESCE(u.clinic_id, (SELECT id FROM clinics LIMIT 1)),
  ivc.vapi_call_id,
  ivc.assistant_id,
  ivc.phone_number_id,
  COALESCE(ivc.customer_phone, 'unknown'),
  ivc.customer_number,
  CASE
    WHEN ivc.status = 'queued' THEN 'queued'::call_status
    WHEN ivc.status = 'ringing' THEN 'ringing'::call_status
    WHEN ivc.status = 'in_progress' THEN 'in_progress'::call_status
    WHEN ivc.status = 'completed' THEN 'completed'::call_status
    WHEN ivc.status = 'failed' THEN 'failed'::call_status
    WHEN ivc.status = 'ended' THEN 'completed'::call_status
    ELSE 'completed'::call_status
  END,
  ivc.started_at,
  ivc.ended_at,
  ivc.duration_seconds,
  ivc.transcript,
  ivc.cleaned_transcript,
  ivc.display_transcript,
  ivc.transcript_messages,
  ivc.summary,
  ivc.recording_url,
  ivc.stereo_recording_url,
  CASE
    WHEN ivc.user_sentiment = 'positive' THEN 'positive'::sentiment
    WHEN ivc.user_sentiment = 'neutral' THEN 'neutral'::sentiment
    WHEN ivc.user_sentiment = 'negative' THEN 'negative'::sentiment
    ELSE NULL
  END,
  ivc.success_evaluation,
  ivc.call_analysis,
  CASE
    WHEN ivc.attention_severity = 'low' THEN 'low'::attention_severity_enum
    WHEN ivc.attention_severity = 'medium' THEN 'medium'::attention_severity_enum
    WHEN ivc.attention_severity = 'high' THEN 'high'::attention_severity_enum
    WHEN ivc.attention_severity = 'critical' THEN 'critical'::attention_severity_enum
    ELSE NULL
  END,
  ivc.attention_summary,
  ivc.attention_types,
  ivc.outcome,
  ivc.ended_reason,
  ivc.structured_data,
  ivc.metadata,
  ivc.cost,
  ivc.id,
  'inbound_vapi_calls',
  ivc.created_at,
  ivc.updated_at
FROM inbound_vapi_calls ivc
JOIN users u ON ivc.user_id = u.id;

-- ============================================================================
-- STEP 9: CREATE CLINICAL NOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases_new(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  note_type clinical_note_type NOT NULL,
  content text NOT NULL,

  speaker_segments jsonb,
  audio_file_url text,
  audio_duration_seconds integer,

  source external_source,
  processing_status processing_status_enum,

  legacy_id uuid,
  legacy_source text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_case_id ON clinical_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_type ON clinical_notes(note_type);

-- Migrate transcriptions
INSERT INTO clinical_notes (case_id, user_id, note_type, content, speaker_segments, source, processing_status, legacy_id, legacy_source, created_at, updated_at)
SELECT
  cn.id,
  t.user_id,
  'transcription'::clinical_note_type,
  t.transcript,
  t.speaker_segments,
  'ios_scribe'::external_source,
  CASE
    WHEN t.processing_status = 'recording' THEN 'recording'::processing_status_enum
    WHEN t.processing_status = 'uploading' THEN 'uploading'::processing_status_enum
    WHEN t.processing_status = 'processing' THEN 'processing'::processing_status_enum
    WHEN t.processing_status = 'completed' THEN 'completed'::processing_status_enum
    WHEN t.processing_status = 'failed' THEN 'failed'::processing_status_enum
    ELSE 'completed'::processing_status_enum
  END,
  t.id,
  'transcriptions',
  t.created_at,
  t.updated_at
FROM transcriptions t
JOIN cases_new cn ON cn.legacy_case_id = t.case_id
WHERE t.transcript IS NOT NULL AND t.transcript != '';

-- Migrate IDEXX consultation notes from cases.metadata
INSERT INTO clinical_notes (case_id, user_id, note_type, content, source, legacy_source, created_at, updated_at)
SELECT
  cn.id,
  old_c.user_id,
  'consultation_notes'::clinical_note_type,
  old_c.metadata->'idexx'->>'consultation_notes',
  'idexx_neo'::external_source,
  'cases.metadata.idexx',
  old_c.created_at,
  old_c.updated_at
FROM cases old_c
JOIN cases_new cn ON cn.legacy_case_id = old_c.id
WHERE old_c.metadata->'idexx'->>'consultation_notes' IS NOT NULL
  AND old_c.metadata->'idexx'->>'consultation_notes' != '';

-- ============================================================================
-- STEP 10: CREATE NEW SOAP NOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS soap_notes_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases_new(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  template_id uuid,

  subjective text,
  objective text,
  assessment text,
  plan text,

  history text,
  physical_exam text,
  diagnostics text,

  vital_signs jsonb,
  medications jsonb,
  diagnoses jsonb,

  ai_model text,
  ai_confidence numeric(3,2),

  is_finalized boolean DEFAULT false,
  finalized_at timestamptz,

  legacy_id uuid,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_soap_notes_new_case_id ON soap_notes_new(case_id);

-- Migrate soap_notes
INSERT INTO soap_notes_new (case_id, user_id, subjective, objective, assessment, plan, legacy_id, created_at, updated_at)
SELECT
  cn.id,
  old_c.user_id,
  sn.subjective,
  sn.objective,
  sn.assessment,
  sn.plan,
  sn.id,
  sn.created_at,
  sn.updated_at
FROM soap_notes sn
JOIN cases old_c ON sn.case_id = old_c.id
JOIN cases_new cn ON cn.legacy_case_id = old_c.id;

-- ============================================================================
-- STEP 11: CREATE NEW DISCHARGE SUMMARIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS discharge_summaries_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases_new(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  template_id uuid,

  summary text NOT NULL,

  diagnosis text,
  treatment text,
  medications jsonb,
  home_care_instructions text,
  follow_up_instructions text,
  warning_signs text,
  diet_instructions text,
  activity_restrictions text,

  ai_model text,
  ai_confidence numeric(3,2),

  is_finalized boolean DEFAULT false,
  finalized_at timestamptz,

  legacy_id uuid,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discharge_summaries_new_case_id ON discharge_summaries_new(case_id);

-- Migrate discharge_summaries
INSERT INTO discharge_summaries_new (case_id, user_id, template_id, summary, legacy_id, created_at, updated_at)
SELECT
  cn.id,
  ds.user_id,
  ds.template_id,
  ds.content,
  ds.id,
  ds.created_at,
  ds.updated_at
FROM discharge_summaries ds
JOIN cases_new cn ON cn.legacy_case_id = ds.case_id;

-- ============================================================================
-- STEP 12: CREATE EMAILS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  case_id uuid REFERENCES cases_new(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,

  email_type text NOT NULL CHECK (email_type IN ('discharge', 'follow_up', 'reminder', 'general')),
  recipient_email text NOT NULL,
  recipient_name text,

  subject text NOT NULL,
  body_html text,
  body_text text,

  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sent', 'delivered', 'bounced', 'failed')),

  scheduled_for timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,

  resend_id text,
  error_message text,

  legacy_id uuid,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_clinic_id ON emails(clinic_id);
CREATE INDEX IF NOT EXISTS idx_emails_case_id ON emails(case_id);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);

-- Migrate scheduled_discharge_emails if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_discharge_emails') THEN
    INSERT INTO emails (user_id, clinic_id, case_id, email_type, recipient_email, recipient_name, subject, body_html, status, scheduled_for, sent_at, legacy_id, created_at, updated_at)
    SELECT
      sde.user_id,
      COALESCE(u.clinic_id, (SELECT id FROM clinics LIMIT 1)),
      cn.id,
      'discharge',
      sde.recipient_email,
      sde.recipient_name,
      COALESCE(sde.subject, 'Discharge Summary'),
      sde.body,
      CASE
        WHEN sde.status = 'sent' THEN 'sent'
        WHEN sde.status = 'pending' THEN 'pending'
        WHEN sde.status = 'scheduled' THEN 'scheduled'
        WHEN sde.status = 'failed' THEN 'failed'
        ELSE 'pending'
      END,
      sde.scheduled_for,
      sde.sent_at,
      sde.id,
      sde.created_at,
      sde.updated_at
    FROM scheduled_discharge_emails sde
    JOIN users u ON sde.user_id = u.id
    LEFT JOIN cases_new cn ON cn.legacy_case_id = sde.case_id;
  END IF;
END$$;

-- ============================================================================
-- STEP 13: CREATE TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS templates_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,

  template_type template_type NOT NULL,
  name text NOT NULL,
  display_name text,
  description text,
  icon_name text DEFAULT 'file-text',

  content text,
  structured_content jsonb,
  system_prompt text,
  section_prompts jsonb,

  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  visibility text DEFAULT 'private',

  legacy_id uuid,
  legacy_source text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT templates_new_user_type_name_unique UNIQUE(user_id, template_type, name)
);

CREATE INDEX IF NOT EXISTS idx_templates_new_user_id ON templates_new(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_new_type ON templates_new(template_type);

-- Migrate temp_soap_templates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'temp_soap_templates') THEN
    INSERT INTO templates_new (user_id, clinic_id, template_type, name, display_name, description, icon_name, content, system_prompt, section_prompts, is_default, is_active, legacy_id, legacy_source, created_at, updated_at)
    SELECT
      tst.user_id,
      u.clinic_id,
      'soap'::template_type,
      COALESCE(tst.name, 'SOAP Template ' || tst.id),
      tst.display_name,
      tst.description,
      tst.icon_name,
      NULL,
      tst.system_prompt,
      jsonb_build_object(
        'subjective', tst.subjective_prompt,
        'objective', tst.objective_prompt,
        'assessment', tst.assessment_prompt,
        'plan', tst.plan_prompt
      ),
      COALESCE(tst.is_default, false),
      COALESCE(tst.is_active, true),
      tst.id,
      'temp_soap_templates',
      tst.created_at,
      tst.updated_at
    FROM temp_soap_templates tst
    JOIN users u ON tst.user_id = u.id
    ON CONFLICT (user_id, template_type, name) DO NOTHING;
  END IF;
END$$;

-- Migrate temp_discharge_summary_templates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'temp_discharge_summary_templates') THEN
    INSERT INTO templates_new (user_id, clinic_id, template_type, name, content, is_default, legacy_id, legacy_source, created_at, updated_at)
    SELECT
      tdst.user_id,
      u.clinic_id,
      'discharge_summary'::template_type,
      COALESCE(tdst.name, 'Discharge Template ' || tdst.id),
      tdst.content,
      false,
      tdst.id,
      'temp_discharge_summary_templates',
      tdst.created_at,
      tdst.updated_at
    FROM temp_discharge_summary_templates tdst
    JOIN users u ON tdst.user_id = u.id
    ON CONFLICT (user_id, template_type, name) DO NOTHING;
  END IF;
END$$;

-- ============================================================================
-- STEP 14: CREATE PIMS CREDENTIALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pims_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  pims_type external_source NOT NULL,
  credentials_encrypted bytea NOT NULL,

  is_active boolean DEFAULT true,
  last_verified_at timestamptz,
  last_sync_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pims_credentials_user_type_unique UNIQUE(user_id, pims_type)
);

-- Migrate from idexx_credentials if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'idexx_credentials') THEN
    INSERT INTO pims_credentials (user_id, clinic_id, pims_type, credentials_encrypted, is_active, last_verified_at, created_at, updated_at)
    SELECT
      ic.user_id,
      u.clinic_id,
      'idexx_neo'::external_source,
      ic.encrypted_credentials,
      true,
      ic.last_verified_at,
      ic.created_at,
      ic.updated_at
    FROM idexx_credentials ic
    JOIN users u ON ic.user_id = u.id
    WHERE u.clinic_id IS NOT NULL
    ON CONFLICT (user_id, pims_type) DO NOTHING;
  END IF;
END$$;

-- ============================================================================
-- STEP 15: CREATE SYNC SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  pims_type external_source NOT NULL,
  sync_type text NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),

  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),

  records_processed integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,

  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,

  error_message text,
  error_details jsonb,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_sessions_user_id ON sync_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_sessions_status ON sync_sessions(status);

-- ============================================================================
-- STEP 16: CREATE MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  call_id uuid REFERENCES calls(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,

  message_type text NOT NULL CHECK (message_type IN ('voicemail', 'callback_request', 'general_inquiry', 'appointment_request')),

  from_phone text,
  from_name text,
  content text NOT NULL,

  status text NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'in_progress', 'resolved', 'archived')),

  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_clinic_id ON messages(clinic_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- ============================================================================
-- STEP 17: CREATE APPOINTMENTS TABLE (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointments_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients_new(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES providers(id) ON DELETE SET NULL,

  external_id text,
  external_source external_source,

  date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  duration_minutes integer,

  appointment_type text,
  reason text,
  notes text,

  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_new_clinic_id ON appointments_new(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_new_date ON appointments_new(date);

-- ============================================================================
-- STEP 18: CREATE USER EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_events_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,

  event_name text NOT NULL,
  event_category text,

  properties jsonb DEFAULT '{}'::jsonb,
  session_id text,
  user_agent text,
  ip_address inet,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_events_new_user_id ON user_events_new(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_new_event_name ON user_events_new(event_name);
CREATE INDEX IF NOT EXISTS idx_user_events_new_created_at ON user_events_new(created_at DESC);

-- ============================================================================
-- STEP 19: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE soap_notes_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_summaries_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE pims_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events_new ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own clients" ON clients FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access clients" ON clients FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own patients" ON patients_new FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access patients" ON patients_new FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own cases" ON cases_new FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access cases" ON cases_new FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own calls" ON calls FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view clinic calls" ON calls FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Service role full access calls" ON calls FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own clinical_notes" ON clinical_notes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access clinical_notes" ON clinical_notes FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own soap_notes" ON soap_notes_new FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access soap_notes" ON soap_notes_new FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own discharge_summaries" ON discharge_summaries_new FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access discharge_summaries" ON discharge_summaries_new FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own emails" ON emails FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access emails" ON emails FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own templates" ON templates_new FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access templates" ON templates_new FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own pims_credentials" ON pims_credentials FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access pims_credentials" ON pims_credentials FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own sync_sessions" ON sync_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role full access sync_sessions" ON sync_sessions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view clinic messages" ON messages FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Service role full access messages" ON messages FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view clinic appointments" ON appointments_new FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Service role full access appointments" ON appointments_new FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own events" ON user_events_new FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role full access user_events" ON user_events_new FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 20: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_patients_new_updated_at BEFORE UPDATE ON patients_new FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cases_new_updated_at BEFORE UPDATE ON cases_new FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE ON clinical_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_soap_notes_new_updated_at BEFORE UPDATE ON soap_notes_new FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_discharge_summaries_new_updated_at BEFORE UPDATE ON discharge_summaries_new FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_templates_new_updated_at BEFORE UPDATE ON templates_new FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_pims_credentials_updated_at BEFORE UPDATE ON pims_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_appointments_new_updated_at BEFORE UPDATE ON appointments_new FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Upsert client function
CREATE OR REPLACE FUNCTION upsert_client(
  p_user_id uuid,
  p_clinic_id uuid,
  p_phone text,
  p_full_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_external_source external_source DEFAULT NULL,
  p_external_id text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_client_id uuid;
BEGIN
  INSERT INTO clients (user_id, clinic_id, phone, full_name, email, external_source)
  VALUES (p_user_id, p_clinic_id, p_phone, p_full_name, p_email, p_external_source)
  ON CONFLICT (user_id, phone) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, clients.full_name),
    email = COALESCE(EXCLUDED.email, clients.email),
    external_ids = CASE
      WHEN p_external_source IS NOT NULL AND p_external_id IS NOT NULL
      THEN clients.external_ids || jsonb_build_object(p_external_source::text, p_external_id)
      ELSE clients.external_ids
    END,
    updated_at = now()
  RETURNING id INTO v_client_id;
  RETURN v_client_id;
END;
$$ LANGUAGE plpgsql;

-- Upsert patient function
CREATE OR REPLACE FUNCTION upsert_patient(
  p_user_id uuid,
  p_clinic_id uuid,
  p_client_id uuid,
  p_name text,
  p_species text DEFAULT NULL,
  p_breed text DEFAULT NULL,
  p_external_source external_source DEFAULT NULL,
  p_external_id text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_patient_id uuid;
BEGIN
  IF p_external_source IS NOT NULL AND p_external_id IS NOT NULL THEN
    SELECT id INTO v_patient_id FROM patients_new
    WHERE user_id = p_user_id AND external_ids->>p_external_source::text = p_external_id;
    IF v_patient_id IS NOT NULL THEN
      UPDATE patients_new SET
        name = COALESCE(p_name, name),
        species = COALESCE(p_species, species),
        breed = COALESCE(p_breed, breed),
        client_id = COALESCE(p_client_id, client_id),
        updated_at = now()
      WHERE id = v_patient_id;
      RETURN v_patient_id;
    END IF;
  END IF;

  SELECT id INTO v_patient_id FROM patients_new
  WHERE client_id = p_client_id AND LOWER(name) = LOWER(p_name);

  IF v_patient_id IS NOT NULL THEN
    UPDATE patients_new SET
      species = COALESCE(p_species, species),
      breed = COALESCE(p_breed, breed),
      external_ids = CASE
        WHEN p_external_source IS NOT NULL AND p_external_id IS NOT NULL
        THEN external_ids || jsonb_build_object(p_external_source::text, p_external_id)
        ELSE external_ids
      END,
      updated_at = now()
    WHERE id = v_patient_id;
    RETURN v_patient_id;
  END IF;

  INSERT INTO patients_new (user_id, clinic_id, client_id, name, species, breed, external_source, external_ids)
  VALUES (
    p_user_id, p_clinic_id, p_client_id, p_name, p_species, p_breed,
    p_external_source,
    CASE WHEN p_external_source IS NOT NULL AND p_external_id IS NOT NULL
         THEN jsonb_build_object(p_external_source::text, p_external_id)
         ELSE '{}'::jsonb END
  )
  RETURNING id INTO v_patient_id;
  RETURN v_patient_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 21: CREATE BACKWARDS-COMPATIBLE VIEWS
-- ============================================================================

-- View for old scheduled_discharge_calls queries
CREATE OR REPLACE VIEW scheduled_discharge_calls_v AS
SELECT
  c.id,
  c.user_id,
  c.case_id,
  c.vapi_call_id,
  c.assistant_id,
  c.phone_number_id,
  c.customer_phone,
  c.scheduled_for,
  CASE WHEN c.status = 'cancelled'::call_status THEN 'canceled' ELSE c.status::text END as status,
  c.ended_reason,
  c.started_at,
  c.ended_at,
  c.duration_seconds,
  c.recording_url,
  c.transcript,
  c.transcript_messages,
  c.call_analysis,
  c.summary,
  c.user_sentiment::text,
  c.success_evaluation,
  c.cost,
  c.dynamic_variables,
  c.qstash_message_id,
  jsonb_build_object('retry_count', c.retry_count, 'max_retries', c.max_retries) || COALESCE(c.metadata, '{}'::jsonb) as metadata,
  c.created_at,
  c.updated_at
FROM calls c
WHERE c.direction = 'outbound' AND c.call_type = 'discharge';

-- View for old inbound_vapi_calls queries
CREATE OR REPLACE VIEW inbound_vapi_calls_v AS
SELECT
  c.id,
  c.vapi_call_id,
  c.assistant_id,
  c.phone_number_id,
  c.user_id,
  c.clinic_id,
  cl.name as clinic_name,
  c.customer_phone,
  c.customer_name as customer_number,
  c.status::text,
  'inbound' as type,
  c.started_at,
  c.ended_at,
  c.duration_seconds,
  c.recording_url,
  c.stereo_recording_url,
  c.transcript,
  c.cleaned_transcript,
  c.display_transcript,
  c.transcript_messages,
  c.call_analysis,
  c.summary,
  c.success_evaluation,
  c.structured_data,
  c.user_sentiment::text,
  c.attention_severity::text,
  c.attention_summary,
  c.attention_types,
  c.outcome,
  c.cost,
  c.ended_reason,
  c.metadata,
  c.created_at,
  c.updated_at
FROM calls c
LEFT JOIN clinics cl ON c.clinic_id = cl.id
WHERE c.direction = 'inbound';

-- View for old transcriptions queries
CREATE OR REPLACE VIEW transcriptions_v AS
SELECT
  cn.id,
  cn.case_id,
  cn.user_id,
  NULL::uuid as audio_file_id,
  cn.content as transcript,
  cn.speaker_segments,
  cn.processing_status::text,
  cn.created_at,
  cn.updated_at
FROM clinical_notes cn
WHERE cn.note_type = 'transcription';

-- ============================================================================
-- STEP 22: RENAME TABLES
-- ============================================================================

-- Rename old tables to _legacy
ALTER TABLE IF EXISTS patients RENAME TO patients_legacy;
ALTER TABLE IF EXISTS cases RENAME TO cases_legacy;
ALTER TABLE IF EXISTS soap_notes RENAME TO soap_notes_legacy;
ALTER TABLE IF EXISTS discharge_summaries RENAME TO discharge_summaries_legacy;
ALTER TABLE IF EXISTS transcriptions RENAME TO transcriptions_legacy;
ALTER TABLE IF EXISTS scheduled_discharge_calls RENAME TO scheduled_discharge_calls_legacy;
ALTER TABLE IF EXISTS inbound_vapi_calls RENAME TO inbound_vapi_calls_legacy;
ALTER TABLE IF EXISTS appointments RENAME TO appointments_legacy;
ALTER TABLE IF EXISTS user_events RENAME TO user_events_legacy;

-- Rename new tables to final names
ALTER TABLE IF EXISTS patients_new RENAME TO patients;
ALTER TABLE IF EXISTS cases_new RENAME TO cases;
ALTER TABLE IF EXISTS soap_notes_new RENAME TO soap_notes;
ALTER TABLE IF EXISTS discharge_summaries_new RENAME TO discharge_summaries;
ALTER TABLE IF EXISTS templates_new RENAME TO templates;
ALTER TABLE IF EXISTS appointments_new RENAME TO appointments;
ALTER TABLE IF EXISTS user_events_new RENAME TO user_events;

-- ============================================================================
-- STEP 23: VERIFICATION QUERIES
-- ============================================================================

-- Output migration stats
DO $$
DECLARE
  v_clients_count integer;
  v_patients_count integer;
  v_cases_count integer;
  v_calls_count integer;
  v_clinical_notes_count integer;
  v_soap_notes_count integer;
  v_discharge_summaries_count integer;
  v_emails_count integer;
  v_templates_count integer;
BEGIN
  SELECT COUNT(*) INTO v_clients_count FROM clients;
  SELECT COUNT(*) INTO v_patients_count FROM patients;
  SELECT COUNT(*) INTO v_cases_count FROM cases;
  SELECT COUNT(*) INTO v_calls_count FROM calls;
  SELECT COUNT(*) INTO v_clinical_notes_count FROM clinical_notes;
  SELECT COUNT(*) INTO v_soap_notes_count FROM soap_notes;
  SELECT COUNT(*) INTO v_discharge_summaries_count FROM discharge_summaries;
  SELECT COUNT(*) INTO v_emails_count FROM emails;
  SELECT COUNT(*) INTO v_templates_count FROM templates;

  RAISE NOTICE '=== MIGRATION COMPLETE ===';
  RAISE NOTICE 'Clients: %', v_clients_count;
  RAISE NOTICE 'Patients: %', v_patients_count;
  RAISE NOTICE 'Cases: %', v_cases_count;
  RAISE NOTICE 'Calls: %', v_calls_count;
  RAISE NOTICE 'Clinical Notes: %', v_clinical_notes_count;
  RAISE NOTICE 'SOAP Notes: %', v_soap_notes_count;
  RAISE NOTICE 'Discharge Summaries: %', v_discharge_summaries_count;
  RAISE NOTICE 'Emails: %', v_emails_count;
  RAISE NOTICE 'Templates: %', v_templates_count;
END$$;

-- Commit transaction
COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
--
-- After running this migration:
--
-- 1. Verify data integrity:
--    SELECT COUNT(*) FROM cases WHERE patient_id IS NULL;
--    SELECT COUNT(*) FROM cases WHERE client_id IS NULL;
--    SELECT COUNT(*) FROM patients WHERE client_id IS NULL;
--
-- 2. Update application code to use new tables:
--    - patients_legacy → patients
--    - cases_legacy → cases
--    - Use unified `calls` table instead of scheduled_discharge_calls/inbound_vapi_calls
--
-- 3. Test backwards-compatible views:
--    SELECT * FROM scheduled_discharge_calls_v LIMIT 5;
--    SELECT * FROM inbound_vapi_calls_v LIMIT 5;
--    SELECT * FROM transcriptions_v LIMIT 5;
--
-- 4. After 30 days, drop legacy tables:
--    DROP TABLE IF EXISTS patients_legacy CASCADE;
--    DROP TABLE IF EXISTS cases_legacy CASCADE;
--    DROP TABLE IF EXISTS soap_notes_legacy CASCADE;
--    DROP TABLE IF EXISTS discharge_summaries_legacy CASCADE;
--    DROP TABLE IF EXISTS transcriptions_legacy CASCADE;
--    DROP TABLE IF EXISTS scheduled_discharge_calls_legacy CASCADE;
--    DROP TABLE IF EXISTS inbound_vapi_calls_legacy CASCADE;
--
-- 5. Regenerate TypeScript types:
--    pnpm update-types
--
-- ============================================================================

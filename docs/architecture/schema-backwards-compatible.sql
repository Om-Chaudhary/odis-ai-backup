-- ============================================================================
-- ODIS AI Database Schema - Backwards Compatible Migration
-- ============================================================================
-- This schema is designed to be applied incrementally without breaking
-- existing application code. Old code continues working via backwards-
-- compatible views and preserved columns.
--
-- Migration Order:
--   Phase 1: Foundation (clinic_id FKs, indexes)
--   Phase 2: Clients table
--   Phase 3: Unified calls table + views
--   Phase 4: Patients restructure
--   Phase 5: Cases enhancements
--   Phase 6: Clinical notes unification
--
-- Each phase is safe to apply independently and roll back if needed.
-- ============================================================================

-- ============================================================================
-- PHASE 1: FOUNDATION - Clinic ID Foreign Keys
-- ============================================================================
-- Adds proper UUID foreign keys to tables that currently use text clinic_name.
-- Preserves existing clinic_name columns for backwards compatibility.

-- 1.1 Add clinic_id to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);

-- Backfill clinic_id from clinic_name
UPDATE users u
SET clinic_id = c.id
FROM clinics c
WHERE LOWER(TRIM(u.clinic_name)) = LOWER(TRIM(c.name))
  AND u.clinic_id IS NULL;

-- Create missing clinics for orphaned users
INSERT INTO clinics (name, is_active)
SELECT DISTINCT u.clinic_name, true
FROM users u
WHERE u.clinic_name IS NOT NULL
  AND u.clinic_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM clinics c
    WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(u.clinic_name))
  );

-- Backfill again after clinic creation
UPDATE users u
SET clinic_id = c.id
FROM clinics c
WHERE LOWER(TRIM(u.clinic_name)) = LOWER(TRIM(c.name))
  AND u.clinic_id IS NULL;

-- 1.2 Add clinic_id to inbound_vapi_calls
ALTER TABLE inbound_vapi_calls
ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inbound_calls_clinic_id ON inbound_vapi_calls(clinic_id);

-- Backfill from user relationship first
UPDATE inbound_vapi_calls i
SET clinic_id = u.clinic_id
FROM users u
WHERE i.user_id = u.id
  AND i.clinic_id IS NULL
  AND u.clinic_id IS NOT NULL;

-- Backfill from clinic_name match
UPDATE inbound_vapi_calls i
SET clinic_id = c.id
FROM clinics c
WHERE LOWER(TRIM(i.clinic_name)) = LOWER(TRIM(c.name))
  AND i.clinic_id IS NULL;

-- 1.3 Add clinic_id to clinic_assistants
ALTER TABLE clinic_assistants
ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_clinic_assistants_clinic_id ON clinic_assistants(clinic_id);

-- Backfill
UPDATE clinic_assistants ca
SET clinic_id = c.id
FROM clinics c
WHERE LOWER(TRIM(ca.clinic_name)) = LOWER(TRIM(c.name))
  AND ca.clinic_id IS NULL;

-- 1.4 Additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_user_status_created ON cases(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_scheduled_at ON cases(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_external_id ON cases(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_urgent ON cases(user_id) WHERE is_urgent = true;
CREATE INDEX IF NOT EXISTS idx_cases_starred ON cases(user_id) WHERE is_starred = true;

CREATE INDEX IF NOT EXISTS idx_discharge_summaries_case ON discharge_summaries(case_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_case ON soap_notes(case_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_calls_pending
  ON scheduled_discharge_calls(scheduled_for)
  WHERE status IN ('queued', 'scheduled');
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_qstash
  ON scheduled_discharge_calls(qstash_message_id)
  WHERE qstash_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_date_time
  ON appointments(clinic_id, date, start_time);

-- ============================================================================
-- PHASE 2: CLIENTS TABLE - Pet Owner Normalization
-- ============================================================================
-- Creates a proper clients table for pet owners, enabling:
-- - Single source of truth for contact info
-- - Communication preferences
-- - Multi-pet household tracking
-- - Deduplication by phone number

-- 2.1 External source enum for PIMS abstraction
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'external_source') THEN
    CREATE TYPE external_source AS ENUM (
      'manual',
      'ios_scribe',
      'idexx_neo',
      'idexx_cornerstone',
      'idexx_rhapsody',
      'avimark',
      'evetpractice',
      'shepherd',
      'digitail',
      'api',
      'import'
    );
  END IF;
END$$;

-- 2.2 Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,

  -- Identity
  first_name text,
  last_name text,
  full_name text GENERATED ALWAYS AS (
    CASE
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL
        THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL THEN first_name
      WHEN last_name IS NOT NULL THEN last_name
      ELSE 'Unknown'
    END
  ) STORED,

  -- Contact info
  phone text,
  phone_secondary text,
  phone_type text CHECK (phone_type IS NULL OR phone_type IN ('mobile', 'home', 'work')),
  email text,

  -- Address
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'US',

  -- External IDs (PIMS-agnostic)
  external_ids jsonb DEFAULT '{}'::jsonb,  -- {"idexx_neo": "11525", "avimark": "C-1234"}
  external_source external_source,

  -- Preferences
  preferred_contact_method text CHECK (preferred_contact_method IS NULL OR preferred_contact_method IN ('phone', 'email', 'sms')),
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

  -- Deduplication constraint
  CONSTRAINT clients_user_phone_unique UNIQUE(user_id, phone)
);

-- 2.3 Indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_clinic_id ON clients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE email IS NOT NULL;

-- Enable trigram for fuzzy name search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_clients_full_name_trgm ON clients USING gin(full_name gin_trgm_ops);

-- 2.4 RLS for clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own clients" ON clients;
CREATE POLICY "Users can manage own clients"
  ON clients FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access clients" ON clients;
CREATE POLICY "Service role full access clients"
  ON clients FOR ALL
  USING (auth.role() = 'service_role');

-- 2.5 Populate clients from existing patient owner data
INSERT INTO clients (user_id, clinic_id, full_name, phone, email, created_at)
SELECT DISTINCT ON (p.user_id, NULLIF(TRIM(p.owner_phone), ''))
  p.user_id,
  u.clinic_id,
  p.owner_name,
  NULLIF(TRIM(p.owner_phone), ''),
  p.owner_email,
  MIN(p.created_at) OVER (PARTITION BY p.user_id, NULLIF(TRIM(p.owner_phone), ''))
FROM patients p
JOIN users u ON p.user_id = u.id
WHERE p.owner_phone IS NOT NULL
  AND TRIM(p.owner_phone) != ''
ON CONFLICT (user_id, phone) DO NOTHING;

-- 2.6 Add client_id FK to patients (for gradual migration)
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_patients_client_id ON patients(client_id);

-- Link existing patients to clients
UPDATE patients p
SET client_id = c.id
FROM clients c
WHERE p.user_id = c.user_id
  AND NULLIF(TRIM(p.owner_phone), '') = c.phone
  AND p.client_id IS NULL;

-- Mark old columns as deprecated (comment only, columns preserved)
COMMENT ON COLUMN patients.owner_name IS 'DEPRECATED: Use clients.full_name via client_id. Kept for backwards compatibility.';
COMMENT ON COLUMN patients.owner_phone IS 'DEPRECATED: Use clients.phone via client_id. Kept for backwards compatibility.';
COMMENT ON COLUMN patients.owner_email IS 'DEPRECATED: Use clients.email via client_id. Kept for backwards compatibility.';

-- ============================================================================
-- PHASE 3: UNIFIED CALLS TABLE
-- ============================================================================
-- Consolidates scheduled_discharge_calls, inbound_vapi_calls, and retell_calls
-- into a single unified table with direction/type discriminators.
-- Backwards-compatible views preserve old table interfaces.

-- 3.1 Create unified calls table
CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Direction & Type discriminators
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  call_type text NOT NULL CHECK (call_type IN (
    'discharge',
    'follow_up',
    'appointment',
    'general',
    'emergency'
  )),

  -- Relationships
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  case_id uuid REFERENCES cases(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,

  -- VAPI identifiers
  vapi_call_id text UNIQUE,
  assistant_id text,
  phone_number_id text,

  -- Contact info
  customer_phone text,
  customer_name text,

  -- Status
  status text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued',
    'scheduled',
    'ringing',
    'in_progress',
    'completed',
    'failed',
    'cancelled',
    'voicemail',
    'no_answer',
    'busy'
  )),

  -- Scheduling
  scheduled_for timestamptz,
  qstash_message_id text,

  -- Call timing
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,

  -- Content
  transcript text,
  cleaned_transcript text,
  display_transcript text,
  transcript_messages jsonb,
  summary text,
  recording_url text,
  stereo_recording_url text,

  -- AI Analysis
  user_sentiment text CHECK (user_sentiment IS NULL OR user_sentiment IN ('positive', 'neutral', 'negative')),
  success_evaluation text,
  attention_severity text CHECK (attention_severity IS NULL OR attention_severity IN ('low', 'medium', 'high', 'critical')),
  attention_summary text,
  attention_types text[],

  -- Outcomes
  outcome text,
  ended_reason text,

  -- Retry logic (extracted from metadata!)
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  next_retry_at timestamptz,

  -- Remaining JSONB
  call_analysis jsonb,
  dynamic_variables jsonb,
  structured_data jsonb,
  metadata jsonb,

  -- Cost
  cost numeric(10, 4),

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.2 Indexes for calls
CREATE INDEX IF NOT EXISTS idx_calls_vapi_call_id ON calls(vapi_call_id) WHERE vapi_call_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_clinic_id ON calls(clinic_id);
CREATE INDEX IF NOT EXISTS idx_calls_case_id ON calls(case_id) WHERE case_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_client_id ON calls(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_direction ON calls(direction);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_pending ON calls(scheduled_for) WHERE status IN ('queued', 'scheduled');
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_user_status_created ON calls(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_clinic_direction_created ON calls(clinic_id, direction, created_at DESC);

-- Full-text search on transcript
CREATE INDEX IF NOT EXISTS idx_calls_transcript_fts
  ON calls USING gin(to_tsvector('english', COALESCE(transcript, '')));

-- 3.3 RLS for calls
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own calls" ON calls;
CREATE POLICY "Users can view own calls"
  ON calls FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view clinic calls" ON calls;
CREATE POLICY "Users can view clinic calls"
  ON calls FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage own calls" ON calls;
CREATE POLICY "Users can manage own calls"
  ON calls FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access calls" ON calls;
CREATE POLICY "Service role full access calls"
  ON calls FOR ALL
  USING (auth.role() = 'service_role');

-- 3.4 Migrate data from scheduled_discharge_calls
INSERT INTO calls (
  id, direction, call_type, user_id, case_id, vapi_call_id,
  assistant_id, phone_number_id, customer_phone, status,
  scheduled_for, qstash_message_id, started_at, ended_at,
  duration_seconds, transcript, transcript_messages, summary,
  recording_url, user_sentiment, success_evaluation, ended_reason,
  retry_count, max_retries, call_analysis, dynamic_variables,
  metadata, cost, created_at, updated_at
)
SELECT
  id,
  'outbound',
  'discharge',
  user_id,
  case_id,
  vapi_call_id,
  assistant_id,
  phone_number_id,
  customer_phone,
  CASE WHEN status = 'canceled' THEN 'cancelled' ELSE COALESCE(status, 'queued') END,
  scheduled_for,
  qstash_message_id,
  started_at,
  ended_at,
  duration_seconds,
  transcript,
  transcript_messages,
  summary,
  recording_url,
  user_sentiment,
  success_evaluation,
  ended_reason,
  COALESCE((metadata->>'retry_count')::integer, 0),
  COALESCE((metadata->>'max_retries')::integer, 3),
  call_analysis,
  dynamic_variables,
  metadata - 'retry_count' - 'max_retries',
  cost,
  created_at,
  updated_at
FROM scheduled_discharge_calls
WHERE NOT EXISTS (SELECT 1 FROM calls WHERE calls.id = scheduled_discharge_calls.id);

-- 3.5 Migrate data from inbound_vapi_calls
INSERT INTO calls (
  id, direction, call_type, user_id, clinic_id, vapi_call_id,
  assistant_id, phone_number_id, customer_phone, customer_name,
  status, started_at, ended_at, duration_seconds, transcript,
  cleaned_transcript, display_transcript, transcript_messages,
  summary, recording_url, stereo_recording_url, user_sentiment,
  attention_severity, attention_summary, attention_types, outcome,
  ended_reason, call_analysis, structured_data, metadata, cost,
  created_at, updated_at
)
SELECT
  i.id,
  'inbound',
  'general',
  i.user_id,
  COALESCE(i.clinic_id, u.clinic_id),
  i.vapi_call_id,
  i.assistant_id,
  i.phone_number_id,
  i.customer_phone,
  i.customer_number,
  COALESCE(i.status, 'completed'),
  i.started_at,
  i.ended_at,
  i.duration_seconds,
  i.transcript,
  i.cleaned_transcript,
  i.display_transcript,
  i.transcript_messages,
  i.summary,
  i.recording_url,
  i.stereo_recording_url,
  i.user_sentiment,
  i.attention_severity,
  i.attention_summary,
  i.attention_types,
  i.outcome,
  i.ended_reason,
  i.call_analysis,
  i.structured_data,
  i.metadata,
  i.cost,
  i.created_at,
  i.updated_at
FROM inbound_vapi_calls i
LEFT JOIN users u ON i.user_id = u.id
WHERE NOT EXISTS (SELECT 1 FROM calls WHERE calls.id = i.id);

-- 3.6 Backwards-compatible views
-- Old code can still query scheduled_discharge_calls_v
CREATE OR REPLACE VIEW scheduled_discharge_calls_v AS
SELECT
  id,
  user_id,
  case_id,
  vapi_call_id,
  assistant_id,
  phone_number_id,
  customer_phone,
  scheduled_for,
  CASE WHEN status = 'cancelled' THEN 'canceled' ELSE status END as status,
  ended_reason,
  started_at,
  ended_at,
  duration_seconds,
  recording_url,
  transcript,
  transcript_messages,
  call_analysis,
  summary,
  user_sentiment,
  success_evaluation,
  cost,
  dynamic_variables,
  qstash_message_id,
  jsonb_build_object(
    'retry_count', retry_count,
    'max_retries', max_retries
  ) || COALESCE(metadata, '{}'::jsonb) as metadata,
  created_at,
  updated_at
FROM calls
WHERE direction = 'outbound' AND call_type = 'discharge';

-- Old code can still query inbound_vapi_calls_v
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
  c.status,
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
  c.user_sentiment,
  c.attention_severity,
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

-- ============================================================================
-- PHASE 4: PATIENTS RESTRUCTURE
-- ============================================================================
-- Creates patients_v2 with correct relationships (patient owns cases, not reverse).
-- Deduplicates existing patient records.
-- Adds patient_id_v2 to cases for new relationship.

-- 4.1 Create restructured patients table
CREATE TABLE IF NOT EXISTS patients_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,

  -- Identity
  name text NOT NULL,
  species text,
  breed text,
  color text,
  sex text CHECK (sex IS NULL OR sex IN ('male', 'female', 'male_neutered', 'female_spayed', 'unknown')),
  date_of_birth date,

  -- Physical
  weight numeric(6,2),
  weight_unit text DEFAULT 'lb' CHECK (weight_unit IN ('kg', 'lb')),

  -- Identification
  microchip_id text,

  -- External IDs (PIMS-agnostic)
  external_ids jsonb DEFAULT '{}'::jsonb,  -- {"idexx_neo": "33139", "avimark": "P-5678"}
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
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4.2 Indexes for patients_v2
CREATE INDEX IF NOT EXISTS idx_patients_v2_user_id ON patients_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_v2_clinic_id ON patients_v2(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_v2_client_id ON patients_v2(client_id);
CREATE INDEX IF NOT EXISTS idx_patients_v2_name_trgm ON patients_v2 USING gin(name gin_trgm_ops);

-- 4.3 RLS for patients_v2
ALTER TABLE patients_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own patients_v2" ON patients_v2;
CREATE POLICY "Users can manage own patients_v2"
  ON patients_v2 FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access patients_v2" ON patients_v2;
CREATE POLICY "Service role full access patients_v2"
  ON patients_v2 FOR ALL
  USING (auth.role() = 'service_role');

-- 4.4 Deduplicate and migrate patients
-- Group by (user_id, name, client_id) to find unique pets
INSERT INTO patients_v2 (
  user_id, clinic_id, client_id, name, species, breed, sex,
  weight, weight_unit, external_source, created_at
)
SELECT DISTINCT ON (p.user_id, p.name, p.client_id)
  p.user_id,
  u.clinic_id,
  p.client_id,
  p.name,
  p.species,
  p.breed,
  p.sex,
  p.weight_kg,
  'kg',
  CASE
    WHEN p.source = 'idexx_extension' THEN 'idexx_neo'::external_source
    WHEN p.source = 'manual' THEN 'manual'::external_source
    WHEN p.source = 'ios_scribe' THEN 'ios_scribe'::external_source
    ELSE NULL
  END,
  MIN(p.created_at) OVER (PARTITION BY p.user_id, p.name, p.client_id)
FROM patients p
JOIN users u ON p.user_id = u.id
WHERE p.name IS NOT NULL AND p.name != ''
ON CONFLICT DO NOTHING;

-- 4.5 Add patient_id_v2 to cases (new relationship: case belongs to patient)
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS patient_id_v2 uuid REFERENCES patients_v2(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cases_patient_id_v2 ON cases(patient_id_v2);

-- Link cases to deduplicated patients
UPDATE cases c
SET patient_id_v2 = p2.id
FROM patients old_p
JOIN patients_v2 p2 ON
  old_p.user_id = p2.user_id
  AND old_p.name = p2.name
  AND COALESCE(old_p.client_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p2.client_id, '00000000-0000-0000-0000-000000000000')
WHERE c.id = old_p.case_id
  AND c.patient_id_v2 IS NULL;

-- 4.6 Add client_id to cases for denormalized queries
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);

-- Populate from patient relationship
UPDATE cases c
SET client_id = p2.client_id
FROM patients_v2 p2
WHERE c.patient_id_v2 = p2.id
  AND c.client_id IS NULL
  AND p2.client_id IS NOT NULL;

-- ============================================================================
-- PHASE 5: CASES ENHANCEMENTS
-- ============================================================================
-- Extracts commonly-queried fields from JSONB metadata to indexed columns.
-- Adds discharge workflow tracking fields.
-- Preserves metadata JSONB for flexible/overflow data.

-- 5.1 Add extracted columns
ALTER TABLE cases ADD COLUMN IF NOT EXISTS patient_name text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS owner_name text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS owner_phone text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS owner_email text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS provider_name text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS diagnosis_summary text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS visit_reason text;

-- 5.2 Add discharge workflow tracking
ALTER TABLE cases ADD COLUMN IF NOT EXISTS discharge_status text CHECK (
  discharge_status IS NULL OR discharge_status IN (
    'not_started',
    'call_scheduled',
    'call_in_progress',
    'call_completed',
    'email_scheduled',
    'email_sent',
    'completed',
    'skipped'
  )
);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS discharge_completed_at timestamptz;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS call_outcome text;

-- 5.3 Add call intelligence fields (extracted from metadata)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS call_approach text CHECK (
  call_approach IS NULL OR call_approach IN (
    'brief-checkin',
    'standard-assessment',
    'detailed-monitoring'
  )
);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS should_ask_clinical_questions boolean DEFAULT true;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS assessment_questions_count integer;

-- 5.4 Add PIMS tracking fields (extracted from metadata)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS external_appointment_id text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS external_consultation_id text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS external_source external_source;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS pims_data jsonb;

-- 5.5 Indexes on new columns
CREATE INDEX IF NOT EXISTS idx_cases_patient_name ON cases(patient_name) WHERE patient_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_owner_phone ON cases(owner_phone) WHERE owner_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_external_appointment ON cases(external_appointment_id) WHERE external_appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_discharge_status ON cases(discharge_status) WHERE discharge_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_external_source ON cases(external_source) WHERE external_source IS NOT NULL;

-- Trigram index for fuzzy patient name search
CREATE INDEX IF NOT EXISTS idx_cases_patient_name_trgm ON cases USING gin(patient_name gin_trgm_ops);

-- 5.6 Backfill extracted columns from metadata/entity_extraction
UPDATE cases
SET
  patient_name = COALESCE(
    entity_extraction->'patient'->>'name',
    metadata->'idexx'->>'patient_name',
    patient_name
  ),
  owner_name = COALESCE(
    entity_extraction->'patient'->'owner'->>'name',
    metadata->'idexx'->>'client_name',
    owner_name
  ),
  owner_phone = COALESCE(
    entity_extraction->'patient'->'owner'->>'phone',
    metadata->'idexx'->>'client_phone',
    owner_phone
  ),
  owner_email = COALESCE(
    metadata->'idexx'->>'client_email',
    owner_email
  ),
  provider_name = COALESCE(
    metadata->'idexx'->>'provider_name',
    provider_name
  ),
  visit_reason = COALESCE(
    metadata->'idexx'->>'appointment_type',
    visit_reason
  ),
  call_approach = COALESCE(
    CASE
      WHEN metadata->'callIntelligence'->>'callApproach' IN ('brief-checkin', 'standard-assessment', 'detailed-monitoring')
      THEN metadata->'callIntelligence'->>'callApproach'
      ELSE NULL
    END,
    call_approach
  ),
  should_ask_clinical_questions = COALESCE(
    (metadata->'callIntelligence'->>'shouldAskClinicalQuestions')::boolean,
    should_ask_clinical_questions
  ),
  external_appointment_id = COALESCE(
    metadata->'idexx'->>'appointment_id',
    external_appointment_id
  ),
  external_consultation_id = COALESCE(
    metadata->'idexx'->>'consultation_id',
    external_consultation_id
  ),
  external_source = COALESCE(
    CASE
      WHEN source = 'idexx_extension' THEN 'idexx_neo'::external_source
      WHEN source = 'manual' THEN 'manual'::external_source
      WHEN source = 'ios_scribe' THEN 'ios_scribe'::external_source
      ELSE NULL
    END,
    external_source
  ),
  pims_data = COALESCE(
    metadata->'idexx',
    pims_data
  )
WHERE entity_extraction IS NOT NULL
   OR metadata IS NOT NULL;

-- ============================================================================
-- PHASE 6: CLINICAL NOTES UNIFICATION
-- ============================================================================
-- Unifies transcriptions table with IDEXX consultation notes into
-- a single clinical_notes table. Preserves source information.

-- 6.1 Create clinical_notes table
CREATE TABLE IF NOT EXISTS clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Type discriminator
  note_type text NOT NULL CHECK (note_type IN (
    'transcription',
    'consultation_notes',
    'clinical_notes',
    'soap_draft'
  )),

  -- Content
  content text NOT NULL,
  speaker_segments jsonb,

  -- Source tracking
  source external_source,
  audio_file_id uuid REFERENCES audio_files(id) ON DELETE SET NULL,

  -- Processing status (for transcriptions)
  processing_status text CHECK (processing_status IS NULL OR processing_status IN (
    'recording',
    'uploading',
    'processing',
    'completed',
    'failed'
  )),

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6.2 Indexes
CREATE INDEX IF NOT EXISTS idx_clinical_notes_case_id ON clinical_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_user_id ON clinical_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_type ON clinical_notes(note_type);

-- Full-text search on content
CREATE INDEX IF NOT EXISTS idx_clinical_notes_content_fts
  ON clinical_notes USING gin(to_tsvector('english', content));

-- 6.3 RLS
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own clinical_notes" ON clinical_notes;
CREATE POLICY "Users can manage own clinical_notes"
  ON clinical_notes FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access clinical_notes" ON clinical_notes;
CREATE POLICY "Service role full access clinical_notes"
  ON clinical_notes FOR ALL
  USING (auth.role() = 'service_role');

-- 6.4 Migrate transcriptions
INSERT INTO clinical_notes (
  id, case_id, user_id, note_type, content, speaker_segments,
  source, audio_file_id, processing_status, created_at, updated_at
)
SELECT
  id,
  case_id,
  user_id,
  'transcription',
  transcript,
  speaker_segments,
  'ios_scribe'::external_source,
  audio_file_id,
  processing_status,
  created_at,
  updated_at
FROM transcriptions
WHERE transcript IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM clinical_notes WHERE clinical_notes.id = transcriptions.id);

-- 6.5 Migrate IDEXX consultation notes from cases.metadata
INSERT INTO clinical_notes (
  case_id, user_id, note_type, content, source, created_at, updated_at
)
SELECT
  id as case_id,
  user_id,
  'consultation_notes',
  metadata->'idexx'->>'consultation_notes',
  'idexx_neo'::external_source,
  created_at,
  updated_at
FROM cases
WHERE metadata->'idexx'->>'consultation_notes' IS NOT NULL
  AND metadata->'idexx'->>'consultation_notes' != ''
  AND NOT EXISTS (
    SELECT 1 FROM clinical_notes cn
    WHERE cn.case_id = cases.id
      AND cn.note_type = 'consultation_notes'
  );

-- 6.6 Backwards-compatible view
CREATE OR REPLACE VIEW transcriptions_v AS
SELECT
  id,
  case_id,
  user_id,
  audio_file_id,
  content as transcript,
  speaker_segments,
  processing_status,
  created_at,
  updated_at
FROM clinical_notes
WHERE note_type = 'transcription';

-- ============================================================================
-- PHASE 7: UPDATED RLS POLICIES (UUID-based)
-- ============================================================================
-- Updates RLS policies to use efficient UUID comparisons instead of text.

-- 7.1 Update inbound_vapi_calls RLS (if table still exists)
DROP POLICY IF EXISTS "Users can view clinic inbound calls" ON inbound_vapi_calls;
CREATE POLICY "Users can view clinic inbound calls"
  ON inbound_vapi_calls FOR SELECT
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Service role full access inbound calls" ON inbound_vapi_calls;
CREATE POLICY "Service role full access inbound calls"
  ON inbound_vapi_calls FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to upsert client during ingestion
CREATE OR REPLACE FUNCTION upsert_client(
  p_user_id uuid,
  p_phone text,
  p_full_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_clinic_id uuid DEFAULT NULL,
  p_external_source external_source DEFAULT NULL,
  p_external_id text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_client_id uuid;
BEGIN
  INSERT INTO clients (user_id, phone, full_name, email, clinic_id, external_source)
  VALUES (p_user_id, p_phone, p_full_name, p_email, p_clinic_id, p_external_source)
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

-- Function to upsert patient during ingestion
CREATE OR REPLACE FUNCTION upsert_patient(
  p_user_id uuid,
  p_client_id uuid,
  p_name text,
  p_species text DEFAULT NULL,
  p_breed text DEFAULT NULL,
  p_clinic_id uuid DEFAULT NULL,
  p_external_source external_source DEFAULT NULL,
  p_external_id text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_patient_id uuid;
BEGIN
  -- Try to find existing patient by external_id first
  IF p_external_source IS NOT NULL AND p_external_id IS NOT NULL THEN
    SELECT id INTO v_patient_id
    FROM patients_v2
    WHERE user_id = p_user_id
      AND external_ids->>p_external_source::text = p_external_id;

    IF v_patient_id IS NOT NULL THEN
      UPDATE patients_v2 SET
        name = COALESCE(p_name, name),
        species = COALESCE(p_species, species),
        breed = COALESCE(p_breed, breed),
        client_id = COALESCE(p_client_id, client_id),
        updated_at = now()
      WHERE id = v_patient_id;

      RETURN v_patient_id;
    END IF;
  END IF;

  -- Try to find by name + client
  SELECT id INTO v_patient_id
  FROM patients_v2
  WHERE user_id = p_user_id
    AND client_id = p_client_id
    AND LOWER(name) = LOWER(p_name);

  IF v_patient_id IS NOT NULL THEN
    UPDATE patients_v2 SET
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

  -- Create new patient
  INSERT INTO patients_v2 (
    user_id, client_id, clinic_id, name, species, breed,
    external_source, external_ids
  )
  VALUES (
    p_user_id, p_client_id, p_clinic_id, p_name, p_species, p_breed,
    p_external_source,
    CASE
      WHEN p_external_source IS NOT NULL AND p_external_id IS NOT NULL
      THEN jsonb_build_object(p_external_source::text, p_external_id)
      ELSE '{}'::jsonb
    END
  )
  RETURNING id INTO v_patient_id;

  RETURN v_patient_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DEPRECATION COMMENTS
-- ============================================================================
-- Mark deprecated tables with comments for documentation

COMMENT ON TABLE retell_calls IS 'DEPRECATED: Legacy Retell AI integration. Use `calls` table instead.';
COMMENT ON TABLE call_patients IS 'DEPRECATED: Legacy call patient data. Use `clients` table instead.';
COMMENT ON TABLE scheduled_discharge_calls IS 'DEPRECATED: Use `calls` table with direction=outbound, call_type=discharge. View available: scheduled_discharge_calls_v';
COMMENT ON TABLE inbound_vapi_calls IS 'DEPRECATED: Use `calls` table with direction=inbound. View available: inbound_vapi_calls_v';
COMMENT ON TABLE patients IS 'DEPRECATED: Use `patients_v2` table with correct relationships. patient_id_v2 on cases references new table.';
COMMENT ON TABLE transcriptions IS 'DEPRECATED: Use `clinical_notes` table with note_type=transcription. View available: transcriptions_v';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- Post-migration checklist:
-- 1. Verify all data migrated: Compare row counts
-- 2. Test backwards-compatible views return same data
-- 3. Update application code to use new tables gradually
-- 4. Monitor for errors in production
-- 5. After 60 days, drop deprecated tables
--
-- Rollback: Each phase can be rolled back by:
-- - Dropping new tables/columns
-- - Dropping views
-- - Removing indexes
-- ============================================================================

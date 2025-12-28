-- ============================================================================
-- ODIS AI Database Schema - Ideal Architecture (Magic Wand)
-- ============================================================================
-- This is the ideal database schema if starting from scratch with no legacy
-- constraints. Represents best practices for a veterinary AI platform.
--
-- Key Design Principles:
--   1. Proper entity relationships (Client → Patient → Case)
--   2. PIMS-agnostic design (supports any veterinary practice management system)
--   3. Normalized data with strategic denormalization for query performance
--   4. Unified tables (one calls table, one clinical_notes table)
--   5. Proper enums and constraints
--   6. Comprehensive indexes
--   7. Row Level Security (RLS) throughout
--
-- Entity Hierarchy:
--   Clinic → User → Client (pet owner) → Patient (pet) → Case (visit)
--
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Encryption functions

-- ============================================================================
-- ENUMS
-- ============================================================================

-- External data source (PIMS-agnostic)
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

-- Case visibility
CREATE TYPE case_visibility AS ENUM (
  'private',
  'clinic',
  'public'
);

-- Case type
CREATE TYPE case_type AS ENUM (
  'checkup',
  'emergency',
  'surgery',
  'follow_up',
  'dental',
  'vaccination',
  'wellness',
  'consultation',
  'grooming',
  'boarding',
  'other'
);

-- Case status
CREATE TYPE case_status AS ENUM (
  'draft',
  'ongoing',
  'completed',
  'reviewed',
  'archived',
  'cancelled',
  'pending_review'
);

-- Discharge status
CREATE TYPE discharge_status AS ENUM (
  'not_started',
  'call_scheduled',
  'call_in_progress',
  'call_completed',
  'email_scheduled',
  'email_sent',
  'completed',
  'skipped'
);

-- Call direction
CREATE TYPE call_direction AS ENUM (
  'inbound',
  'outbound'
);

-- Call type
CREATE TYPE call_type AS ENUM (
  'discharge',
  'follow_up',
  'appointment',
  'general',
  'emergency',
  'reminder'
);

-- Call status
CREATE TYPE call_status AS ENUM (
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
);

-- Sentiment
CREATE TYPE sentiment AS ENUM (
  'positive',
  'neutral',
  'negative'
);

-- Attention severity
CREATE TYPE attention_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Call approach
CREATE TYPE call_approach AS ENUM (
  'brief_checkin',
  'standard_assessment',
  'detailed_monitoring'
);

-- Clinical note type
CREATE TYPE clinical_note_type AS ENUM (
  'transcription',
  'consultation_notes',
  'clinical_notes',
  'soap_draft',
  'progress_notes'
);

-- Processing status
CREATE TYPE processing_status AS ENUM (
  'recording',
  'uploading',
  'processing',
  'completed',
  'failed'
);

-- Contact method preference
CREATE TYPE contact_method AS ENUM (
  'phone',
  'email',
  'sms'
);

-- Phone type
CREATE TYPE phone_type AS ENUM (
  'mobile',
  'home',
  'work'
);

-- Sex
CREATE TYPE animal_sex AS ENUM (
  'male',
  'female',
  'male_neutered',
  'female_spayed',
  'unknown'
);

-- Weight unit
CREATE TYPE weight_unit AS ENUM (
  'kg',
  'lb'
);

-- Template type
CREATE TYPE template_type AS ENUM (
  'soap',
  'discharge_summary',
  'email',
  'sms',
  'prompt'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CLINICS
-- ----------------------------------------------------------------------------
-- Top-level organization entity. All data is scoped to a clinic.

CREATE TABLE clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name text NOT NULL,
  display_name text,
  slug text UNIQUE,

  -- Contact
  phone text,
  email text,
  website text,

  -- Address
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'US',
  timezone text DEFAULT 'America/Los_Angeles',

  -- Business hours (JSONB for flexibility)
  business_hours jsonb DEFAULT '{
    "monday": {"open": "08:00", "close": "18:00"},
    "tuesday": {"open": "08:00", "close": "18:00"},
    "wednesday": {"open": "08:00", "close": "18:00"},
    "thursday": {"open": "08:00", "close": "18:00"},
    "friday": {"open": "08:00", "close": "18:00"},
    "saturday": {"open": "09:00", "close": "14:00"},
    "sunday": null
  }'::jsonb,

  -- Emergency contact
  emergency_phone text,
  emergency_instructions text,

  -- VAPI configuration
  vapi_assistant_id text,
  vapi_phone_number_id text,
  vapi_inbound_assistant_id text,

  -- Settings
  settings jsonb DEFAULT '{}'::jsonb,

  -- Status
  is_active boolean DEFAULT true,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clinics_slug ON clinics(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_clinics_active ON clinics(is_active) WHERE is_active = true;

-- ----------------------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------------------
-- User accounts (veterinarians, staff). Extends Supabase auth.users.

CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Clinic relationship
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Identity
  email text NOT NULL,
  full_name text,
  display_name text,
  avatar_url text,

  -- Role
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'veterinarian', 'technician', 'staff')),

  -- Contact
  phone text,

  -- Preferences
  preferences jsonb DEFAULT '{}'::jsonb,
  notification_settings jsonb DEFAULT '{
    "email_notifications": true,
    "sms_notifications": false,
    "push_notifications": true
  }'::jsonb,

  -- Status
  is_active boolean DEFAULT true,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE INDEX idx_users_clinic_id ON users(clinic_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ----------------------------------------------------------------------------
-- PROVIDERS
-- ----------------------------------------------------------------------------
-- Veterinary providers/doctors (may or may not have user accounts).

CREATE TABLE providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,

  -- Identity
  name text NOT NULL,
  title text,  -- "DVM", "VMD", etc.
  specialty text,

  -- External IDs
  external_ids jsonb DEFAULT '{}'::jsonb,
  external_source external_source,

  -- Status
  is_active boolean DEFAULT true,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_providers_clinic_id ON providers(clinic_id);
CREATE INDEX idx_providers_user_id ON providers(user_id);

-- ----------------------------------------------------------------------------
-- CLIENTS
-- ----------------------------------------------------------------------------
-- Pet owners. Single source of truth for contact information.

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership (which user/clinic manages this client)
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Identity
  first_name text,
  last_name text,
  full_name text GENERATED ALWAYS AS (
    COALESCE(
      NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ''),
      first_name,
      last_name,
      'Unknown'
    )
  ) STORED,

  -- Contact - Primary
  phone text NOT NULL,
  phone_type phone_type DEFAULT 'mobile',

  -- Contact - Secondary
  phone_secondary text,
  phone_secondary_type phone_type,

  -- Email
  email text,

  -- Address
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'US',

  -- External IDs (PIMS-agnostic)
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

  -- Deduplication constraint: one client per phone per user
  CONSTRAINT clients_user_phone_unique UNIQUE(user_id, phone)
);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_clinic_id ON clients(clinic_id);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX idx_clients_full_name_trgm ON clients USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_clients_external_ids ON clients USING gin(external_ids);
CREATE INDEX idx_clients_do_not_contact ON clients(user_id) WHERE do_not_contact = true;

-- ----------------------------------------------------------------------------
-- PATIENTS
-- ----------------------------------------------------------------------------
-- Pets. Belongs to a client (owner). Has many cases (visits).

CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

  -- External IDs (PIMS-agnostic)
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

  -- Deduplication: unique patient per name per client
  CONSTRAINT patients_client_name_unique UNIQUE(client_id, name)
);

CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_patients_client_id ON patients(client_id);
CREATE INDEX idx_patients_name_trgm ON patients USING gin(name gin_trgm_ops);
CREATE INDEX idx_patients_external_ids ON patients USING gin(external_ids);
CREATE INDEX idx_patients_species ON patients(species) WHERE species IS NOT NULL;

-- ----------------------------------------------------------------------------
-- CASES
-- ----------------------------------------------------------------------------
-- Patient visits/encounters. The core transactional entity.

CREATE TABLE cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships (correct hierarchy: case belongs to patient)
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,  -- Denormalized for query perf
  provider_id uuid REFERENCES providers(id) ON DELETE SET NULL,

  -- Classification
  visibility case_visibility DEFAULT 'private',
  case_type case_type DEFAULT 'checkup',
  status case_status DEFAULT 'draft',

  -- External IDs (PIMS-agnostic)
  external_id text,
  external_appointment_id text,
  external_consultation_id text,
  external_source external_source,

  -- Normalized fields (extracted from PIMS data for indexing)
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

  -- AI-extracted entities (structured extraction from clinical notes)
  entity_extraction jsonb,

  -- Raw PIMS data (preserved for audit/debugging)
  pims_data jsonb,

  -- Flexible metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Flags
  is_urgent boolean DEFAULT false,
  is_starred boolean DEFAULT false,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_cases_clinic_id ON cases(clinic_id);
CREATE INDEX idx_cases_patient_id ON cases(patient_id);
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_provider_id ON cases(provider_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_case_type ON cases(case_type);
CREATE INDEX idx_cases_discharge_status ON cases(discharge_status);
CREATE INDEX idx_cases_external_id ON cases(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_cases_external_source ON cases(external_source);
CREATE INDEX idx_cases_scheduled_at ON cases(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX idx_cases_user_status_created ON cases(user_id, status, created_at DESC);
CREATE INDEX idx_cases_patient_name_trgm ON cases USING gin(patient_name gin_trgm_ops);
CREATE INDEX idx_cases_owner_phone ON cases(owner_phone) WHERE owner_phone IS NOT NULL;
CREATE INDEX idx_cases_urgent ON cases(user_id) WHERE is_urgent = true;
CREATE INDEX idx_cases_starred ON cases(user_id) WHERE is_starred = true;

-- ============================================================================
-- CLINICAL CONTENT TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CLINICAL NOTES
-- ----------------------------------------------------------------------------
-- Unified table for all clinical notes (transcriptions, consultation notes, etc.)

CREATE TABLE clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,

  -- Type
  note_type clinical_note_type NOT NULL,

  -- Content
  content text NOT NULL,

  -- Transcription-specific
  speaker_segments jsonb,
  audio_file_url text,
  audio_duration_seconds integer,

  -- Source
  source external_source,

  -- Processing
  processing_status processing_status,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clinical_notes_case_id ON clinical_notes(case_id);
CREATE INDEX idx_clinical_notes_user_id ON clinical_notes(user_id);
CREATE INDEX idx_clinical_notes_type ON clinical_notes(note_type);
CREATE INDEX idx_clinical_notes_content_fts ON clinical_notes USING gin(to_tsvector('english', content));

-- ----------------------------------------------------------------------------
-- SOAP NOTES
-- ----------------------------------------------------------------------------
-- SOAP (Subjective, Objective, Assessment, Plan) clinical notes.

CREATE TABLE soap_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  template_id uuid,

  -- SOAP sections
  subjective text,
  objective text,
  assessment text,
  plan text,

  -- Additional sections
  history text,
  physical_exam text,
  diagnostics text,

  -- Structured data
  vital_signs jsonb,
  medications jsonb,
  diagnoses jsonb,

  -- AI generation metadata
  ai_model text,
  ai_confidence numeric(3,2),

  -- Status
  is_finalized boolean DEFAULT false,
  finalized_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_soap_notes_case_id ON soap_notes(case_id);
CREATE INDEX idx_soap_notes_user_id ON soap_notes(user_id);
CREATE INDEX idx_soap_notes_finalized ON soap_notes(is_finalized);

-- ----------------------------------------------------------------------------
-- DISCHARGE SUMMARIES
-- ----------------------------------------------------------------------------
-- AI-generated discharge summaries for client communication.

CREATE TABLE discharge_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  template_id uuid,

  -- Content
  summary text NOT NULL,

  -- Structured sections
  diagnosis text,
  treatment text,
  medications jsonb,
  home_care_instructions text,
  follow_up_instructions text,
  warning_signs text,
  diet_instructions text,
  activity_restrictions text,

  -- AI generation metadata
  ai_model text,
  ai_confidence numeric(3,2),

  -- Status
  is_finalized boolean DEFAULT false,
  finalized_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_discharge_summaries_case_id ON discharge_summaries(case_id);
CREATE INDEX idx_discharge_summaries_user_id ON discharge_summaries(user_id);

-- ============================================================================
-- COMMUNICATION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CALLS
-- ----------------------------------------------------------------------------
-- Unified table for all voice calls (inbound and outbound).

CREATE TABLE calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Direction & Type
  direction call_direction NOT NULL,
  call_type call_type NOT NULL,

  -- Relationships
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  case_id uuid REFERENCES cases(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
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

  -- Attention flags (for inbound)
  attention_severity attention_severity,
  attention_summary text,
  attention_types text[],

  -- Outcomes
  outcome text,
  ended_reason text,

  -- Structured data (appointment requests, etc.)
  structured_data jsonb,

  -- Dynamic variables passed to assistant
  dynamic_variables jsonb,

  -- Flexible metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Cost
  cost numeric(10, 4),

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_calls_vapi_call_id ON calls(vapi_call_id) WHERE vapi_call_id IS NOT NULL;
CREATE INDEX idx_calls_user_id ON calls(user_id);
CREATE INDEX idx_calls_clinic_id ON calls(clinic_id);
CREATE INDEX idx_calls_case_id ON calls(case_id);
CREATE INDEX idx_calls_client_id ON calls(client_id);
CREATE INDEX idx_calls_direction ON calls(direction);
CREATE INDEX idx_calls_call_type ON calls(call_type);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_pending ON calls(scheduled_for) WHERE status IN ('queued', 'scheduled');
CREATE INDEX idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX idx_calls_user_status_created ON calls(user_id, status, created_at DESC);
CREATE INDEX idx_calls_clinic_direction ON calls(clinic_id, direction);
CREATE INDEX idx_calls_qstash ON calls(qstash_message_id) WHERE qstash_message_id IS NOT NULL;
CREATE INDEX idx_calls_transcript_fts ON calls USING gin(to_tsvector('english', COALESCE(transcript, '')));

-- ----------------------------------------------------------------------------
-- EMAILS
-- ----------------------------------------------------------------------------
-- Discharge and follow-up emails.

CREATE TABLE emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  case_id uuid REFERENCES cases(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,

  -- Email details
  email_type text NOT NULL CHECK (email_type IN ('discharge', 'follow_up', 'reminder', 'general')),
  recipient_email text NOT NULL,
  recipient_name text,

  -- Content
  subject text NOT NULL,
  body_html text,
  body_text text,

  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sent', 'delivered', 'bounced', 'failed')),

  -- Scheduling
  scheduled_for timestamptz,

  -- Delivery tracking
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,

  -- External IDs
  resend_id text,

  -- Error tracking
  error_message text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_emails_user_id ON emails(user_id);
CREATE INDEX idx_emails_clinic_id ON emails(clinic_id);
CREATE INDEX idx_emails_case_id ON emails(case_id);
CREATE INDEX idx_emails_client_id ON emails(client_id);
CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_scheduled ON emails(scheduled_for) WHERE status IN ('pending', 'scheduled');

-- ----------------------------------------------------------------------------
-- MESSAGES
-- ----------------------------------------------------------------------------
-- Inbound messages from calls (voicemail transcripts, callback requests).

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  call_id uuid REFERENCES calls(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,

  -- Message details
  message_type text NOT NULL CHECK (message_type IN ('voicemail', 'callback_request', 'general_inquiry', 'appointment_request')),

  -- Contact
  from_phone text,
  from_name text,

  -- Content
  content text NOT NULL,

  -- Status
  status text NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'in_progress', 'resolved', 'archived')),

  -- Assignment
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,

  -- Resolution
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_clinic_id ON messages(clinic_id);
CREATE INDEX idx_messages_call_id ON messages(call_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_unread ON messages(clinic_id) WHERE status = 'unread';

-- ============================================================================
-- SCHEDULING TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- APPOINTMENTS
-- ----------------------------------------------------------------------------
-- Future appointments (synced from PIMS or created manually).

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES providers(id) ON DELETE SET NULL,

  -- External IDs
  external_id text,
  external_source external_source,

  -- Scheduling
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  duration_minutes integer,

  -- Details
  appointment_type text,
  reason text,
  notes text,

  -- Status
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_clinic_date ON appointments(clinic_id, date);
CREATE INDEX idx_appointments_external_id ON appointments(external_id) WHERE external_id IS NOT NULL;

-- ============================================================================
-- TEMPLATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TEMPLATES
-- ----------------------------------------------------------------------------
-- User-created templates for SOAP notes, discharge summaries, etc.

CREATE TABLE templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,

  -- Identity
  template_type template_type NOT NULL,
  name text NOT NULL,
  display_name text,
  description text,
  icon_name text DEFAULT 'file-text',

  -- Content
  content text,
  structured_content jsonb,
  system_prompt text,
  section_prompts jsonb,

  -- Settings
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  visibility case_visibility DEFAULT 'private',

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Unique constraint per user/type/name
  CONSTRAINT templates_user_type_name_unique UNIQUE(user_id, template_type, name)
);

CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_clinic_id ON templates(clinic_id);
CREATE INDEX idx_templates_type ON templates(template_type);
CREATE INDEX idx_templates_default ON templates(user_id, template_type) WHERE is_default = true;

-- ============================================================================
-- INTEGRATION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PIMS CREDENTIALS
-- ----------------------------------------------------------------------------
-- Encrypted credentials for PIMS integrations.

CREATE TABLE pims_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- PIMS type
  pims_type external_source NOT NULL,

  -- Encrypted credentials
  credentials_encrypted bytea NOT NULL,

  -- Status
  is_active boolean DEFAULT true,
  last_verified_at timestamptz,
  last_sync_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- One credential set per PIMS per user
  CONSTRAINT pims_credentials_user_type_unique UNIQUE(user_id, pims_type)
);

CREATE INDEX idx_pims_credentials_user_id ON pims_credentials(user_id);
CREATE INDEX idx_pims_credentials_clinic_id ON pims_credentials(clinic_id);

-- ----------------------------------------------------------------------------
-- SYNC SESSIONS
-- ----------------------------------------------------------------------------
-- Track PIMS sync sessions.

CREATE TABLE sync_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Sync details
  pims_type external_source NOT NULL,
  sync_type text NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),

  -- Status
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),

  -- Stats
  records_processed integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,

  -- Timing
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,

  -- Error tracking
  error_message text,
  error_details jsonb,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_sessions_user_id ON sync_sessions(user_id);
CREATE INDEX idx_sync_sessions_clinic_id ON sync_sessions(clinic_id);
CREATE INDEX idx_sync_sessions_status ON sync_sessions(status);

-- ============================================================================
-- BATCH PROCESSING TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DISCHARGE BATCHES
-- ----------------------------------------------------------------------------
-- Batch containers for bulk discharge operations.

CREATE TABLE discharge_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Batch details
  name text,

  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),

  -- Stats
  total_items integer DEFAULT 0,
  completed_items integer DEFAULT 0,
  failed_items integer DEFAULT 0,

  -- Scheduling
  scheduled_for timestamptz,

  -- Timing
  started_at timestamptz,
  completed_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_discharge_batches_user_id ON discharge_batches(user_id);
CREATE INDEX idx_discharge_batches_status ON discharge_batches(status);

-- ----------------------------------------------------------------------------
-- DISCHARGE BATCH ITEMS
-- ----------------------------------------------------------------------------
-- Individual items within a discharge batch.

CREATE TABLE discharge_batch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  batch_id uuid NOT NULL REFERENCES discharge_batches(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  call_id uuid REFERENCES calls(id) ON DELETE SET NULL,

  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'failed', 'skipped')),

  -- Error tracking
  error_message text,

  -- Timing
  scheduled_for timestamptz,
  processed_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_discharge_batch_items_batch_id ON discharge_batch_items(batch_id);
CREATE INDEX idx_discharge_batch_items_case_id ON discharge_batch_items(case_id);
CREATE INDEX idx_discharge_batch_items_status ON discharge_batch_items(status);

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- USER EVENTS
-- ----------------------------------------------------------------------------
-- User activity tracking for analytics.

CREATE TABLE user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,

  -- Event details
  event_name text NOT NULL,
  event_category text,

  -- Context
  properties jsonb DEFAULT '{}'::jsonb,

  -- Session
  session_id text,

  -- Device/browser
  user_agent text,
  ip_address inet,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_clinic_id ON user_events(clinic_id);
CREATE INDEX idx_user_events_event_name ON user_events(event_name);
CREATE INDEX idx_user_events_created_at ON user_events(created_at DESC);

-- ============================================================================
-- EXTERNAL INTEGRATION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SLACK WORKSPACES
-- ----------------------------------------------------------------------------
-- Connected Slack workspaces for notifications.

CREATE TABLE slack_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Slack details
  team_id text NOT NULL UNIQUE,
  team_name text,
  access_token_encrypted bytea,
  bot_user_id text,

  -- Status
  is_active boolean DEFAULT true,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_slack_workspaces_clinic_id ON slack_workspaces(clinic_id);
CREATE INDEX idx_slack_workspaces_team_id ON slack_workspaces(team_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE soap_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pims_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_workspaces ENABLE ROW LEVEL SECURITY;

-- Clinics: Users can view their own clinic
CREATE POLICY "Users can view own clinic" ON clinics
  FOR SELECT USING (id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Service role full access clinics" ON clinics
  FOR ALL USING (auth.role() = 'service_role');

-- Users: Users can view/update themselves, admins can manage clinic users
CREATE POLICY "Users can view themselves" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update themselves" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage clinic users" ON users
  FOR ALL USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Service role full access users" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Providers: Clinic users can view providers
CREATE POLICY "Users can view clinic providers" ON providers
  FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage providers" ON providers
  FOR ALL USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Service role full access providers" ON providers
  FOR ALL USING (auth.role() = 'service_role');

-- Clients, Patients, Cases: Users can manage their own data
CREATE POLICY "Users can manage own clients" ON clients
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role full access clients" ON clients
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own patients" ON patients
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role full access patients" ON patients
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own cases" ON cases
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role full access cases" ON cases
  FOR ALL USING (auth.role() = 'service_role');

-- Clinical content: Users can manage their own data
CREATE POLICY "Users can manage own clinical_notes" ON clinical_notes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role full access clinical_notes" ON clinical_notes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own soap_notes" ON soap_notes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role full access soap_notes" ON soap_notes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own discharge_summaries" ON discharge_summaries
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role full access discharge_summaries" ON discharge_summaries
  FOR ALL USING (auth.role() = 'service_role');

-- Calls: Users can view own calls and clinic calls
CREATE POLICY "Users can manage own calls" ON calls
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view clinic calls" ON calls
  FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Service role full access calls" ON calls
  FOR ALL USING (auth.role() = 'service_role');

-- Emails: Users can manage their own emails
CREATE POLICY "Users can manage own emails" ON emails
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role full access emails" ON emails
  FOR ALL USING (auth.role() = 'service_role');

-- Messages: Clinic users can view messages
CREATE POLICY "Users can view clinic messages" ON messages
  FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage assigned messages" ON messages
  FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY "Service role full access messages" ON messages
  FOR ALL USING (auth.role() = 'service_role');

-- Appointments: Clinic users can view appointments
CREATE POLICY "Users can view clinic appointments" ON appointments
  FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Service role full access appointments" ON appointments
  FOR ALL USING (auth.role() = 'service_role');

-- Templates: Users can manage own templates
CREATE POLICY "Users can manage own templates" ON templates
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view public templates" ON templates
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can view clinic templates" ON templates
  FOR SELECT USING (
    visibility = 'clinic'
    AND clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Service role full access templates" ON templates
  FOR ALL USING (auth.role() = 'service_role');

-- Credentials: Users can manage own credentials
CREATE POLICY "Users can manage own pims_credentials" ON pims_credentials
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role full access pims_credentials" ON pims_credentials
  FOR ALL USING (auth.role() = 'service_role');

-- Sync sessions: Users can view own sync sessions
CREATE POLICY "Users can view own sync_sessions" ON sync_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role full access sync_sessions" ON sync_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Batch processing: Users can manage own batches
CREATE POLICY "Users can manage own discharge_batches" ON discharge_batches
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role full access discharge_batches" ON discharge_batches
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own batch items" ON discharge_batch_items
  FOR SELECT USING (
    batch_id IN (SELECT id FROM discharge_batches WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role full access discharge_batch_items" ON discharge_batch_items
  FOR ALL USING (auth.role() = 'service_role');

-- Analytics: Users can view own events
CREATE POLICY "Users can view own events" ON user_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role full access user_events" ON user_events
  FOR ALL USING (auth.role() = 'service_role');

-- Slack: Clinic admins can manage
CREATE POLICY "Admins can manage slack_workspaces" ON slack_workspaces
  FOR ALL USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Service role full access slack_workspaces" ON slack_workspaces
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to upsert client during ingestion
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

-- Function to upsert patient during ingestion
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
  -- Try to find existing patient by external_id first
  IF p_external_source IS NOT NULL AND p_external_id IS NOT NULL THEN
    SELECT id INTO v_patient_id
    FROM patients
    WHERE user_id = p_user_id
      AND external_ids->>p_external_source::text = p_external_id;

    IF v_patient_id IS NOT NULL THEN
      UPDATE patients SET
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
  FROM patients
  WHERE client_id = p_client_id
    AND LOWER(name) = LOWER(p_name);

  IF v_patient_id IS NOT NULL THEN
    UPDATE patients SET
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
  INSERT INTO patients (
    user_id, clinic_id, client_id, name, species, breed,
    external_source, external_ids
  )
  VALUES (
    p_user_id, p_clinic_id, p_client_id, p_name, p_species, p_breed,
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

-- Function to ingest case from any PIMS
CREATE OR REPLACE FUNCTION ingest_case(
  p_user_id uuid,
  p_clinic_id uuid,
  p_external_source external_source,
  p_external_id text,
  p_patient_name text,
  p_owner_name text,
  p_owner_phone text,
  p_owner_email text DEFAULT NULL,
  p_species text DEFAULT NULL,
  p_breed text DEFAULT NULL,
  p_visit_reason text DEFAULT NULL,
  p_case_type case_type DEFAULT 'checkup',
  p_provider_name text DEFAULT NULL,
  p_pims_data jsonb DEFAULT NULL,
  p_external_patient_id text DEFAULT NULL,
  p_external_client_id text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_client_id uuid;
  v_patient_id uuid;
  v_case_id uuid;
BEGIN
  -- Step 1: Upsert client
  v_client_id := upsert_client(
    p_user_id,
    p_clinic_id,
    p_owner_phone,
    p_owner_name,
    p_owner_email,
    p_external_source,
    p_external_client_id
  );

  -- Step 2: Upsert patient
  v_patient_id := upsert_patient(
    p_user_id,
    p_clinic_id,
    v_client_id,
    p_patient_name,
    p_species,
    p_breed,
    p_external_source,
    p_external_patient_id
  );

  -- Step 3: Create case
  INSERT INTO cases (
    user_id, clinic_id, patient_id, client_id,
    external_source, external_id,
    patient_name, owner_name, owner_phone, provider_name,
    visit_reason, case_type, pims_data
  )
  VALUES (
    p_user_id, p_clinic_id, v_patient_id, v_client_id,
    p_external_source, p_external_id,
    p_patient_name, p_owner_name, p_owner_phone, p_provider_name,
    p_visit_reason, p_case_type, p_pims_data
  )
  RETURNING id INTO v_case_id;

  RETURN v_case_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE ON clinical_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_soap_notes_updated_at BEFORE UPDATE ON soap_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_discharge_summaries_updated_at BEFORE UPDATE ON discharge_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_pims_credentials_updated_at BEFORE UPDATE ON pims_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_discharge_batches_updated_at BEFORE UPDATE ON discharge_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_discharge_batch_items_updated_at BEFORE UPDATE ON discharge_batch_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_slack_workspaces_updated_at BEFORE UPDATE ON slack_workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
--
-- This schema represents the ideal architecture for the ODIS AI platform.
-- Key features:
--
-- 1. PROPER ENTITY HIERARCHY
--    Clinic → User → Client → Patient → Case
--    (Not the backwards Patient-belongs-to-Case)
--
-- 2. PIMS-AGNOSTIC DESIGN
--    - external_source enum supports any PIMS
--    - external_ids JSONB allows multiple PIMS IDs per entity
--    - Normalized fields for indexing, raw pims_data for audit
--
-- 3. UNIFIED TABLES
--    - One `calls` table (not 3 separate tables)
--    - One `clinical_notes` table (not transcriptions + metadata)
--    - One `templates` table (not 3 separate template tables)
--
-- 4. DEDUPLICATION BUILT-IN
--    - Clients: UNIQUE(user_id, phone)
--    - Patients: UNIQUE(client_id, name)
--    - Helper functions handle upsert logic
--
-- 5. COMPREHENSIVE RLS
--    - All tables have RLS enabled
--    - Users see only their own data
--    - Service role bypasses for webhooks/admin
--
-- 6. PERFORMANCE OPTIMIZED
--    - Indexes on all foreign keys
--    - Indexes on common query patterns
--    - Trigram indexes for fuzzy search
--    - Full-text search on content fields
--
-- ============================================================================

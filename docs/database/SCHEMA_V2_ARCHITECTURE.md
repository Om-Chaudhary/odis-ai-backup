# Schema V2 Architecture

Complete schema redesign for ODIS AI. Replaces 63 tables (89 migrations of organic growth) with ~35 normalized, PIMS-agnostic, Clerk-auth tables.

**Auth**: Clerk (primary) with Supabase RLS via Clerk JWT. No Supabase Auth dependency.

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Schema by Tier](#schema-by-tier)
3. [Entity Relationships](#entity-relationships)
4. [Migration Mapping](#migration-mapping)
5. [RLS Policy Patterns](#rls-policy-patterns)
6. [Extensions & Functions](#extensions--functions)
7. [Dev Supabase Setup](#dev-supabase-setup)

---

## Design Principles

1. **Clinic-first multi-tenancy** - Every operational table has `clinic_id NOT NULL`
2. **PIMS-agnostic** - No vendor-specific column names. All PIMS identity via `pims_mappings`
3. **Normalized** - No god tables. Call analysis separated from call metadata
4. **Clerk auth** - RLS policies use Clerk JWT claims (`auth.jwt() ->> 'org_id'`)
5. **Single scheduling system** - Time-range based (`tstzrange`), no slot abstraction
6. **Unified identity** - `clients` + `patients` are the source of truth (no more `canonical_patients`)

---

## Schema by Tier

### Tier 1: Organization & Identity

#### `clinics`

The top-level tenant. Everything flows from here.

```sql
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id TEXT UNIQUE,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  address JSONB,
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  business_hours JSONB,
  er_config JSONB,
  pims_type TEXT NOT NULL DEFAULT 'none',
  -- Branding
  primary_color TEXT DEFAULT '#2563EB',
  logo_url TEXT,
  -- Billing
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_tier TEXT DEFAULT 'none',
  subscription_status TEXT DEFAULT 'none',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**JSONB shapes:**
- `address`: `{ line1, line2, city, state, zip, country }`
- `business_hours`: `{ mon: { open: "08:00", close: "18:00" }, tue: ... }`
- `er_config`: `{ redirect_phone, redirect_message, active }`

#### `users`

Lean user profile. Auth handled entirely by Clerk.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'veterinarian',
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

~10 columns (down from 40 in old schema).

#### `user_clinic_access`

Many-to-many: users belong to clinics with roles.

```sql
CREATE TABLE user_clinic_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  is_primary BOOLEAN DEFAULT false,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, clinic_id)
);
```

Roles: `owner`, `admin`, `member`, `viewer`.

#### `clinic_invitations`

```sql
CREATE TABLE clinic_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token UUID DEFAULT gen_random_uuid(),
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'pending',
  invited_by UUID REFERENCES users(id),
  accepted_by UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (clinic_id, email)
);
```

Status values: `pending`, `accepted`, `expired`.

#### `providers`

Clinic staff/vets tracked for scheduling and case attribution.

```sql
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'veterinarian',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Tier 2: Client & Patient Identity

#### `clients`

Pet owners, scoped to a clinic. Source of truth for contact info.

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT NOT NULL,
  phone TEXT,
  phone_secondary TEXT,
  email TEXT,
  address JSONB,
  preferred_contact_method TEXT DEFAULT 'phone',
  communication_opt_out BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  first_visit_at TIMESTAMPTZ,
  last_visit_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clients_clinic ON clients(clinic_id);
CREATE INDEX idx_clients_phone ON clients(clinic_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_clients_name ON clients(clinic_id, lower(display_name));
```

#### `patients`

Canonical patient records (pets), scoped to a client. Replaces both old `patients` (per-case snapshots) and `canonical_patients`.

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT,
  breed TEXT,
  sex TEXT,
  color TEXT,
  date_of_birth DATE,
  weight_kg NUMERIC,
  microchip_id TEXT,
  is_deceased BOOLEAN DEFAULT false,
  deceased_at TIMESTAMPTZ,
  allergies TEXT[],
  chronic_conditions TEXT[],
  is_active BOOLEAN DEFAULT true,
  first_visit_at TIMESTAMPTZ,
  last_visit_at TIMESTAMPTZ,
  visit_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_patients_unique_per_client ON patients(client_id, lower(name));
CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_species ON patients(clinic_id, species);
```

Per-case patient data lives on `cases.patient_snapshot` JSONB for historical record.

---

### Tier 3: PIMS Integration (Vendor-Agnostic)

#### `pims_credentials`

Unified encrypted credentials for any PIMS system.

```sql
CREATE TABLE pims_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  pims_type TEXT NOT NULL,
  credentials_encrypted JSONB NOT NULL,
  encryption_key_id TEXT DEFAULT 'default',
  is_active BOOLEAN DEFAULT true,
  validation_status TEXT DEFAULT 'unknown',
  last_validated_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (clinic_id, pims_type)
);
```

`pims_type` values: `idexx_neo`, `idexx_avimark`, `idexx_ezyvet`, `none`.

#### `pims_mappings`

Maps internal entities to their external PIMS IDs. The bridge between our schema and any PIMS.

```sql
CREATE TABLE pims_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  pims_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  external_data JSONB DEFAULT '{}',
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (clinic_id, entity_type, entity_id, pims_type)
);

CREATE INDEX idx_pims_mappings_lookup ON pims_mappings(clinic_id, pims_type, external_id);
CREATE INDEX idx_pims_mappings_entity ON pims_mappings(entity_type, entity_id);
```

`entity_type` values: `client`, `patient`, `provider`, `appointment`, `consultation`.

#### `pims_sync_sessions`

Tracks sync operations for any PIMS system.

```sql
CREATE TABLE pims_sync_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES pims_credentials(id),
  pims_type TEXT NOT NULL,
  session_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  metadata JSONB DEFAULT '{}',
  next_scheduled_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pims_sync_clinic ON pims_sync_sessions(clinic_id, started_at DESC);
```

`session_type` values: `consultations`, `appointments`, `schedule`, `full`.

#### `pims_sync_audit_log`

```sql
CREATE TABLE pims_sync_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  sync_session_id UUID REFERENCES pims_sync_sessions(id),
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  status TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Tier 4: Cases & Clinical Data

#### `cases`

The central business entity for outbound discharge workflow.

```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id),
  client_id UUID REFERENCES clients(id),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  -- Case info
  type TEXT,
  status TEXT DEFAULT 'draft',
  visibility TEXT DEFAULT 'private',
  source TEXT DEFAULT 'manual',
  -- Patient snapshot (denormalized for historical accuracy)
  patient_snapshot JSONB,
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  auto_scheduled_at TIMESTAMPTZ,
  scheduling_source TEXT,
  call_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  cadence_source TEXT DEFAULT 'default',
  call_delay_days INTEGER DEFAULT 1,
  email_delay_days INTEGER DEFAULT 1,
  detected_case_type TEXT,
  -- PIMS data
  external_id TEXT,
  -- AI extraction
  entity_extraction JSONB,
  extreme_case_check JSONB,
  is_urgent BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (clinic_id, external_id)
);

CREATE INDEX idx_cases_clinic ON cases(clinic_id);
CREATE INDEX idx_cases_patient ON cases(patient_id);
CREATE INDEX idx_cases_client ON cases(client_id);
CREATE INDEX idx_cases_status ON cases(clinic_id, status);
CREATE INDEX idx_cases_created_at ON cases(clinic_id, created_at DESC);
CREATE INDEX idx_cases_external ON cases(clinic_id, external_id) WHERE external_id IS NOT NULL;
```

**Status values**: `draft`, `ongoing`, `reviewed`, `completed`.
**Source values**: `manual`, `pims_sync`, `import`.
**`patient_snapshot` shape**: `{ name, species, breed, owner_name, owner_phone, owner_email }`.

#### `soap_notes`

```sql
CREATE TABLE soap_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  transcript TEXT,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  client_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `discharge_summaries`

```sql
CREATE TABLE discharge_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  soap_note_id UUID REFERENCES soap_notes(id),
  template_id UUID REFERENCES discharge_templates(id),
  content TEXT,
  structured_content JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `vital_signs`

```sql
CREATE TABLE vital_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  soap_note_id UUID REFERENCES soap_notes(id),
  temperature NUMERIC,
  temperature_unit TEXT DEFAULT 'F',
  pulse INTEGER,
  respiration INTEGER,
  weight NUMERIC,
  weight_unit TEXT DEFAULT 'kg',
  systolic INTEGER,
  diastolic INTEGER,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  measured_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Tier 5: Communications (Unified)

#### `outbound_calls`

Replaces `scheduled_discharge_calls`. ~24 columns (down from 43).

```sql
CREATE TABLE outbound_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  case_id UUID NOT NULL REFERENCES cases(id),
  -- VAPI data
  vapi_call_id TEXT UNIQUE,
  assistant_id TEXT,
  outbound_phone_number_id TEXT,
  customer_phone TEXT,
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  qstash_message_id TEXT,
  -- Call lifecycle
  status TEXT DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  ended_reason TEXT,
  duration_seconds INTEGER,
  cost NUMERIC,
  -- Recordings & transcripts
  recording_url TEXT,
  stereo_recording_url TEXT,
  transcript TEXT,
  transcript_messages JSONB,
  cleaned_transcript TEXT,
  -- Review
  review_category TEXT DEFAULT 'to_review',
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_outbound_calls_clinic ON outbound_calls(clinic_id, created_at DESC);
CREATE INDEX idx_outbound_calls_case ON outbound_calls(case_id);
CREATE INDEX idx_outbound_calls_status ON outbound_calls(status);
CREATE INDEX idx_outbound_calls_vapi ON outbound_calls(vapi_call_id);
```

**Status values**: `queued`, `in-progress`, `ended`, `failed`, `cancelled`.

#### `inbound_calls`

Replaces `inbound_vapi_calls`. ~28 columns (down from 47).

```sql
CREATE TABLE inbound_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  -- VAPI data
  vapi_call_id TEXT UNIQUE NOT NULL,
  assistant_id TEXT,
  phone_number_id TEXT,
  customer_phone TEXT,
  -- Call lifecycle
  type TEXT DEFAULT 'inbound',
  status TEXT DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  ended_reason TEXT,
  duration_seconds INTEGER,
  cost NUMERIC,
  -- Recordings & transcripts
  recording_url TEXT,
  stereo_recording_url TEXT,
  transcript TEXT,
  transcript_messages JSONB,
  cleaned_transcript TEXT,
  display_transcript TEXT,
  use_display_transcript BOOLEAN DEFAULT false,
  -- Outcome
  outcome TEXT,
  actions_taken JSONB,
  action_confirmed BOOLEAN DEFAULT false,
  -- Extracted caller info
  extracted_caller_phone TEXT,
  extracted_caller_name TEXT,
  extracted_pet_name TEXT,
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inbound_calls_clinic ON inbound_calls(clinic_id, created_at DESC);
CREATE INDEX idx_inbound_calls_vapi ON inbound_calls(vapi_call_id);
CREATE INDEX idx_inbound_calls_status ON inbound_calls(status);
CREATE INDEX idx_inbound_calls_outcome ON inbound_calls(outcome);
CREATE INDEX idx_inbound_calls_phone ON inbound_calls(customer_phone);
```

**Outcome values**: `appointment_booked`, `message_taken`, `info_provided`, `transferred`, `no_answer`, etc.

#### `call_analysis`

Extracted from the 5+ JSONB blobs on both call tables. Shared by inbound and outbound via polymorphic FK.

```sql
CREATE TABLE call_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  -- Polymorphic: exactly one must be set
  inbound_call_id UUID REFERENCES inbound_calls(id) ON DELETE CASCADE,
  outbound_call_id UUID REFERENCES outbound_calls(id) ON DELETE CASCADE,
  -- Structured analysis
  call_outcome TEXT,
  call_outcome_details JSONB,
  pet_recovery_status TEXT,
  pet_health_details JSONB,
  medication_compliance TEXT,
  medication_details JSONB,
  owner_sentiment TEXT,
  owner_sentiment_details JSONB,
  escalation_triggered BOOLEAN DEFAULT false,
  escalation_details JSONB,
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_details JSONB,
  -- Attention flags
  attention_types TEXT[] DEFAULT '{}',
  attention_severity TEXT,
  attention_summary TEXT,
  attention_flagged_at TIMESTAMPTZ,
  -- Summary
  summary TEXT,
  success_evaluation TEXT,
  structured_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (num_nonnulls(inbound_call_id, outbound_call_id) = 1)
);

CREATE INDEX idx_call_analysis_inbound ON call_analysis(inbound_call_id) WHERE inbound_call_id IS NOT NULL;
CREATE INDEX idx_call_analysis_outbound ON call_analysis(outbound_call_id) WHERE outbound_call_id IS NOT NULL;
CREATE INDEX idx_call_analysis_severity ON call_analysis(attention_severity) WHERE attention_severity IS NOT NULL;
```

#### `outbound_emails`

Replaces `scheduled_discharge_emails`.

```sql
CREATE TABLE outbound_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  case_id UUID NOT NULL REFERENCES cases(id),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT,
  html_content TEXT,
  text_content TEXT,
  scheduled_for TIMESTAMPTZ,
  status TEXT DEFAULT 'queued',
  sent_at TIMESTAMPTZ,
  resend_email_id TEXT,
  qstash_message_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `clinic_messages`

Voicemails and messages from inbound calls.

```sql
CREATE TABLE clinic_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  inbound_call_id UUID REFERENCES inbound_calls(id),
  caller_name TEXT,
  caller_phone TEXT,
  message_content TEXT,
  message_type TEXT DEFAULT 'voicemail',
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'normal',
  assigned_to_user_id UUID REFERENCES users(id),
  triage_data JSONB,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `refill_requests`

```sql
CREATE TABLE refill_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  inbound_call_id UUID REFERENCES inbound_calls(id),
  client_name TEXT,
  client_phone TEXT,
  pet_name TEXT,
  species TEXT,
  medication_name TEXT NOT NULL,
  medication_strength TEXT,
  last_refill_date DATE,
  pharmacy_preference TEXT DEFAULT 'pickup',
  pharmacy_name TEXT,
  pharmacy_phone TEXT,
  status TEXT DEFAULT 'pending',
  requires_exam BOOLEAN DEFAULT false,
  vet_notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Tier 6: Scheduling (Time-Range Based)

#### `schedule_appointments`

Synced from PIMS. Uses `tstzrange` for proper time handling.

```sql
CREATE TABLE schedule_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  time_range TSTZRANGE NOT NULL,
  date DATE NOT NULL GENERATED ALWAYS AS (date(lower(time_range) AT TIME ZONE 'UTC')) STORED,
  -- Source
  source TEXT DEFAULT 'pims',
  pims_appointment_id TEXT,
  -- Appointment data
  patient_name TEXT,
  client_name TEXT,
  client_phone TEXT,
  provider_name TEXT,
  room_id TEXT,
  appointment_type TEXT,
  status TEXT DEFAULT 'scheduled',
  -- Sync tracking
  sync_hash TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  EXCLUDE USING GIST (clinic_id WITH =, time_range WITH &&) WHERE (deleted_at IS NULL AND room_id IS NOT NULL)
);

CREATE INDEX idx_appointments_clinic_date ON schedule_appointments(clinic_id, date);
CREATE INDEX idx_appointments_time_range ON schedule_appointments USING GIST(clinic_id, time_range);
CREATE UNIQUE INDEX idx_appointments_pims ON schedule_appointments(clinic_id, pims_appointment_id);
```

Requires `btree_gist` extension for the exclusion constraint.

#### `vapi_bookings`

Bookings created by VAPI inbound calls.

```sql
CREATE TABLE vapi_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  inbound_call_id UUID REFERENCES inbound_calls(id),
  time_range TSTZRANGE NOT NULL,
  date DATE NOT NULL GENERATED ALWAYS AS (date(lower(time_range) AT TIME ZONE 'UTC')) STORED,
  -- Client/patient info from caller
  client_name TEXT,
  client_phone TEXT,
  patient_name TEXT,
  species TEXT,
  breed TEXT,
  reason TEXT,
  is_new_client BOOLEAN DEFAULT false,
  -- Booking lifecycle
  status TEXT DEFAULT 'pending',
  confirmation_number TEXT UNIQUE,
  vapi_call_id TEXT,
  hold_expires_at TIMESTAMPTZ,
  has_conflict BOOLEAN DEFAULT false,
  -- PIMS sync
  pims_appointment_id TEXT,
  pims_client_id TEXT,
  pims_patient_id TEXT,
  -- Reschedule tracking
  original_time_range TSTZRANGE,
  rescheduled_at TIMESTAMPTZ,
  rescheduled_reason TEXT,
  rescheduled_from_id UUID REFERENCES vapi_bookings(id),
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bookings_clinic_date ON vapi_bookings(clinic_id, date);
CREATE INDEX idx_bookings_time_range ON vapi_bookings USING GIST(clinic_id, time_range);
CREATE INDEX idx_bookings_status ON vapi_bookings(status);
CREATE INDEX idx_bookings_vapi_call ON vapi_bookings(vapi_call_id);
CREATE INDEX idx_bookings_confirmation ON vapi_bookings(confirmation_number) WHERE confirmation_number IS NOT NULL;
```

#### `clinic_schedule_config`

```sql
CREATE TABLE clinic_schedule_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) UNIQUE,
  daily_hours JSONB,
  slot_duration_minutes INTEGER DEFAULT 15,
  sync_horizon_days INTEGER DEFAULT 14,
  stale_threshold_minutes INTEGER DEFAULT 60,
  sync_schedules JSONB DEFAULT '[]',
  vapi_availability_start_time TIME,
  vapi_availability_end_time TIME,
  target_room_id TEXT,
  target_room_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `clinic_blocked_periods`

```sql
CREATE TABLE clinic_blocked_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `schedule_syncs`

```sql
CREATE TABLE schedule_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  sync_type TEXT DEFAULT 'appointments',
  sync_start_date DATE,
  sync_end_date DATE,
  status TEXT DEFAULT 'in_progress',
  appointments_added INTEGER DEFAULT 0,
  appointments_updated INTEGER DEFAULT 0,
  appointments_removed INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `appointment_audit_log`

```sql
CREATE TABLE appointment_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  action TEXT NOT NULL,
  booking_id UUID REFERENCES vapi_bookings(id),
  appointment_id UUID REFERENCES schedule_appointments(id),
  pims_appointment_id TEXT,
  old_time_range TSTZRANGE,
  new_time_range TSTZRANGE,
  reason TEXT,
  error_code TEXT,
  error_message TEXT,
  vapi_call_id TEXT,
  performed_by TEXT DEFAULT 'vapi',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Tier 7: VAPI Configuration

#### `vapi_assistant_mappings`

Maps VAPI assistants to clinics and environments.

```sql
CREATE TABLE vapi_assistant_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  assistant_id TEXT NOT NULL UNIQUE,
  assistant_name TEXT,
  assistant_type TEXT DEFAULT 'inbound',
  environment TEXT DEFAULT 'production',
  pims_clinic_id UUID REFERENCES clinics(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Tier 8: Clinic Settings & Config

#### `clinic_settings`

All clinic configuration that was scattered across `users` and other tables.

```sql
CREATE TABLE clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) UNIQUE,
  -- Discharge call settings
  voicemail_detection_enabled BOOLEAN DEFAULT false,
  voicemail_hangup_on_detection BOOLEAN DEFAULT false,
  voicemail_message TEXT,
  max_call_retries INTEGER DEFAULT 3,
  -- Scheduling preferences
  preferred_email_start_time TIME DEFAULT '10:00',
  preferred_email_end_time TIME DEFAULT '12:00',
  preferred_call_start_time TIME DEFAULT '16:00',
  preferred_call_end_time TIME DEFAULT '19:00',
  email_delay_days INTEGER DEFAULT 1,
  call_delay_days INTEGER DEFAULT 2,
  -- Batch settings
  batch_include_pims_notes BOOLEAN DEFAULT true,
  batch_include_manual_transcriptions BOOLEAN DEFAULT true,
  -- Emergency
  emergency_phone TEXT,
  -- Email branding
  email_header_text TEXT,
  email_footer_text TEXT,
  -- Test mode
  test_mode_enabled BOOLEAN DEFAULT false,
  test_contact_name TEXT,
  test_contact_email TEXT,
  test_contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `auto_scheduling_config`

```sql
CREATE TABLE auto_scheduling_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  auto_email_enabled BOOLEAN DEFAULT true,
  auto_call_enabled BOOLEAN DEFAULT true,
  email_delay_days INTEGER DEFAULT 1,
  call_delay_days INTEGER DEFAULT 3,
  preferred_email_time TIME DEFAULT '10:00',
  preferred_call_time TIME DEFAULT '16:00',
  scheduling_criteria JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `clinic_case_type_cadence`

```sql
CREATE TABLE clinic_case_type_cadence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  case_type TEXT NOT NULL,
  auto_schedule_call BOOLEAN DEFAULT true,
  auto_schedule_email BOOLEAN DEFAULT true,
  call_delay_days INTEGER DEFAULT 1,
  email_delay_days INTEGER DEFAULT 1,
  preferred_call_time TIME DEFAULT '10:00',
  preferred_email_time TIME DEFAULT '09:00',
  never_auto_schedule BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (clinic_id, case_type)
);
```

---

### Tier 9: Auto-Scheduling

```sql
CREATE TABLE auto_scheduling_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running',
  results JSONB DEFAULT '[]',
  total_cases_processed INTEGER DEFAULT 0,
  total_emails_scheduled INTEGER DEFAULT 0,
  total_calls_scheduled INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE auto_scheduled_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  run_id UUID REFERENCES auto_scheduling_runs(id),
  outbound_email_id UUID REFERENCES outbound_emails(id),
  outbound_call_id UUID REFERENCES outbound_calls(id),
  status TEXT DEFAULT 'scheduled',
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  scheduled_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Tier 10: Discharge Batches

```sql
CREATE TABLE discharge_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  created_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  total_cases INTEGER DEFAULT 0,
  processed_cases INTEGER DEFAULT 0,
  successful_cases INTEGER DEFAULT 0,
  failed_cases INTEGER DEFAULT 0,
  email_schedule_time TIMESTAMPTZ,
  call_schedule_time TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  error_summary JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE discharge_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES discharge_batches(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id),
  patient_id UUID REFERENCES patients(id),
  status TEXT DEFAULT 'pending',
  email_scheduled BOOLEAN DEFAULT false,
  call_scheduled BOOLEAN DEFAULT false,
  outbound_email_id UUID REFERENCES outbound_emails(id),
  outbound_call_id UUID REFERENCES outbound_calls(id),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Tier 11: Templates

```sql
CREATE TABLE soap_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  created_by UUID REFERENCES users(id),
  template_name TEXT NOT NULL,
  display_name TEXT,
  icon_name TEXT,
  subjective_template TEXT,
  objective_template TEXT,
  assessment_template TEXT,
  plan_template TEXT,
  client_instructions_template TEXT,
  subjective_prompt TEXT,
  objective_prompt TEXT,
  assessment_prompt TEXT,
  plan_prompt TEXT,
  client_instructions_prompt TEXT,
  system_prompt_addition TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE discharge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  created_by UUID REFERENCES users(id),
  name TEXT NOT NULL,
  content TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  key TEXT,
  content TEXT,
  prompt TEXT,
  model TEXT,
  description TEXT,
  output_format TEXT DEFAULT 'json',
  validation_schema JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

`clinic_id` is nullable on templates - NULL means global/system template.

---

### Tier 12: Slack Integration

```sql
CREATE TABLE slack_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  team_id TEXT UNIQUE NOT NULL,
  team_name TEXT,
  bot_token TEXT,
  bot_user_id TEXT,
  scope TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE slack_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES slack_workspaces(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workspace_id, channel_id)
);

CREATE TABLE slack_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES slack_channels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE slack_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES slack_tasks(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed_by_username TEXT,
  completed_at TIMESTAMPTZ DEFAULT now(),
  message_ts TEXT,
  UNIQUE (task_id, completion_date)
);
```

---

### Tier 13: Marketing / Public (No clinic_id)

```sql
CREATE TABLE waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  source TEXT,
  campaign TEXT DEFAULT 'default',
  status TEXT DEFAULT 'waiting',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (email, campaign)
);

CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  clinic_name TEXT,
  phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'contact_page',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Entity Relationships

### Core Hierarchy

```
clinics (tenant root)
  |
  +-- users (via user_clinic_access M:M)
  +-- clinic_invitations
  +-- providers
  +-- clients
  |     +-- patients
  +-- cases
  |     +-- soap_notes
  |     |     +-- vital_signs
  |     +-- discharge_summaries
  |     +-- outbound_calls --> call_analysis
  |     +-- outbound_emails
  +-- inbound_calls --> call_analysis
  |     +-- clinic_messages
  |     +-- refill_requests
  |     +-- vapi_bookings
  +-- schedule_appointments
  +-- clinic_settings (1:1)
  +-- clinic_schedule_config (1:1)
  +-- clinic_blocked_periods
  +-- auto_scheduling_config (1:1)
  +-- clinic_case_type_cadence
  +-- pims_credentials
  +-- pims_mappings
  +-- pims_sync_sessions --> pims_sync_audit_log
  +-- vapi_assistant_mappings
  +-- slack_workspaces --> slack_channels --> slack_tasks --> slack_task_completions
  +-- discharge_batches --> discharge_batch_items
  +-- auto_scheduling_runs --> auto_scheduled_items
```

### Key Relationships

| Relationship | Type | Description |
|---|---|---|
| `clinics` -> `users` | M:M via `user_clinic_access` | Multi-clinic support |
| `clients` -> `patients` | 1:M | Owner -> pets |
| `cases` -> `patients` | M:1 | Case references canonical patient |
| `cases` -> `clients` | M:1 | Case references canonical client |
| `cases` -> `outbound_calls` | 1:M | Multiple call attempts per case |
| `cases` -> `outbound_emails` | 1:M | Multiple emails per case |
| `inbound_calls` -> `call_analysis` | 1:1 | Polymorphic via `inbound_call_id` |
| `outbound_calls` -> `call_analysis` | 1:1 | Polymorphic via `outbound_call_id` |
| `inbound_calls` -> `vapi_bookings` | 1:M | Call may create bookings |
| `inbound_calls` -> `clinic_messages` | 1:M | Call may leave messages |
| Entities -> `pims_mappings` | Polymorphic | Any entity can map to a PIMS external ID |

---

## Migration Mapping

### Old Table -> New Table

| Old Table | New Table | Notes |
|---|---|---|
| `clinics` | `clinics` | Slimmed (removed VAPI IDs, redundant config) |
| `users` | `users` | 40 cols -> 10 cols; settings moved to `clinic_settings` |
| `users` (clinic fields) | `user_clinic_access` | New M:M junction |
| `clinic_invitations` | `clinic_invitations` | Minimal changes |
| `patients` (per-case) | `cases.patient_snapshot` | Historical data as JSONB |
| `canonical_patients` | `patients` | Patients IS canonical now |
| `cases` | `cases` | Cleaned up, added `patient_id`/`client_id` FKs |
| `soap_notes` | `soap_notes` | Same structure |
| `vital_signs` | `vital_signs` | Same structure |
| `discharge_summaries` | `discharge_summaries` | Simplified |
| `scheduled_discharge_calls` | `outbound_calls` | 43 cols -> 24 cols; analysis moved out |
| `inbound_vapi_calls` | `inbound_calls` | 47 cols -> 28 cols; analysis moved out |
| Call analysis JSONB blobs | `call_analysis` | Separate normalized table |
| `scheduled_discharge_emails` | `outbound_emails` | Renamed |
| `clinic_messages` | `clinic_messages` | Minimal changes |
| `refill_requests` | `refill_requests` | Same structure |
| `schedule_appointments_v2` | `schedule_appointments` | Renamed, is now the only version |
| `vapi_bookings_v2` | `vapi_bookings` | Renamed, is now the only version |
| `clinic_schedule_config` | `clinic_schedule_config` | Same structure |
| `clinic_blocked_periods` | `clinic_blocked_periods` | Same structure |
| `schedule_syncs` | `schedule_syncs` | Same structure |
| `appointment_audit_log` | `appointment_audit_log` | Same structure |
| `clinic_assistants` | `vapi_assistant_mappings` | Renamed, simplified |
| `idexx_credentials` | `pims_credentials` | Vendor-agnostic |
| `weave_credentials` | `pims_credentials` | Vendor-agnostic |
| `idexx_sync_sessions` | `pims_sync_sessions` | Vendor-agnostic |
| `idexx_sync_audit_log` | `pims_sync_audit_log` | Vendor-agnostic |
| `case_sync_audits` | `pims_sync_audit_log` | Merged |
| `consultation_sync_status` | `pims_sync_audit_log` | Merged |
| `temp_soap_templates` | `soap_templates` | Renamed |
| `temp_discharge_summary_templates` | `discharge_templates` | Renamed |
| `templates` | `ai_templates` | Renamed |
| `auto_scheduling_config` | `auto_scheduling_config` | Same structure |
| `auto_scheduling_runs` | `auto_scheduling_runs` | Same structure |
| `auto_scheduled_items` | `auto_scheduled_items` | Same structure |
| `discharge_batches` | `discharge_batches` | Same structure |
| `discharge_batch_items` | `discharge_batch_items` | Same structure |
| `slack_workspaces` | `slack_workspaces` | Same + `clinic_id` FK |
| `slack_channels` | `slack_channels` | Same structure |
| `slack_tasks` | `slack_tasks` | Same structure |
| `slack_task_completions` | `slack_task_completions` | Same structure |
| `waitlist_signups` | `waitlist_signups` | Same structure |
| `contact_submissions` | `contact_submissions` | Same structure |

### Tables Removed (Not Recreated)

| Old Table | Reason |
|---|---|
| `retell_calls` | Legacy call provider, replaced by VAPI |
| `call_patients` | Legacy for retell |
| `clinic_assistants` | Replaced by `vapi_assistant_mappings` |
| `slack_installations` | Duplicate of `slack_workspaces` |
| `schedule_slots` | v1 slot-based scheduling, replaced by time-range |
| `schedule_appointments` (v1) | Replaced by time-range v2 |
| `vapi_bookings` (v1) | Replaced by time-range v2 |
| `canonical_patients` | Merged into `patients` |
| `user_events` | Superseded by PostHog/Axiom |
| `feature_usage` | Superseded by PostHog |
| `session_analytics` | Superseded by PostHog |
| `error_logs` | Superseded by Sentry |
| `audio_files` | Never used (0 rows) |
| `generations` | Rolled into `discharge_summaries` |
| `transcriptions` | Rolled into `soap_notes` |
| `temp_soap_templates` | Renamed to `soap_templates` |
| `temp_discharge_summary_templates` | Renamed to `discharge_templates` |
| `templates` | Renamed to `ai_templates` |
| `idexx_credentials` | Replaced by `pims_credentials` |
| `weave_credentials` | Replaced by `pims_credentials` |
| `idexx_sync_sessions` | Replaced by `pims_sync_sessions` |
| `idexx_sync_audit_log` | Replaced by `pims_sync_audit_log` |
| `consultation_sync_status` | Rolled into `pims_sync_audit_log` |
| `case_sync_audits` | Rolled into `pims_sync_audit_log` |
| `clinic_api_keys` | Defer until needed |

### Final Count: ~35 tables (down from 63)

---

## RLS Policy Patterns

All RLS policies use Clerk JWT claims. The Clerk org ID is stored in `clinics.clerk_org_id` and available via `auth.jwt() ->> 'org_id'`.

### Helper Function

```sql
CREATE OR REPLACE FUNCTION get_user_clinic_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT clinic_id
  FROM user_clinic_access uca
  JOIN users u ON u.id = uca.user_id
  WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
$$;
```

### Standard Clinic-Scoped Policy

Applied to most tables with `clinic_id`:

```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clinic data"
  ON <table_name> FOR SELECT
  USING (clinic_id IN (SELECT get_user_clinic_ids()));

CREATE POLICY "Users can insert into their clinic"
  ON <table_name> FOR INSERT
  WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids()));

CREATE POLICY "Users can update their clinic data"
  ON <table_name> FOR UPDATE
  USING (clinic_id IN (SELECT get_user_clinic_ids()));

CREATE POLICY "Users can delete their clinic data"
  ON <table_name> FOR DELETE
  USING (clinic_id IN (SELECT get_user_clinic_ids()));
```

### Org-Based Policy (Alternative)

For tables where Clerk org_id maps directly to clinic:

```sql
CREATE POLICY "Org members can view"
  ON <table_name> FOR SELECT
  USING (
    clinic_id = (
      SELECT id FROM clinics
      WHERE clerk_org_id = auth.jwt() ->> 'org_id'
    )
  );
```

### User-Scoped Policy

For `users` table:

```sql
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');
```

### Public Tables (No RLS)

Tables without `clinic_id` that are public:
- `waitlist_signups` - INSERT only from anon
- `contact_submissions` - INSERT only from anon
- `ai_templates` - SELECT only (global templates)

### Service Role Bypass

The service role key (`createServiceClient()`) bypasses RLS entirely. Used for:
- Webhook handlers (VAPI, QStash, Clerk)
- Background jobs (auto-scheduling, sync)
- Admin operations

---

## Extensions & Functions

### Required Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";  -- for EXCLUDE USING GIST on schedule_appointments
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- for fuzzy text search on client/patient names
```

### Utility Functions

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
-- Example:
-- CREATE TRIGGER set_updated_at BEFORE UPDATE ON clinics
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

Tables needing `updated_at` trigger: `clinics`, `users`, `clients`, `patients`, `cases`, `soap_notes`, `discharge_summaries`, `vital_signs`, `outbound_calls`, `inbound_calls`, `outbound_emails`, `clinic_messages`, `refill_requests`, `schedule_appointments`, `vapi_bookings`, `clinic_schedule_config`, `clinic_settings`, `auto_scheduling_config`, `clinic_case_type_cadence`, `pims_credentials`, `pims_mappings`, `pims_sync_sessions`, `vapi_assistant_mappings`, `providers`, `discharge_batches`, `slack_workspaces`, `slack_channels`, `slack_tasks`, `soap_templates`, `discharge_templates`, `ai_templates`.

---

## Dev Supabase Setup

### Prerequisites

- Supabase CLI installed (`brew install supabase/tap/supabase`)
- Access to the `odis-ai-dev` Supabase project

### Steps

1. **Link to dev project**:
   ```bash
   supabase link --project-ref <dev-project-ref>
   ```

2. **Reset database** (applies all migrations + seed):
   ```bash
   supabase db reset
   ```

3. **Regenerate types**:
   ```bash
   pnpm update-types
   ```

4. **Verify in Supabase Studio**: Open the linked project in the Supabase dashboard and confirm tables are created with seed data.

### Migration Workflow

1. Create a new migration:
   ```bash
   supabase migration new <descriptive_name>
   ```

2. Write SQL in the generated file under `supabase/migrations/`

3. Test locally:
   ```bash
   supabase db reset
   ```

4. Regenerate types:
   ```bash
   pnpm update-types
   ```

5. Open a PR with the migration + updated types

### Environment Variables

All env vars needed are documented in `.env.example`. Key ones for dev:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Dev project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dev project anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev project service role key |
| `CLERK_SECRET_KEY` | Clerk secret (dev instance) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (dev) |

### CI Validation

The CI pipeline validates that migrations apply cleanly:

```yaml
db-validate:
  runs-on: ubuntu-latest
  steps:
    - uses: supabase/setup-cli@v1
    - run: supabase start
    - run: supabase db reset
    - run: supabase db lint
```

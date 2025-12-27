# ODIS AI Database Schema Analysis & Redesign Plan

## Executive Summary

This document presents a comprehensive analysis of the ODIS AI database schema across three consuming applications (iOS Scribe, Chrome Extension, Web App) and provides a backwards-compatible migration strategy for improving data integrity, normalization, and performance.

---

## Part 1: Current State Analysis

### 1.1 Data Ingestion Points

#### iOS Scribe App

**Primary Tables Written:**

- `cases` - Case container (draft → ongoing → completed)
- `patients` - Patient demographics (linked to case)
- `transcriptions` - Audio transcriptions with speaker segments
- `soap_notes` - SOAP medical documentation (the "Scribe" feature)
- `discharge_summaries` - AI-generated discharge summaries
- `audio_files` - Audio file metadata

**Data Flow:**

```
Audio Recording → Deepgram Transcription → SOAP Generation (Edge Function) → Supabase
```

**Key Characteristics:**

- Uses Supabase Swift SDK directly
- Creates cases first, then links patients
- Speaker diarization stored as JSONB array in `transcriptions.speaker_segments`
- SOAP notes generated via edge function `generate-soap-notes-v2`

#### Chrome Extension (IDEXX Neo)

**Primary Tables Written:**

- `cases` - Via `/api/cases/ingest` endpoint
- `patients` - Created during case ingestion
- `appointments` - Future appointment sync
- `appointment_requests` - Inbound call outputs
- `clinic_messages` - Inbound call messages

**Data Flow:**

```
IDEXX DOM/API → Transform → /api/cases/ingest → CasesService → Supabase
```

**Key Characteristics:**

- Extracts data from IDEXX Neo (DOM scraping + API calls)
- Stores raw IDEXX data in `cases.metadata.idexx`
- Uses `external_id` for deduplication (`idexx-appt-{appointmentId}`)
- Consultation notes passed to AI for entity extraction

#### Web App API

**Primary Operations:**

- tRPC procedures for CRUD operations
- Server Actions for auth and user management
- Webhook handlers for VAPI/QStash callbacks
- Domain services (CasesService, DischargeOrchestrator)

---

### 1.2 Current Schema Overview (43 Tables)

#### Core Clinical Tables

| Table                 | Rows  | Purpose                    |
| --------------------- | ----- | -------------------------- |
| `cases`               | 1,979 | Case/appointment container |
| `patients`            | 1,946 | Patient demographics       |
| `soap_notes`          | 950   | SOAP medical notes         |
| `discharge_summaries` | 1,669 | AI discharge summaries     |
| `transcriptions`      | 1,111 | Audio transcriptions       |
| `audio_files`         | 0     | Audio file metadata        |
| `generations`         | 0     | Generic AI generations     |
| `vital_signs`         | 0     | Patient vital signs        |

#### Communication Tables

| Table                        | Rows | Purpose                  |
| ---------------------------- | ---- | ------------------------ |
| `scheduled_discharge_calls`  | 552  | Outbound VAPI calls      |
| `scheduled_discharge_emails` | 532  | Outbound Resend emails   |
| `inbound_vapi_calls`         | 42   | Inbound call records     |
| `retell_calls`               | 37   | Legacy Retell calls      |
| `call_patients`              | 0    | Legacy call patient data |

#### Clinic/Scheduling Tables

| Table                  | Rows | Purpose                      |
| ---------------------- | ---- | ---------------------------- |
| `clinics`              | 2    | Clinic profiles              |
| `providers`            | 4    | Clinic providers             |
| `appointments`         | 3    | Future appointments          |
| `appointment_requests` | 9    | Inbound appointment requests |
| `clinic_messages`      | 5    | Inbound messages             |
| `schedule_syncs`       | 7    | Sync session tracking        |
| `clinic_assistants`    | 0    | VAPI assistant mapping       |

#### User/Auth Tables

| Table                       | Rows | Purpose          |
| --------------------------- | ---- | ---------------- |
| `users`                     | 29   | User profiles    |
| `case_shares`               | 1    | Case sharing     |
| `soap_template_shares`      | 4    | Template sharing |
| `discharge_template_shares` | 0    | Template sharing |

#### Template Tables

| Table                              | Rows | Purpose             |
| ---------------------------------- | ---- | ------------------- |
| `temp_soap_templates`              | 46   | SOAP templates      |
| `temp_discharge_summary_templates` | 30   | Discharge templates |
| `templates`                        | 1    | Generic templates   |

#### Analytics Tables

| Table               | Rows | Purpose                |
| ------------------- | ---- | ---------------------- |
| `user_events`       | 77   | User activity events   |
| `feature_usage`     | 0    | Feature usage tracking |
| `session_analytics` | 412  | Session data           |
| `error_logs`        | 0    | Error tracking         |

#### IDEXX Sync Tables

| Table                      | Rows | Purpose                  |
| -------------------------- | ---- | ------------------------ |
| `idexx_credentials`        | 2    | Encrypted credentials    |
| `idexx_sync_sessions`      | 5    | Sync sessions            |
| `consultation_sync_status` | 0    | Consultation sync status |
| `idexx_sync_audit_log`     | 0    | Audit log                |

#### Other Tables

| Table                     | Rows | Purpose              |
| ------------------------- | ---- | -------------------- |
| `discharge_batches`       | 1    | Batch discharge jobs |
| `discharge_batch_items`   | 4    | Batch job items      |
| `slack_workspaces`        | 1    | Slack integration    |
| `slack_reminder_channels` | 1    | Slack channels       |
| `slack_tasks`             | 1    | Slack tasks          |
| `slack_task_completions`  | 0    | Task completions     |
| `waitlist_signups`        | 3    | Marketing waitlist   |
| `contact_submissions`     | 0    | Contact form         |

---

### 1.3 Identified Schema Issues

#### Issue 1: Dual Clinic Identification System

**Problem:** Two competing patterns for clinic identification:

- `users.clinic_name` (text field) - Used by iOS app, RLS policies
- `clinics.id` (UUID) - Used by scheduling system, IDEXX sync

**Impact:**

- Inconsistent foreign key relationships
- Complex RLS policies mixing text and UUID lookups
- No referential integrity between users and clinics

**Current State:**

```sql
-- Users table has text clinic_name
users.clinic_name = 'Alum Rock Animal Hospital'

-- Clinics table has UUID id
clinics.id = 'abc-123-def'
clinics.name = 'Alum Rock Animal Hospital'

-- Inbound calls use text matching
inbound_vapi_calls.clinic_name = 'Alum Rock Animal Hospital'

-- Appointments use UUID
appointments.clinic_id = 'abc-123-def'
```

---

#### Issue 2: Owner/Client Data Duplication

**Problem:** Client/owner information is stored in multiple places with no normalization:

**Location 1: `patients` table**

```sql
patients.owner_name
patients.owner_phone
patients.owner_email
```

**Location 2: `cases.metadata` JSONB**

```json
{
  "idexx": {
    "client_name": "...",
    "client_phone": "...",
    "client_email": "..."
  }
}
```

**Location 3: `appointment_requests` table**

```sql
appointment_requests.client_name
appointment_requests.client_phone
```

**Location 4: `clinic_messages` table**

```sql
clinic_messages.caller_name
clinic_messages.caller_phone
```

**Impact:**

- Data inconsistency across records
- No single source of truth for client contact info
- Difficult to implement "call history by phone number" features
- Duplicate clients created for same person

---

#### Issue 3: Metadata JSONB Sprawl

**Problem:** Critical business data stored in untyped JSONB columns:

**`cases.metadata`** contains:

- `entity_extraction` - Extracted clinical entities
- `discharge_summary` - Generated summary
- `ai_generated_call_intelligence` - Call planning data
- `raw_idexx_data` - Original IDEXX payload
- `transcription_text` - Raw transcription
- `source` - Data source identifier

**`cases.entity_extraction`** (separate column) contains:

- Duplicate of metadata.entity_extraction

**`scheduled_discharge_calls.metadata`** contains:

- `retry_count`, `max_retries` - Retry tracking
- `timezone` - Call timezone
- `case_id` - Redundant with column
- `discharge_summary_id` - Should be FK
- `entity_extraction` - Duplicate data
- `ai_call_intelligence` - Call planning

**`inbound_vapi_calls.structured_data`** contains:

- `appointment_requests` - Array of requests
- `clinic_messages` - Array of messages

**Impact:**

- No schema validation at database level
- Type safety only at application level
- Schema evolution requires data migrations
- Difficult to query/index nested data
- Data duplication across JSONB and columns

---

#### Issue 4: Status Enum Fragmentation

**Problem:** Different status enums for similar concepts:

**`cases.status`:**

```sql
'draft', 'ongoing', 'completed', 'reviewed'
```

**`scheduled_discharge_calls.status`:**

```sql
'queued', 'scheduled', 'ringing', 'in_progress', 'completed', 'failed', 'cancelled', 'no_answer'
```

**`scheduled_discharge_emails.status`:**

```sql
'queued', 'sent', 'failed', 'cancelled'
```

**`inbound_vapi_calls.status`:**

```sql
'queued', 'ringing', 'in_progress', 'completed', 'failed', 'ended'
```

**`appointment_requests.status`:**

```sql
'pending', 'confirmed', 'cancelled', 'completed'
```

**Impact:**

- Inconsistent status values across similar entities
- No central enum definitions
- Difficult to build unified status dashboards

---

#### Issue 5: Optional Foreign Keys

**Problem:** Critical relationships are nullable:

```sql
-- Case can be orphaned from scheduled communications
scheduled_discharge_calls.case_id -- NULLABLE
scheduled_discharge_emails.case_id -- NULLABLE

-- Patient may not have a case
patients.case_id -- NULLABLE (but used as 1:1)
```

**Impact:**

- Orphaned records possible
- Complex null handling in queries
- Cascade deletes may not clean up properly

---

#### Issue 6: Template System Fragmentation

**Problem:** Three separate template systems:

1. `temp_soap_templates` - SOAP note templates (46 rows)
2. `temp_discharge_summary_templates` - Discharge templates (30 rows)
3. `templates` - Generic templates (1 row)

**Impact:**

- Code duplication for template management
- Different sharing mechanisms
- "temp\_" prefix suggests these were meant to be temporary

---

#### Issue 7: Transcription Source Inconsistency

**Problem:** Transcription data comes from two sources with different structures:

**iOS App:**

```sql
transcriptions.transcript = "Full transcription text"
transcriptions.speaker_segments = [{"speaker": 0, "text": "...", "start": 0.0}]
```

**IDEXX Extension:**

```sql
cases.metadata.consultation_notes = "Clinical notes from IDEXX"
-- No transcription record created
```

**Impact:**

- Inconsistent data model between sources
- Can't build unified transcription search
- IDEXX data not queryable via transcriptions table

---

#### Issue 8: Missing Indexes for Common Queries

**Problem:** Some frequent query patterns lack indexes:

**Missing indexes identified:**

- `cases.external_id` - Used for IDEXX deduplication
- `patients.owner_phone` - Used for client lookup
- `cases.source` - Used for filtering by data source
- Composite indexes for time-range queries

---

#### Issue 9: No Audit Trail for Clinical Data

**Problem:** No `created_by`/`updated_by` tracking on clinical tables:

```sql
-- Cases, patients, soap_notes have:
created_at, updated_at

-- But NOT:
created_by, updated_by, version
```

**Impact:**

- Cannot track who modified clinical records
- No optimistic locking for concurrent edits
- Compliance concerns for veterinary record-keeping

---

#### Issue 10: Call Recording Storage

**Problem:** Recording URLs stored inconsistently:

**Outbound calls:**

```sql
scheduled_discharge_calls.recording_url -- Single URL
```

**Inbound calls:**

```sql
inbound_vapi_calls.recording_url -- Mono recording
inbound_vapi_calls.stereo_recording_url -- Stereo recording
```

**Impact:**

- Inconsistent schema between call types
- No metadata about recording (duration, format, size)

---

## Part 2: Schema Redesign Recommendations

### 2.1 Priority 1: Normalize Client/Owner Data

**Create new `clients` table:**

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,

  -- Identity
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
  ) STORED,

  -- Contact (normalized)
  primary_phone TEXT, -- E.164 format
  secondary_phone TEXT,
  email TEXT,

  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',

  -- PIMS Integration
  external_id TEXT, -- IDEXX client ID
  source TEXT, -- 'idexx_neo', 'manual', 'ios_scribe'

  -- Preferences
  preferred_contact_method TEXT, -- 'phone', 'email', 'sms'
  preferred_contact_time TEXT, -- 'morning', 'afternoon', 'evening'
  language TEXT DEFAULT 'en',

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Deduplication
  UNIQUE(clinic_id, primary_phone),
  UNIQUE(clinic_id, external_id) WHERE external_id IS NOT NULL
);

CREATE INDEX idx_clients_clinic_id ON clients(clinic_id);
CREATE INDEX idx_clients_primary_phone ON clients(primary_phone);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_external_id ON clients(external_id);
CREATE INDEX idx_clients_full_name_trgm ON clients USING gin(full_name gin_trgm_ops);
```

**Migration Strategy:**

1. Create `clients` table
2. Add `client_id` column to `patients` (nullable initially)
3. Run migration script to deduplicate and create client records
4. Populate `patients.client_id` with references
5. Deprecate `patients.owner_*` columns (keep for backwards compatibility)
6. Update application code to use `clients` table
7. Add NOT NULL constraint to `patients.client_id` after migration

---

### 2.2 Priority 2: Unify Clinic Identification

**Add `clinic_id` to users table:**

```sql
-- Add column
ALTER TABLE users ADD COLUMN clinic_id UUID REFERENCES clinics(id);

-- Create index
CREATE INDEX idx_users_clinic_id ON users(clinic_id);

-- Migration: Link existing users to clinics by name
UPDATE users u
SET clinic_id = c.id
FROM clinics c
WHERE u.clinic_name = c.name;

-- For users without matching clinic, create clinic record
INSERT INTO clinics (name)
SELECT DISTINCT clinic_name
FROM users
WHERE clinic_name IS NOT NULL
  AND clinic_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM clinics WHERE name = users.clinic_name);

-- Re-run the link
UPDATE users u
SET clinic_id = c.id
FROM clinics c
WHERE u.clinic_name = c.name AND u.clinic_id IS NULL;
```

**Update inbound_vapi_calls:**

```sql
-- Add clinic_id column
ALTER TABLE inbound_vapi_calls ADD COLUMN clinic_id UUID REFERENCES clinics(id);

-- Migrate existing data
UPDATE inbound_vapi_calls i
SET clinic_id = c.id
FROM clinics c
WHERE i.clinic_name = c.name;

-- Keep clinic_name for backwards compatibility during transition
```

---

### 2.3 Priority 3: Extract JSONB Data to Columns

**Cases table - promote critical metadata:**

```sql
-- Add new columns for frequently accessed data
ALTER TABLE cases ADD COLUMN discharge_summary_text TEXT;
ALTER TABLE cases ADD COLUMN discharge_summary_structured JSONB;
ALTER TABLE cases ADD COLUMN call_intelligence JSONB;
ALTER TABLE cases ADD COLUMN source_data JSONB; -- Raw source data (IDEXX, etc.)

-- Add indexes
CREATE INDEX idx_cases_external_id ON cases(external_id);
CREATE INDEX idx_cases_source ON cases(source);
CREATE INDEX idx_cases_entity_extraction ON cases USING gin(entity_extraction);

-- Migration: Extract from metadata
UPDATE cases
SET
  discharge_summary_text = metadata->'discharge_summary'->>'content',
  discharge_summary_structured = metadata->'discharge_summary'->'structured',
  call_intelligence = metadata->'ai_generated_call_intelligence',
  source_data = metadata->'raw_idexx_data'
WHERE metadata IS NOT NULL;
```

**Scheduled discharge calls - extract retry tracking:**

```sql
ALTER TABLE scheduled_discharge_calls ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE scheduled_discharge_calls ADD COLUMN max_retries INTEGER DEFAULT 3;
ALTER TABLE scheduled_discharge_calls ADD COLUMN timezone TEXT DEFAULT 'America/Los_Angeles';
ALTER TABLE scheduled_discharge_calls ADD COLUMN discharge_summary_id UUID REFERENCES discharge_summaries(id);

-- Migration
UPDATE scheduled_discharge_calls
SET
  retry_count = COALESCE((metadata->>'retry_count')::int, 0),
  max_retries = COALESCE((metadata->>'max_retries')::int, 3),
  timezone = COALESCE(metadata->>'timezone', 'America/Los_Angeles')
WHERE metadata IS NOT NULL;
```

---

### 2.4 Priority 4: Consolidate Template System

**Create unified templates table:**

```sql
CREATE TABLE unified_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,

  -- Template identity
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'soap', 'discharge', 'email', 'sms'

  -- Content
  content TEXT, -- For simple templates
  structured_content JSONB, -- For complex templates with sections

  -- SOAP-specific (nullable for other types)
  subjective_template TEXT,
  objective_template TEXT,
  assessment_prompt TEXT,
  plan_prompt TEXT,
  client_instructions_prompt TEXT,
  system_prompt_addition TEXT,

  -- Settings
  is_default BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE, -- System-provided templates

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, name, type)
);

-- Sharing table
CREATE TABLE template_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES unified_templates(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shared_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  permissions TEXT DEFAULT 'read', -- 'read', 'write', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(template_id, shared_with_user_id)
);
```

---

### 2.5 Priority 5: Create Unified Call Model

**Create base `calls` table for all call types:**

```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  provider TEXT NOT NULL, -- 'vapi', 'retell', 'twilio'

  -- External references
  external_call_id TEXT UNIQUE, -- Provider's call ID
  assistant_id TEXT,
  phone_number_id TEXT,

  -- Participants
  clinic_id UUID REFERENCES clinics(id),
  user_id UUID REFERENCES users(id),
  client_id UUID REFERENCES clients(id),
  case_id UUID REFERENCES cases(id),

  -- Contact info (denormalized for quick access)
  customer_phone TEXT,

  -- Timing
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Status
  status TEXT NOT NULL DEFAULT 'queued',
  ended_reason TEXT,

  -- Recordings
  recording_url TEXT,
  stereo_recording_url TEXT,

  -- Transcription
  transcript TEXT,
  transcript_messages JSONB,
  cleaned_transcript TEXT,
  display_transcript TEXT,

  -- AI Analysis
  call_analysis JSONB,
  summary TEXT,
  sentiment TEXT,

  -- Dynamic variables (for outbound)
  dynamic_variables JSONB,

  -- Scheduling (for outbound)
  qstash_message_id TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Cost tracking
  cost DECIMAL(10, 4),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calls_direction ON calls(direction);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_clinic_id ON calls(clinic_id);
CREATE INDEX idx_calls_user_id ON calls(user_id);
CREATE INDEX idx_calls_client_id ON calls(client_id);
CREATE INDEX idx_calls_case_id ON calls(case_id);
CREATE INDEX idx_calls_customer_phone ON calls(customer_phone);
CREATE INDEX idx_calls_scheduled_for ON calls(scheduled_for);
CREATE INDEX idx_calls_external_call_id ON calls(external_call_id);
CREATE INDEX idx_calls_created_at ON calls(created_at DESC);
```

**Migration Strategy:**

1. Create `calls` table
2. Migrate `scheduled_discharge_calls` to `calls` with `direction='outbound'`
3. Migrate `inbound_vapi_calls` to `calls` with `direction='inbound'`
4. Keep old tables as views for backwards compatibility
5. Update application code to use `calls` table
6. Deprecate old tables

---

### 2.6 Priority 6: Add Audit Columns

**Add audit fields to clinical tables:**

```sql
-- Add to cases
ALTER TABLE cases ADD COLUMN created_by UUID REFERENCES users(id);
ALTER TABLE cases ADD COLUMN updated_by UUID REFERENCES users(id);
ALTER TABLE cases ADD COLUMN version INTEGER DEFAULT 1;

-- Add to patients
ALTER TABLE patients ADD COLUMN created_by UUID REFERENCES users(id);
ALTER TABLE patients ADD COLUMN updated_by UUID REFERENCES users(id);
ALTER TABLE patients ADD COLUMN version INTEGER DEFAULT 1;

-- Add to soap_notes
ALTER TABLE soap_notes ADD COLUMN created_by UUID REFERENCES users(id);
ALTER TABLE soap_notes ADD COLUMN updated_by UUID REFERENCES users(id);
ALTER TABLE soap_notes ADD COLUMN version INTEGER DEFAULT 1;

-- Add to discharge_summaries
ALTER TABLE discharge_summaries ADD COLUMN created_by UUID REFERENCES users(id);
ALTER TABLE discharge_summaries ADD COLUMN updated_by UUID REFERENCES users(id);
ALTER TABLE discharge_summaries ADD COLUMN version INTEGER DEFAULT 1;
```

**Create audit trigger:**

```sql
CREATE OR REPLACE FUNCTION update_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = COALESCE(OLD.version, 0) + 1;
  -- updated_by should be set by application
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER audit_cases BEFORE UPDATE ON cases
FOR EACH ROW EXECUTE FUNCTION update_audit_fields();

CREATE TRIGGER audit_patients BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION update_audit_fields();

CREATE TRIGGER audit_soap_notes BEFORE UPDATE ON soap_notes
FOR EACH ROW EXECUTE FUNCTION update_audit_fields();

CREATE TRIGGER audit_discharge_summaries BEFORE UPDATE ON discharge_summaries
FOR EACH ROW EXECUTE FUNCTION update_audit_fields();
```

---

### 2.7 Priority 7: Normalize Transcription Sources

**Add transcription source tracking:**

```sql
-- Add source column to transcriptions
ALTER TABLE transcriptions ADD COLUMN source TEXT DEFAULT 'ios_scribe';
ALTER TABLE transcriptions ADD COLUMN source_reference TEXT; -- e.g., IDEXX consultation ID

-- Create transcriptions from IDEXX consultation notes
INSERT INTO transcriptions (case_id, user_id, transcript, source, source_reference, processing_status)
SELECT
  c.id,
  c.user_id,
  c.metadata->'idexx'->>'consultation_notes',
  'idexx_neo',
  c.metadata->'idexx'->>'consultation_id',
  'completed'
FROM cases c
WHERE c.metadata->'idexx'->>'consultation_notes' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM transcriptions t
    WHERE t.case_id = c.id AND t.source = 'idexx_neo'
  );
```

---

### 2.8 Priority 8: Add Missing Indexes

```sql
-- Cases table
CREATE INDEX IF NOT EXISTS idx_cases_external_id ON cases(external_id);
CREATE INDEX IF NOT EXISTS idx_cases_source ON cases(source);
CREATE INDEX IF NOT EXISTS idx_cases_scheduled_at ON cases(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_cases_status_user ON cases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cases_created_at_user ON cases(user_id, created_at DESC);

-- Patients table
CREATE INDEX IF NOT EXISTS idx_patients_owner_phone ON patients(owner_phone);
CREATE INDEX IF NOT EXISTS idx_patients_external_id ON patients(external_id);
CREATE INDEX IF NOT EXISTS idx_patients_name_trgm ON patients USING gin(name gin_trgm_ops);

-- Scheduled calls
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_scheduled_status
  ON scheduled_discharge_calls(scheduled_for, status)
  WHERE status = 'queued';

-- Transcriptions
CREATE INDEX IF NOT EXISTS idx_transcriptions_case_id ON transcriptions(case_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON transcriptions(user_id);
```

---

## Part 3: Migration Execution Plan

### Phase 1: Non-Breaking Additions (Week 1)

1. Create `clients` table
2. Add new columns to existing tables (nullable)
3. Add missing indexes
4. Create audit triggers

### Phase 2: Data Migration (Week 2)

1. Populate `clients` from existing owner data
2. Link `patients.client_id`
3. Extract JSONB data to new columns
4. Link `users.clinic_id`

### Phase 3: Application Updates (Week 3-4)

1. Update iOS app to use `clients` table
2. Update Chrome extension to use `clients` table
3. Update web app repositories and services
4. Update tRPC procedures

### Phase 4: Cleanup (Week 5)

1. Add NOT NULL constraints where appropriate
2. Create backwards-compatible views
3. Deprecate old columns (don't remove yet)
4. Update documentation

### Phase 5: Unified Calls Table (Week 6-7)

1. Create `calls` table
2. Migrate existing call data
3. Update VAPI webhook handlers
4. Create views for old table names

---

## Part 4: Backwards Compatibility Strategy

### Views for Old Table Names

```sql
-- After migrating scheduled_discharge_calls to calls
CREATE VIEW scheduled_discharge_calls AS
SELECT
  id,
  user_id,
  external_call_id AS vapi_call_id,
  assistant_id,
  phone_number_id,
  customer_phone,
  scheduled_for,
  status,
  ended_reason,
  started_at,
  ended_at,
  duration_seconds,
  recording_url,
  transcript,
  transcript_messages,
  call_analysis,
  summary,
  dynamic_variables,
  case_id,
  metadata,
  qstash_message_id,
  cost,
  created_at,
  updated_at
FROM calls
WHERE direction = 'outbound';
```

### Deprecation Columns

Keep deprecated columns for 2 release cycles:

- `patients.owner_name` → Use `clients.full_name`
- `patients.owner_phone` → Use `clients.primary_phone`
- `patients.owner_email` → Use `clients.email`
- `users.clinic_name` → Use `users.clinic_id` + `clinics.name`
- `inbound_vapi_calls.clinic_name` → Use `clinic_id`

---

## Part 5: Entity Relationship Diagram (Target State)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   clinics   │────<│    users    │────<│   clients   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  providers  │     │    cases    │────<│  patients   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   ├───────────────────┤
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│appointments │     │    calls    │     │ soap_notes  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   │                   ▼
┌─────────────┐            │           ┌─────────────┐
│ appt_reqs   │            │           │  discharge  │
└─────────────┘            │           │  summaries  │
                           │           └─────────────┘
                           ▼
                    ┌─────────────┐
                    │transcriptions│
                    └─────────────┘
```

---

## Part 6: Key Decisions Required

1. **Client Deduplication Strategy**: How to handle duplicate clients (same phone, different names)?
2. **Template Migration**: Keep separate tables or migrate to unified?
3. **Call Table Migration**: Big bang or gradual migration?
4. **JSONB Retention**: Keep metadata columns or fully extract?
5. **Audit Depth**: Full history table or just created_by/updated_by?

---

## Appendix A: Current Table Row Counts

| Table                            | Rows  |
| -------------------------------- | ----- |
| cases                            | 1,979 |
| patients                         | 1,946 |
| discharge_summaries              | 1,669 |
| transcriptions                   | 1,111 |
| soap_notes                       | 950   |
| scheduled_discharge_calls        | 552   |
| scheduled_discharge_emails       | 532   |
| session_analytics                | 412   |
| user_events                      | 77    |
| temp_soap_templates              | 46    |
| inbound_vapi_calls               | 42    |
| retell_calls                     | 37    |
| temp_discharge_summary_templates | 30    |
| users                            | 29    |
| appointment_requests             | 9     |
| schedule_syncs                   | 7     |
| idexx_sync_sessions              | 5     |
| clinic_messages                  | 5     |
| discharge_batch_items            | 4     |
| soap_template_shares             | 4     |
| providers                        | 4     |
| appointments                     | 3     |
| waitlist_signups                 | 3     |
| clinics                          | 2     |
| idexx_credentials                | 2     |
| templates                        | 1     |
| discharge_batches                | 1     |
| slack_workspaces                 | 1     |
| slack_reminder_channels          | 1     |
| slack_tasks                      | 1     |
| case_shares                      | 1     |
| All other tables                 | 0     |

---

_Document generated: December 26, 2025_
_Analysis covers: odis-ai-web, odis-ai-extension, odis-ai-ios_

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.appointment*requests (
id uuid NOT NULL DEFAULT gen_random_uuid(),
clinic_id uuid NOT NULL,
provider_id uuid,
requested_date date,
requested_start_time time without time zone,
requested_end_time time without time zone,
patient_name text NOT NULL,
client_name text NOT NULL,
client_phone text NOT NULL,
reason text,
status text NOT NULL DEFAULT 'pending'::text,
vapi_call_id text,
confirmed_appointment_id uuid,
notes text,
metadata jsonb DEFAULT '{}'::jsonb,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
species text,
breed text,
is_new_client boolean DEFAULT false,
is_outlier boolean DEFAULT false,
confirmed_date date,
confirmed_time time without time zone,
CONSTRAINT appointment_requests_pkey PRIMARY KEY (id),
CONSTRAINT appointment_requests_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
CONSTRAINT appointment_requests_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id),
CONSTRAINT appointment_requests_confirmed_appointment_id_fkey FOREIGN KEY (confirmed_appointment_id) REFERENCES public.appointments(id)
);
CREATE TABLE public.appointments (
id uuid NOT NULL DEFAULT gen_random_uuid(),
clinic_id uuid NOT NULL,
provider_id uuid,
sync_id uuid,
neo_appointment_id text,
date date NOT NULL,
start_time time without time zone NOT NULL,
end_time time without time zone NOT NULL,
patient_name text,
client_name text,
client_phone text,
appointment_type text,
status text NOT NULL DEFAULT 'scheduled'::text,
source text NOT NULL DEFAULT 'neo'::text,
notes text,
metadata jsonb DEFAULT '{}'::jsonb,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT appointments_pkey PRIMARY KEY (id),
CONSTRAINT appointments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
CONSTRAINT appointments_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id),
CONSTRAINT appointments_sync_id_fkey FOREIGN KEY (sync_id) REFERENCES public.schedule_syncs(id)
);
CREATE TABLE public.audio_files (
id uuid NOT NULL DEFAULT gen_random_uuid(),
transcription_id uuid,
filename character varying NOT NULL,
file_path character varying NOT NULL,
duration double precision NOT NULL,
file_size bigint NOT NULL,
format character varying NOT NULL,
sample_rate integer,
channels integer,
bit_rate integer,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT audio_files_pkey PRIMARY KEY (id),
CONSTRAINT audio_files_transcription_id_fkey FOREIGN KEY (transcription_id) REFERENCES public.transcriptions(id)
);
CREATE TABLE public.call_patients (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
pet_name text NOT NULL,
owner_name text NOT NULL,
owner_phone text NOT NULL,
vet_name text,
clinic_name text,
clinic_phone text,
discharge_summary text,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT call_patients_pkey PRIMARY KEY (id),
CONSTRAINT call_patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.case_shares (
id uuid NOT NULL DEFAULT gen_random_uuid(),
case_id uuid NOT NULL,
shared_with_user_id uuid NOT NULL,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
shared_by_user_id uuid,
CONSTRAINT case_shares_pkey PRIMARY KEY (id),
CONSTRAINT case_shares_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id),
CONSTRAINT case_shares_shared_with_user_id_fkey FOREIGN KEY (shared_with_user_id) REFERENCES auth.users(id),
CONSTRAINT case_shares_shared_by_user_id_fkey FOREIGN KEY (shared_by_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.cases (
id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
visibility USER-DEFINED NOT NULL DEFAULT 'private'::"CaseVisibility",
type USER-DEFINED,
status USER-DEFINED,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
user_id uuid DEFAULT auth.uid(),
source text DEFAULT 'manual'::text,
external_id text,
metadata jsonb DEFAULT '{}'::jsonb,
scheduled_at timestamp with time zone,
entity_extraction jsonb,
extreme_case_check jsonb,
is_urgent boolean DEFAULT false,
is_starred boolean DEFAULT false,
CONSTRAINT cases_pkey PRIMARY KEY (id),
CONSTRAINT cases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.clinic_assistants (
id uuid NOT NULL DEFAULT gen_random_uuid(),
clinic_name text NOT NULL,
assistant_id text NOT NULL,
phone_number_id text,
is_active boolean NOT NULL DEFAULT true,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT clinic_assistants_pkey PRIMARY KEY (id)
);
CREATE TABLE public.clinic_messages (
id uuid NOT NULL DEFAULT gen_random_uuid(),
clinic_id uuid NOT NULL,
caller_name text,
caller_phone text NOT NULL,
message_content text NOT NULL,
message_type text NOT NULL DEFAULT 'voicemail'::text,
status text NOT NULL DEFAULT 'new'::text,
vapi_call_id text,
priority text DEFAULT 'normal'::text,
assigned_to_user_id uuid,
metadata jsonb DEFAULT '{}'::jsonb,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
read_at timestamp with time zone,
CONSTRAINT clinic_messages_pkey PRIMARY KEY (id),
CONSTRAINT clinic_messages_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
CONSTRAINT clinic_messages_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.clinics (
id uuid NOT NULL DEFAULT gen_random_uuid(),
name text NOT NULL UNIQUE,
email text,
phone text,
address text,
pims_type text NOT NULL DEFAULT 'idexx_neo'::text,
is_active boolean NOT NULL DEFAULT true,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
inbound_assistant_id text,
outbound_assistant_id text,
phone_number_id text,
primary_color character varying DEFAULT '#2563EB'::character varying,
logo_url text,
email_header_text text,
email_footer_text text,
inbound_phone_number_id text,
slug text NOT NULL,
CONSTRAINT clinics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.consultation_sync_status (
id uuid NOT NULL DEFAULT gen_random_uuid(),
sync_session_id uuid NOT NULL,
neo_consultation_id text NOT NULL UNIQUE,
case_id uuid,
status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'synced'::text, 'reconciled'::text, 'failed'::text, 'skipped'::text])),
synced_at timestamp with time zone,
reconciled_at timestamp with time zone,
error_message text,
metadata jsonb DEFAULT '{}'::jsonb,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT consultation_sync_status_pkey PRIMARY KEY (id),
CONSTRAINT consultation_sync_status_sync_session_id_fkey FOREIGN KEY (sync_session_id) REFERENCES public.idexx_sync_sessions(id),
CONSTRAINT consultation_sync_status_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id)
);
CREATE TABLE public.contact_submissions (
id uuid NOT NULL DEFAULT gen_random_uuid(),
first_name text NOT NULL,
last_name text NOT NULL,
email text NOT NULL,
clinic_name text,
phone text,
message text NOT NULL,
source text DEFAULT 'contact_page'::text,
metadata jsonb DEFAULT '{}'::jsonb,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT contact_submissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.discharge_batch_items (
id uuid NOT NULL DEFAULT gen_random_uuid(),
batch_id uuid NOT NULL,
case_id uuid,
patient_id uuid,
status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'success'::text, 'failed'::text, 'skipped'::text])),
email_scheduled boolean DEFAULT false,
call_scheduled boolean DEFAULT false,
email_id uuid,
call_id uuid,
error_message text,
processed_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT discharge_batch_items_pkey PRIMARY KEY (id),
CONSTRAINT discharge_batch_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.discharge_batches(id),
CONSTRAINT discharge_batch_items_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id),
CONSTRAINT discharge_batch_items_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
CONSTRAINT discharge_batch_items_email_id_fkey FOREIGN KEY (email_id) REFERENCES public.scheduled_discharge_emails(id),
CONSTRAINT discharge_batch_items_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.scheduled_discharge_calls(id)
);
CREATE TABLE public.discharge_batches (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid,
status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'cancelled'::text, 'partial_success'::text])),
total_cases integer NOT NULL DEFAULT 0,
processed_cases integer NOT NULL DEFAULT 0,
successful_cases integer NOT NULL DEFAULT 0,
failed_cases integer NOT NULL DEFAULT 0,
email_schedule_time timestamp with time zone NOT NULL,
call_schedule_time timestamp with time zone NOT NULL,
started_at timestamp with time zone,
completed_at timestamp with time zone,
cancelled_at timestamp with time zone,
error_summary jsonb DEFAULT '{}'::jsonb,
metadata jsonb DEFAULT '{}'::jsonb,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT discharge_batches_pkey PRIMARY KEY (id),
CONSTRAINT discharge_batches_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.discharge_summaries (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
case_id uuid NOT NULL,
soap_note_id uuid,
user_id uuid NOT NULL,
content text NOT NULL,
template_id uuid,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
generation_id uuid,
structured_content jsonb,
CONSTRAINT discharge_summaries_pkey PRIMARY KEY (id),
CONSTRAINT discharge_summaries_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id),
CONSTRAINT discharge_summaries_soap_note_id_fkey FOREIGN KEY (soap_note_id) REFERENCES public.soap_notes(id),
CONSTRAINT discharge_summaries_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.temp_discharge_summary_templates(id),
CONSTRAINT discharge_summaries_generation_id_fkey FOREIGN KEY (generation_id) REFERENCES public.generations(id),
CONSTRAINT discharge_summaries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.discharge_template_shares (
id uuid NOT NULL DEFAULT gen_random_uuid(),
template_id uuid NOT NULL,
shared_with_user_id uuid NOT NULL,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
shared_by_user_id uuid,
CONSTRAINT discharge_template_shares_pkey PRIMARY KEY (id),
CONSTRAINT discharge_template_shares_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.temp_discharge_summary_templates(id),
CONSTRAINT discharge_template_shares_shared_with_user_id_fkey FOREIGN KEY (shared_with_user_id) REFERENCES auth.users(id),
CONSTRAINT discharge_template_shares_shared_by_user_id_fkey FOREIGN KEY (shared_by_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.error_logs (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid,
error_type text NOT NULL,
error_code text,
error_message text NOT NULL,
platform text NOT NULL CHECK (platform = ANY (ARRAY['chrome_extension'::text, 'firefox_extension'::text, 'ios'::text, 'web'::text])),
source text,
case_id uuid,
event_id uuid,
stack_trace text,
error_data jsonb DEFAULT '{}'::jsonb,
request_data jsonb,
response_data jsonb,
resolved boolean DEFAULT false,
resolved_at timestamp with time zone,
resolution_notes text,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT error_logs_pkey PRIMARY KEY (id),
CONSTRAINT error_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
CONSTRAINT error_logs_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id),
CONSTRAINT error_logs_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.user_events(id)
);
CREATE TABLE public.feature_usage (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid,
feature_name text NOT NULL,
feature_category text NOT NULL,
usage_count integer DEFAULT 1,
first_used_at timestamp with time zone DEFAULT now(),
last_used_at timestamp with time zone DEFAULT now(),
platform text NOT NULL CHECK (platform = ANY (ARRAY['chrome_extension'::text, 'firefox_extension'::text, 'ios'::text, 'web'::text])),
metadata jsonb DEFAULT '{}'::jsonb,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT feature_usage_pkey PRIMARY KEY (id),
CONSTRAINT feature_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.generations (
id uuid NOT NULL DEFAULT gen_random_uuid(),
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
prompt text,
content text,
template_id uuid,
case_id uuid,
CONSTRAINT generations_pkey PRIMARY KEY (id),
CONSTRAINT generations_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id),
CONSTRAINT generations_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id)
);
CREATE TABLE public.idexx_credentials (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
clinic_id uuid,
username_encrypted bytea NOT NULL,
password_encrypted bytea NOT NULL,
encryption_key_id text NOT NULL DEFAULT 'default'::text,
is_active boolean NOT NULL DEFAULT true,
last_used_at timestamp with time zone,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
validation_status text NOT NULL DEFAULT 'unknown'::text,
last_validated_at timestamp with time zone,
sync_enabled boolean NOT NULL DEFAULT true,
company_id_encrypted bytea,
CONSTRAINT idexx_credentials_pkey PRIMARY KEY (id),
CONSTRAINT idexx_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
CONSTRAINT idexx_credentials_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.idexx_sync_audit_log (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
clinic_id uuid NOT NULL,
sync_session_id uuid,
action_type text NOT NULL CHECK (action_type = ANY (ARRAY['credential_access'::text, 'sync_started'::text, 'sync_completed'::text, 'sync_failed'::text, 'consultation_synced'::text, 'reconciliation'::text])),
resource_type text NOT NULL CHECK (resource_type = ANY (ARRAY['credential'::text, 'appointment'::text, 'consultation'::text, 'sync_session'::text])),
resource_id text,
status text NOT NULL CHECK (status = ANY (ARRAY['success'::text, 'failure'::text])),
ip_address inet,
user_agent text,
details jsonb DEFAULT '{}'::jsonb,
created_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT idexx_sync_audit_log_pkey PRIMARY KEY (id),
CONSTRAINT idexx_sync_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
CONSTRAINT idexx_sync_audit_log_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
CONSTRAINT idexx_sync_audit_log_sync_session_id_fkey FOREIGN KEY (sync_session_id) REFERENCES public.idexx_sync_sessions(id)
);
CREATE TABLE public.idexx_sync_sessions (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
clinic_id uuid NOT NULL,
session_type text NOT NULL CHECK (session_type = ANY (ARRAY['appointment_sync'::text, 'consultation_sync'::text, 'full_sync'::text])),
status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'failed'::text])),
started_at timestamp with time zone,
completed_at timestamp with time zone,
appointments_synced integer DEFAULT 0,
consultations_synced integer DEFAULT 0,
error_message text,
metadata jsonb DEFAULT '{}'::jsonb,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
credential_id uuid,
consultations_failed integer NOT NULL DEFAULT 0,
discharge_calls_scheduled integer NOT NULL DEFAULT 0,
error_details jsonb,
next_scheduled_sync timestamp with time zone,
CONSTRAINT idexx_sync_sessions_pkey PRIMARY KEY (id),
CONSTRAINT idexx_sync_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
CONSTRAINT idexx_sync_sessions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
CONSTRAINT idexx_sync_sessions_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.idexx_credentials(id)
);
CREATE TABLE public.inbound_vapi_calls (
id uuid NOT NULL DEFAULT gen_random_uuid(),
vapi_call_id text NOT NULL UNIQUE,
assistant_id text NOT NULL,
phone_number_id text,
user_id uuid,
clinic_name text,
customer_phone text,
customer_number text,
status text NOT NULL DEFAULT 'queued'::text CHECK (status = ANY (ARRAY['queued'::text, 'ringing'::text, 'in_progress'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
type text NOT NULL DEFAULT 'inbound'::text CHECK (type = 'inbound'::text),
started_at timestamp with time zone,
ended_at timestamp with time zone,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
duration_seconds integer,
recording_url text,
stereo_recording_url text,
transcript text,
transcript_messages jsonb,
call_analysis jsonb,
summary text,
success_evaluation text,
structured_data jsonb,
user_sentiment text CHECK (user_sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text])),
cost numeric,
ended_reason text,
metadata jsonb DEFAULT '{}'::jsonb,
cleaned_transcript text,
display_transcript text,
use_display_transcript boolean DEFAULT false,
call_outcome_data jsonb,
pet_health_data jsonb,
medication_compliance_data jsonb,
owner_sentiment_data jsonb,
escalation_data jsonb,
follow_up_data jsonb,
attention_types ARRAY DEFAULT '{}'::text[],
attention_severity text,
attention_summary text,
attention_flagged_at timestamp with time zone,
outcome text,
actions_taken jsonb,
CONSTRAINT inbound_vapi_calls_pkey PRIMARY KEY (id),
CONSTRAINT inbound_vapi_calls_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.patients (
name text NOT NULL,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
case_id uuid,
id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
user_id uuid,
species character varying,
breed character varying,
date_of_birth date,
sex character varying,
weight_kg numeric,
owner_name character varying,
owner_phone character varying,
owner_email character varying,
source text DEFAULT 'manual'::text,
external_id text,
metadata jsonb DEFAULT '{}'::jsonb,
CONSTRAINT patients_pkey PRIMARY KEY (id),
CONSTRAINT patient_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id),
CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.providers (
id uuid NOT NULL DEFAULT gen_random_uuid(),
clinic_id uuid NOT NULL,
neo_provider_id text NOT NULL,
name text NOT NULL,
role text NOT NULL DEFAULT 'veterinarian'::text,
is_active boolean NOT NULL DEFAULT true,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT providers_pkey PRIMARY KEY (id),
CONSTRAINT providers_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.retell_calls (
id uuid NOT NULL DEFAULT gen_random_uuid(),
retell_call_id character varying NOT NULL UNIQUE,
agent_id character varying NOT NULL,
phone_number character varying NOT NULL CHECK (phone_number::text ~ '^\+?[1-9]\d{1,14}$'::text),
phone_number_pretty character varying,
call_variables jsonb DEFAULT '{}'::jsonb,
metadata jsonb DEFAULT '{}'::jsonb,
status character varying NOT NULL DEFAULT 'initiated'::character varying CHECK (status::text = ANY (ARRAY['scheduled'::character varying, 'initiated'::character varying, 'ringing'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying]::text[])),
duration_seconds integer,
start_timestamp timestamp with time zone,
end_timestamp timestamp with time zone,
retell_response jsonb,
error_message text,
created_by uuid,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
patient_id uuid,
recording_url text,
transcript text,
transcript_object jsonb,
call_analysis jsonb,
disconnection_reason text,
public_log_url text,
scheduled_for timestamp with time zone,
CONSTRAINT retell_calls_pkey PRIMARY KEY (id),
CONSTRAINT retell_calls_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
CONSTRAINT fk_retell_calls_patient FOREIGN KEY (patient_id) REFERENCES public.call_patients(id)
);
CREATE TABLE public.schedule_syncs (
id uuid NOT NULL DEFAULT gen_random_uuid(),
clinic_id uuid,
sync_date date NOT NULL,
synced_at timestamp with time zone NOT NULL DEFAULT now(),
status text NOT NULL DEFAULT 'pending'::text,
appointment_count integer,
error_message text,
metadata jsonb DEFAULT '{}'::jsonb,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
user_id uuid,
sync_type text DEFAULT 'schedule'::text,
started_at timestamp with time zone DEFAULT now(),
completed_at timestamp with time zone,
total_items integer DEFAULT 0,
synced_count integer DEFAULT 0,
skipped_count integer DEFAULT 0,
failed_count integer DEFAULT 0,
error_details jsonb,
CONSTRAINT schedule_syncs_pkey PRIMARY KEY (id),
CONSTRAINT schedule_syncs_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
CONSTRAINT schedule_syncs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.scheduled_discharge_calls (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
user_id uuid NOT NULL,
vapi_call_id text,
assistant_id text,
phone_number_id text,
customer_phone text,
scheduled_for timestamp with time zone,
status text NOT NULL DEFAULT 'queued'::text CHECK (status = ANY (ARRAY['queued'::text, 'ringing'::text, 'in_progress'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
ended_reason text,
started_at timestamp with time zone,
ended_at timestamp with time zone,
duration_seconds integer,
recording_url text,
transcript text,
transcript_messages jsonb,
call_analysis jsonb,
dynamic_variables jsonb NOT NULL,
condition_category text,
knowledge_base_used text,
cost numeric,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
metadata jsonb DEFAULT '{}'::jsonb,
case_id uuid,
qstash_message_id text,
stereo_recording_url text,
summary text,
success_evaluation text,
user_sentiment text,
structured_data jsonb,
review_category text DEFAULT 'to_review'::text CHECK (review_category = ANY (ARRAY['to_review'::text, 'good'::text, 'bad'::text, 'voicemail'::text, 'failed'::text, 'no_answer'::text, 'needs_followup'::text])),
urgent_reason_summary text,
attention_types ARRAY,
attention_severity text CHECK (attention_severity = ANY (ARRAY['routine'::text, 'urgent'::text, 'critical'::text])),
attention_flagged_at timestamp with time zone,
attention_summary text,
cleaned_transcript text,
call_outcome_data jsonb,
pet_health_data jsonb,
medication_compliance_data jsonb,
owner_sentiment_data jsonb,
escalation_data jsonb,
follow_up_data jsonb,
CONSTRAINT scheduled_discharge_calls_pkey PRIMARY KEY (id),
CONSTRAINT vapi_calls_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
CONSTRAINT scheduled_discharge_calls_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id)
);
CREATE TABLE public.scheduled_discharge_emails (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
case_id uuid,
recipient_email text NOT NULL,
recipient_name text,
subject text NOT NULL,
html_content text NOT NULL,
text_content text,
scheduled_for timestamp with time zone NOT NULL,
status text NOT NULL DEFAULT 'queued'::text CHECK (status = ANY (ARRAY['queued'::text, 'sent'::text, 'failed'::text, 'cancelled'::text])),
sent_at timestamp with time zone,
resend_email_id text,
metadata jsonb DEFAULT '{}'::jsonb,
qstash_message_id text,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT scheduled_discharge_emails_pkey PRIMARY KEY (id),
CONSTRAINT scheduled_discharge_emails_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
CONSTRAINT scheduled_discharge_emails_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id)
);
CREATE TABLE public.session_analytics (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid,
session_id text NOT NULL UNIQUE,
platform text NOT NULL CHECK (platform = ANY (ARRAY['chrome_extension'::text, 'firefox_extension'::text, 'ios'::text, 'web'::text])),
started_at timestamp with time zone DEFAULT now(),
ended_at timestamp with time zone,
duration_seconds integer,
event_count integer DEFAULT 0,
actions_performed ARRAY,
features_used ARRAY,
cases_created integer DEFAULT 0,
discharges_sent integer DEFAULT 0,
user_agent text,
extension_version text,
app_version text,
device_info jsonb,
metadata jsonb DEFAULT '{}'::jsonb,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT session_analytics_pkey PRIMARY KEY (id),
CONSTRAINT session_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.slack_reminder_channels (
id uuid NOT NULL DEFAULT gen_random_uuid(),
workspace_id uuid,
channel_id text NOT NULL,
channel_name text NOT NULL,
timezone text NOT NULL DEFAULT 'UTC'::text,
is_active boolean DEFAULT true,
added_by_user_id text NOT NULL,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT slack_reminder_channels_pkey PRIMARY KEY (id),
CONSTRAINT slack_reminder_channels_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.slack_workspaces(id)
);
CREATE TABLE public.slack_task_completions (
id uuid NOT NULL DEFAULT gen_random_uuid(),
task_id uuid,
completion_date date NOT NULL,
completed_by_user_id text NOT NULL,
completed_by_username text,
completed_at timestamp with time zone DEFAULT now(),
message_ts text,
CONSTRAINT slack_task_completions_pkey PRIMARY KEY (id),
CONSTRAINT slack_task_completions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.slack_tasks(id)
);
CREATE TABLE public.slack_tasks (
id uuid NOT NULL DEFAULT gen_random_uuid(),
channel_id uuid,
title text NOT NULL,
description text,
reminder_time time without time zone NOT NULL,
is_active boolean DEFAULT true,
created_by_user_id text NOT NULL,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT slack_tasks_pkey PRIMARY KEY (id),
CONSTRAINT slack_tasks_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.slack_reminder_channels(id)
);
CREATE TABLE public.slack_workspaces (
id uuid NOT NULL DEFAULT gen_random_uuid(),
team_id text NOT NULL UNIQUE,
team_name text NOT NULL,
bot_token text NOT NULL,
bot_user_id text NOT NULL,
app_id text NOT NULL,
scope text NOT NULL,
authed_user_id text,
is_active boolean DEFAULT true,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT slack_workspaces_pkey PRIMARY KEY (id)
);
CREATE TABLE public.soap_notes (
id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
transcript text,
subjective text,
objective text,
assessment text,
plan text,
case_id uuid,
client_instructions text DEFAULT 'NULL'::text,
CONSTRAINT soap_notes_pkey PRIMARY KEY (id),
CONSTRAINT soap_notes_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id)
);
CREATE TABLE public.soap_template_shares (
id uuid NOT NULL DEFAULT gen_random_uuid(),
template_id uuid NOT NULL,
shared_with_user_id uuid NOT NULL,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
shared_by_user_id uuid,
CONSTRAINT soap_template_shares_pkey PRIMARY KEY (id),
CONSTRAINT soap_template_shares_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.temp_soap_templates(id),
CONSTRAINT soap_template_shares_shared_with_user_id_fkey FOREIGN KEY (shared_with_user_id) REFERENCES auth.users(id),
CONSTRAINT soap_template_shares_shared_by_user_id_fkey FOREIGN KEY (shared_by_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.temp_discharge_summary_templates (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
user_id uuid NOT NULL,
name text NOT NULL,
content text NOT NULL,
is_default boolean DEFAULT false,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT temp_discharge_summary_templates_pkey PRIMARY KEY (id),
CONSTRAINT temp_discharge_summaries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
CONSTRAINT temp_discharge_summary_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.temp_soap_templates (
id uuid NOT NULL DEFAULT gen_random_uuid(),
person_name text NOT NULL,
template_name text NOT NULL,
subjective_template text,
objective_template text,
subjective_prompt text,
objective_prompt text,
assessment_prompt text,
plan_prompt text,
client_instructions_prompt text,
system_prompt_addition text,
template_id text NOT NULL,
display_name text NOT NULL,
icon_name text NOT NULL,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
assessment_template text,
plan_template text,
client_instructions_template text,
user_id uuid,
is_default boolean DEFAULT false,
CONSTRAINT temp_soap_templates_pkey PRIMARY KEY (id),
CONSTRAINT temp_soap_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.templates (
id uuid NOT NULL DEFAULT gen_random_uuid(),
name text,
type text,
content jsonb,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
prompt text,
model text,
key text,
description text,
output_format text DEFAULT 'json'::text CHECK (output_format = ANY (ARRAY['json'::text, 'text'::text, 'structured'::text])),
validation_schema jsonb DEFAULT '{}'::jsonb,
metadata jsonb DEFAULT '{}'::jsonb,
CONSTRAINT templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transcriptions (
transcript text,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
case_id uuid,
id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
audio_file_id uuid,
processing_status character varying DEFAULT 'completed'::character varying,
speaker_segments jsonb,
user_id uuid DEFAULT auth.uid(),
CONSTRAINT transcriptions_pkey PRIMARY KEY (id),
CONSTRAINT transcriptions_audio_file_id_fkey FOREIGN KEY (audio_file_id) REFERENCES public.audio_files(id),
CONSTRAINT transcriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
CONSTRAINT transcriptions_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id)
);
CREATE TABLE public.user_events (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid,
event_type text NOT NULL CHECK (event_type ~ '^[a-z*]+$'::text),
  event_category text NOT NULL CHECK (event_category ~ '^[a-z_]+$'::text),
event_action text NOT NULL,
platform text NOT NULL CHECK (platform = ANY (ARRAY['chrome_extension'::text, 'firefox_extension'::text, 'ios'::text, 'web'::text])),
source text,
session_id text,
case_id uuid,
patient_id uuid,
discharge_summary_id uuid,
scheduled_call_id uuid,
scheduled_email_id uuid,
metadata jsonb DEFAULT '{}'::jsonb,
properties jsonb DEFAULT '{}'::jsonb,
success boolean DEFAULT true,
error_message text,
error_code text,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT user_events_pkey PRIMARY KEY (id),
CONSTRAINT user_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
CONSTRAINT user_events_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id),
CONSTRAINT user_events_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
CONSTRAINT user_events_discharge_summary_id_fkey FOREIGN KEY (discharge_summary_id) REFERENCES public.discharge_summaries(id),
CONSTRAINT user_events_scheduled_call_id_fkey FOREIGN KEY (scheduled_call_id) REFERENCES public.scheduled_discharge_calls(id),
CONSTRAINT user_events_scheduled_email_id_fkey FOREIGN KEY (scheduled_email_id) REFERENCES public.scheduled_discharge_emails(id)
);
CREATE TABLE public.users (
id uuid NOT NULL DEFAULT gen_random_uuid(),
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
email text,
first_name text,
last_name text,
role USER-DEFINED DEFAULT 'veterinarian'::user_role,
clinic_name text,
license_number text,
onboarding_completed boolean DEFAULT false,
avatar_url text,
default_discharge_template_id uuid,
clinic_phone character varying,
clinic_email character varying,
pims_systems jsonb DEFAULT '[]'::jsonb,
pims_credentials jsonb DEFAULT '{}'::jsonb,
test_mode_enabled boolean DEFAULT false,
test_contact_name text,
test_contact_email text,
test_contact_phone text,
emergency_phone text,
voicemail_detection_enabled boolean DEFAULT false,
default_schedule_delay_minutes integer,
voicemail_hangup_on_detection boolean NOT NULL DEFAULT false,
preferred_email_start_time time without time zone DEFAULT '10:00:00'::time without time zone,
preferred_email_end_time time without time zone DEFAULT '12:00:00'::time without time zone,
preferred_call_start_time time without time zone DEFAULT '16:00:00'::time without time zone,
preferred_call_end_time time without time zone DEFAULT '19:00:00'::time without time zone,
email_delay_days integer DEFAULT 1,
call_delay_days integer DEFAULT 2,
max_call_retries integer DEFAULT 3,
batch_include_idexx_notes boolean DEFAULT true,
batch_include_manual_transcriptions boolean DEFAULT true,
voicemail_message text,
CONSTRAINT users_pkey PRIMARY KEY (id),
CONSTRAINT users_default_discharge_template_id_fkey FOREIGN KEY (default_discharge_template_id) REFERENCES public.temp_discharge_summary_templates(id),
CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.vital_signs (
id uuid NOT NULL DEFAULT gen_random_uuid(),
case_id uuid,
soap_note_id uuid,
user_id uuid NOT NULL,
temperature numeric,
temperature_unit text CHECK (temperature_unit = ANY (ARRAY['F'::text, 'C'::text])),
pulse integer,
respiration integer,
weight numeric,
weight_unit text CHECK (weight_unit = ANY (ARRAY['kg'::text, 'lb'::text, 'g'::text, 'oz'::text])),
systolic integer,
diastolic integer,
notes text,
source text DEFAULT 'manual'::text,
extracted_from text,
metadata jsonb DEFAULT '{}'::jsonb,
measured_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT vital_signs_pkey PRIMARY KEY (id),
CONSTRAINT vital_signs_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id),
CONSTRAINT vital_signs_soap_note_id_fkey FOREIGN KEY (soap_note_id) REFERENCES public.soap_notes(id)
);
CREATE TABLE public.waitlist_signups (
id uuid NOT NULL DEFAULT gen_random_uuid(),
email USER-DEFINED NOT NULL,
full_name text,
source text,
campaign text NOT NULL DEFAULT 'default'::text,
ip inet,
user_agent text,
status USER-DEFINED NOT NULL DEFAULT 'waiting'::waitlist_status,
metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
created_at timestamp with time zone NOT NULL DEFAULT now(),
confirmed_at timestamp with time zone DEFAULT now(),
CONSTRAINT waitlist_signups_pkey PRIMARY KEY (id)
);

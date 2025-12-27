# ODIS AI Database Context & Evolution

> A strategic overview of the current database architecture, identified issues, and proposed improvements.

---

## Data Consumers

ODIS AI has two primary data ingestion methods with distinct workflows:

### Consumer 1: iOS Scribe (Del Valle Pet Hospital)

| Attribute          | Value                            |
| ------------------ | -------------------------------- |
| **User**           | jattvc@gmail.com                 |
| **Clinic**         | Del Valle Pet Hospital           |
| **Primary Source** | `manual` (iOS app)               |
| **Entry Point**    | Direct Supabase + Edge Functions |

**Data Flow:**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  iOS App        │────>│  Audio Upload   │────>│  Transcription  │
│  Records audio  │     │  to Supabase    │     │  (Deepgram)     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐     ┌────────▼────────┐
│  Discharge      │<────│  SOAP Note      │<────│  AI Entity      │
│  Summary        │     │  Generation     │     │  Extraction     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Data Volume:**
| Table | Count |
|-------|-------|
| Cases | 413 |
| Patients | 398 |
| Transcriptions | 433 |
| SOAP Notes | 395 |
| Discharge Summaries | 317 |
| Scheduled Calls | 6 |
| Scheduled Emails | 0 |

**Metadata Structure:**

```json
{
  "entities": { ... }  // AI-extracted from transcription
}
```

**Entity Extraction (from audio transcription):**

```json
{
  "patient": {
    "name": "Tucker",
    "species": "dog",
    "age": "7 years",
    "owner": {
      "name": "Drake",
      "phone": "+15103207704"
    }
  },
  "clinical": {
    "diagnoses": ["Ear infection", "Hotspot"],
    "treatments": ["Ear flush", "Topical application"],
    "medications": [{ "name": "NexGard" }],
    "chiefComplaint": "Right side skin lesion"
  },
  "inputType": "transcription",
  "confidence": { "overall": 0.75 }
}
```

**Key Characteristics:**

- Creates case FIRST, then attaches patient
- Rich clinical data from voice transcription
- Entity extraction via LLM from raw transcript
- No external system IDs (no `external_id`)
- Lower volume, higher clinical detail per case

---

### Consumer 2: IDEXX Neo Extension (Alum Rock Animal Hospital)

| Attribute          | Value                           |
| ------------------ | ------------------------------- |
| **User**           | garrybath@hotmail.com           |
| **Clinic**         | Alum Rock Animal Hospital       |
| **Primary Source** | `idexx_neo` / `idexx_extension` |
| **Entry Point**    | POST `/api/cases/ingest`        |

**Data Flow:**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Chrome         │────>│  IDEXX Neo      │────>│  API Extraction │
│  Extension      │     │  Page Scraping  │     │  (appointments, │
└─────────────────┘     └─────────────────┘     │   clients, etc) │
                                                └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐     ┌────────▼────────┐
│  Scheduled      │<────│  Discharge      │<────│  /api/cases/    │
│  Calls/Emails   │     │  Summary Gen    │     │  ingest         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Data Volume:**
| Table | Count |
|-------|-------|
| Cases | 889 |
| Patients | 864 |
| Transcriptions | 30 |
| SOAP Notes | 45 |
| Discharge Summaries | 1,034 |
| Scheduled Calls | 537 |
| Scheduled Emails | 532 |
| Inbound Calls | 1 |

**Metadata Structure:**

```json
{
  "idexx": {
    "client_id": "11525",
    "patient_id": "33139",
    "client_name": "ROSALBA MENDOZA",
    "client_phone": "408-821-1666",
    "client_email": "rosalbaperez505@yahoo.es",
    "patient_name": "JAY JAY",
    "provider_id": "7",
    "provider_name": "DR. NIMIR BATH",
    "appointment_id": "346219",
    "consultation_id": "722054",
    "appointment_type": "Surgery",
    "appointment_status": "Finalized",
    "consultation_notes": "<p>Appointment reason: MASS REMOVAL...</p>",
    "extracted_from": "api"
  }
}
```

**Key Characteristics:**

- Extracts data from existing PIMS (no new data entry)
- Has external IDs (`idexx-appt-{id}`)
- Rich consultation notes (HTML formatted)
- Higher volume, lower manual effort
- Primary use case: automated discharge calls

---

### Consumer Comparison

| Aspect              | iOS Scribe                     | IDEXX Extension          |
| ------------------- | ------------------------------ | ------------------------ |
| **Data Entry**      | Manual (voice recording)       | Automated (scraping)     |
| **Clinical Notes**  | AI-transcribed from audio      | Extracted from IDEXX     |
| **Entity Source**   | LLM extraction from transcript | Direct from IDEXX fields |
| **External IDs**    | None                           | `idexx-appt-{id}`        |
| **Volume**          | Lower (~400 cases)             | Higher (~900 cases)      |
| **Discharge Calls** | Minimal (6)                    | Heavy use (537)          |
| **Patient Dedup**   | By name (no external ID)       | By IDEXX patient_id      |
| **Owner Data**      | From entity extraction         | From IDEXX client data   |

---

## PIMS Abstraction Strategy

To support future integrations beyond IDEXX Neo, the database needs a PIMS-agnostic design.

### Target PIMS Systems

| PIMS             | Market Share | Data Access                     | Notes               |
| ---------------- | ------------ | ------------------------------- | ------------------- |
| **IDEXX Neo**    | ~25%         | Web scraping + internal APIs    | Current integration |
| **AVImark**      | ~20%         | Desktop app, SQL Server backend | Covetrus product    |
| **Cornerstone**  | ~15%         | Desktop app, proprietary DB     | IDEXX product       |
| **eVetPractice** | ~10%         | Cloud-based, API available      | Growing market      |
| **Shepherd**     | ~5%          | Modern cloud, REST API          | Newer entrant       |
| **Digitail**     | ~5%          | Cloud-based, API available      | Modern platform     |
| **Rhapsody**     | ~5%          | Cloud-based                     | IDEXX cloud product |

### Current Problem: IDEXX-Specific Schema

```sql
-- Current: IDEXX fields baked into schema
cases.metadata = {
  "idexx": {                        ← IDEXX-specific namespace
    "client_id": "11525",           ← IDEXX field names
    "patient_id": "33139",
    "consultation_id": "722054",
    "appointment_id": "346219"
  }
}

cases.external_id = 'idexx-appt-346219'  ← IDEXX-prefixed ID
```

If we add Cornerstone tomorrow, we'd need:

- `metadata.cornerstone.*`
- `external_id = 'cornerstone-visit-{id}'`
- Different field mappings
- No unified query interface

### Solution: PIMS-Agnostic Normalized Layer

**Principle:** Store raw PIMS data as-is, but extract to normalized columns.

```
┌─────────────────────────────────────────────────────────────────┐
│                      NORMALIZED LAYER                           │
│  (Queryable, indexed, PIMS-agnostic)                           │
│                                                                 │
│  patient_name, owner_phone, provider_name, visit_reason, etc.  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Extract & normalize
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      RAW PIMS LAYER                             │
│  (Preserved for debugging, auditing, re-extraction)            │
│                                                                 │
│  metadata.idexx.*  │  metadata.avimark.*  │  metadata.corner.*  │
└─────────────────────────────────────────────────────────────────┘
```

### Proposed Schema Changes

**1. Standardized Source Enum**

```sql
CREATE TYPE external_source AS ENUM (
  -- Manual entry
  'manual',
  'ios_scribe',

  -- PIMS integrations
  'idexx_neo',
  'idexx_cornerstone',
  'idexx_rhapsody',
  'avimark',
  'evetpractice',
  'shepherd',
  'digitail',

  -- Future
  'api',
  'import'
);
```

**2. Normalized Cases Columns**

```sql
ALTER TABLE cases ADD COLUMN (
  -- Source tracking
  external_source external_source,
  external_id text,                    -- Raw ID from source system
  external_appointment_id text,        -- Appointment/visit ID
  external_consultation_id text,       -- Consultation/record ID

  -- Normalized patient/owner (extracted from any PIMS)
  patient_name text,
  patient_species text,
  patient_breed text,
  owner_name text,
  owner_phone text,
  owner_email text,

  -- Normalized visit info
  provider_name text,
  visit_reason text,
  visit_type text,
  visit_status text,

  -- Raw PIMS data (preserved per-source)
  pims_data jsonb                      -- Raw data from source system
);

-- Indexes on normalized columns
CREATE INDEX idx_cases_external_source ON cases(external_source);
CREATE INDEX idx_cases_patient_name ON cases(patient_name);
CREATE INDEX idx_cases_owner_phone ON cases(owner_phone);
```

**3. Normalized Clients Table**

```sql
CREATE TABLE clients (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  clinic_id uuid REFERENCES clinics(id),

  -- Normalized contact (source-agnostic)
  full_name text,
  phone text,                          -- Primary dedup key
  email text,

  -- External IDs (can have multiple per PIMS)
  external_ids jsonb,                  -- {"idexx_neo": "11525", "avimark": "C-1234"}

  UNIQUE(user_id, phone)
);
```

**4. Normalized Patients Table**

```sql
CREATE TABLE patients_v2 (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  client_id uuid REFERENCES clients(id),

  -- Normalized patient info
  name text NOT NULL,
  species text,
  breed text,

  -- External IDs (can have multiple per PIMS)
  external_ids jsonb,                  -- {"idexx_neo": "33139", "avimark": "P-5678"}

  UNIQUE(user_id, client_id, name)
);
```

### Data Flow: Any PIMS

```
┌─────────────────┐
│  PIMS Adapter   │  ← One adapter per PIMS
│  (IDEXX, etc)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Normalized Ingestion Interface                             │
│                                                             │
│  {                                                          │
│    source: 'idexx_neo' | 'avimark' | 'cornerstone' | ...,  │
│    external_id: string,                                     │
│    patient: { name, species, breed },                       │
│    owner: { name, phone, email },                           │
│    visit: { reason, type, provider },                       │
│    clinical_notes: string,                                  │
│    raw_data: { ... }  // Original PIMS response             │
│  }                                                          │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Upsert Client  │────>│  Upsert Patient │────>│  Create Case    │
│  (by phone)     │     │  (by name+owner)│     │  (always new)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Adapter Interface

```typescript
interface PimsAdapter {
  source: ExternalSource;

  // Transform PIMS-specific data to normalized format
  normalize(rawData: unknown): NormalizedCaseInput;

  // Extract dedup keys
  getClientKey(rawData: unknown): { phone: string } | null;
  getPatientKey(rawData: unknown): { name: string; clientId: string } | null;
}

interface NormalizedCaseInput {
  // Source tracking
  source: ExternalSource;
  externalId: string;
  externalAppointmentId?: string;
  externalConsultationId?: string;

  // Normalized fields
  patient: {
    name: string;
    species?: string;
    breed?: string;
  };

  owner: {
    name: string;
    phone: string;
    email?: string;
  };

  visit: {
    reason?: string;
    type?: string;
    provider?: string;
    status?: string;
  };

  clinicalNotes?: string;

  // Preserve raw data
  rawData: Record<string, unknown>;
}
```

### Example: Adding AVImark Support

**Step 1: Create adapter**

```typescript
const avimarkAdapter: PimsAdapter = {
  source: "avimark",

  normalize(raw: AvimarkData): NormalizedCaseInput {
    return {
      source: "avimark",
      externalId: `avimark-${raw.visitId}`,
      patient: {
        name: raw.patientName,
        species: raw.speciesCode,
        breed: raw.breedDescription,
      },
      owner: {
        name: `${raw.clientFirstName} ${raw.clientLastName}`,
        phone: raw.clientPhone1 || raw.clientPhone2,
        email: raw.clientEmail,
      },
      visit: {
        reason: raw.reasonForVisit,
        type: raw.visitType,
        provider: raw.doctorName,
      },
      clinicalNotes: raw.soapNotes,
      rawData: raw,
    };
  },

  getClientKey(raw: AvimarkData) {
    return { phone: raw.clientPhone1 || raw.clientPhone2 };
  },

  getPatientKey(raw: AvimarkData) {
    return { name: raw.patientName, clientId: raw.clientId };
  },
};
```

**Step 2: Register adapter**

```typescript
const adapters: Record<ExternalSource, PimsAdapter> = {
  idexx_neo: idexxNeoAdapter,
  avimark: avimarkAdapter,
  // Add more as needed
};
```

**Step 3: Use unified ingestion**

```typescript
async function ingestFromPims(
  source: ExternalSource,
  rawData: unknown,
  userId: string
) {
  const adapter = adapters[source];
  const normalized = adapter.normalize(rawData);

  // Same ingestion logic for ALL PIMS
  const client = await upsertClient(normalized.owner, userId);
  const patient = await upsertPatient(normalized.patient, client.id, userId);
  const case = await createCase(normalized, patient.id, client.id, userId);

  return case;
}
```

### Benefits of This Approach

| Benefit                   | Description                                                 |
| ------------------------- | ----------------------------------------------------------- |
| **Single ingestion path** | All PIMS use same `ingestFromPims()` function               |
| **Unified queries**       | Query by `patient_name`, `owner_phone` regardless of source |
| **Easy to add PIMS**      | Just create new adapter, no schema changes                  |
| **Audit trail**           | Raw PIMS data preserved in `pims_data` jsonb                |
| **Deduplication works**   | Same client/patient logic for all sources                   |
| **Source tracking**       | Always know where data came from                            |

### Migration Path

1. **Phase 1**: Add `external_source` enum and normalized columns
2. **Phase 2**: Create IDEXX adapter, migrate existing data
3. **Phase 3**: Refactor ingestion to use adapter pattern
4. **Phase 4**: Add new PIMS adapters as needed

---

## Platform Context

**ODIS AI** is a veterinary technology platform with two primary data ingestion points:

| Source               | Entry Point                      | Data Flow                                |
| -------------------- | -------------------------------- | ---------------------------------------- |
| **iOS Scribe**       | Direct Supabase + Edge Functions | Audio → Transcription → SOAP → Discharge |
| **Chrome Extension** | POST `/api/cases/ingest`         | IDEXX Neo → Case + Patient extraction    |

**Current Scale:**

- 43 database tables
- ~11,000+ total rows
- 87 migrations applied
- 2 active clinics

---

## Current State Overview

### Entity Relationship (Current)

```
User
  └── Case (visit)
        └── Patient (attached to case)  ← PROBLEM: Patient belongs to case
        └── SOAP Note
        └── Discharge Summary
        └── Transcription
        └── Scheduled Call
        └── Scheduled Email
```

**Why this is problematic:**

- Same pet synced multiple times = multiple Patient records
- Can't query "all visits for patient Max"
- Can't query "all pets owned by John Smith"
- No patient history across visits

---

## Table Health Assessment

### Core Medical Tables

| Table                 | Rows  | Status        | Issues                                             |
| --------------------- | ----- | ------------- | -------------------------------------------------- |
| `cases`               | 1,979 | ⚠️ Needs work | Metadata sprawl, missing discharge workflow fields |
| `patients`            | 1,946 | ⚠️ Needs work | Backwards relationship, owner data embedded        |
| `soap_notes`          | 950   | ✅ Good       | Well-structured                                    |
| `discharge_summaries` | 1,669 | ✅ Good       | Well-structured                                    |
| `transcriptions`      | 1,111 | ⚠️ Needs work | Should unify with IDEXX consultation notes         |

### Call Tables

| Table                       | Rows | Status        | Issues                                  |
| --------------------------- | ---- | ------------- | --------------------------------------- |
| `scheduled_discharge_calls` | 552  | ⚠️ Fragment   | Outbound only, retry logic in JSONB     |
| `inbound_vapi_calls`        | 42   | ⚠️ Fragment   | Uses text clinic_name, different schema |
| `retell_calls`              | 37   | ❌ Deprecated | Legacy system, should archive           |

### Organization Tables

| Table               | Rows | Status      | Issues                                             |
| ------------------- | ---- | ----------- | -------------------------------------------------- |
| `users`             | 29   | ⚠️ Needs FK | Has `clinic_name` (text), needs `clinic_id` (UUID) |
| `clinics`           | 2    | ✅ Good     | Primary clinic entity                              |
| `clinic_assistants` | 0    | ⚠️ Text FK  | Uses `clinic_name` instead of `clinic_id`          |

### Unused Tables

| Table           | Rows | Notes                           |
| --------------- | ---- | ------------------------------- |
| `generations`   | 0    | Generic AI content - never used |
| `audio_files`   | 0    | Audio metadata - never used     |
| `vital_signs`   | 0    | Vital signs - never used        |
| `feature_usage` | 0    | Analytics - never used          |
| `error_logs`    | 0    | Error tracking - never used     |
| `call_patients` | 0    | Legacy Retell - deprecated      |

---

## Key Issues

### Issue 1: Dual Clinic Identification

**Current State:**

```
users.clinic_name = 'Alum Rock Animal Hospital'     ← TEXT (legacy)
clinics.id = 'uuid-here'                            ← UUID (newer)
providers.clinic_id = 'uuid-here'                   ← UUID FK
inbound_vapi_calls.clinic_name = 'Alum Rock...'     ← TEXT (inconsistent!)
```

**Problems:**

- Text matching is fragile ("Alum Rock" vs "alum rock")
- No referential integrity
- RLS policies use inefficient text comparison
- Can't CASCADE deletes

**Proposed State:**

```
users.clinic_id → clinics.id                        ← UUID FK
inbound_vapi_calls.clinic_id → clinics.id           ← UUID FK
clinic_assistants.clinic_id → clinics.id            ← UUID FK
```

---

### Issue 2: Call System Fragmentation

**Current State:**

```
┌─────────────────────────┐
│  scheduled_discharge_   │  552 rows - outbound discharge calls
│  calls                  │  retry_count buried in metadata JSONB
└─────────────────────────┘

┌─────────────────────────┐
│  inbound_vapi_calls     │  42 rows - inbound calls
│                         │  different column names, text clinic_name
└─────────────────────────┘

┌─────────────────────────┐
│  retell_calls           │  37 rows - DEPRECATED legacy system
└─────────────────────────┘
```

**Problems:**

- Can't query "all calls for user X" across tables
- Different schemas for same data
- Retry logic buried in JSONB metadata
- Duplicate CRUD logic in repositories

**Proposed State:**

```
┌─────────────────────────┐
│  calls                  │  Unified table
│                         │
│  direction: inbound |   │  ← Discriminator
│             outbound    │
│                         │
│  call_type: discharge | │  ← Type
│             follow_up | │
│             appointment │
│                         │
│  retry_count: integer   │  ← Extracted from JSONB
│  max_retries: integer   │
└─────────────────────────┘
```

---

### Issue 3: Patient/Owner Data Fragmentation

**Current State - Same data in 4+ places:**

```
patients.owner_name ────────────────┐
patients.owner_phone ───────────────┤
patients.owner_email ───────────────┤
                                    │
cases.metadata.idexx.client_name ───┼──→ "John Smith"
cases.metadata.idexx.client_phone ──┤    "408-555-1234"
                                    │
cases.entity_extraction.            │
  patient.owner.name ───────────────┤
cases.entity_extraction.            │
  patient.owner.phone ──────────────┘
```

**Problems:**

- No single source of truth
- Same owner created multiple times
- Can't query "all patients for John Smith"
- No communication preferences
- Update owner phone = update 4 places

**Proposed State:**

```
┌─────────────┐
│  clients    │  ← Single source of truth for pet owners
│             │
│  full_name  │
│  phone      │
│  email      │
│  preferences│
└──────┬──────┘
       │ owns
       ▼
┌─────────────┐
│  patients   │  ← Pets linked to owner
│             │
│  client_id ─┼──→ clients.id
│  name       │
│  species    │
└─────────────┘
```

---

### Issue 4: Backwards Patient-Case Relationship

**Current State:**

```
cases
  └── patients (patient.case_id → cases.id)
```

Patient belongs to case. Same pet = multiple patient records.

**Proposed State:**

```
patients
  └── cases (case.patient_id → patients.id)
```

Case belongs to patient. Same pet = one patient, multiple cases.

**Query Impact:**

| Query                | Current                  | Proposed                                     |
| -------------------- | ------------------------ | -------------------------------------------- |
| All visits for "Max" | Complex JOIN, unreliable | `SELECT * FROM cases WHERE patient_id = ?`   |
| Patient history      | Not possible             | Simple patient lookup                        |
| Owner's pets         | Not possible             | `SELECT * FROM patients WHERE client_id = ?` |

---

### Issue 5: Metadata JSONB Sprawl

**Current State - Critical data buried in JSONB:**

```sql
cases.metadata = {
  "idexx": {
    "patient_name": "Max",           ← Can't index
    "client_phone": "408-555-1234",  ← Can't index
    "provider_name": "Dr. Smith",    ← Can't index
    "appointment_id": "12345"        ← Can't index
  },
  "callIntelligence": {
    "callApproach": "brief-checkin", ← Can't index
    "shouldAskClinicalQuestions": true
  }
}
```

**Problems:**

- Can't create indexes on JSONB paths efficiently
- Query performance suffers
- No schema validation
- Easy to have inconsistent data

**Proposed State:**

```sql
cases.patient_name = 'Max'                    ← Indexed column
cases.owner_phone = '408-555-1234'            ← Indexed column
cases.provider_name = 'Dr. Smith'             ← Indexed column
cases.idexx_appointment_id = '12345'          ← Indexed column
cases.call_approach = 'brief-checkin'         ← Indexed column
cases.discharge_status = 'call_scheduled'     ← NEW: Workflow tracking
cases.metadata = { ... }                      ← Keep for truly flexible data
```

---

### Issue 6: Clinical Notes Inconsistency

**Current State:**

| Source     | Storage                                           |
| ---------- | ------------------------------------------------- |
| iOS Scribe | `transcriptions` table                            |
| IDEXX Neo  | `cases.metadata.idexx.consultation_notes` (JSONB) |

**Proposed State:**

```
┌─────────────────────────┐
│  clinical_notes         │  Unified table
│                         │
│  note_type:             │
│    - transcription      │  ← iOS audio
│    - consultation_notes │  ← IDEXX
│    - clinical_notes     │  ← Manual
│                         │
│  content: text          │
│  speaker_segments: jsonb│  ← For transcriptions
└─────────────────────────┘
```

---

## Proposed Entity Relationship (Future)

```
┌─────────────┐
│   clinics   │
└──────┬──────┘
       │
       │ has many
       ▼
┌─────────────┐        ┌─────────────┐
│    users    │───────<│   clients   │  ← NEW: Pet owners
└──────┬──────┘        └──────┬──────┘
       │                      │
       │                      │ owns
       │                      ▼
       │               ┌─────────────┐
       │               │  patients   │  ← Restructured: Pets
       │               │   (pets)    │
       │               └──────┬──────┘
       │                      │
       │                      │ has visits
       │                      ▼
       │               ┌─────────────┐
       └──────────────>│    cases    │<────────────────┐
                       │  (visits)   │                 │
                       └──────┬──────┘                 │
                              │                        │
          ┌───────────────────┼────────────────┐       │
          ▼                   ▼                ▼       │
   ┌─────────────┐    ┌───────────┐    ┌─────────────┐│
   │ clinical_   │    │soap_notes │    │ discharge_  ││
   │ notes       │    │           │    │ summaries   ││
   └─────────────┘    └───────────┘    └─────────────┘│
                                                      │
┌─────────────┐                                       │
│    calls    │───────────────────────────────────────┘
│  (unified)  │
└─────────────┘
```

---

## Deduplication Strategy

### The Problem

**Current behavior when "Max" (owned by John Smith) visits 3 times:**

```
patients table:
┌────────────────────────────────────────────────────────────────┐
│ id: uuid-1, name: "Max", owner_phone: "408-555-1234", case_id: case-1 │
│ id: uuid-2, name: "Max", owner_phone: "408-555-1234", case_id: case-2 │
│ id: uuid-3, name: "Max", owner_phone: "408-555-1234", case_id: case-3 │
└────────────────────────────────────────────────────────────────┘
```

3 patient records for the same dog. No way to know they're the same pet.

**Current behavior when John Smith has 2 pets (Max and Bella):**

```
patients table:
┌────────────────────────────────────────────────────────────────┐
│ id: uuid-1, name: "Max",   owner_name: "John Smith", owner_phone: "408-555-1234" │
│ id: uuid-2, name: "Bella", owner_name: "John Smith", owner_phone: "408-555-1234" │
└────────────────────────────────────────────────────────────────┘
```

Owner data duplicated. No `clients` entity. Can't query "all of John's pets."

---

### The Solution: Two-Level Deduplication

**Level 1: Deduplicate Clients (Pet Owners)**

```
Deduplication key: (user_id, phone)
```

Same phone number under same vet = same client.

```sql
clients table:
┌─────────────────────────────────────────────────────────────┐
│ id: client-1                                                │
│ user_id: vet-user-id                                        │
│ full_name: "John Smith"                                     │
│ phone: "408-555-1234"        ← Dedup key                    │
│ email: "john@example.com"                                   │
│ preferred_contact_method: "phone"                           │
│ do_not_contact: false                                       │
└─────────────────────────────────────────────────────────────┘
```

**Level 2: Deduplicate Patients (Pets)**

```
Deduplication key: (user_id, client_id, name) OR (user_id, external_id)
```

Same pet name under same owner = same pet.
OR if IDEXX provides a patient ID, use that.

```sql
patients_v2 table:
┌─────────────────────────────────────────────────────────────┐
│ id: patient-1                                               │
│ user_id: vet-user-id                                        │
│ client_id: client-1          ← Links to owner               │
│ name: "Max"                                                 │
│ species: "dog"                                              │
│ breed: "Golden Retriever"                                   │
│ external_id: "idexx-patient-456"  ← From IDEXX if available │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ id: patient-2                                               │
│ user_id: vet-user-id                                        │
│ client_id: client-1          ← Same owner                   │
│ name: "Bella"                                               │
│ species: "cat"                                              │
│ breed: "Siamese"                                            │
└─────────────────────────────────────────────────────────────┘
```

**Level 3: Cases Reference Patients**

```sql
cases table:
┌─────────────────────────────────────────────────────────────┐
│ id: case-1, patient_id: patient-1, created_at: 2024-01-15   │  ← Visit 1
│ id: case-2, patient_id: patient-1, created_at: 2024-03-20   │  ← Visit 2
│ id: case-3, patient_id: patient-1, created_at: 2024-06-10   │  ← Visit 3
└─────────────────────────────────────────────────────────────┘
```

One patient record, three case records. Proper history.

---

### Ingestion Flow (After Migration)

**When IDEXX data comes in:**

```
1. Extract owner phone from IDEXX data
2. UPSERT into clients:
   - Key: (user_id, phone)
   - If exists: update name/email if changed
   - If new: create client record

3. Extract pet info from IDEXX data
4. UPSERT into patients_v2:
   - Key: (user_id, client_id, name) OR (user_id, external_id)
   - If exists: update breed/weight if changed
   - If new: create patient record

5. CREATE case:
   - Link to patient_id
   - Link to client_id (denormalized for query performance)

6. Result: Same pet visiting = same patient record, new case record
```

**Pseudocode:**

```typescript
async function ingestCase(data: IdexxData, userId: string) {
  // Step 1: Find or create client
  const client = await upsertClient({
    user_id: userId,
    phone: data.owner_phone,  // Dedup key
    full_name: data.owner_name,
    email: data.owner_email,
  });

  // Step 2: Find or create patient
  const patient = await upsertPatient({
    user_id: userId,
    client_id: client.id,
    name: data.pet_name,      // Dedup key (with client_id)
    species: data.species,
    breed: data.breed,
    external_id: data.idexx_patient_id,  // Alternative dedup key
  });

  // Step 3: Create case (always new)
  const case = await createCase({
    user_id: userId,
    patient_id: patient.id,
    client_id: client.id,
    // ... rest of case data
  });

  return case;
}
```

---

### Query Capabilities After Migration

| Query                         | SQL                                                            |
| ----------------------------- | -------------------------------------------------------------- |
| All visits for "Max"          | `SELECT * FROM cases WHERE patient_id = ?`                     |
| All pets for John Smith       | `SELECT * FROM patients_v2 WHERE client_id = ?`                |
| Patient visit history         | `SELECT * FROM cases WHERE patient_id = ? ORDER BY created_at` |
| Client contact info           | `SELECT * FROM clients WHERE id = ?`                           |
| Update owner phone everywhere | `UPDATE clients SET phone = ? WHERE id = ?` (one place!)       |
| Clients to not contact        | `SELECT * FROM clients WHERE do_not_contact = true`            |

---

### Edge Cases

**Different phone numbers for same person:**

- Creates separate client records (intentional - phone is the dedup key)
- Can manually merge if needed via admin tool

**Same pet name, different owners:**

- No problem - dedup key includes `client_id`
- John's "Max" ≠ Jane's "Max"

**Pet name changed:**

- IDEXX external_id (if available) handles this
- Otherwise creates new patient record (acceptable trade-off)

**No phone number:**

- Can't deduplicate client reliably
- Falls back to creating new records (current behavior)
- Flag for manual review

---

## Migration Strategy

### Phase 1: Foundation (Non-breaking)

- Add `clinic_id` UUID FK to tables using `clinic_name` text
- Backfill from existing data
- Keep old columns, add new ones

### Phase 2: Call Unification (Backwards-compatible)

- Create unified `calls` table
- Migrate data from 3 existing tables
- Create views for old table names → old code keeps working

### Phase 3: Client/Patient Normalization

- Create `clients` table for pet owners
- Create `patients_v2` with correct relationships
- Deduplicate existing patient records
- Update cases to reference new tables

### Phase 4: Cases Enhancement

- Extract JSONB fields to indexed columns
- Add discharge workflow fields
- Create `clinical_notes` unified table

### Phase 5: Cleanup (After verification)

- Deprecate old tables
- Remove redundant columns
- Drop backwards-compatible views

---

## Tables Summary

### New Tables to Create

| Table            | Purpose                                          |
| ---------------- | ------------------------------------------------ |
| `calls`          | Unified inbound/outbound call tracking           |
| `clients`        | Pet owner contact info and preferences           |
| `patients_v2`    | Restructured patients with correct relationships |
| `clinical_notes` | Unified transcriptions + consultation notes      |

### Tables to Deprecate

| Table                       | Replacement      | Timeline        |
| --------------------------- | ---------------- | --------------- |
| `retell_calls`              | Archive only     | Immediate       |
| `call_patients`             | `clients`        | Immediate       |
| `scheduled_discharge_calls` | `calls`          | After migration |
| `inbound_vapi_calls`        | `calls`          | After migration |
| `patients`                  | `patients_v2`    | After migration |
| `transcriptions`            | `clinical_notes` | After migration |

### Tables Unchanged

| Table                 | Status     |
| --------------------- | ---------- |
| `clinics`             | Good as-is |
| `soap_notes`          | Good as-is |
| `discharge_summaries` | Good as-is |
| `providers`           | Good as-is |
| `appointments`        | Good as-is |

---

## Key Benefits After Migration

| Benefit                         | Impact                                         |
| ------------------------------- | ---------------------------------------------- |
| Query "all visits for Max"      | Simple patient lookup instead of complex JOINs |
| Query "all pets for John Smith" | Direct client → patients relationship          |
| Patient history across visits   | Single patient record, multiple cases          |
| Unified call queries            | One table, one repository, one schema          |
| Faster clinic lookups           | UUID indexes instead of text comparison        |
| Better RLS performance          | UUID-based policies                            |
| Indexable search fields         | Extracted from JSONB to columns                |
| Communication preferences       | Per-client settings                            |
| Discharge workflow tracking     | Explicit status fields                         |

---

## Justifications

### Why Unify Call Tables?

**Current Pain:**

- 3 repositories with duplicate CRUD logic
- Bug fixes applied to one table but not others
- Dashboard queries require UNION across tables
- Retry logic hidden in JSONB (no visibility, no alerting)

**Business Impact:**

- Engineers spend extra time maintaining 3 codepaths
- Risk of data inconsistency between tables
- Can't build unified call analytics dashboard
- Can't easily answer "how many total calls this week?"

**Technical Debt Cost:**

- Every new call feature = implement 3 times
- RLS policies duplicated across tables
- Type definitions duplicated

**Justification:** A unified `calls` table with `direction` and `call_type` discriminators eliminates duplication while supporting all existing use cases. Backwards-compatible views ensure zero downtime during migration.

---

### Why Create Clients Table?

**Current Pain:**

- Owner data duplicated in patients, cases.metadata, entity_extraction
- No way to update a phone number across all records
- Can't track "do not contact" preferences
- Can't query "all patients owned by X"

**Business Impact:**

- Calling wrong numbers due to stale data
- No communication preference tracking (bad UX)
- Can't build client-centric features
- Compliance risk (no opt-out tracking)

**Technical Debt Cost:**

- Every owner update = update 4+ locations
- Data sync bugs when sources disagree
- No single source of truth for contact info

**Justification:** Veterinary practices think in terms of clients (pet owners) and their pets. The current schema inverts this, making client-centric features impossible. A `clients` table matches the real-world domain model.

---

### Why Reverse Patient-Case Relationship?

**Current Pain:**

- Same pet synced multiple times = multiple Patient records
- "Max" appears 5 times for 5 visits (should be 1 patient, 5 cases)
- Can't show patient visit history
- Can't track patient health trends over time

**Business Impact:**

- No patient history view in dashboard
- Can't build "patient timeline" feature
- Duplicate patient data bloats database
- Confusing UX when same pet appears multiple times

**Technical Debt Cost:**

- Deduplication logic scattered in application code
- Complex JOINs to approximate patient history
- Data quality degrades over time

**Justification:** In veterinary medicine, a patient (pet) exists independently of visits. The pet comes in multiple times. The current model (patient belongs to case) inverts this reality. Correcting the relationship enables patient history, health trends, and proper deduplication.

---

### Why Add clinic_id UUID FKs?

**Current Pain:**

- Text-based `clinic_name` matching is fragile
- "Alum Rock" vs "Alum Rock Animal Hospital" causes mismatches
- RLS policies use inefficient text subqueries
- No CASCADE delete support

**Business Impact:**

- Potential data access bugs from text mismatch
- Slower dashboard queries (text vs UUID comparison)
- Risk of orphaned records

**Technical Debt Cost:**

- Special-case string normalization logic
- Inconsistent clinic references across tables
- Can't leverage Postgres FK constraints

**Justification:** UUID foreign keys are the PostgreSQL standard for referential integrity. They enable CASCADE behaviors, efficient indexes, and reliable RLS policies. Text matching is an anti-pattern that should be eliminated.

---

### Why Extract JSONB to Columns?

**Current Pain:**

- Can't create efficient indexes on `metadata->'idexx'->>'client_phone'`
- Full table scans for common queries
- No schema validation on JSONB content
- Easy to have inconsistent field names

**Business Impact:**

- Slow dashboard load times
- Can't efficiently filter by patient name, owner phone, etc.
- Data quality issues from schema drift

**Technical Debt Cost:**

- Complex JSONB path queries in application code
- Type safety lost (everything is `any`)
- Debugging difficult without clear schema

**Justification:** JSONB is excellent for truly flexible/unknown data. But when the same fields are queried repeatedly (`patient_name`, `owner_phone`, `call_approach`), they should be promoted to indexed columns. Keep JSONB for overflow/future data.

---

### Why Unify Clinical Notes?

**Current Pain:**

- iOS transcriptions in `transcriptions` table
- IDEXX consultation notes in `cases.metadata.idexx.consultation_notes`
- Can't query "all clinical notes for case X"

**Business Impact:**

- Inconsistent clinical documentation across sources
- Can't build unified notes view
- Search across notes requires checking multiple locations

**Technical Debt Cost:**

- Different code paths for different note types
- No unified schema for clinical content

**Justification:** Clinical notes are clinical notes regardless of source. A unified `clinical_notes` table with a `note_type` discriminator enables consistent handling while preserving source information.

---

## Risk Mitigation

1. **All changes are additive** - Never drop columns/tables immediately
2. **Backwards-compatible views** - Old code keeps working during transition
3. **Dual-write period** - Write to both old and new for verification
4. **Test on Supabase branch** - Before production deployment
5. **Rollback scripts ready** - For each migration phase

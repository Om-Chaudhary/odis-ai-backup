# OdisAI VAPI Appointment Management System
## Complete Technical Architecture Documentation

**Version:** 1.0  
**Last Updated:** January 2025  
**System:** Voice AI Appointment Management for Veterinary Clinics  
**PIMS Integration:** IDEXX Neo (via Playwright browser automation)

---

# Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Data Flow Patterns](#3-data-flow-patterns)
4. [Layer 1: VAPI Tool Calls](#4-layer-1-vapi-tool-calls)
5. [Layer 2: PIMS-Sync Workflows](#5-layer-2-pims-sync-workflows)
6. [Layer 3: Primitives](#6-layer-3-primitives)
7. [Database Schema](#7-database-schema)
8. [Atomic Transactions](#8-atomic-transactions)
9. [Error Handling](#9-error-handling)
10. [API Reference](#10-api-reference)
11. [Security Considerations](#11-security-considerations)
12. [Implementation Checklist](#12-implementation-checklist)

---

# 1. Executive Summary

## 1.1 Purpose

The OdisAI VAPI Appointment Management System enables veterinary clinic clients to manage appointments through natural voice conversations. Callers can:

| Capability | Description |
|------------|-------------|
| ✅ **Confirm** | Verify existing appointments by pet name and date |
| ✅ **Check Availability** | Query open appointment slots |
| ✅ **Book** | Create new appointments (new or existing clients) |
| ✅ **Cancel** | Cancel existing appointments with verbal consent |
| ✅ **Reschedule** | Move appointments to new times atomically |

## 1.2 Key Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Read-fast, Write-safe** | Reads query local synced data (fast); writes go through PIMS-Sync (reliable) |
| **Never lose appointments** | Atomic transactions with rollback for reschedules |
| **Explicit consent** | All destructive operations require verbal confirmation |
| **Graceful degradation** | Errors direct callers to office phone number |
| **Audit everything** | All operations logged for compliance and debugging |

## 1.3 Technology Stack

| Component | Technology |
|-----------|------------|
| Voice AI | VAPI |
| Backend | Node.js / Python |
| Database | PostgreSQL (OdisAI) |
| PIMS Integration | Playwright (browser automation) |
| Target PIMS | IDEXX Neo |
| Sync | Nightly batch jobs |

---

# 2. System Architecture Overview

## 2.1 Three-Layer Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         LAYER 1: VAPI TOOL CALLS                            │
│                           (Voice AI Interface)                              │
│                                                                             │
│   ┌─────────────────────────────┐     ┌─────────────────────────────────┐   │
│   │      READ OPERATIONS        │     │       WRITE OPERATIONS          │   │
│   │      (Query Local DB)       │     │       (Call PIMS-Sync)          │   │
│   │                             │     │                                 │   │
│   │  • appointment_verification │     │  • cancel_appointment           │   │
│   │  • confirm_appointment      │     │  • reschedule_appointment       │   │
│   │  • check_availability       │     │  • book_appointment             │   │
│   │                             │     │                                 │   │
│   │         🟢 FAST             │     │         🟠 RELIABLE             │   │
│   └──────────────┬──────────────┘     └──────────────┬──────────────────┘   │
│                  │                                   │                      │
│                  │ SQL Queries                       │ HTTP POST            │
│                  ▼                                   ▼                      │
└─────────────────────────────────────────────────────────────────────────────┘
                   │                                   │
                   │                                   │
┌──────────────────▼───────────────┐   ┌──────────────▼──────────────────────┐
│                                  │   │                                     │
│      OdisAI LOCAL DATABASE       │   │     LAYER 2: PIMS-SYNC WORKFLOWS    │
│                                  │   │        (Orchestration Layer)        │
│  ┌────────────────────────────┐  │   │                                     │
│  │   synced_appointments      │  │   │  • schedule_appointment             │
│  │   synced_slots             │  │   │  • cancel_appointment               │
│  │   booked_appointments      │  │   │  • reschedule_appointment           │
│  │   clients                  │  │   │                                     │
│  │   patients                 │  │   │  Orchestrates Primitives            │
│  └────────────────────────────┘  │   │  Manages Transactions               │
│                                  │   │  Updates Local Database             │
│  Updated via Nightly Sync        │   │                                     │
│  from IDEXX Neo                  │   └──────────────┬──────────────────────┘
│                                  │                  │
└──────────────────────────────────┘                  │ HTTP Calls
                                                      ▼
                                   ┌──────────────────────────────────────────┐
                                   │                                          │
                                   │        LAYER 3: PRIMITIVES               │
                                   │      (Atomic Playwright Operations)      │
                                   │                                          │
                                   │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │
                                   │  │ CLIENT   │ │ PATIENT  │ │APPOINTMENT│ │
                                   │  │ Search   │ │ Search   │ │ Get      │  │
                                   │  │ DupCheck │ │ Create   │ │ Create   │  │
                                   │  │ Create   │ │          │ │ Cancel   │  │
                                   │  └────┬─────┘ └────┬─────┘ └────┬─────┘  │
                                   │       │           │            │         │
                                   └───────┼───────────┼────────────┼─────────┘
                                           │           │            │
                                           └───────────┼────────────┘
                                                       │
                                                       ▼
                                   ┌──────────────────────────────────────────┐
                                   │            PLAYWRIGHT BROWSER            │
                                   │         Automates IDEXX Neo UI           │
                                   └──────────────────────────────────────────┘
                                                       │
                                                       ▼
                                   ┌──────────────────────────────────────────┐
                                   │              IDEXX NEO                   │
                                   │         (Veterinary PIMS)                │
                                   │         Source of Truth                  │
                                   └──────────────────────────────────────────┘
```

## 2.2 Layer Responsibilities

| Layer | Name | Responsibility | Latency |
|-------|------|---------------|---------|
| **1** | VAPI Tool Calls | Voice interface, conversation flow, consent | ~100ms (reads), ~5s (writes) |
| **2** | PIMS-Sync Workflows | Business logic, orchestration, transactions | ~3-10s |
| **3** | Primitives | Single IDEXX operations via Playwright | ~1-5s each |

## 2.3 Component Summary

### Layer 1: VAPI Tools

| Tool | Type | Description |
|------|------|-------------|
| `appointment_verification` | Internal | Helper that verifies appointment exists |
| `confirm_appointment` | Read | Confirms appointment to caller |
| `check_availability` | Read | Finds available slots |
| `cancel_appointment` | Write | Cancels with consent |
| `reschedule_appointment` | Write | Atomic move to new time |
| `book_appointment` | Write | Creates new appointment |

### Layer 2: PIMS-Sync Workflows

| Workflow | Triggered By | Primitives Used |
|----------|--------------|-----------------|
| `schedule_appointment` | `book_appointment` | Up to 5 |
| `cancel_appointment` | `cancel_appointment` | Up to 3 |
| `reschedule_appointment` | `reschedule_appointment` | Up to 4 (atomic) |

### Layer 3: Primitives

| Category | Primitives |
|----------|------------|
| **Client** | Search, Duplicate Check, Create |
| **Patient** | Search, Create |
| **Appointment** | Get, Create, Cancel |

---

# 3. Data Flow Patterns

## 3.1 Read Operations (Fast Path)

**Used by:** `appointment_verification`, `confirm_appointment`, `check_availability`

```
Caller → VAPI Tool → Local Database → Response to Caller

Latency: ~100-500ms
Data source: Nightly-synced tables
No IDEXX calls during conversation
```

### Why This Works

- Appointments and availability are synced from IDEXX nightly
- AI-booked appointments are stored in `booked_appointments` immediately
- Both tables are queried, ensuring recent bookings are found

## 3.2 Write Operations (Safe Path)

**Used by:** `cancel_appointment`, `reschedule_appointment`, `book_appointment`

```
Caller → VAPI Tool → PIMS-Sync Workflow → Primitives → Playwright → IDEXX Neo
                            │
                            └→ Update Local Database
                            
Latency: 3-15 seconds
All changes written to IDEXX in real-time
Local DB updated to reflect changes
```

## 3.3 Atomic Transaction (Reschedule)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATOMIC TRANSACTION                           │
│                                                                 │
│  1. BACKUP ──→ 2. CANCEL ──→ 3. CREATE ──→ 4. RESULT           │
│                    │              │                             │
│                    │              ├──→ Success: COMMIT          │
│                    │              │                             │
│                    │              └──→ Failure: ROLLBACK        │
│                    │                      │                     │
│                    │                      └──→ Restore Original │
│                    │                                            │
│                    └──→ Failure: ABORT (no changes)             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Guarantee: Caller NEVER ends up without an appointment
```

---

# 4. Layer 1: VAPI Tool Calls

## 4.1 Tool Overview Table

| Tool | Type | Purpose | Calls PIMS-Sync? |
|------|------|---------|------------------|
| `appointment_verification` | Internal Helper | Verify appointment exists | ❌ No |
| `confirm_appointment` | Read | Confirm to caller | ❌ No |
| `check_availability` | Read | Find open slots | ❌ No |
| `cancel_appointment` | Write | Cancel with consent | ✅ Yes |
| `reschedule_appointment` | Write | Atomic move | ✅ Yes |
| `book_appointment` | Write | Create appointment | ✅ Yes |

---

## 4.2 `appointment_verification` (Internal Helper)

### Purpose
Verify that an appointment exists for a given patient on a given date. This is an internal helper called by other tools.

### Data Source
Local database only (`booked_appointments` and `synced_appointments` tables)

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `owner_name` | string | Yes* | Pet owner's name |
| `patient_name` | string | Yes* | Pet's name |
| `appointment_date` | date | Yes* | Date to check |

*If not provided, VAPI will ask the caller

### Logic Flow

```
1. Validate required inputs
   └─ If missing, prompt caller
   
2. Query booked_appointments
   WHERE owner_name LIKE %input%
   AND patient_name LIKE %input%
   AND appointment_date = input
   AND status = 'scheduled'
   
3. If not found → Query synced_appointments
   WHERE owner_first_name LIKE %input%
   AND patient_name LIKE %input%
   AND appointment_date = input
   AND status != 'cancelled'
   
4. Return result
   └─ FOUND: appointment details
   └─ DOES_NOT_EXIST: message
```

### Return Schema

```typescript
// Success
{
  status: 'FOUND',
  appointment_id: string,
  idexx_appointment_id: string,
  appointment_time: string,      // "14:30"
  appointment_time_end: string,  // "15:00"
  appointment_date: string,      // "2025-01-28"
  provider_name: string,
  appointment_type: string,
  room: string,
  source: 'booked' | 'synced'
}

// Not Found
{
  status: 'DOES_NOT_EXIST',
  message: 'No appointment found for [patient] on [date]'
}
```

---

## 4.3 `confirm_appointment` (Read Only)

### Purpose
Confirm that an appointment exists and provide details to the caller.

### Data Source
Local database via `appointment_verification`

### Sample Conversation

```
VAPI: "I'd be happy to confirm your appointment.
       May I have the pet owner's name?"
       
Caller: "John Smith"

VAPI: "And what is your pet's name?"

Caller: "Buddy"

VAPI: "What date is the appointment?"

Caller: "Tomorrow"

[Calls appointment_verification internally]

─── IF FOUND: ───
VAPI: "Yes, I can confirm that Buddy has an appointment
       scheduled for 2:30 PM tomorrow, Tuesday January 28th,
       with Dr. Martinez. This is a wellness exam appointment.
       
       Is there anything else I can help you with?"

─── IF NOT FOUND: ───
VAPI: "I don't see an appointment scheduled for Buddy tomorrow.
       Would you like me to check a different date, or would
       you like to schedule a new appointment?"
```

### Follow-up Routing

| Caller Response | Next Action |
|-----------------|-------------|
| "I want to cancel" | Route to `cancel_appointment` |
| "I need to reschedule" | Route to `reschedule_appointment` |
| "Book a new one" | Route to `book_appointment` |
| "Check another date" | Repeat with new date |
| "That's all, thanks" | End conversation |

---

## 4.4 `check_availability` (Read Only)

### Purpose
Find available appointment slots from synced data.

### Data Source
`synced_slots` table

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `requested_date` | date | Yes | Date to check |
| `time_preference` | enum | No | `morning`, `afternoon`, `evening` |
| `appointment_type` | string | No | Filter by type |
| `provider` | string | No | Filter by provider |

### Time Preference Mapping

| Preference | Time Range |
|------------|------------|
| `morning` | 8:00 AM – 12:00 PM |
| `afternoon` | 12:00 PM – 5:00 PM |
| `evening` | 5:00 PM – 8:00 PM |

### Logic Flow

```
1. Query synced_slots for requested_date
   WHERE is_available = true
   
2. Apply filters (type, provider)

3. Apply time_preference filter if specified

4. IF slots found:
   └─ Return top 3-5 options

5. IF no slots on requested_date:
   └─ Query nearby dates (±3-5 days)
   └─ Return alternatives

6. IF no slots anywhere:
   └─ Offer to check different week
   └─ OR offer callback option
```

### Sample Responses

**Slots Available:**
```
"I have several openings on Tuesday:

 In the morning, I have 9:00 AM and 10:30 AM.
 In the afternoon, 2:00 PM and 3:30 PM are available.

 Which works best for you?"
```

**No Slots – Alternatives:**
```
"Unfortunately, I don't have any openings on Tuesday.

 The next available appointments are:
 • Wednesday at 11:00 AM
 • Thursday at 2:30 PM
 • Friday at 9:00 AM

 Would any of those work?"
```

**No Availability:**
```
"I'm sorry, but I don't see any available appointments
 this week. Would you like me to check next week, or
 I can have someone from the office call you back?"
```

---

## 4.5 `cancel_appointment` (Write Operation)

### Purpose
Cancel an existing appointment with explicit caller consent.

### Flow
1. Verify appointment exists (via `appointment_verification`)
2. Confirm details with caller
3. **Obtain explicit consent**
4. Call PIMS-Sync to execute cancellation
5. Confirm completion or handle error

### Consent Requirement

**⚠️ CRITICAL: Must obtain explicit verbal consent before canceling.**

| Caller Response | Action |
|-----------------|--------|
| "Yes" / "Correct" / "Cancel it" | ✅ Proceed |
| "No" / "Wait" / "Never mind" | ❌ Keep appointment |
| Unclear / Ambiguous | 🔄 Re-ask clearly |

### Sample Conversation

```
[After verifying appointment exists]

VAPI: "I found Buddy's appointment scheduled for 2:30 PM
       on Tuesday, January 28th with Dr. Martinez.
       
       Are you sure you want to cancel this appointment?"

Caller: "Yes, please cancel it"

[Calls PIMS-Sync cancel_appointment]

─── IF SUCCESS: ───
VAPI: "Done! I've successfully cancelled Buddy's appointment.
       You should receive a confirmation shortly.
       Is there anything else I can help with?"

─── IF ERROR: ───
VAPI: "I apologize, but I'm having some trouble right now.
       Your appointment is still scheduled.
       Please call the office at 555-123-4567.
       I'm sorry for the inconvenience."
```

### PIMS-Sync Call

```typescript
POST /api/sync/appointments/cancel
{
  appointment_id: string,
  idexx_appointment_id: string,
  reason: "Cancelled by caller via VAPI",
  clinic_id: string,
  vapi_call_id: string
}
```

---

## 4.6 `reschedule_appointment` (Write Operation)

### Purpose
Move an existing appointment to a new date/time atomically.

### Flow
1. Verify original appointment exists
2. Collect new date/time preference
3. Check availability for new time
4. Confirm change with caller
5. **Execute atomic reschedule** (cancel + create with rollback)
6. Confirm success or assure original is preserved

### Sample Conversation

```
[After verifying original exists]

VAPI: "I found Buddy's appointment scheduled for 2:30 PM
       on Tuesday. What date and time would you like
       to move it to?"

Caller: "Thursday afternoon"

[Calls check_availability]

VAPI: "I have openings on Thursday at 1:00 PM, 2:30 PM,
       and 4:00 PM. Which would you prefer?"

Caller: "2:30 works"

VAPI: "I can move Buddy's appointment from 2:30 PM Tuesday
       to 2:30 PM Thursday.
       
       Should I go ahead and make that change?"

Caller: "Yes"

[Calls PIMS-Sync reschedule_appointment - ATOMIC]

─── IF SUCCESS: ───
VAPI: "Perfect! I've rescheduled Buddy's appointment
       to 2:30 PM on Thursday, January 30th.
       Is there anything else I can help with?"

─── IF ERROR (Rollback): ───
VAPI: "I apologize, but I couldn't complete the reschedule.
       Don't worry – your original appointment at 2:30 PM
       on Tuesday is still in place.
       Please call the office at 555-123-4567.
       I'm sorry for the inconvenience."
```

### Key Safety Message

Always reassure the caller that their original appointment is safe:
> "Don't worry – your original appointment is still in place."

---

## 4.7 `book_appointment` (Write Operation)

### Purpose
Create a new appointment for existing or new clients.

### Two Client Paths

| Path | When | Data Collected |
|------|------|----------------|
| **Existing** | "Yes, I've been there before" | Last name, phone, pet name |
| **New** | "No, first time" | Full contact info, pet details |

### Flow – Existing Client

```
1. Collect: pet name, preferred date/time
2. Check availability
3. Confirm existing client: "Have you been here before?"
4. Collect: last name, phone (for lookup)
5. Look up client in local database
6. If found → Confirm booking details
7. If not found → Switch to new client flow
8. Call PIMS-Sync schedule_appointment
9. Confirm success
```

### Flow – New Client

```
1. Collect: pet name, preferred date/time
2. Check availability
3. Confirm new client: "Have you been here before?"
4. Collect contact info:
   - First name
   - Last name
   - Phone number
   - Email (optional)
5. Collect pet info:
   - Pet name
   - Species (dog/cat/other)
   - Breed (optional)
6. Confirm all details
7. Call PIMS-Sync schedule_appointment (is_new_client: true)
8. Confirm success
```

### Sample Conversation – New Client

```
VAPI: "What is your pet's name?"
Caller: "Max"

VAPI: "When would you like to bring Max in?"
Caller: "Next Monday morning"

[Calls check_availability]

VAPI: "I have 9:00 AM, 10:30 AM, and 11:00 AM available.
       Which works best?"
Caller: "9 AM"

VAPI: "Have you been to our clinic before?"
Caller: "No, this is our first visit"

VAPI: "Welcome! What is your first name?"
Caller: "Sarah"

VAPI: "And your last name?"
Caller: "Johnson"

VAPI: "What's the best phone number?"
Caller: "555-987-6543"

VAPI: "Is Max a dog or a cat?"
Caller: "A dog"

VAPI: "Do you know the breed?"
Caller: "Golden retriever"

VAPI: "Let me confirm: I'll book Max, your golden retriever,
       for 9:00 AM on Monday, February 3rd.
       Your contact: Sarah Johnson at 555-987-6543.
       Does that look correct?"

Caller: "Yes"

[Calls PIMS-Sync schedule_appointment]

VAPI: "You're all set! I've booked Max for 9 AM on Monday.
       You'll receive a confirmation shortly.
       We look forward to seeing you!"
```

---

# 5. Layer 2: PIMS-Sync Workflows

## 5.1 Workflow Overview

| Workflow | Purpose | Primitives Used | Transaction |
|----------|---------|-----------------|-------------|
| `schedule_appointment` | Create new appointment | 1-5 | Sequential |
| `cancel_appointment` | Cancel appointment | 1-3 | Simple |
| `reschedule_appointment` | Move to new time | 2-4 | **Atomic** |

---

## 5.2 `schedule_appointment` Workflow

**Endpoint:** `POST /api/sync/appointments/create`

### Request Schema

```typescript
interface ScheduleAppointmentRequest {
  // Client type
  is_new_client: boolean;
  
  // Existing client
  client_id?: string;
  patient_id?: string;
  
  // New client contact
  client_first_name?: string;
  client_last_name?: string;
  phone?: string;
  email?: string;
  
  // New client pet
  pet_name?: string;
  species?: string;
  breed?: string;
  
  // Appointment
  appointment_date: string;
  time: string;
  time_end: string;
  appointment_type: string;
  room: string;
  provider?: string;
  
  // Metadata
  clinic_id: string;
  vapi_call_id: string;
}
```

### Existing Client Steps

| Step | Primitive | Action | On Failure |
|------|-----------|--------|------------|
| 1 | **Patient Search** | Find patient by name + client | Error: Patient not found |
| 2 | **Create Appointment** | Book the slot | Error: Slot taken |
| 3 | — | Store in `booked_appointments` | Log error |

### New Client Steps

| Step | Primitive | Action | On Failure |
|------|-----------|--------|------------|
| 1 | **Client Duplicate Check** | Check if client exists | Continue |
| 2a | — | *If exists:* Use existing client_id | — |
| 2b | **Create Client** | *If not:* Create new client | Error |
| 3 | **Patient Search** | Check if patient exists | Continue |
| 4a | — | *If exists:* Use existing patient_id | — |
| 4b | **Create Patient** | *If not:* Create new patient | Error |
| 5 | **Create Appointment** | Book the slot | Error |
| 6 | — | Store in `booked_appointments` | Log |

### Response Schema

```typescript
// Success
{
  success: true,
  appointment_id: string,
  idexx_appointment_id: string,
  confirmation_number: string,
  appointment: { date, time, provider, type },
  client: { id, name },
  patient: { id, name }
}

// Error
{
  success: false,
  error: string,
  code: 'PATIENT_NOT_FOUND' | 'CLIENT_CREATE_FAILED' | 'SLOT_TAKEN' | ...
}
```

---

## 5.3 `cancel_appointment` Workflow

**Endpoint:** `POST /api/sync/appointments/cancel`

### Request Schema

```typescript
interface CancelAppointmentRequest {
  // Identification (one required)
  appointment_id?: string;
  idexx_appointment_id?: string;
  
  // Or search criteria
  patient_name?: string;
  appointment_date?: string;
  
  // Required
  reason: string;
  clinic_id: string;
  vapi_call_id: string;
}
```

### Workflow Steps

| Step | Primitive | Action | On Failure |
|------|-----------|--------|------------|
| 1a | **Get Appointment** | Lookup by ID | Error: Not found |
| 1b | **Patient Search** | Lookup by criteria | Error: Not found |
| 2 | — | Validate single match | Return list if multiple |
| 3 | **Cancel Appointment** | Cancel in IDEXX | Error |
| 4 | — | Update local DB status | Log |

### Response Schema

```typescript
// Success
{
  success: true,
  appointment_id: string,
  cancelled_at: string
}

// Multiple found
{
  success: false,
  code: 'MULTIPLE_APPOINTMENTS',
  appointments: [{ id, time, provider }, ...]
}

// Error
{
  success: false,
  error: string,
  code: string
}
```

---

## 5.4 `reschedule_appointment` Workflow (Atomic)

**Endpoint:** `POST /api/sync/appointments/reschedule`

### Request Schema

```typescript
interface RescheduleAppointmentRequest {
  // Original
  original_appointment_id?: string;
  patient_name?: string;
  original_date?: string;
  
  // New
  new_date: string;
  new_time: string;
  new_time_end: string;
  new_provider?: string;
  
  // Metadata
  reason: string;
  clinic_id: string;
  vapi_call_id: string;
}
```

### Atomic Transaction Steps

| Step | Primitive | Action | On Failure |
|------|-----------|--------|------------|
| 1 | **Get Appointment** | Resolve original | Error: Not found |
| 2 | — | **BACKUP** original details | — |
| 3 | — | **BEGIN TRANSACTION** | — |
| 4 | **Cancel Appointment** | Cancel original | **ABORT** |
| 5 | **Create Appointment** | Create at new time | **ROLLBACK** |
| 6a | — | **COMMIT** (if success) | — |
| 6b | **Create Appointment** | **ROLLBACK**: Restore original | **CRITICAL** |
| 7 | — | Link records in DB | Log |

### Rollback Pseudocode

```typescript
async function rescheduleAtomic(request) {
  // 1. Find original
  const original = await resolveAppointment(request);
  if (!original) throw 'APPOINTMENT_NOT_FOUND';
  
  // 2. Backup
  const backup = { ...original };
  
  // 3-4. Cancel original
  const cancelResult = await cancelAppointment(original.id);
  if (!cancelResult.success) {
    return { success: false, code: 'CANCEL_FAILED' };
    // Original unchanged - safe
  }
  
  // 5. Create new
  try {
    const newAppt = await createAppointment({
      patient_id: original.patient_id,
      date: request.new_date,
      time: request.new_time,
      ...
    });
    
    // 6a. Success
    return { 
      success: true, 
      new_appointment_id: newAppt.id 
    };
    
  } catch (error) {
    // 6b. Rollback
    try {
      await createAppointment(backup);
      return {
        success: false,
        code: 'ROLLBACK_SUCCESS',
        message: 'Original appointment restored'
      };
    } catch (rollbackError) {
      // CRITICAL
      await alertAdmin(backup, rollbackError);
      return {
        success: false,
        code: 'CRITICAL_ROLLBACK_FAILED'
      };
    }
  }
}
```

### Outcome Table

| Cancel | Create | Rollback | Result |
|--------|--------|----------|--------|
| ✅ | ✅ | — | Success: New appointment |
| ✅ | ❌ | ✅ | Rollback: Original restored |
| ✅ | ❌ | ❌ | **CRITICAL**: Manual intervention |
| ❌ | — | — | Abort: Original unchanged |

---

# 6. Layer 3: Primitives

## 6.1 Primitive Overview

Primitives are atomic operations that interact with IDEXX Neo via Playwright browser automation.

| Category | Primitive | Method | Endpoint |
|----------|-----------|--------|----------|
| **Client** | Client Search | GET | `/clients/` |
| **Client** | Client Duplicate Check | GET | `/clients/duplicate/` |
| **Client** | Create Client | POST | `/clients/` |
| **Patient** | Patient Search | GET | `/search/patients/` |
| **Patient** | Create Patient | POST | `/patients/` |
| **Appointment** | Get Appointment | GET | `/appointments/{id}/` |
| **Appointment** | Create Appointment | POST | `/appointments/` |
| **Appointment** | Cancel Appointment | POST | `/appointments/cancel/{id}/` |

---

## 6.2 Client Primitives

### Client Search
```
GET /clients/?q={search}&phone={phone}

Response:
{
  results: [{
    id: string,
    first_name: string,
    last_name: string,
    phone: string,
    email: string,
    patients: [{ id, name, species }]
  }]
}
```

### Client Duplicate Check
```
GET /clients/duplicate/?first_name={fn}&last_name={ln}&phone={p}

Response:
{
  exists: boolean,
  client_id: string | null,
  match_confidence: 'exact' | 'partial' | 'none'
}
```

### Create Client
```
POST /clients/
Content-Type: multipart/form-data

Fields: first_name, last_name, phone, email, address

Response:
{
  success: boolean,
  client_id: string,
  idexx_client_id: string
}
```

---

## 6.3 Patient Primitives

### Patient Search
```
GET /search/patients/?q={name}&client_id={cid}

Response:
{
  results: [{
    id: string,
    name: string,
    species: string,
    breed: string,
    client_id: string,
    client_name: string
  }]
}
```

### Create Patient
```
POST /patients/
Content-Type: multipart/form-data

Fields: client_id, name, species, breed, gender, date_of_birth

Response:
{
  success: boolean,
  patient_id: string,
  idexx_patient_id: string
}
```

---

## 6.4 Appointment Primitives

### Get Appointment
```
GET /appointments/{id}/

Response:
{
  id: string,
  idexx_id: string,
  patient_id: string,
  patient_name: string,
  client_id: string,
  client_name: string,
  date: string,
  time: string,
  time_end: string,
  provider: string,
  type: string,
  room: string,
  status: 'scheduled' | 'checked_in' | 'completed' | 'cancelled'
}
```

### Create Appointment
```
POST /appointments/
Content-Type: multipart/form-data

Fields: patient_id, type_id, appointment_date, time, time_end, room, provider

Response:
{
  success: boolean,
  appointment_id: string,
  idexx_appointment_id: string,
  confirmation_number: string
}
```

### Cancel Appointment
```
POST /appointments/cancel/{id}/
Content-Type: application/json

Body: { reason: string }

Response:
{
  success: boolean,
  cancelled_at: string
}
```

---

# 7. Database Schema

## 7.1 Table Overview

| Table | Purpose | Updated By |
|-------|---------|------------|
| `synced_appointments` | All IDEXX appointments | Nightly sync |
| `synced_slots` | Available time slots | Nightly sync |
| `booked_appointments` | AI-created appointments | PIMS-Sync |
| `clients` | Client records | Sync + PIMS-Sync |
| `patients` | Patient records | Sync + PIMS-Sync |
| `appointment_audit_log` | All operations | System |

---

## 7.2 Key Tables

### `synced_appointments`

```sql
CREATE TABLE synced_appointments (
  id UUID PRIMARY KEY,
  idexx_appointment_id VARCHAR(100) UNIQUE,
  clinic_id UUID REFERENCES clinics(id),
  
  -- Patient/Client
  patient_id VARCHAR(100),
  patient_name VARCHAR(255),
  client_id VARCHAR(100),
  owner_first_name VARCHAR(100),
  owner_last_name VARCHAR(100),
  owner_phone VARCHAR(50),
  
  -- Appointment
  appointment_date DATE,
  time TIME,
  time_end TIME,
  provider_name VARCHAR(255),
  appointment_type VARCHAR(100),
  room VARCHAR(100),
  status VARCHAR(50),
  
  -- Metadata
  synced_at TIMESTAMP,
  
  INDEX (clinic_id, appointment_date),
  INDEX (patient_name, owner_last_name)
);
```

### `synced_slots`

```sql
CREATE TABLE synced_slots (
  id UUID PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id),
  
  -- Slot
  slot_date DATE,
  slot_time TIME,
  slot_time_end TIME,
  is_available BOOLEAN DEFAULT true,
  
  -- Details
  provider_name VARCHAR(255),
  room VARCHAR(100),
  appointment_type VARCHAR(100),
  
  -- Metadata
  synced_at TIMESTAMP,
  
  INDEX (clinic_id, slot_date, is_available)
);
```

### `booked_appointments`

```sql
CREATE TABLE booked_appointments (
  id UUID PRIMARY KEY,
  idexx_appointment_id VARCHAR(100) UNIQUE,
  clinic_id UUID REFERENCES clinics(id),
  
  -- Patient/Client
  patient_id UUID REFERENCES patients(id),
  client_id UUID REFERENCES clients(id),
  patient_name VARCHAR(255),
  owner_name VARCHAR(255),
  
  -- Appointment
  appointment_date DATE,
  time TIME,
  time_end TIME,
  provider_name VARCHAR(255),
  appointment_type VARCHAR(100),
  room VARCHAR(100),
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled',
  
  -- Reschedule tracking
  rescheduled_from UUID REFERENCES booked_appointments(id),
  rescheduled_to UUID REFERENCES booked_appointments(id),
  
  -- Cancellation tracking
  cancelled_at TIMESTAMP,
  cancelled_reason TEXT,
  
  -- Audit
  created_by VARCHAR(50) DEFAULT 'vapi',
  vapi_call_id VARCHAR(100),
  created_at TIMESTAMP,
  
  INDEX (owner_name, patient_name, appointment_date),
  INDEX (clinic_id, status)
);
```

### `appointment_audit_log`

```sql
CREATE TABLE appointment_audit_log (
  id UUID PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id),
  
  -- Action
  action VARCHAR(50),  -- 'create', 'cancel', 'reschedule'
  
  -- References
  appointment_id UUID,
  old_appointment_id UUID,
  new_appointment_id UUID,
  
  -- Details
  old_datetime TIMESTAMP,
  new_datetime TIMESTAMP,
  reason TEXT,
  
  -- Metadata
  vapi_call_id VARCHAR(100),
  created_at TIMESTAMP,
  
  INDEX (clinic_id, created_at DESC)
);
```

---

# 8. Atomic Transactions

## 8.1 What is an Atomic Transaction?

**Atomic = "All or nothing"**

An atomic transaction either:
- ✅ **Completes fully** — all operations succeed
- ✅ **Rolls back fully** — returns to original state

The caller **never** ends up in an inconsistent state.

## 8.2 Why Atomicity Matters for Reschedule

### Without Atomicity (Dangerous!)

```
Step 1: Cancel 2:00 PM appointment  ✅ Success
Step 2: Book 4:00 PM appointment    ❌ FAILS (slot taken!)

Result: Caller has NO appointment! 😱
```

### With Atomicity (Safe!)

```
Step 1: Cancel 2:00 PM appointment  ✅ Success
Step 2: Book 4:00 PM appointment    ❌ FAILS

ROLLBACK: Restore 2:00 PM           ✅ Success

Result: Caller still has 2:00 PM appointment ✅
```

## 8.3 Transaction Outcomes

| Cancel | Create | Rollback | Final State | Caller Message |
|--------|--------|----------|-------------|----------------|
| ✅ | ✅ | — | New appointment | "Successfully rescheduled!" |
| ✅ | ❌ | ✅ | Original restored | "Error, but original is safe" |
| ✅ | ❌ | ❌ | **CRITICAL** | "Call office immediately" |
| ❌ | — | — | Original unchanged | "Error, original is safe" |

## 8.4 Caller Reassurance

Always tell the caller their original appointment is safe:

```
"I apologize, but I couldn't complete the reschedule.
 Don't worry – your original appointment at [time] on [date]
 is still in place."
```

---

# 9. Error Handling

## 9.1 Error Categories

| Category | Examples | Caller Response | System Action |
|----------|----------|-----------------|---------------|
| **Not Found** | Patient, appointment missing | "I couldn't find..." | Log |
| **Validation** | Invalid date/time | "I didn't catch that..." | Re-ask |
| **Conflict** | Slot just taken | "That time was just booked..." | Offer alternatives |
| **PIMS Error** | Playwright failure | "Having trouble, call office" | Log + Alert |
| **Critical** | Rollback failed | "Please call immediately" | Alert admin |

## 9.2 Error Response Templates

### Appointment Not Found
```
"I don't see an appointment for [pet_name] on [date].
 Would you like me to check a different date?"
```

### Slot Taken
```
"I'm sorry, but that time was just booked.
 The next available times are [alternatives].
 Would any of those work?"
```

### System Error
```
"I apologize, but I'm having some technical difficulties.
 
 [For cancel/reschedule]: Your appointment is still scheduled.
 
 Please call the office at [phone] and they'll help you.
 I'm sorry for the inconvenience."
```

### Critical Error
```
"I'm very sorry, but we've encountered an issue that
 needs immediate attention.
 
 Please call our office right away at [phone].
 
 We apologize for any inconvenience."
```

---

# 10. API Reference

## 10.1 PIMS-Sync Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/sync/appointments/create` | POST | Create appointment |
| `/api/sync/appointments/cancel` | POST | Cancel appointment |
| `/api/sync/appointments/reschedule` | POST | Atomic reschedule |

## 10.2 Primitive Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/clients/` | GET | Search clients |
| `/clients/duplicate/` | GET | Check for duplicates |
| `/clients/` | POST | Create client |
| `/search/patients/` | GET | Search patients |
| `/patients/` | POST | Create patient |
| `/appointments/{id}/` | GET | Get appointment |
| `/appointments/` | POST | Create appointment |
| `/appointments/cancel/{id}/` | POST | Cancel appointment |

## 10.3 Authentication

```
Headers:
  Authorization: Bearer {clinic_api_token}
  X-Clinic-ID: {clinic_uuid}
  X-VAPI-Call-ID: {vapi_call_id}
```

---

# 11. Security Considerations

## 11.1 Data Protection

| Data | Protection |
|------|------------|
| Client PII | Encrypted at rest, TLS in transit |
| PIMS credentials | Vault storage |
| Call recordings | Separate storage, retention policy |
| Audit logs | Immutable, 7-year retention |

## 11.2 Consent Requirements

All destructive operations require:
- ✅ Explicit verbal consent
- ✅ Consent timestamp logged
- ✅ Clear option to decline

---

# 12. Implementation Checklist

## Phase 1: Foundation
- [ ] PostgreSQL database setup
- [ ] Nightly sync from IDEXX
- [ ] Primitive implementations
- [ ] Basic testing

## Phase 2: Read Operations
- [ ] `appointment_verification`
- [ ] `confirm_appointment`
- [ ] `check_availability`
- [ ] VAPI integration

## Phase 3: Write Operations
- [ ] `schedule_appointment` workflow
- [ ] `cancel_appointment` workflow
- [ ] `reschedule_appointment` workflow (atomic)
- [ ] Rollback testing

## Phase 4: VAPI Tools
- [ ] `cancel_appointment` tool
- [ ] `reschedule_appointment` tool
- [ ] `book_appointment` tool
- [ ] Consent flow testing

## Phase 5: Production
- [ ] Security audit
- [ ] Pilot deployment
- [ ] Monitoring setup
- [ ] Full rollout

---

# Appendix: Glossary

| Term | Definition |
|------|------------|
| **Atomic** | Operation that fully succeeds or fully rolls back |
| **IDEXX Neo** | Veterinary Practice Information Management System |
| **PIMS-Sync** | OdisAI service orchestrating IDEXX operations |
| **Playwright** | Browser automation for IDEXX interaction |
| **Primitive** | Single atomic IDEXX operation |
| **Rollback** | Restoring original state after failure |
| **VAPI** | Voice AI platform for phone conversations |

---

*Version 1.0 | January 2025 | OdisAI Engineering*
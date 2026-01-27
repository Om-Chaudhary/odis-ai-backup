# IDEXX Appointment Management Workflows

> Detailed documentation of primary appointment management workflows (Level 1: Primary Operations)

## Table of Contents

- [Overview](#overview)
- [Create Appointment](#create-appointment)
- [Cancel Appointment](#cancel-appointment)
- [Reschedule Appointment](#reschedule-appointment)
- [Confirm Appointment](#confirm-appointment)
- [Error Handling](#error-handling)
- [VAPI Integration](#vapi-integration)

---

## Overview

This document describes the four primary appointment management workflows in the IDEXX integration. Each workflow follows the 4-level architecture:

```
VAPI Tool Call → PIMS-Sync Endpoint → Provider Method → Playwright Operations
```

### Workflow Summary

| Workflow | VAPI Tool | PIMS-Sync Endpoint | Provider Method | Purpose |
|----------|-----------|-------------------|-----------------|---------|
| **Create** | `book_appointment` | `POST /api/sync/appointments/create` | `createAppointment` | Book new appointment |
| **Cancel** | `cancel_appointment` | `POST /api/sync/appointments/cancel` | `cancelAppointment` | Cancel existing appointment |
| **Reschedule** | `reschedule_appointment` | `POST /api/sync/appointments/reschedule` | `rescheduleAppointment` | Move appointment to new date/time |
| **Confirm** | (implicit) | `POST /api/sync/appointments/confirm` | `searchAppointment` | Search and verify appointment |

---

## Create Appointment

### Purpose
Book a new appointment in IDEXX Neo for a pet. Handles both existing clients with new appointments and completely new clients.

### User Flow
```
Caller: "I'd like to book an appointment for Fluffy"
VAPI: "What day works for you?"
Caller: "Friday at 2 PM"
VAPI: "I have an opening on Friday, February 15th at 2 PM. Does that work?"
Caller: "Yes"
VAPI: [Calls book_appointment tool]
VAPI: "Great! I've booked Fluffy's appointment for Friday at 2 PM with Dr. Smith"
```

### Input Parameters

```typescript
{
  // Pet information (required)
  petName: string;              // "Fluffy"
  species: string;              // "Cat", "Dog", etc.
  breed: string;                // "Persian", "Labrador", etc.
  
  // Client information (required if new client)
  isNewClient?: boolean;        // true if creating new client
  clientFirstName?: string;     // Required if isNewClient
  clientLastName?: string;      // Required if isNewClient
  phone?: string;               // Recommended for duplicate check
  email?: string;               // Optional
  
  // Appointment details (required)
  appointmentDate: string;      // ISO format: "2026-02-15"
  time: string;                 // 24-hour format: "14:00"
  time_end: string;             // 24-hour format: "14:30"
  appointmentType: string;      // Type ID from IDEXX
  room: string;                 // Room ID from IDEXX
  provider?: string;            // Optional provider ID
  
  // VAPI context
  clinic_id: string;            // Required
  vapi_call_id?: string;        // Optional
  assistant_id?: string;        // Optional
}
```

### Workflow Steps

1. **VAPI Receives Call**
   - Voice assistant extracts appointment details from conversation
   - Calls `book_appointment` tool with parameters

2. **PIMS-Sync Orchestration**
   - Endpoint: `POST /api/sync/appointments/create`
   - Validates API key
   - Loads clinic PIMS credentials
   - Initializes IDEXX Provider

3. **Provider Business Logic**
   - Checks if client is new or existing
   - **If New**: Uses `resolveClient` composite to:
     - Check for duplicate clients in IDEXX
     - Create client if needed
     - Create patient record
   - **If Existing**: Searches for patient directly
   - Builds appointment payload
   - Optionally checks slot availability

4. **Playwright Execution**
   - Calls `createAppointmentInPIM`
   - POST to `/appointments/create` with multipart/form-data
   - IDEXX Neo creates appointment record

5. **Database Storage**
   - Stores appointment in OdisAI database
   - Links to client and patient records
   - Stores IDEXX appointment ID

6. **Response**
   - Returns appointment ID, confirmation number
   - Includes full appointment details

### Success Response

```json
{
  "success": true,
  "data": {
    "appointmentId": "12345",
    "confirmationNumber": "CONF-67890",
    "appointment": {
      "id": "12345",
      "date": "2026-02-15",
      "time": "14:00",
      "timeEnd": "14:30",
      "type": {
        "id": "5",
        "name": "Wellness Exam"
      },
      "room": {
        "id": "3",
        "name": "Exam Room 3"
      },
      "provider": {
        "id": "10",
        "name": "Dr. Emily Brown"
      }
    },
    "patient": {
      "id": "456",
      "name": "Fluffy",
      "breed": "Persian",
      "species": "Cat"
    },
    "client": {
      "id": "789",
      "firstName": "Jane",
      "lastName": "Smith",
      "phone": "(555) 123-4567"
    }
  },
  "message": "Appointment successfully created"
}
```

### Error Scenarios

| Error | Cause | Response | User Message |
|-------|-------|----------|--------------|
| Client Creation Failed | IDEXX API error | 500 with details | "I'm having trouble creating your record. Please try again or call the clinic." |
| Patient Not Found | No patient with that name | 404 | "I don't see a pet named Fluffy in your account. Would you like to add them?" |
| Slot Unavailable | Time already booked | 409 with available times | "That time is no longer available. I have 2 PM or 4 PM open. Which works for you?" |
| Invalid Appointment Type | Type ID doesn't exist | 400 | "I'm sorry, that appointment type isn't available. Let me find alternatives." |

### Diagram Reference
- [Create Appointment Workflow Diagram](./diagrams/workflows/01-create-appointment.mmd)
- [Create Appointment Provider Detail](./diagrams/provider-details/create-appointment-provider.mmd)
- [resolveClient Submodule](./diagrams/submodules/resolve-client.mmd)

---

## Cancel Appointment

### Purpose
Cancel an existing appointment in IDEXX Neo. Uses soft delete (marks as cancelled) to preserve appointment history.

### User Flow
```
Caller: "I need to cancel Fluffy's appointment"
VAPI: "What day was that appointment?"
Caller: "Friday"
VAPI: [Searches for appointment]
VAPI: "I found Fluffy's appointment on Friday, February 15th at 2 PM with Dr. Smith. Should I cancel that?"
Caller: "Yes"
VAPI: [Calls cancel_appointment tool]
VAPI: "I've cancelled Fluffy's appointment on Friday at 2 PM"
```

### Input Parameters

```typescript
{
  // Option 1: Direct ID lookup (if known)
  appointmentId?: string;       // "12345"
  
  // Option 2: Search criteria
  petName?: string;             // "Fluffy" - required if no appointmentId
  appointmentDate?: string;     // "2026-02-15" - required if no appointmentId
  
  // Optional disambiguation
  clientPhone?: string;         // For multiple clients with same pet name
  clientName?: string;          // For disambiguation
  appointmentTime?: string;     // For multiple appointments same day
  
  // Cancellation details
  cancellationReason?: string;  // Optional - default: "Caller requested"
  
  // VAPI context
  clinic_id: string;
  vapi_call_id?: string;
  assistant_id?: string;
}
```

### Workflow Steps

1. **VAPI Receives Cancellation Request**
   - Extracts appointment identification criteria
   - Calls `cancel_appointment` tool

2. **PIMS-Sync Orchestration**
   - Endpoint: `POST /api/sync/appointments/cancel`
   - Validates API key
   - Initializes IDEXX Provider

3. **Provider Business Logic**
   - Uses `resolveAppointment` composite to find appointment:
     - **If `appointmentId` provided**: Direct lookup
     - **If criteria provided**: Search by pet name + date
   - Handles multiple results (returns list for disambiguation)
   - Validates appointment found and not already cancelled

4. **Playwright Execution**
   - Calls `cancelAppointmentInPIM`
   - POST to `/appointments/delete/{id}`
   - Body: `{"action": "cancel", "reason": "Caller requested cancellation"}`

5. **Database Update**
   - Updates appointment status to `cancelled`
   - Stores cancellation timestamp and reason
   - Audit log with VAPI context

6. **Response**
   - Returns cancelled appointment details
   - Confirms cancellation

### Success Response

```json
{
  "success": true,
  "data": {
    "appointmentId": "12345",
    "status": "cancelled",
    "cancelledAt": "2026-01-25T18:30:00Z",
    "reason": "Caller requested cancellation",
    "appointment": {
      "id": "12345",
      "date": "2026-02-15",
      "time": "14:00",
      "patient": {
        "name": "Fluffy",
        "breed": "Persian"
      },
      "client": {
        "name": "Jane Smith",
        "phone": "(555) 123-4567"
      }
    }
  },
  "message": "Appointment successfully cancelled"
}
```

### Disambiguation Flow

**Multiple Appointments Found:**
```json
{
  "success": false,
  "error": "MULTIPLE_APPOINTMENTS_FOUND",
  "data": {
    "appointments": [
      {
        "id": "12345",
        "date": "2026-02-15",
        "time": "09:00",
        "provider": "Dr. Smith",
        "type": "Vaccination"
      },
      {
        "id": "12346",
        "date": "2026-02-15",
        "time": "14:00",
        "provider": "Dr. Jones",
        "type": "Surgery"
      }
    ]
  },
  "message": "Multiple appointments found. Please specify which one."
}
```

**VAPI Handles Disambiguation:**
```
VAPI: "I found 2 appointments for Fluffy on Friday. One is a Vaccination at 9 AM with Dr. Smith, and the other is Surgery at 2 PM with Dr. Jones. Which one would you like to cancel?"
Caller: "The 9 AM one"
VAPI: [Retries with appointmentTime: "09:00"]
```

### Error Scenarios

| Error | Cause | Response | User Message |
|-------|-------|----------|--------------|
| Not Found | No appointment matches | 404 | "I don't see an appointment for Fluffy on Friday. Would you like to check a different date?" |
| Already Cancelled | Previously cancelled | 409 (idempotent success) | "That appointment was already cancelled on [date]" |
| Multiple Found | Ambiguous criteria | 409 with list | "I found multiple appointments. Which one?" |

### Design Notes

- **Soft Delete**: Uses `action: "cancel"` to preserve history
- **Idempotency**: Cancelling already-cancelled appointment returns success
- **Audit Trail**: All cancellations logged with reason and VAPI context

### Diagram Reference
- [Cancel Appointment Workflow Diagram](./diagrams/workflows/02-cancel-appointment.mmd)
- [Cancel Appointment Provider Detail](./diagrams/provider-details/cancel-appointment-provider.mmd)
- [resolveAppointment Submodule](./diagrams/submodules/resolve-appointment.mmd)

---

## Reschedule Appointment

### Purpose
Move an existing appointment to a new date/time. Implemented as an **atomic transaction**: cancel old appointment + create new appointment with rollback capability.

### User Flow
```
Caller: "I need to reschedule Fluffy's Friday appointment"
VAPI: "What day would you like to move it to?"
Caller: "Saturday at the same time"
VAPI: [Searches for original appointment]
VAPI: "I found Fluffy's appointment on Friday at 2 PM. I can move that to Saturday at 2 PM. Should I do that?"
Caller: "Yes"
VAPI: [Calls reschedule_appointment tool]
VAPI: "I've rescheduled Fluffy's appointment to Saturday at 2 PM"
```

### Input Parameters

```typescript
{
  // Original appointment identification
  appointmentId?: string;       // If known
  petName?: string;             // Required if no appointmentId
  originalDate?: string;        // Required if no appointmentId
  originalTime?: string;        // Optional for disambiguation
  
  // New appointment details (required)
  newDate: string;              // ISO: "2026-02-16"
  newTime: string;              // 24-hour: "14:00"
  newTime_end: string;          // 24-hour: "14:30"
  
  // Optional overrides (defaults to original values)
  newRoom?: string;             // Room ID
  newProvider?: string;         // Provider ID
  newType?: string;             // Appointment type ID
  
  // Metadata
  reason?: string;              // Reschedule reason
  
  // VAPI context
  clinic_id: string;
  vapi_call_id?: string;
  assistant_id?: string;
}
```

### Workflow Steps

1. **VAPI Receives Reschedule Request**
   - Extracts original appointment criteria
   - Extracts new appointment details
   - Calls `reschedule_appointment` tool

2. **PIMS-Sync Orchestration**
   - Endpoint: `POST /api/sync/appointments/reschedule`
   - Validates API key and payload
   - Initializes IDEXX Provider

3. **Provider Business Logic (Atomic Transaction)**
   
   **Step 1: Find Original Appointment**
   - Uses `resolveAppointment` composite
   - Validates appointment exists and not cancelled
   - Stores complete original appointment data (for rollback)
   
   **Step 2: Begin Transaction**
   - **Cancel Old Appointment**
     - Calls `cancelAppointmentInPIM(old_id, "Rescheduled")`
     - If fails: ABORT, no changes made
   
   - **Create New Appointment**
     - Reuses `patient_id`, `type_id` (unless overridden)
     - Uses new date, time, time_end
     - Calls `createAppointmentInPIM(new_data)`
     - If fails: **ROLLBACK** - recreate old appointment
   
   **Step 3: Commit**
   - Both operations succeeded
   - Link old and new appointments in database

4. **Database Operations**
   - Update old appointment: `status = 'rescheduled'`, `rescheduled_to_id = new_id`
   - Store new appointment: `status = 'scheduled'`, `rescheduled_from_id = old_id`
   - Audit log with both IDs

5. **Response**
   - Returns both old and new appointment details
   - Confirms reschedule

### Success Response

```json
{
  "success": true,
  "data": {
    "oldAppointmentId": "12345",
    "newAppointmentId": "12346",
    "status": "rescheduled",
    "rescheduledAt": "2026-01-25T18:30:00Z",
    "oldAppointment": {
      "id": "12345",
      "date": "2026-02-15",
      "time": "14:00",
      "cancelledAt": "2026-01-25T18:30:00Z",
      "reason": "Rescheduled"
    },
    "newAppointment": {
      "id": "12346",
      "date": "2026-02-16",
      "time": "14:00",
      "timeEnd": "14:30",
      "patient": {
        "id": "456",
        "name": "Fluffy"
      },
      "client": {
        "id": "789",
        "name": "Jane Smith"
      },
      "provider": {
        "name": "Dr. Emily Brown"
      }
    }
  },
  "message": "Appointment successfully rescheduled"
}
```

### Rollback Response

**If new appointment creation fails:**
```json
{
  "success": false,
  "error": "RESCHEDULE_FAILED_ROLLBACK_SUCCESS",
  "data": {
    "oldAppointmentId": "12345",
    "restoredAppointment": {
      "id": "12345",
      "date": "2026-02-15",
      "time": "14:00"
    }
  },
  "message": "Failed to create new appointment. Original appointment has been restored."
}
```

### Atomic Transaction Design

```
BEGIN TRANSACTION
  ├─ Step 1: Cancel old appointment
  │   ├─ Success? → Continue
  │   └─ Failure? → ABORT (no changes)
  │
  ├─ Step 2: Create new appointment
  │   ├─ Success? → COMMIT
  │   └─ Failure? → ROLLBACK
  │       └─ Re-create old appointment
  │           ├─ Success? → Return error + restored
  │           └─ Failure? → CRITICAL ERROR
```

### Error Scenarios

| Error | Cause | Response | User Message |
|-------|-------|----------|--------------|
| Original Not Found | No matching appointment | 404 | "I don't see an appointment for Fluffy on Friday to reschedule" |
| Already Cancelled | Can't reschedule cancelled | 409 | "That appointment was already cancelled. Would you like to book a new one?" |
| New Slot Unavailable | Time conflict | 409 with alternatives | "Saturday at 2 PM isn't available. I have 3 PM or 4 PM. Which works?" |
| Cancel Failed | IDEXX API error | 500 | "I'm having trouble rescheduling. Please try again or call the clinic." |
| Create Failed + Rollback Success | New appt failed, original restored | 500 | "I couldn't reschedule the appointment, but your original appointment is still confirmed." |
| Create Failed + Rollback Failed | **CRITICAL** | 500 (alert operations) | "We're experiencing technical issues. Please call the clinic to confirm your appointment." |

### Design Notes

1. **Atomic Transaction**: Cancel and create must both succeed or both fail
2. **Rollback Strategy**: If new creation fails, immediately recreate original
3. **Data Preservation**: Store full original appointment data before cancelling
4. **Idempotency**: Detect duplicate reschedule requests
5. **Future Enhancement**: If IDEXX adds native reschedule API, replace with single update

### Diagram Reference
- [Reschedule Appointment Workflow Diagram](./diagrams/workflows/03-reschedule-appointment.mmd)
- [Reschedule Appointment Provider Detail](./diagrams/provider-details/reschedule-appointment-provider.mmd)
- [resolveAppointment Submodule](./diagrams/submodules/resolve-appointment.mmd)

---

## Confirm Appointment

### Purpose
Search for and verify appointment details during a voice call. This is a **read-only** operation used when callers inquire about their appointments.

### User Flow
```
Caller: "What time is Fluffy's appointment on Friday?"
VAPI: [Calls implicit search]
VAPI: "Fluffy has a Wellness Exam on Friday, February 15th at 2 PM with Dr. Emily Brown in Exam Room 3"
```

### Input Parameters

```typescript
{
  // Required search criteria
  petName: string;              // "Fluffy"
  appointmentDate: string;      // "2026-02-15" or natural language
  
  // Optional disambiguation
  clientName?: string;          // Helps if multiple pets named "Fluffy"
  clientPhone?: string;         // Helps identify correct client
  appointmentTime?: string;     // If caller mentions time
  
  // VAPI context
  clinic_id: string;
  vapi_call_id?: string;
  assistant_id?: string;
}
```

### Workflow Steps

1. **VAPI Receives Inquiry** (implicit, not explicit tool call)
   - Caller asks about appointment
   - VAPI extracts pet name and date from conversation

2. **PIMS-Sync Orchestration**
   - Endpoint: `POST /api/sync/appointments/confirm`
   - Validates API key
   - Initializes IDEXX Provider

3. **Provider Business Logic**
   - Uses `resolveAppointment` composite to search
   - Handles three result scenarios:
     - **Not Found**: Return friendly message
     - **Multiple**: Return list for disambiguation
     - **Single**: Fetch full details

4. **Playwright Execution**
   - If single result found:
     - Calls `getAppointment(appointmentId)`
     - Returns full appointment object

5. **Response**
   - Returns appointment details formatted for voice

### Response Scenarios

#### Single Appointment Found ✅

```json
{
  "success": true,
  "data": {
    "found": true,
    "multiple": false,
    "appointment": {
      "id": "12345",
      "date": "2026-02-15",
      "time": "14:00",
      "timeEnd": "14:30",
      "duration": "30 mins",
      "patient": {
        "name": "Fluffy",
        "breed": "Persian",
        "species": "Cat"
      },
      "client": {
        "firstName": "Jane",
        "lastName": "Smith",
        "phone": "(555) 123-4567"
      },
      "provider": {
        "name": "Dr. Emily Brown"
      },
      "room": {
        "name": "Exam Room 3"
      },
      "type": {
        "name": "Wellness Exam"
      },
      "confirmationMessage": "Fluffy has a Wellness Exam on Friday, February 15th at 2:00 PM with Dr. Emily Brown in Exam Room 3."
    }
  }
}
```

**VAPI Response**: Reads `confirmationMessage` to caller

#### Multiple Appointments Found 🔍

```json
{
  "success": true,
  "data": {
    "found": true,
    "multiple": true,
    "appointments": [
      {
        "id": "12345",
        "time": "09:00",
        "provider": "Dr. Smith",
        "type": "Vaccination"
      },
      {
        "id": "12346",
        "time": "14:00",
        "provider": "Dr. Jones",
        "type": "Surgery"
      }
    ],
    "message": "I found 2 appointments for Max on February 15th. Please specify which one."
  }
}
```

**VAPI Response**: "I found 2 appointments for Max on Friday. One is a Vaccination at 9 AM with Dr. Smith, and the other is Surgery at 2 PM with Dr. Jones. Which one are you asking about?"

#### No Appointment Found ❌

```json
{
  "success": true,
  "data": {
    "found": false,
    "multiple": false,
    "message": "No appointment found for Buddy on February 15th, 2026."
  }
}
```

**VAPI Response**: "I don't see an appointment for Buddy on Friday, February 15th. Would you like to schedule one?"

### Design Notes

1. **Non-Destructive**: Read-only operation, no changes to appointments
2. **Flexible Date Input**: Accepts ISO, natural language ("this Friday")
3. **Voice-Friendly**: Returns `confirmationMessage` for VAPI to read
4. **Privacy**: Only returns details if search criteria match
5. **Performance**: Can cache recent lookups

### Diagram Reference
- [Confirm Appointment Workflow Diagram](./diagrams/workflows/04-confirm-appointment.mmd)
- [Search Appointment Provider Detail](./diagrams/provider-details/search-appointment-provider.mmd)
- [resolveAppointment Submodule](./diagrams/submodules/resolve-appointment.mmd)

---

## Error Handling

### Error Response Format

All workflows return consistent error responses:

```typescript
{
  success: false,
  error: string,              // Human-readable error message
  errorCode: string,          // Machine-readable error code
  details?: {                 // Optional additional context
    [key: string]: any
  }
}
```

### Common Error Codes

| Code | Meaning | HTTP Status | Retry? |
|------|---------|-------------|--------|
| `INVALID_INPUT` | Missing required parameters | 400 | No |
| `UNAUTHORIZED` | Invalid API key | 401 | No |
| `APPOINTMENT_NOT_FOUND` | No appointment matches criteria | 404 | No |
| `PATIENT_NOT_FOUND` | No patient with that name | 404 | No |
| `APPOINTMENT_AMBIGUOUS` | Multiple appointments found | 409 | No (needs clarification) |
| `SLOT_UNAVAILABLE` | Time slot already booked | 409 | No (offer alternatives) |
| `ALREADY_CANCELLED` | Appointment previously cancelled | 409 | No (idempotent) |
| `IDEXX_API_ERROR` | IDEXX Neo API failure | 500 | Yes (once) |
| `TIMEOUT` | Playwright timeout | 504 | Yes (once) |
| `ROLLBACK_FAILED` | Critical - manual intervention | 500 | No (alert operations) |

### Retry Strategy

| Error Type | Retry Attempts | Backoff | Fallback |
|------------|----------------|---------|----------|
| Network timeout | 1 | 2 seconds | Return error |
| IDEXX API 5xx | 1 | 1 second | Return error |
| Playwright crash | 1 | Restart browser | Return error |
| Other errors | 0 | N/A | Return error immediately |

---

## VAPI Integration

### Tool Call Pattern

All VAPI tools follow this pattern:

```typescript
// VAPI tool definition
{
  name: "book_appointment",
  description: "Books a veterinary appointment",
  parameters: { /* ... */ },
  server: {
    url: "https://pims-sync.odisai.com/api/sync/appointments/create",
    method: "POST",
    headers: {
      "x-api-key": "{CLINIC_API_KEY}",
      "content-type": "application/json"
    }
  }
}
```

### Variable Extraction

VAPI extracts variables from conversation:

```
Caller: "Book Fluffy for Friday at 2 PM"
VAPI: Extracts {
  petName: "Fluffy",
  appointmentDate: "2026-02-15",
  time: "14:00"
}
```

### Response Handling

VAPI receives structured response and converts to natural language:

```typescript
// Response
{
  success: true,
  data: {
    appointment: {
      date: "2026-02-15",
      time: "14:00",
      provider: "Dr. Smith"
    }
  }
}

// VAPI converts to:
"Great! I've booked Fluffy's appointment for Friday, February 15th at 2:00 PM with Dr. Smith"
```

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md) - System architecture
- [Provider Methods](./PROVIDER_METHODS.md) - Level 2 API reference
- [Submodules](./SUBMODULES.md) - Composite submodule details
- [Atomic Operations](./ATOMIC_OPERATIONS.md) - Level 3 operations
- [APPOINTMENT_API_DISCOVERY.md](./APPOINTMENT_API_DISCOVERY.md) - IDEXX API endpoints

---

**Last Updated**: 2026-01-25

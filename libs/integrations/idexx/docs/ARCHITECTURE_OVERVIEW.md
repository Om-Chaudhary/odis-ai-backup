# IDEXX Appointment Management Architecture Overview

> Comprehensive guide to the 4-level architecture for IDEXX Neo appointment management workflows in ODIS AI.

## Table of Contents

- [Overview](#overview)
- [Architecture Layers](#architecture-layers)
- [Data Flow](#data-flow)
- [Design Principles](#design-principles)
- [Technology Stack](#technology-stack)
- [Diagrams](#diagrams)

---

## Overview

The IDEXX appointment management system is built on a **4-level architecture** that separates concerns and enables testability, reusability, and maintainability. Each level has distinct responsibilities and interfaces with adjacent levels through well-defined contracts.

### High-Level Flow

```
User (Voice) → VAPI → PIMS-Sync → IDEXX Provider → Playwright → IDEXX Neo
```

### System Context

- **Purpose**: Enable veterinary clinic staff and clients to manage appointments via voice AI
- **Integration**: IDEXX Neo (veterinary practice management software)
- **Voice Platform**: VAPI (voice AI assistant)
- **Orchestration**: PIMS-Sync service (appointment workflow orchestration)
- **Database**: OdisAI Supabase (audit logs, appointment records)

---

## Architecture Layers

### Level 0: VAPI Tool Calls (Entry Point)

**Purpose**: User-facing voice AI interactions that initiate appointment workflows.

**Components**:
- `book_appointment` - Voice tool call to create appointment
- `cancel_appointment` - Voice tool call to cancel appointment
- `reschedule_appointment` - Voice tool call to reschedule appointment
- `confirm_appointment` - Voice tool call to search/verify appointment (implicit)

**Location**:
- Schemas: `libs/integrations/vapi/src/inbound-tools/schemas.ts`
- Endpoints: `apps/web/src/app/api/vapi/appointments/*`

**Current State**: 
- `book_appointment`: Implemented, currently logs to database
- `cancel_appointment`: Schema defined, logs to database
- `reschedule_appointment`: Schema defined, logs to database

**Target State**: All tool calls will invoke PIMS-Sync service endpoints to execute operations in IDEXX Neo.

**Example VAPI Interaction**:
```
Caller: "I'd like to cancel Fluffy's appointment on Friday"
VAPI: [Extracts: petName="Fluffy", date="2026-02-15"]
VAPI: [Calls cancel_appointment tool]
VAPI: [Receives result: success=true]
VAPI: "I've cancelled Fluffy's appointment on Friday at 2 PM"
```

---

### Level 1: PIMS-Sync Service Endpoints (Orchestration Layer)

**Purpose**: HTTP API endpoints that orchestrate appointment workflows. Handles authentication, credential loading, provider initialization, and error handling.

**Components**:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/sync/appointments/create` | POST | Create new appointment |
| `/api/sync/appointments/cancel` | POST | Cancel existing appointment |
| `/api/sync/appointments/reschedule` | POST | Reschedule appointment (atomic transaction) |
| `/api/sync/appointments/confirm` | POST | Search and verify appointment details |

**Responsibilities**:
1. **Request Validation**: Validate incoming payload against schemas
2. **Authentication**: API key authentication (same as existing sync endpoints)
3. **Credential Loading**: Load clinic-specific PIMS credentials from database
4. **Provider Initialization**: Initialize IDEXX Provider with authenticated session
5. **Method Invocation**: Call appropriate provider method
6. **Error Handling**: Catch and transform errors into structured responses
7. **Response Formatting**: Return consistent JSON responses
8. **Audit Logging**: Log all operations with VAPI context

**Location**: `apps/pims-sync/src/routes/appointments.route.ts` (to be created)

**Authentication Flow**:
```typescript
// Incoming request
POST /api/sync/appointments/create
Headers: { "x-api-key": "..." }

// Validate API key
const clinic = await validateApiKey(req.headers["x-api-key"]);

// Load PIMS credentials
const credentials = await loadPimsCredentials(clinic.id, "idexx");

// Initialize provider
const provider = new IdexxProvider(credentials);
await provider.initialize();

// Call provider method
const result = await provider.createAppointment(req.body);

// Return response
res.json({ success: true, data: result });
```

**Error Response Format**:
```typescript
{
  success: false,
  error: "Appointment not found",
  errorCode: "APPOINTMENT_NOT_FOUND",
  details?: { /* additional context */ }
}
```

---

### Level 2: IDEXX Provider Methods (Business Logic)

**Purpose**: Encapsulate business logic for appointment operations. Compose atomic operations into meaningful workflows. Provide reusable submodules.

**Components**:

#### Primary Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `createAppointment(input)` | Create new appointment | `AppointmentOperationResult` |
| `cancelAppointment(input)` | Cancel existing appointment | `AppointmentOperationResult` |
| `rescheduleAppointment(input)` | Reschedule appointment (atomic) | `RescheduleOperationResult` |
| `searchAppointment(input)` | Find and return appointment details | `SearchAppointmentResult` |

#### Composite Submodules (Reusable)

| Submodule | Purpose | Used By |
|-----------|---------|---------|
| `resolveClient(input)` | Find or create client + patient | `createAppointment` |
| `resolveAppointment(criteria)` | Find appointment by various criteria | `cancelAppointment`, `rescheduleAppointment`, `searchAppointment` |

**Location**: `libs/integrations/idexx/src/provider/appointment-management-client.ts`

**Design Pattern**: Repository pattern - providers abstract the data access layer.

**Example Provider Method**:
```typescript
class IdexxAppointmentManagementClient {
  async createAppointment(input: CreateAppointmentInput): Promise<AppointmentOperationResult> {
    // Business logic orchestration
    let clientId: number;
    let patientId: number;
    
    if (input.isNewClient) {
      // Use composite submodule
      const resolved = await this.resolveClient(input);
      clientId = resolved.client_id;
      patientId = resolved.patient_id;
    } else {
      // Direct search
      const patient = await this.searchPatientInPIM(input.petName);
      patientId = patient.id;
    }
    
    // Call atomic operation
    const appointment = await this.createAppointmentInPIM({
      patient_id: patientId,
      type_id: input.appointmentType,
      date: input.appointmentDate,
      time: input.time,
      // ... other fields
    });
    
    // Return structured result
    return {
      success: true,
      appointmentId: appointment.id,
      appointment: appointment
    };
  }
}
```

---

### Level 3: Atomic IDEXX API Operations (Playwright)

**Purpose**: Low-level Playwright operations that make direct HTTP calls to IDEXX Neo API. Each operation is a single, atomic action.

**Components**:

#### Client Operations
- `clientSearch(searchTerm)` - GET `/clients/search`
- `clientDuplicateCheck(firstName, lastName, phone)` - GET `/clients/duplicateCheck`
- `createClientInPIM(clientData)` - POST `/clients/create`

#### Patient Operations
- `searchPatientInPIM(query)` - GET `/search/patients`
- `createPatientInPIM(patientData)` - POST `/patients/create`
- `getPatientDetails(patientId)` - GET `/patients/getPatient/{id}`

#### Appointment Operations
- `getAppointment(appointmentId)` - GET `/appointments/getAppointment?id={id}`
- `getAppointmentView()` - GET `/appointments/getAppointmentView` (lookup data)
- `createAppointmentInPIM(data)` - POST `/appointments/create` (multipart/form-data)
- `cancelAppointmentInPIM(appointmentId, reason)` - POST `/appointments/delete/{id}` with `{"action": "cancel"}`
- `deleteAppointmentInPIM(appointmentId)` - POST `/appointments/delete/{id}` with `{"action": "delete"}`

**Location**: `libs/integrations/idexx/src/provider/appointment-management-client.ts` (private methods)

**Implementation**: Uses Playwright browser automation to interact with IDEXX Neo's internal APIs.

**Example Atomic Operation**:
```typescript
private async createAppointmentInPIM(data: AppointmentPayload): Promise<Appointment> {
  const response = await this.apiContext.post('/appointments/create', {
    multipart: {
      patient_id: data.patient_id.toString(),
      type_id: data.type_id.toString(),
      appointment_date: data.appointment_date,
      time: data.time,
      time_end: data.time_end,
      room: data.room,
      // ... other fields
    }
  });
  
  if (!response.ok()) {
    throw new Error(`Failed to create appointment: ${response.status()}`);
  }
  
  return response.json();
}
```

---

### Database Layer: OdisAI Supabase (Parallel Operations)

**Purpose**: Store appointment records, client/patient data, and audit logs in OdisAI database. Runs in parallel to IDEXX operations.

**Components**:

| Table | Purpose |
|-------|---------|
| `clients` | Client records synced from IDEXX |
| `patients` | Patient records synced from IDEXX |
| `appointments` | Appointment records with IDEXX IDs |
| `inbound_vapi_calls` | VAPI tool call audit logs |
| `pims_sync_logs` | PIMS-Sync operation logs |

**Responsibilities**:
- **Store Records**: Save client, patient, appointment records
- **Link IDs**: Map IDEXX IDs to OdisAI internal IDs
- **Audit Trail**: Log all operations with timestamps, VAPI context
- **Analytics**: Enable reporting on appointment operations
- **Fallback Data**: Provide cached data if IDEXX unavailable

**Design Pattern**: Dual write pattern - write to both IDEXX (source of truth) and OdisAI (audit/analytics).

---

## Data Flow

### Create Appointment Flow

```
1. User (Voice)
   ↓ "Book an appointment for Fluffy on Friday at 2 PM"
   
2. VAPI (Level 0)
   ↓ Extract: {petName: "Fluffy", date: "2026-02-15", time: "14:00"}
   ↓ HTTP POST to OdisAI
   
3. OdisAI VAPI Endpoint
   ↓ Store tool call in inbound_vapi_calls table
   ↓ HTTP POST to PIMS-Sync
   
4. PIMS-Sync (Level 1)
   ↓ Validate API key
   ↓ Load clinic PIMS credentials
   ↓ Initialize IDEXX Provider
   
5. IDEXX Provider (Level 2)
   ↓ createAppointment(input)
   ↓ Check: New client? → resolveClient() [composite]
   ↓ Build appointment payload
   
6. Playwright (Level 3)
   ↓ createAppointmentInPIM()
   ↓ POST /appointments/create to IDEXX Neo
   
7. IDEXX Neo
   ↓ Create appointment record
   ↓ Return appointment_id
   
8. OdisAI Database (Parallel)
   ↓ Store appointment record
   ↓ Link IDEXX appointment_id
   
9. Response Chain
   ↓ Level 3 → Level 2 → Level 1 → VAPI → User
   
10. User (Voice)
    ↑ "I've booked Fluffy's appointment for Friday at 2 PM"
```

### Cancel Appointment Flow

```
1. User: "Cancel Fluffy's appointment on Friday"
2. VAPI: Extract {petName: "Fluffy", date: "2026-02-15"}
3. PIMS-Sync: Validate & initialize provider
4. Provider: resolveAppointment() → Find appointment_id
5. Playwright: cancelAppointmentInPIM(id, reason)
6. IDEXX Neo: Mark appointment as cancelled
7. OdisAI DB: Update appointment status = 'cancelled'
8. VAPI: "I've cancelled Fluffy's appointment on Friday"
```

### Reschedule Appointment Flow (Atomic Transaction)

```
1. User: "Reschedule Fluffy's Friday appointment to Saturday"
2. VAPI: Extract {petName: "Fluffy", oldDate: "2026-02-15", newDate: "2026-02-16"}
3. PIMS-Sync: Validate & initialize provider
4. Provider: BEGIN TRANSACTION
   4a. resolveAppointment() → Find old appointment
   4b. cancelAppointmentInPIM(old_id, "Rescheduled")
   4c. createAppointmentInPIM(new_data)
   4d. If 4c fails: ROLLBACK - re-create old appointment
   4e. If 4c success: COMMIT
5. OdisAI DB: Link old_id → new_id, update statuses
6. VAPI: "I've rescheduled Fluffy's appointment to Saturday at 2 PM"
```

---

## Design Principles

### 1. Separation of Concerns

Each level has distinct responsibilities:
- **Level 0**: User interaction (voice AI)
- **Level 1**: Orchestration (authentication, routing, error handling)
- **Level 2**: Business logic (workflow composition)
- **Level 3**: Data access (atomic API operations)

### 2. Reusability

Composite submodules eliminate code duplication:
- `resolveClient`: Used in create, reschedule (if client changed)
- `resolveAppointment`: Used in cancel, reschedule, confirm

### 3. Testability

Each level can be tested independently:
- **Level 3**: Unit tests for atomic operations (mock Playwright)
- **Level 2**: Integration tests for provider methods (mock Level 3)
- **Level 1**: API tests for endpoints (mock provider)
- **Level 0**: E2E tests for VAPI tools (mock PIMS-Sync)

### 4. Maintainability

Changes at lower levels don't affect higher levels:
- Update IDEXX API format → Change Level 3 only
- Add new provider method → Change Level 2 only
- Add new VAPI tool → Change Level 0 only

### 5. Error Handling

Consistent error handling at each level:
- **Level 3**: Throw specific errors (APIError, TimeoutError)
- **Level 2**: Catch Level 3 errors, transform to business errors
- **Level 1**: Catch all errors, transform to HTTP responses
- **Level 0**: Present errors in natural language to user

### 6. Observability

Audit logging at orchestration layer (Level 1):
- Every operation logged with timestamps
- VAPI context preserved (call_id, clinic_id, assistant_id)
- Enables analytics and debugging

### 7. Atomicity

Critical operations are atomic (all-or-nothing):
- **Reschedule**: Cancel + Create must both succeed or both fail
- **Rollback**: If create fails, restore original appointment
- **Idempotency**: Duplicate requests return existing result

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Voice AI | VAPI | Voice assistant platform |
| Orchestration | Node.js + Express | PIMS-Sync service |
| Business Logic | TypeScript | IDEXX Provider |
| Browser Automation | Playwright | IDEXX Neo API calls |
| Database | Supabase (PostgreSQL) | OdisAI data storage |
| API | Next.js API Routes | VAPI tool endpoints |
| Authentication | API Keys | PIMS-Sync endpoint security |

---

## Diagrams

### Architecture Overview
- [Full 4-Level Architecture](./diagrams/architecture-overview.mmd) - Complete system diagram

### Workflows (Level 0 → Level 3)
- [Create Appointment](./diagrams/workflows/01-create-appointment.mmd)
- [Cancel Appointment](./diagrams/workflows/02-cancel-appointment.mmd)
- [Reschedule Appointment](./diagrams/workflows/03-reschedule-appointment.mmd)
- [Confirm Appointment](./diagrams/workflows/04-confirm-appointment.mmd)

### Provider Details (Level 2 Expanded)
- [Create Appointment Provider](./diagrams/provider-details/create-appointment-provider.mmd)
- [Cancel Appointment Provider](./diagrams/provider-details/cancel-appointment-provider.mmd)
- [Reschedule Appointment Provider](./diagrams/provider-details/reschedule-appointment-provider.mmd)
- [Search Appointment Provider](./diagrams/provider-details/search-appointment-provider.mmd)

### Submodules (Composite Components)
- [resolveClient Submodule](./diagrams/submodules/resolve-client.mmd)
- [resolveAppointment Submodule](./diagrams/submodules/resolve-appointment.mmd)

---

## Next Steps

1. **Implementation**: Implement PIMS-Sync endpoints (`appointments.route.ts`)
2. **VAPI Integration**: Update VAPI tool endpoints to call PIMS-Sync
3. **Testing**: Write tests for each level
4. **Documentation**: Add API reference for endpoints
5. **Monitoring**: Add Sentry instrumentation for error tracking

---

## Related Documentation

- [Workflows Documentation](./WORKFLOWS.md) - Detailed workflow descriptions
- [Provider Methods](./PROVIDER_METHODS.md) - Provider API reference
- [Submodules](./SUBMODULES.md) - Composite submodule details
- [Atomic Operations](./ATOMIC_OPERATIONS.md) - Level 3 operation reference
- [APPOINTMENT_API_DISCOVERY.md](./APPOINTMENT_API_DISCOVERY.md) - IDEXX API endpoints
- [APPOINTMENT_IMPLEMENTATION_SUMMARY.md](../APPOINTMENT_IMPLEMENTATION_SUMMARY.md) - Implementation status

---

**Last Updated**: 2026-01-25

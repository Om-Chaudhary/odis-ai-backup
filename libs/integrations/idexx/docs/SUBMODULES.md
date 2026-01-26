# IDEXX Composite Submodules Documentation

> Documentation for Level 2 composite submodules (reusable business logic components)

## Table of Contents

- [Overview](#overview)
- [resolveClient](#resolveclient)
- [resolveAppointment](#resolveappointment)
- [Usage Patterns](#usage-patterns)
- [Design Principles](#design-principles)

---

## Overview

Composite submodules are **reusable components** at Level 2 (Provider Business Logic) that encapsulate common patterns used across multiple workflows. They eliminate code duplication and provide consistent behavior.

### Available Submodules

| Submodule | Purpose | Used By | Input | Output |
|-----------|---------|---------|-------|--------|
| **resolveClient** | Find or create client + patient | `createAppointment` | Client + pet info | `client_id`, `patient_id` |
| **resolveAppointment** | Find appointment by various criteria | `cancelAppointment`, `rescheduleAppointment`, `searchAppointment` | Search criteria | Appointment object or list |

### Benefits

1. **Code Reuse**: Single implementation used across multiple workflows
2. **Consistency**: Standard behavior for common operations
3. **Testability**: Can be tested independently
4. **Maintainability**: Changes in one place affect all workflows
5. **Composition**: Higher-level workflows compose submodules

---

## resolveClient

### Purpose

Ensures a valid `client_id` and `patient_id` exist in IDEXX Neo before proceeding with appointment operations. Handles the complete client/patient resolution workflow:

1. Check if client already exists (duplicate check)
2. Create new client if needed
3. Search for patient under client
4. Create new patient if needed
5. Store records in OdisAI database

### Signature

```typescript
private async resolveClient(
  input: ResolveClientInput
): Promise<ResolveClientResult>
```

### Input Parameters

```typescript
interface ResolveClientInput {
  // Client information (required)
  clientFirstName: string;      // "Jane"
  clientLastName: string;       // "Smith"
  phone?: string;               // "(555) 123-4567" - recommended
  email?: string;               // "jane@example.com" - optional
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  
  // Pet information (required)
  petName: string;              // "Fluffy"
  species: string;              // "Cat", "Dog", etc.
  breed: string;                // "Persian", "Labrador", etc.
  gender?: string;              // "M", "F", "Unknown"
  birthDate?: string;           // ISO: "2020-01-15"
  color?: string;               // "Orange", "Black", etc.
  weight?: number;              // Pounds
}
```

### Output Structure

```typescript
interface ResolveClientResult {
  success: boolean;
  client_id: number;            // IDEXX client ID
  patient_id: number;           // IDEXX patient ID
  status: 'resolved';
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  patient?: {
    id: number;
    name: string;
    species: string;
    breed: string;
  };
  created: {
    client: boolean;            // true if new client created
    patient: boolean;           // true if new patient created
  };
  error?: string;
  errorCode?: string;
}
```

### Workflow Steps

#### Step 1: Client Resolution

**1a. Duplicate Check**
```typescript
// Check if client already exists
const existingClient = await this.clientDuplicateCheck(
  input.clientFirstName,
  input.clientLastName,
  input.phone
);

if (existingClient) {
  client_id = existingClient.id;
  created.client = false;
}
```

**1b. Create Client (if needed)**
```typescript
else {
  // Create new client in IDEXX
  const newClient = await this.createClientInPIM({
    firstName: input.clientFirstName,
    lastName: input.clientLastName,
    phone: input.phone,
    email: input.email,
    address: input.address
  });
  
  client_id = newClient.id;
  created.client = true;
  
  // Store in OdisAI database
  await this.storeClientInDB(newClient);
}
```

#### Step 2: Patient Resolution

**2a. Search Patient**
```typescript
// Search for patient by name (under client)
const patients = await this.searchPatientInPIM(
  input.petName,
  client_id
);

if (patients.length === 1) {
  patient_id = patients[0].id;
  created.patient = false;
} else if (patients.length > 1) {
  // Multiple patients with same name - use first, log warning
  patient_id = patients[0].id;
  created.patient = false;
  logger.warn('Multiple patients found with same name', { petName: input.petName, client_id });
}
```

**2b. Create Patient (if needed)**
```typescript
else {
  // Create new patient in IDEXX
  const newPatient = await this.createPatientInPIM({
    name: input.petName,
    species: input.species,
    breed: input.breed,
    gender: input.gender,
    birthDate: input.birthDate,
    color: input.color,
    weight: input.weight,
    client_id: client_id
  });
  
  patient_id = newPatient.id;
  created.patient = true;
  
  // Store in OdisAI database
  await this.storePatientInDB(newPatient, client_id);
}
```

### Usage Example

```typescript
class IdexxAppointmentManagementClient {
  async createAppointment(input: CreateAppointmentInput) {
    let clientId: number;
    let patientId: number;
    
    if (input.isNewClient || !input.client_id) {
      // Use resolveClient composite
      const resolved = await this.resolveClient({
        clientFirstName: input.clientFirstName!,
        clientLastName: input.clientLastName!,
        phone: input.phone,
        email: input.email,
        petName: input.petName,
        species: input.species,
        breed: input.breed
      });
      
      if (!resolved.success) {
        throw new Error(resolved.error);
      }
      
      clientId = resolved.client_id;
      patientId = resolved.patient_id;
      
      console.log(`Client: ${resolved.created.client ? 'created' : 'found'}`);
      console.log(`Patient: ${resolved.created.patient ? 'created' : 'found'}`);
    } else {
      // Existing client - search patient directly
      const patient = await this.searchPatientInPIM(input.petName);
      patientId = patient.id;
    }
    
    // Continue with appointment creation...
  }
}
```

### Error Handling

| Error Type | Code | Cause | Handling |
|------------|------|-------|----------|
| Input Validation | `INVALID_INPUT` | Missing required fields | Return error immediately |
| Client Creation Failed | `CLIENT_CREATE_FAILED` | IDEXX API error | Log error, return descriptive message |
| Patient Creation Failed | `PATIENT_CREATE_FAILED` | IDEXX API error | Client already created (partial success) |
| Multiple Patients | `PATIENT_AMBIGUOUS` | Multiple pets same name | Use first, log warning |
| Database Store Failed | `DB_STORE_FAILED` | DB write error | Log error, continue (IDEXX is source of truth) |

### Edge Cases

**1. Multiple Patients with Same Name**
```
Scenario: Client has 2 dogs both named "Max"
Resolution: Use first match, log warning for manual review
Enhancement: Add species/breed to search criteria
```

**2. Client Created but Patient Creation Fails**
```
Scenario: Client created successfully, but patient creation fails
Result: Partial success - client exists in IDEXX but no patient
Retry Behavior: Next attempt skips client creation (duplicate check finds it)
```

**3. Database Store Fails**
```
Scenario: Client/patient created in IDEXX, but DB store fails
Resolution: Log error, continue workflow (IDEXX is source of truth)
Reconciliation: Manual sync later to update OdisAI database
```

### Atomic Operations Used

- `clientDuplicateCheck(firstName, lastName, phone)` - GET `/clients/duplicateCheck`
- `createClientInPIM(clientData)` - POST `/clients/create`
- `searchPatientInPIM(petName, clientId)` - GET `/search/patients`
- `createPatientInPIM(patientData)` - POST `/patients/create`

### Diagram Reference

- [resolveClient Submodule Diagram](./diagrams/submodules/resolve-client.mmd)
- [Create Appointment Provider](./diagrams/provider-details/create-appointment-provider.mmd) - Usage context

---

## resolveAppointment

### Purpose

Finds an appointment in IDEXX Neo by various criteria. Used by workflows that need to locate an existing appointment before operating on it (cancel, reschedule, confirm). Handles:

1. Direct lookup by `appointmentId` (fastest)
2. Search by `petName + date` (+ optional filters)
3. Multiple results (disambiguation)
4. Not found scenarios

### Signature

```typescript
private async resolveAppointment(
  criteria: ResolveAppointmentInput
): Promise<ResolveAppointmentResult>
```

### Input Parameters

```typescript
interface ResolveAppointmentInput {
  // Option 1: Direct ID lookup (preferred if available)
  appointmentId?: string;       // "12345"
  
  // Option 2: Search criteria
  petName?: string;             // "Fluffy" - required if no appointmentId
  appointmentDate?: string;     // "2026-02-15" - required if no appointmentId
  
  // Optional filters for disambiguation
  clientPhone?: string;         // For multiple clients with same pet name
  clientName?: string;          // For disambiguation
  appointmentTime?: string;     // "14:00" - filters multiple results
  provider?: string;            // Provider name - filters results
  room?: string;                // Room name - filters results
  
  // Context
  clinic_id: string;
}
```

### Output Structure

```typescript
type ResolveAppointmentResult = 
  | SingleAppointmentResult
  | MultipleAppointmentsResult
  | NotFoundResult
  | ErrorResult;

// Single appointment found
interface SingleAppointmentResult {
  success: true;
  status: 'found';
  appointment_id: number;
  appointment: {
    id: number;
    date: string;
    time: string;
    timeEnd: string;
    patient: { id: number; name: string; breed: string; species: string };
    client: { id: number; firstName: string; lastName: string; phone: string };
    provider: { id: number; name: string };
    room: { id: number; name: string };
    type: { id: number; name: string };
  };
}

// Multiple appointments found
interface MultipleAppointmentsResult {
  success: true;
  status: 'multiple';
  appointments: Array<{
    id: number;
    date: string;
    time: string;
    timeEnd: string;
    provider: { name: string };
    room: { name: string };
    type: { name: string };
  }>;
  message: string;  // "Multiple appointments found. Please specify time or provider."
}

// Not found
interface NotFoundResult {
  success: true;
  status: 'not_found';
  appointment: null;
  message: string;  // "No appointment found for Fluffy on 2026-02-15"
}

// Error
interface ErrorResult {
  success: false;
  error: string;
  errorCode: string;
}
```

### Workflow Paths

#### Path 1: Direct ID Lookup

```typescript
if (criteria.appointmentId) {
  // Direct lookup
  const appointment = await this.getAppointment(criteria.appointmentId);
  
  if (!appointment) {
    return {
      success: false,
      error: `Appointment with ID ${criteria.appointmentId} not found`,
      errorCode: 'APPOINTMENT_NOT_FOUND'
    };
  }
  
  return {
    success: true,
    status: 'found',
    appointment_id: appointment.id,
    appointment: appointment
  };
}
```

#### Path 2: Search by Criteria

```typescript
else if (criteria.petName && criteria.appointmentDate) {
  // Step 1: Find patient
  const patients = await this.searchPatientInPIM(criteria.petName);
  
  if (patients.length === 0) {
    return {
      success: false,
      error: `Patient not found with name "${criteria.petName}"`,
      errorCode: 'PATIENT_NOT_FOUND'
    };
  }
  
  const patientId = patients[0].id;  // Use first if multiple
  
  // Step 2: Query appointments for patient on date
  const appointments = await this.searchAppointments({
    patient_id: patientId,
    date: criteria.appointmentDate
  });
  
  // Step 3: Filter by optional criteria
  let filtered = appointments;
  
  if (criteria.appointmentTime) {
    filtered = filtered.filter(appt => appt.time === criteria.appointmentTime);
  }
  
  if (criteria.provider) {
    filtered = filtered.filter(appt => appt.provider.name === criteria.provider);
  }
  
  // Step 4: Handle results
  if (filtered.length === 0) {
    return {
      success: true,
      status: 'not_found',
      appointment: null,
      message: `No appointment found for ${criteria.petName} on ${criteria.appointmentDate}`
    };
  } else if (filtered.length === 1) {
    return {
      success: true,
      status: 'found',
      appointment_id: filtered[0].id,
      appointment: filtered[0]
    };
  } else {
    return {
      success: true,
      status: 'multiple',
      appointments: filtered.map(appt => ({
        id: appt.id,
        date: appt.date,
        time: appt.time,
        timeEnd: appt.timeEnd,
        provider: { name: appt.provider.name },
        room: { name: appt.room.name },
        type: { name: appt.type.name }
      })),
      message: 'Multiple appointments found. Please specify time or provider.'
    };
  }
}
```

### Usage Examples

**Example 1: Cancel Appointment (Direct ID)**
```typescript
class IdexxAppointmentManagementClient {
  async cancelAppointment(input: CancelAppointmentInput) {
    // Resolve appointment
    const result = await this.resolveAppointment({
      appointmentId: input.appointmentId,
      clinic_id: input.clinic_id
    });
    
    if (result.status !== 'found') {
      throw new Error('Appointment not found');
    }
    
    // Proceed to cancel
    await this.cancelAppointmentInPIM(
      result.appointment_id,
      input.cancellationReason || 'Caller requested'
    );
  }
}
```

**Example 2: Cancel Appointment (Search + Disambiguation)**
```typescript
async cancelAppointment(input: CancelAppointmentInput) {
  // First attempt - search by pet name + date
  const result = await this.resolveAppointment({
    petName: input.petName,
    appointmentDate: input.appointmentDate,
    clientPhone: input.clientPhone,
    clinic_id: input.clinic_id
  });
  
  if (result.status === 'not_found') {
    return {
      success: false,
      error: result.message,
      errorCode: 'APPOINTMENT_NOT_FOUND'
    };
  }
  
  if (result.status === 'multiple') {
    // Return to VAPI for disambiguation
    return {
      success: false,
      error: 'MULTIPLE_APPOINTMENTS_FOUND',
      data: result.appointments,
      message: result.message
    };
  }
  
  // Single found - proceed to cancel
  await this.cancelAppointmentInPIM(result.appointment_id, input.cancellationReason);
}
```

**Example 3: Reschedule Appointment (Search + Store Backup)**
```typescript
async rescheduleAppointment(input: RescheduleAppointmentInput) {
  // Resolve original appointment
  const result = await this.resolveAppointment({
    petName: input.petName,
    originalDate: input.originalDate,
    clinic_id: input.clinic_id
  });
  
  if (result.status !== 'found') {
    throw new Error('Original appointment not found');
  }
  
  // Store full appointment data for rollback
  const backupData = result.appointment;
  
  // Begin atomic transaction
  try {
    // Cancel old
    await this.cancelAppointmentInPIM(result.appointment_id, 'Rescheduled');
    
    // Create new
    const newAppt = await this.createAppointmentInPIM({
      patient_id: backupData.patient.id,
      type_id: backupData.type.id,
      date: input.newDate,
      time: input.newTime,
      // ... other fields
    });
    
    return { success: true, oldId: result.appointment_id, newId: newAppt.id };
  } catch (error) {
    // Rollback - recreate old appointment
    await this.createAppointmentInPIM(backupData);
    throw error;
  }
}
```

### Disambiguation Flow

**Step 1: Multiple Found**
```typescript
{
  status: 'multiple',
  appointments: [
    { id: 1, time: "09:00", provider: "Dr. Smith", type: "Vaccination" },
    { id: 2, time: "14:00", provider: "Dr. Jones", type: "Surgery" }
  ],
  message: "Multiple appointments found. Please specify time or provider."
}
```

**Step 2: VAPI Asks Caller**
```
VAPI: "I found 2 appointments for Max on Friday. One at 9 AM with Dr. Smith, and one at 2 PM with Dr. Jones. Which one?"
Caller: "The 9 AM one"
```

**Step 3: Retry with Filter**
```typescript
const result = await this.resolveAppointment({
  petName: "Max",
  appointmentDate: "2026-02-15",
  appointmentTime: "09:00",  // NEW filter added
  clinic_id: "..."
});
// Now returns single appointment
```

### Error Handling

| Error Type | Code | Cause | Handling |
|------------|------|-------|----------|
| Input Validation | `INVALID_INPUT` | Missing required criteria | Return error |
| Patient Not Found | `PATIENT_NOT_FOUND` | No pet with that name | Return error |
| Multiple Patients | `PATIENT_AMBIGUOUS` | Multiple pets same name | Use first, log warning |
| Not Found | `NOT_FOUND` | No matching appointments | Return not found (not error) |
| Multiple Found | `MULTIPLE_APPOINTMENTS` | Ambiguous criteria | Return list for disambiguation |

### Edge Cases

**1. Multiple Patients with Same Name**
- Use first patient, log warning
- Consider adding species/breed to criteria

**2. Cancelled Appointments in Results**
- Filter out cancelled by default
- Include if specifically searching for cancelled

**3. Past Appointments**
- Include in search results
- VAPI can filter by date range if needed

### Atomic Operations Used

- `getAppointment(appointmentId)` - GET `/appointments/getAppointment?id={id}`
- `searchPatientInPIM(petName)` - GET `/search/patients?query={name}`
- `getAppointmentView()` - GET `/appointments/getAppointmentView` (for date range queries)

### Diagram Reference

- [resolveAppointment Submodule Diagram](./diagrams/submodules/resolve-appointment.mmd)
- [Cancel Appointment Provider](./diagrams/provider-details/cancel-appointment-provider.mmd) - Usage context
- [Reschedule Appointment Provider](./diagrams/provider-details/reschedule-appointment-provider.mmd) - Transaction usage
- [Search Appointment Provider](./diagrams/provider-details/search-appointment-provider.mmd) - Read-only usage

---

## Usage Patterns

### Pattern 1: Conditional Resolution

```typescript
// Use resolveClient only if needed
if (input.isNewClient || !input.client_id) {
  const resolved = await this.resolveClient(input);
  clientId = resolved.client_id;
  patientId = resolved.patient_id;
} else {
  // Existing client - skip to patient search
  const patient = await this.searchPatientInPIM(input.petName);
  patientId = patient.id;
}
```

### Pattern 2: Multiple Result Handling

```typescript
const result = await this.resolveAppointment(criteria);

switch (result.status) {
  case 'found':
    // Single result - proceed
    return await this.performOperation(result.appointment_id);
    
  case 'multiple':
    // Disambiguation needed
    return {
      success: false,
      error: 'MULTIPLE_APPOINTMENTS_FOUND',
      data: result.appointments,
      message: result.message
    };
    
  case 'not_found':
    // Not found
    return {
      success: false,
      error: 'APPOINTMENT_NOT_FOUND',
      message: result.message
    };
}
```

### Pattern 3: Backup Before Modify

```typescript
// Resolve and store backup for potential rollback
const result = await this.resolveAppointment(criteria);

if (result.status === 'found') {
  const backup = { ...result.appointment };  // Deep copy
  
  try {
    // Perform modification
    await this.modifyAppointment(result.appointment_id);
  } catch (error) {
    // Rollback using backup
    await this.restoreAppointment(backup);
    throw error;
  }
}
```

---

## Design Principles

### 1. Single Responsibility

Each submodule has one clear purpose:
- `resolveClient`: Ensure client and patient exist
- `resolveAppointment`: Find appointment by criteria

### 2. Composability

Submodules compose atomic operations:
```
resolveClient = clientDuplicateCheck + createClientInPIM + searchPatientInPIM + createPatientInPIM
resolveAppointment = searchPatientInPIM + getAppointment OR searchAppointments + filter
```

### 3. Reusability

Used across multiple workflows:
- `resolveClient`: `createAppointment`, future: `rescheduleAppointment` (if client changed)
- `resolveAppointment`: `cancelAppointment`, `rescheduleAppointment`, `searchAppointment`

### 4. Error Consistency

All submodules return consistent error structures:
```typescript
{
  success: boolean,
  error?: string,
  errorCode?: string
}
```

### 5. Testability

Each submodule can be tested independently with mocked atomic operations.

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md) - System architecture
- [Workflows](./WORKFLOWS.md) - End-to-end workflows using submodules
- [Provider Methods](./PROVIDER_METHODS.md) - Methods that compose submodules
- [Atomic Operations](./ATOMIC_OPERATIONS.md) - Operations used by submodules

---

**Last Updated**: 2026-01-25

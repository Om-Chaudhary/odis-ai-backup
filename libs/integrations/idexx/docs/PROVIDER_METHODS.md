# IDEXX Provider Methods Documentation

> API reference for Level 2 provider methods (business logic layer)

## Table of Contents

- [Overview](#overview)
- [Provider Class](#provider-class)
- [Primary Methods](#primary-methods)
- [Method Reference](#method-reference)
- [Type Definitions](#type-definitions)
- [Usage Examples](#usage-examples)

---

## Overview

The `IdexxAppointmentManagementClient` provider class encapsulates the business logic for appointment management operations in IDEXX Neo. It sits at **Level 2** of the architecture, composing atomic Level 3 operations into meaningful workflows.

### Responsibilities

- **Business Logic**: Implement workflow logic (validation, conditional branching, error handling)
- **Composition**: Combine atomic operations into higher-level methods
- **Reusability**: Provide composite submodules (resolveClient, resolveAppointment)
- **Error Transformation**: Convert low-level errors into business errors
- **Data Enrichment**: Add calculated fields, format responses

### Location

```
libs/integrations/idexx/src/provider/appointment-management-client.ts
```

---

## Provider Class

### Class Definition

```typescript
class IdexxAppointmentManagementClient {
  constructor(
    private credentials: IdexxCredentials,
    private browser: Browser
  ) {}
  
  // Initialization
  async initialize(): Promise<void>;
  async authenticate(): Promise<void>;
  
  // Primary Methods
  async createAppointment(input: CreateAppointmentInput): Promise<AppointmentOperationResult>;
  async cancelAppointment(input: CancelAppointmentInput): Promise<AppointmentOperationResult>;
  async rescheduleAppointment(input: RescheduleAppointmentInput): Promise<RescheduleOperationResult>;
  async searchAppointment(input: SearchAppointmentInput): Promise<SearchAppointmentResult>;
  
  // Composite Submodules
  private async resolveClient(input: ResolveClientInput): Promise<ResolveClientResult>;
  private async resolveAppointment(criteria: ResolveAppointmentInput): Promise<ResolveAppointmentResult>;
  
  // Atomic Operations (private - Level 3)
  private async clientDuplicateCheck(...): Promise<...>;
  private async createClientInPIM(...): Promise<...>;
  private async searchPatientInPIM(...): Promise<...>;
  private async createPatientInPIM(...): Promise<...>;
  private async getAppointment(...): Promise<...>;
  private async getAppointmentView(): Promise<...>;
  private async createAppointmentInPIM(...): Promise<...>;
  private async cancelAppointmentInPIM(...): Promise<...>;
}
```

### Initialization

```typescript
// Create instance
const provider = new IdexxAppointmentManagementClient(
  credentials: {
    url: "https://neo.idexx.com",
    username: "clinic_user",
    password: "secure_password"
  },
  browser: playwrightBrowser
);

// Initialize (authenticate + load lookup data)
await provider.initialize();
```

---

## Primary Methods

### Summary Table

| Method | Purpose | Input | Output | Submodules Used |
|--------|---------|-------|--------|-----------------|
| `createAppointment` | Book new appointment | Appointment details | Appointment record | `resolveClient` |
| `cancelAppointment` | Cancel appointment | Appointment ID or criteria | Cancellation confirmation | `resolveAppointment` |
| `rescheduleAppointment` | Move appointment | Old + new details | Old and new appointment records | `resolveAppointment` |
| `searchAppointment` | Find/verify appointment | Search criteria | Appointment details or list | `resolveAppointment` |

---

## Method Reference

### createAppointment

**Purpose**: Create a new appointment in IDEXX Neo.

**Signature**:
```typescript
async createAppointment(
  input: CreateAppointmentInput
): Promise<AppointmentOperationResult>
```

**Input**:
```typescript
interface CreateAppointmentInput {
  // Pet information
  petName: string;
  species: string;          // "Cat", "Dog", etc.
  breed: string;
  gender?: string;          // "M", "F", "Unknown"
  birthDate?: string;       // ISO format
  color?: string;
  
  // Client information (if new client)
  isNewClient?: boolean;
  clientFirstName?: string; // Required if isNewClient
  clientLastName?: string;  // Required if isNewClient
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  
  // Appointment details
  appointmentDate: string;  // ISO: "2026-02-15"
  time: string;             // 24-hour: "14:00"
  time_end: string;         // 24-hour: "14:30"
  appointmentType: string;  // Type ID from IDEXX
  room: string;             // Room ID from IDEXX
  provider?: string;        // Provider ID (optional)
  notes?: string;           // Appointment notes
  
  // Context
  clinic_id: string;
}
```

**Output**:
```typescript
interface AppointmentOperationResult {
  success: boolean;
  appointmentId?: string;
  confirmationNumber?: string;
  appointment?: {
    id: string;
    date: string;
    time: string;
    timeEnd: string;
    type: { id: string; name: string };
    room: { id: string; name: string };
    provider?: { id: string; name: string };
  };
  patient?: {
    id: string;
    name: string;
    breed: string;
    species: string;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  error?: string;
  errorCode?: string;
}
```

**Workflow**:
1. Check if client is new or existing
2. **If new**: Call `resolveClient` to create/find client and patient
3. **If existing**: Search for patient directly
4. Build appointment payload
5. Optionally check slot availability
6. Call `createAppointmentInPIM` atomic operation
7. Return structured result

**Errors**:
- `INVALID_INPUT` - Missing required fields
- `CLIENT_RESOLUTION_FAILED` - Could not create/find client
- `PATIENT_NOT_FOUND` - Patient not found for existing client
- `SLOT_UNAVAILABLE` - Time slot already booked
- `IDEXX_API_ERROR` - IDEXX API failure

**Example**:
```typescript
const result = await provider.createAppointment({
  petName: "Fluffy",
  species: "Cat",
  breed: "Persian",
  isNewClient: true,
  clientFirstName: "Jane",
  clientLastName: "Smith",
  phone: "(555) 123-4567",
  appointmentDate: "2026-02-15",
  time: "14:00",
  time_end: "14:30",
  appointmentType: "5", // Wellness Exam
  room: "3",            // Exam Room 3
  clinic_id: "clinic-123"
});

if (result.success) {
  console.log(`Created appointment ${result.appointmentId}`);
}
```

**Diagram**: [Create Appointment Provider Detail](./diagrams/provider-details/create-appointment-provider.mmd)

---

### cancelAppointment

**Purpose**: Cancel an existing appointment in IDEXX Neo (soft delete).

**Signature**:
```typescript
async cancelAppointment(
  input: CancelAppointmentInput
): Promise<AppointmentOperationResult>
```

**Input**:
```typescript
interface CancelAppointmentInput {
  // Option 1: Direct ID
  appointmentId?: string;
  
  // Option 2: Search criteria
  petName?: string;           // Required if no appointmentId
  appointmentDate?: string;   // Required if no appointmentId
  
  // Optional disambiguation
  clientPhone?: string;
  clientName?: string;
  appointmentTime?: string;
  
  // Cancellation details
  cancellationReason?: string; // Default: "Caller requested"
  
  // Context
  clinic_id: string;
}
```

**Output**:
```typescript
interface AppointmentOperationResult {
  success: boolean;
  appointmentId: string;
  status: 'cancelled';
  cancelledAt: string;        // ISO timestamp
  reason: string;
  appointment?: {
    id: string;
    originalDate: string;
    originalTime: string;
    patient: { name: string; breed: string };
    client: { name: string; phone: string };
  };
  error?: string;
  errorCode?: string;
}
```

**Workflow**:
1. Call `resolveAppointment` to find appointment
2. If not found: Return error
3. If multiple: Return list for disambiguation
4. If already cancelled: Return idempotent success
5. Call `cancelAppointmentInPIM` with reason
6. Return cancellation confirmation

**Errors**:
- `INVALID_INPUT` - Missing required criteria
- `APPOINTMENT_NOT_FOUND` - No appointment matches
- `APPOINTMENT_AMBIGUOUS` - Multiple appointments found
- `ALREADY_CANCELLED` - Already cancelled (idempotent)
- `IDEXX_API_ERROR` - IDEXX API failure

**Example**:
```typescript
const result = await provider.cancelAppointment({
  petName: "Fluffy",
  appointmentDate: "2026-02-15",
  cancellationReason: "Client rescheduling",
  clinic_id: "clinic-123"
});

if (result.success) {
  console.log(`Cancelled appointment ${result.appointmentId}`);
}
```

**Diagram**: [Cancel Appointment Provider Detail](./diagrams/provider-details/cancel-appointment-provider.mmd)

---

### rescheduleAppointment

**Purpose**: Reschedule an existing appointment (atomic cancel + create transaction).

**Signature**:
```typescript
async rescheduleAppointment(
  input: RescheduleAppointmentInput
): Promise<RescheduleOperationResult>
```

**Input**:
```typescript
interface RescheduleAppointmentInput {
  // Original appointment
  appointmentId?: string;
  petName?: string;
  originalDate?: string;
  originalTime?: string;
  
  // New appointment details
  newDate: string;          // Required
  newTime: string;          // Required
  newTime_end: string;      // Required
  
  // Optional overrides
  newRoom?: string;
  newProvider?: string;
  newType?: string;
  
  // Metadata
  reason?: string;
  
  // Context
  clinic_id: string;
}
```

**Output**:
```typescript
interface RescheduleOperationResult {
  success: boolean;
  oldAppointmentId: string;
  newAppointmentId: string;
  status: 'rescheduled';
  rescheduledAt: string;
  oldAppointment: {
    id: string;
    originalDate: string;
    originalTime: string;
    cancelledAt: string;
  };
  newAppointment: {
    id: string;
    date: string;
    time: string;
    timeEnd: string;
    room: { id: string; name: string };
    provider: { id: string; name: string };
    type: { id: string; name: string };
  };
  error?: string;
  errorCode?: string;
}
```

**Workflow (Atomic Transaction)**:
1. Call `resolveAppointment` to find original appointment
2. Store complete original appointment data (for rollback)
3. **BEGIN TRANSACTION**
4. **Step 1**: `cancelAppointmentInPIM(old_id, "Rescheduled")`
   - If fails: ABORT, no changes
5. **Step 2**: `createAppointmentInPIM(new_data)`
   - If fails: ROLLBACK - recreate old appointment
6. **COMMIT**: Link old → new in database
7. Return both appointment details

**Errors**:
- `INVALID_INPUT` - Missing required fields
- `APPOINTMENT_NOT_FOUND` - Original appointment not found
- `ALREADY_CANCELLED` - Cannot reschedule cancelled appointment
- `SLOT_UNAVAILABLE` - New slot not available
- `CANCEL_FAILED` - Cancel operation failed (abort)
- `CREATE_FAILED` - Create operation failed (rollback)
- `ROLLBACK_FAILED` - Critical error requiring manual intervention

**Example**:
```typescript
const result = await provider.rescheduleAppointment({
  petName: "Fluffy",
  originalDate: "2026-02-15",
  newDate: "2026-02-16",
  newTime: "14:00",
  newTime_end: "14:30",
  clinic_id: "clinic-123"
});

if (result.success) {
  console.log(`Rescheduled from ${result.oldAppointmentId} to ${result.newAppointmentId}`);
}
```

**Diagram**: [Reschedule Appointment Provider Detail](./diagrams/provider-details/reschedule-appointment-provider.mmd)

---

### searchAppointment

**Purpose**: Search for and return appointment details (read-only).

**Signature**:
```typescript
async searchAppointment(
  input: SearchAppointmentInput
): Promise<SearchAppointmentResult>
```

**Input**:
```typescript
interface SearchAppointmentInput {
  // Required criteria
  petName: string;
  appointmentDate: string;
  
  // Optional disambiguation
  clientName?: string;
  clientPhone?: string;
  appointmentTime?: string;
  
  // Context
  clinic_id: string;
}
```

**Output**:
```typescript
type SearchAppointmentResult = 
  | SingleAppointmentResult
  | MultipleAppointmentsResult
  | NotFoundResult;

interface SingleAppointmentResult {
  success: true;
  found: true;
  multiple: false;
  appointment: {
    id: string;
    date: string;
    time: string;
    timeEnd: string;
    duration: string;         // "30 mins"
    patient: { name: string; breed: string; species: string };
    client: { firstName: string; lastName: string; phone: string };
    provider: { name: string };
    room: { name: string };
    type: { name: string };
    confirmationMessage: string;  // For VAPI to read
  };
}

interface MultipleAppointmentsResult {
  success: true;
  found: true;
  multiple: true;
  appointments: Array<{
    id: string;
    date: string;
    time: string;
    timeEnd: string;
    provider: { name: string };
    room: { name: string };
    type: { name: string };
  }>;
  message: string;              // "Multiple appointments found..."
}

interface NotFoundResult {
  success: true;
  found: false;
  multiple: false;
  message: string;              // "No appointment found for..."
}
```

**Workflow**:
1. Call `resolveAppointment` to search
2. **If not found**: Return not found message
3. **If multiple**: Return list for disambiguation
4. **If single**: Call `getAppointment` for full details
5. Enrich data (calculate duration, format times)
6. Generate confirmation message for VAPI
7. Return structured result

**Errors**:
- `INVALID_INPUT` - Missing required criteria
- `PATIENT_NOT_FOUND` - No patient with that name
- `FETCH_FAILED` - Could not retrieve appointment details

**Example**:
```typescript
const result = await provider.searchAppointment({
  petName: "Fluffy",
  appointmentDate: "2026-02-15",
  clinic_id: "clinic-123"
});

if (result.found && !result.multiple) {
  console.log(result.appointment.confirmationMessage);
  // "Fluffy has a Wellness Exam on Friday, February 15th at 2:00 PM..."
}
```

**Diagram**: [Search Appointment Provider Detail](./diagrams/provider-details/search-appointment-provider.mmd)

---

## Type Definitions

### Common Types

```typescript
// IDEXX Credentials
interface IdexxCredentials {
  url: string;              // "https://neo.idexx.com"
  username: string;
  password: string;
}

// Lookup Data Types
interface AppointmentType {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
}

interface Provider {
  id: string;
  name: string;
}

// Entity Types
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

interface Patient {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender?: string;
  birthDate?: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  timeEnd: string;
  patient_id: number;
  type_id: number;
  room_id: number;
  user_id?: number;
  notes?: string;
}
```

---

## Usage Examples

### Complete Workflow Example

```typescript
// 1. Initialize provider
const provider = new IdexxAppointmentManagementClient(
  { url: "...", username: "...", password: "..." },
  browser
);
await provider.initialize();

// 2. Create appointment for new client
const createResult = await provider.createAppointment({
  petName: "Fluffy",
  species: "Cat",
  breed: "Persian",
  isNewClient: true,
  clientFirstName: "Jane",
  clientLastName: "Smith",
  phone: "(555) 123-4567",
  appointmentDate: "2026-02-15",
  time: "14:00",
  time_end: "14:30",
  appointmentType: "5",
  room: "3",
  clinic_id: "clinic-123"
});

console.log(`Created: ${createResult.appointmentId}`);

// 3. Search for appointment
const searchResult = await provider.searchAppointment({
  petName: "Fluffy",
  appointmentDate: "2026-02-15",
  clinic_id: "clinic-123"
});

if (searchResult.found && !searchResult.multiple) {
  console.log(searchResult.appointment.confirmationMessage);
}

// 4. Reschedule appointment
const rescheduleResult = await provider.rescheduleAppointment({
  appointmentId: createResult.appointmentId,
  newDate: "2026-02-16",
  newTime: "14:00",
  newTime_end: "14:30",
  clinic_id: "clinic-123"
});

console.log(`Rescheduled to: ${rescheduleResult.newAppointmentId}`);

// 5. Cancel appointment
const cancelResult = await provider.cancelAppointment({
  appointmentId: rescheduleResult.newAppointmentId,
  cancellationReason: "Client cancelled",
  clinic_id: "clinic-123"
});

console.log(`Cancelled: ${cancelResult.status}`);
```

### Error Handling Example

```typescript
try {
  const result = await provider.createAppointment(input);
  
  if (!result.success) {
    switch (result.errorCode) {
      case 'CLIENT_RESOLUTION_FAILED':
        console.error('Could not create/find client');
        break;
      case 'SLOT_UNAVAILABLE':
        console.error('Time slot not available');
        // Offer alternative times
        break;
      case 'IDEXX_API_ERROR':
        console.error('IDEXX API error - retry');
        // Implement retry logic
        break;
      default:
        console.error(`Unexpected error: ${result.error}`);
    }
  }
} catch (error) {
  console.error('Provider error:', error);
  // Handle unexpected exceptions
}
```

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md) - System architecture
- [Workflows](./WORKFLOWS.md) - End-to-end workflow descriptions
- [Submodules](./SUBMODULES.md) - Composite submodule details
- [Atomic Operations](./ATOMIC_OPERATIONS.md) - Level 3 operation reference
- [APPOINTMENT_API_DISCOVERY.md](./APPOINTMENT_API_DISCOVERY.md) - IDEXX API endpoints

---

**Last Updated**: 2026-01-25

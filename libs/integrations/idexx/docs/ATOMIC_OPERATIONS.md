# IDEXX Atomic Operations Reference

> Complete reference for Level 3 atomic operations (Playwright browser automation)

## Table of Contents

- [Overview](#overview)
- [Client Operations](#client-operations)
- [Patient Operations](#patient-operations)
- [Appointment Operations](#appointment-operations)
- [Lookup Operations](#lookup-operations)
- [Implementation Notes](#implementation-notes)

---

## Overview

Atomic operations are **Level 3** operations that make direct HTTP calls to IDEXX Neo via Playwright browser automation. Each operation is:

- **Single-purpose**: Does one thing only
- **Stateless**: No side effects beyond the API call
- **Private**: Only called by Level 2 provider methods
- **Low-level**: Maps directly to IDEXX Neo API endpoints

### Implementation

All atomic operations are implemented as **private methods** in `IdexxAppointmentManagementClient`:

```typescript
class IdexxAppointmentManagementClient {
  // Playwright API context
  private apiContext: APIRequestContext;
  
  // Private atomic operations
  private async clientSearch(...): Promise<...> { }
  private async clientDuplicateCheck(...): Promise<...> { }
  private async createClientInPIM(...): Promise<...> { }
  // ... more operations
}
```

### Playwright Pattern

```typescript
private async createAppointmentInPIM(data: AppointmentPayload): Promise<Appointment> {
  const response = await this.apiContext.post('/appointments/create', {
    multipart: {
      patient_id: data.patient_id.toString(),
      type_id: data.type_id.toString(),
      appointment_date: data.appointment_date,
      time: data.time,
      time_end: data.time_end,
      room: data.room
    }
  });
  
  if (!response.ok()) {
    throw new Error(`Failed to create appointment: ${response.status()}`);
  }
  
  return response.json();
}
```

---

## Client Operations

### clientSearch

**Purpose**: Search for clients by name or partial match.

**Signature**:
```typescript
private async clientSearch(
  searchTerm: string
): Promise<Client[]>
```

**HTTP Request**:
```
GET /clients/search?q={searchTerm}
```

**Request Headers**:
```
Cookie: neo_session={session_cookie}
```

**Response**:
```json
{
  "clients": [
    {
      "id": 789,
      "first_name": "Jane",
      "last_name": "Smith",
      "phone": "(555) 123-4567",
      "email": "jane@example.com",
      "address": {
        "street": "123 Main St",
        "city": "Springfield",
        "state": "IL",
        "zip_code": "62701"
      }
    }
  ]
}
```

**Error Handling**:
- 404: No clients found (return empty array)
- 500: IDEXX API error (throw error)

---

### clientDuplicateCheck

**Purpose**: Check if a client already exists by exact match (first name + last name + phone).

**Signature**:
```typescript
private async clientDuplicateCheck(
  firstName: string,
  lastName: string,
  phone?: string
): Promise<Client | null>
```

**HTTP Request**:
```
GET /clients/duplicateCheck?firstName={firstName}&lastName={lastName}&phone={phone}
```

**Request Headers**:
```
Cookie: neo_session={session_cookie}
```

**Response (Match Found)**:
```json
{
  "client_id": 789,
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "(555) 123-4567",
  "email": "jane@example.com"
}
```

**Response (No Match)**:
```json
{
  "client_id": null
}
```

**Error Handling**:
- 404: No duplicate found (return null)
- 500: IDEXX API error (throw error)

**Match Logic**:
- Exact match: `firstName` + `lastName` + `phone`
- Fuzzy match: Similar name + same phone

---

### createClientInPIM

**Purpose**: Create a new client record in IDEXX Neo.

**Signature**:
```typescript
private async createClientInPIM(
  clientData: CreateClientPayload
): Promise<Client>
```

**HTTP Request**:
```
POST /clients/create
Content-Type: application/json
```

**Request Body**:
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "(555) 123-4567",
  "email": "jane@example.com",
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip_code": "62701"
  }
}
```

**Response (Success)**:
```json
{
  "client_id": 789,
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "(555) 123-4567",
  "email": "jane@example.com",
  "created_at": "2026-01-25T18:30:00Z"
}
```

**Error Handling**:
- 400: Invalid input (missing required fields)
- 409: Duplicate client (rare - should be caught by duplicateCheck)
- 500: IDEXX API error

---

## Patient Operations

### searchPatientInPIM

**Purpose**: Search for patients by name (optionally scoped to a client).

**Signature**:
```typescript
private async searchPatientInPIM(
  query: string,
  clientId?: number
): Promise<Patient[]>
```

**HTTP Request**:
```
GET /search/patients?query={query}&client_id={clientId}
```

**Request Headers**:
```
Cookie: neo_session={session_cookie}
```

**Response**:
```json
{
  "patients": [
    {
      "id": 456,
      "name": "Fluffy",
      "species": "Cat",
      "breed": "Persian",
      "gender": "F",
      "birth_date": "2020-01-15",
      "color": "Orange",
      "weight": 12.5,
      "client_id": 789,
      "client_name": "Jane Smith"
    }
  ]
}
```

**Error Handling**:
- 404: No patients found (return empty array)
- 500: IDEXX API error

**Edge Cases**:
- Multiple patients with same name: Return all, caller handles disambiguation
- Patient name with special characters: URL encode query

---

### createPatientInPIM

**Purpose**: Create a new patient record in IDEXX Neo.

**Signature**:
```typescript
private async createPatientInPIM(
  patientData: CreatePatientPayload
): Promise<Patient>
```

**HTTP Request**:
```
POST /patients/create
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Fluffy",
  "species": "Cat",
  "breed": "Persian",
  "gender": "F",
  "birth_date": "2020-01-15",
  "color": "Orange",
  "weight": 12.5,
  "client_id": 789
}
```

**Response (Success)**:
```json
{
  "patient_id": 456,
  "name": "Fluffy",
  "species": "Cat",
  "breed": "Persian",
  "gender": "F",
  "birth_date": "2020-01-15",
  "color": "Orange",
  "weight": 12.5,
  "client_id": 789,
  "created_at": "2026-01-25T18:30:00Z"
}
```

**Error Handling**:
- 400: Invalid input (missing required fields)
- 404: Client not found
- 500: IDEXX API error

**Required Fields**:
- `name` (string)
- `species` (string)
- `breed` (string)
- `client_id` (number)

**Optional Fields**:
- `gender` ("M", "F", "Unknown")
- `birth_date` (ISO format)
- `color` (string)
- `weight` (number, pounds)

---

### getPatientDetails

**Purpose**: Retrieve full patient details by ID.

**Signature**:
```typescript
private async getPatientDetails(
  patientId: number
): Promise<Patient>
```

**HTTP Request**:
```
GET /patients/getPatient/{patientId}
```

**Response**:
```json
{
  "patient_id": 456,
  "name": "Fluffy",
  "species": "Cat",
  "breed": "Persian",
  "gender": "F",
  "birth_date": "2020-01-15",
  "color": "Orange",
  "weight": 12.5,
  "client_id": 789,
  "client": {
    "id": 789,
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "(555) 123-4567"
  },
  "medical_history": {
    "allergies": [],
    "medications": [],
    "conditions": []
  }
}
```

**Error Handling**:
- 404: Patient not found
- 500: IDEXX API error

---

## Appointment Operations

### getAppointment

**Purpose**: Retrieve full appointment details by ID.

**Signature**:
```typescript
private async getAppointment(
  appointmentId: string
): Promise<Appointment>
```

**HTTP Request**:
```
GET /appointments/getAppointment?id={appointmentId}
```

**Response**:
```json
{
  "appointment_id": "12345",
  "appointment_date": "2026-02-15",
  "time": "14:00",
  "time_end": "14:30",
  "patient_id": 456,
  "patient": {
    "id": 456,
    "name": "Fluffy",
    "breed": "Persian",
    "species": "Cat"
  },
  "client_id": 789,
  "client": {
    "id": 789,
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "(555) 123-4567"
  },
  "type_id": 5,
  "type": {
    "id": 5,
    "name": "Wellness Exam"
  },
  "room_id": 3,
  "room": {
    "id": 3,
    "name": "Exam Room 3"
  },
  "user_id": 10,
  "provider": {
    "id": 10,
    "name": "Dr. Emily Brown"
  },
  "notes": "Annual checkup",
  "status": "scheduled",
  "created_at": "2026-01-25T18:30:00Z"
}
```

**Error Handling**:
- 404: Appointment not found
- 500: IDEXX API error

---

### getAppointmentView

**Purpose**: Retrieve lookup data for appointments (types, rooms, providers).

**Signature**:
```typescript
private async getAppointmentView(): Promise<AppointmentViewData>
```

**HTTP Request**:
```
GET /appointments/getAppointmentView
```

**Response**:
```json
{
  "types": [
    { "id": 1, "name": "Consultation" },
    { "id": 2, "name": "Surgery" },
    { "id": 5, "name": "Wellness Exam" },
    { "id": 7, "name": "Vaccination" }
  ],
  "rooms": [
    { "id": 1, "name": "Exam Room 1" },
    { "id": 2, "name": "Exam Room 2" },
    { "id": 3, "name": "Exam Room 3" },
    { "id": 4, "name": "Surgery Room" }
  ],
  "providers": [
    { "id": 10, "name": "Dr. Emily Brown" },
    { "id": 11, "name": "Dr. Michael Smith" },
    { "id": 12, "name": "Dr. Sarah Jones" }
  ]
}
```

**Usage**: Called during initialization, cached for the session.

**Error Handling**:
- 500: IDEXX API error (critical - cannot proceed without lookup data)

---

### createAppointmentInPIM

**Purpose**: Create a new appointment in IDEXX Neo.

**Signature**:
```typescript
private async createAppointmentInPIM(
  data: AppointmentPayload
): Promise<Appointment>
```

**HTTP Request**:
```
POST /appointments/create
Content-Type: multipart/form-data
```

**Request Body** (multipart/form-data):
```
patient_id=456
type_id=5
appointment_date=2026-02-15
time=14:00
time_end=14:30
room=3
user_id=10
notes=Annual checkup
```

**Note**: IDEXX Neo expects `multipart/form-data`, not JSON.

**Response (Success)**:
```json
{
  "appointment_id": "12345",
  "appointment_date": "2026-02-15",
  "time": "14:00",
  "time_end": "14:30",
  "patient_id": 456,
  "type_id": 5,
  "room_id": 3,
  "user_id": 10,
  "notes": "Annual checkup",
  "status": "scheduled",
  "confirmation_number": "CONF-67890",
  "created_at": "2026-01-25T18:30:00Z"
}
```

**Error Handling**:
- 400: Invalid input (missing required fields, invalid type/room/provider)
- 409: Time slot conflict (room already booked)
- 500: IDEXX API error

**Required Fields**:
- `patient_id` (number)
- `type_id` (number)
- `appointment_date` (YYYY-MM-DD)
- `time` (HH:mm)
- `time_end` (HH:mm)
- `room` (string - room ID)

**Optional Fields**:
- `user_id` (number - provider ID)
- `notes` (string)

---

### cancelAppointmentInPIM

**Purpose**: Cancel an existing appointment (soft delete).

**Signature**:
```typescript
private async cancelAppointmentInPIM(
  appointmentId: string,
  reason: string
): Promise<void>
```

**HTTP Request**:
```
POST /appointments/delete/{appointmentId}
Content-Type: application/json
```

**Request Body**:
```json
{
  "action": "cancel",
  "reason": "Caller requested cancellation"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Appointment cancelled",
  "appointment_id": "12345",
  "cancelled_at": "2026-01-25T18:30:00Z"
}
```

**Error Handling**:
- 404: Appointment not found
- 409: Appointment already cancelled
- 500: IDEXX API error

**Note**: Uses `action: "cancel"` for soft delete (preserves history). Use `action: "delete"` for hard delete (admin only).

---

### deleteAppointmentInPIM

**Purpose**: Permanently delete an appointment (hard delete - admin only).

**Signature**:
```typescript
private async deleteAppointmentInPIM(
  appointmentId: string
): Promise<void>
```

**HTTP Request**:
```
POST /appointments/delete/{appointmentId}
Content-Type: application/json
```

**Request Body**:
```json
{
  "action": "delete"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Appointment deleted",
  "appointment_id": "12345"
}
```

**Error Handling**:
- 404: Appointment not found
- 403: Insufficient permissions
- 500: IDEXX API error

**Warning**: This is a hard delete. Use `cancelAppointmentInPIM` instead for normal cancellations.

---

## Lookup Operations

### getGenders

**Purpose**: Retrieve list of valid gender options.

**Signature**:
```typescript
private async getGenders(): Promise<Gender[]>
```

**HTTP Request**:
```
GET /genders/getGenders
```

**Response**:
```json
{
  "genders": [
    { "id": "M", "name": "Male" },
    { "id": "F", "name": "Female" },
    { "id": "U", "name": "Unknown" }
  ]
}
```

**Usage**: Called during initialization, cached for the session.

---

## Implementation Notes

### Authentication

All operations require an authenticated Playwright `APIRequestContext`:

```typescript
// During initialization
const context = await this.browser.newContext();
const page = await context.newPage();

// Login
await page.goto(this.credentials.url);
await page.fill('[name="username"]', this.credentials.username);
await page.fill('[name="password"]', this.credentials.password);
await page.click('[type="submit"]');
await page.waitForNavigation();

// Extract cookies
const cookies = await context.cookies();

// Create API context with cookies
this.apiContext = await this.browser.newContext({
  extraHTTPHeaders: {
    'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; ')
  }
});
```

### Error Handling Pattern

```typescript
private async atomicOperation(): Promise<Result> {
  try {
    const response = await this.apiContext.get('/endpoint');
    
    if (!response.ok()) {
      throw new Error(`API error: ${response.status()} ${response.statusText()}`);
    }
    
    return response.json();
  } catch (error) {
    // Log error with context
    logger.error('Atomic operation failed', {
      operation: 'atomicOperation',
      error: error.message,
      stack: error.stack
    });
    
    // Re-throw for caller to handle
    throw new Error(`Failed to perform operation: ${error.message}`);
  }
}
```

### Retry Logic

Implement exponential backoff for transient errors:

```typescript
private async withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 1
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Only retry on transient errors
      if (error.message.includes('timeout') || error.message.includes('ECONNRESET')) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      
      // Don't retry on other errors
      throw error;
    }
  }
  
  throw lastError;
}

// Usage
const result = await this.withRetry(() => this.createAppointmentInPIM(data));
```

### Cleanup

Always clean up Playwright resources:

```typescript
async destroy(): Promise<void> {
  await this.apiContext?.dispose();
  await this.browser?.close();
}
```

### Performance Optimization

1. **Reuse API Context**: Create once during initialization, reuse for all operations
2. **Parallel Requests**: Use `Promise.all()` for independent operations
3. **Cache Lookup Data**: Store appointment types, rooms, providers for session
4. **Connection Pooling**: Playwright handles this automatically

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md) - System architecture
- [Provider Methods](./PROVIDER_METHODS.md) - Methods that compose atomic operations
- [Submodules](./SUBMODULES.md) - Composite submodules using atomic operations
- [APPOINTMENT_API_DISCOVERY.md](./APPOINTMENT_API_DISCOVERY.md) - Detailed API endpoint documentation

---

**Last Updated**: 2026-01-25

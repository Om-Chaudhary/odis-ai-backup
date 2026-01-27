# IDEXX Neo Appointment API Discovery

## Overview

This document outlines the IDEXX Neo appointment scheduling API integration, including discovered endpoints, implementation details, and testing procedures.

## Status

**Discovery Status**: ✅ Complete (January 25, 2026)

**Implementation Status**: ⏳ Pending update to match discovered endpoints

## Architecture

### System Overview

The IDEXX appointment management system follows a **4-level architecture**:

- **Level 0: VAPI Tool Calls** - Voice AI entry points (`book_appointment`, `cancel_appointment`, `reschedule_appointment`)
- **Level 1: PIMS-Sync Service** - HTTP API orchestration layer (`POST /api/sync/appointments/*`)
- **Level 2: IDEXX Provider Methods** - Business logic layer (composites atomic operations)
- **Level 3: Atomic IDEXX API Operations** - Playwright browser automation (this document)

### Complete Architecture Documentation

📚 **[Architecture Overview](./ARCHITECTURE_OVERVIEW.md)** - Complete 4-level system architecture

**Workflows:**
- [Create Appointment Workflow](./diagrams/workflows/01-create-appointment.mmd)
- [Cancel Appointment Workflow](./diagrams/workflows/02-cancel-appointment.mmd)
- [Reschedule Appointment Workflow](./diagrams/workflows/03-reschedule-appointment.mmd)
- [Confirm Appointment Workflow](./diagrams/workflows/04-confirm-appointment.mmd)

**Documentation:**
- [WORKFLOWS.md](./WORKFLOWS.md) - Primary workflow descriptions
- [PROVIDER_METHODS.md](./PROVIDER_METHODS.md) - Level 2 provider API reference
- [SUBMODULES.md](./SUBMODULES.md) - Composite submodules (resolveClient, resolveAppointment)
- [ATOMIC_OPERATIONS.md](./ATOMIC_OPERATIONS.md) - Level 3 operation reference (below)

---

## Confirmed API Endpoints

### Patient Search

```
GET /search/patients?q={query}&includeInactive=false&json=true&suggested=true&limit=100&escape=false&clientId=&firstSuggestionId=
```

**Headers:**

- `Accept: application/json`
- `X-Requested-With: XMLHttpRequest`
- `Cookie: {session_cookies}` (automatic via authenticated page context)

**Response:**

```json
{
  "results": {
    "patients": {
      "data": [],
      "objects": []
    },
    "suggested": {
      "objects": [
        {
          "id": 48290,
          "formattedId": "48290",
          "name": "RYDER",
          "breed": { "id": "1298", "name": "French Bulldog" },
          "species": { "id": "4", "name": "Canine" },
          "gender": { "id": "1", "name": "Neutered Male", "neutered": null },
          "color": "BROWN",
          "age": "4 yrs 9 mos",
          "status": "a",
          "alive": true,
          "active": true,
          "client": {
            "id": 19765,
            "firstName": "ROSEY",
            "lastName": "FLORES",
            "homePhone": null,
            "mobilePhone": "619-867-5163",
            "taxExempt": false
          }
        }
      ]
    }
  }
}
```

### Client Search

```
GET /clients/search?term={searchTerm}
```

### Client Duplicate Check

```
GET /clients/duplicateCheck?firstName={firstName}&lastName={lastName}&homePhone={phone}
```

### Email Validation

```
GET /clients/validateEmail?email={email}&allowEmpty=1
```

### Create Client

```
POST /clients/create
Content-Type: application/json
```

**Request Payload:**

```json
{
  "firstName": "Taylor",
  "lastName": "Allen",
  "title": "Mr",
  "homePhone": "9258958479",
  "workPhone": "",
  "mobilePhone": "",
  "email": "taylorallen0913@gmail.com",
  "address1": "6152 Kearny Way",
  "address2": null,
  "address3": null,
  "suburb": "",
  "city": "",
  "state": "",
  "postalCode": "",
  "country": ""
}
```

**Response:**

```json
{
  "success": true,
  "client": {
    "id": 20691,
    "firstName": "Taylor",
    "lastName": "Allen",
    "email": "taylorallen0913@gmail.com",
    "homePhone": "9258958479",
    "workPhone": null,
    "mobilePhone": null,
    "address1": "6152 Kearny Way",
    "address2": null,
    "address3": null,
    "suburb": null,
    "city": null,
    "state": null,
    "country": null,
    "active": true,
    "taxExempt": false,
    "registeredAtLocal": "2026-01-25T15:06:51",
    "deactivatedAtLocal": null
  }
}
```

### Create Patient

```
POST /patients/create
Content-Type: application/json
```

**Request Payload:**

```json
{
  "name": "Brownie",
  "species": {
    "id": 27,
    "name": "Dog",
    "active": true,
    "diagnosticsSpeciesId": null
  },
  "breed": {
    "id": 3592,
    "name": "Golden Doodle",
    "active": true,
    "species": {
      "id": 27,
      "name": "Dog",
      "active": true,
      "diagnosticsSpeciesId": null
    },
    "trupanionBreed": null
  },
  "color": "",
  "gender": {
    "id": 2,
    "name": "Male",
    "sex": "male",
    "neutered": false,
    "altered_gender_id": 1,
    "altered_gender_name": "Neutered Male",
    "code": "M",
    "active": true,
    "default": false,
    "diagnosticsGenderId": null,
    "patientsCount": 13158
  },
  "dob": null,
  "temperament": "",
  "microchip": "",
  "insuranceCompany": "",
  "insurancePolicyNumber": "",
  "client": {
    "id": 20691,
    "firstName": "Taylor",
    "lastName": "Allen",
    "email": "taylorallen0913@gmail.com",
    "homePhone": "9258958479",
    "workPhone": null,
    "mobilePhone": null,
    "address1": "6152 Kearny Way",
    "address2": null,
    "address3": null,
    "suburb": null,
    "city": null,
    "state": null,
    "country": null,
    "active": true,
    "taxExempt": false,
    "registeredAtLocal": "2026-01-25T15:06:51",
    "deactivatedAtLocal": null
  }
}
```

**Response:**

```json
{
  "success": true,
  "patient": {
    "id": 50081,
    "formattedId": "50081",
    "name": "Brownie",
    "breed": {
      "id": 3592,
      "name": "Golden Doodle",
      "active": true,
      "species": { "id": 27, "name": "Dog", "active": true, "diagnosticsSpeciesId": null },
      "trupanionBreed": null
    },
    "species": { "id": 27, "name": "Dog", "active": true, "diagnosticsSpeciesId": null },
    "color": null,
    "gender": {
      "id": 2,
      "name": "Male",
      "sex": "male",
      "neutered": false,
      "altered_gender_id": 1,
      "altered_gender_name": "Neutered Male"
    }
  }
}
```

### Create Appointment

```
POST /appointments/create
Content-Type: multipart/form-data
```

**Request Payload (multipart/form-data):**

| Field            | Value      | Description                    |
| ---------------- | ---------- | ------------------------------ |
| patient_id       | 50081      | Patient ID (required)          |
| type_id          | 1          | Appointment type ID (required) |
| user_id          | 1002       | Provider/User ID (required)    |
| room             | 11         | Room ID (required)             |
| appointment_date | 2026-01-25 | Date (YYYY-MM-DD)              |
| time             | 14:00      | Start time (HH:MM)             |
| time_end         | 14:15      | End time (HH:MM)               |
| useRealEndTime   | true       | Use actual end time            |

**Response:**

```json
{
  "success": true
}
```

### Cancel/Delete Appointment

```
POST /appointments/delete/{appointmentId}
Content-Type: application/json
```

**Request Payload:**

```json
{
  "action": "cancel",    // Use "cancel" for soft cancel, "delete" for hard delete
  "reason": "Caller requested cancellation"  // Optional cancellation reason
}
```

**Actions:**
- `"cancel"` - Soft cancel (recommended for VAPI cancellations - keeps record)
- `"delete"` - Hard delete (removes appointment completely)

**Response:**

```json
{
  "success": true
}
```

### Get Patient

```
GET /patients/getPatient/{patientId}
```

### Get Appointment

```
GET /appointments/getAppointment?id={appointmentId}
```

**Response:**

```json
{
  "appointment": {
    "id": "351855",
    "status": "not arrived",
    "startAtLocal": "2026-01-28 15:15:00",
    "endAtLocal": "2026-01-28 15:30:00",
    "notes": "",
    "deleted": false,
    "block": false,
    "bookedBy": "Tina Bath",
    "createdAt": "2026-01-25 15:22:41",
    "patient": {
      "id": 50081,
      "name": "Brownie",
      "breed": { "id": 3592, "name": "Golden Doodle" },
      "species": { "id": 27, "name": "Dog" },
      "gender": { "id": 2, "name": "Male" },
      "client": {
        "id": 20691,
        "firstName": "Taylor",
        "lastName": "Allen",
        "email": "taylorallen0913@gmail.com",
        "homePhone": "9258958479"
      }
    },
    "appointmentType": {
      "id": 1008,
      "name": "Groomer",
      "duration": 1,
      "color": "#dacccc"
    },
    "appointmentRoom": {
      "id": 8,
      "name": "ROOM 3",
      "position": 3
    },
    "provider": {
      "id": 1000,
      "name": "DR.G.BATH"
    },
    "cancelledReason": null
  }
}
```

### Get Client Summary

```
GET /clients/getSummary?patientId={patientId}&clientId={clientId}
```

### Get Genders (Lookup Data)

```
GET /genders/getGenders
```

### Get Appointment View (Lookup Data)

```
GET /appointments/getAppointmentView
```

**Response:**

```json
{
  "slotInterval": 15,
  "businessHours": [
    {
      "daysOfWeek": [0, 1, 2, 3, 4, 5, 6],
      "startTime": "08:00",
      "endTime": "19:00"
    }
  ],
  "appointmentTypes": [
    { "id": 1, "name": "Default", "duration": 1, "color": "#CCFFFF" },
    { "id": 1001, "name": "Exam", "duration": 1, "color": "#d0ffac" },
    { "id": 1003, "name": "Vaccines", "duration": 1, "color": "#b193d5" },
    { "id": 1004, "name": "Surgery", "duration": 1, "color": "#788bd1" },
    { "id": 1005, "name": "Follow-up", "duration": 1, "color": "#f8d7d7" },
    { "id": 1007, "name": "Sick", "duration": 1, "color": "#ffff99" },
    { "id": 1008, "name": "Groomer", "duration": 1, "color": "#dacccc" }
  ],
  "appointmentRooms": [
    { "id": 7, "name": "ROOM 1", "position": 1 },
    { "id": 6, "name": "ROOM 2", "position": 2 },
    { "id": 8, "name": "ROOM 3", "position": 3 },
    { "id": 11, "name": "DR. NIMIR BATH", "position": 4 },
    { "id": 10, "name": "DR.G.BATH", "position": 5 },
    { "id": 12, "name": "DR.GURWINDER SANDHU", "position": 6 }
  ],
  "providers": [
    { "id": 2, "name": "Tina Bath", "provider": true },
    { "id": 1000, "name": "DR.G.BATH", "provider": true },
    { "id": 1002, "name": "DR. NIMIR BATH", "provider": true },
    { "id": 1008, "name": "DR.GURWINDER SANDHU", "provider": true }
  ],
  "deputyEnabled": false
}
```

Returns appointment types, rooms, providers, and other configuration data needed to create appointments.

## Key Differences from Original Implementation

| Aspect           | Original Guess              | Actual Endpoint                                  |
| ---------------- | --------------------------- | ------------------------------------------------ |
| Patient Search   | `GET /patients/search`      | `GET /search/patients`                           |
| Create Appt      | `POST /appointments` (JSON) | `POST /appointments/create` (multipart/form-data)|
| Cancel/Delete    | `DELETE /appointments/{id}` | `POST /appointments/delete/{id}` with action     |
| Response Format  | Simple objects              | Nested with `success` field                      |
| Species/Breed    | Simple IDs                  | Full nested objects required                     |

## Implementation Details

### Architecture

The implementation follows the existing IDEXX integration patterns:

1. **BrowserService**: Manages Playwright browser instances
2. **IdexxAuthClient**: Handles authentication and session management
3. **IdexxAppointmentManagementClient**: New client for appointment operations
4. **IdexxProvider**: Main provider interface with appointment methods

### Key Classes

#### IdexxAppointmentManagementClient

Located: `libs/integrations/idexx/src/provider/appointment-management-client.ts`

**Methods:**

- `searchPatient(params: SearchPatientParams): Promise<PatientSearchResult>`
- `createAppointment(input: CreateAppointmentInput): Promise<AppointmentOperationResult>`
- `createAppointmentWithNewClient(input: CreateAppointmentInput): Promise<AppointmentOperationResult>`

**Private Methods:**

- `createClient()`: Create new client in IDEXX
- `createPatient()`: Create new patient under client
- `buildAppointmentPayload()`: Transform input to IDEXX multipart/form-data format
- `parsePatientSearchResponse()`: Handle nested response format

### Integration with VAPI

Location: `libs/integrations/vapi/src/processors/appointments/book-appointment.ts`

**Flow for IDEXX Clinics:**

1. Check if `clinic.pims_type === "idexx"`
2. Initialize IDEXX provider with credentials
3. Authenticate with IDEXX Neo
4. Search for existing patient (if not new client)
5. Create appointment via API
6. Store booking details in `inbound_vapi_calls` table
7. Clean up browser resources
8. Fallback to `schedule_slots` on error

### Credentials Management

**Current Approach:** Environment variables

```env
IDEXX_USERNAME=your_username
IDEXX_PASSWORD=your_password
IDEXX_COMPANY_ID=your_company_id
```

**TODO:** Store credentials per-clinic in database

```sql
-- Future enhancement: Add to clinics table
ALTER TABLE clinics ADD COLUMN idexx_credentials JSONB;
```

## Lookup Data Requirements

To create appointments, you need to fetch lookup data first:

### Species/Breed Lookup

Species and breeds must be passed as full nested objects. Fetch available options from:
- Species data included in patient search results
- Breed data included in patient search results

### Gender Lookup

```
GET /genders/getGenders
```

Returns all available gender options with their IDs and properties.

### Appointment Types, Rooms, Providers

```
GET /appointments/getAppointmentView
```

Returns:
- `slotInterval` - Time slot interval in minutes (e.g., 15)
- `businessHours` - Operating hours with days of week
- `appointmentTypes` - Available appointment types with IDs, names, colors
- `appointmentRooms` - Available rooms/columns with IDs and positions
- `providers` - Available providers/veterinarians with IDs

**Field Mapping for Appointment Creation:**

| getAppointmentView Field | Create Appointment Field |
| ------------------------ | ------------------------ |
| `appointmentTypes[].id`  | `type_id`                |
| `appointmentRooms[].id`  | `room`                   |
| `providers[].id`         | `user_id`                |

## Testing Procedures

### Manual API Discovery (Complete)

Discovery was performed on January 25, 2026 by:

1. Opening IDEXX Neo in browser with Network tab
2. Performing actions and capturing requests:
   - Searched for patient → `/search/patients`
   - Created new client → `/clients/create`
   - Created new patient → `/patients/create`
   - Created appointment → `/appointments/create`
   - Opened appointment form → `/appointments/getAppointmentView` (types, rooms, providers)
   - Retrieved appointment → `/appointments/getAppointment?id={id}`
   - Cancelled appointment → `/appointments/delete/{id}` with `{"action": "cancel", "reason": "..."}`

### Automated Testing

**Test Script:** `scripts/test-idexx-appointment-create.mjs`

**Usage:**

```bash
# Set environment variables
export IDEXX_USERNAME="your_username"
export IDEXX_PASSWORD="your_password"
export IDEXX_COMPANY_ID="your_company_id"

# Run test
pnpm tsx scripts/test-idexx-appointment-create.mjs
```

## Error Handling

### Graceful Degradation

If IDEXX API fails, the system falls back to `schedule_slots`:

```typescript
try {
  // Try IDEXX API
  const result = await provider.createAppointment(...);
  if (!result.success) {
    // Fall back to schedule_slots
  }
} catch (error) {
  logger.error("IDEXX error, falling back");
  // Continue to schedule_slots
}
```

### Common Errors

| Error                       | Cause                              | Resolution                        |
| --------------------------- | ---------------------------------- | --------------------------------- |
| Authentication failed       | Invalid credentials                | Verify IDEXX credentials          |
| Patient not found           | Search query doesn't match         | Use new client workflow           |
| Appointment creation failed | Invalid payload or missing fields  | Check multipart/form-data format  |
| Network error               | Browser/network issues             | Check browser service status      |
| Missing credentials         | Credentials not configured         | Set environment variables/DB      |

## Next Steps

### Immediate

1. ✅ Complete API discovery (done - January 25, 2026)
2. ✅ Create test script (done)
3. ✅ Confirm cancel action format (done - uses `{"action": "cancel", "reason": "..."}`)
4. ✅ Document getAppointmentView response (done - types, rooms, providers)
5. ⏳ Update `appointment-management-client.ts` with correct endpoints
6. ⏳ Change appointment creation to use multipart/form-data
7. ⏳ Update patient search to use `/search/patients`
8. ⏳ Add cancel appointment method
9. ⏳ Run automated tests
10. ⏳ Validate with real IDEXX clinic

### Future Enhancements

1. **Credential Storage**: Move from environment variables to database
2. **Provider/Room Selection**: Use `getAppointmentView` to fetch available options
3. **Appointment Types**: Map VAPI appointment reasons to IDEXX type IDs
4. **Reschedule**: Investigate update endpoint (may be delete + recreate)
5. **Batch Operations**: Support scheduling multiple appointments
6. **Conflict Detection**: Check for scheduling conflicts before creation

## Related Documentation

- [IDEXX Integration README](../README.md)
- [IDEXX Provider Implementation](../src/provider/idexx-provider.ts)
- [VAPI Book Appointment Processor](../../../../integrations/vapi/src/processors/appointments/book-appointment.ts)
- [Testing Guide](../../../../testing/TESTING_STRATEGY.md)

## Contact

For questions or issues with IDEXX appointment integration, see:

- Implementation: `libs/integrations/idexx/src/provider/appointment-management-client.ts`
- Tests: `scripts/test-idexx-appointment-create.mjs`
- VAPI Integration: `libs/integrations/vapi/src/processors/appointments/book-appointment.ts`

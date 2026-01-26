# Postman Setup Guide for PIMS Sync API

This guide will help you import and configure the PIMS Sync API collection in Postman.

## Quick Start

### 1. Import the Collection

1. Open Postman
2. Click **Import** button (top left)
3. Drag and drop `PIMS-Sync.postman_collection.json` or click "Upload Files"
4. Click **Import**

### 2. Configure Environment Variables

The collection uses two variables that need to be configured:

#### Collection Variables (Recommended for single environment)

1. Click on the **PIMS Sync API** collection
2. Go to the **Variables** tab
3. Update the values:
   - `base_url`: Your API base URL
     - Local development: `http://localhost:3030`
     - Railway production: Your Railway deployment URL
   - `api_key`: Your API authentication key

#### Environment Variables (Recommended for multiple environments)

Alternatively, create separate environments for development, staging, and production:

1. Click **Environments** (left sidebar)
2. Click **+** to create a new environment
3. Name it (e.g., "PIMS Sync - Local")
4. Add variables:
   - `base_url`: `http://localhost:3030`
   - `api_key`: Your development API key
5. Repeat for other environments (staging, production)

### 3. Test the Connection

1. Select your environment (if using environments)
2. Open **Service Info** → **Health Check** request
3. Click **Send**
4. You should receive a `200 OK` response with health status

## Collection Structure

### 📁 Service Info
- **Get Service Info**: View all available endpoints and their documentation
- **Health Check**: Monitor service health (memory, environment, scheduler)
- **Readiness Probe**: Check if service is ready to accept traffic
- **Metrics**: Prometheus-compatible metrics

### 📁 Sync Operations
- **Inbound Sync**: Sync appointments from PIMS to database
  - Default (7 days ahead)
  - Custom date range (flat format)
  - Nested date range format
- **Case Sync (Enrich)**: Enrich cases with consultation data
- **Reconcile Cases**: Clean up orphaned cases
- **Full Sync (Bidirectional)**: Complete sync pipeline (past + future)
- **Full Sync (Legacy Forward-Only)**: Forward-only sync mode

### 📁 Appointments
- **Search Patient**: Find existing patients by name/phone
- **Create Appointment (Existing Patient)**: Book appointment for existing patient
- **Create Appointment (New Client)**: Book appointment with new client/patient
- **Cancel Appointment**: Cancel an appointment
- **Reschedule Appointment**: Atomic cancel + create operation

## Common Workflows

### Workflow 1: Daily Sync (Typical)

```
1. Full Sync (Bidirectional)
   - Syncs past cases (14 days back)
   - Syncs future appointments (14 days forward)
   - Enriches with SOAP notes
   - Reconciles data integrity
```

### Workflow 2: Book New Appointment

```
1. Search Patient
   - Find patient by name/phone
   - Get patientId and clientId

2. Create Appointment (Existing Patient)
   - Use patientId from search
   - Specify date, time, reason
```

### Workflow 3: Reschedule Appointment

```
1. Reschedule Appointment
   - Provide cancelAppointmentId (old appointment)
   - Provide patientId
   - Specify new date/time
   - Atomic operation (rollback on failure)
```

### Workflow 4: New Client Walk-in

```
1. Create Appointment (New Client)
   - Set isNewClient: true
   - Provide client details (name, phone, email)
   - Provide patient details (name, species, breed)
   - Specify appointment details
```

## Authentication

All API endpoints (except health/metrics) require authentication via API key:

```
Header: X-API-Key
Value: your-api-key-here
```

The collection is pre-configured to automatically add this header using the `{{api_key}}` variable.

## Request Examples

### Inbound Sync (7 days ahead)

```json
POST /api/sync/inbound
{
  "daysAhead": 7
}
```

### Inbound Sync (Custom date range)

```json
POST /api/sync/inbound
{
  "startDate": "2026-01-26",
  "endDate": "2026-02-02"
}
```

### Case Enrichment (Today only)

```json
POST /api/sync/cases
{
  "startDate": "2026-01-26",
  "endDate": "2026-01-26",
  "parallelBatchSize": 5
}
```

### Full Bidirectional Sync

```json
POST /api/sync/full
{
  "bidirectional": true,
  "backwardDays": 14,
  "forwardDays": 14
}
```

### Search Patient

```json
POST /api/appointments/search-patient
{
  "query": "Smith",
  "limit": 10
}
```

### Create Appointment (Existing)

```json
POST /api/appointments/create
{
  "patientId": "patient-123",
  "clientId": "client-456",
  "date": "2026-01-28",
  "startTime": "14:00",
  "reason": "Follow-up checkup",
  "note": "Patient doing well"
}
```

### Create Appointment (New Client)

```json
POST /api/appointments/create
{
  "isNewClient": true,
  "newClient": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "555-123-4567",
    "email": "john.doe@example.com"
  },
  "newPatient": {
    "name": "Buddy",
    "species": "Dog",
    "breed": "Golden Retriever"
  },
  "date": "2026-01-28",
  "startTime": "10:00",
  "reason": "New patient wellness exam"
}
```

### Cancel Appointment

```json
POST /api/appointments/cancel
{
  "appointmentId": "appt-789",
  "reason": "Client requested cancellation"
}
```

### Reschedule Appointment

```json
POST /api/appointments/reschedule
{
  "cancelAppointmentId": "appt-old-123",
  "patientId": "patient-123",
  "date": "2026-01-30",
  "startTime": "15:30",
  "reason": "Follow-up checkup"
}
```

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "syncId": "sync-123",
  "stats": {
    "created": 10,
    "updated": 5,
    "failed": 0
  },
  "durationMs": 1234,
  "timestamp": "2026-01-26T12:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message here",
  "durationMs": 567,
  "timestamp": "2026-01-26T12:00:00.000Z"
}
```

## Troubleshooting

### 401 Unauthorized

- Check that `X-API-Key` header is being sent
- Verify your API key is correct in collection/environment variables

### 503 Service Unavailable

- Service may not be ready
- Check `/ready` endpoint
- Verify required environment variables are set on server

### Authentication Failed

- PIMS credentials may be invalid or expired
- Check clinic credentials in database
- Verify IDEXX Neo access

### Timeout Errors

- Sync operations can take several minutes
- Check service logs for progress
- Consider using smaller date ranges

## Tips

1. **Use Environments**: Create separate environments for dev/staging/prod
2. **Save Examples**: Save successful responses as examples for reference
3. **Use Variables**: Leverage Postman variables for dynamic values
4. **Test Scripts**: Add tests to validate responses automatically
5. **Monitor Health**: Run `/health` endpoint before starting sync operations
6. **Check Metrics**: Use `/metrics` to monitor service performance

## Support

For issues or questions:
- Check service logs in Railway
- Review PIMS Sync README: `apps/pims-sync/README.md`
- Contact the development team

# Chrome Extension Integration: Case Ingest API

This document describes how to modify your IDEXX Chrome extension to use the new `/api/cases/ingest` endpoint, which handles sync + generation in a single call.

## Overview

### Old Flow (using `/api/schedule/sync`)
```
Extension → /api/schedule/sync → appointments table
                                       ↓
                              (No generation)
                                       ↓
Dashboard "Generate & Send" → Generates entities, summary, call intelligence (10-25s wait)
```

### New Flow (using `/api/cases/ingest`)
```
Extension → /api/cases/ingest → cases table + ALL generation happens immediately
                                       ↓
                              ✓ Entity extraction
                              ✓ Discharge summary
                              ✓ Call intelligence
                                       ↓
Dashboard "Generate & Send" → Just schedule! (<1s)
```

## API Endpoint

**URL:** `POST /api/cases/ingest`

**Authentication:** Bearer token (same as current sync endpoint)
```
Authorization: Bearer <supabase_access_token>
```

## Request Format

### New IDEXX Format (Recommended)

```typescript
interface IdexxIngestRequest {
  appointment: {
    // Required
    pet_name: string;

    // Patient info (optional but improves generation quality)
    species?: string;           // "dog", "cat", "bird", etc.
    breed?: string;
    age?: string;               // "3 years", "6 months"
    sex?: string;               // "male", "female", "neutered male", etc.
    weight?: string;            // "25 lbs", "10 kg"

    // Owner info
    owner_name?: string;
    client_first_name?: string;
    client_last_name?: string;
    phone_number?: string;
    mobile_number?: string;
    email?: string;

    // CRITICAL: Clinical data for generation
    consultation_notes?: string;           // Full consultation notes (HTML OK)
    products_services?: string;            // Accepted products/services
    declined_products_services?: string;   // Declined products/services

    // Appointment details
    appointmentId?: string;      // IDEXX appointment ID (for deduplication)
    consultationId?: string;
    appointment_type?: string;
    appointment_date?: string;
    appointment_time?: string;
    provider_name?: string;
    provider_id?: string;
  };

  // Optional settings
  options?: {
    autoSchedule?: boolean;      // Auto-schedule call after ingest (default: false)
    skipGeneration?: boolean;    // Skip AI generation (default: false)
    forceRegenerate?: boolean;   // Force regenerate even if data exists (default: false)
  };

  syncDate?: string;  // ISO date for tracking (e.g., "2024-01-15")
}
```

### Example Request

```javascript
const response = await fetch('https://your-app.com/api/cases/ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    appointment: {
      // From IDEXX Neo appointment
      appointmentId: '12345',
      pet_name: 'Max',
      species: 'dog',
      breed: 'Golden Retriever',
      age: '5 years',
      weight: '65 lbs',

      // Owner
      client_first_name: 'John',
      client_last_name: 'Smith',
      phone_number: '+1-555-123-4567',
      email: 'john.smith@example.com',

      // Critical: consultation notes for AI generation
      consultation_notes: `
        <p>Patient presented for annual wellness exam.</p>
        <p>SOAP: S: Owner reports patient is eating well, no concerns.</p>
        <p>O: T: 101.2F, HR: 90, RR: 20. BCS 5/9.</p>
        <p>A: Healthy adult dog, due for vaccines.</p>
        <p>P: Administered DHPP and Rabies. Recommend heartworm prevention.</p>
      `,
      products_services: 'DHPP Vaccine, Rabies Vaccine, Heartworm Test',
      declined_products_services: 'Dental Cleaning',

      // Appointment metadata
      appointment_type: 'Wellness Exam',
      appointment_date: '2024-01-15',
      provider_name: 'Dr. Wilson',
    },
    options: {
      autoSchedule: false,  // Don't auto-schedule call, let user review first
    },
  }),
});

const result = await response.json();
```

## Response Format

### Success Response

```typescript
interface IdexxIngestResponse {
  success: true;
  data: {
    caseId: string;              // UUID of created/updated case
    patientName: string;
    ownerName?: string;
    ownerPhone?: string;
    ownerEmail?: string;

    generation: {
      entityExtraction: 'completed' | 'skipped' | 'failed';
      dischargeSummary: 'completed' | 'skipped' | 'failed';
      callIntelligence: 'completed' | 'skipped' | 'failed';
    };

    scheduledCall?: {
      id: string;
      scheduledFor: string;      // ISO timestamp
    } | null;

    timing: {
      totalMs: number;
      entityExtractionMs?: number;
      dischargeSummaryMs?: number;
      callIntelligenceMs?: number;
    };
  };
}
```

### Example Success Response

```json
{
  "success": true,
  "data": {
    "caseId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "patientName": "Max",
    "ownerName": "John Smith",
    "ownerPhone": "+15551234567",
    "ownerEmail": "john.smith@example.com",
    "generation": {
      "entityExtraction": "completed",
      "dischargeSummary": "completed",
      "callIntelligence": "completed"
    },
    "scheduledCall": null,
    "timing": {
      "totalMs": 12500,
      "entityExtractionMs": 12500
    }
  }
}
```

### Error Responses

**422 - Euthanasia Case Detected:**
```json
{
  "success": false,
  "error": "Euthanasia cases are not eligible for discharge workflow"
}
```

**400 - Validation Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": { ... }
}
```

**401 - Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

## Migration Steps for Chrome Extension

### 1. Update the Sync Function

**Before (schedule sync):**
```javascript
async function syncAppointments(appointments) {
  const response = await fetch('/api/schedule/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      syncDate: new Date().toISOString().split('T')[0],
      appointments: appointments,
    }),
  });
  return response.json();
}
```

**After (case ingest):**
```javascript
async function ingestAppointment(appointment) {
  const response = await fetch('/api/cases/ingest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      appointment: appointment,
      options: {
        autoSchedule: false,
      },
    }),
  });
  return response.json();
}

// Process appointments one at a time or in batches
async function syncAppointments(appointments) {
  const results = [];
  for (const appointment of appointments) {
    try {
      const result = await ingestAppointment(appointment);
      results.push({
        appointmentId: appointment.appointmentId,
        ...result
      });
    } catch (error) {
      results.push({
        appointmentId: appointment.appointmentId,
        success: false,
        error: error.message,
      });
    }
  }
  return results;
}
```

### 2. Add Consultation Notes Fetching

The key improvement is including `consultation_notes` in the payload. If you're not already fetching these:

```javascript
async function getConsultationNotes(consultationId) {
  // Fetch from IDEXX API
  const response = await fetch(
    `https://idexx-neo.com/api/consultations/${consultationId}/page-data`,
    { headers: { Authorization: `Bearer ${idexxToken}` } }
  );
  const data = await response.json();
  return data.clinicalNotes || data.notes || '';
}

// Include in your appointment data
const appointmentWithNotes = {
  ...appointment,
  consultation_notes: await getConsultationNotes(appointment.consultationId),
};
```

### 3. Handle Generation Status

Show users what was generated:

```javascript
const result = await ingestAppointment(appointment);

if (result.success) {
  const gen = result.data.generation;

  console.log(`Case created: ${result.data.caseId}`);
  console.log(`Entity extraction: ${gen.entityExtraction}`);
  console.log(`Discharge summary: ${gen.dischargeSummary}`);
  console.log(`Call intelligence: ${gen.callIntelligence}`);
  console.log(`Total time: ${result.data.timing.totalMs}ms`);

  // Show success notification
  showNotification({
    title: 'Case Ready',
    message: `${result.data.patientName} is ready for scheduling`,
    type: 'success',
  });
}
```

## Performance Comparison

| Metric | Old Flow | New Flow |
|--------|----------|----------|
| Sync time | ~1s | ~10-15s (includes generation) |
| Dashboard scheduling | 10-25s | <1s |
| **Total time to schedule** | **11-26s** | **10-15s** |

The total time is similar, but the user experience is much better:
- No waiting on the dashboard
- Cases are "ready to schedule" immediately
- Background processing during sync

## Batch Processing (Optional)

For syncing multiple appointments efficiently:

```javascript
// Process in parallel with concurrency limit
async function syncAppointmentsBatch(appointments, concurrency = 3) {
  const results = [];

  for (let i = 0; i < appointments.length; i += concurrency) {
    const batch = appointments.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(apt => ingestAppointment(apt))
    );
    results.push(...batchResults);
  }

  return results;
}
```

## Troubleshooting

### "Euthanasia cases are not eligible"
Expected behavior - these cases are automatically filtered out.

### Generation status shows "failed"
Check the `consultation_notes` field - AI generation requires clinical notes.

### Slow response times
Normal for first ingest (~10-15s). Subsequent updates to the same case are faster.

### 401 Unauthorized
Token may have expired. Refresh the Supabase access token.

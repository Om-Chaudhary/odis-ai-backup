# V2 API Migration Guide

This guide documents the changes introduced in the V2 API Refactor (Unified Case-Centric Architecture) and how to migrate your clients (Extension, Mobile App).

## Overview

The new architecture centers around the **Case** as the primary entity. All data ingestion (Mobile Dictation, Extension JSON) now flows through a unified ingestion service that ensures:
1.  **Smart Merging**: Updates existing cases instead of creating duplicates.
2.  **Centralized Normalization**: Entity extraction happens in one place.
3.  **Unified Scheduling**: Call scheduling is linked to the Case.

## New Endpoint: `POST /api/cases/ingest`

This is the **only** endpoint you should use for creating/updating cases and scheduling calls.

### Authentication
- **Headers**: `Authorization: Bearer <TOKEN>` (Extension) OR Cookies (Web/Mobile)

### Payload Structure (Discriminated Union)

#### 1. Mode: Text (Mobile App / Dictation)
Use this when you have raw text (transcript, notes) that needs AI normalization.

```json
{
  "mode": "text",
  "source": "mobile_app",
  "text": "Fluffy is a 5yo Golden Retriever...",
  "options": {
    "inputType": "soap_note" // optional hint
  }
}
```

#### 2. Mode: Structured (Chrome Extension / IDEXX)
Use this when you have structured JSON data.

```json
{
  "mode": "structured",
  "source": "idexx_extension",
  "data": {
    "pet_name": "Fluffy",
    "client_first_name": "John",
    "client_last_name": "Doe",
    "phone_number": "555-123-4567",
    "species": "Canine",
    "email": "john@example.com"
    // ... other fields
  },
  "options": {
    "autoSchedule": true // Set to true to immediately schedule a discharge call
  }
}
```

### Response

```json
{
  "success": true,
  "data": {
    "caseId": "uuid...",
    "entities": { ...normalized entities... },
    "scheduledCall": { ... } // if autoSchedule was true
  }
}
```

---

## Migration Steps

### 1. Chrome Extension (Immediate Action Required)
The endpoint `/api/vapi/schedule` has been **REMOVED**.

**Old Request:**
```javascript
POST /api/vapi/schedule
{
  "phoneNumber": "...",
  "petName": "...",
  // ... flat fields
}
```

**New Request:**
```javascript
POST /api/cases/ingest
{
  "mode": "structured",
  "source": "idexx_extension",
  "data": {
    "phone_number": "...", // key names can match IDEXX raw names or your flat fields
    "pet_name": "...",
    // ... pass the full object you scraped
  },
  "options": {
    "autoSchedule": true
  }
}
```

### 2. Mobile App (Future)
The endpoint `/api/normalize` is currently **maintained as a compatibility wrapper**, so no immediate changes are required.

However, for future updates, switch to `/api/cases/ingest` with `mode: "text"`.

---

## Key Benefits
- **No Duplicates**: If you send data for "Fluffy" twice on the same day, it updates the same Case record.
- **Fresh Context**: Calls are executed using the *latest* data on the case (fetched at call time), so if you add notes after scheduling, the AI agent knows about them.
- **Traceability**: All inputs are tracked by `source`.


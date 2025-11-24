# `/api/normalize` - Entity Extraction API

## Overview

The normalization endpoint extracts structured clinical entities from ANY veterinary clinical text using AI. This is the first step in a two-step process:

1. **Normalize** (this endpoint) - Extract entities from clinical text
2. **Generate** (future endpoints) - Generate SOAP notes, discharge summaries, etc. from extracted entities

## Why This Architecture?

- **Single source of truth**: Extract entities once, generate many document types
- **Better quality**: AI focuses on extraction vs. generation separately
- **Cost effective**: Don't re-extract entities for each document type
- **Flexible**: Generate any document format from the same normalized data

## Authentication

**Required**: Yes (automatic detection)

Supports two authentication methods:

- **Cookie-based** (web app): Standard session cookies
- **Bearer token** (browser extension): `Authorization: Bearer <token>`

## Endpoints

### `POST /api/normalize`

Extract structured clinical entities from veterinary text.

#### Request Body

```typescript
{
  // REQUIRED: Clinical text to extract entities from
  "input": string,  // min 50 characters

  // OPTIONAL: Link to existing case (will update case.metadata)
  "caseId": string,  // UUID format

  // OPTIONAL: Hint about input type (helps AI extraction)
  "inputType": "transcript" | "soap_note" | "visit_notes" | "discharge_summary" | "other",

  // OPTIONAL: Additional metadata to store with case
  "metadata": {
    [key: string]: any
  }
}
```

#### Response (Success)

**Status**: `201 Created` (new case) or `200 OK` (updated case)

```typescript
{
  "success": true,
  "data": {
    "case": {
      "id": string,           // Case UUID
      "type": string,         // e.g., "checkup", "emergency", "surgery"
      "status": string,       // e.g., "draft"
      "metadata": object,     // Contains extracted entities
      "created_at": string    // ISO 8601 datetime
    },
    "patient": {
      "id": string,           // Patient UUID
      "name": string,         // Patient name
      "species": string,      // "dog", "cat", "bird", etc.
      "owner_name": string    // Owner name
    },
    "entities": {
      "patient": {
        "name": string,
        "species": "dog" | "cat" | "bird" | "rabbit" | "other",
        "breed": string?,
        "age": string?,       // e.g., "5 years"
        "sex": "male" | "female" | "unknown"?,
        "weight": string?,    // e.g., "30 kg"
        "owner": {
          "name": string,
          "phone": string?,
          "email": string?
        }
      },
      "clinical": {
        "chiefComplaint": string?,
        "visitReason": string?,
        "presentingSymptoms": string[]?,
        "vitalSigns": {
          "temperature": string?,
          "heartRate": string?,
          "respiratoryRate": string?,
          "weight": string?
        }?,
        "physicalExamFindings": string[]?,
        "diagnoses": string[]?,
        "differentialDiagnoses": string[]?,
        "medications": Array<{
          "name": string,
          "dosage": string?,
          "frequency": string?,
          "duration": string?,
          "route": string?
        }>?,
        "treatments": string[]?,
        "procedures": string[]?,
        "followUpInstructions": string?,
        "followUpDate": string?,
        "recheckRequired": boolean?,
        "labResults": string[]?,
        "imagingResults": string[]?,
        "clinicalNotes": string?,
        "prognosis": string?
      },
      "caseType": "checkup" | "emergency" | "surgery" | "follow_up" | "dental" | "vaccination" | "diagnostic" | "consultation" | "other",
      "confidence": {
        "overall": number,    // 0-1
        "patient": number,    // 0-1
        "clinical": number    // 0-1
      },
      "warnings": string[]?,
      "extractedAt": string?,  // ISO 8601 datetime
      "originalInput": string?,
      "inputType": string?
    }
  },
  "metadata": {
    "confidence": number,      // Overall confidence 0-1
    "warnings": string[],      // Any warnings about data quality
    "processingTime": number   // Milliseconds
  }
}
```

#### Response (Error)

**Status**: `400` / `404` / `500`

```typescript
{
  "success": false,
  "error": string,
  "details": object?
}
```

#### Error Codes

- `400 Bad Request`: Invalid input (too short, invalid format)
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Case ID not found or access denied
- `500 Internal Server Error`: AI extraction failed or database error

---

### `GET /api/normalize?caseId={uuid}`

Check if a case has extracted entities.

#### Query Parameters

- `caseId` (required): UUID of the case to check

#### Response (Success)

**Status**: `200 OK`

```typescript
{
  "caseId": string,
  "hasEntities": boolean,
  "entities": {
    "patientName": string,
    "caseType": string,
    "confidence": number,
    "extractedAt": string
  } | null
}
```

---

### `OPTIONS /api/normalize`

Health check / CORS preflight.

#### Response

**Status**: `200 OK`

```typescript
{
  "status": "ok",
  "endpoint": "/api/normalize",
  "methods": ["POST", "GET"],
  "authentication": "required (cookie or Bearer token)",
  "description": "Entity extraction endpoint - extracts clinical entities from veterinary text"
}
```

---

## Example Requests

### Example 1: Extract Entities from Transcript (Create New Case)

**Request:**

```bash
curl -X POST https://your-domain.com/api/normalize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token-here" \
  -d '{
    "input": "Dr. Smith examined Max, a 5-year-old golden retriever owned by John Smith. Max presented with limping on his right front leg for the past 3 days. Physical exam revealed mild swelling around the right carpus. Vitals: Temp 101.5F, HR 90 bpm. Diagnosed with soft tissue injury. Prescribed Carprofen 75mg BID for 7 days. Owner advised to restrict activity and recheck in 10 days.",
    "inputType": "transcript"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "case": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "checkup",
      "status": "draft",
      "created_at": "2025-01-14T10:30:00Z"
    },
    "patient": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Max",
      "species": "dog",
      "owner_name": "John Smith"
    },
    "entities": {
      "patient": {
        "name": "Max",
        "species": "dog",
        "breed": "Golden Retriever",
        "age": "5 years",
        "sex": "male",
        "owner": {
          "name": "John Smith"
        }
      },
      "clinical": {
        "chiefComplaint": "Limping on right front leg",
        "vitalSigns": {
          "temperature": "101.5°F",
          "heartRate": "90 bpm"
        },
        "physicalExamFindings": ["Mild swelling around right carpus"],
        "diagnoses": ["Soft tissue injury - right carpus"],
        "medications": [
          {
            "name": "Carprofen",
            "dosage": "75mg",
            "frequency": "BID",
            "duration": "7 days"
          }
        ],
        "followUpInstructions": "Restrict activity, recheck in 10 days",
        "recheckRequired": true
      },
      "caseType": "checkup",
      "confidence": {
        "overall": 0.92,
        "patient": 0.95,
        "clinical": 0.89
      },
      "warnings": []
    }
  },
  "metadata": {
    "confidence": 0.92,
    "warnings": [],
    "processingTime": 2340
  }
}
```

---

### Example 2: Extract Entities from Existing SOAP Note

**Request:**

```bash
curl -X POST https://your-domain.com/api/normalize \
  -H "Content-Type: application/json" \
  -H "Cookie: session=your-session-cookie" \
  -d '{
    "input": "S: Owner reports Bella has been vomiting for 3 days, decreased appetite, lethargic.\n\nO: Patient alert but quiet. Temp 102.8F. Dehydrated (skin tent 3 sec). Abdomen soft, no pain on palpation. BW 8.2 kg (down from 8.9 kg last visit).\n\nA: Acute gastroenteritis, moderate dehydration.\n\nP: Started IV fluids (LRS). Prescribed Metoclopramide 0.5mg/kg PO BID x5 days, bland diet. Recheck in 2 days or sooner if worsening.",
    "inputType": "soap_note"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "case": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "type": "emergency",
      "status": "draft",
      "created_at": "2025-01-14T11:15:00Z"
    },
    "patient": {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "name": "Bella",
      "species": "cat",
      "owner_name": "Unknown"
    },
    "entities": {
      "patient": {
        "name": "Bella",
        "species": "cat",
        "weight": "8.2 kg",
        "owner": {
          "name": "Unknown"
        }
      },
      "clinical": {
        "chiefComplaint": "Vomiting for 3 days",
        "presentingSymptoms": [
          "Vomiting x3 days",
          "Decreased appetite",
          "Lethargic"
        ],
        "vitalSigns": {
          "temperature": "102.8°F",
          "weight": "8.2 kg"
        },
        "physicalExamFindings": [
          "Alert but quiet",
          "Dehydrated (skin tent 3 seconds)",
          "Abdomen soft, no pain on palpation"
        ],
        "diagnoses": ["Acute gastroenteritis", "Moderate dehydration"],
        "medications": [
          {
            "name": "Metoclopramide",
            "dosage": "0.5mg/kg",
            "frequency": "BID",
            "duration": "5 days",
            "route": "PO"
          }
        ],
        "treatments": ["IV fluids (LRS)", "Bland diet"],
        "followUpInstructions": "Recheck in 2 days or sooner if worsening",
        "recheckRequired": true
      },
      "caseType": "emergency",
      "confidence": {
        "overall": 0.87,
        "patient": 0.75,
        "clinical": 0.93
      },
      "warnings": ["Owner information not found in text"]
    }
  },
  "metadata": {
    "confidence": 0.87,
    "warnings": ["Owner information not found in text"],
    "processingTime": 1890
  }
}
```

---

### Example 3: Update Existing Case with New Information

**Request:**

```bash
curl -X POST https://your-domain.com/api/normalize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token-here" \
  -d '{
    "input": "Follow-up visit for Max. Owner reports significant improvement. Right leg no longer limping. Continued on Carprofen for 3 more days. Will monitor at home.",
    "caseId": "550e8400-e29b-41d4-a716-446655440000",
    "inputType": "visit_notes"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "case": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "follow_up",
      "status": "draft",
      "created_at": "2025-01-14T10:30:00Z"
    },
    "patient": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Max",
      "species": "dog",
      "owner_name": "John Smith"
    },
    "entities": {
      "patient": {
        "name": "Max",
        "species": "dog",
        "owner": {
          "name": "Unknown"
        }
      },
      "clinical": {
        "chiefComplaint": "Follow-up visit",
        "physicalExamFindings": [
          "Right leg no longer limping",
          "Significant improvement noted"
        ],
        "medications": [
          {
            "name": "Carprofen",
            "duration": "3 more days"
          }
        ],
        "followUpInstructions": "Monitor at home"
      },
      "caseType": "follow_up",
      "confidence": {
        "overall": 0.81,
        "patient": 0.7,
        "clinical": 0.85
      },
      "warnings": ["Limited patient information in follow-up note"]
    }
  },
  "metadata": {
    "confidence": 0.81,
    "warnings": ["Limited patient information in follow-up note"],
    "processingTime": 1560
  }
}
```

---

### Example 4: Check Entity Extraction Status

**Request:**

```bash
curl -X GET "https://your-domain.com/api/normalize?caseId=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer your-token-here"
```

**Response:**

```json
{
  "caseId": "550e8400-e29b-41d4-a716-446655440000",
  "hasEntities": true,
  "entities": {
    "patientName": "Max",
    "caseType": "checkup",
    "confidence": 0.92,
    "extractedAt": "2025-01-14T10:30:15Z"
  }
}
```

---

## Database Storage

Extracted entities are stored in the `cases.metadata` JSONB field:

```sql
SELECT
  id,
  type,
  status,
  metadata->'entities' as extracted_entities,
  metadata->'confidence' as confidence,
  metadata->'warnings' as warnings
FROM cases
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

## Next Steps

After extracting entities, you can use them to:

1. **Generate SOAP notes**: `POST /api/generate/soap` (future)
2. **Generate discharge summaries**: `POST /api/generate/discharge-summary` (future)
3. **Generate client call summaries**: `POST /api/generate/call-summary` (future)

All generation endpoints will read entities from `case.metadata` and format them appropriately.

## Best Practices

1. **Input Quality**: Provide at least 50 characters of clinical text
2. **Input Type Hints**: Use `inputType` to help AI extraction accuracy
3. **Case Linking**: Use `caseId` when adding to existing cases
4. **Confidence Checking**: Always check `metadata.confidence` - values < 0.7 may need review
5. **Warning Handling**: Review `warnings` array for missing critical information
6. **Patient Deduplication**: The system automatically deduplicates patients by name/owner/species

## Troubleshooting

### "Input too short for entity extraction"

**Cause**: Input less than 50 characters
**Fix**: Provide more detailed clinical text

### "AI entity extraction failed"

**Cause**: Anthropic API error or quota exceeded
**Fix**: Check `ANTHROPIC_API_KEY` configuration, verify API quota

### "Failed to store extracted entities"

**Cause**: Database error
**Fix**: Check Supabase connection, verify `cases` table exists

### "Case not found or access denied"

**Cause**: Invalid case ID or user doesn't own the case
**Fix**: Verify case ID and user authentication

### Low confidence warnings

**Cause**: Ambiguous or incomplete clinical text
**Fix**: Provide more detailed information, use structured formats (SOAP)

## Rate Limits

- **Authentication**: Required for all requests
- **Anthropic API**: Subject to your Anthropic API tier limits
- **Recommended**: Max 10 requests/minute per user to avoid hitting API limits

## Security

- **Authentication**: All endpoints require valid user authentication
- **Authorization**: Users can only access their own cases
- **Data Privacy**: All data stored with Row Level Security (RLS) enabled
- **API Keys**: Never expose `ANTHROPIC_API_KEY` to client-side code

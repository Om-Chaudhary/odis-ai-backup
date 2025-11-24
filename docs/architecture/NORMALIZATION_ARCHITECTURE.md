# Normalization Architecture

## Overview

The veterinary scribe system uses a **two-step process** for document generation:

```
Step 1: NORMALIZE (Entity Extraction)
  Input (transcript/SOAP/notes) → Extract entities → Store normalized data

Step 2: GENERATE (Document Creation)
  Normalized data → Generate SOAP notes / discharge summaries / call summaries
```

## Why This Architecture?

**Benefits:**

- ✅ **Single source of truth** - Normalized entities are extracted once, used many times
- ✅ **Flexible generation** - Generate any document type from the same normalized data
- ✅ **Better quality** - AI focuses on extraction vs. generation separately
- ✅ **Cost effective** - Don't re-extract entities for each document type
- ✅ **Audit trail** - Track what was extracted vs. what was generated

## Step 1: Normalization (Entity Extraction)

### Input

Any clinical text:

- Raw transcripts (from voice recording)
- Existing SOAP notes
- Visit notes
- Discharge summaries
- Clinical narratives

### Process

AI extracts structured entities:

- **Patient info**: name, species, breed, age, weight, owner details
- **Clinical details**:
  - Visit: chief complaint, symptoms, vital signs
  - Findings: exam results, diagnoses, differentials
  - Treatment: medications, procedures, treatments
  - Follow-up: instructions, recheck dates

### Output (Stored in Database)

```json
{
  "case": { "id": "uuid", "type": "checkup" },
  "patient": { "id": "uuid", "name": "Max", "species": "dog" },
  "normalizedData": {
    "id": "uuid",
    "entities": {
      "patient": {...},
      "clinical": {...},
      "confidence": {...}
    }
  }
}
```

### Endpoint

```
POST /api/normalize
{
  "input": "transcript or clinical text...",
  "inputType": "transcript",  // optional hint
  "caseId": "uuid"            // optional, link to existing case
}
```

## Step 2: Generation (Document Creation)

### Input

- Case ID (to fetch normalized entities)
- Template ID (for discharge summaries)
- Generation type (SOAP, discharge, call summary)

### Process

AI uses normalized entities to generate documents:

- SOAP notes from clinical details
- Discharge summaries from medications + instructions
- Client call summaries from visit overview

### Output

Generated documents stored separately:

- `soap_notes` table
- `discharge_summaries` table
- `client_call_summaries` table (future)

### Endpoints (Future)

```
POST /api/generate/soap
{
  "caseId": "uuid"
}

POST /api/generate/discharge-summary
{
  "caseId": "uuid",
  "templateId": "uuid"
}

POST /api/generate/call-summary
{
  "caseId": "uuid"
}
```

## Database Schema

### New Table: `normalized_data`

```sql
CREATE TABLE normalized_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entities JSONB NOT NULL,           -- Extracted entities
  original_input TEXT NOT NULL,       -- Original input preserved
  input_type TEXT,                    -- Hint: transcript, soap_note, etc.
  confidence_score DECIMAL(3,2),      -- AI confidence 0-1
  metadata JSONB,                     -- Additional info
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_normalized_data_case_id ON normalized_data(case_id);
CREATE INDEX idx_normalized_data_user_id ON normalized_data(user_id);
```

## Data Flow Example

### Example 1: From Transcript

```
1. POST /api/normalize
   Input: "Dr. Smith examined Max, a 5-year-old golden retriever..."

2. AI extracts:
   - Patient: Max, dog, 5 years, owner: John Smith
   - Clinical: limping, soft tissue injury, prescribed carprofen

3. Stored in normalized_data:
   {
     "patient": {...},
     "clinical": {
       "chiefComplaint": "Limping on right front leg",
       "diagnoses": ["Soft tissue injury"],
       "medications": [{"name": "Carprofen", "dosage": "75mg", ...}]
     }
   }

4. Later: POST /api/generate/soap (uses normalized data)
   Output: Formatted SOAP note

5. Later: POST /api/generate/discharge-summary
   Output: Discharge instructions for owner
```

### Example 2: From Existing SOAP Note

```
1. POST /api/normalize
   Input: "S: Owner reports vomiting x3 days..."
   inputType: "soap_note"

2. AI extracts:
   - Patient: (from subjective section)
   - Clinical: vomiting, dehydration, prescribed metoclopramide

3. Stored in normalized_data

4. Later: POST /api/generate/discharge-summary
   Output: Client-friendly summary with home care instructions
```

## Migration Path

### Current State

We have: `/api/generate-soap` (proxies to Edge Function)

### New State

1. `/api/normalize` - Extract entities (implemented)
2. `/api/generate/soap` - Generate SOAP from entities (to implement)
3. `/api/generate/discharge-summary` - Generate discharge from entities (to implement)

### Benefits of Migration

- Existing SOAP generation can be enhanced with normalized data
- New document types can reuse normalized entities
- Better separation of concerns

## AI Prompts

### Normalization Prompt

```
Extract structured clinical entities from this veterinary visit text.
Focus on: patient info, clinical findings, diagnoses, treatments.
Do NOT generate new content - only extract what's present.
```

### Generation Prompt (SOAP)

```
Given these extracted clinical entities, generate a professional SOAP note.
Use proper veterinary medical terminology and format.
```

### Generation Prompt (Discharge)

```
Given these clinical entities, create client-friendly discharge instructions.
Focus on: home care, medication administration, warning signs.
```

## Confidence & Quality

### Normalization Confidence

- AI reports confidence for each extracted entity
- Low confidence → flag for manual review
- Missing critical fields → warning to user

### Generation Quality

- Leverages high-quality normalized data
- Focuses on formatting & presentation
- Less hallucination risk (using real extracted data)

## Future Enhancements

1. **Multi-language support**: Extract from Spanish/French transcripts
2. **Incremental updates**: Re-normalize with new information
3. **Entity linking**: Deduplicate patients across visits
4. **Template customization**: Generate with practice-specific styles
5. **Validation**: Clinical rules engine on extracted entities

## Summary

**Normalization = "What happened?"** (entity extraction)
**Generation = "How should we communicate it?"** (document formatting)

This separation creates a robust, flexible system where the normalized data becomes the single source of truth for all downstream document generation.

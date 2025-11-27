# API Standardization Documentation

## Overview

This document provides comprehensive context for understanding the current API architecture challenges and the proposed unified case management API. The system currently has multiple disparate entry points for case creation, leading to data inconsistency and maintenance complexity.

## Current State Analysis

### Problem: Multiple Entry Points

The system currently creates cases through three completely different pathways:

```
┌─────────────────────────────────────────────────────────┐
│                   Current Architecture                   │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  IDEXX Extension          Mobile App         Web Dashboard│
│        ↓                      ↓                    ↓     │
│  /api/cases/ingest     Edge Function        Multiple APIs│
│        ↓                      ↓                    ↓     │
│  CasesService          generate-soap-v2     Various      │
│        ↓                      ↓              Services    │
│  ┌──────────┐          ┌──────────┐        ┌──────────┐ │
│  │ Entities │          │   SOAP   │        │  Mixed   │ │
│  │ Metadata │          │   Only   │        │   Data   │ │
│  └──────────┘          └──────────┘        └──────────┘ │
│                                                           │
│                     Supabase Database                     │
│  • Inconsistent data structures                          │
│  • Different fields populated                            │
│  • No unified entity model                               │
└─────────────────────────────────────────────────────────┘
```

### Data Inconsistency Examples

**IDEXX Creates:**

```typescript
{
  metadata: {
    entities: NormalizedEntities,  // Full AI extraction
    idexx: { /* raw data */ }
  },
  source: "idexx_neo",
  external_id: "idexx-123"
}
```

**Mobile App Creates:**

```typescript
{
  metadata: {},          // No entities
  source: "manual",
  external_id: null      // No tracking
}
```

### Key Issues

| Issue                          | Impact                              | Current Workaround           |
| ------------------------------ | ----------------------------------- | ---------------------------- |
| **No unified entity model**    | Mobile cases lack structured data   | Manual extraction later      |
| **Case duplication**           | Same patient creates multiple cases | 90-day window matching       |
| **Inconsistent patient data**  | Different fields per source         | Incomplete records           |
| **Complex debugging**          | 3+ code paths to trace              | Time-consuming investigation |
| **Difficult PIMS integration** | Each needs custom implementation    | High development cost        |

## Proposed Unified Architecture

### Single Entry Point Design

```
┌─────────────────────────────────────────────────────────┐
│                  Unified Architecture                    │
├───────────────────────────────────────────────────────────┤
│                                                           │
│     ALL SOURCES (IDEXX, Mobile, Web, Future PIMS)       │
│                         ↓                                │
│              ┌────────────────────┐                      │
│              │   /api/cases       │                      │
│              │  (REST Resource)   │                      │
│              └──────────┬─────────┘                      │
│                         ↓                                │
│            ┌─────────────────────────┐                   │
│            │  UnifiedCaseService     │                   │
│            ├─────────────────────────┤                   │
│            │ • Entity Extraction     │                   │
│            │ • Case Deduplication    │                   │
│            │ • SOAP Generation       │                   │
│            │ • Discharge Generation  │                   │
│            └──────────┬──────────────┘                   │
│                       ↓                                  │
│              ┌─────────────────┐                         │
│              │  Standardized   │                         │
│              │  Data Storage   │                         │
│              │  (entities)     │                         │
│              └─────────────────┘                         │
│                                                           │
│                  Supabase Database                       │
│  • Consistent structure across all sources               │
│  • Always includes normalized entities                   │
│  • Unified patient deduplication                         │
└─────────────────────────────────────────────────────────┘
```

## Technical Specifications

### Unified Request Structure

```typescript
interface UnifiedCaseRequest {
  source: "idexx_neo" | "mobile_app" | "web" | /* future PIMS */;
  mode: "text" | "structured";
  data: TextInput | StructuredInput;
  options?: {
    generateSoap?: boolean;
    generateDischarge?: boolean;
    scheduleCall?: boolean;
    scheduleEmail?: boolean;
    templateId?: string;
  };
}
```

### Unified Response Structure

```typescript
interface UnifiedCaseResponse {
  success: boolean;
  data: {
    case: { id; status; source; isNew };
    patient: { id; name; species; owner };
    entities: NormalizedEntities; // Always present
    generated?: {
      soapNote?: { id; sections };
      dischargeSummary?: { id; content };
      scheduledCall?: { id; scheduledFor };
    };
  };
  warnings?: string[];
  error?: { code; message; retryable };
}
```

### REST Endpoints

| Method  | Endpoint                   | Purpose                     |
| ------- | -------------------------- | --------------------------- |
| `POST`  | `/api/cases`               | Create or update case       |
| `GET`   | `/api/cases/:id`           | Retrieve case with all data |
| `PATCH` | `/api/cases/:id`           | Update specific fields      |
| `POST`  | `/api/cases/:id/soap`      | Generate SOAP note          |
| `POST`  | `/api/cases/:id/discharge` | Generate discharge summary  |

## Core Concepts

### Normalized Entities

The central data structure that flows through the entire system:

```
NormalizedEntities
├── patient
│   ├── name, species, breed, age, sex, weight
│   └── owner (name, phone, email)
├── clinical
│   ├── chiefComplaint, symptoms[], diagnoses[]
│   ├── medications[] (name, dosage, frequency)
│   ├── procedures[], treatments[]
│   └── followUpInstructions
├── caseType (checkup|emergency|surgery|follow_up)
└── confidence (0-1 scoring)
```

### Entity Extraction Flow

```
Input Data → Extraction/Transformation → NormalizedEntities
    ↓                                           ↓
Text Mode:                              Structured Mode:
• AI extraction via LLM                • Direct mapping
• Retry with backoff                   • Field validation
• Only explicit facts                  • Type conversion
```

### Case Deduplication Strategy

```
1. External ID Match (if exists)
   ↓ (no match)
2. Patient + Owner Fuzzy Match (90 days)
   ↓ (calculate similarity score)
3. Score > 0.8 → Update existing
   Score ≤ 0.8 → Create new
```

**Similarity Scoring:**

- Patient name: 40% weight
- Owner name: 30% weight
- Species match: 20% weight
- Date proximity: 10% weight

### Entity Merging Strategy

When updating existing cases, entities are merged with priority:

```
Database Values (highest)
        ↓
Structured Data (IDEXX)
        ↓
AI Extracted (fallback)
        ↓
Merged Entities
```

## Integration Examples

### IDEXX Extension Integration

**Before:** Multiple API calls

```typescript
// 1. Ingest case
await casesIngestApi.ingestCase(idexxData);
// 2. Generate discharge separately
await generateDischarge(caseId);
// 3. Schedule call separately
await scheduleCall(caseId);
```

**After:** Single unified call

```typescript
await fetch("/api/cases", {
  method: "POST",
  body: {
    source: "idexx_neo",
    mode: "structured",
    data: idexxData,
    options: {
      generateDischarge: true,
      scheduleCall: true,
    },
  },
});
// Returns everything in one response
```

### Mobile App Integration

**Before:** Edge function dependency

```typescript
// Direct edge function call
await supabase.functions.invoke("generate-soap-notes-v2");
// Discharge triggered automatically (no control)
```

**After:** REST API with control

```typescript
await fetch("/api/cases", {
  method: "POST",
  body: {
    source: "mobile_app",
    mode: "text",
    data: { transcript },
    options: {
      generateSoap: true,
      generateDischarge: true,
      templateId: "dr_custom",
    },
  },
});
```

## Service Architecture

### UnifiedCaseService Responsibilities

```
UnifiedCaseService
├── processCase()
│   ├── Extract/Transform Entities
│   ├── Find or Create Case
│   └── Process Options (parallel)
├── extractEntities()
│   ├── Text → AI Extraction
│   └── Structured → Transformation
├── findOrCreateCase()
│   ├── Deduplication Logic
│   ├── Merge Existing
│   └── Create New
└── processOptions()
    ├── Generate SOAP
    ├── Generate Discharge
    └── Schedule Communications
```

### Data Flow Through Services

```
Request → Validation → Entity Extraction → Case Resolution → Operations → Response
           ↓              ↓                    ↓                ↓
         Schema        AI/Transform      Deduplicate      SOAP/Discharge
         Check         to Entities       Find/Create      Schedule Calls
```

## Database Considerations

### Required Schema Updates

```sql
-- Add entities column for unified storage
ALTER TABLE cases ADD COLUMN entities JSONB;

-- Add extraction confidence tracking
ALTER TABLE cases ADD COLUMN extraction_confidence DECIMAL(3,2);

-- Create indexes for performance
CREATE INDEX idx_cases_entities_patient ON cases ((entities->'patient'->>'name'));
CREATE INDEX idx_cases_entities_owner ON cases ((entities->'patient'->'owner'->>'name'));
```

### Patient Deduplication Support

```sql
-- Track duplicate patients
CREATE TABLE patient_matches (
  canonical_patient_id UUID,
  duplicate_patient_id UUID,
  match_confidence DECIMAL(3,2),
  match_reason TEXT
);
```

## Error Handling Patterns

### Retry Strategy

- **API Errors (429, 500-599):** Exponential backoff `2^attempt * 1000ms`
- **Validation Errors:** No retry, immediate failure
- **Max Attempts:** 3 for extraction, 2 for API calls

### Partial Success Handling

```typescript
{
  success: true,
  data: { case, patient, entities },
  warnings: [
    "Email scheduling failed - no email provided",
    "SOAP template not found - used default"
  ]
}
```

## Benefits of Standardization

| Aspect               | Current State        | With Unified API        |
| -------------------- | -------------------- | ----------------------- |
| **Entry Points**     | 3+ different APIs    | 1 REST resource         |
| **Data Consistency** | Varies by source     | Always normalized       |
| **Code Complexity**  | ~15 files            | ~5 files                |
| **PIMS Integration** | Days per system      | Hours per system        |
| **Debugging Time**   | Complex tracing      | Single flow             |
| **Test Coverage**    | Multiple test suites | One comprehensive suite |

## Future Extensibility

### Adding New PIMS

Simply add new source type and transformation:

```typescript
// 1. Add source
type CaseSource = ... | "cornerstone" | "ezyvet";

// 2. Add transformer
transformCornerstoneData(data) → StructuredInput

// 3. Use existing endpoint
POST /api/cases { source: "cornerstone", ... }
```

### Adding New Operations

Extend the REST resource:

```typescript
POST /api/cases/:id/lab-results    // Attach lab results
POST /api/cases/:id/follow-up      // Schedule follow-up
GET  /api/cases/:id/timeline       // Get case timeline
```

## Key Architectural Decisions

1. **REST over GraphQL/RPC**: Better fits existing patterns, simpler caching
2. **Entities always extracted**: Ensures data consistency, enables features
3. **Smart deduplication**: Reduces duplicates while preserving user intent
4. **Parallel operations**: Options processed concurrently for performance
5. **Unified response**: Consistent structure simplifies client code

## Developer Notes

### Critical Paths to Understand

1. **Entity Extraction**: Core to entire system, must handle all input types
2. **Case Deduplication**: Prevents duplicates, critical for data integrity
3. **Entity Merging**: Preserves best data from multiple sources
4. **Error Recovery**: Graceful degradation with warnings vs hard failures

### Common Pitfalls to Avoid

- Don't skip entity extraction for "simple" cases
- Don't create cases without deduplication check
- Don't lose structured data when merging entities
- Don't fail entire request for optional operations

### Testing Considerations

- Test all source types with same patient data
- Verify deduplication with edge cases (similar names)
- Test partial failures (case created but SOAP fails)
- Validate entity merging preserves all data

## Conclusion

This unified API architecture solves the current fragmentation by providing a single, consistent interface for all case creation. It maintains flexibility for different input sources while ensuring data consistency through normalized entities. The design supports future growth with new PIMS integrations and features while significantly reducing code complexity and maintenance burden.

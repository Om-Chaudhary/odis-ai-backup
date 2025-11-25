# RAG Knowledge Base - Documentation Summary

**Date**: November 25, 2025  
**Status**: API Architecture Complete | Core Documentation Needed

---

## 📊 Current State

### ✅ What Exists Now

1. **API_ARCHITECTURE.md** (Complete - 13,000+ words)
   - High-level architecture diagram
   - All API endpoints (existing + new)
   - 3 complete data flow diagrams
   - 2 sequence diagrams
   - Database query performance analysis
   - Error handling flows
   - Implementation file structure
   - Ready for development

2. **_FOLDER_STRUCTURE.md** (Complete)
   - Navigation guide
   - File descriptions
   - Reading guide
   - Search tips
   - Documentation stats

3. **_DUPLICATE_PATIENTS_NOTE.md** (Complete - written during this session)
   - Problem explanation
   - Solution strategies
   - Complete code examples
   - Implementation guidance

---

## 📝 What Was Discussed (Not Persisted)

During this session, we discussed and "updated" several documents that don't actually exist in the filesystem:

1. **ARCHITECTURE.md** - Should contain:
   - Complete RAG technical research
   - Real Supabase schema integration
   - SQL queries for your actual tables
   - Cost analysis
   - Implementation phases
   - ~15,000 words

2. **SCHEMA_ANALYSIS.md** - Should contain:
   - Breakdown of your 5 core tables
   - Table structures and columns
   - Sample data from your database
   - Key findings (no medications table, etc.)
   - Data relationships

3. **README.md** - Should contain:
   - Feature overview
   - Problem statement
   - Quick navigation
   - Implementation phases
   - Success metrics

4. **CHANGELOG.md** - Should contain:
   - Version history
   - What changed from generic to schema-accurate
   - Before/after comparison
   - Key discoveries

---

## 🎯 The RAG System Concept

Based on our extensive discussion, here's what the RAG (Retrieval-Augmented Generation) system is designed to do:

### The Problem

**Current System**: Static knowledge base (15 hardcoded TypeScript files)
- No case-specific context
- No patient history retrieval
- Hardcoded guardrails
- Can't answer questions about THIS pet

**What You Need**: Dynamic context retrieval
- Get THIS pet's medical history during calls
- Retrieve discharge summaries, medications, SOAP notes
- Pull previous call transcripts
- Answer owner questions with actual case data
- Enforce dynamic guardrails

### The Solution: RAG Over Your Database

**NOT** ingesting medical textbooks or literature.

**YES** retrieving case-specific data from YOUR Supabase database:

#### Your Actual Tables (from Supabase MCP)

1. **`scheduled_discharge_calls`** (3 rows)
   - VAPI call records
   - Has `case_id` column (critical for retrieval!)
   - Stores transcripts and call analysis

2. **`discharge_summaries`** (472 rows)
   - Rich, structured content
   - Contains medications (embedded in text)
   - Contains warning signs
   - Full discharge instructions

3. **`soap_notes`** (907 rows)
   - Subjective, Objective, Assessment, Plan
   - Clinical notes
   - Treatment plans

4. **`patients`** (898 rows)
   - Pet information
   - Owner contact info
   - **⚠️ Important**: Duplicate patients not handled yet
   - Same name/phone can have multiple entries

5. **`cases`** (1022 rows)
   - Case records
   - Linked to patients

### Key Architectural Decisions

#### 1. Use `case_id` from `scheduled_discharge_calls` ✅

**Why**: Avoids duplicate patient ambiguity

```typescript
// ✅ Recommended approach
const { data: call } = await supabase
  .from('scheduled_discharge_calls')
  .select('case_id')
  .eq('id', callId)
  .single();

const context = await retrieveCaseContextByCaseId(call.case_id);
```

#### 2. Phase 1: Direct SQL Retrieval (No Vector Embeddings Yet)

**Why**: Your data volume is small (472 + 907 records)
- SQL queries are FAST (50-100ms)
- No embedding costs initially
- Can add vector search in Phase 2 if needed

**Parallel Queries**:
```typescript
const [patient, discharge, soap, previousCalls] = await Promise.all([
  supabase.from('patients').select('*').eq('case_id', caseId).single(),
  supabase.from('discharge_summaries').select('*').eq('case_id', caseId).order('created_at', { ascending: false }).limit(1).single(),
  supabase.from('soap_notes').select('*').eq('case_id', caseId).order('created_at', { ascending: false }).limit(1).single(),
  supabase.from('scheduled_discharge_calls').select('*').eq('case_id', caseId).not('transcript', 'is', null).order('created_at', { ascending: false }).limit(3)
]);
```

**Total Time**: 50-100ms ⚡

#### 3. Pre-Call Context Injection (Not Real-Time Function Calling)

**Why**: Latency-sensitive voice calls
- Retrieve context BEFORE call starts
- Inject as `assistantOverrides.variableValues`
- VAPI uses context during conversation
- No function call latency during call

**Optional**: Add function calling in Phase 2 for dynamic questions

### Data Flow (High-Level)

```
┌────────────────────────────────────────────────────────────┐
│  1. QStash triggers call execution                         │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────┐
│  2. Get call record from scheduled_discharge_calls         │
│     → Extract case_id                                      │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────┐
│  3. Retrieve RAG context (50-100ms)                        │
│     → Get patient                                          │
│     → Get discharge summary (parallel)                     │
│     → Get SOAP notes (parallel)                            │
│     → Get previous calls (parallel)                        │
│     → Parse medications from text                          │
│     → Extract warning signs                                │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────┐
│  4. Enrich dynamic variables                               │
│     baseVariables + RAG context                            │
│     → discharge_summary                                    │
│     → medications                                          │
│     → warning_signs                                        │
│     → previous_assessment                                  │
│     → previous_calls_summary                               │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────┐
│  5. Create VAPI call with enriched context                │
│     → assistantOverrides.variableValues                    │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────┐
│  6. VAPI makes call using enriched context                │
│     → Can answer questions about THIS pet                  │
│     → Uses actual discharge instructions                   │
│     → References previous calls                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Plan

### Phase 1: MVP (2-3 weeks)

**Goal**: SQL-based context retrieval

1. **Create RAG service layer**
   ```
   src/lib/vapi/rag/
   ├── retrieval.ts          # Core retrieval functions
   ├── parsing.ts            # Text parsing (medications, warning signs)
   ├── formatting.ts         # Format for VAPI
   └── types.ts              # TypeScript types
   ```

2. **Modify existing API route**
   - `src/app/api/calls/execute/route.ts`
   - Add RAG context retrieval
   - Enrich dynamic variables
   - Pass to VAPI

3. **Add new API endpoints** (optional for debugging)
   - `GET /api/rag/context/:caseId` - Preview context
   - `POST /api/rag/enrich` - Test enrichment

4. **Test with existing 3 calls**
   - Measure retrieval time
   - Verify context accuracy
   - Check VAPI integration

### Phase 2: Vector Search (Optional, 3-4 weeks)

**Goal**: Semantic search for better context

1. **Create `case_context` table**
   - Store embeddings (pgvector)
   - Chunk discharge summaries and SOAP notes

2. **Embed existing data**
   - 472 discharge summaries
   - 907 SOAP notes
   - Cost: $0.02 one-time

3. **Add hybrid search**
   - Combine SQL + vector search
   - Better question answering

### Phase 3: Function Calling (Optional, 2-3 weeks)

**Goal**: Real-time context retrieval during calls

1. **VAPI function calling setup**
   - Define functions for VAPI
   - Implement handlers

2. **Dynamic retrieval**
   - Owner asks specific question
   - Function call retrieves answer
   - VAPI responds with context

---

## 📊 Key Metrics

### Current Data Volumes

- 472 discharge summaries
- 907 SOAP notes
- 3 calls (so far)
- 898 patients
- 1,022 cases

### Performance Targets

- Context retrieval: 50-100ms
- Total call setup: < 200ms
- Embedding cost (Phase 2): $0.02 one-time
- Per-call cost: < $0.001

### Benefits

✅ **Accuracy**: Use actual case data, not generic knowledge  
✅ **Context**: Retrieve THIS pet's history and medications  
✅ **Compliance**: Dynamic guardrails based on case  
✅ **Continuity**: Reference previous calls and notes  
✅ **Scalability**: Works with your small data volume perfectly

---

## ⚠️ Important Constraints

### Duplicate Patients Not Handled

**Problem**: Same pet name or phone number may have multiple entries across different cases.

**Solution**: Always use `case_id` from `scheduled_discharge_calls` to avoid ambiguity.

**Fallback**: If `case_id` not available:
- Query by phone
- Select most recent case
- Try to match pet name
- Log warning

**See**: `_DUPLICATE_PATIENTS_NOTE.md` for complete details

---

## 📁 API Endpoints (New)

### 1. Modify Existing: `POST /api/calls/execute`

Add RAG context retrieval before creating VAPI call.

### 2. New: `GET /api/rag/context/:caseId`

Preview case context (for debugging).

**Response**:
```json
{
  "success": true,
  "context": {
    "patient": { "name": "Max", ... },
    "dischargeSummary": "...",
    "medications": [...],
    "warningSigns": [...],
    "soapNote": { ... },
    "previousCalls": [...]
  },
  "retrievalTimeMs": 85
}
```

### 3. New: `POST /api/rag/enrich`

Enrich call variables with RAG context.

**Request**:
```json
{
  "caseId": "abc-123",
  "baseVariables": {
    "petName": "Max",
    "ownerName": "John"
  }
}
```

**Response**:
```json
{
  "success": true,
  "enrichedVariables": {
    "petName": "Max",
    "ownerName": "John",
    "discharge_summary": "...",
    "medications": "...",
    "warning_signs": "...",
    "previous_assessment": "...",
    "previous_calls_summary": "..."
  }
}
```

---

## 🎨 Complete Architecture Diagrams

**See**: `API_ARCHITECTURE.md` for complete diagrams including:

1. **High-Level Architecture** (system overview)
2. **API Endpoints** (all routes)
3. **Flow 1**: Call execution with RAG (end-to-end)
4. **Flow 2**: RAG context retrieval (detailed with parallel queries)
5. **Flow 3**: Duplicate patient handling
6. **Sequence 1**: Call execution (component interaction)
7. **Sequence 2**: RAG retrieval (database queries)
8. **Error Handling**: All error scenarios
9. **Query Performance**: Timing breakdown

---

## 🔑 Key Files Referenced

### Existing Codebase

- `src/lib/vapi/client.ts` - VAPI client wrapper
- `src/lib/vapi/knowledge-base/` - Current static knowledge base (to be replaced)
- `src/app/api/calls/execute/route.ts` - Call execution (needs RAG integration)
- `src/lib/supabase/server.ts` - Supabase client

### To Be Created (Phase 1)

- `src/lib/vapi/rag/retrieval.ts`
- `src/lib/vapi/rag/parsing.ts`
- `src/lib/vapi/rag/formatting.ts`
- `src/lib/vapi/rag/types.ts`
- `src/app/api/rag/context/[caseId]/route.ts`
- `src/app/api/rag/enrich/route.ts`

---

## 💡 Key Insights from Research

### 1. Your Data is Perfect for RAG

- **Small enough**: Fast SQL queries (no complex vector search needed initially)
- **Large enough**: 472 + 907 records = lots of case history
- **Rich content**: Discharge summaries are very detailed
- **Well-structured**: Clear sections for medications, warnings, etc.

### 2. SQL First, Vector Later

Don't over-engineer. Start with simple SQL retrieval:
- Get patient by `case_id`
- Get latest discharge summary
- Get latest SOAP note
- Get previous calls
- Parse medications from text

**Total time**: 50-100ms

Only add vector search if you need semantic search over large text corpus.

### 3. Pre-Call Injection Beats Real-Time

For voice calls, pre-load context before call starts:
- Lower latency
- More reliable
- Simpler implementation
- VAPI uses context throughout conversation

Add function calling later if needed for dynamic questions.

### 4. Use `case_id` to Avoid Duplicate Patient Issues

Your `scheduled_discharge_calls` table already has `case_id` column.
Use it! Avoids all ambiguity about which patient/case to retrieve.

---

## 📚 Next Steps

### 1. Review Existing Documentation ✅

- [x] API_ARCHITECTURE.md (complete data flow)
- [x] _DUPLICATE_PATIENTS_NOTE.md (duplicate handling)
- [x] _FOLDER_STRUCTURE.md (navigation)
- [x] This SUMMARY.md

### 2. Create Core Documentation (If Needed)

If you want complete RAG research docs:
- [ ] ARCHITECTURE.md (15,000+ word technical research)
- [ ] SCHEMA_ANALYSIS.md (database breakdown)
- [ ] README.md (feature overview)
- [ ] CHANGELOG.md (version history)

**Or**: Just use API_ARCHITECTURE.md and start implementing!

### 3. Start Phase 1 Implementation

1. Create RAG service layer (`src/lib/vapi/rag/`)
2. Modify `/api/calls/execute` route
3. Test with existing 3 calls
4. Measure performance
5. Iterate

---

## 🎯 Success Criteria

You'll know RAG is working when:

✅ VAPI calls can reference actual discharge instructions  
✅ AI can answer questions using THIS pet's medical history  
✅ Medications are pulled from actual case data  
✅ Previous call context is included  
✅ Retrieval time < 100ms  
✅ No additional cost per call (Phase 1)  

---

## 🤝 Summary

**What you have**:
- Complete API architecture diagrams ✅
- Duplicate patient handling strategy ✅
- Clear implementation path ✅
- Real Supabase schema understanding ✅

**What you need**:
- Implement Phase 1 RAG service layer
- Modify call execution to use RAG
- Test with your 3 existing calls
- Measure and optimize

**The bottom line**: You don't need to ingest medical literature. You need to retrieve **case-specific context from YOUR database** and inject it into VAPI calls. Start with simple SQL queries, add vector search later if needed.

---

**Last Updated**: November 25, 2025  
**Status**: Ready for Phase 1 implementation  
**Estimated Effort**: 2-3 weeks for MVP



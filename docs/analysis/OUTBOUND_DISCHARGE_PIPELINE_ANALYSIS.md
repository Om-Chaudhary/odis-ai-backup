# Outbound Discharge Pipeline Analysis

**Date**: 2025-12-22
**Author**: Multi-Agent Coordinator
**Purpose**: Comprehensive analysis of the outbound discharge scheduling pipeline with focus on generation timing and optimization opportunities

---

## Executive Summary

The outbound discharge pipeline currently performs **on-demand generation** at schedule time, causing delays when users click "Generate and Send". The system has significant infrastructure for **upfront generation** during ingestion (especially for IDEXX cases), but this capability is **not fully leveraged** in the outbound UI workflow.

**Key Finding**: The delay exists because entity extraction, discharge summary generation, email content generation, and AI call intelligence generation all happen **synchronously during the approval/scheduling step**, rather than being pre-computed during or after case ingestion.

---

## Current Pipeline Flow

### 1. IDEXX Case Ingestion Flow

**File**: `libs/services-cases/src/lib/cases-service.ts` (`CasesService.ingest()`)

```
IDEXX Extension → ingest() → Process Steps:
│
├─ Step 1: Extract Entities from Consultation Notes
│  ├─ Try AI extraction from consultation_notes (extractEntitiesFromIdexx)
│  ├─ Strip HTML tags, clean text
│  ├─ Block euthanasia cases
│  └─ Enrich with IDEXX metadata (pet_name, owner info, billing)
│
├─ Step 2: Create or Update Case
│  ├─ Deduplicate by external_id (idexx-appt-{id})
│  ├─ Merge entities with existing data
│  ├─ Store in cases.entity_extraction (JSONB)
│  └─ Create/update patient record
│
├─ Step 3: Auto-Generate Discharge Summary (IDEXX only!)
│  ├─ Check if summary already exists → skip if yes
│  ├─ Validate minimum data (patient name + diagnoses/complaint)
│  ├─ Call generateStructuredDischargeSummaryWithRetry()
│  ├─ Save to discharge_summaries (content + structured_content)
│  └─ Non-blocking: continues even if generation fails
│
├─ Step 4: Pre-Generate Call Intelligence (IDEXX only!)
│  ├─ Check minimum data (patient + diagnoses/meds)
│  ├─ Call generateCallIntelligenceFromEntities()
│  ├─ Generate assessment questions, warning signs, emergency criteria
│  ├─ Store in cases.metadata.callIntelligence
│  └─ Non-blocking: continues even if generation fails
│
└─ Step 5: Auto-Schedule (if options.autoSchedule = true)
   └─ Call scheduleDischargeCall() with pre-generated data
```

**Key Observation**: IDEXX cases get **discharge summaries** and **call intelligence pre-generated** during ingestion, but **email content is NOT pre-generated**.

---

### 2. Outbound UI "Generate and Send" Flow

**File**: `apps/web/src/server/api/routers/outbound/procedures/approve.ts`

```
User clicks "Generate and Send" → approveAndSchedule() → Synchronous Steps:
│
├─ Step 1: Check for Existing Discharge Summary
│  └─ If missing → GENERATE NOW (causes delay!)
│     ├─ Extract SOAP content from soap_notes
│     ├─ Get/enrich entities from case or IDEXX metadata
│     ├─ Call generateStructuredDischargeSummaryWithRetry() ⏱️ 3-8s AI call
│     └─ Save to discharge_summaries
│
├─ Step 2: Schedule Email (if enabled)
│  ├─ Calculate schedule time (default: 1 day + 10:00 AM)
│  ├─ Fetch discharge summary (content + structured_content)
│  ├─ Get clinic branding (logo, colors, header/footer)
│  ├─ GENERATE EMAIL CONTENT NOW ⏱️ 1-2s (template rendering)
│  │  └─ Call generateDischargeEmailContent()
│  │     └─ DischargeEmailTemplate() with structured sections
│  ├─ Insert scheduled_discharge_emails record
│  └─ Schedule via QStash (delayed execution)
│
├─ Step 3: Schedule Call (if enabled)
│  ├─ Calculate schedule time (default: 2 days + 4:00 PM)
│  ├─ Extract/build entities if missing
│  │  ├─ Try CasesService.extractEntitiesFromIdexx() ⏱️ 3-8s AI call
│  │  └─ Fallback: buildEntitiesFromIdexxMetadata()
│  ├─ Call CasesService.scheduleDischargeCall()
│  │  ├─ Enrich entities with patient database values
│  │  ├─ Extract VAPI variables (extractVapiVariablesFromEntities)
│  │  ├─ CHECK for pre-generated call intelligence
│  │  │  ├─ Found → use instantly (IDEXX cases)
│  │  │  └─ Missing → GENERATE NOW ⏱️ 5-12s AI call
│  │  │     └─ generateCallIntelligenceFromEntities()
│  │  ├─ Build dynamic variables with knowledge base
│  │  ├─ Insert scheduled_discharge_calls record
│  │  └─ Schedule via QStash (delayed execution)
│  │
│  └─ Total Call Scheduling Time:
│     ├─ IDEXX (pre-generated): ~1-2s (variable extraction only)
│     └─ Non-IDEXX or missed pre-gen: ~5-15s (AI generation)
│
└─ Total "Generate and Send" Time:
   ├─ Best case (IDEXX, summary pre-generated): ~2-4s
   ├─ Typical case (summary exists): ~6-10s
   └─ Worst case (generate everything): ~12-20s
```

**The Delay Problem**: When a user clicks "Generate and Send", they wait for:
1. **Discharge Summary Generation** (if missing): 3-8 seconds
2. **Email Content Generation**: 1-2 seconds (template rendering, always happens)
3. **Call Intelligence Generation** (if not pre-generated): 5-12 seconds
4. **Variable Extraction & Scheduling**: 1-2 seconds

**Total Wait Time**: 10-24 seconds depending on what's already generated.

---

## What Gets Pre-Generated (IDEXX Cases Only)

### During Ingestion (`CasesService.ingest()`)

#### ✅ Pre-Generated
1. **Entity Extraction** (`entity_extraction` column)
   - AI extraction from consultation notes
   - Patient demographics, diagnoses, medications, procedures
   - Stored in `cases.entity_extraction` (JSONB)

2. **Discharge Summary** (`autoGenerateDischargeSummary()`)
   - Plaintext summary content
   - Structured content (medications, home care, follow-up)
   - Stored in `discharge_summaries.content` and `.structured_content`

3. **Call Intelligence** (`generateAndStoreCallIntelligence()`)
   - Assessment questions (5-8 questions)
   - Warning signs to monitor
   - Normal expectations
   - Emergency criteria
   - Call approach (conversational/direct)
   - Stored in `cases.metadata.callIntelligence`

#### ❌ NOT Pre-Generated
1. **Email Content** (HTML/text)
   - Requires clinic branding (logo, colors, header/footer)
   - Uses DischargeEmailTemplate component
   - Generated fresh every time during scheduling
   - **Reason**: Branding can change, template customization

2. **VAPI Dynamic Variables** (for calls)
   - Extracted from entities during scheduling
   - Includes all AI-extracted clinical data
   - Merged with static variables (clinic info, agent name)
   - **Reason**: Includes runtime data (schedule time, clinic config)

---

## Database Schema Analysis

### Key Tables

#### `cases`
```sql
- id (uuid)
- user_id (uuid)
- status (enum: ongoing, completed, etc.)
- source (text: idexx_extension, idexx_neo, etc.)
- external_id (text: idexx-appt-{id} for deduplication)
- entity_extraction (jsonb) ← AI-extracted entities
- metadata (jsonb) ← Contains callIntelligence, idexx raw data
```

#### `discharge_summaries`
```sql
- id (uuid)
- case_id (uuid)
- user_id (uuid)
- content (text) ← Plaintext summary
- structured_content (jsonb) ← Sections for email template
- created_at (timestamp)
```

#### `scheduled_discharge_emails`
```sql
- id (uuid)
- case_id (uuid)
- user_id (uuid)
- recipient_email (text)
- subject (text)
- html_content (text) ← Generated at schedule time
- text_content (text)
- scheduled_for (timestamp)
- status (enum: queued, sent, failed)
- qstash_message_id (text)
```

#### `scheduled_discharge_calls`
```sql
- id (uuid)
- case_id (uuid)
- user_id (uuid)
- customer_phone (text)
- assistant_id (text)
- phone_number_id (text)
- scheduled_for (timestamp)
- status (enum: queued, in_progress, completed, failed)
- dynamic_variables (jsonb) ← VAPI variables (extracted at schedule time)
- metadata (jsonb) ← QStash message ID, retry count
- vapi_call_id (text)
```

---

## Generation Steps Breakdown

### 1. Entity Extraction

**When**: During ingestion (IDEXX) OR at schedule time (fallback)
**Duration**: 3-8 seconds (AI call to Claude)
**Input**: Consultation notes or transcription text
**Output**: NormalizedEntities with patient, clinical, confidence data

**File**: `libs/ai/src/normalize-scribe.ts` (inferred)
```typescript
extractEntitiesWithRetry(text: string, source: string): Promise<NormalizedEntities>
```

**Storage**: `cases.entity_extraction` (JSONB)

---

### 2. Discharge Summary Generation

**When**: During ingestion (IDEXX) OR at schedule time (fallback)
**Duration**: 3-8 seconds (AI call to Claude)
**Input**: SOAP content + entity extraction + patient data
**Output**: { structured: StructuredDischargeSummary, plainText: string }

**File**: `libs/ai/src/generate-structured-discharge.ts` (inferred)
```typescript
generateStructuredDischargeSummaryWithRetry(input: {
  soapContent: string | null;
  entityExtraction: NormalizedEntities | null;
  patientData: { name, species, breed, owner_name };
}): Promise<{ structured, plainText }>
```

**Storage**:
- `discharge_summaries.content` (plaintext)
- `discharge_summaries.structured_content` (JSONB with sections)

**Structured Content Schema** (`@odis-ai/validators/discharge-summary`):
```typescript
{
  patientName: string;
  reasonForVisit?: string;
  diagnosisAndTreatment?: string;
  medicationsDispensed?: Array<{ name, dosage, frequency, instructions }>;
  homeCareInstructions?: string;
  activityRestrictions?: string;
  dietaryRecommendations?: string;
  followUpCare?: string;
  warningSignsToWatch?: string;
  emergencyInstructions?: string;
  additionalNotes?: string;
}
```

---

### 3. Email Content Generation

**When**: ALWAYS at schedule time (never pre-generated)
**Duration**: 1-2 seconds (template rendering, no AI)
**Input**: Discharge summary + patient data + clinic branding
**Output**: { subject, html, text }

**File**: `libs/services-discharge/src/lib/email-content-generator.ts`
```typescript
generateDischargeEmailContent(
  dischargeSummary: string,
  patientName: string,
  species: string | null,
  breed: string | null,
  branding: ClinicBranding,
  structuredContent?: StructuredDischargeSummary,
  visitDate?: string | Date | null,
): Promise<{ subject, html, text }>
```

**Template**: `libs/email/src/discharge-email-template.tsx` (React component)
- Renders HTML with clinic logo, colors, header/footer
- Sections: Medications, Home Care, Follow-Up, Warning Signs
- Converts to plaintext for email clients

**NOT Pre-Generated Because**:
- Clinic branding can change (logo upload, color customization)
- Template customization (header/footer text)
- User might regenerate summary before scheduling

---

### 4. Call Intelligence Generation

**When**: During ingestion (IDEXX) OR at schedule time (fallback)
**Duration**: 5-12 seconds (AI call to Claude with function calling)
**Input**: Entity extraction
**Output**: AIGeneratedCallIntelligence

**File**: `libs/ai/src/generate-assessment-questions.ts` (inferred)
```typescript
generateCallIntelligenceFromEntities(
  entities: NormalizedEntities
): Promise<AIGeneratedCallIntelligence>
```

**Output Schema**:
```typescript
{
  caseContextSummary: string;
  assessmentQuestions: Array<{
    question: string;
    category: 'general' | 'clinical' | 'behavioral' | 'medication';
    normalAnswer: string;
    concerningAnswers: string[];
  }>;
  warningSignsToMonitor: string[];
  normalExpectations: string;
  emergencyCriteria: string;
  shouldAskClinicalQuestions: boolean;
  callApproach: 'conversational' | 'direct';
  confidence: number;
}
```

**Storage**: `cases.metadata.callIntelligence` with `generatedAt` timestamp

**Pre-Generated for IDEXX Because**:
- Takes 5-12 seconds (most expensive operation)
- Allows instant call scheduling in outbound UI
- Data is stable once case is completed

---

### 5. VAPI Variable Extraction

**When**: ALWAYS at schedule time (never pre-generated)
**Duration**: < 1 second (data transformation, no AI)
**Input**: Entity extraction
**Output**: Record<string, unknown> (snake_case variables)

**File**: `libs/vapi/src/extract-variables.ts` (inferred)
```typescript
extractVapiVariablesFromEntities(
  entities: NormalizedEntities
): Record<string, unknown>
```

**Variables Extracted** (40+ variables):
```typescript
{
  // Patient demographics
  patient_species: "dog" | "cat" | "bird" | "rabbit" | "other";
  patient_breed: string;
  patient_age_years: number;
  patient_weight_kg: number;
  patient_sex: "male" | "female" | "neutered_male" | "spayed_female";

  // Clinical data
  primary_diagnosis: string;
  secondary_diagnoses: string[];
  medication_names: string[];
  medication_count: number;
  vaccination_names: string[];
  procedure_names: string[];

  // Visit context
  visit_reason: string;
  presenting_symptoms: string[];

  // Assessment (from AI call intelligence)
  assessment_question_1: string;
  assessment_question_2: string;
  // ... up to assessment_question_8
  warning_signs: string[];
  emergency_criteria: string;
  should_ask_questions: boolean;
  call_approach: string;
}
```

**Merged with Static Variables**:
```typescript
{
  // Clinic info (from user/clinic tables)
  clinic_name: string;
  clinic_phone: string;
  emergency_phone: string;
  agent_name: string; // Default: "Sarah"

  // Call context
  pet_name: string; // First name only (extractFirstName)
  owner_name: string;
  appointment_date: string; // Generic: "recent visit"
  call_type: "discharge" | "follow-up";

  // Summary content
  discharge_summary_content: string;
  medications: string; // Comma-separated list
  vaccinations: string;
  next_steps: string;

  // Dynamic flags
  clinic_is_open: "true" | "false"; // Business hours check
}
```

**NOT Pre-Generated Because**:
- Requires runtime clinic configuration
- Schedule time affects business hours check
- Agent name from current user
- Merged with call intelligence (which IS pre-generated)

---

## Orchestrator Pattern (Not Used in Outbound UI)

**File**: `libs/services-discharge/src/lib/discharge-orchestrator.ts`

The `DischargeOrchestrator` class supports a **workflow-based approach** with these steps:
1. `ingest` - Create/update case
2. `extractEntities` - AI entity extraction
3. `generateSummary` - AI discharge summary generation
4. `prepareEmail` - Email content generation
5. `scheduleEmail` - Queue email delivery
6. `scheduleCall` - Queue call delivery

**Execution Modes**:
- **Sequential**: Steps execute in order, wait for dependencies
- **Parallel**: Independent steps execute concurrently

**Current Usage**:
- **Batch Processor**: Uses orchestrator for bulk operations
- **Outbound UI**: Does NOT use orchestrator (direct service calls)

**Why Not Used in Outbound UI**:
- Orchestrator designed for full end-to-end workflows
- Outbound UI needs fine-grained control (enable/disable email vs call)
- Direct service calls provide better error handling and user feedback

---

## Performance Analysis

### Current Timing (Production Observed)

#### Scenario 1: IDEXX Case with Pre-Generated Summary & Intelligence
```
User clicks "Generate and Send" (both email + call enabled)
│
├─ Summary check: EXISTS ✓ (0s)
├─ Email generation: 1-2s (template rendering)
├─ Email scheduling: < 1s (database + QStash)
├─ Call intelligence check: EXISTS ✓ (0s)
├─ Variable extraction: < 1s
└─ Call scheduling: 1s (database + QStash)

Total: 3-5 seconds
```

#### Scenario 2: IDEXX Case WITHOUT Pre-Generated Summary
```
User clicks "Generate and Send"
│
├─ Summary check: MISSING ❌
├─ Generate summary: 3-8s (AI call)
├─ Email generation: 1-2s
├─ Email scheduling: < 1s
├─ Call intelligence check: EXISTS ✓ (0s)
├─ Variable extraction: < 1s
└─ Call scheduling: 1s

Total: 6-13 seconds
```

#### Scenario 3: Non-IDEXX Case (Manual Entry)
```
User clicks "Generate and Send"
│
├─ Summary check: MISSING ❌
├─ Generate summary: 3-8s (AI call)
├─ Email generation: 1-2s
├─ Email scheduling: < 1s
├─ Call intelligence check: MISSING ❌
├─ Generate call intelligence: 5-12s (AI call)
├─ Variable extraction: < 1s
└─ Call scheduling: 1s

Total: 11-25 seconds ⚠️ WORST CASE
```

---

## Recommended Architecture Changes

### Goal: Eliminate Wait Time at Schedule Time

### Phase 1: Pre-Generate Email Content (New!)

**Current Blocker**: Email content is always generated at schedule time (1-2s overhead)

**Proposed Change**: Add `email_content_generated` table

```sql
CREATE TABLE email_content_generated (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) NOT NULL,
  discharge_summary_id uuid REFERENCES discharge_summaries(id) NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text NOT NULL,
  branding_snapshot jsonb NOT NULL, -- Clinic branding at generation time
  created_at timestamp DEFAULT now(),
  invalidated_at timestamp -- Set when summary or branding changes
);

CREATE INDEX idx_email_content_case ON email_content_generated(case_id) WHERE invalidated_at IS NULL;
```

**Generation Trigger**: After discharge summary is generated
```typescript
// In CasesService.autoGenerateDischargeSummary()
// After saving discharge summary:

// Pre-generate email content
const clinic = await getClinicByUserId(userId, supabase);
const branding = createClinicBranding(clinic);
const emailContent = await generateDischargeEmailContent(
  plainText,
  patientName,
  species,
  breed,
  branding,
  structured,
  null,
);

// Save for instant scheduling
await supabase.from('email_content_generated').insert({
  case_id: caseId,
  discharge_summary_id: summaryId,
  subject: emailContent.subject,
  html_content: emailContent.html,
  text_content: emailContent.text,
  branding_snapshot: branding,
});
```

**Scheduling Changes** (in `approve.ts`):
```typescript
// Check for pre-generated email content
const { data: preGeneratedEmail } = await ctx.supabase
  .from('email_content_generated')
  .select('*')
  .eq('case_id', input.caseId)
  .is('invalidated_at', null)
  .order('created_at', { desc: true })
  .limit(1)
  .maybeSingle();

let emailContent;
if (preGeneratedEmail) {
  // Use pre-generated (instant!)
  emailContent = {
    subject: preGeneratedEmail.subject,
    html: preGeneratedEmail.html_content,
    text: preGeneratedEmail.text_content,
  };
  console.log('[Approve] Using pre-generated email content');
} else {
  // Fallback: generate now
  emailContent = await generateDischargeEmailContent(/* ... */);
  console.log('[Approve] Generated email content on-demand');
}
```

**Invalidation Strategy**:
```typescript
// When summary is regenerated
await supabase
  .from('email_content_generated')
  .update({ invalidated_at: new Date() })
  .eq('case_id', caseId);

// When clinic branding changes
await supabase
  .from('email_content_generated')
  .update({ invalidated_at: new Date() })
  .eq('user_id', userId);
```

**Impact**: Reduces "Generate and Send" time by 1-2 seconds (email rendering)

---

### Phase 2: Ensure 100% Pre-Generation Coverage

**Current Gap**: Pre-generation only happens for IDEXX cases via `autoSchedule` flag

**Proposed Change**: Trigger pre-generation for ALL completed cases

#### Option A: Background Job (Recommended)
```typescript
// Webhook or cron job that runs every 5 minutes
// File: apps/web/src/app/api/cron/pre-generate-discharge-content/route.ts

export async function GET() {
  const supabase = createServiceClient();

  // Find completed cases without discharge summaries
  const { data: cases } = await supabase
    .from('cases')
    .select('id, user_id, entity_extraction, metadata')
    .eq('status', 'completed')
    .is('discharge_summaries.id', null) // LEFT JOIN check
    .order('created_at', { desc: true })
    .limit(50); // Process in batches

  for (const case of cases) {
    try {
      // Generate summary
      const summaryResult = await CasesService.autoGenerateDischargeSummary(
        supabase,
        case.user_id,
        case.id,
        case.entity_extraction,
      );

      // Generate call intelligence
      if (summaryResult) {
        await CasesService.generateAndStoreCallIntelligence(
          supabase,
          case.id,
          case.entity_extraction,
        );
      }

      // Generate email content (NEW)
      if (summaryResult) {
        // ... pre-generate email as shown in Phase 1
      }
    } catch (error) {
      console.error(`[PreGen] Failed for case ${case.id}:`, error);
      // Continue with next case
    }
  }

  return NextResponse.json({ processed: cases.length });
}
```

#### Option B: Event-Driven (Supabase Database Trigger)
```sql
-- Trigger function to queue pre-generation
CREATE OR REPLACE FUNCTION trigger_pre_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for completed cases
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Insert into a queue table for background processing
    INSERT INTO pre_generation_queue (case_id, user_id, queued_at)
    VALUES (NEW.id, NEW.user_id, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to cases table
CREATE TRIGGER pre_generation_on_complete
AFTER UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION trigger_pre_generation();
```

**Impact**: Ensures all cases have pre-generated content before reaching outbound UI

---

### Phase 3: Optimize Entity Extraction

**Current Issue**: Entity extraction can happen twice:
1. During ingestion (for IDEXX cases with consultation notes)
2. At schedule time (fallback if entities missing or incomplete)

**Proposed Change**: More aggressive upfront extraction

```typescript
// In CasesService.ingest()
// After creating case, before returning:

// Ensure entity extraction is complete
if (!entities || isEntitiesIncomplete(entities)) {
  console.log('[Ingest] Entities incomplete, attempting re-extraction');

  // Try transcription if available
  const { data: transcription } = await supabase
    .from('transcriptions')
    .select('transcript')
    .eq('case_id', caseId)
    .order('created_at', { desc: true })
    .limit(1)
    .maybeSingle();

  if (transcription?.transcript) {
    const enrichedEntities = await extractEntitiesWithRetry(
      transcription.transcript,
      'transcript'
    );

    // Merge with existing
    entities = mergeEntitiesForExtraction(entities, enrichedEntities);

    // Update case
    await supabase
      .from('cases')
      .update({ entity_extraction: entities })
      .eq('id', caseId);
  }
}
```

**Impact**: Reduces fallback entity extraction at schedule time (saves 3-8s in worst case)

---

### Phase 4: UI Enhancements

#### A. Show Generation Progress
```typescript
// In approve.ts, emit progress events via websocket or polling endpoint

// Before each step:
await ctx.supabase
  .from('case_generation_progress')
  .upsert({
    case_id: input.caseId,
    step: 'generating_summary', // or 'generating_email', 'scheduling_call'
    status: 'in_progress',
    updated_at: new Date(),
  });

// UI polls this table and shows:
// "Generating discharge summary... (3/5)"
// "Preparing email content... (4/5)"
// "Scheduling call... (5/5)"
```

#### B. Pre-Generation Indicator
```typescript
// In outbound UI, show badge if content is already generated:

interface CaseListItem {
  id: string;
  patient: { name: string };
  status: string;
  preGenerationStatus: {
    summaryGenerated: boolean;
    emailGenerated: boolean;
    callIntelligenceGenerated: boolean;
  };
}

// UI shows:
// ✓ Summary Ready
// ✓ Email Ready
// ✓ Call Ready
// → "Instant Send" button (vs "Generate and Send")
```

#### C. Background Generation Button
```typescript
// Add "Prepare All" button to outbound UI
// Triggers background pre-generation for selected cases
// Shows progress bar as cases are processed
// User can continue working while generation happens

async function handlePrepareAll(caseIds: string[]) {
  // Queue all cases for background generation
  await api.outbound.batchPrepare.mutate({ caseIds });

  // Poll for completion
  const interval = setInterval(async () => {
    const status = await api.outbound.getPreparationStatus.query({ caseIds });
    if (status.allComplete) {
      clearInterval(interval);
      toast.success('All cases ready to send!');
    }
  }, 2000);
}
```

---

## Migration Strategy

### Step 1: Add Pre-Generation Infrastructure (Week 1)
- Create `email_content_generated` table
- Add generation progress tracking table
- Implement invalidation logic

### Step 2: Update Ingestion Pipeline (Week 2)
- Enhance `CasesService.ingest()` to pre-generate email content
- Add background job for backfilling existing cases
- Monitor generation success rates

### Step 3: Update Outbound UI (Week 3)
- Check for pre-generated content in `approve.ts`
- Show pre-generation status badges in case list
- Add "Prepare All" batch operation
- Implement progress indicators

### Step 4: Optimize & Monitor (Week 4)
- Add metrics for generation timing
- Optimize slow AI calls (caching, prompt tuning)
- Implement retry logic for failed generations
- User feedback & iteration

---

## Performance Goals

### Current State
- **Best case** (IDEXX, all pre-generated): 3-5 seconds
- **Typical case** (summary exists): 6-10 seconds
- **Worst case** (generate everything): 11-25 seconds

### Target State (After Changes)
- **Best case** (all pre-generated): < 1 second
- **Typical case** (email pre-generated): 1-2 seconds
- **Worst case** (fallback generation): 4-6 seconds

### Metrics to Track
- `generation_time_ms` - Time from button click to completion
- `pre_generation_hit_rate` - % of cases using pre-generated content
- `ai_call_count` - Number of AI calls per scheduling operation
- `user_wait_time_p50/p95/p99` - Percentile latencies

---

## Database Tables Impacted

### New Tables
```sql
-- Pre-generated email content cache
email_content_generated

-- Generation progress tracking (for UI)
case_generation_progress

-- Background job queue (if using Option B)
pre_generation_queue
```

### Modified Tables
```sql
-- Add indexes for pre-generation queries
CREATE INDEX idx_cases_completed_no_summary
ON cases(status, created_at)
WHERE status = 'completed';

-- Add partial index for pre-generated email content
CREATE INDEX idx_email_content_valid
ON email_content_generated(case_id, created_at)
WHERE invalidated_at IS NULL;
```

---

## Risk Assessment

### Low Risk
- Adding `email_content_generated` table (new, non-breaking)
- Background job for backfilling (isolated, can be disabled)
- UI progress indicators (client-side only)

### Medium Risk
- Changing `approve.ts` logic (well-tested, but critical path)
- Invalidation logic (must handle edge cases: concurrent updates, branding changes)

### Mitigation Strategies
- Feature flag for pre-generated email content
- Fallback to on-demand generation if pre-gen fails
- Comprehensive logging and monitoring
- Gradual rollout (10% → 50% → 100%)

---

## Alternative Approaches Considered

### Approach 1: Full Orchestrator Integration
**Pros**: Unified workflow, dependency management, parallel execution
**Cons**: Requires major refactor of outbound UI, loses fine-grained control
**Decision**: Rejected - too much churn for marginal benefit

### Approach 2: Client-Side Streaming
**Pros**: Shows real-time progress, feels faster
**Cons**: Still slow, adds complexity (websockets/SSE), doesn't solve root cause
**Decision**: Rejected - use for progress UI, not core optimization

### Approach 3: Aggressive Caching
**Pros**: Fast lookups, simple implementation
**Cons**: Cache invalidation complexity, stale data risk
**Decision**: Partial adoption - use for email content only (invalidation is clear)

---

## Conclusion

The outbound discharge pipeline has **excellent infrastructure** for pre-generation (entity extraction, discharge summaries, call intelligence), but **not all cases benefit** from it:

1. **IDEXX cases** get pre-generation during ingestion (fast path)
2. **Non-IDEXX cases** and **missed pre-generation** fall back to on-demand generation (slow path)
3. **Email content** is NEVER pre-generated (always slow)

**Key Recommendations**:
1. **Phase 1** (Quick Win): Pre-generate email content alongside summaries
2. **Phase 2** (Coverage): Background job to ensure 100% pre-generation
3. **Phase 3** (Polish): UI indicators for ready-to-send cases
4. **Phase 4** (Scale): Batch "Prepare All" operation for bulk workflows

**Expected Impact**:
- 60-80% of cases become instant-send (< 1 second)
- Remaining 20-40% reduce from 10-25s to 4-6s
- Improved user experience with progress indicators
- Better visibility into generation pipeline health

---

## Appendix: Key Files Reference

### Services
- `libs/services-cases/src/lib/cases-service.ts` - Core case ingestion and scheduling
- `libs/services-discharge/src/lib/discharge-orchestrator.ts` - Workflow orchestration
- `libs/services-discharge/src/lib/email-content-generator.ts` - Email template rendering
- `libs/services-discharge/src/lib/call-executor.ts` - Call execution logic
- `libs/services-discharge/src/lib/email-executor.ts` - Email execution logic

### AI Generation
- `libs/ai/src/normalize-scribe.ts` - Entity extraction
- `libs/ai/src/generate-structured-discharge.ts` - Discharge summary generation
- `libs/ai/src/generate-assessment-questions.ts` - Call intelligence generation

### API Routes
- `apps/web/src/server/api/routers/outbound/procedures/approve.ts` - Main scheduling logic
- `apps/web/src/server/api/routers/outbound/procedures/batch-schedule.ts` - Bulk operations

### UI Components
- `apps/web/src/components/dashboard/outbound/outbound-discharges-client.tsx` - Main outbound UI
- `apps/web/src/components/dashboard/outbound/hooks/use-outbound-mutations.ts` - Scheduling mutations

### Email Templates
- `libs/email/src/discharge-email-template.tsx` - HTML email template
- `libs/email/src/index.ts` - HTML to plaintext converter

### VAPI Integration
- `libs/vapi/src/extract-variables.ts` - Variable extraction from entities
- `libs/vapi/src/knowledge-base/index.ts` - Dynamic variable builder
- `libs/vapi/src/utils.ts` - Variable normalization utilities

---

**Document Version**: 1.0
**Last Updated**: 2025-12-22
**Next Review**: After Phase 1 implementation

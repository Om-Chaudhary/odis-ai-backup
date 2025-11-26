# VAPI Dynamic Variables - Usage Analysis

## Overview

This document analyzes the variables in your `scheduled_discharge_calls.dynamic_variables` field and explains:

1. **Which variables are used** in the VAPI system prompt
2. **Which variables are generated but NOT used** (available for future use)
3. **Where each variable originates** (extraction source)

---

## Variables Used in VAPI System Prompt v3.0

These variables are **actively referenced** in `VAPI_SYSTEM_PROMPT.txt` and will be spoken by the AI assistant:

### Core Variables (Always Used)

| Variable           | Used In Prompt? | Where Referenced          | Origin                                     |
| ------------------ | --------------- | ------------------------- | ------------------------------------------ |
| `agent_name`       | ✅ YES          | Phase 1, Identity         | `buildDynamicVariables()`                  |
| `clinic_name`      | ✅ YES          | Phase 1, Identity         | `buildDynamicVariables()`                  |
| `owner_name`       | ✅ YES          | Phase 1, Throughout       | Database (patients table) or AI extraction |
| `pet_name`         | ✅ YES          | Throughout entire call    | Database (patients table) or AI extraction |
| `appointment_date` | ✅ YES          | Phase 1, Voicemail        | `buildDynamicVariables()`                  |
| `call_type`        | ✅ YES          | Identity section          | `buildDynamicVariables()`                  |
| `clinic_phone`     | ✅ YES          | Phase 3, Phase 6, Closing | User settings                              |
| `emergency_phone`  | ✅ YES          | Phase 6, Closing          | User settings                              |

### Clinical Variables (Conditionally Used)

| Variable                 | Used In Prompt? | Where Referenced                         | Origin                                                     |
| ------------------------ | --------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `patient_species`        | ✅ YES          | Phase 5 (species-specific warning signs) | Database (patients table) or AI extraction                 |
| `primary_diagnosis`      | ✅ YES          | Phase 2 (appointment brief)              | AI extraction (first diagnosis)                            |
| `visit_reason`           | ✅ YES          | Phase 2 (fallback if no diagnosis)       | AI extraction                                              |
| `medication_names`       | ✅ YES          | Phase 4 (medication check)               | AI extraction                                              |
| `medication_frequency`   | ✅ YES          | Phase 4 (medication reminder)            | AI extraction (NEW)                                        |
| `procedures`             | ✅ YES          | Phase 4 (post-procedure check)           | AI extraction                                              |
| `treatments`             | ✅ YES          | Phase 4 (treatment follow-up)            | AI extraction                                              |
| `follow_up_instructions` | ✅ YES          | Phase 4 (care instructions)              | Database (soap_notes/discharge_summaries) or AI extraction |
| `recheck_date`           | ✅ YES          | Phase 7 (closing)                        | AI extraction                                              |
| `vet_name`               | ✅ YES          | Phase 2 (if available)                   | User settings or manual input                              |
| `condition`              | ✅ YES          | Follow-up calls only                     | Manual input                                               |

**Total Variables Used in Prompt**: **19 variables**

---

## Variables Generated But NOT Directly Used in Prompt

These variables are **stored in the database** but are **not directly referenced** in the current VAPI system prompt. They're available for:

- Future prompt enhancements
- Analytics and reporting
- Call quality monitoring
- Debugging and troubleshooting

### AI-Extracted Variables (NOT used in prompt)

| Variable                 | Origin                                 | Potential Future Use                                    |
| ------------------------ | -------------------------------------- | ------------------------------------------------------- |
| `patient_age`            | AI extraction                          | Age-specific guidance (puppy/senior care)               |
| `patient_sex`            | Database or AI extraction              | Sex-specific conditions (e.g., male cat urinary issues) |
| `patient_breed`          | Database or AI extraction              | Breed-specific health considerations                    |
| `patient_weight`         | Database or AI extraction              | Weight-based medication dosing guidance                 |
| `diagnoses`              | AI extraction (all diagnoses)          | Currently using `primary_diagnosis` only                |
| `differential_diagnoses` | AI extraction                          | Alternative diagnosis discussion                        |
| `prognosis`              | AI extraction                          | Prognosis-based expectations                            |
| `clinical_notes`         | AI extraction                          | Context for complex cases                               |
| `chief_complaint`        | AI extraction                          | Initial presenting problem                              |
| `presenting_symptoms`    | AI extraction                          | Symptom tracking                                        |
| `physical_exam_findings` | AI extraction                          | Follow-up on specific findings                          |
| `vital_temperature`      | AI extraction                          | Vital signs monitoring                                  |
| `vital_heart_rate`       | AI extraction                          | Vital signs monitoring                                  |
| `vital_respiratory_rate` | AI extraction                          | Vital signs monitoring                                  |
| `vital_weight`           | AI extraction                          | Weight monitoring                                       |
| `follow_up_date`         | AI extraction                          | Alternative to `recheck_date`                           |
| `medications`            | AI extraction (full medication string) | Currently using `medication_names` instead              |
| `medications_detailed`   | AI extraction (formatted for speech)   | Alternative to `medication_names`                       |

### Knowledge Base Variables (NOT used in prompt v3.0)

These are generated by `buildDynamicVariables()` from the knowledge base system:

| Variable                             | Origin                              | Potential Future Use        |
| ------------------------------------ | ----------------------------------- | --------------------------- |
| `assessment_questions`               | Knowledge base (condition-specific) | Structured assessment flow  |
| `urgent_criteria`                    | Knowledge base                      | Alternative warning signs   |
| `emergency_criteria`                 | Knowledge base                      | Alternative emergency signs |
| `warning_signs_to_monitor`           | Knowledge base                      | Alternative warning signs   |
| `normal_post_treatment_expectations` | Knowledge base                      | Setting expectations        |
| `condition_category`                 | Knowledge base inference            | Condition-specific routing  |

### Metadata Variables (NOT used in prompt)

| Variable                | Origin        | Purpose                     |
| ----------------------- | ------------- | --------------------------- |
| `case_type`             | AI extraction | Internal categorization     |
| `extraction_confidence` | AI extraction | Quality monitoring          |
| `owner_name_extracted`  | AI extraction | Compare with database value |
| `owner_phone_extracted` | AI extraction | Compare with database value |
| `owner_email_extracted` | AI extraction | Compare with database value |

**Total Variables NOT Used**: **31+ variables**

---

## Variable Origins - Complete Breakdown

### 1. Database Enrichment (`src/lib/services/cases-service.ts`)

**Source**: `patients` table, `soap_notes` table, `discharge_summaries` table

```typescript
// Phase 1a: Patient Data Enrichment
if (patient) {
  if (patient.species) entities.patient.species = patient.species;
  if (patient.breed) entities.patient.breed = patient.breed;
  if (patient.sex) entities.patient.sex = patient.sex;
  if (patient.weight_kg) entities.patient.weight = `${patient.weight_kg} kg`;
  if (patient.owner_name) entities.patient.owner.name = patient.owner_name;
  if (patient.owner_phone) entities.patient.owner.phone = patient.owner_phone;
  if (patient.owner_email) entities.patient.owner.email = patient.owner_email;
}

// Phase 1b: Client Instructions Enrichment
// Priority 1: soap_notes.client_instructions
// Priority 2: soap_notes.plan
// Priority 3: discharge_summaries.content
```

**Variables from Database**:

- `patient_species`
- `patient_breed`
- `patient_sex`
- `patient_weight`
- `owner_name`
- `owner_phone_extracted` (from patients table)
- `owner_email_extracted` (from patients table)
- `follow_up_instructions` (from soap_notes or discharge_summaries)

**Priority**: Database values **override** AI-extracted values

### 2. AI Extraction (`src/lib/vapi/extract-variables.ts`)

**Source**: `extractVapiVariablesFromEntities(entities)`

This function transforms normalized entities from AI extraction into VAPI variables:

```typescript
// Patient information
if (patient.name) variables.patient_name = patient.name;
if (patient.species) variables.patient_species = patient.species;
if (patient.breed) variables.patient_breed = patient.breed;
if (patient.age) variables.patient_age = patient.age;
if (patient.sex) variables.patient_sex = patient.sex;
if (patient.weight) variables.patient_weight = patient.weight;

// Clinical information
if (clinical.diagnoses?.length > 0) {
  variables.diagnoses = clinical.diagnoses.join(", ");
  variables.primary_diagnosis = clinical.diagnoses[0];
}

// Medications
if (clinical.medications?.length > 0) {
  variables.medications_detailed = /* formatted for speech */;
  variables.medication_names = medications.map(m => m.name).join(", ");
  variables.medication_frequency = medications[0].frequency; // NEW
}

// Treatments and procedures
if (clinical.treatments) variables.treatments = clinical.treatments.join(", ");
if (clinical.procedures) variables.procedures = clinical.procedures.join(", ");
```

**All AI-Extracted Variables**: ~40 variables (see full list in VAPI_AI_EXTRACTION_VARIABLES.md)

### 3. Knowledge Base System (`src/lib/vapi/knowledge-base/index.ts`)

**Source**: `buildDynamicVariables({ baseVariables, ... })`

This function:

1. Takes base variables (clinic info, patient info, clinical data)
2. Determines condition category (gastrointestinal, respiratory, dental, etc.)
3. Loads condition-specific knowledge base
4. Merges knowledge base data with base variables

```typescript
const result = buildDynamicVariables({
  baseVariables: {
    clinicName: "Del Valle Pet Hospital",
    agentName: "Kiran",
    petName: "Peanut",
    ownerName: "unknown",
    appointmentDate: "today",
    callType: "discharge",
    clinicPhone: "+19258958479",
    emergencyPhone: "+19258958479",
    dischargeSummary: "...",
    medications: "...",
    nextSteps: "...",
    petSpecies: "dog",
    petAge: 10,
    petWeight: undefined,
  },
  strict: false,
  useDefaults: true,
});
```

**Variables from Knowledge Base**:

- `condition_category` (inferred from diagnosis/condition)
- `assessment_questions` (condition-specific questions)
- `urgent_criteria` (condition-specific urgent signs)
- `emergency_criteria` (condition-specific emergency signs)
- `warning_signs_to_monitor` (condition-specific warnings)
- `normal_post_treatment_expectations` (what's normal for this condition)

### 4. User Settings (from `users` table)

**Source**: Database query in `scheduleDischargeCall()`

```typescript
const { data: userSettings } = await supabase
  .from("users")
  .select("clinic_name, clinic_phone, emergency_phone, vet_name")
  .eq("id", userId)
  .single();
```

**Variables from User Settings**:

- `clinic_name`
- `clinic_phone`
- `emergency_phone`
- `vet_name` (if configured)

### 5. Manual Input (call scheduling)

**Source**: Options passed to `scheduleDischargeCall()`

```typescript
const scheduledCall = await CasesService.scheduleDischargeCall(
  supabase,
  userId,
  caseId,
  {
    scheduledAt: new Date(),
    clinicName: "Del Valle Pet Hospital", // Override
    agentName: "Kiran", // Override
    appointmentDate: "today",
    // ... other overrides
  },
);
```

**Variables from Manual Input**:

- `agent_name` (can be overridden)
- `appointment_date` (formatted date)
- Any custom overrides provided

---

## Variable Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      VARIABLE SOURCES                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │                                         │
        │  1. Database Enrichment                 │
        │     └─ patients table                   │
        │     └─ soap_notes table                 │
        │     └─ discharge_summaries table        │
        │        (HIGHEST PRIORITY)                │
        │                                         │
        └─────────────────┬───────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │                                         │
        │  2. AI Extraction                       │
        │     └─ extractVapiVariablesFromEntities()│
        │     └─ ~40 clinical variables           │
        │        (MEDIUM PRIORITY)                 │
        │                                         │
        └─────────────────┬───────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │                                         │
        │  3. Knowledge Base                      │
        │     └─ buildDynamicVariables()          │
        │     └─ Condition-specific questions     │
        │     └─ Warning signs                    │
        │        (AUTO-GENERATED)                  │
        │                                         │
        └─────────────────┬───────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │                                         │
        │  4. User Settings                       │
        │     └─ Clinic info                      │
        │     └─ Phone numbers                    │
        │        (MANUAL CONFIGURATION)            │
        │                                         │
        └─────────────────┬───────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │                                         │
        │  5. Merge & Normalize                   │
        │     └─ Database overrides AI            │
        │     └─ All variables → snake_case       │
        │     └─ Store in dynamic_variables       │
        │                                         │
        └─────────────────┬───────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │                                         │
        │  VAPI System Prompt                     │
        │     └─ Uses ~19 variables               │
        │     └─ Ignores ~31 variables            │
        │        (stored for future use)          │
        │                                         │
        └─────────────────────────────────────────┘
```

---

## Example: Tracing "Peanut" Variables

Let's trace how variables are populated for your first example (Peanut, the 10-year-old dog):

### Variables Actually Used in Call

```json
{
  "agent_name": "Kiran", // Manual input (scheduleDischargeCall option)
  "clinic_name": "Del Valle Pet Hospital", // User settings
  "owner_name": "unknown", // AI extraction (failed to extract)
  "pet_name": "Peanut", // Database (patients.name) OR AI extraction
  "appointment_date": "today", // Manual input (formatted date)
  "call_type": "discharge", // buildDynamicVariables default
  "clinic_phone": "+19258958479", // User settings (users.clinic_phone)
  "emergency_phone": "+19258958479", // User settings (users.emergency_phone)

  "patient_species": "dog", // Database (patients.species) overriding AI
  "primary_diagnosis": "Periodontal disease", // AI extraction (first from diagnoses array)
  "visit_reason": "Respiratory distress...", // AI extraction (fallback)
  "medication_names": null, // Not prescribed (no medications)
  "medication_frequency": null, // Not applicable
  "procedures": "Blood work...", // AI extraction (procedures performed)
  "treatments": "Nail trimming", // AI extraction (treatments performed)
  "follow_up_instructions": "If blood work...", // Database (soap_notes) OR AI
  "recheck_date": null, // AI extraction (not specified)
  "vet_name": null, // User settings (not configured)
  "condition": null // Not applicable for discharge calls
}
```

### Variables Stored But Not Used

```json
{
  "patient_age": "approximately 10 years",  // AI extraction
  "patient_sex": "male",                    // Database or AI
  "patient_breed": "unknown",               // Database or AI
  "diagnoses": "Periodontal disease, Stifle...", // AI (all diagnoses)
  "prognosis": "unknown",                   // AI extraction
  "assessment_questions": [...],            // Knowledge base (general category)
  "urgent_criteria": [...],                 // Knowledge base
  "emergency_criteria": [...],              // Knowledge base
  "warning_signs_to_monitor": [...],        // Knowledge base
  // ... 20+ more variables
}
```

---

## Call Flow: How Variables Are Spoken

### Phase 1: Introduction

```
"Hi {owner_name}, this is {agent_name} calling from {clinic_name} about {pet_name}'s
recent appointment. Do you have a couple of minutes?"
```

**Example**: "Hi unknown, this is Kiran calling from Del Valle Pet Hospital about Peanut's recent appointment."

### Phase 2: Brief

```
"{pet_name} came in for {primary_diagnosis}, and the veterinarian was able to take care of everything."
```

**Example**: "Peanut came in for Periodontal disease, and the veterinarian was able to take care of everything."

### Phase 4: Dynamic Instructions

```
"{pet_name} had {procedures} done. How's the area looking?"
```

**Example**: "Peanut had Blood work done. How's the area looking?"

```
"We also did {treatments} during the visit."
```

**Example**: "We also did Nail trimming during the visit."

### Phase 5: Warning Signs

```
"If {pet_name} shows any of these, please call us right away:
- Excessive vomiting or not eating for more than a day
- Unusual lethargy or weakness
- Difficulty breathing"
```

**Note**: Dog-specific because `patient_species` = "dog"

---

## Optimization Opportunities

### Currently Over-Generated

These variables are generated but **never used**:

- `assessment_questions` (complex array) - could be removed or simplified
- `normal_post_treatment_expectations` - not referenced in prompt
- `vital_*` fields (temperature, heart rate, etc.) - not referenced
- `differential_diagnoses` - not referenced
- Most metadata fields

**Recommendation**: Consider removing unused variables from generation to reduce database storage and improve performance.

### Missing but Potentially Useful

These variables would be useful but aren't generated:

- `medication_duration` - "for 7 days" for medication reminders
- `medication_administration_tips` - Breed/species-specific tips
- `next_appointment_date` - Different from recheck_date

---

## Summary

| Category                 | Count  | Used in Prompt | Not Used |
| ------------------------ | ------ | -------------- | -------- |
| **Core Variables**       | 8      | 8              | 0        |
| **Clinical Variables**   | 11     | 11             | 0        |
| **AI-Extracted (extra)** | 18     | 0              | 18       |
| **Knowledge Base**       | 6      | 0              | 6        |
| **Metadata**             | 7      | 0              | 7        |
| **TOTAL**                | **50** | **19**         | **31**   |

**Key Insights**:

1. **~38% of variables are actively used** in the VAPI prompt
2. **~62% are stored but not used** (available for future enhancements)
3. **Database enrichment is working** (patient data overrides AI extraction)
4. **Knowledge base integration is complete** (but not yet used in prompt v3.0)
5. **System is ready for advanced features** (assessment questions, condition-specific routing, etc.)

---

**Last Updated**: 2025-11-26  
**Prompt Version**: v3.0  
**System**: VAPI with database enrichment

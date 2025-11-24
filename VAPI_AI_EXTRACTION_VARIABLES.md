# VAPI AI Extraction Variables - Documentation

This document describes the additional dynamic variables available from AI entity extraction that can be used in VAPI assistant prompts.

## Overview

When a case has been processed through AI entity extraction, the system automatically enriches VAPI calls with structured clinical data extracted from SOAP notes, transcripts, or other clinical text.

These variables are **automatically extracted** and merged into the call's dynamic variables. Manual variables always take precedence.

## Variable Categories

### Patient Demographics

Extracted from the patient section of the clinical record:

- `{{patient_name}}` - Patient's name (e.g., "Max", "Fluffy")
- `{{patient_species}}` - Species (dog, cat, bird, rabbit, other, unknown)
- `{{patient_breed}}` - Breed if specified
- `{{patient_age}}` - Age in human-readable format (e.g., "3 years", "6 months")
- `{{patient_sex}}` - Sex (male, female, unknown)
- `{{patient_weight}}` - Weight with units (e.g., "15 kg", "30 lbs")

### Owner Information (Extracted)

- `{{owner_name_extracted}}` - Owner name from extraction
- `{{owner_phone_extracted}}` - Owner phone from extraction
- `{{owner_email_extracted}}` - Owner email from extraction

> **Note:** These are suffixed with `_extracted` to avoid conflicts with manually-provided values. Manual values (without suffix) take precedence.

### Clinical Summary

- `{{chief_complaint}}` - Main reason for visit
- `{{visit_reason}}` - Why they brought the pet in
- `{{presenting_symptoms}}` - Comma-separated list of symptoms
- `{{case_type}}` - Type of case (checkup, emergency, surgery, follow_up, dental, vaccination, diagnostic, consultation, other)

### Physical Exam & Vitals

- `{{vital_temperature}}` - Temperature reading
- `{{vital_heart_rate}}` - Heart rate (bpm)
- `{{vital_respiratory_rate}}` - Respiratory rate
- `{{vital_weight}}` - Weight from vitals
- `{{physical_exam_findings}}` - Comma-separated findings

### Diagnoses

- `{{diagnoses}}` - All diagnoses, comma-separated
- `{{primary_diagnosis}}` - The first/primary diagnosis
- `{{differential_diagnoses}}` - Differential diagnoses considered

### Medications (Structured)

- `{{medications_detailed}}` - Full medication details formatted for natural speech
  - Example: "Carprofen 75 milligrams twice daily by mouth for 7 days; Cephalexin 500 milligrams three times daily by mouth for 10 days"
- `{{medication_names}}` - Simple comma-separated list of medication names
  - Example: "Carprofen, Cephalexin"
- `{{medications_speech}}` - Formatted with "and" for last item, optimized for voice
  - Example: "Carprofen 75 milligrams twice daily by mouth for 7 days, and Cephalexin 500 milligrams three times daily by mouth for 10 days"

> **Usage Tip:** Use `{{medications_speech}}` in voice prompts for the most natural-sounding medication lists.

### Treatments & Procedures

- `{{treatments}}` - Treatments administered (comma-separated)
- `{{procedures}}` - Procedures performed (comma-separated)
- `{{lab_results}}` - Lab results summary (semicolon-separated)
- `{{imaging_results}}` - Imaging results summary (semicolon-separated)

### Follow-Up Information

- `{{follow_up_instructions}}` - Follow-up care instructions
- `{{follow_up_date}}` - When to follow up
- `{{recheck_required}}` - "yes" or "no"
- `{{clinical_notes}}` - Additional clinical notes
- `{{prognosis}}` - Prognosis assessment

### Metadata

- `{{extraction_confidence}}` - Overall confidence score (0.00-1.00)

## Usage in Prompts

### Example: Enhanced Opening

Instead of:
```
"Hi {{owner_name}}, this is {{agent_name}} from {{clinic_name}}. I'm following up on {{pet_name}}'s recent appointment."
```

You can use:
```
"Hi {{owner_name}}, this is {{agent_name}} from {{clinic_name}}. I'm following up on {{patient_name}}'s recent {{case_type}} appointment on {{appointment_date}}."
```

### Example: Medication Discussion

Instead of:
```
"How's it going with giving {{pet_name}} the medication?"
```

You can use:
```
"How's it going with giving {{patient_name}} the {{medication_names}}?"
```

Or more detailed:
```
"Just to confirm, {{patient_name}} should be taking {{medications_speech}}. How's that going?"
```

### Example: Diagnosis-Specific Follow-Up

```
{{#if primary_diagnosis}}
"I'm checking in specifically about {{patient_name}}'s {{primary_diagnosis}}. How has {{patient_name}} been doing with that?"
{{else}}
"How has {{patient_name}} been doing since the visit?"
{{/if}}
```

### Example: Species-Specific Language

```
{{#if patient_species}}
  {{#if patient_species == "dog"}}
    "Has {{patient_name}} been eating and drinking normally?"
  {{else if patient_species == "cat"}}
    "Has {{patient_name}} been using the litter box normally?"
  {{/if}}
{{/if}}
```

## Variable Precedence

Variables are merged in this order (later takes precedence):

1. **AI Extracted Variables** (automatic from entity extraction)
2. **Base Variables** (pet_name, owner_name, clinic info, etc.)
3. **Manual Overrides** (explicitly provided in API call)

This means if you pass `medications: "Custom instructions"` in the API call, it will override `medications_detailed` from extraction.

## Best Practices

1. **Fallback Gracefully:** Always provide defaults for optional extracted variables
   ```
   {{medications_speech || "the prescribed medications"}}
   ```

2. **Use Speech-Optimized Variables:** For voice calls, prefer:
   - `medications_speech` over `medications_detailed`
   - `patient_name` over `pet_name` (more formal)

3. **Conditional Content:** Use conditionals to only mention extracted data when available
   ```
   {{#if primary_diagnosis}}
   "I see we treated {{patient_name}} for {{primary_diagnosis}}."
   {{/if}}
   ```

4. **Combine with Manual Variables:** Extracted variables complement manual ones
   ```
   "{{patient_name}}'s {{primary_diagnosis}} treatment included {{discharge_summary_content}}."
   ```

5. **Species-Aware Language:** Tailor language based on species
   ```
   {{#if patient_species == "cat"}}purring{{else}}tail wagging{{/if}}
   ```

## Example Enhanced Prompt Section

```
### Enhanced Recap with Extracted Data

"Just to recap, {{patient_name}} came in on {{appointment_date}} for {{visit_reason || "a checkup"}}.

{{#if primary_diagnosis}}
We diagnosed {{primary_diagnosis}}{{#if treatments}} and provided {{treatments}}{{/if}}.
{{/if}}

{{#if medications_speech}}
{{patient_name}} was prescribed {{medications_speech}}.
{{/if}}

{{#if follow_up_instructions}}
{{follow_up_instructions}}
{{/if}}

{{#if recheck_required == "yes"}}
We'd like to see {{patient_name}} back{{#if follow_up_date}} on {{follow_up_date}}{{/if}} for a recheck.
{{/if}}
"
```

## Debugging

To debug what variables are available for a call, check the `dynamic_variables` field in the `scheduled_discharge_calls` table:

```sql
SELECT id, dynamic_variables
FROM scheduled_discharge_calls
WHERE id = 'your-call-id';
```

All extracted variables will be present in the JSON with their respective values.

## Related Files

- `src/lib/vapi/extract-variables.ts` - Extraction logic
- `src/app/api/generate/discharge-summary/route.ts` - Integration example
- `VAPI_PRODUCTION_PROMPT.txt` - Current production prompt
- `VAPI_ENHANCED_PROMPT.txt` - Enhanced prompt with AI variables

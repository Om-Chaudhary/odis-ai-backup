# VAPI AI Extraction Integration - Summary

## Overview

This document summarizes the changes made to integrate AI entity extraction data into VAPI discharge calls, rename the database table to follow conventions, and fix variable replacement issues.

## Changes Made

### 1. Database Table Renamed ✅

**Migration:** `supabase/migrations/20251116000000_rename_vapi_calls_to_scheduled_discharge_calls.sql`

- Renamed `vapi_calls` → `scheduled_discharge_calls`
- Added `case_id` column to link calls to cases
- Added `qstash_message_id` column for tracking
- Updated indexes, RLS policies, and constraints
- Added comprehensive column documentation

**Code Updates:**
- `src/app/api/calls/schedule/route.ts`
- `src/app/api/webhooks/vapi/route.ts`
- `src/app/api/webhooks/execute-call/route.ts`
- `src/lib/vapi/call-manager.ts`
- `src/app/api/vapi/schedule/route.ts`

### 2. AI Extraction Variables Integration ✅

**New File:** `src/lib/vapi/extract-variables.ts`

Created helper functions to extract VAPI dynamic variables from AI entity extraction data:

**Functions:**
- `extractVapiVariablesFromEntities()` - Extracts 40+ variables from NormalizedEntities
- `formatMedicationsForSpeech()` - Formats medications for natural voice output
- `mergeVapiVariables()` - Merges extracted and manual variables

**Available Variables:**
- Patient demographics: `patient_name`, `patient_species`, `patient_breed`, `patient_age`, `patient_sex`, `patient_weight`
- Owner info: `owner_name_extracted`, `owner_phone_extracted`, `owner_email_extracted`
- Clinical: `chief_complaint`, `visit_reason`, `presenting_symptoms`, `diagnoses`, `primary_diagnosis`
- Medications: `medications_detailed`, `medication_names`, `medications_speech`
- Vitals: `vital_temperature`, `vital_heart_rate`, `vital_respiratory_rate`
- Follow-up: `follow_up_instructions`, `follow_up_date`, `recheck_required`
- Plus 30+ more clinical variables

### 3. Discharge Summary Route Enhanced ✅

**File:** `src/app/api/generate/discharge-summary/route.ts`

**Changes:**
1. **Query normalized_data table** - Checks for most recent AI extraction record
2. **Fallback hierarchy** for entity extraction:
   - `normalized_data` table (most recent structured extraction)
   - Case `metadata.entities` (embedded in case)
   - None (SOAP notes only)

3. **Patient name extraction** with multiple fallbacks:
   - AI extraction (`patient_name`)
   - Database patient record
   - Parsed from discharge summary text ("DISCHARGE INSTRUCTIONS FOR TYSON")
   - Default ("your pet")

4. **Variable merging**:
   - AI-extracted variables automatically included
   - Medications formatted for natural speech
   - Manual variables take precedence

5. **Logging** for debugging:
   ```javascript
   console.log("[GENERATE_SUMMARY] Using patient data", {
     petName: finalPetName,
     ownerName: finalOwnerName,
     vetName: finalVetName,
     parsedFromSummary: parsedPetName,
     extractedVars: Object.keys(extractedVars).length,
     source: "AI extraction" | "database" | "parsed from summary" | "default"
   });
   ```

### 4. VAPI Prompt Updates ✅

**File:** `VAPI_PRODUCTION_PROMPT.txt`

**Changes:**
1. **Conditional variable blocks** - Variables only appear if they exist:
   ```handlebars
   {{#if next_steps}}
   ### Next Steps
   {{next_steps}}
   {{/if}}
   ```

2. **Fixed literal variable names** appearing in output:
   - `{{condition}}` - Now conditional
   - `{{medications}}` - Now conditional
   - `{{next_steps}}` - Now conditional
   - `{{recheck_date}}` - Now conditional

3. **Safety rules updated** - Removed literal variable names from instructions

### 5. Documentation Created ✅

**File:** `VAPI_AI_EXTRACTION_VARIABLES.md`

Complete documentation of:
- All 40+ AI-extracted variables
- Usage examples and best practices
- Variable precedence rules
- Debugging guidance
- Integration patterns

## Variable Precedence

Variables are merged in this order (later takes precedence):

1. **AI Extracted Variables** (automatic from entity extraction)
   - From `normalized_data` table OR case `metadata.entities`
   - Extracted using `extractVapiVariablesFromEntities()`

2. **Parsed Variables** (from discharge summary text)
   - Patient name parsed from "DISCHARGE INSTRUCTIONS FOR {NAME}"

3. **Database Variables** (from patient/case records)
   - `patient.name`, `patient.owner_name`, etc.

4. **Manual Override Variables** (explicitly provided in API call)
   - Highest precedence, overrides all automatic extraction

5. **Default Fallbacks**
   - "your pet", "Pet Owner", etc. (only if all above fail)

## Example Flow

### Before Changes:
```json
{
  "pet_name": "your pet",
  "owner_name": "Pet Owner",
  "vet_name": "",
  "medications": "{{medications}}",  // Literal variable name shown!
  "discharge_summary_content": "DISCHARGE INSTRUCTIONS FOR TYSON..."
}
```

### After Changes:
```json
{
  "pet_name": "Tyson",  // ✅ Extracted from summary
  "owner_name": "John Smith",  // ✅ From AI extraction
  "vet_name": "Dr. Sarah Johnson",  // ✅ From AI extraction
  "patient_species": "dog",  // ✅ From AI extraction
  "primary_diagnosis": "Depression",  // ✅ From AI extraction
  "medications_speech": "Carprofen 75 milligrams twice daily by mouth for 7 days, and Cephalexin 500 milligrams three times daily by mouth for 10 days",  // ✅ Formatted for voice
  "discharge_summary_content": "DISCHARGE INSTRUCTIONS FOR TYSON..."
}
```

## Testing

To test the integration:

1. **Create a case** with AI entity extraction
2. **Generate discharge summary** via API:
   ```bash
   POST /api/generate/discharge-summary
   {
     "caseId": "uuid",
     "ownerPhone": "+15555551234",
     "vapiScheduledFor": "2025-01-20T10:00:00Z"
   }
   ```

3. **Check logs** for variable extraction:
   - `[GENERATE_SUMMARY] Entity extraction data`
   - `[GENERATE_SUMMARY] Using patient data`
   - `[SCHEDULE_CALL] Dynamic variables prepared`

4. **Verify VAPI call** has correct variables:
   ```sql
   SELECT dynamic_variables
   FROM scheduled_discharge_calls
   WHERE id = 'your-call-id';
   ```

5. **Test prompt** doesn't show literal variable names

## Benefits

1. **Automated Data Extraction** - No manual entry of patient details
2. **Natural Voice Output** - Medications and clinical data formatted for speech
3. **Robust Fallbacks** - Multiple sources ensure data is always available
4. **Clean Prompts** - No more `{{variable_name}}` appearing literally
5. **Consistent Naming** - Table follows same pattern as email system
6. **Comprehensive Logging** - Easy debugging of variable sources

## Migration Steps

1. ✅ Apply migration: `supabase/migrations/20251116000000_rename_vapi_calls_to_scheduled_discharge_calls.sql`
2. ✅ Update TypeScript types: `pnpm update-types`
3. ✅ Deploy code changes
4. ✅ Update VAPI assistant with new prompt
5. Test with real discharge summary generation

## Related Files

- `src/lib/vapi/extract-variables.ts` - Core extraction logic
- `src/app/api/generate/discharge-summary/route.ts` - Integration point
- `VAPI_AI_EXTRACTION_VARIABLES.md` - Full variable documentation
- `VAPI_PRODUCTION_PROMPT.txt` - Updated prompt with conditionals
- Migration file with table rename and new columns

# Enriched Call Flow - End-to-End Testing Guide

## Overview

This guide provides step-by-step instructions for testing the newly enriched VAPI call flow, which includes:

1. ✅ Database-enriched variables (patient data, SOAP notes, discharge summaries)
2. ✅ New conversational call flow (interactive, context-aware)
3. ✅ Medication frequency extraction
4. ✅ Call transfer documentation (requires VAPI dashboard configuration)

---

## Pre-Testing Checklist

Before testing, ensure the following are configured:

### Database Setup

- [ ] Case exists with `patients` record
  - [ ] Patient name, species, breed, sex, weight populated
  - [ ] Owner name, phone, email populated
- [ ] Case has `soap_notes` record
  - [ ] `client_instructions` or `plan` field populated
- [ ] Case has `discharge_summaries` record (optional)
  - [ ] `content` field populated
- [ ] User settings configured
  - [ ] `clinic_phone` populated (E.164 format: `+15551234567`)
  - [ ] `emergency_phone` populated (E.164 format: `+15559998888`)
  - [ ] `test_mode_enabled` = true (for testing)
  - [ ] `test_contact_phone` = your test phone number

### VAPI Configuration

- [ ] VAPI assistant exists (`VAPI_ASSISTANT_ID` in `.env.local`)
- [ ] VAPI phone number configured (`VAPI_PHONE_NUMBER_ID` in `.env.local`)
- [ ] VAPI webhook configured at `/api/webhooks/vapi`
- [ ] Assistant uses updated system prompt (v3.0 from `VAPI_SYSTEM_PROMPT.txt`)

### Code Deployment

- [ ] All changes committed and deployed
- [ ] Environment variables set
- [ ] Database migrations run (if any)

---

## Test Scenarios

### Scenario 1: Basic Enrichment Test

**Objective**: Verify database values override AI-extracted entities

**Setup**:

1. Create a case with minimal AI extraction (missing species, breed, etc.)
2. Populate `patients` table with complete data:
   ```sql
   UPDATE patients
   SET
     species = 'dog',
     breed = 'Golden Retriever',
     sex = 'male',
     weight_kg = 30.5,
     owner_name = 'John Smith',
     owner_phone = '+15551234567'
   WHERE case_id = '<your-case-id>';
   ```

**Execute**:

1. Schedule a discharge call for this case
2. Check logs for enrichment messages:
   ```
   [CasesService] Enriched entities with patient database values
   ```

**Verify**:

- [ ] Variables include enriched data (species, breed, sex, weight)
- [ ] Owner name and phone are correct
- [ ] Database values override AI-extracted values

---

### Scenario 2: Client Instructions Enrichment

**Objective**: Verify SOAP notes client_instructions are used

**Setup**:

1. Create a case with a SOAP note:
   ```sql
   INSERT INTO soap_notes (case_id, client_instructions)
   VALUES ('<your-case-id>', 'Give Carprofen 75mg twice daily with food. Monitor for vomiting. Return in 7 days for recheck.');
   ```

**Execute**:

1. Schedule a discharge call for this case
2. Check logs for:
   ```
   [CasesService] Using client instructions from SOAP notes
   ```

**Verify**:

- [ ] `follow_up_instructions` variable contains SOAP note instructions
- [ ] Instructions are used in call (Phase 4: Care Instructions)

---

### Scenario 3: Fallback to Discharge Summary

**Objective**: Verify fallback to discharge_summaries.content when no SOAP notes exist

**Setup**:

1. Create a case with NO SOAP notes
2. Create a discharge summary:
   ```sql
   INSERT INTO discharge_summaries (case_id, content)
   VALUES ('<your-case-id>', 'Patient discharged in good condition. Continue medications as prescribed.');
   ```

**Execute**:

1. Schedule a discharge call for this case
2. Check logs for:
   ```
   [CasesService] Using discharge summary content
   ```

**Verify**:

- [ ] `follow_up_instructions` variable contains discharge summary content
- [ ] Fallback works correctly when SOAP notes are absent

---

### Scenario 4: New Conversational Flow - Introduction

**Objective**: Test Phase 1 (Introduction) of the new flow

**Setup**:

1. Schedule a test call with valid data
2. Have test phone ready to answer

**Execute**:

1. Answer the call
2. Listen to introduction

**Verify**:

- [ ] Introduction is brief (10-15 seconds)
- [ ] Assistant asks: "Do you have a couple of minutes?"
- [ ] If you say "no", call ends gracefully
- [ ] If you say "yes", call continues to Phase 2

---

### Scenario 5: New Conversational Flow - Medication Check

**Objective**: Test Phase 4 (Medication Check) with interactive questions

**Setup**:

1. Create a case with medications:
   ```sql
   -- In case metadata → entities → clinical → medications
   {
     "medications": [
       {
         "name": "Carprofen",
         "dosage": "75mg",
         "frequency": "twice daily",
         "route": "oral",
         "duration": "7 days"
       }
     ]
   }
   ```

**Execute**:

1. Answer the test call
2. Progress through to Phase 4

**Verify**:

- [ ] Assistant mentions "Carprofen" by name
- [ ] Assistant asks: "Have you been able to give the medication okay, or is {{pet_name}} being tricky about it?"
- [ ] Assistant mentions frequency: "twice daily"
- [ ] If you report difficulty, assistant offers tips
- [ ] If you say it's going well, assistant confirms and moves on

---

### Scenario 6: New Conversational Flow - Warning Signs

**Objective**: Test Phase 5 (Warning Signs Check) with species-specific guidance

**Setup**:

1. Create a case with `patient_species = "dog"`
2. Schedule test call

**Execute**:

1. Answer the call
2. Progress through to Phase 5

**Verify**:

- [ ] Assistant lists dog-specific warning signs:
  - "Excessive vomiting or not eating for more than a day"
  - "Unusual lethargy or weakness"
  - "Difficulty breathing"
- [ ] Assistant asks: "Is {{pet_name}} showing any of those signs right now?"

**Repeat with `patient_species = "cat"`**:

- [ ] Assistant lists cat-specific warning signs:
  - "Not using the litter box normally"
  - "Hiding more than usual or not eating"
  - "Any difficulty breathing"

---

### Scenario 7: Transfer Protocol - Emergency

**Objective**: Test Phase 6 (Transfer Protocol) for emergency situations

**Setup**:

1. Schedule test call
2. Prepare to report emergency symptoms

**Execute**:

1. Answer the call
2. When asked "Is {{pet_name}} showing any of those signs right now?", say:
   - "Yes, he's having trouble breathing"

**Verify Without Transfer Configured**:

- [ ] Assistant identifies this as emergency
- [ ] Assistant provides `emergency_phone` number verbally (with spaces)
- [ ] Assistant strongly encourages immediate action
- [ ] Assistant ends call

**Verify With Transfer Configured** (requires VAPI dashboard setup):

- [ ] Assistant offers to transfer directly
- [ ] If you accept, transfer executes seamlessly
- [ ] You're connected to emergency line

---

### Scenario 8: Transfer Protocol - Urgent

**Objective**: Test Phase 6 (Transfer Protocol) for urgent (non-emergency) situations

**Setup**:

1. Schedule test call
2. Prepare to report urgent symptoms

**Execute**:

1. Answer the call
2. When asked about symptoms, say:
   - "She's been vomiting all morning and won't eat"

**Verify Without Transfer Configured**:

- [ ] Assistant identifies this as urgent (not emergency)
- [ ] Assistant provides `clinic_phone` number
- [ ] Assistant asks you to call "as soon as we hang up"
- [ ] Assistant ends call

**Verify With Transfer Configured** (requires VAPI dashboard setup):

- [ ] Assistant offers to transfer OR provide number
- [ ] If you accept transfer, it executes
- [ ] You're connected to clinic line

---

### Scenario 9: Medication Frequency Extraction

**Objective**: Verify `medication_frequency` variable is extracted and used

**Setup**:

1. Create a case with medications (see Scenario 5)
2. Ensure first medication has `frequency: "twice daily"`

**Execute**:

1. Schedule call
2. Check database:
   ```sql
   SELECT dynamic_variables->'medication_frequency'
   FROM scheduled_discharge_calls
   WHERE id = '<call-id>';
   ```

**Verify**:

- [ ] `medication_frequency` is present in `dynamic_variables`
- [ ] Value matches first medication's frequency ("twice daily")
- [ ] Assistant mentions frequency during medication check

---

### Scenario 10: Variable Format Verification

**Objective**: Verify all variables are in snake_case format

**Setup**:

1. Schedule any test call

**Execute**:

1. Check logs in `/api/webhooks/execute-call`:
   ```
   [EXECUTE_CALL] Normalized variables (ready for VAPI)
   ```

**Verify**:

- [ ] All variables are snake_case (e.g., `pet_name`, `owner_name`)
- [ ] No camelCase variables (e.g., `petName`, `ownerName`)
- [ ] Key variables present:
  - [ ] `pet_name`
  - [ ] `owner_name`
  - [ ] `clinic_name`
  - [ ] `agent_name`
  - [ ] `appointment_date`
  - [ ] `call_type`
  - [ ] `clinic_phone`
  - [ ] `emergency_phone`
  - [ ] `patient_species`
  - [ ] `patient_breed`
  - [ ] `medication_names`
  - [ ] `medication_frequency`
  - [ ] `follow_up_instructions`

---

## Debugging Tips

### Check Database Enrichment Logs

```bash
# In your terminal running the dev server (or production logs)
grep "CasesService.*Enriched" <log-file>
```

Look for:

```
[CasesService] Enriched entities with patient database values
[CasesService] Using client instructions from SOAP notes
[CasesService] Using plan from SOAP notes
[CasesService] Using discharge summary content
[CasesService] Enriched entities with client instructions
```

### Check Variable Normalization Logs

```bash
grep "EXECUTE_CALL.*Normalized variables" <log-file>
```

Verify output shows:

```json
{
  "format": "snake_case (normalized)",
  "variableCount": 25,
  "sampleKeys": ["pet_name", "owner_name", "clinic_name", ...],
  "keyExamples": {
    "pet_name": "Max",
    "owner_name": "John Smith",
    ...
  }
}
```

### Inspect Database

```sql
-- Check patient enrichment data
SELECT
  p.name AS pet_name,
  p.species,
  p.breed,
  p.sex,
  p.weight_kg,
  p.owner_name,
  p.owner_phone
FROM patients p
WHERE p.case_id = '<your-case-id>';

-- Check SOAP notes
SELECT
  client_instructions,
  plan,
  created_at
FROM soap_notes
WHERE case_id = '<your-case-id>'
ORDER BY created_at DESC
LIMIT 1;

-- Check discharge summaries
SELECT
  content,
  created_at
FROM discharge_summaries
WHERE case_id = '<your-case-id>'
ORDER BY created_at DESC
LIMIT 1;

-- Check scheduled call variables
SELECT
  id,
  status,
  dynamic_variables
FROM scheduled_discharge_calls
WHERE case_id = '<your-case-id>'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Common Issues

### Issue: Variables not enriched with database values

**Symptoms**:

- Species/breed/sex still showing AI-extracted values
- Owner info not updated from database

**Solution**:

1. Verify `patients` table has data for this case
2. Check logs for "Enriched entities with patient database values"
3. Ensure `getCaseWithEntities` is fetching patient data:
   ```typescript
   const caseInfo = await CasesService.getCaseWithEntities(supabase, caseId);
   console.log("Patient data:", caseInfo?.patient);
   ```

### Issue: Client instructions not being used

**Symptoms**:

- `follow_up_instructions` variable is empty or generic
- SOAP notes exist but not being read

**Solution**:

1. Verify SOAP notes exist: `SELECT * FROM soap_notes WHERE case_id = '<id>'`
2. Check `client_instructions` or `plan` fields are populated
3. Look for logs: "Using client instructions from SOAP notes"

### Issue: Variables in wrong format (camelCase)

**Symptoms**:

- System prompt shows `{{petName}}` instead of `{{pet_name}}`
- Variables not interpolating in call

**Solution**:

1. Check normalization logs: "[EXECUTE_CALL] Normalized variables"
2. Verify `normalizeVariablesToSnakeCase` is called in execute-call route
3. Ensure all variables passed to VAPI are snake_case

### Issue: New conversational flow not being followed

**Symptoms**:

- Call follows old monologue-style flow
- No interactive questions asked

**Solution**:

1. Verify assistant is using updated system prompt (v3.0)
2. Check VAPI dashboard → Assistant → System Prompt
3. Ensure prompt file is `VAPI_SYSTEM_PROMPT.txt` (v3.0, dated 2025-11-26)
4. Re-deploy assistant if changes were made

---

## Success Criteria

A successful test should demonstrate:

- ✅ **Database Enrichment**:
  - Patient data (species, breed, sex, weight) pulled from `patients` table
  - Owner info (name, phone, email) pulled from `patients` table
  - Client instructions pulled from `soap_notes` or `discharge_summaries`

- ✅ **New Conversational Flow**:
  - Brief introduction with permission check
  - Interactive medication check (if medications present)
  - Species-specific warning signs
  - Appropriate routing for urgent/emergency situations

- ✅ **Variable Extraction**:
  - `medication_frequency` extracted for first medication
  - All variables in snake_case format
  - Critical variables present and correctly formatted

- ✅ **Call Quality**:
  - Natural, conversational tone
  - Dynamic sections based on case data
  - Appropriate pacing (not too fast, not too slow)
  - Clear pronunciation of numbers and medical terms

---

## Next Steps

After successful testing:

1. **Enable Production Mode**:
   - Set `test_mode_enabled = false` in user settings
   - Configure production phone numbers

2. **Configure Call Transfers** (Optional):
   - Follow [CALL_TRANSFER_SETUP.md](./CALL_TRANSFER_SETUP.md)
   - Test transfers with real scenarios

3. **Monitor Initial Calls**:
   - Review transcripts for quality
   - Check for missed scenarios
   - Adjust system prompt as needed

4. **Iterate and Improve**:
   - Collect user feedback
   - Refine conversational flow
   - Add domain-specific knowledge

---

## Support

If you encounter issues during testing:

1. **Check Logs**: Review server logs and VAPI dashboard logs
2. **Review Documentation**:
   - [VAPI_SYSTEM_PROMPT.txt](./prompts/VAPI_SYSTEM_PROMPT.txt)
   - [CALL_TRANSFER_SETUP.md](./CALL_TRANSFER_SETUP.md)
   - [VAPI_DYNAMIC_VARIABLES_COMPLETE.md](./VAPI_DYNAMIC_VARIABLES_COMPLETE.md)
3. **Database Inspection**: Use SQL queries above to verify data
4. **Test Incrementally**: Test one scenario at a time

---

## Testing Checklist Summary

Copy this checklist for your testing session:

- [ ] Pre-testing setup complete (database, VAPI, code deployed)
- [ ] Scenario 1: Basic enrichment (database values)
- [ ] Scenario 2: Client instructions from SOAP notes
- [ ] Scenario 3: Fallback to discharge summary
- [ ] Scenario 4: New flow - Introduction
- [ ] Scenario 5: New flow - Medication check
- [ ] Scenario 6: New flow - Warning signs (dog & cat)
- [ ] Scenario 7: Transfer protocol - Emergency
- [ ] Scenario 8: Transfer protocol - Urgent
- [ ] Scenario 9: Medication frequency extraction
- [ ] Scenario 10: Variable format verification
- [ ] All success criteria met
- [ ] Issues documented and resolved
- [ ] Ready for production deployment

---

**Last Updated**: 2025-11-26  
**Version**: 1.0  
**Compatibility**: VAPI System Prompt v3.0

# VAPI Variable Injection Fix - Implementation Summary

## Problem

VAPI assistant was skipping over variables (e.g., saying "{{pet_name}}" literally instead of "Max") because of a variable naming format mismatch:

1. **Database stored**: snake_case (`pet_name`, `owner_name`)
2. **System prompt expected**: snake_case (`{{pet_name}}`, `{{owner_name}}`)
3. **buildDynamicVariables returned**: camelCase (`petName`, `ownerName`)
4. **Result**: Mixed format sent to VAPI, causing variables to not be injected

## Solution

### 1. Created Variable Normalization Utility

**File**: `src/lib/vapi/utils.ts`

- `camelToSnake()` - Converts camelCase strings to snake_case
- `convertKeysToSnakeCase()` - Converts object keys from camelCase to snake_case
- `normalizeVariablesToSnakeCase()` - Normalizes mixed-format variables to snake_case

### 2. Fixed Execute Call Route

**File**: `src/app/api/webhooks/execute-call/route.ts`

**Changes**:
- Import `normalizeVariablesToSnakeCase` utility
- Normalize all variables to snake_case before sending to VAPI
- Added comprehensive logging to track variable format at each step

**Key Fix**:
```typescript
// Before: Mixed format (snake_case + camelCase)
dynamicVariables = {
  ...dynamicVariables,  // snake_case from DB
  ...freshVars.variables,  // camelCase from buildDynamicVariables
};

// After: Normalized to snake_case
const normalizedVariables = normalizeVariablesToSnakeCase(dynamicVariables);
```

### 3. Enhanced Logging

**Files**: 
- `src/app/api/webhooks/execute-call/route.ts`
- `src/lib/vapi/client.ts`

**Added logging for**:
- Initial variables from database (format: snake_case)
- Fresh variables from buildDynamicVariables (format: camelCase)
- Merged variables (format: mixed)
- Normalized variables (format: snake_case, ready for VAPI)
- Final variables sent to VAPI with sample values

## Verification Checklist

### ✅ Code Changes Complete

- [x] Variable normalization utility created
- [x] Execute-call route updated to normalize variables
- [x] Comprehensive logging added
- [x] No linter errors

### ⚠️ Manual Verification Required

#### 1. Verify VAPI Dashboard Assistant Prompt

**Action**: Check that the VAPI assistant prompt in the dashboard matches the system prompt file.

**Location**: VAPI Dashboard → Assistants → [Your Assistant] → System Prompt

**Expected Format**: Should match `docs/vapi/prompts/VAPI_SYSTEM_PROMPT.txt`

**Key Variables to Verify**:
- `{{pet_name}}` (not `{{petName}}`)
- `{{owner_name}}` (not `{{ownerName}}`)
- `{{clinic_name}}` (not `{{clinicName}}`)
- `{{agent_name}}` (not `{{agentName}}`)
- `{{appointment_date}}` (not `{{appointmentDate}}`)
- `{{call_type}}` (not `{{callType}}`)
- `{{discharge_summary_content}}` (not `{{dischargeSummaryContent}}`)

**If Mismatch Found**:
1. Copy contents from `docs/vapi/prompts/VAPI_SYSTEM_PROMPT.txt`
2. Paste into VAPI Dashboard → Assistant → System Prompt
3. Save changes

#### 2. Test with Real Call

**Steps**:
1. Schedule a test call via `/api/calls/schedule`
2. Check logs for variable format at each step:
   - `[EXECUTE_CALL] Initial variables from database` - should show snake_case
   - `[EXECUTE_CALL] Fresh variables from buildDynamicVariables` - should show camelCase
   - `[EXECUTE_CALL] Normalized variables (ready for VAPI)` - should show snake_case
   - `[VAPI_CLIENT] Creating phone call with payload` - should show snake_case in sampleVariables
3. Listen to call recording or check transcript
4. Verify variables are injected correctly (e.g., "Hi John, this is Sarah..." not "Hi {{owner_name}}, this is {{agent_name}}...")

#### 3. Check Supabase Logs

**Query**:
```sql
SELECT 
  id,
  customer_phone,
  status,
  dynamic_variables,
  created_at
FROM scheduled_discharge_calls
ORDER BY created_at DESC
LIMIT 5;
```

**Verify**:
- `dynamic_variables` column contains snake_case keys
- Values are properly formatted strings (not null/undefined)

## Expected Behavior After Fix

### Before Fix
- Assistant says: "Hi {{owner_name}}, this is {{agent_name}} calling about {{pet_name}}..."
- Variables are not injected

### After Fix
- Assistant says: "Hi John, this is Sarah calling about Max..."
- Variables are properly injected

## Monitoring

Watch for these log patterns to confirm fix is working:

1. **Normalization Working**:
   ```
   [EXECUTE_CALL] Normalized variables (ready for VAPI)
   format: "snake_case (normalized)"
   keyExamples: { pet_name: "Max", owner_name: "John", ... }
   ```

2. **Variables Sent to VAPI**:
   ```
   [VAPI_CLIENT] Creating phone call with payload
   variableFormat: "snake_case (expected by VAPI)"
   sampleVariables: { pet_name: "Max", owner_name: "John", ... }
   ```

3. **Call Success**:
   - Transcript shows actual names, not variable placeholders
   - Call recording confirms natural speech with injected variables

## Troubleshooting

### Variables Still Not Injecting

1. **Check VAPI Dashboard Prompt**:
   - Ensure prompt uses `{{variable_name}}` format (snake_case)
   - Not `{{variableName}}` (camelCase)

2. **Check Logs**:
   - Look for `[EXECUTE_CALL] Normalized variables` log
   - Verify `keyExamples` shows snake_case keys with actual values

3. **Check Variable Values**:
   - Ensure values are not null/undefined
   - Ensure values are strings (not objects)

4. **Check VAPI Assistant Settings**:
   - Verify assistant is using the correct system prompt
   - Check if assistant has variable injection enabled

### Mixed Format Still Present

If logs show mixed format after normalization:
- Check `normalizeVariablesToSnakeCase` function
- Verify it handles both camelCase and snake_case keys
- Check for nested objects that might need recursive conversion

## Related Files

- `src/lib/vapi/utils.ts` - Variable normalization utilities
- `src/app/api/webhooks/execute-call/route.ts` - Execute call handler
- `src/lib/vapi/client.ts` - VAPI client wrapper
- `docs/vapi/prompts/VAPI_SYSTEM_PROMPT.txt` - System prompt template
- `src/app/api/calls/schedule/route.ts` - Schedule call handler (stores snake_case)

## Version History

- **2025-01-XX**: Initial fix implemented
  - Created normalization utility
  - Fixed execute-call route
  - Added comprehensive logging


# VAPI Dynamic Variables Issue - Diagnosis & Fix

## Problem
Dynamic variables are stored in the database and passed in the API call, but the VAPI assistant skips over the words that should be replaced with variable values.

## Root Cause
According to VAPI documentation, dynamic variables require **TWO parts**:

1. ✅ **Passing values via API** (You're doing this correctly)
2. ❌ **Defining placeholders in assistant prompts** (This is missing)

### What's Working
Your code correctly:
- Stores variables in database: `src/app/api/calls/schedule/route.ts:131-138`
  ```typescript
  const callVariables = {
    pet_name: validated.petName,
    owner_name: validated.ownerName,
    vet_name: validated.vetName ?? "",
    clinic_name: validated.clinicName ?? "",
    clinic_phone: validated.clinicPhone ?? "",
    discharge_summary_content: validated.dischargeSummary ?? "",
  };
  ```

- Passes them to VAPI: `src/app/api/webhooks/execute-call/route.ts:117-119`
  ```typescript
  assistantOverrides: dynamicVariables ? {
    variableValues: dynamicVariables,
  } : undefined,
  ```

### What's Missing
Your VAPI assistant's system prompt/instructions must include variable placeholders using **double curly braces**: `{{variableName}}`

## The Fix

### 1. Update Your VAPI Assistant Prompt

In the VAPI dashboard or via API, your assistant's system prompt should include:

```
You are a friendly veterinary follow-up assistant calling to check on {{pet_name}}.

You're calling {{owner_name}} to see how {{pet_name}} is doing after their recent visit to {{clinic_name}}.

[Include your existing instructions here, using the variables where appropriate]

If the owner has questions, they can call us back at {{clinic_phone}}.

{{discharge_summary_content}}
```

### 2. Variable Syntax Rules

- ✅ Correct: `{{pet_name}}`, `{{owner_name}}`
- ❌ Wrong: `{pet_name}`, `$pet_name`, `{{{pet_name}}}`

### 3. Available Variables

Based on your code, you're passing these variables:
- `{{pet_name}}`
- `{{owner_name}}`
- `{{vet_name}}`
- `{{clinic_name}}`
- `{{clinic_phone}}`
- `{{discharge_summary_content}}`

### 4. Built-in Variables (Auto-populated)

VAPI also provides these automatically (no need to pass them):
- `{{now}}` - Current timestamp
- `{{date}}` - Current date
- `{{time}}` - Current time
- `{{customer.number}}` - Phone number being called

## How to Apply the Fix

### Option A: Via VAPI Dashboard
1. Go to VAPI dashboard
2. Edit your "OdisAI Follow-Up Assistant" (ID: `0309c629-a3f2-43aa-b479-e2e783e564a7`)
3. Update the "System Prompt" or "Instructions" field to include `{{variable}}` placeholders
4. Save changes

### Option B: Via API (Programmatic)
Use the VAPI MCP tool to update the assistant:

```typescript
mcp__vapi-mcp__update_assistant({
  assistantId: "0309c629-a3f2-43aa-b479-e2e783e564a7",
  instructions: "Your prompt with {{pet_name}} and {{owner_name}} placeholders..."
})
```

## Testing
After updating the assistant prompt:
1. Schedule a test call with sample data
2. The assistant should now use the actual values instead of skipping them
3. Check the call transcript to verify variables are being replaced

## Reference
- VAPI Dynamic Variables Docs: https://docs.vapi.ai/assistants/dynamic-variables
- Your Assistant ID: `0309c629-a3f2-43aa-b479-e2e783e564a7`

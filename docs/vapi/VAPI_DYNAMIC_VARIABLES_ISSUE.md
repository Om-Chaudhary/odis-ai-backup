# VAPI Dynamic Variables Issue - Analysis & Solution

## Problem Statement

Dynamic variables (pet_name, owner_name, etc.) are being stored in the database correctly, but they are NOT being passed to the VAPI API when the call is executed.

## Current Flow

### 1. **Schedule Call** (`/api/calls/schedule`)

- Receives call data from browser extension or admin dashboard
- Creates `callVariables` object with dynamic variables:
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
- Stores in database with `dynamic_variables: callVariables` ✅ WORKING

### 2. **Execute Call** (`/api/webhooks/execute-call`)

- QStash triggers this webhook at scheduled time
- Retrieves call from database
- Passes dynamic variables to VAPI:
  ```typescript
  assistantOverrides: {
    variableValues: call.dynamic_variables as Record<string, unknown>,
  }
  ```
- ❌ **POTENTIAL ISSUE**: If `call.dynamic_variables` is `null`, this creates an empty object

### 3. **VAPI Client** (`src/lib/vapi/client.ts`)

- Receives parameters and calls VAPI SDK:
  ```typescript
  await vapi.calls.create({
    phoneNumberId: params.phoneNumberId,
    customer: { number: params.phoneNumber },
    assistantId: params.assistantId,
    assistantOverrides: params.assistantOverrides, // May be undefined or have empty variableValues
  });
  ```

## Root Cause Analysis

### Possible Issues:

1. **Database Column Type Mismatch**
   - The `dynamic_variables` column might not be a JSONB column
   - PostgreSQL might be stringifying the object
   - Check: `SELECT pg_typeof(dynamic_variables) FROM vapi_calls LIMIT 1;`

2. **Supabase Client Serialization**
   - Supabase might not be properly serializing/deserializing the JSONB column
   - The value retrieved might be `null`, `"{}"`, or a string instead of an object

3. **VAPI API Structure**
   - According to VAPI MCP server documentation, the structure should be:
     ```typescript
     {
       assistantOverrides: {
         variableValues: {
           key: "value",
           // ...
         }
       }
     }
     ```
   - This matches our implementation, so structure is likely correct

4. **Empty Object Being Passed**
   - If `call.dynamic_variables` is `null` or `undefined`, then:
     ```typescript
     variableValues: null as Record<string, unknown>;
     ```
   - This creates `{ variableValues: null }` which VAPI might ignore

## Logging Added

### Schedule Route

```typescript
console.log("[SCHEDULE_CALL] Dynamic variables prepared", {
  callVariables,
  variableCount: Object.keys(callVariables).length,
});
```

### Execute Call Route

```typescript
console.log("[EXECUTE_CALL] Dynamic variables from database", {
  callId,
  dynamicVariables,
  hasVariables: !!dynamicVariables,
  variableKeys: dynamicVariables ? Object.keys(dynamicVariables) : [],
  variableCount: dynamicVariables ? Object.keys(dynamicVariables).length : 0,
});

console.log("[EXECUTE_CALL] Calling VAPI API with parameters", {
  callId,
  phoneNumber: call.customer_phone,
  assistantId,
  phoneNumberId,
  hasAssistantOverrides: !!vapiParams.assistantOverrides,
  variableValues: vapiParams.assistantOverrides?.variableValues,
});
```

### VAPI Client

```typescript
console.log("[VAPI_CLIENT] Creating phone call with payload", {
  phoneNumber: params.phoneNumber,
  assistantId: params.assistantId,
  phoneNumberId: params.phoneNumberId,
  hasAssistantOverrides: !!params.assistantOverrides,
  assistantOverrides: params.assistantOverrides,
  fullPayload: callPayload,
});
```

## Debug Steps

1. **Check Database Column Type**

   ```sql
   SELECT column_name, data_type, udt_name
   FROM information_schema.columns
   WHERE table_name = 'vapi_calls' AND column_name = 'dynamic_variables';
   ```

2. **Check Actual Data in Database**

   ```sql
   SELECT id, dynamic_variables, pg_typeof(dynamic_variables) as type
   FROM vapi_calls
   ORDER BY created_at DESC
   LIMIT 5;
   ```

3. **Monitor Logs During Next Call**
   - Watch for `[SCHEDULE_CALL] Dynamic variables prepared`
   - Watch for `[EXECUTE_CALL] Dynamic variables from database`
   - Watch for `[VAPI_CLIENT] Creating phone call with payload`
   - Compare the variables at each step

## Expected Log Output (Healthy Call)

```
[SCHEDULE_CALL] Dynamic variables prepared {
  callVariables: {
    pet_name: "Fluffy",
    owner_name: "John Doe",
    vet_name: "Dr. Smith",
    clinic_name: "Pet Clinic",
    clinic_phone: "+1234567890",
    discharge_summary_content: "..."
  },
  variableCount: 6
}

[EXECUTE_CALL] Dynamic variables from database {
  callId: "...",
  dynamicVariables: {
    pet_name: "Fluffy",
    owner_name: "John Doe",
    vet_name: "Dr. Smith",
    clinic_name: "Pet Clinic",
    clinic_phone: "+1234567890",
    discharge_summary_content: "..."
  },
  hasVariables: true,
  variableKeys: ["pet_name", "owner_name", "vet_name", "clinic_name", "clinic_phone", "discharge_summary_content"],
  variableCount: 6
}

[VAPI_CLIENT] Creating phone call with payload {
  phoneNumber: "+1234567890",
  assistantId: "asst_...",
  phoneNumberId: "phone_...",
  hasAssistantOverrides: true,
  assistantOverrides: {
    variableValues: {
      pet_name: "Fluffy",
      owner_name: "John Doe",
      // ... etc
    }
  },
  fullPayload: { /* ... */ }
}
```

## Potential Solutions

### Solution 1: Ensure JSONB Column Type

If the column is not JSONB, migrate it:

```sql
ALTER TABLE vapi_calls
ALTER COLUMN dynamic_variables TYPE JSONB
USING dynamic_variables::JSONB;
```

### Solution 2: Add Null Check in Execute Route

```typescript
const dynamicVariables = call.dynamic_variables as Record<
  string,
  unknown
> | null;

if (!dynamicVariables || Object.keys(dynamicVariables).length === 0) {
  console.error("[EXECUTE_CALL] No dynamic variables found", {
    callId,
    raw: call.dynamic_variables,
  });
}
```

### Solution 3: Don't Pass assistantOverrides if Empty

```typescript
const vapiParams = {
  phoneNumber: call.customer_phone,
  assistantId,
  phoneNumberId,
  ...(dynamicVariables && Object.keys(dynamicVariables).length > 0
    ? { assistantOverrides: { variableValues: dynamicVariables } }
    : {}),
};
```

## Next Steps

1. Run a test call and check the logs
2. Compare the three log outputs to see where variables are lost
3. Verify database schema for `dynamic_variables` column
4. If variables are null from DB, check the insert query
5. If variables exist in DB but not sent to VAPI, verify VAPI SDK usage

## VAPI API Reference

According to the VAPI MCP server implementation:

```typescript
create_call({
  assistantId: "string",
  assistantOverrides: {
    variableValues: {
      key: "value", // Dynamic variables as key-value pairs
    },
  },
  customer: {
    number: "+1234567890",
  },
  phoneNumberId: "string",
});
```

Our implementation matches this structure, so the issue is likely in the data retrieval, not the API structure.

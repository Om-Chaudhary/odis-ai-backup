# Discharge Flow API Functions

Complete list of API endpoints and functions relevant to the discharge call flow.

## Table of Contents

1. [Primary Discharge Endpoints](#primary-discharge-endpoints)
2. [Call Management Endpoints](#call-management-endpoints)
3. [Discharge-Specific Fields](#discharge-specific-fields)
4. [Complete Discharge Flow](#complete-discharge-flow)

---

## Primary Discharge Endpoints

### 1. Schedule Discharge Call (Enhanced - Recommended)

**Endpoint:** `POST /api/vapi/schedule`  
**File:** `src/app/api/vapi/schedule/route.ts`  
**Auth:** Required (Admin only)  
**Purpose:** Schedule a discharge call with knowledge base integration

**Discharge-Specific Request Fields:**

```typescript
{
  // REQUIRED for all calls
  phoneNumber: string;              // E.164 format: "+14155551234"
  petName: string;
  ownerName: string;
  clinicName: string;
  agentName: string;                // Vet tech name (e.g., "Sarah")
  clinicPhone: string;              // Spelled out: "five five five, one two three..."
  emergencyPhone?: string;          // Spelled out (defaults to clinicPhone)
  appointmentDate: string;          // Spelled out: "January fifteenth, twenty twenty five"
  callType: "discharge";           // Must be "discharge"
  dischargeSummary: string;         // Clinical discharge summary

  // DISCHARGE-SPECIFIC fields
  subType?: "wellness" | "vaccination";  // Type of discharge visit
  nextSteps?: string;                     // Follow-up care instructions

  // OPTIONAL metadata
  petSpecies?: "dog" | "cat" | "other";
  petAge?: number;                  // 0-30
  petWeight?: number;                // 0-300 (lbs/kg)

  // Scheduling
  scheduledFor?: string;            // ISO 8601 datetime (must be in future)

  // Optional overrides
  assistantId?: string;
  phoneNumberId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}
```

**Response:**

```typescript
{
  success: true;
  data: {
    callId: string;                 // Database ID for tracking
    scheduledFor: string;           // ISO 8601 datetime
    qstashMessageId: string;        // QStash message ID
    petName: string;
    ownerName: string;
    phoneNumber: string;
    phoneNumberFormatted: string;   // Formatted for display
    warnings?: string[];             // Validation warnings
  };
}
```

**Key Features:**

- ✅ Knowledge base integration
- ✅ Dynamic variable building
- ✅ QStash scheduling for delayed execution
- ✅ Automatic validation
- ✅ Admin-only access

---

### 2. Create Discharge Call (Any User)

**Endpoint:** `POST /api/vapi/calls/create`  
**File:** `src/app/api/vapi/calls/create/route.ts`  
**Auth:** Required (Any authenticated user)  
**Purpose:** Create a discharge call without admin privileges

**Discharge-Specific Request Fields:**

```typescript
{
  // REQUIRED for all calls
  clinicName: string;
  agentName: string;
  petName: string;
  ownerName: string;
  ownerPhone: string;                // E.164 format: "+14155551234"
  appointmentDate: string;           // Spelled out
  callType: "discharge";
  clinicPhone: string;              // Spelled out
  emergencyPhone: string;            // Spelled out
  dischargeSummary: string;

  // DISCHARGE-SPECIFIC fields
  subType?: "wellness" | "vaccination";
  nextSteps?: string;

  // OPTIONAL metadata
  petSpecies?: "dog" | "cat" | "other";
  petAge?: number;
  petWeight?: number;

  // Scheduling
  scheduledFor?: string;            // ISO 8601 datetime

  // Optional overrides
  assistantId?: string;
  phoneNumberId?: string;
}
```

**Response:**

```typescript
{
  success: true;
  data: {
    callId: string;                 // Database ID
    status: string;                 // Initial status (usually "queued")
    scheduledFor?: string;          // ISO 8601 datetime if scheduled
    message: string;                 // Human-readable message
  };
  warnings?: string[];              // Validation warnings
}
```

**Key Features:**

- ✅ No admin role required
- ✅ Knowledge base integration
- ✅ Automatic call processing
- ✅ Full validation

---

### 3. Schedule Discharge Call (Legacy)

**Endpoint:** `POST /api/calls/schedule`  
**File:** `src/app/api/calls/schedule/route.ts`  
**Auth:** Required (Admin only)  
**Purpose:** Legacy endpoint for scheduling calls (uses Retell-based schema)

**Discharge-Specific Request Fields:**

```typescript
{
  // REQUIRED
  phoneNumber: string;              // E.164 format
  petName: string;
  ownerName: string;
  appointmentDate: string;           // Spelled out
  callType: "discharge";
  clinicName: string;
  clinicPhone: string;              // Spelled out
  emergencyPhone: string;            // Spelled out
  dischargeSummary: string;

  // DISCHARGE-SPECIFIC
  subType?: "wellness" | "vaccination";
  nextSteps?: string;

  // OPTIONAL
  agentName?: string;               // Defaults to "Sarah"
  vetName?: string;
  medications?: string;

  // Scheduling
  scheduledFor?: string;            // ISO 8601 datetime (must be in future)
  notes?: string;
  metadata?: Record<string, unknown>;
}
```

**Response:**

```typescript
{
  success: true;
  data: {
    callId: string;
    scheduledFor: string; // ISO 8601 datetime
    qstashMessageId: string;
    petName: string;
    ownerName: string;
    phoneNumber: string;
  }
}
```

**Note:** This is a legacy endpoint. Use `/api/vapi/schedule` for new integrations.

---

## Call Management Endpoints

### 4. List Discharge Calls

**Endpoint:** `GET /api/vapi/calls`  
**File:** `src/app/api/vapi/calls/route.ts`  
**Auth:** Required  
**Purpose:** List all calls (can filter by status, but not specifically by callType)

**Query Parameters:**

```typescript
{
  status?: string;                  // Filter by status: "queued" | "in-progress" | "ended" | "failed"
  conditionCategory?: string;       // Not applicable for discharge calls
  limit?: number;                    // Max results (default: 50, max: 100)
  offset?: number;                   // Pagination offset (default: 0)
}
```

**Response:**

```typescript
{
  success: true;
  data: Array<{
    id: string;
    user_id: string;
    status: string; // "queued" | "in-progress" | "ended" | "failed"
    scheduled_for?: string; // ISO 8601 datetime
    dynamic_variables: {
      call_type: "discharge"; // Check this field to filter discharge calls
      sub_type?: "wellness" | "vaccination";
      // ... other variables
    };
    transcript?: string;
    recording_url?: string;
    cost?: number;
    created_at: string;
    updated_at: string;
  }>;
  pagination: {
    limit: number;
    offset: number;
    count: number;
  }
}
```

**Filtering Discharge Calls:**

Since there's no direct `callType` filter, filter client-side:

```javascript
const allCalls = await listCalls();
const dischargeCalls = allCalls.data.filter(
  (call) => call.dynamic_variables?.call_type === "discharge",
);
```

---

### 5. Get Discharge Call Status

**Endpoint:** `GET /api/vapi/calls/[id]`  
**File:** `src/app/api/vapi/calls/[id]/route.ts`  
**Auth:** Required  
**Purpose:** Get status and details of a specific discharge call

**Path Parameters:**

- `id` (string) - Database ID of the call

**Response:**

```typescript
{
  success: true;
  data: {
    id: string;
    status: string;                 // Current status
    scheduled_for?: string;         // ISO 8601 datetime
    dynamic_variables: {
      call_type: "discharge";
      sub_type?: "wellness" | "vaccination";
      pet_name: string;
      owner_name: string;
      appointment_date: string;
      discharge_summary_content: string;
      next_steps?: string;
      // ... other variables
    };
    transcript?: string;            // Available after call ends
    recording_url?: string;         // Available after call ends
    cost?: number;
    created_at: string;
    updated_at: string;
  };
}
```

---

## Discharge-Specific Fields

### Required Fields for Discharge Calls

```typescript
{
  // Core identification
  phoneNumber: string; // E.164 format
  petName: string;
  ownerName: string;

  // Clinic information
  clinicName: string;
  agentName: string; // Vet tech name
  clinicPhone: string; // Spelled out
  emergencyPhone: string; // Spelled out

  // Appointment details
  appointmentDate: string; // Spelled out
  callType: "discharge"; // Must be "discharge"
  dischargeSummary: string; // Clinical summary
}
```

### Optional Discharge Fields

```typescript
{
  // Discharge type
  subType?: "wellness" | "vaccination";  // Type of discharge visit

  // Follow-up instructions
  nextSteps?: string;                    // Care instructions for owner

  // Pet metadata
  petSpecies?: "dog" | "cat" | "other";
  petAge?: number;                       // 0-30
  petWeight?: number;                    // 0-300 (lbs/kg)

  // Scheduling
  scheduledFor?: string;                 // ISO 8601 datetime (future date)
}
```

### Discharge Call Status Values

```typescript
"queued"; // Call is scheduled and waiting
"in-progress"; // Call is currently active
"ended"; // Call completed successfully
"failed"; // Call failed (busy, no answer, etc.)
```

---

## Complete Discharge Flow

### Step-by-Step Discharge Call Flow

#### Step 1: Schedule/Create Discharge Call

```javascript
// Using enhanced endpoint (recommended)
const dischargeCall = await scheduleCall({
  phoneNumber: "+14155551234",
  petName: "Max",
  ownerName: "John Smith",
  clinicName: "Happy Paws Veterinary",
  agentName: "Sarah",
  clinicPhone: "five five five, one two three, four five six seven",
  emergencyPhone: "five five five, nine nine nine, eight eight eight eight",
  appointmentDate: "January fifteenth, twenty twenty five",
  callType: "discharge",
  dischargeSummary:
    "Patient underwent routine wellness exam. All vitals normal. Vaccinations up to date.",
  subType: "wellness",
  nextSteps:
    "Continue current diet and exercise routine. Return in one year for annual checkup.",
  petSpecies: "dog",
  petAge: 5,
  scheduledFor: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
});

// Save callId for tracking
const callId = dischargeCall.data.callId;
```

#### Step 2: Monitor Call Status

```javascript
// Poll for call status until completion
async function monitorDischargeCall(callId) {
  const maxAttempts = 60; // 5 minutes max (5 second intervals)

  for (let i = 0; i < maxAttempts; i++) {
    const result = await getCallStatus(callId);
    const call = result.data;

    console.log(`Status check ${i + 1}: ${call.status}`);

    // Check if call is complete
    if (call.status === "ended") {
      return {
        success: true,
        call: call,
        transcript: call.transcript,
        recordingUrl: call.recording_url,
      };
    }

    if (call.status === "failed") {
      return {
        success: false,
        call: call,
        error: "Call failed",
      };
    }

    // Wait 5 seconds before next check
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error("Call status polling timeout");
}
```

#### Step 3: Retrieve Call Results

```javascript
// After call completes, get full details
const callStatus = await getCallStatus(callId);
const call = callStatus.data;

if (call.status === "ended") {
  console.log("Discharge call completed:", {
    petName: call.dynamic_variables.pet_name,
    ownerName: call.dynamic_variables.owner_name,
    subType: call.dynamic_variables.sub_type,
    transcript: call.transcript,
    recordingUrl: call.recording_url,
    cost: call.cost,
  });
}
```

---

## Discharge Call Examples

### Example 1: Wellness Discharge Call

```javascript
// Schedule a wellness discharge call
const wellnessCall = await scheduleCall({
  phoneNumber: "+14155551234",
  petName: "Max",
  ownerName: "John Smith",
  clinicName: "Happy Paws Veterinary",
  agentName: "Sarah",
  clinicPhone: "five five five, one two three, four five six seven",
  emergencyPhone: "five five five, nine nine nine, eight eight eight eight",
  appointmentDate: "January fifteenth, twenty twenty five",
  callType: "discharge",
  dischargeSummary:
    "Patient underwent routine wellness exam. Physical examination revealed no abnormalities. Heart rate, respiratory rate, and temperature all within normal limits. Body condition score: 5/9.",
  subType: "wellness",
  nextSteps:
    "Continue current diet and exercise routine. Annual checkup recommended in one year. Keep vaccinations up to date.",
  petSpecies: "dog",
  petAge: 5,
  petWeight: 45,
});
```

### Example 2: Vaccination Discharge Call

```javascript
// Schedule a vaccination discharge call
const vaccinationCall = await scheduleCall({
  phoneNumber: "+14155551234",
  petName: "Bella",
  ownerName: "Jane Doe",
  clinicName: "Happy Paws Veterinary",
  agentName: "Sarah",
  clinicPhone: "five five five, one two three, four five six seven",
  emergencyPhone: "five five five, nine nine nine, eight eight eight eight",
  appointmentDate: "January sixteenth, twenty twenty five",
  callType: "discharge",
  dischargeSummary:
    "Patient received annual vaccinations: DHPP, Rabies, and Bordatella. No adverse reactions observed. Patient tolerated procedure well.",
  subType: "vaccination",
  nextSteps:
    "Monitor for any signs of lethargy or discomfort over next 24-48 hours. Mild soreness at injection site is normal. Return in one year for next round of vaccinations.",
  petSpecies: "dog",
  petAge: 3,
});
```

### Example 3: Immediate Discharge Call (No Scheduling)

```javascript
// Create call that will execute immediately
const immediateCall = await createCall({
  clinicName: "Happy Paws Veterinary",
  agentName: "Sarah",
  petName: "Max",
  ownerName: "John Smith",
  ownerPhone: "+14155551234",
  appointmentDate: "January fifteenth, twenty twenty five",
  callType: "discharge",
  clinicPhone: "five five five, one two three, four five six seven",
  emergencyPhone: "five five five, nine nine nine, eight eight eight eight",
  dischargeSummary: "Routine wellness exam completed successfully.",
  subType: "wellness",
  // No scheduledFor = immediate execution
});
```

---

## Summary

### Discharge Flow API Functions

| Function               | Endpoint                      | Auth | Admin | Purpose                                    |
| ---------------------- | ----------------------------- | ---- | ----- | ------------------------------------------ |
| **Schedule Discharge** | `POST /api/vapi/schedule`     | ✅   | ✅    | Schedule with knowledge base (recommended) |
| **Create Discharge**   | `POST /api/vapi/calls/create` | ✅   | ❌    | Create without admin (any user)            |
| **Schedule Legacy**    | `POST /api/calls/schedule`    | ✅   | ✅    | Legacy scheduling endpoint                 |
| **List Calls**         | `GET /api/vapi/calls`         | ✅   | ❌    | List all calls (filter client-side)        |
| **Get Call Status**    | `GET /api/vapi/calls/[id]`    | ✅   | ❌    | Get specific call details                  |

### Discharge-Specific Fields

**Required:**

- `callType: "discharge"`
- `dischargeSummary: string`

**Optional:**

- `subType: "wellness" | "vaccination"`
- `nextSteps: string`

### Typical Discharge Flow

1. **Schedule/Create** → `POST /api/vapi/schedule` or `POST /api/vapi/calls/create`
2. **Monitor** → `GET /api/vapi/calls/[id]` (poll until `status === "ended"`)
3. **Retrieve Results** → Get `transcript` and `recording_url` from call status

---

## Notes

- **Recommended Endpoint:** Use `/api/vapi/schedule` for new integrations (has knowledge base support)
- **No Admin Required:** Use `/api/vapi/calls/create` if admin role is not available
- **Filtering:** Filter discharge calls client-side by checking `dynamic_variables.call_type === "discharge"`
- **Status Polling:** Poll every 5 seconds until status is `"ended"` or `"failed"`
- **Phone Format:** Use E.164 format (`+14155551234`) for phone numbers
- **Date Format:** Spell out dates (`"January fifteenth, twenty twenty five"`)

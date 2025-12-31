# Inbound Squad Agent Tools Architecture

> Comprehensive tool architecture for the `afterhours-inbound-squad` (ID: `2009033a-f999-460f-9fc8-e6e183957212`)

## Overview

This document defines the tool architecture for each agent in the inbound squad, giving each assistant depth, unique capabilities, and actionable tools beyond handoffs.

### Design Principles

1. **Persona-Aligned Tools**: Each agent's tools reinforce their specialist role
2. **Minimal Router**: Router stays lightweight; deep functionality lives in specialists
3. **Log Everything**: Capture actionable data for staff follow-up
4. **IDEXX-Independent**: Most tools work without IDEXX API access
5. **Progressive Implementation**: Phased rollout by priority

---

## Current State

### Live Endpoints

| Tool                           | Endpoint                             | Status       |
| ------------------------------ | ------------------------------------ | ------------ |
| `alum_rock_check_availability` | `/api/vapi/tools/check-availability` | Live (IDEXX) |
| `alum_rock_book_appointment`   | `/api/vapi/tools/book-appointment`   | Live (IDEXX) |
| `leave_message`                | `/api/vapi/leave-message`            | Live         |

### Existing Infrastructure

| Component               | Status | Notes                             |
| ----------------------- | ------ | --------------------------------- |
| `clinic_messages` table | Exists | Priority, status, metadata fields |
| `vapi_bookings` table   | Exists | Full booking lifecycle            |
| Tool registry system    | Exists | `registerTool()`, `executeTool()` |
| Webhook processing      | Exists | 12 event types handled            |

### Placeholders (Need Implementation)

- `lookup_pet_records` - registered but placeholder
- `send_sms_notification` - registered but placeholder
- `get_clinic_hours` - registered with basic logic

---

## Agent Tool Architecture

### 1. Router Agent

**ID**: `71142631-29af-464f-9c6e-bb61a817d6f5`
**Role**: Intent classification and routing

| Tool                     | Type    | Purpose                    | Status |
| ------------------------ | ------- | -------------------------- | ------ |
| `handoff_to_emergency`   | Handoff | Route to Emergency Agent   | Exists |
| `handoff_to_clinical`    | Handoff | Route to Clinical Agent    | Exists |
| `handoff_to_info`        | Handoff | Route to Info Agent        | Exists |
| `handoff_to_appointment` | Handoff | Route to Appointment Agent | Exists |
| `handoff_to_admin`       | Handoff | Route to Admin Agent       | Exists |

**Design Note**: Router should remain lightweight with handoffs only. No deep tools needed.

---

### 2. Emergency Agent

**ID**: `10d81dbd-b15d-49f5-a065-dd17ca332d2a`
**Role**: Triage emergencies, provide ER info, log critical calls

| Tool                     | Type    | Purpose                                | Priority |
| ------------------------ | ------- | -------------------------------------- | -------- |
| `log_emergency_triage`   | NEW     | Log triage with outcome classification | High     |
| `get_er_info`            | NEW     | Fetch ER clinic info dynamically       | Medium   |
| `send_emergency_sms`     | NEW     | Send ER directions via SMS             | Medium   |
| `handoff_to_appointment` | Handoff | Schedule urgent next-day               | Exists   |
| `handoff_to_admin`       | Handoff | Log for staff follow-up                | Exists   |

#### Tool: `log_emergency_triage`

```json
{
  "type": "function",
  "name": "log_emergency_triage",
  "description": "Log emergency triage call with outcome classification. Call this after completing triage to record the outcome for staff review.",
  "parameters": {
    "type": "object",
    "properties": {
      "caller_name": {
        "type": "string",
        "description": "Name of the caller"
      },
      "caller_phone": {
        "type": "string",
        "description": "Caller's phone number"
      },
      "pet_name": {
        "type": "string",
        "description": "Name of the pet"
      },
      "species": {
        "type": "string",
        "enum": ["dog", "cat", "other"],
        "description": "Type of animal"
      },
      "symptoms": {
        "type": "string",
        "description": "Description of symptoms or emergency situation"
      },
      "urgency": {
        "type": "string",
        "enum": ["critical", "urgent", "monitor"],
        "description": "Triage classification level"
      },
      "action_taken": {
        "type": "string",
        "enum": ["sent_to_er", "scheduled_appointment", "home_care_advised"],
        "description": "What action was recommended to the caller"
      },
      "er_referred": {
        "type": "boolean",
        "description": "Whether caller was referred to emergency clinic"
      },
      "notes": {
        "type": "string",
        "description": "Additional notes for staff"
      }
    },
    "required": [
      "caller_name",
      "caller_phone",
      "pet_name",
      "symptoms",
      "urgency",
      "action_taken"
    ]
  }
}
```

**Endpoint**: `/api/vapi/tools/log-emergency-triage`

**Database**: Extends `clinic_messages` with `message_type: 'emergency_triage'` and `triage_data` JSONB

#### Tool: `get_er_info`

```json
{
  "type": "function",
  "name": "get_er_info",
  "description": "Get emergency veterinary clinic information including address, phone, and hours. Use when caller needs ER directions.",
  "parameters": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

**Response**:

```json
{
  "name": "Emergency Veterinary Clinic of San Jose",
  "phone": "(408) 555-9111",
  "address": "123 Emergency Way, San Jose, CA 95123",
  "hours": "24/7",
  "distance_from_clinic": "3.2 miles",
  "directions_summary": "Head south on Main St, turn right on Emergency Way"
}
```

#### Tool: `send_emergency_sms` (VAPI Native)

```json
{
  "type": "sms",
  "name": "send_emergency_sms",
  "description": "Send emergency clinic directions via SMS to caller",
  "metadata": {
    "from": "{{clinic_phone}}"
  }
}
```

---

### 3. Clinical Agent

**ID**: `70cd46bd-cceb-49a7-9b1f-59a4e6138002`
**Role**: Prescription refills, medication questions, test results

| Tool                     | Type    | Purpose                        | Priority |
| ------------------------ | ------- | ------------------------------ | -------- |
| `create_refill_request`  | NEW     | Log Rx refill for vet approval | High     |
| `check_refill_status`    | NEW     | Check if refill was processed  | Medium   |
| `log_lab_result_inquiry` | NEW     | Log request for lab results    | Medium   |
| `lookup_patient`         | FUTURE  | Search patient by name (IDEXX) | Low      |
| `handoff_to_emergency`   | Handoff | Escalate symptoms              | Exists   |
| `handoff_to_appointment` | Handoff | Schedule follow-up             | Exists   |
| `handoff_to_admin`       | Handoff | Complex callback needed        | Exists   |

#### Tool: `create_refill_request`

```json
{
  "type": "function",
  "name": "create_refill_request",
  "description": "Create a prescription refill request for veterinarian approval. The request will be reviewed by clinic staff during business hours.",
  "parameters": {
    "type": "object",
    "properties": {
      "client_name": {
        "type": "string",
        "description": "Name of the pet owner"
      },
      "client_phone": {
        "type": "string",
        "description": "Phone number for callback"
      },
      "pet_name": {
        "type": "string",
        "description": "Name of the pet needing medication"
      },
      "medication_name": {
        "type": "string",
        "description": "Name of medication to refill, or 'unknown' if caller doesn't know"
      },
      "medication_strength": {
        "type": "string",
        "description": "Dosage/strength if known (e.g., '50mg', '10mg/ml')"
      },
      "pharmacy_preference": {
        "type": "string",
        "enum": ["pickup", "external_pharmacy"],
        "description": "Whether to pick up at clinic or send to external pharmacy"
      },
      "pharmacy_name": {
        "type": "string",
        "description": "Name of external pharmacy if applicable"
      },
      "last_refill_date": {
        "type": "string",
        "description": "Approximate date of last refill if known"
      },
      "notes": {
        "type": "string",
        "description": "Additional context (e.g., 'running low', 'need by Friday')"
      }
    },
    "required": ["client_name", "client_phone", "pet_name", "medication_name"]
  }
}
```

**Endpoint**: `/api/vapi/tools/create-refill-request`

**Database**: New `refill_requests` table (see [Database Schema](#database-schema-additions))

#### Tool: `check_refill_status`

```json
{
  "type": "function",
  "name": "check_refill_status",
  "description": "Check the status of a pending prescription refill request",
  "parameters": {
    "type": "object",
    "properties": {
      "client_phone": {
        "type": "string",
        "description": "Phone number associated with the refill request"
      },
      "pet_name": {
        "type": "string",
        "description": "Name of the pet"
      }
    },
    "required": ["client_phone"]
  }
}
```

**Response**:

```json
{
  "found": true,
  "status": "approved",
  "medication": "Carprofen 75mg",
  "message": "Your refill has been approved and is ready for pickup",
  "ready_date": "2024-01-15"
}
```

#### Tool: `log_lab_result_inquiry`

```json
{
  "type": "function",
  "name": "log_lab_result_inquiry",
  "description": "Log that a caller is asking about lab/test results. Staff will call back with results.",
  "parameters": {
    "type": "object",
    "properties": {
      "client_name": {
        "type": "string",
        "description": "Name of the pet owner"
      },
      "client_phone": {
        "type": "string",
        "description": "Callback phone number"
      },
      "pet_name": {
        "type": "string",
        "description": "Name of the pet"
      },
      "test_type": {
        "type": "string",
        "description": "Type of test (bloodwork, urinalysis, x-ray, etc.)"
      },
      "test_date": {
        "type": "string",
        "description": "Approximate date test was done"
      },
      "notes": {
        "type": "string",
        "description": "Any additional context"
      }
    },
    "required": ["client_name", "client_phone", "pet_name"]
  }
}
```

---

### 4. Info Agent

**ID**: `e1aa28d3-0638-4096-a8ea-4f470c2713b8`
**Role**: Answer general questions, provide clinic information

| Tool                     | Type    | Purpose                       | Priority |
| ------------------------ | ------- | ----------------------------- | -------- |
| `get_clinic_info`        | ENHANCE | Return structured clinic data | Medium   |
| `search_faq`             | NEW     | Search FAQ knowledge base     | Low      |
| `handoff_to_appointment` | Handoff | Book if interested            | Exists   |
| `handoff_to_admin`       | Handoff | Complex questions             | Exists   |

#### Tool: `get_clinic_info`

```json
{
  "type": "function",
  "name": "get_clinic_info",
  "description": "Get detailed clinic information by category. Use when answering questions about hours, location, services, or policies.",
  "parameters": {
    "type": "object",
    "properties": {
      "category": {
        "type": "string",
        "enum": [
          "hours",
          "location",
          "services",
          "payment",
          "new_patients",
          "all"
        ],
        "description": "Category of information to retrieve"
      }
    },
    "required": ["category"]
  }
}
```

**Response Example** (`category: "all"`):

```json
{
  "hours": {
    "weekdays": "8:00 AM - 6:00 PM",
    "saturday": "9:00 AM - 2:00 PM",
    "sunday": "Closed",
    "holidays": "Closed on major holidays"
  },
  "location": {
    "address": "123 Main Street, San Jose, CA 95123",
    "phone": "(408) 555-1234",
    "parking": "Free parking available in rear lot"
  },
  "services": [
    "Wellness exams",
    "Vaccinations",
    "Surgery",
    "Dental care",
    "X-rays",
    "Laboratory services"
  ],
  "payment": {
    "methods": ["Cash", "Credit cards", "CareCredit", "Scratchpay"],
    "payment_plans": true
  },
  "new_patients": {
    "accepting": true,
    "required_docs": "Previous veterinary records if available"
  }
}
```

---

### 5. Appointment Agent

**ID**: `800dbaf5-7913-4e74-800f-c1614bc11fad`
**Role**: Book, reschedule, cancel appointments

| Tool                     | Type    | Purpose                   | Priority |
| ------------------------ | ------- | ------------------------- | -------- |
| `check_availability`     | EXISTS  | Query available slots     | Live     |
| `book_appointment`       | EXISTS  | Book with 5-min hold      | Live     |
| `cancel_appointment`     | NEW     | Log cancellation request  | High     |
| `reschedule_appointment` | NEW     | Log reschedule request    | High     |
| `send_confirmation_sms`  | NEW     | Send booking confirmation | Medium   |
| `handoff_to_admin`       | Handoff | Complex/frustrated caller | Exists   |

#### Tool: `cancel_appointment`

**Design Decision**: Logs cancellation request for staff to process in IDEXX (not automated).

```json
{
  "type": "function",
  "name": "cancel_appointment",
  "description": "Log a request to cancel an existing appointment. Staff will process the cancellation during business hours.",
  "parameters": {
    "type": "object",
    "properties": {
      "client_name": {
        "type": "string",
        "description": "Name of the pet owner"
      },
      "client_phone": {
        "type": "string",
        "description": "Phone number on file"
      },
      "pet_name": {
        "type": "string",
        "description": "Name of the pet with the appointment"
      },
      "appointment_date": {
        "type": "string",
        "description": "Date of appointment to cancel (YYYY-MM-DD or description like 'tomorrow')"
      },
      "appointment_time": {
        "type": "string",
        "description": "Time of appointment if known"
      },
      "reason": {
        "type": "string",
        "description": "Reason for cancellation"
      }
    },
    "required": ["client_name", "client_phone", "pet_name", "appointment_date"]
  }
}
```

**Endpoint**: `/api/vapi/tools/cancel-appointment`

**Response**:

```json
{
  "success": true,
  "message": "Your cancellation request has been logged. Staff will confirm via callback or text during business hours.",
  "reference_id": "CXL-2024-0115-001"
}
```

#### Tool: `reschedule_appointment`

**Design Decision**: Logs reschedule request for staff to process in IDEXX.

```json
{
  "type": "function",
  "name": "reschedule_appointment",
  "description": "Log a request to reschedule an existing appointment to a new date/time. Staff will process during business hours.",
  "parameters": {
    "type": "object",
    "properties": {
      "client_name": {
        "type": "string",
        "description": "Name of the pet owner"
      },
      "client_phone": {
        "type": "string",
        "description": "Phone number on file"
      },
      "pet_name": {
        "type": "string",
        "description": "Name of the pet"
      },
      "original_date": {
        "type": "string",
        "description": "Current appointment date"
      },
      "original_time": {
        "type": "string",
        "description": "Current appointment time if known"
      },
      "preferred_new_date": {
        "type": "string",
        "description": "Preferred new date"
      },
      "preferred_new_time": {
        "type": "string",
        "description": "Preferred new time or time range"
      },
      "reason": {
        "type": "string",
        "description": "Reason for rescheduling"
      }
    },
    "required": [
      "client_name",
      "client_phone",
      "pet_name",
      "original_date",
      "preferred_new_date"
    ]
  }
}
```

**Endpoint**: `/api/vapi/tools/reschedule-appointment`

#### Tool: `send_confirmation_sms` (VAPI Native)

```json
{
  "type": "sms",
  "name": "send_confirmation_sms",
  "description": "Send appointment confirmation details via SMS",
  "metadata": {
    "from": "{{clinic_phone}}"
  }
}
```

---

### 6. Admin Agent

**ID**: `041dfbcd-6b3a-4a17-8fb4-ab994784b5fe`
**Role**: Catch-all for messages, billing, records requests

| Tool                    | Type   | Purpose                     | Priority |
| ----------------------- | ------ | --------------------------- | -------- |
| `leave_message`         | EXISTS | General callback request    | Live     |
| `log_billing_inquiry`   | NEW    | Log billing question        | Medium   |
| `log_records_request`   | NEW    | Log medical records request | Medium   |
| `send_confirmation_sms` | NEW    | Confirm message received    | Low      |

#### Tool: `leave_message` (Enhanced)

```json
{
  "type": "function",
  "name": "leave_message",
  "description": "Log a callback request with categorization. Use for any request that needs staff follow-up.",
  "parameters": {
    "type": "object",
    "properties": {
      "client_name": {
        "type": "string",
        "description": "Name of the caller"
      },
      "client_phone": {
        "type": "string",
        "description": "Callback phone number"
      },
      "pet_name": {
        "type": "string",
        "description": "Pet name if applicable"
      },
      "message": {
        "type": "string",
        "description": "The message or request details"
      },
      "is_urgent": {
        "type": "boolean",
        "description": "Whether this needs priority attention"
      },
      "message_type": {
        "type": "string",
        "enum": [
          "general",
          "billing",
          "records",
          "refill",
          "clinical",
          "other"
        ],
        "description": "Category for routing to appropriate staff"
      },
      "best_callback_time": {
        "type": "string",
        "description": "Caller's preferred callback time"
      },
      "notes": {
        "type": "string",
        "description": "Additional context for staff"
      }
    },
    "required": ["client_name", "client_phone", "message", "is_urgent"]
  }
}
```

#### Tool: `log_records_request`

```json
{
  "type": "function",
  "name": "log_records_request",
  "description": "Log a request for medical records to be sent to another clinic, specialist, or the owner.",
  "parameters": {
    "type": "object",
    "properties": {
      "client_name": {
        "type": "string",
        "description": "Name of the pet owner"
      },
      "client_phone": {
        "type": "string",
        "description": "Phone number for confirmation"
      },
      "pet_name": {
        "type": "string",
        "description": "Name of the pet"
      },
      "records_type": {
        "type": "string",
        "enum": [
          "full_history",
          "vaccines_only",
          "specific_visit",
          "recent_records"
        ],
        "description": "What records are needed"
      },
      "specific_date": {
        "type": "string",
        "description": "Date of specific visit if applicable"
      },
      "destination_type": {
        "type": "string",
        "enum": ["email", "fax", "vet_clinic", "specialist"],
        "description": "How/where to send records"
      },
      "destination_contact": {
        "type": "string",
        "description": "Email address, fax number, or clinic name"
      },
      "notes": {
        "type": "string",
        "description": "Additional instructions"
      }
    },
    "required": [
      "client_name",
      "client_phone",
      "pet_name",
      "records_type",
      "destination_type",
      "destination_contact"
    ]
  }
}
```

**Endpoint**: `/api/vapi/tools/log-records-request`

#### Tool: `log_billing_inquiry`

```json
{
  "type": "function",
  "name": "log_billing_inquiry",
  "description": "Log a billing or payment-related question for staff follow-up.",
  "parameters": {
    "type": "object",
    "properties": {
      "client_name": {
        "type": "string",
        "description": "Name of the caller"
      },
      "client_phone": {
        "type": "string",
        "description": "Callback phone number"
      },
      "inquiry_type": {
        "type": "string",
        "enum": [
          "balance_question",
          "payment_plan",
          "insurance",
          "estimate_request",
          "refund",
          "other"
        ],
        "description": "Type of billing inquiry"
      },
      "details": {
        "type": "string",
        "description": "Details of the billing question"
      },
      "visit_date": {
        "type": "string",
        "description": "Date of visit if related to specific bill"
      }
    },
    "required": ["client_name", "client_phone", "inquiry_type", "details"]
  }
}
```

---

## Implementation Priority Matrix

### Phase 1: Core Logging (High Impact, Low Effort)

| Tool                    | Agent     | Database Change             | Effort |
| ----------------------- | --------- | --------------------------- | ------ |
| `log_emergency_triage`  | Emergency | Extend `clinic_messages`    | Low    |
| `create_refill_request` | Clinical  | New `refill_requests` table | Medium |
| Enhance `leave_message` | Admin     | Add `message_type` enum     | Low    |

### Phase 2: Appointment Lifecycle

| Tool                     | Agent       | Database Change          | Effort |
| ------------------------ | ----------- | ------------------------ | ------ |
| `cancel_appointment`     | Appointment | Log to `clinic_messages` | Low    |
| `reschedule_appointment` | Appointment | Log to `clinic_messages` | Low    |

### Phase 3: Notifications

| Tool                    | Agent              | Integration     | Effort |
| ----------------------- | ------------------ | --------------- | ------ |
| `send_confirmation_sms` | Appointment, Admin | VAPI native SMS | Low    |
| `send_emergency_sms`    | Emergency          | VAPI native SMS | Low    |

### Phase 4: Enhanced Data

| Tool                  | Agent     | Dependency              | Effort |
| --------------------- | --------- | ----------------------- | ------ |
| `get_er_info`         | Emergency | Clinic config           | Low    |
| `get_clinic_info`     | Info      | Clinic config           | Medium |
| `check_refill_status` | Clinical  | `refill_requests` table | Medium |

### Phase 5: Future (IDEXX Dependent)

| Tool                  | Agent    | Requirement      | Effort |
| --------------------- | -------- | ---------------- | ------ |
| `lookup_patient`      | Clinical | IDEXX API access | High   |
| `get_patient_history` | Clinical | IDEXX API access | High   |

---

## Database Schema Additions

### New Table: `refill_requests`

```sql
CREATE TABLE refill_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) NOT NULL,

  -- Caller info
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  pet_name TEXT NOT NULL,

  -- Medication info
  medication_name TEXT NOT NULL,
  medication_strength TEXT,
  pharmacy_preference TEXT CHECK (pharmacy_preference IN ('pickup', 'external')),
  pharmacy_name TEXT,
  last_refill_date DATE,

  -- Workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'dispensed')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  denied_reason TEXT,
  dispensed_at TIMESTAMPTZ,

  -- VAPI tracking
  vapi_call_id TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_refill_requests_clinic_id ON refill_requests(clinic_id);
CREATE INDEX idx_refill_requests_status ON refill_requests(status);
CREATE INDEX idx_refill_requests_created_at ON refill_requests(created_at DESC);

-- RLS
ALTER TABLE refill_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view refills for their clinic"
  ON refill_requests FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM clinic_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can update refills for their clinic"
  ON refill_requests FOR UPDATE
  USING (clinic_id IN (SELECT clinic_id FROM clinic_users WHERE user_id = auth.uid()));
```

### Extend `clinic_messages`

```sql
-- Add message type categorization
ALTER TABLE clinic_messages
ADD COLUMN message_type TEXT DEFAULT 'general'
CHECK (message_type IN (
  'general',
  'billing',
  'records',
  'refill',
  'emergency_triage',
  'clinical',
  'cancellation',
  'reschedule',
  'other'
));

-- Add structured data for triage calls
ALTER TABLE clinic_messages
ADD COLUMN triage_data JSONB;

-- Example triage_data structure:
-- {
--   "urgency": "critical",
--   "symptoms": "not breathing",
--   "action_taken": "sent_to_er",
--   "er_referred": true,
--   "species": "dog"
-- }

-- Add index for message type filtering
CREATE INDEX idx_clinic_messages_message_type ON clinic_messages(message_type);
```

---

## VAPI SMS Tool Configuration

Use VAPI's native SMS tool type for notifications:

```json
{
  "type": "sms",
  "name": "send_confirmation_sms",
  "description": "Send SMS confirmation to caller",
  "metadata": {
    "from": "{{clinic_phone}}"
  }
}
```

### Use Cases

| Agent       | SMS Tool                | Use Case                                         |
| ----------- | ----------------------- | ------------------------------------------------ |
| Emergency   | `send_emergency_sms`    | Send ER address/directions after critical triage |
| Appointment | `send_confirmation_sms` | Confirm booking details, appointment reminders   |
| Admin       | `send_confirmation_sms` | Confirm message was received                     |

### SMS Message Templates

**Emergency ER Directions**:

```
EMERGENCY: {{er_clinic_name}}
Address: {{er_address}}
Phone: {{er_phone}}
Open 24/7

Your regular clinic will follow up during business hours.
```

**Appointment Confirmation**:

```
Appointment Confirmed at {{clinic_name}}

Pet: {{pet_name}}
Date: {{appointment_date}}
Time: {{appointment_time}}

Call (408) 555-1234 to reschedule.
```

---

## Refill Approval Workflow

### Status Flow

```
pending → approved → dispensed
       ↘ denied
```

### Dashboard Features

#### 1. Refill Queue Page (`/dashboard/refills`)

- Filter by status: pending / approved / denied / dispensed
- Sort by: date, urgency, medication
- Bulk approve/deny actions
- Search by client name, pet name, medication

#### 2. Refill Detail View

- Patient information (name, phone, pet)
- Medication details (name, strength, pharmacy preference)
- Call recording link (if available from VAPI)
- Approve/Deny buttons with notes field
- Dispense confirmation button

#### 3. Notifications

- Slack notification when new refill request arrives
- Dashboard badge showing pending refill count
- Optional: Email/SMS to client when approved

### tRPC Procedures

```typescript
// refills.router.ts
export const refillsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["pending", "approved", "denied", "dispensed"])
          .optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      /* ... */
    }),

  approve: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      /* ... */
    }),

  deny: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      /* ... */
    }),

  dispense: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      /* ... */
    }),
});
```

---

## Files to Create/Modify

### New API Endpoints

| File                                                              | Tool                     |
| ----------------------------------------------------------------- | ------------------------ |
| `apps/web/src/app/api/vapi/tools/log-emergency-triage/route.ts`   | `log_emergency_triage`   |
| `apps/web/src/app/api/vapi/tools/create-refill-request/route.ts`  | `create_refill_request`  |
| `apps/web/src/app/api/vapi/tools/cancel-appointment/route.ts`     | `cancel_appointment`     |
| `apps/web/src/app/api/vapi/tools/reschedule-appointment/route.ts` | `reschedule_appointment` |
| `apps/web/src/app/api/vapi/tools/log-records-request/route.ts`    | `log_records_request`    |
| `apps/web/src/app/api/vapi/tools/get-clinic-info/route.ts`        | `get_clinic_info`        |

### Database Migrations

| File                                                    | Purpose                          |
| ------------------------------------------------------- | -------------------------------- |
| `supabase/migrations/xxx_add_refill_requests_table.sql` | New refill_requests table        |
| `supabase/migrations/xxx_extend_clinic_messages.sql`    | Add message_type and triage_data |

### Dashboard Components

| File                                          | Purpose                 |
| --------------------------------------------- | ----------------------- |
| `apps/web/src/app/dashboard/refills/page.tsx` | Refill queue page       |
| `apps/web/src/server/api/routers/refills/`    | tRPC router for refills |

---

## Summary: Tools Per Agent

| Agent           | Existing                        | New to Add                                                               | Total |
| --------------- | ------------------------------- | ------------------------------------------------------------------------ | ----- |
| **Router**      | 5 handoffs                      | —                                                                        | 5     |
| **Emergency**   | 2 handoffs                      | `log_emergency_triage`, `get_er_info`, `send_sms`                        | 5     |
| **Clinical**    | 3 handoffs                      | `create_refill_request`, `check_refill_status`, `log_lab_result_inquiry` | 6     |
| **Info**        | 2 handoffs                      | `get_clinic_info`                                                        | 3     |
| **Appointment** | 3 (availability, book, handoff) | `cancel_appointment`, `reschedule_appointment`, `send_sms`               | 6     |
| **Admin**       | 1 (leave_message)               | `log_records_request`, `log_billing_inquiry`, `send_sms`                 | 4     |

**Total new tools to implement: 13**

---

## Design Decisions Summary

| Decision          | Choice                  | Rationale                                             |
| ----------------- | ----------------------- | ----------------------------------------------------- |
| Cancel/Reschedule | Log requests only       | Staff processes in IDEXX manually; avoids sync issues |
| SMS Notifications | VAPI built-in SMS tool  | Native capability, no Twilio setup needed             |
| Refill Workflow   | Full dashboard approval | Vet must review before dispensing; status tracking    |
| Emergency Logging | Extend clinic_messages  | Reuse existing table; add triage_data JSONB           |
| Patient Lookup    | Future/IDEXX-dependent  | Requires IDEXX API integration first                  |

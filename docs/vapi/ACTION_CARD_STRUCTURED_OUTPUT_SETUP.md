# VAPI Structured Output Setup: Action Card Data

This guide explains how to configure your VAPI assistant to return pre-structured action card data, eliminating on-the-fly extraction in the dashboard.

## Overview

Instead of extracting ER names, phone numbers, and other action card data from unstructured text using regex, we now configure VAPI to return this data in a structured format at call end.

**Benefits:**
- No regex extraction needed (more reliable)
- No on-the-fly AI generation (faster)
- No caching layer needed
- Consistent data format

## Step-by-Step Setup in VAPI Dashboard

### 1. Navigate to Your Assistant

1. Log into [VAPI Dashboard](https://dashboard.vapi.ai)
2. Go to **Assistants** in the left sidebar
3. Select your **inbound assistant** (e.g., "Inbound Receptionist")

### 2. Add Structured Output Schema

1. Scroll down to the **Model** section
2. Find **Structured Outputs** (or "Analysis Schema" in some versions)
3. Click **Add Structured Output**

### 3. Configure the Schema

**Schema Name:** `action_card_output`

**Schema JSON:**

```json
{
  "type": "object",
  "properties": {
    "card_type": {
      "type": "string",
      "enum": ["scheduled", "rescheduled", "cancellation", "emergency", "callback", "info"],
      "description": "The type of action card to display based on the call outcome. Choose based on what happened during the call: scheduled (new appointment booked), rescheduled (existing appointment moved), cancellation (appointment cancelled), emergency (urgent triage/ER referral), callback (staff callback requested), info (general information provided)."
    },
    "appointment_data": {
      "type": "object",
      "description": "Appointment details for scheduled/rescheduled/cancellation outcomes. Include when an appointment was booked, rescheduled, or cancelled.",
      "properties": {
        "patient_name": {
          "type": "string",
          "description": "The pet's name"
        },
        "client_name": {
          "type": "string",
          "description": "The owner/client's name"
        },
        "date": {
          "type": "string",
          "description": "Appointment date in YYYY-MM-DD format"
        },
        "time": {
          "type": "string",
          "description": "Appointment time in HH:MM format (24-hour)"
        },
        "reason": {
          "type": "string",
          "description": "Reason for the appointment/visit"
        }
      }
    },
    "original_appointment": {
      "type": "object",
      "description": "Original appointment details ONLY for rescheduled appointments. Include the date/time that was changed FROM.",
      "properties": {
        "date": {
          "type": "string",
          "description": "Original date in YYYY-MM-DD format"
        },
        "time": {
          "type": "string",
          "description": "Original time in HH:MM format"
        }
      }
    },
    "reschedule_reason": {
      "type": "string",
      "description": "Why the appointment was rescheduled. Only include for rescheduled card_type."
    },
    "cancellation_reason": {
      "type": "string",
      "description": "Why the appointment was cancelled. Only include for cancellation card_type."
    },
    "emergency_data": {
      "type": "object",
      "description": "Emergency triage details. Include when caller was triaged for emergency or referred to ER.",
      "properties": {
        "symptoms": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Key symptoms the pet is experiencing (e.g., ['vomiting', 'lethargy', 'not eating'])"
        },
        "er_name": {
          "type": "string",
          "description": "Name of the specific ER the caller was referred to (e.g., 'Austin Emergency Vet', 'BluePearl'). Leave null if referred to 'nearest ER' without a specific name."
        },
        "urgency_level": {
          "type": "string",
          "enum": ["critical", "urgent", "monitor"],
          "description": "Urgency level: critical (go to ER immediately), urgent (go to ER soon), monitor (watch at home, go to ER if worsens)"
        }
      }
    },
    "callback_data": {
      "type": "object",
      "description": "Callback request details. Include when caller requested a callback from staff.",
      "properties": {
        "reason": {
          "type": "string",
          "description": "Why the caller needs a callback (e.g., 'Questions about medication dosage', 'Needs to speak with Dr. Smith')"
        },
        "phone_number": {
          "type": "string",
          "description": "Phone number to call back (if different from caller ID)"
        },
        "caller_name": {
          "type": "string",
          "description": "Caller's name"
        },
        "pet_name": {
          "type": "string",
          "description": "Pet's name if mentioned"
        }
      }
    },
    "info_data": {
      "type": "object",
      "description": "Informational call details. Include when caller just needed information (hours, directions, pricing, etc.).",
      "properties": {
        "topics": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Topics the caller asked about (e.g., ['hours', 'pricing', 'services'])"
        },
        "summary": {
          "type": "string",
          "description": "Brief summary of what information was provided"
        }
      }
    }
  },
  "required": ["card_type"]
}
```

### 4. Save the Assistant

Click **Save** at the bottom of the page.

## How It Works

1. **During the call**: VAPI's AI processes the conversation
2. **At call end**: VAPI evaluates the structured output schema against the conversation
3. **Webhook delivery**: The `action_card_output` data is included in `artifact.structuredOutputs`
4. **Our processing**: We extract and store this in `inbound_vapi_calls.action_card_data`
5. **Dashboard display**: Action cards read directly from `action_card_data` (no extraction needed)

## Field Mapping by Card Type

| Card Type | Required Fields | Optional Fields |
|-----------|-----------------|-----------------|
| `scheduled` | `card_type` | `appointment_data.*` |
| `rescheduled` | `card_type` | `appointment_data.*`, `original_appointment.*`, `reschedule_reason` |
| `cancellation` | `card_type` | `appointment_data.*`, `cancellation_reason` |
| `emergency` | `card_type` | `emergency_data.symptoms`, `emergency_data.er_name`, `emergency_data.urgency_level` |
| `callback` | `card_type` | `callback_data.reason`, `callback_data.phone_number`, `callback_data.caller_name` |
| `info` | `card_type` | `info_data.topics`, `info_data.summary` |

## Example Outputs

### Scheduled Appointment
```json
{
  "card_type": "scheduled",
  "appointment_data": {
    "patient_name": "Max",
    "client_name": "John Smith",
    "date": "2025-01-22",
    "time": "09:30",
    "reason": "Annual wellness exam"
  }
}
```

### Emergency Triage
```json
{
  "card_type": "emergency",
  "emergency_data": {
    "symptoms": ["vomiting blood", "lethargy", "not eating"],
    "er_name": "Austin Emergency Vet",
    "urgency_level": "critical"
  }
}
```

### Callback Request
```json
{
  "card_type": "callback",
  "callback_data": {
    "reason": "Needs to discuss lab results with Dr. Martinez",
    "phone_number": "512-555-1234",
    "caller_name": "Sarah Johnson",
    "pet_name": "Bella"
  }
}
```

## Backward Compatibility

The system maintains full backward compatibility:

1. **New calls**: Use `action_card_data` from VAPI structured output
2. **Old calls**: Fall back to `deriveActionCardData()` which extracts from legacy fields

No migration of historical data is required.

## Troubleshooting

### Structured output not appearing

1. Verify the schema is saved on the assistant
2. Check VAPI webhook logs for `artifact.structuredOutputs`
3. Verify schema name matches exactly: `action_card_output`

### Incorrect card_type

The AI determines card_type based on conversation context. If it's consistently wrong:
1. Review your assistant's system prompt
2. Ensure call outcomes are clearly defined
3. Add examples to the schema descriptions

### Missing fields

Not all fields need to be populated. The AI only fills in what's relevant to the call. The dashboard handles missing fields gracefully.

## Related Files

- Migration: `supabase/migrations/20260121000000_add_action_card_data_column.sql`
- Schema processor: `libs/integrations/vapi/src/webhooks/processors/structured-output.ts`
- Inbound processor: `libs/integrations/vapi/src/webhooks/handlers/end-of-call-report/inbound-processor.ts`
- Fallback utility: `apps/web/src/components/dashboard/shared/action-cards/derive-action-card-data.ts`
- Action card selector: `apps/web/src/components/dashboard/shared/action-cards/action-card-selector.tsx`

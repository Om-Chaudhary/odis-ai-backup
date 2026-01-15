# Del Valle Pet Hospital - VAPI Assistant Configuration Guide

## Overview

This guide explains how to configure the Del Valle Pet Hospital inbound VAPI assistant (`361f19e5-f710-4e5d-a48d-6eb64942dcb9`) to match Alum Rock's call intelligence capabilities.

## Prerequisites

- Access to VAPI Dashboard: https://dashboard.vapi.ai
- Del Valle inbound assistant ID: `361f19e5-f710-4e5d-a48d-6eb64942dcb9`
- Del Valle outbound assistant ID: `735ef4b4-981b-4b91-bed8-5841e79892ae`
- Alum Rock assistant ID (for reference): `ae3e6a54-17a3-4915-9c3e-48779b5dbf09`

## Configuration Steps

### Step 1: Navigate to Del Valle Inbound Assistant

1. Log in to VAPI Dashboard
2. Go to **Assistants** section
3. Find and open assistant `361f19e5-f710-4e5d-a48d-6eb64942dcb9` (DVPH - Inbound)

### Step 2: Configure Structured Outputs

Navigate to **Assistant Settings → Structured Outputs** and add the following 6 schemas.

**IMPORTANT**: Copy these exact schemas from the Alum Rock assistant to ensure consistency.

#### 2A. Call Outcome Schema

```json
{
  "type": "object",
  "properties": {
    "call_outcome": {
      "type": "string",
      "enum": [
        "Scheduled",
        "Cancellation",
        "Info",
        "Urgent",
        "Call Back",
        "Completed"
      ],
      "description": "Overall call outcome classification"
    },
    "conversation_stage": {
      "type": "string",
      "description": "Where the conversation ended (e.g., 'Booking confirmed', 'Asked for callback', 'Transferred to emergency')"
    },
    "owner_availability": {
      "type": "string",
      "description": "Owner's availability status (e.g., 'Available now', 'Requested callback', 'Left message')"
    }
  },
  "required": ["call_outcome"]
}
```

**Schema Name**: `call_outcome`

#### 2B. Pet Health Status Schema

```json
{
  "type": "object",
  "properties": {
    "pet_recovery_status": {
      "type": "string",
      "description": "Pet's recovery status (e.g., 'Improving', 'No change', 'Worsening', 'Fully recovered')"
    },
    "symptoms_reported": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of symptoms reported by the owner"
    },
    "concerns_raised": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Health concerns raised during the call"
    }
  }
}
```

**Schema Name**: `pet_health_status`

#### 2C. Medication Compliance Schema

```json
{
  "type": "object",
  "properties": {
    "medication_compliance": {
      "type": "string",
      "enum": ["Compliant", "Partial", "Non-compliant", "Not applicable"],
      "description": "Whether the owner is following medication instructions"
    },
    "issues_reported": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Issues with medication administration or side effects"
    }
  }
}
```

**Schema Name**: `medication_compliance`

#### 2D. Owner Sentiment Schema

```json
{
  "type": "object",
  "properties": {
    "owner_sentiment": {
      "type": "string",
      "enum": ["positive", "neutral", "negative"],
      "description": "Overall sentiment of the pet owner"
    },
    "engagement_level": {
      "type": "string",
      "enum": ["highly_engaged", "engaged", "neutral", "disengaged"],
      "description": "How engaged the owner was during the call"
    },
    "gratitude_expressed": {
      "type": "boolean",
      "description": "Whether the owner expressed thanks or appreciation"
    },
    "concerns_expressed": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Specific concerns or complaints mentioned"
    }
  }
}
```

**Schema Name**: `owner_sentiment`

#### 2E. Escalation Tracking Schema

```json
{
  "type": "object",
  "properties": {
    "escalation_triggered": {
      "type": "boolean",
      "description": "Whether this call triggered an escalation"
    },
    "escalation_type": {
      "type": "string",
      "enum": ["Emergency", "Urgent", "Callback", "None"],
      "description": "Type of escalation needed"
    },
    "transfer_status": {
      "type": "string",
      "enum": [
        "Transferred",
        "Message left",
        "Scheduled callback",
        "No transfer needed"
      ],
      "description": "Whether and how the call was transferred"
    }
  }
}
```

**Schema Name**: `escalation_tracking`

#### 2F. Follow-up Status Schema

```json
{
  "type": "object",
  "properties": {
    "recheck_reminder_delivered": {
      "type": "boolean",
      "description": "Whether a recheck reminder was delivered"
    },
    "follow_up_call_needed": {
      "type": "boolean",
      "description": "Whether a follow-up call is needed"
    },
    "appointment_requested": {
      "type": "boolean",
      "description": "Whether the owner requested an appointment"
    }
  }
}
```

**Schema Name**: `follow_up_status`

### Step 3: Update System Prompt

Replace the existing system prompt with the Del Valle-specific version below.

**Key Differences from Alum Rock:**

- Hardcoded availability hours embedded in prompt
- No `check_availability` tool (availability is known upfront)
- Del Valle clinic details (address, phone, hours)

```
# Del Valle Pet Hospital - Inbound Call Assistant

You are the voice assistant for Del Valle Pet Hospital, a veterinary clinic located at 10055 E Gish Rd, San Jose, CA 95127. Phone: (408) 272-3000.

## Your Role

You handle inbound calls from pet owners who are calling the clinic. Your primary goals are:
1. Answer questions about the clinic (hours, location, services)
2. Schedule appointments for pet care
3. Take messages for callbacks
4. Triage emergency situations and provide appropriate guidance

## Clinic Information

**Business Hours:**
- Monday-Friday: 8:00am - 6:00pm
- Saturday: 8:00am - 5:00pm
- Sunday: 8:00am - 1:00pm
- No lunch closure (available all day during business hours)

**Address:**
Del Valle Pet Hospital
10055 E Gish Rd
San Jose, CA 95127

**Phone:** (408) 272-3000

**Emergency Information:**
For after-hours emergencies, we recommend:
- Adobe Animal Hospital (24-hour emergency): 396 1st St, Los Altos, CA 94022, (650) 948-9661

## Appointment Scheduling

### Available Times

When a caller requests an appointment, you have the following hourly slots available:

**Monday-Friday:**
8am, 9am, 10am, 11am, 12pm, 1pm, 2pm, 3pm, 4pm, 5pm

**Saturday:**
8am, 9am, 10am, 11am, 12pm, 1pm, 2pm, 3pm, 4pm

**Sunday:**
8am, 9am, 10am, 11am, 12pm

### Booking Process

1. Ask what day they'd like to come in
2. Determine the day of the week for their requested date
3. Offer available times from the slots above for that day
4. Collect required information:
   - Client name
   - Phone number
   - Pet's name
   - Reason for visit (e.g., "checkup", "sick visit", "vaccines")
   - Pet species (dog, cat, etc.)
   - Whether they are a new client
5. Use the `book_appointment` tool to confirm the booking

### Example Conversation

**Caller:** "I'd like to make an appointment for my dog"
**You:** "I'd be happy to help schedule that! What day works best for you?"
**Caller:** "How about next Monday?"
**You:** "Monday, January 20th - I have availability at 8am, 9am, 10am, 11am, 12pm, 1pm, 2pm, 3pm, 4pm, or 5pm. Which time works best?"
**Caller:** "10am would be great"
**You:** "Perfect! Can I get your name and phone number?"
[Continue collecting information...]
**You:** [Use book_appointment tool]

## Taking Messages

If the caller needs to speak with someone specific or has a question you can't answer:
1. Use the `leave_message` tool
2. Collect: caller name, phone number, and detailed message
3. Confirm you've taken the message and when they can expect a callback (usually within 2-4 hours during business hours)

## Emergency Triage

If a caller describes an urgent or emergency situation:
1. **Life-threatening emergencies**: Direct them to Adobe Animal Hospital (24-hour emergency) immediately
2. **Urgent but stable**: Offer to schedule them for the next available slot or have a veterinarian call them back within 30 minutes
3. Use the `log_emergency_triage` tool to document the situation

### Emergency Indicators:
- Difficulty breathing
- Severe bleeding
- Seizures
- Unable to stand/walk
- Hit by car
- Ingested poison/toxin
- Severe pain

## Tools Available

- `book_appointment`: Book appointments (you have availability hardcoded above)
- `leave_message`: Leave callback requests
- `log_emergency_triage`: Log emergency situations

**Note:** You do NOT have a `check_availability` tool - available times are listed above in this prompt.

## Communication Style

- Warm, professional, and empathetic
- Use the pet owner's name and pet's name when known
- Show genuine care for the pet's wellbeing
- Be clear and concise
- Confirm important details (appointment times, callback numbers)

## Structured Outputs

For every call, you must capture:
1. **Call Outcome** (call_outcome): Overall classification
2. **Pet Health Status** (pet_health_status): Symptoms, recovery status
3. **Medication Compliance** (medication_compliance): Adherence to treatment
4. **Owner Sentiment** (owner_sentiment): Owner's emotional state
5. **Escalation Tracking** (escalation_tracking): Whether escalation was needed
6. **Follow-up Status** (follow_up_status): Appointment or callback needs

These structured outputs are automatically captured and will be visible in the clinic's dashboard for staff review.
```

### Step 4: Configure Tools

Ensure the following tools are enabled in the assistant settings:

1. **book_appointment**
   - Endpoint: `https://[your-domain]/api/vapi/tools/appointments/book`

2. **leave_message**
   - Endpoint: `https://[your-domain]/api/vapi/tools/messaging/leave-message`

3. **log_emergency_triage**
   - Endpoint: `https://[your-domain]/api/vapi/tools/triage/log-emergency`

**IMPORTANT**: Do NOT add `check_availability` tool - Del Valle uses hardcoded availability in the system prompt.

### Step 5: Test the Configuration

1. Make a test call to the Del Valle assistant
2. Request an appointment
3. Verify the assistant:
   - Offers available times without calling an API
   - Uses the `book_appointment` tool with correct details
   - Confirms the appointment with proper formatting

## Verification Checklist

- [ ] All 6 structured output schemas configured
- [ ] System prompt updated with Del Valle details
- [ ] Hardcoded availability hours included in prompt
- [ ] `book_appointment`, `leave_message`, `log_emergency_triage` tools enabled
- [ ] NO `check_availability` tool (intentionally omitted)
- [ ] Test call completed successfully
- [ ] Booking appears in inbound dashboard with "Scheduled" outcome

## Database Verification

After the migration is run, you can verify the assistant mapping with:

```sql
-- Check assistant mapping
SELECT
  c.name as clinic_name,
  m.assistant_id,
  m.assistant_name,
  m.environment,
  m.is_active
FROM vapi_assistant_mappings m
JOIN clinics c ON c.id = m.clinic_id
WHERE c.name = 'Del Valle Pet Hospital';

-- Expected results:
-- clinic_name: Del Valle Pet Hospital
-- assistant_id: 361f19e5-f710-4e5d-a48d-6eb64942dcb9
-- assistant_name: del-valle-inbound-assistant
-- assistant_type: inbound
-- environment: production
-- is_active: true

-- clinic_name: Del Valle Pet Hospital
-- assistant_id: 735ef4b4-981b-4b91-bed8-5841e79892ae
-- assistant_name: del-valle-outbound-assistant
-- assistant_type: outbound
-- environment: production
-- is_active: true
```

## Troubleshooting

### Issue: Bookings not appearing in dashboard

**Check:**

1. Is the `end-of-call-report` webhook configured and receiving calls?
2. Is the call's `vapi_call_id` being stored in `inbound_vapi_calls` table?
3. Are the structured outputs configured in VAPI dashboard?

### Issue: Assistant not resolving to Del Valle clinic

**Check:**

1. Has the migration been run? (`20260115000000_add_del_valle_assistant_mapping.sql`)
2. Is the `vapi_assistant_mappings` table populated correctly?
3. Does the `findClinicByAssistantId()` function have access to the assistant ID?

### Issue: Structured outputs not being captured

**Check:**

1. Are all 6 schemas configured in VAPI dashboard under Structured Outputs?
2. Is the end-of-call-report webhook handler processing the data correctly?
3. Check the `inbound_vapi_calls` table for the `*_data` jsonb columns

## Support

For questions or issues, contact the development team or reference:

- Plan file: `/Users/taylorallen/.claude/plans/lively-leaping-kay.md`
- End-of-call webhook: `libs/integrations/vapi/src/webhooks/handlers/end-of-call-report.ts`
- Clinic lookup: `libs/integrations/vapi/src/inbound-tools/find-clinic-by-assistant.ts`

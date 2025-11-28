# VAPI Variable Mapping Documentation

## Overview

This document explains how data flows from the IDEXX Extension to VAPI calls, including all variable transformations.

## Data Flow

```
IDEXX Extension → /api/calls/schedule → Database → VAPI Call
```

## Variable Mapping

### From Extension (ScheduleCallRequest) → API (scheduleCallSchema)

| Extension Field    | API Field          | Type   | Required | Description                 |
| ------------------ | ------------------ | ------ | -------- | --------------------------- |
| `phoneNumber`      | `phoneNumber`      | string | ✅       | E.164 format (+14155551234) |
| `petName`          | `petName`          | string | ✅       | Pet's name                  |
| `ownerName`        | `ownerName`        | string | ✅       | Owner's full name           |
| `vetName`          | `vetName`          | string | ❌       | Veterinarian's name         |
| `clinicName`       | `clinicName`       | string | ✅       | Clinic/hospital name        |
| `clinicPhone`      | `clinicPhone`      | string | ✅       | Spelled out phone           |
| `dischargeSummary` | `dischargeSummary` | string | ✅       | Discharge instructions      |
| `scheduledFor`     | `scheduledFor`     | Date   | ❌       | When to make the call       |
| `notes`            | `notes`            | string | ❌       | Additional notes            |
| `metadata`         | `metadata`         | object | ❌       | Tracking metadata           |

### API Additional Fields (Added by API)

| Field             | Default/Source               | Description               |
| ----------------- | ---------------------------- | ------------------------- |
| `appointmentDate` | Current date spelled out     | "November twenty-seventh" |
| `callType`        | "discharge"                  | Type of call              |
| `agentName`       | "Sarah" or user's first name | AI agent name             |
| `emergencyPhone`  | Same as clinicPhone          | Emergency contact         |
| `subType`         | "wellness"                   | Discharge subtype         |
| `nextSteps`       | Generated                    | Follow-up instructions    |

### From API → Database (dynamic_variables in snake_case)

The API converts all fields to snake_case for VAPI:

| API Field          | VAPI Variable               | Example Value                                         |
| ------------------ | --------------------------- | ----------------------------------------------------- |
| `petName`          | `pet_name`                  | "Max"                                                 |
| `ownerName`        | `owner_name`                | "John Smith"                                          |
| `appointmentDate`  | `appointment_date`          | "November twenty-seventh"                             |
| `callType`         | `call_type`                 | "discharge"                                           |
| `agentName`        | `agent_name`                | "Sarah"                                               |
| `vetName`          | `vet_name`                  | "Dr. Johnson"                                         |
| `clinicName`       | `clinic_name`               | "Alum Rock Veterinary"                                |
| `clinicPhone`      | `clinic_phone`              | "four zero eight, five five five, one two three four" |
| `emergencyPhone`   | `emergency_phone`           | "four zero eight, five five five, one two three four" |
| `dischargeSummary` | `discharge_summary_content` | "Post-op care instructions..."                        |
| `subType`          | `sub_type`                  | "wellness"                                            |
| `condition`        | `condition`                 | "ear infection" (follow-up only)                      |
| `medications`      | `medications`               | "Antibiotic twice daily"                              |
| `recheckDate`      | `recheck_date`              | "December first"                                      |
| `nextSteps`        | `next_steps`                | "Monitor for improvements"                            |

## VAPI System Prompt Variables

The VAPI assistant expects these variables to be available:

### Core Variables (Always Required)

- `{{pet_name}}` - Pet's name
- `{{owner_name}}` - Owner's full name
- `{{agent_name}}` - AI agent's name (first name only)
- `{{appointment_date}}` - Date of the appointment (spelled out)
- `{{call_type}}` - "discharge" or "follow-up"

### Clinic Information

- `{{clinic_name}}` - Name of the veterinary clinic
- `{{clinic_phone}}` - Clinic phone (spelled out for speech)
- `{{emergency_phone}}` - Emergency phone (spelled out)
- `{{vet_name}}` - Veterinarian's name (optional)

### Discharge-Specific Variables

- `{{discharge_summary_content}}` - Full discharge instructions
- `{{sub_type}}` - "wellness" or "vaccination"
- `{{medications}}` - Prescribed medications (optional)
- `{{next_steps}}` - Follow-up care instructions (optional)

### Follow-Up Specific Variables

- `{{condition}}` - Medical condition being followed up on
- `{{recheck_date}}` - Date for recheck appointment (spelled out)

## Phone Number Formatting

Phone numbers must be spelled out for VAPI to speak them correctly:

```javascript
// Input: +14155551234 or (415) 555-1234
// Output: "four one five, five five five, one two three four"
```

## Date Formatting

Dates must be spelled out with ordinal numbers:

```javascript
// Input: 2024-11-27
// Output: "November twenty-seventh"

// Input: 2024-12-01
// Output: "December first"
```

## Testing Variables

When `test_mode_enabled` is true for a user:

- Phone number is replaced with `test_contact_phone`
- Call is scheduled for 1 minute in the future
- Useful for testing without calling real customers

## Example Full Variable Set

```json
{
  "pet_name": "Luna",
  "owner_name": "Sarah Johnson",
  "agent_name": "Sarah",
  "appointment_date": "November twenty-seventh",
  "call_type": "discharge",
  "clinic_name": "Alum Rock Veterinary Hospital",
  "clinic_phone": "four zero eight, five five five, one two three four",
  "emergency_phone": "four zero eight, nine nine nine, eight eight eight eight",
  "vet_name": "Dr. Emily Carter",
  "discharge_summary_content": "Luna did very well during her spay surgery today...",
  "sub_type": "wellness",
  "medications": "Rimadyl fifty milligrams twice daily for five days",
  "next_steps": "Keep the incision site clean and dry. Monitor for any swelling.",
  "recheck_date": "December seventh"
}
```

## Troubleshooting

### Common Issues

1. **Call not speaking phone numbers correctly**
   - Ensure phone numbers are spelled out with commas between groups
   - Format: "area code, prefix, line number"

2. **Dates not being spoken naturally**
   - Use ordinal numbers (first, second, third, etc.)
   - Spell out month names completely

3. **Missing variables in VAPI**
   - Check that all required fields are in the API request
   - Verify snake_case conversion is happening
   - Check database `dynamic_variables` column

4. **Test mode not working**
   - Verify `test_mode_enabled` is true in users table
   - Ensure `test_contact_phone` is set
   - Check that call is scheduled 1 minute in future

## Database Verification

To verify variables are stored correctly:

```sql
-- Check a scheduled call's variables
SELECT
  id,
  customer_phone,
  scheduled_for,
  status,
  dynamic_variables
FROM scheduled_discharge_calls
WHERE user_id = 'c51bffe0-0f84-4560-8354-2fa65d646f28'
ORDER BY created_at DESC
LIMIT 1;
```

## Extension Debugging

In the extension's browser console:

```javascript
// Check what data is being sent
console.log("[ODIS] Schedule call request:", apiRequest);

// Verify authentication token
console.log("[ODIS] Auth token present:", !!authToken);

// Check API response
console.log("[ODIS] API response:", response);
```

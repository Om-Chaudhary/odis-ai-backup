# VAPI System Prompts

This directory contains version-controlled system prompts for VAPI assistants.

## Directory Structure

```
prompts/
├── README.md                      # This file
├── shared/                        # Reusable prompt sections
│   ├── EMERGENCY_CRITERIA.md      # Emergency detection criteria
│   ├── RESPONSE_GUIDELINES.md     # Style and delivery guidelines
│   └── ERROR_HANDLING.md          # Error handling patterns
├── inbound/                       # Inbound assistant prompts
│   ├── ARAH_INBOUND.md            # Alum Rock Animal Hospital
│   ├── DVPH_INBOUND.md            # Del Valle Pet Hospital
│   └── TEMPLATE_INBOUND.md        # Template for new clinics
└── outbound/                      # Outbound assistant prompts
    ├── ARAH_OUTBOUND.md           # Alum Rock Animal Hospital
    ├── DVPH_OUTBOUND.md           # Del Valle Pet Hospital
    └── TEMPLATE_OUTBOUND.md       # Template for new clinics
```

## Integration Types

### IDEXX Neo Integrated (ARAH Pattern)
- **Availability**: Dynamic via `check_availability` tool
- **Booking**: Real-time via `book_appointment` tool
- **Sync**: PIMS data synced automatically
- **Example**: Alum Rock Animal Hospital

### Non-Integrated (DVPH Pattern)
- **Availability**: Hardcoded in `[Available Appointment Slots]` section
- **Booking**: Recorded in call data for manual staff entry
- **Sync**: Manual prompt updates required
- **Example**: Del Valle Pet Hospital (Avimark - no API)

## Variable Syntax

### VAPI Liquid Templates
Use for date/time that should be evaluated at call time:
```
{{'now' | date: '%A, %B %d, %Y', 'America/Los_Angeles'}}
{{'now' | date: '%I:%M %p', 'America/Los_Angeles'}}
```

### Dynamic Variables (Outbound)
Passed via `assistantOverrides.variableValues`:
```
{{pet_name}}
{{owner_name}}
{{clinic_name}}
{{appointment_date}}
{{discharge_summary}}
```

## Updating Prompts

### For IDEXX-Integrated Clinics
1. Edit the prompt file in this directory
2. Copy content to VAPI Dashboard
3. Test with a few calls
4. Commit changes

### For Non-Integrated Clinics
1. Edit the prompt file
2. **Update `[Available Appointment Slots]` section** with current availability
3. Copy content to VAPI Dashboard
4. Commit changes
5. **Set reminder to update slots weekly**

## Tool Reference

### Shared Tools (All Clinics)
| Tool | Endpoint | Purpose |
|------|----------|---------|
| `leave_message` | `/api/vapi/messaging/leave-message` | Staff callback requests |
| `log_emergency_triage` | `/api/vapi/triage/log-emergency` | Emergency documentation |

### Clinic-Specific Tools
| Tool | Endpoint | Notes |
|------|----------|-------|
| `{clinic}_check_availability` | `/api/vapi/appointments/check` | Clinic resolved via assistantId |
| `{clinic}_book_appointment` | `/api/vapi/appointments/book` | Clinic resolved via assistantId |
| `transfer_call_{clinic}` | N/A (VAPI native) | Transfer to clinic staff |

## Structured Outputs

All inbound assistants use the `action_card_output` structured data schema:
- `card_type`: scheduled, rescheduled, cancellation, emergency, callback, info
- `appointment_data`: date, time, reason, client_name, patient_name
- `callback_data`: reason, pet_name, caller_name, phone_number
- `emergency_data`: symptoms, urgency_level, er_name
- `info_data`: reason

## Sync Script (Future)

Once implemented, the sync script will:
```bash
# Dry run - see what would change
npx tsx scripts/sync-vapi-assistants.ts --dry-run

# Sync specific clinic
npx tsx scripts/sync-vapi-assistants.ts --clinic=alum-rock

# Sync all
npx tsx scripts/sync-vapi-assistants.ts --all
```

# DVPH Outbound System Prompt

**Assistant ID:** `735ef4b4-981b-4b91-bed8-5841e79892ae`
**Last Updated:** 2026-01-24
**Integration Type:** Non-Integrated (manual booking)

## Tools Required

| Tool | ID | Purpose |
|------|-----|---------|
| `transfer_call_del_valle` | `98581547-2d46-4b02-9ba3-c1bd7fbbcab4` | Transfer to clinic staff |
| `del_valle_book_appointment` | `9fc094bb-34ba-4372-96db-cf78f0dc75bd` | Book appointments |
| `del_valle_check_availability` | `f56fbc8b-27c9-49dc-b4b0-71817088bdbb` | Check available slots |

> **Note:** DVPH Outbound already has scheduling tools configured. Unlike DVPH Inbound which uses hardcoded slots, outbound can use the check_availability tool.

---

## System Prompt Status

**Action Required:** Export the current system prompt from VAPI Dashboard and paste here.

To export:
1. Go to VAPI Dashboard → Assistants → DVPH Outbound
2. Copy the system prompt content
3. Paste below and commit

---

## Placeholder System Prompt

The DVPH Outbound system prompt should follow the same pattern as ARAH Outbound with these clinic-specific changes:

| Variable | ARAH Value | DVPH Value |
|----------|-----------|-----------|
| Clinic name | Alum Rock Animal Hospital | Del Val Pet Hospital |
| Location | San Jose, CA | Livermore, CA |
| Phone | 408-258-2735 | 925-443-6000 |
| Tool names | `alum_rock_*` | `del_valle_*` |
| Transfer tool | `transfer_call_alum_rock` | `transfer_call_del_valle` |

---

## Integration Notes

Since DVPH uses Avimark (no API), the `del_valle_check_availability` tool behavior depends on how availability data is stored:

**Option 1: Database-stored availability**
- Staff manually enters available slots in admin UI
- Tool queries database for slots
- This is the recommended approach

**Option 2: Hardcoded in tool response**
- Tool returns hardcoded slots (requires code updates)
- Not recommended for production

**Current behavior:** Needs verification. Check `libs/integrations/vapi/src/processors/appointments/check-availability.ts` for clinic-specific logic.

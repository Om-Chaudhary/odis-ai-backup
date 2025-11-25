# Missing API Routes Analysis

**Generated:** 2025-01-27  
**Status:** Routes documented but not implemented

---

## Summary

Found **2 routes** that are documented but don't exist in the codebase:

1. ✅ **FIXED**: `/api/discharge/orchestrate/route.ts` - Now implemented
2. ⚠️ **MISSING**: `/api/vapi/schedule/route.ts` - Documented as "Enhanced - Recommended"
3. ⚠️ **MISSING**: `/api/calls/execute/route.ts` - Mentioned in CLAUDE.md

---

## 1. `/api/vapi/schedule/route.ts` ⚠️ MISSING (Documentation Error)

### Documentation References

- **docs/api/discharge-flow-api-functions.md** (line 18-19)
  - Listed as "Schedule Discharge Call (Enhanced - Recommended)"
  - Auth: Required (Admin only)
  - Purpose: Schedule a discharge call with knowledge base integration

- **docs/vapi/VAPI_AI_EXTRACTION_INTEGRATION_SUMMARY.md** (line 24)
- **docs/vapi/VAPI_MIGRATION.md** (line 60)

### Current Status

**Does NOT exist** - File not found in codebase

### What Actually Exists

**`/api/calls/schedule/route.ts`** - This is the ACTUAL working route:

- ✅ **EXISTS** and is fully functional
- ✅ Uses VAPI (stores to `scheduled_discharge_calls` table)
- ✅ Uses VAPI assistant/phone IDs from environment
- ✅ Supports both Bearer token and cookie auth
- ✅ Schedules calls via QStash
- ⚠️ Uses `scheduleCallSchema` from `~/lib/retell/validators` (schema location, but actually uses VAPI)

### The Problem

The documentation is **misleading**:

- It labels `/api/calls/schedule` as "Legacy"
- It says to use `/api/vapi/schedule` for new integrations
- But `/api/vapi/schedule` **doesn't exist**
- So `/api/calls/schedule` is actually the **current, working route**

### Recommendation

**Option 1: Fix the documentation** (RECOMMENDED)

- Update `docs/api/discharge-flow-api-functions.md`:
  - Remove the non-existent `/api/vapi/schedule` endpoint
  - Remove "Legacy" label from `/api/calls/schedule`
  - Mark `/api/calls/schedule` as the **primary/recommended** endpoint
- Update all references to point to the actual route

**Option 2: Create the missing route** (if you want a separate VAPI-specific route)

- Create `src/app/api/vapi/schedule/route.ts`
- Implement admin-only authentication
- Add knowledge base integration
- Use VAPI-specific schema (not Retell-based)
- This would be a duplicate/alternative to the existing route

---

## 2. `/api/calls/execute/route.ts` ⚠️ MISSING

### Documentation References

- **CLAUDE.md** (line 204)
  - Listed as: "Execute scheduled calls via VAPI"
  - Part of VAPI integration architecture

### Current Status

**Does NOT exist** - File not found in codebase

### Alternative Implementation

The functionality is implemented in:

- **`/api/webhooks/execute-call/route.ts`** - QStash webhook handler
  - Handles execution of scheduled calls
  - Triggered by QStash at scheduled time
  - Executes calls via VAPI

### Architecture Note

The execute functionality uses a **webhook pattern** instead of a direct API route:

1. Call is scheduled via `/api/calls/schedule`
2. QStash triggers `/api/webhooks/execute-call` at scheduled time
3. Webhook executes the call via VAPI

This is actually a better architecture for scheduled execution.

### Recommendation

**Update CLAUDE.md** to reflect the actual architecture:

- Remove reference to `/api/calls/execute/route.ts`
- Update to mention `/api/webhooks/execute-call/route.ts` as the execution handler
- Clarify that execution happens via webhook, not direct API call

---

## Verification Checklist

- [x] `/api/discharge/orchestrate/route.ts` - ✅ **NOW IMPLEMENTED**
- [ ] `/api/vapi/schedule/route.ts` - ⚠️ **MISSING** (functionality in legacy route)
- [ ] `/api/calls/execute/route.ts` - ⚠️ **MISSING** (functionality in webhook)

---

## Next Steps

1. **Decide on `/api/vapi/schedule`**:
   - Create it if you want the enhanced version
   - Or update docs to remove references

2. **Update CLAUDE.md**:
   - Fix reference to `/api/calls/execute`
   - Document webhook-based execution pattern

3. **Verify all routes**:
   - Run tests to ensure no other missing routes
   - Check for any other documentation inconsistencies

---

## Files to Review

- `docs/api/discharge-flow-api-functions.md` - Contains reference to missing route
- `CLAUDE.md` - Contains reference to missing execute route
- `src/app/api/calls/schedule/route.ts` - Legacy route (works but marked as legacy)
- `src/app/api/webhooks/execute-call/route.ts` - Actual execution handler

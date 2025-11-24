# Migration Guide - VAPI Table Rename & AI Extraction Integration

## Overview

This guide covers the migration needed to rename the `vapi_calls` table to `scheduled_discharge_calls` and add AI extraction integration.

---

## ⚠️ Do You Need to Run This Migration?

**YES, if:**

- You have an existing `vapi_calls` table in production
- You want to use the new AI extraction variables
- You want the table to follow the same naming convention as `scheduled_discharge_emails`

**NO, if:**

- This is a fresh install (migration will create the table correctly)
- You're still in development and can drop/recreate the table

---

## Migration File

**Location:** `supabase/migrations/20251116000000_rename_vapi_calls_to_scheduled_discharge_calls.sql`

**What it does:**

1. ✅ Renames `vapi_calls` → `scheduled_discharge_calls`
2. ✅ Adds `case_id` column (links calls to cases)
3. ✅ Adds `qstash_message_id` column (QStash tracking)
4. ✅ Updates status check constraint
5. ✅ Renames all indexes
6. ✅ Creates RLS policies
7. ✅ Adds column documentation

---

## Running the Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Make sure you're linked to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
npx supabase db push

# Regenerate TypeScript types
pnpm update-types
```

### Option 2: Using Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Open the migration file: `supabase/migrations/20251116000000_rename_vapi_calls_to_scheduled_discharge_calls.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click "Run"
6. Regenerate types locally: `pnpm update-types`

### Option 3: Manual SQL (If migration file has issues)

If you encounter errors, you can run commands individually:

```sql
-- 1. Rename table
ALTER TABLE vapi_calls RENAME TO scheduled_discharge_calls;

-- 2. Add case_id column
ALTER TABLE scheduled_discharge_calls
ADD COLUMN IF NOT EXISTS case_id uuid REFERENCES cases(id) ON DELETE CASCADE;

-- 3. Add qstash_message_id column
ALTER TABLE scheduled_discharge_calls
ADD COLUMN IF NOT EXISTS qstash_message_id text;

-- 4. Update status constraint (if exists)
ALTER TABLE scheduled_discharge_calls
DROP CONSTRAINT IF EXISTS vapi_calls_status_check;

ALTER TABLE scheduled_discharge_calls
ADD CONSTRAINT scheduled_discharge_calls_status_check
CHECK (status IN ('queued', 'ringing', 'in_progress', 'completed', 'failed', 'cancelled'));

-- 5. Rename indexes
ALTER INDEX IF EXISTS idx_vapi_calls_metadata RENAME TO idx_scheduled_calls_metadata;
ALTER INDEX IF EXISTS idx_vapi_calls_user_id RENAME TO idx_scheduled_calls_user_id;
ALTER INDEX IF EXISTS idx_vapi_calls_status RENAME TO idx_scheduled_calls_status;
ALTER INDEX IF EXISTS idx_vapi_calls_scheduled_for RENAME TO idx_scheduled_calls_scheduled_for;
ALTER INDEX IF EXISTS idx_vapi_calls_vapi_call_id RENAME TO idx_scheduled_calls_vapi_call_id;

-- 6. Create missing indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_case_id ON scheduled_discharge_calls(case_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_customer_phone ON scheduled_discharge_calls(customer_phone);
```

---

## Post-Migration Steps

### 1. Verify Table Structure

```sql
-- Check table exists with correct name
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'scheduled_discharge_calls';

-- Check columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'scheduled_discharge_calls'
ORDER BY ordinal_position;
```

### 2. Regenerate TypeScript Types

```bash
pnpm update-types
```

This will update `src/database.types.ts` with the new table name.

### 3. Test the Integration

Create a test discharge summary to verify AI extraction variables work:

```bash
POST /api/generate/discharge-summary
{
  "caseId": "your-case-uuid",
  "ownerPhone": "+15555551234",
  "vapiScheduledFor": "2025-01-20T10:00:00Z"
}
```

Check the logs for:

```
[GENERATE_SUMMARY] Entity extraction data
[GENERATE_SUMMARY] Using patient data
[SCHEDULE_CALL] Dynamic variables prepared
```

### 4. Verify VAPI Call Variables

```sql
SELECT
  id,
  customer_phone,
  dynamic_variables,
  metadata,
  status
FROM scheduled_discharge_calls
ORDER BY created_at DESC
LIMIT 1;
```

The `dynamic_variables` should now include AI-extracted fields like:

- `patient_name` (not "your pet")
- `owner_name_extracted`
- `primary_diagnosis`
- `medications_speech`
- etc.

---

## Rollback Plan (If Needed)

If you need to rollback the migration:

```sql
-- Rename table back
ALTER TABLE scheduled_discharge_calls RENAME TO vapi_calls;

-- Rename indexes back
ALTER INDEX IF EXISTS idx_scheduled_calls_metadata RENAME TO idx_vapi_calls_metadata;
ALTER INDEX IF EXISTS idx_scheduled_calls_user_id RENAME TO idx_vapi_calls_user_id;
ALTER INDEX IF EXISTS idx_scheduled_calls_status RENAME TO idx_vapi_calls_status;
ALTER INDEX IF EXISTS idx_scheduled_calls_scheduled_for RENAME TO idx_vapi_calls_scheduled_for;
ALTER INDEX IF EXISTS idx_scheduled_calls_vapi_call_id RENAME TO idx_vapi_calls_vapi_call_id;

-- Note: New columns (case_id, qstash_message_id) will remain but won't cause issues
```

Then revert the code changes and regenerate types.

---

## Common Issues

### Issue: "column qstash_message_id does not exist"

**Solution:** The migration adds this column. Make sure you run the full migration, not just the RENAME statement.

### Issue: "relation vapi_calls does not exist"

**Solution:** The table has already been renamed. Skip the migration or run the post-migration verification queries.

### Issue: TypeScript errors after migration

**Solution:** Regenerate types:

```bash
pnpm update-types
```

### Issue: Variables still showing as "your pet"

**Solution:**

1. Check that AI extraction data exists for the case
2. Verify `normalized_data` table has records
3. Check logs for extraction source
4. Ensure discharge summary has patient data to extract

---

## Timeline

**Estimated time:** 5-10 minutes

1. Run migration: 1-2 minutes
2. Regenerate types: 1 minute
3. Test integration: 3-5 minutes
4. Verify variables: 1-2 minutes

---

## Support

If you encounter issues:

1. Check logs in `[GENERATE_SUMMARY]` and `[SCHEDULE_CALL]` prefixes
2. Verify Supabase connection with: `npx supabase db ping`
3. Review migration file for any environment-specific issues
4. Check VAPI dashboard for assistant configuration

---

## Related Files

- `supabase/migrations/20251116000000_rename_vapi_calls_to_scheduled_discharge_calls.sql` - Migration
- `VAPI_SYSTEM_PROMPT.txt` - Updated assistant prompt
- `VAPI_AI_EXTRACTION_INTEGRATION_SUMMARY.md` - Implementation details
- `src/lib/vapi/extract-variables.ts` - Variable extraction logic

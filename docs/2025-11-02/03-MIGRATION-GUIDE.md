# Migration Guide: ODIS-134 & ODIS-135

**Documentation Date:** November 2, 2025
**Target Audience:** DevOps Engineers, Database Administrators, Backend Developers

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Pre-Migration Checklist](#pre-migration-checklist)
- [ODIS-134: Template Sharing Migration](#odis-134-template-sharing-migration)
- [ODIS-135: Case Sharing Migration](#odis-135-case-sharing-migration)
- [Post-Migration Verification](#post-migration-verification)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

## Overview

This guide provides step-by-step instructions for migrating your Supabase database to support template sharing (ODIS-134) and case sharing (ODIS-135) features.

### Migration Type
- **Schema Migration:** Additive only (no data modification)
- **Breaking Changes:** None
- **Downtime Required:** No
- **Rollback Support:** Manual (documented below)

### What Gets Migrated

**ODIS-134:**
- 2 new junction tables (soap_template_shares, discharge_template_shares)
- 4 new indexes
- 6 new RLS policies
- 2 updated RLS policies
- 2 trigger functions
- 2 triggers

**ODIS-135:**
- Similar structure (exact schema TBD)
- Expected: 1 new junction table (case_shares)
- Expected: 2 new indexes
- Expected: 3+ RLS policies

## Prerequisites

### System Requirements
- ✅ Supabase project (PostgreSQL 14+)
- ✅ Bash shell (macOS, Linux, WSL on Windows)
- ✅ curl installed
- ✅ Network access to Supabase API

### Access Requirements
- ✅ Supabase Service Role Key
- ✅ Database admin permissions
- ✅ Project admin access to Supabase Dashboard

### Backup Requirements
- ✅ Recent database backup (< 24 hours old)
- ✅ Backup verification completed
- ✅ Rollback plan documented

## Pre-Migration Checklist

### 1. Create Database Backup

**Via Supabase Dashboard:**
1. Navigate to Database → Backups
2. Click "Create Backup"
3. Wait for backup completion
4. Verify backup size and timestamp

**Via CLI (if available):**
```bash
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Verify Existing Schema

**Check required tables exist:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'temp_soap_templates',
    'temp_discharge_summary_templates',
    'cases'
);
```

**Expected Output:**
```
           table_name
---------------------------------
 temp_soap_templates
 temp_discharge_summary_templates
 cases
```

### 3. Check Current RLS Status

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'temp_soap_templates',
    'temp_discharge_summary_templates',
    'cases'
);
```

**Expected:** All tables should have `rowsecurity = true`

### 4. Obtain Service Role Key

**Supabase Dashboard:**
1. Navigate to Settings → API
2. Locate "Service Role Key" (secret)
3. Copy the key (starts with `eyJ...`)
4. Store securely (do NOT commit to git)

**Set Environment Variable:**
```bash
export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key-here'
```

**Verify:**
```bash
echo $SUPABASE_SERVICE_ROLE_KEY | wc -c
# Should be > 200 characters
```

### 5. Verify Network Connectivity

```bash
SUPABASE_URL="https://nndjdbdnhnhxkasjgxqk.supabase.co"

curl -s -I "$SUPABASE_URL" | head -n 1
# Expected: HTTP/2 200 or similar success response
```

## ODIS-134: Template Sharing Migration

### Step 1: Download Migration Script

**From Repository:**
```bash
cd /path/to/odis-ai-ios

# Verify script exists
ls -la apply_template_sharing_migration.sh

# Make executable
chmod +x apply_template_sharing_migration.sh
```

### Step 2: Review Migration Script

**Open and review:**
```bash
cat apply_template_sharing_migration.sh | less
```

**Verify:**
- ✅ Correct Supabase URL
- ✅ No hardcoded service role key
- ✅ Uses environment variable
- ✅ Has error handling

### Step 3: Dry Run (Optional but Recommended)

**Test environment variable:**
```bash
# This should fail with helpful error
unset SUPABASE_SERVICE_ROLE_KEY
./apply_template_sharing_migration.sh
# Expected: "❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set"

# Re-export for actual migration
export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key-here'
```

### Step 4: Execute Migration

**Run migration:**
```bash
./apply_template_sharing_migration.sh
```

**Monitor Output:**
```
=========================================
Template Sharing Migration Script
Project: nndjdbdnhnhxkasjgxqk
=========================================

Step 1: Creating soap_template_shares table
Executing: Create soap_template_shares table
Success: Create soap_template_shares table

Step 2: Creating discharge_template_shares table
Executing: Create discharge_template_shares table
Success: Create discharge_template_shares table

[... more steps ...]

=========================================
Migration completed successfully!
Template sharing infrastructure is now ready
=========================================
```

**Expected Duration:** 30-60 seconds

### Step 5: Verify Migration Success

**Check tables created:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%_shares';
```

**Expected Output:**
```
           table_name
---------------------------------
 soap_template_shares
 discharge_template_shares
```

**Check indexes:**
```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE '%_shares'
ORDER BY tablename, indexname;
```

**Expected Output:**
```
         tablename          |                  indexname
----------------------------+---------------------------------------------
 discharge_template_shares  | discharge_template_shares_pkey
 discharge_template_shares  | idx_discharge_template_shares_template_id
 discharge_template_shares  | idx_discharge_template_shares_shared_with_user_id
 soap_template_shares       | soap_template_shares_pkey
 soap_template_shares       | idx_soap_template_shares_template_id
 soap_template_shares       | idx_soap_template_shares_shared_with_user_id
```

**Check RLS enabled:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%_shares';
```

**Expected:** All should show `rowsecurity = true`

**Check policies:**
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE '%_shares'
ORDER BY tablename, policyname;
```

**Expected Output:**
```
 schemaname |         tablename          |           policyname
------------+----------------------------+--------------------------------
 public     | discharge_template_shares  | Template owners can create shares
 public     | discharge_template_shares  | Template owners can delete shares
 public     | discharge_template_shares  | Users can read their own template shares
 public     | soap_template_shares       | Template owners can create shares
 public     | soap_template_shares       | Template owners can delete shares
 public     | soap_template_shares       | Users can read their own template shares
```

**Check triggers:**
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table LIKE '%_shares';
```

**Expected Output:**
```
              trigger_name               |     event_object_table
-----------------------------------------+-----------------------------
 update_soap_template_shares_updated_at       | soap_template_shares
 update_discharge_template_shares_updated_at  | discharge_template_shares
```

## ODIS-135: Case Sharing Migration

### Migration Script Status

**Current Status:** Case sharing migration script not found in repository at `/Users/s0381806/Development/odis-ai-ios/`

### Expected Migration Steps

If migration script follows ODIS-134 pattern:

**1. Obtain Script:**
```bash
# Check if script exists
ls -la apply_case_sharing_migration.sh

# If not, migration may be in Supabase migrations folder
# Or may be applied directly via Supabase Dashboard
```

**2. Expected Script Structure:**
```bash
#!/bin/bash
SUPABASE_URL="https://nndjdbdnhnhxkasjgxqk.supabase.co"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

# Creates case_shares table
# Creates indexes
# Creates RLS policies
# Updates cases table policy
```

**3. Execute (when available):**
```bash
export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key-here'
./apply_case_sharing_migration.sh
```

### Manual Migration (Alternative)

If script not available, apply migration via Supabase SQL Editor:

**Create case_shares table:**
```sql
-- Step 1: Create table
CREATE TABLE IF NOT EXISTS public.case_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(case_id, shared_with_user_id)
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_case_shares_case_id
    ON public.case_shares(case_id);

CREATE INDEX IF NOT EXISTS idx_case_shares_shared_with_user_id
    ON public.case_shares(shared_with_user_id);

-- Step 3: Enable RLS
ALTER TABLE public.case_shares ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can read their own case shares"
    ON public.case_shares
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.cases c
            WHERE c.id = case_shares.case_id
            AND c.user_id = auth.uid()
        )
        OR
        shared_with_user_id = auth.uid()
    );

CREATE POLICY "Case owners can create shares"
    ON public.case_shares
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cases c
            WHERE c.id = case_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Case owners can delete shares"
    ON public.case_shares
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.cases c
            WHERE c.id = case_id
            AND c.user_id = auth.uid()
        )
    );

-- Step 5: Update cases table policy
DROP POLICY IF EXISTS "Users can read shared cases" ON public.cases;

CREATE POLICY "Users can read shared cases"
    ON public.cases
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM public.case_shares s
            WHERE s.case_id = cases.id
            AND s.shared_with_user_id = auth.uid()
        )
    );

-- Step 6: Create trigger function
CREATE OR REPLACE FUNCTION update_case_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 7: Create trigger
CREATE TRIGGER update_case_shares_updated_at
    BEFORE UPDATE ON public.case_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_case_shares_updated_at();

-- Step 8: Grant permissions
GRANT SELECT, INSERT, DELETE ON public.case_shares TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
```

## Post-Migration Verification

### Functional Testing

**1. Test Share Creation:**
```sql
-- As authenticated user, share a template you own
INSERT INTO soap_template_shares (template_id, shared_with_user_id)
VALUES (
    'your-template-uuid',
    'recipient-user-uuid'
);
-- Expected: Success
```

**2. Test Share Reading:**
```sql
-- As template owner
SELECT * FROM soap_template_shares
WHERE template_id = 'your-template-uuid';
-- Expected: Returns the share record

-- As recipient
SELECT * FROM temp_soap_templates
WHERE id = 'your-template-uuid';
-- Expected: Returns the template
```

**3. Test Share Deletion:**
```sql
-- As template owner
DELETE FROM soap_template_shares
WHERE template_id = 'your-template-uuid'
AND shared_with_user_id = 'recipient-user-uuid';
-- Expected: Success

-- Verify recipient no longer has access
SELECT * FROM temp_soap_templates
WHERE id = 'your-template-uuid';
-- Expected: No rows (as recipient)
```

**4. Test RLS Protection:**
```sql
-- As user who doesn't own the template
INSERT INTO soap_template_shares (template_id, shared_with_user_id)
VALUES (
    'someone-elses-template-uuid',
    'another-user-uuid'
);
-- Expected: Permission denied error
```

### Performance Testing

**1. Index Performance:**
```sql
EXPLAIN ANALYZE
SELECT * FROM soap_template_shares
WHERE template_id = 'test-uuid';
-- Expected: Index Scan using idx_soap_template_shares_template_id
-- Execution time: < 5ms
```

**2. Policy Performance:**
```sql
EXPLAIN ANALYZE
SELECT * FROM temp_soap_templates
WHERE id = 'test-uuid';
-- Expected: Policy evaluation with EXISTS subquery
-- Execution time: < 10ms
```

### Data Integrity Testing

**1. Unique Constraint:**
```sql
-- Insert duplicate share
INSERT INTO soap_template_shares (template_id, shared_with_user_id)
VALUES ('template-uuid', 'user-uuid');

-- Try again
INSERT INTO soap_template_shares (template_id, shared_with_user_id)
VALUES ('template-uuid', 'user-uuid');
-- Expected: ERROR: duplicate key value violates unique constraint
```

**2. Cascade Delete:**
```sql
-- Create share
INSERT INTO soap_template_shares (template_id, shared_with_user_id)
VALUES ('template-to-delete', 'user-uuid');

-- Delete template
DELETE FROM temp_soap_templates
WHERE id = 'template-to-delete';

-- Check share is gone
SELECT * FROM soap_template_shares
WHERE template_id = 'template-to-delete';
-- Expected: No rows (cascaded)
```

## Rollback Procedures

### When to Rollback

Rollback if:
- ❌ Migration script errors out midway
- ❌ RLS policies not working as expected
- ❌ Performance issues detected
- ❌ Data integrity problems
- ❌ Application errors after migration

### ODIS-134 Rollback

**Execute in Supabase SQL Editor:**

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS update_soap_template_shares_updated_at
    ON public.soap_template_shares;
DROP TRIGGER IF EXISTS update_discharge_template_shares_updated_at
    ON public.discharge_template_shares;

-- Drop trigger functions
DROP FUNCTION IF EXISTS update_soap_template_shares_updated_at();
DROP FUNCTION IF EXISTS update_discharge_template_shares_updated_at();

-- Drop policies from share tables
DROP POLICY IF EXISTS "Users can read their own template shares"
    ON public.soap_template_shares;
DROP POLICY IF EXISTS "Template owners can create shares"
    ON public.soap_template_shares;
DROP POLICY IF EXISTS "Template owners can delete shares"
    ON public.soap_template_shares;

DROP POLICY IF EXISTS "Users can read their own template shares"
    ON public.discharge_template_shares;
DROP POLICY IF EXISTS "Template owners can create shares"
    ON public.discharge_template_shares;
DROP POLICY IF EXISTS "Template owners can delete shares"
    ON public.discharge_template_shares;

-- Restore original template table policies
DROP POLICY IF EXISTS "Users can read shared soap templates"
    ON public.temp_soap_templates;

CREATE POLICY "Users can read own soap templates"
    ON public.temp_soap_templates
    FOR SELECT
    USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can read shared discharge templates"
    ON public.temp_discharge_summary_templates;

CREATE POLICY "Users can read own discharge templates"
    ON public.temp_discharge_summary_templates
    FOR SELECT
    USING (user_id = auth.uid()::text);

-- Drop share tables (CASCADE handles foreign keys)
DROP TABLE IF EXISTS public.soap_template_shares CASCADE;
DROP TABLE IF EXISTS public.discharge_template_shares CASCADE;

-- Verify rollback
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%_shares';
-- Expected: 0
```

### ODIS-135 Rollback

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS update_case_shares_updated_at
    ON public.case_shares;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_case_shares_updated_at();

-- Drop policies from case_shares
DROP POLICY IF EXISTS "Users can read their own case shares"
    ON public.case_shares;
DROP POLICY IF EXISTS "Case owners can create shares"
    ON public.case_shares;
DROP POLICY IF EXISTS "Case owners can delete shares"
    ON public.case_shares;

-- Restore original cases table policy
DROP POLICY IF EXISTS "Users can read shared cases"
    ON public.cases;

CREATE POLICY "Users can read own cases"
    ON public.cases
    FOR SELECT
    USING (user_id = auth.uid());

-- Drop case_shares table
DROP TABLE IF EXISTS public.case_shares CASCADE;
```

### Post-Rollback Verification

```sql
-- Verify tables removed
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%_shares';
-- Expected: Empty result

-- Verify original policies restored
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('temp_soap_templates', 'temp_discharge_summary_templates', 'cases');
-- Expected: Only original policies, no sharing policies
```

## Troubleshooting

### Issue: Environment Variable Not Set

**Error:**
```
❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set
```

**Solution:**
```bash
export SUPABASE_SERVICE_ROLE_KEY='your-actual-service-role-key'
./apply_template_sharing_migration.sh
```

### Issue: Permission Denied During Migration

**Error:**
```
Error: permission denied for schema public
```

**Solution:**
- Verify service role key is correct
- Check key has not expired
- Ensure using SERVICE role key, not ANON key
- Verify project URL is correct

### Issue: Table Already Exists

**Error:**
```
ERROR: relation "soap_template_shares" already exists
```

**Solution:**
```sql
-- Check if migration already ran
SELECT table_name FROM information_schema.tables
WHERE table_name = 'soap_template_shares';

-- If migration incomplete, may need to drop and re-run
-- Or use IF NOT EXISTS in script (already present)
```

### Issue: RLS Policies Not Working

**Symptom:** Users can see templates they shouldn't

**Diagnosis:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'temp_soap_templates';

-- Check policies exist
SELECT policyname FROM pg_policies
WHERE tablename = 'temp_soap_templates';
```

**Solution:**
```sql
-- Re-enable RLS if disabled
ALTER TABLE temp_soap_templates ENABLE ROW LEVEL SECURITY;

-- Re-create policy if missing
-- (Run relevant policy creation from migration script)
```

### Issue: Slow Query Performance

**Symptom:** Share queries taking > 100ms

**Diagnosis:**
```sql
EXPLAIN ANALYZE
SELECT * FROM temp_soap_templates t
JOIN soap_template_shares s ON t.id = s.template_id
WHERE s.shared_with_user_id = 'user-uuid';
```

**Solution:**
```sql
-- Verify indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename = 'soap_template_shares';

-- Re-create if missing
CREATE INDEX IF NOT EXISTS idx_soap_template_shares_shared_with_user_id
    ON soap_template_shares(shared_with_user_id);

-- Update statistics
ANALYZE soap_template_shares;
```

## Production Deployment

### Pre-Production Checklist

- [ ] Migration tested in development environment
- [ ] Migration tested in staging environment
- [ ] Database backup completed and verified
- [ ] Rollback procedure tested
- [ ] Team notified of migration window
- [ ] Monitoring alerts configured
- [ ] Rollback decision criteria defined

### Deployment Window

**Recommended:** During low-traffic period
**Estimated Downtime:** None (migration is online)
**Estimated Duration:** 1-2 minutes

### Deployment Steps

**1. Notify Team:**
```
Subject: Template Sharing Migration - [DATE] [TIME]
Body:
- Migration window: [START] - [END]
- Expected impact: None (online migration)
- Rollback available if needed
- Monitor for issues
```

**2. Final Backup:**
```bash
# Via Supabase Dashboard
# Database → Backups → Create Backup
# Verify completion before proceeding
```

**3. Execute Migration:**
```bash
export SUPABASE_SERVICE_ROLE_KEY='prod-service-role-key'
./apply_template_sharing_migration.sh 2>&1 | tee migration_log_$(date +%Y%m%d_%H%M%S).log
```

**4. Verify Migration:**
```bash
# Run verification SQL queries (see Post-Migration Verification)
# Check all tables, indexes, policies created
# Verify RLS working correctly
```

**5. Monitor Application:**
- Check error rates
- Monitor API response times
- Verify sharing functionality in UI
- Check Sentry/logging for errors

**6. Document Completion:**
```
Migration completed successfully at [TIMESTAMP]
- Tables created: 2
- Policies created: 6
- Triggers created: 2
- Duration: [ACTUAL DURATION]
- Issues: None | [LIST ISSUES]
```

### Post-Deployment Monitoring

**First 24 Hours:**
- [ ] Monitor error rates every hour
- [ ] Check query performance metrics
- [ ] Verify sharing functionality working
- [ ] Review user reports/feedback
- [ ] Check database metrics (CPU, memory, connections)

**First Week:**
- [ ] Monitor index usage statistics
- [ ] Check for slow queries related to sharing
- [ ] Review RLS policy performance
- [ ] Analyze sharing usage patterns
- [ ] Optimize if needed

## Summary

This migration guide provides comprehensive instructions for:
- ✅ Pre-migration verification
- ✅ Step-by-step migration execution
- ✅ Post-migration validation
- ✅ Rollback procedures
- ✅ Troubleshooting common issues
- ✅ Production deployment best practices

**Key Takeaways:**
1. Always backup before migration
2. Use environment variables for secrets
3. Verify each step completes successfully
4. Test RLS policies thoroughly
5. Have rollback procedure ready
6. Monitor post-deployment

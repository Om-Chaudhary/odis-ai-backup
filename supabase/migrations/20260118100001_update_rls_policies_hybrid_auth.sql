-- ============================================================================
-- MIGRATION: Update RLS Policies for Hybrid Auth (Examples)
-- ============================================================================
-- This migration demonstrates how to update RLS policies to work with both
-- Clerk JWTs (web) and Supabase Auth JWTs (iOS) using the helper functions
-- from 20260118100000_add_hybrid_auth_functions.sql
--
-- This migration updates policies for:
-- - cases table (critical table for case management)
-- - clinics table (clinic/organization data)
-- - user_clinic_access table (team management)
--
-- Pattern: Replace direct auth.uid() and clinic_name lookups with helper functions
--
-- Date: 2026-01-18
-- Phase: 4 of 8 (Clerk Integration)
-- ============================================================================

-- ============================================================================
-- 1. CASES TABLE - HYBRID AUTH POLICIES
-- ============================================================================
-- Cases must be accessible by:
-- - Super admins (all cases)
-- - Users in the same clinic (via clinic_id)
-- - Case owner (via user_id for backward compatibility)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view clinic cases" ON cases;
DROP POLICY IF EXISTS "Users can delete own cases" ON cases;
DROP POLICY IF EXISTS "Users can insert cases" ON cases;
DROP POLICY IF EXISTS "Users can update cases" ON cases;

-- SELECT: Users can view cases in their clinic
CREATE POLICY "Users can view clinic cases" ON cases
FOR SELECT
USING (
  -- Super admins can see all cases
  auth.is_super_admin()
  OR
  -- Users can see cases in their clinic
  user_has_clinic_access(clinic_id)
  OR
  -- Legacy: Users can see cases they own (iOS app backward compatibility)
  user_id = auth.uid()
);

COMMENT ON POLICY "Users can view clinic cases" ON cases IS
  'Hybrid auth: Allows super admins, clinic members (Clerk or Supabase), and case owners to view cases.';

-- INSERT: Users can create cases in their clinic
CREATE POLICY "Users can insert cases" ON cases
FOR INSERT
WITH CHECK (
  -- Must have access to the clinic
  user_has_clinic_access(clinic_id)
);

COMMENT ON POLICY "Users can insert cases" ON cases IS
  'Hybrid auth: Users can create cases in clinics they have access to.';

-- UPDATE: Users can update cases in their clinic
CREATE POLICY "Users can update cases" ON cases
FOR UPDATE
USING (
  -- Super admins can update all cases
  auth.is_super_admin()
  OR
  -- Users can update cases in their clinic
  user_has_clinic_access(clinic_id)
  OR
  -- Legacy: Users can update their own cases
  user_id = auth.uid()
);

COMMENT ON POLICY "Users can update cases" ON cases IS
  'Hybrid auth: Allows super admins, clinic members, and case owners to update cases.';

-- DELETE: Users can delete their own cases or admins can delete clinic cases
CREATE POLICY "Users can delete cases" ON cases
FOR DELETE
USING (
  -- Super admins can delete all cases
  auth.is_super_admin()
  OR
  -- Clinic owners/admins can delete clinic cases
  (
    user_has_clinic_access(clinic_id)
    AND auth.is_org_owner_or_admin()
  )
  OR
  -- Legacy: Users can delete their own cases
  user_id = auth.uid()
);

COMMENT ON POLICY "Users can delete cases" ON cases IS
  'Hybrid auth: Super admins, clinic admins/owners, and case owners can delete cases.';

-- ============================================================================
-- 2. CLINICS TABLE - HYBRID AUTH POLICIES
-- ============================================================================
-- Clinics should be accessible by:
-- - Super admins (all clinics)
-- - Clinic members (their own clinic)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view clinics" ON clinics;
DROP POLICY IF EXISTS "Users can view own clinic" ON clinics;
DROP POLICY IF EXISTS "Users can update clinic" ON clinics;
DROP POLICY IF EXISTS "Owners can manage clinic" ON clinics;

-- SELECT: Users can view their clinic
CREATE POLICY "Users can view own clinic" ON clinics
FOR SELECT
USING (
  -- Super admins can see all clinics
  auth.is_super_admin()
  OR
  -- Users can see clinics they have access to
  user_has_clinic_access(id)
);

COMMENT ON POLICY "Users can view own clinic" ON clinics IS
  'Hybrid auth: Users can view clinics they belong to. Super admins see all.';

-- UPDATE: Owners/admins can update clinic settings
CREATE POLICY "Owners can update clinic" ON clinics
FOR UPDATE
USING (
  -- Super admins can update all clinics
  auth.is_super_admin()
  OR
  -- Clinic owners/admins can update their clinic
  (
    user_has_clinic_access(id)
    AND auth.is_org_owner_or_admin()
  )
);

COMMENT ON POLICY "Owners can update clinic" ON clinics IS
  'Hybrid auth: Super admins and clinic owners/admins can update clinic settings.';

-- ============================================================================
-- 3. USER_CLINIC_ACCESS TABLE - HYBRID AUTH POLICIES
-- ============================================================================
-- Team management: Who can view/modify clinic membership

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view team" ON user_clinic_access;
DROP POLICY IF EXISTS "Owners can manage team" ON user_clinic_access;

-- SELECT: Users can view their clinic's team
CREATE POLICY "Users can view team" ON user_clinic_access
FOR SELECT
USING (
  -- Super admins can see all access grants
  auth.is_super_admin()
  OR
  -- Users can see their own access records
  user_id = auth.uid()
  OR
  -- Clerk users can see members of their org
  (
    auth.jwt()->>'org_id' IS NOT NULL
    AND clinic_id IN (
      SELECT id FROM clinics
      WHERE clerk_org_id = auth.jwt()->>'org_id'
    )
  )
  OR
  -- Clerk users (compact format)
  (
    auth.jwt()->'o'->>'id' IS NOT NULL
    AND clinic_id IN (
      SELECT id FROM clinics
      WHERE clerk_org_id = auth.jwt()->'o'->>'id'
    )
  )
  OR
  -- Supabase Auth users can see their clinic's team
  clinic_id IN (
    SELECT clinic_id FROM user_clinic_access
    WHERE user_id = auth.uid()
  )
);

COMMENT ON POLICY "Users can view team" ON user_clinic_access IS
  'Hybrid auth: Users can view their own access and their clinic team members.';

-- INSERT/UPDATE/DELETE: Only owners/admins can manage team
CREATE POLICY "Owners can manage team" ON user_clinic_access
FOR ALL
USING (
  -- Super admins can manage all access
  auth.is_super_admin()
  OR
  -- Clinic owners/admins can manage their clinic's team
  (
    user_has_clinic_access(clinic_id)
    AND auth.is_org_owner_or_admin()
  )
);

COMMENT ON POLICY "Owners can manage team" ON user_clinic_access IS
  'Hybrid auth: Super admins and clinic owners/admins can manage team membership.';

-- ============================================================================
-- 4. EXAMPLE: PATIENTS TABLE POLICY (if needed)
-- ============================================================================
-- Uncomment and adjust if you need to update patients table policies

-- DROP POLICY IF EXISTS "Users can view patients" ON patients;
--
-- CREATE POLICY "Users can view clinic patients" ON patients
-- FOR SELECT
-- USING (
--   auth.is_super_admin()
--   OR
--   user_has_clinic_access(clinic_id)
--   OR
--   -- Legacy: case-level access
--   case_id IN (SELECT id FROM cases WHERE user_id = auth.uid())
-- );

-- ============================================================================
-- 5. MIGRATION VERIFICATION
-- ============================================================================
-- After applying this migration, test:
--
-- 1. As Clerk user (web app):
--    - Sign in with Clerk
--    - Verify you can see cases in your organization
--    - Verify you can create a new case
--    - Verify you can update cases in your org
--    - Verify you can see your clinic settings
--    - If owner/admin: Verify you can update clinic settings
--    - If owner/admin: Verify you can see team members
--
-- 2. As Supabase Auth user (iOS app):
--    - Sign in with Supabase Auth
--    - Verify you can see cases in your clinic (via user_clinic_access)
--    - Verify you can create a new case
--    - Verify you can update your cases
--    - Verify you can see your clinic settings
--    - If owner/admin: Verify you can update clinic settings
--
-- 3. As super admin:
--    - Sign in as admin user
--    - Verify you can see ALL cases across all clinics
--    - Verify you can see ALL clinics
--    - Verify you can manage any clinic's team
--
-- ============================================================================
-- PATTERN SUMMARY
-- ============================================================================
-- To update other RLS policies for hybrid auth, follow this pattern:
--
-- BEFORE (Supabase Auth only):
-- ----------------------------------------
-- CREATE POLICY "policy_name" ON table_name
-- FOR SELECT
-- USING (
--   clinic_name = (SELECT clinic_name FROM public.users WHERE id = auth.uid())
--   OR user_id = auth.uid()
-- );
--
-- AFTER (Hybrid Auth):
-- ----------------------------------------
-- CREATE POLICY "policy_name" ON table_name
-- FOR SELECT
-- USING (
--   auth.is_super_admin()
--   OR user_has_clinic_access(clinic_id)
--   OR user_id = auth.uid()  -- Backward compatibility
-- );
--
-- Key changes:
-- 1. Always check auth.is_super_admin() first
-- 2. Use user_has_clinic_access(clinic_id) instead of clinic_name lookups
-- 3. Keep user_id = auth.uid() for backward compatibility
-- 4. Use auth.is_org_owner_or_admin() for permission checks
-- 5. Use auth.is_veterinarian() for medical decision features
-- ============================================================================

-- ============================================================================
-- MIGRATION: Fix RLS Policies for Clerk JWT UUID Compatibility
-- ============================================================================
--
-- PROBLEM:
-- Supabase's auth.uid() function casts the JWT 'sub' claim to UUID:
--   SELECT current_setting('request.jwt.claim.sub', true)::uuid
--
-- For Clerk JWTs, 'sub' is a string like 'user_38T36jdfwOV5aWIXxUcfj5k2nQP'
-- which cannot be cast to UUID, causing:
--   "invalid input syntax for type uuid"
--
-- SOLUTION:
-- 1. Create auth.safe_uid() that returns NULL for non-UUID subjects
-- 2. Create auth.is_clerk_jwt() helper to check JWT type
-- 3. Update RLS policies to use safe comparisons
--
-- Date: 2026-01-29
-- ============================================================================

-- ============================================================================
-- 1. HELPER FUNCTION: Check if current JWT is a Clerk JWT
-- ============================================================================
CREATE OR REPLACE FUNCTION auth.is_clerk_jwt()
RETURNS BOOLEAN AS $$
  SELECT
    -- Clerk JWTs have 'o' claim (compact format) or 'org_id' claim
    auth.jwt()->'o' IS NOT NULL
    OR auth.jwt()->>'org_id' IS NOT NULL
    -- Or check issuer contains 'clerk'
    OR (auth.jwt()->>'iss' ILIKE '%clerk%')
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.is_clerk_jwt IS
  'Returns true if the current JWT is from Clerk (has org claims or clerk issuer)';

-- ============================================================================
-- 2. HELPER FUNCTION: Safe UUID getter that returns NULL for Clerk JWTs
-- ============================================================================
CREATE OR REPLACE FUNCTION auth.safe_uid()
RETURNS UUID AS $$
BEGIN
  -- If this is a Clerk JWT, return NULL (Clerk users use clerk_user_id, not UUID)
  IF auth.is_clerk_jwt() THEN
    RETURN NULL;
  END IF;

  -- For Supabase Auth, safely try to get the UUID
  BEGIN
    RETURN NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    -- If casting fails, return NULL
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.safe_uid IS
  'Returns auth.uid() for Supabase Auth users, NULL for Clerk users. ' ||
  'Prevents UUID cast errors when using Clerk JWTs.';

-- ============================================================================
-- 3. UPDATE CASES TABLE RLS POLICIES
-- ============================================================================
-- Replace user_id = auth.uid() with user_id = auth.safe_uid()

DROP POLICY IF EXISTS "Users can view clinic cases" ON cases;
DROP POLICY IF EXISTS "Users can insert cases" ON cases;
DROP POLICY IF EXISTS "Users can update cases" ON cases;
DROP POLICY IF EXISTS "Users can delete cases" ON cases;
DROP POLICY IF EXISTS cases_select ON cases;
DROP POLICY IF EXISTS cases_insert ON cases;
DROP POLICY IF EXISTS cases_update ON cases;
DROP POLICY IF EXISTS cases_delete ON cases;

-- SELECT policy
CREATE POLICY "Users can view clinic cases" ON cases
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_has_clinic_access(clinic_id)
  OR user_id = auth.safe_uid()  -- Safe: returns NULL for Clerk, UUID for Supabase
);

COMMENT ON POLICY "Users can view clinic cases" ON cases IS
  'Hybrid auth: Super admins, clinic members, and case owners can view cases. ' ||
  'Uses auth.safe_uid() to avoid UUID cast errors with Clerk JWTs.';

-- INSERT policy
CREATE POLICY "Users can insert cases" ON cases
FOR INSERT
WITH CHECK (
  user_has_clinic_access(clinic_id)
);

COMMENT ON POLICY "Users can insert cases" ON cases IS
  'Hybrid auth: Users can create cases in clinics they have access to.';

-- UPDATE policy
CREATE POLICY "Users can update cases" ON cases
FOR UPDATE
USING (
  auth.is_super_admin()
  OR user_has_clinic_access(clinic_id)
  OR user_id = auth.safe_uid()
);

COMMENT ON POLICY "Users can update cases" ON cases IS
  'Hybrid auth: Super admins, clinic members, and case owners can update cases. ' ||
  'Uses auth.safe_uid() to avoid UUID cast errors with Clerk JWTs.';

-- DELETE policy
CREATE POLICY "Users can delete cases" ON cases
FOR DELETE
USING (
  auth.is_super_admin()
  OR (user_has_clinic_access(clinic_id) AND auth.is_org_owner_or_admin())
  OR user_id = auth.safe_uid()
);

COMMENT ON POLICY "Users can delete cases" ON cases IS
  'Hybrid auth: Super admins, clinic admins/owners, and case owners can delete cases. ' ||
  'Uses auth.safe_uid() to avoid UUID cast errors with Clerk JWTs.';

-- ============================================================================
-- 4. UPDATE USER_CLINIC_ACCESS TABLE RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view team" ON user_clinic_access;
DROP POLICY IF EXISTS "Owners can manage team" ON user_clinic_access;

-- SELECT: Users can view their clinic's team
CREATE POLICY "Users can view team" ON user_clinic_access
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_id = auth.safe_uid()
  OR (
    auth.jwt()->>'org_id' IS NOT NULL
    AND clinic_id IN (
      SELECT id FROM clinics WHERE clerk_org_id = auth.jwt()->>'org_id'
    )
  )
  OR (
    auth.jwt()->'o'->>'id' IS NOT NULL
    AND clinic_id IN (
      SELECT id FROM clinics WHERE clerk_org_id = auth.jwt()->'o'->>'id'
    )
  )
  OR clinic_id IN (
    SELECT uca.clinic_id FROM user_clinic_access uca
    WHERE uca.user_id = auth.safe_uid()
  )
);

COMMENT ON POLICY "Users can view team" ON user_clinic_access IS
  'Hybrid auth: Users can view their own access and clinic team members. ' ||
  'Uses auth.safe_uid() for Supabase Auth compatibility.';

-- INSERT/UPDATE/DELETE: Owners/admins can manage team
CREATE POLICY "Owners can manage team" ON user_clinic_access
FOR ALL
USING (
  auth.is_super_admin()
  OR (user_has_clinic_access(clinic_id) AND auth.is_org_owner_or_admin())
);

COMMENT ON POLICY "Owners can manage team" ON user_clinic_access IS
  'Hybrid auth: Super admins and clinic owners/admins can manage team membership.';

-- ============================================================================
-- 5. UPDATE SCHEDULED_CALLS TABLE RLS POLICIES (if exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_calls') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view scheduled calls" ON scheduled_calls;
    DROP POLICY IF EXISTS "Users can manage scheduled calls" ON scheduled_calls;

    -- SELECT policy
    EXECUTE '
      CREATE POLICY "Users can view scheduled calls" ON scheduled_calls
      FOR SELECT
      USING (
        auth.is_super_admin()
        OR case_id IN (SELECT id FROM cases WHERE user_has_clinic_access(clinic_id))
      )
    ';

    -- INSERT/UPDATE/DELETE policy
    EXECUTE '
      CREATE POLICY "Users can manage scheduled calls" ON scheduled_calls
      FOR ALL
      USING (
        auth.is_super_admin()
        OR case_id IN (SELECT id FROM cases WHERE user_has_clinic_access(clinic_id))
      )
    ';
  END IF;
END $$;

-- ============================================================================
-- 6. UPDATE SCHEDULED_EMAILS TABLE RLS POLICIES (if exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_emails') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view scheduled emails" ON scheduled_emails;
    DROP POLICY IF EXISTS "Users can manage scheduled emails" ON scheduled_emails;

    -- SELECT policy
    EXECUTE '
      CREATE POLICY "Users can view scheduled emails" ON scheduled_emails
      FOR SELECT
      USING (
        auth.is_super_admin()
        OR case_id IN (SELECT id FROM cases WHERE user_has_clinic_access(clinic_id))
      )
    ';

    -- INSERT/UPDATE/DELETE policy
    EXECUTE '
      CREATE POLICY "Users can manage scheduled emails" ON scheduled_emails
      FOR ALL
      USING (
        auth.is_super_admin()
        OR case_id IN (SELECT id FROM cases WHERE user_has_clinic_access(clinic_id))
      )
    ';
  END IF;
END $$;

-- ============================================================================
-- 7. UPDATE OWNERS TABLE RLS POLICIES (if exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'owners') THEN
    DROP POLICY IF EXISTS "Users can view owners" ON owners;
    DROP POLICY IF EXISTS "Users can manage owners" ON owners;

    EXECUTE '
      CREATE POLICY "Users can view owners" ON owners
      FOR SELECT
      USING (
        auth.is_super_admin()
        OR id IN (SELECT owner_id FROM cases WHERE user_has_clinic_access(clinic_id))
      )
    ';

    EXECUTE '
      CREATE POLICY "Users can manage owners" ON owners
      FOR ALL
      USING (
        auth.is_super_admin()
        OR id IN (SELECT owner_id FROM cases WHERE user_has_clinic_access(clinic_id))
      )
    ';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Test with a Clerk JWT to verify:
--   SELECT auth.is_clerk_jwt();  -- Should return TRUE
--   SELECT auth.safe_uid();      -- Should return NULL (not error)
--   SELECT * FROM cases LIMIT 1; -- Should work without UUID error
-- ============================================================================

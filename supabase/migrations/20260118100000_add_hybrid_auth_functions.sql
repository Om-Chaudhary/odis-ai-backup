-- ============================================================================
-- MIGRATION: Add Hybrid Auth Helper Functions (Clerk + Supabase)
-- ============================================================================
-- This migration creates SQL helper functions that work with BOTH:
-- - Clerk JWTs (web app users)
-- - Supabase Auth JWTs (iOS app users)
--
-- This enables incremental migration where:
-- - Web app uses Clerk authentication
-- - iOS app continues using Supabase Auth
-- - RLS policies work seamlessly with both JWT types
--
-- Date: 2026-01-18
-- Phase: 4 of 8 (Clerk Integration)
-- ============================================================================

-- ============================================================================
-- 1. HYBRID USER ID FUNCTION
-- ============================================================================
-- Gets the current user's ID from either Clerk JWT or Supabase Auth JWT
--
-- JWT Sources:
-- - Clerk JWT: Uses 'sub' claim (Clerk user ID)
-- - Supabase JWT: Uses auth.uid() (Supabase user ID)
--
-- Returns:
-- - Clerk user ID (TEXT) for Clerk-authenticated users
-- - Supabase user ID (UUID::TEXT) for Supabase-authenticated users
-- - NULL if not authenticated
-- ============================================================================
CREATE OR REPLACE FUNCTION auth.current_user_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    -- Clerk JWT: 'sub' claim contains Clerk user ID
    auth.jwt()->>'sub',
    -- Supabase JWT: auth.uid() returns UUID
    auth.uid()::text
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.current_user_id IS
  'Returns user ID from either Clerk JWT (sub claim) or Supabase Auth JWT (auth.uid). ' ||
  'Works with both authentication systems during incremental migration.';

-- ============================================================================
-- 2. HYBRID ORGANIZATION/CLINIC ID FUNCTION
-- ============================================================================
-- Gets the current user's active organization/clinic ID from JWT
--
-- JWT Sources (checked in order):
-- 1. Clerk JWT (standard format): 'org_id' claim
-- 2. Clerk JWT (compact format): 'o.id' claim
-- 3. Supabase JWT: Query user_clinic_access for primary clinic
--
-- Returns:
-- - Clerk organization ID (TEXT) for Clerk users with active org
-- - Clinic UUID (TEXT) for Supabase Auth users via junction table
-- - NULL if user has no active organization/clinic
-- ============================================================================
CREATE OR REPLACE FUNCTION auth.current_org_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    -- Clerk JWT (standard format): org_id claim
    auth.jwt()->>'org_id',
    -- Clerk JWT (compact format): o.id claim
    auth.jwt()->'o'->>'id',
    -- Supabase Auth: Get primary clinic from user_clinic_access
    (
      SELECT clinic_id::text
      FROM user_clinic_access
      WHERE user_id = auth.uid()
      AND is_primary = true
      LIMIT 1
    )
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.current_org_id IS
  'Returns organization/clinic ID from Clerk JWT (org_id or o.id claim) or ' ||
  'primary clinic from user_clinic_access for Supabase Auth users. ' ||
  'Used for multi-tenant data filtering in RLS policies.';

-- ============================================================================
-- 3. HYBRID ORGANIZATION ROLE FUNCTION
-- ============================================================================
-- Gets the current user's role within their active organization
--
-- JWT Sources (checked in order):
-- 1. Clerk JWT (standard format): 'org_role' claim (e.g., 'org:owner', 'org:member')
-- 2. Clerk JWT (compact format): 'o.rol' claim
-- 3. Supabase JWT: Query user_clinic_access for role in primary clinic
--
-- Returns:
-- - Clerk role (TEXT) for Clerk users (e.g., 'org:owner', 'org:veterinarian')
-- - ODIS AI role (TEXT) for Supabase users (e.g., 'owner', 'veterinarian', 'member')
-- - NULL if user has no active organization
-- ============================================================================
CREATE OR REPLACE FUNCTION auth.current_org_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    -- Clerk JWT (standard format): org_role claim
    auth.jwt()->>'org_role',
    -- Clerk JWT (compact format): o.rol claim
    auth.jwt()->'o'->>'rol',
    -- Supabase Auth: Get role from user_clinic_access
    (
      SELECT role::text
      FROM user_clinic_access
      WHERE user_id = auth.uid()
      AND is_primary = true
      LIMIT 1
    )
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.current_org_role IS
  'Returns organization role from Clerk JWT (org_role or o.rol claim) or ' ||
  'clinic role from user_clinic_access for Supabase Auth users. ' ||
  'Used for role-based access control in RLS policies.';

-- ============================================================================
-- 4. SUPER ADMIN CHECK FUNCTION
-- ============================================================================
-- Checks if the current user is a super admin (ODIS AI staff)
--
-- Super admins have system-wide access across all clinics.
-- This is stored in users.role = 'admin' (not organization-level roles).
--
-- Checks:
-- 1. For Clerk users: Looks up users table by clerk_user_id
-- 2. For Supabase users: Looks up users table by id (auth.uid)
--
-- Returns:
-- - TRUE if user has admin role
-- - FALSE otherwise
-- ============================================================================
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE (
      -- Check Clerk user
      clerk_user_id = auth.jwt()->>'sub'
      OR
      -- Check Supabase user
      id = auth.uid()
    )
    AND role = 'admin'
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.is_super_admin IS
  'Returns true if current user is a super admin (users.role = admin). ' ||
  'Super admins have system-wide access across all clinics. ' ||
  'Works with both Clerk and Supabase Auth.';

-- ============================================================================
-- 5. HYBRID CLINIC ACCESS CHECK FUNCTION
-- ============================================================================
-- Checks if the current user has access to a specific clinic
--
-- This updates the existing user_has_clinic_access() function to support Clerk.
--
-- Access is granted if ANY of these conditions are true:
-- 1. User is a super admin (system-wide access)
-- 2. Clerk user's active org_id matches clinic's clerk_org_id
-- 3. User has explicit access via user_clinic_access junction table
--
-- Parameters:
-- - p_clinic_id: UUID of the clinic to check access for
--
-- Returns:
-- - TRUE if user has access to the clinic
-- - FALSE otherwise
-- ============================================================================
CREATE OR REPLACE FUNCTION user_has_clinic_access(p_clinic_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admins always have access
  IF auth.is_super_admin() THEN
    RETURN TRUE;
  END IF;

  -- Check if Clerk user's active org matches clinic's Clerk org
  IF auth.jwt()->>'org_id' IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM clinics
      WHERE id = p_clinic_id
      AND clerk_org_id = auth.jwt()->>'org_id'
    );
  END IF;

  -- Check if Clerk user (compact format) org matches clinic
  IF auth.jwt()->'o'->>'id' IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM clinics
      WHERE id = p_clinic_id
      AND clerk_org_id = auth.jwt()->'o'->>'id'
    );
  END IF;

  -- Fallback: Check user_clinic_access for Supabase Auth users
  RETURN EXISTS (
    SELECT 1 FROM user_clinic_access
    WHERE user_id = auth.uid()
    AND clinic_id = p_clinic_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_has_clinic_access IS
  'Returns true if current user has access to the specified clinic. ' ||
  'Supports super admins, Clerk org members (via clerk_org_id), ' ||
  'and Supabase Auth users (via user_clinic_access table).';

-- ============================================================================
-- 6. ROLE-BASED ACCESS CHECK FUNCTIONS
-- ============================================================================
-- Helper functions for common role-based access patterns

-- Check if user has owner or admin role in current org
CREATE OR REPLACE FUNCTION auth.is_org_owner_or_admin()
RETURNS BOOLEAN AS $$
  SELECT auth.current_org_role() IN (
    -- Clerk roles
    'org:owner', 'org:admin',
    -- ODIS AI roles (Supabase Auth)
    'owner', 'admin'
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.is_org_owner_or_admin IS
  'Returns true if current user is an owner or admin in their active organization. ' ||
  'Checks both Clerk roles (org:owner, org:admin) and ODIS AI roles (owner, admin).';

-- Check if user has veterinarian role (can make medical decisions)
CREATE OR REPLACE FUNCTION auth.is_veterinarian()
RETURNS BOOLEAN AS $$
  SELECT auth.current_org_role() IN (
    -- Clerk roles
    'org:owner', 'org:admin', 'org:veterinarian',
    -- ODIS AI roles (Supabase Auth)
    'owner', 'admin', 'veterinarian'
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.is_veterinarian IS
  'Returns true if current user can make medical decisions (veterinarian, admin, or owner). ' ||
  'Used for features like discharge approval. Works with both Clerk and Supabase Auth.';

-- ============================================================================
-- 7. MIGRATION VERIFICATION
-- ============================================================================
-- Test queries to verify hybrid auth functions work

-- Test 1: Current user ID should return something for authenticated users
-- SELECT auth.current_user_id();

-- Test 2: Current org ID should return clinic/org ID
-- SELECT auth.current_org_id();

-- Test 3: Current org role should return user's role
-- SELECT auth.current_org_role();

-- Test 4: Super admin check
-- SELECT auth.is_super_admin();

-- Test 5: Clinic access check (replace with actual clinic UUID)
-- SELECT user_has_clinic_access('00000000-0000-0000-0000-000000000000'::uuid);

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- After applying this migration:
--
-- 1. Test with Clerk JWT:
--    - Sign in via web app with Clerk
--    - Verify auth.current_user_id() returns Clerk user ID
--    - Verify auth.current_org_id() returns Clerk org ID
--    - Verify auth.current_org_role() returns Clerk role (e.g., 'org:owner')
--
-- 2. Test with Supabase JWT:
--    - Sign in via iOS app with Supabase Auth
--    - Verify auth.current_user_id() returns Supabase user UUID
--    - Verify auth.current_org_id() returns clinic UUID from user_clinic_access
--    - Verify auth.current_org_role() returns ODIS AI role (e.g., 'owner')
--
-- 3. Update RLS policies to use these functions:
--    - Replace direct auth.uid() calls with auth.current_user_id()
--    - Replace clinic_name lookups with auth.current_org_id()
--    - Use auth.is_org_owner_or_admin() for permission checks
--
-- See: docs/authentication/PHASE_4_RLS_UPDATES.md
-- ============================================================================

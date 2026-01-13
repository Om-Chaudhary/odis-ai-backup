-- Create user_clinic_access junction table for multi-clinic user access
-- This enables users to have access to multiple clinics with different roles
-- Replaces the single clinic_name text field pattern with a many-to-many relationship

-- ============================================================================
-- USER_CLINIC_ACCESS TABLE
-- ============================================================================
CREATE TABLE user_clinic_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',  -- 'owner' | 'admin' | 'member' | 'viewer'
  is_primary boolean NOT NULL DEFAULT false,  -- Primary clinic for the user (used as default)
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- Who granted access
  granted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Each user can only have one access record per clinic
  UNIQUE(user_id, clinic_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Primary lookup: find all clinics a user has access to
CREATE INDEX idx_user_clinic_access_user_id ON user_clinic_access(user_id);

-- Find all users with access to a clinic
CREATE INDEX idx_user_clinic_access_clinic_id ON user_clinic_access(clinic_id);

-- Find primary clinic for a user quickly
CREATE INDEX idx_user_clinic_access_primary ON user_clinic_access(user_id, is_primary) WHERE is_primary = true;

-- Role-based queries (e.g., find all admins of a clinic)
CREATE INDEX idx_user_clinic_access_clinic_role ON user_clinic_access(clinic_id, role);

-- Lookup by granter for audit purposes
CREATE INDEX idx_user_clinic_access_granted_by ON user_clinic_access(granted_by);

-- ============================================================================
-- ENSURE SINGLE PRIMARY CLINIC PER USER
-- ============================================================================
-- Function to ensure only one primary clinic per user
CREATE OR REPLACE FUNCTION ensure_single_primary_clinic()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this record as primary, unset any other primary for this user
  IF NEW.is_primary = true THEN
    UPDATE user_clinic_access
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_primary_clinic
  BEFORE INSERT OR UPDATE ON user_clinic_access
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_clinic();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE user_clinic_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own clinic access records
CREATE POLICY "Users can view their own clinic access"
  ON user_clinic_access
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    -- Users can see other members of clinics they have access to
    EXISTS (
      SELECT 1 FROM user_clinic_access uca
      WHERE uca.user_id = auth.uid()
      AND uca.clinic_id = user_clinic_access.clinic_id
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Admins can manage clinic access
CREATE POLICY "Admins can manage clinic access"
  ON user_clinic_access
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'practice_owner')
    )
  );

-- Service role can manage clinic access (for webhooks, background jobs)
CREATE POLICY "Service role can manage clinic access"
  ON user_clinic_access
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- BACKFILL EXISTING USERS
-- ============================================================================
-- Migrate existing users from their clinic_name to the junction table
-- This preserves existing access and sets their current clinic as primary

INSERT INTO user_clinic_access (user_id, clinic_id, role, is_primary, granted_at)
SELECT
  u.id AS user_id,
  c.id AS clinic_id,
  CASE
    WHEN u.role = 'practice_owner' THEN 'owner'
    WHEN u.role = 'admin' THEN 'admin'
    ELSE 'member'
  END AS role,
  true AS is_primary,  -- Their current clinic becomes their primary
  u.created_at AS granted_at
FROM users u
JOIN clinics c ON c.name = u.clinic_name
WHERE u.clinic_name IS NOT NULL
  AND u.clinic_name != ''
ON CONFLICT (user_id, clinic_id) DO NOTHING;

-- ============================================================================
-- GRANT MULTI-CLINIC ACCESS
-- ============================================================================
-- Grant garrybath@hotmail.com access to Del Valle Pet Hospital
-- User ID: c51bffe0-0f84-4560-8354-2fa65d646f28
-- Clinic ID (Del Valle Pet Hospital): cf9d40fc-8bd3-415a-b4ab-57d99870e139

INSERT INTO user_clinic_access (user_id, clinic_id, role, is_primary, granted_at)
VALUES (
  'c51bffe0-0f84-4560-8354-2fa65d646f28',  -- garrybath@hotmail.com
  'cf9d40fc-8bd3-415a-b4ab-57d99870e139',  -- Del Valle Pet Hospital
  'member',
  false,  -- Not primary (they already have Alum Rock as primary from backfill)
  now()
)
ON CONFLICT (user_id, clinic_id) DO NOTHING;

-- ============================================================================
-- TABLE AND COLUMN COMMENTS
-- ============================================================================
COMMENT ON TABLE user_clinic_access IS 'Junction table enabling multi-clinic access for users. Replaces single clinic_name pattern with many-to-many relationship.';
COMMENT ON COLUMN user_clinic_access.user_id IS 'Reference to auth.users - the user being granted access';
COMMENT ON COLUMN user_clinic_access.clinic_id IS 'Reference to clinics - the clinic being accessed';
COMMENT ON COLUMN user_clinic_access.role IS 'User role within this clinic: owner, admin, member, or viewer';
COMMENT ON COLUMN user_clinic_access.is_primary IS 'Whether this is the users primary/default clinic. Only one primary per user.';
COMMENT ON COLUMN user_clinic_access.granted_by IS 'User who granted this access (null for system-created records)';
COMMENT ON COLUMN user_clinic_access.granted_at IS 'When access was granted';

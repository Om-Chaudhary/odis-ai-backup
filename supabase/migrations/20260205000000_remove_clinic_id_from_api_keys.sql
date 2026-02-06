-- Migration: Remove legacy clinic_id column from clinic_api_keys
-- All API keys are now shared; clinicId comes from request body

-- Drop the foreign key constraint first
ALTER TABLE clinic_api_keys
  DROP CONSTRAINT IF EXISTS clinic_api_keys_clinic_id_fkey;

-- Drop ALL RLS policies that reference clinic_id
DROP POLICY IF EXISTS "Users can view API keys for their clinic" ON clinic_api_keys;
DROP POLICY IF EXISTS "Practice owners can manage API keys for their clinic" ON clinic_api_keys;
DROP POLICY IF EXISTS "Users can view their clinic's API keys" ON clinic_api_keys;
DROP POLICY IF EXISTS "Users can create API keys for their clinic" ON clinic_api_keys;
DROP POLICY IF EXISTS "Users can update their clinic's API keys" ON clinic_api_keys;
DROP POLICY IF EXISTS "Users can delete their clinic's API keys" ON clinic_api_keys;

-- Drop the index
DROP INDEX IF EXISTS idx_clinic_api_keys_clinic_id;

-- Drop the column
ALTER TABLE clinic_api_keys
  DROP COLUMN IF EXISTS clinic_id;

-- Create simpler RLS policies (admin-only management)
CREATE POLICY "Admins can view API keys"
  ON clinic_api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'practice_owner')
    )
  );

CREATE POLICY "Admins can manage API keys"
  ON clinic_api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update table comment
COMMENT ON TABLE clinic_api_keys IS 'Shared API keys for external sync server authentication (X-API-Key header). Clinic context is passed in request body.';

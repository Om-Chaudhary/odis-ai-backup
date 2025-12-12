-- Add is_starred column to cases table
-- Allows users to mark cases as starred for quick access

ALTER TABLE cases
ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false;

-- Add index for efficient filtering of starred cases
CREATE INDEX IF NOT EXISTS idx_cases_is_starred ON cases (user_id, is_starred) WHERE is_starred = true;

COMMENT ON COLUMN cases.is_starred IS 'Set to true when user stars a case for quick access and filtering';


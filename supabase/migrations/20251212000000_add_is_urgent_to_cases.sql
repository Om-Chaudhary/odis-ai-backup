-- Add is_urgent column to cases table
-- This flag is set when the VAPI outbound assistant detects an urgent case
-- that requires immediate clinic attention

ALTER TABLE cases
ADD COLUMN IF NOT EXISTS is_urgent boolean DEFAULT false;

-- Add index for efficient filtering of urgent cases
CREATE INDEX IF NOT EXISTS idx_cases_is_urgent ON cases (is_urgent) WHERE is_urgent = true;

COMMENT ON COLUMN cases.is_urgent IS 'Set to true when AI agent flags case as requiring urgent clinic review based on call conversation';


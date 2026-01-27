-- Add communication preference columns to cases table
-- These allow doctors to opt-out of specific communication channels per case

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS call_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN cases.call_enabled IS 'Whether phone calls are enabled for this case. Defaults to true.';
COMMENT ON COLUMN cases.email_enabled IS 'Whether emails are enabled for this case. Defaults to true.';

-- Migration: Add cadence tracking columns to cases table
-- Tracks the source and values of scheduling delays applied to each case

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS cadence_source TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS call_delay_days INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS email_delay_days INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS detected_case_type TEXT;

-- Create index for filtering by detected case type
CREATE INDEX IF NOT EXISTS idx_cases_detected_case_type
  ON cases(detected_case_type)
  WHERE detected_case_type IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN cases.cadence_source IS 'Source of cadence settings: default, clinic_config, manual';
COMMENT ON COLUMN cases.call_delay_days IS 'Number of days to delay call after case creation';
COMMENT ON COLUMN cases.email_delay_days IS 'Number of days to delay email after case creation';
COMMENT ON COLUMN cases.detected_case_type IS 'Case type detected from IDEXX data: euthanasia, surgery, wellness_exam, sick_visit, dental, emergency, vaccination, follow_up, general';

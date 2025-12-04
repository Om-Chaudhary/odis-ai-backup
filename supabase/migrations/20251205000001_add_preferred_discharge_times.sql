-- Add preferred discharge scheduling time settings to users table
-- These settings control the default time windows for batch discharge scheduling

-- Preferred email window (e.g., 9:00 AM - 12:00 PM)
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_email_start_time TIME DEFAULT '09:00:00';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_email_end_time TIME DEFAULT '12:00:00';

-- Preferred call window (e.g., 2:00 PM - 5:00 PM)
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_call_start_time TIME DEFAULT '14:00:00';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_call_end_time TIME DEFAULT '17:00:00';

-- Days to wait after appointment before sending email (default: 1 day = next day)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_delay_days INTEGER DEFAULT 1;

-- Days to wait after email before making call (default: 2 days)
ALTER TABLE users ADD COLUMN IF NOT EXISTS call_delay_days INTEGER DEFAULT 2;

-- Max retry attempts for failed calls (default: 3)
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_call_retries INTEGER DEFAULT 3;

-- Batch discharge preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS batch_include_idexx_notes BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS batch_include_manual_transcriptions BOOLEAN DEFAULT true;

COMMENT ON COLUMN users.preferred_email_start_time IS 'Start of preferred window for sending discharge emails (HH:MM:SS)';
COMMENT ON COLUMN users.preferred_email_end_time IS 'End of preferred window for sending discharge emails (HH:MM:SS)';
COMMENT ON COLUMN users.preferred_call_start_time IS 'Start of preferred window for making discharge calls (HH:MM:SS)';
COMMENT ON COLUMN users.preferred_call_end_time IS 'End of preferred window for making discharge calls (HH:MM:SS)';
COMMENT ON COLUMN users.email_delay_days IS 'Number of days after appointment to send discharge email';
COMMENT ON COLUMN users.call_delay_days IS 'Number of days after email to schedule follow-up call';
COMMENT ON COLUMN users.max_call_retries IS 'Maximum number of retry attempts for failed discharge calls';
COMMENT ON COLUMN users.batch_include_idexx_notes IS 'Include IDEXX Neo cases with consultation notes in batch discharge';
COMMENT ON COLUMN users.batch_include_manual_transcriptions IS 'Include manual cases with transcriptions/SOAP notes in batch discharge';

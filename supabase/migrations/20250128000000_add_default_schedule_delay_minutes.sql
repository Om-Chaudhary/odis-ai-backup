-- Add default_schedule_delay_minutes column to users table
-- This allows users to override the default scheduling delay for calls and emails
-- NULL means use system defaults (2 minutes for calls, immediate for emails)

ALTER TABLE users
ADD COLUMN IF NOT EXISTS default_schedule_delay_minutes INTEGER;

COMMENT ON COLUMN users.default_schedule_delay_minutes IS 'Override default scheduling delay in minutes. NULL = use system defaults (2 min for calls, immediate for emails).';


-- Update default scheduling times for discharge emails and calls
-- Email: 10 AM (business hours) instead of 9 AM
-- Call: 4-7 PM evening window instead of 2-5 PM

-- Update default email time from 9 AM to 10 AM
ALTER TABLE users ALTER COLUMN preferred_email_start_time SET DEFAULT '10:00:00';

-- Update default call start time from 2 PM to 4 PM
ALTER TABLE users ALTER COLUMN preferred_call_start_time SET DEFAULT '16:00:00';

-- Update default call end time from 5 PM to 7 PM
ALTER TABLE users ALTER COLUMN preferred_call_end_time SET DEFAULT '19:00:00';

-- Add comments explaining the defaults
COMMENT ON COLUMN users.preferred_email_start_time IS 'Start of preferred window for sending discharge emails (default: 10:00 AM business hours)';
COMMENT ON COLUMN users.preferred_call_start_time IS 'Start of preferred window for making discharge calls (default: 4:00 PM for 4-7 PM evening window)';
COMMENT ON COLUMN users.preferred_call_end_time IS 'End of preferred window for making discharge calls (default: 7:00 PM for 4-7 PM evening window)';


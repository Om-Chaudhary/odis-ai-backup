-- Add confirmed appointment date/time columns
-- These capture the actual appointment time that the AI booked/confirmed with the caller
-- (as opposed to requested_date/requested_start_time which are the caller's preferences)

-- Add confirmed_date column
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS confirmed_date date;

-- Add confirmed_time column  
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS confirmed_time time;

-- Add index for looking up confirmed appointments by date
CREATE INDEX IF NOT EXISTS idx_appointment_requests_confirmed_date 
  ON appointment_requests(confirmed_date) 
  WHERE confirmed_date IS NOT NULL;

-- Add comments
COMMENT ON COLUMN appointment_requests.confirmed_date IS 'The actual appointment date confirmed by the AI with the caller';
COMMENT ON COLUMN appointment_requests.confirmed_time IS 'The actual appointment time confirmed by the AI with the caller';


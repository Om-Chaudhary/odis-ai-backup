-- Ensure status is never null in scheduled_discharge_calls
-- This ensures call status is always visible and persists properly

-- First, update any existing null statuses to 'queued'
UPDATE scheduled_discharge_calls
SET status = 'queued'
WHERE status IS NULL;

-- Set default value for status column
ALTER TABLE scheduled_discharge_calls
ALTER COLUMN status SET DEFAULT 'queued';

-- Add NOT NULL constraint
ALTER TABLE scheduled_discharge_calls
ALTER COLUMN status SET NOT NULL;

-- Add comment
COMMENT ON COLUMN scheduled_discharge_calls.status IS 'Call status: queued, ringing, in_progress, completed, failed, or cancelled. Always set, never null.';


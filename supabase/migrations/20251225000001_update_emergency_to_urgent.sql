-- Migration: Update call outcome from 'Emergency' to 'Urgent'
-- Description: Changes existing 'Emergency' outcome values to 'Urgent' for better clarity

-- Update inbound_vapi_calls table
UPDATE inbound_vapi_calls
SET outcome = 'Urgent'
WHERE outcome = 'Emergency';

-- Add comment for documentation
COMMENT ON COLUMN inbound_vapi_calls.outcome IS 'Call outcome classification: Scheduled, Cancellation, Info, Urgent, Call Back, Completed';


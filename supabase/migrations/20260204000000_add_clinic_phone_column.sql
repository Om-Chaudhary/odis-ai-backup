-- Add clinic_phone column for filtering out clinic number from caller display
-- This fixes the issue where CallerDisplay shows clinic phone instead of actual caller

ALTER TABLE inbound_vapi_calls
ADD COLUMN IF NOT EXISTS clinic_phone text;

COMMENT ON COLUMN inbound_vapi_calls.clinic_phone IS 'Clinic phone number for filtering out clinic number from caller display';

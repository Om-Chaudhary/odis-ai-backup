-- Add columns to store reliably extracted caller information
-- These columns are populated during webhook processing from transcript/structured data
-- Priority: structured_data > transcript extraction

ALTER TABLE inbound_vapi_calls
ADD COLUMN IF NOT EXISTS extracted_caller_phone text,
ADD COLUMN IF NOT EXISTS extracted_caller_name text,
ADD COLUMN IF NOT EXISTS extracted_pet_name text;

-- Add index for phone lookups (used for caller identification across calls)
CREATE INDEX IF NOT EXISTS idx_inbound_vapi_calls_extracted_caller_phone
ON inbound_vapi_calls(extracted_caller_phone)
WHERE extracted_caller_phone IS NOT NULL;

-- Add composite index for efficient caller info lookups by clinic
CREATE INDEX IF NOT EXISTS idx_inbound_vapi_calls_clinic_extracted_phone
ON inbound_vapi_calls(clinic_name, extracted_caller_phone)
WHERE extracted_caller_phone IS NOT NULL;

COMMENT ON COLUMN inbound_vapi_calls.extracted_caller_phone IS 'Callback phone extracted from transcript or structured data';
COMMENT ON COLUMN inbound_vapi_calls.extracted_caller_name IS 'Caller name extracted from transcript or structured data';
COMMENT ON COLUMN inbound_vapi_calls.extracted_pet_name IS 'Pet name extracted from transcript or structured data';

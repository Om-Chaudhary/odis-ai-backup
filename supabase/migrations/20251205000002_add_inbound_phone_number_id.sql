-- Add inbound_phone_number_id column to clinics table
-- This column maps VAPI phone numbers to clinics for dynamic inbound call routing
-- When an inbound call comes in, the assistant-request webhook uses this to find the correct clinic

ALTER TABLE public.clinics
ADD COLUMN IF NOT EXISTS inbound_phone_number_id text NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.clinics.inbound_phone_number_id IS 
  'VAPI phone number ID for inbound calls - used to route calls to the correct assistant via assistant-request webhook';

-- Create index for efficient lookups by phone number ID
CREATE INDEX IF NOT EXISTS idx_clinics_inbound_phone_number_id 
  ON public.clinics(inbound_phone_number_id) 
  WHERE inbound_phone_number_id IS NOT NULL;

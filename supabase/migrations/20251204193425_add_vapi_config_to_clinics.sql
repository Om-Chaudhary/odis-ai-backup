-- Add VAPI configuration columns to clinics table
-- This allows each clinic to have their own dedicated VAPI assistants for inbound/outbound calls

-- Add inbound assistant ID column
ALTER TABLE public.clinics
ADD COLUMN inbound_assistant_id text NULL;

-- Add outbound assistant ID column  
ALTER TABLE public.clinics
ADD COLUMN outbound_assistant_id text NULL;

-- Add phone number ID column for outbound caller ID
ALTER TABLE public.clinics
ADD COLUMN phone_number_id text NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.clinics.inbound_assistant_id IS 'VAPI assistant ID for receiving inbound calls';
COMMENT ON COLUMN public.clinics.outbound_assistant_id IS 'VAPI assistant ID for outbound discharge/follow-up calls';
COMMENT ON COLUMN public.clinics.phone_number_id IS 'VAPI phone number ID used as caller ID for outbound calls';

-- Update Alum Rock Animal Hospital with their dedicated assistant IDs
UPDATE public.clinics
SET 
  outbound_assistant_id = '9a7d3e1b-7c1a-4df6-b4ab-54f2e57e4205',
  inbound_assistant_id = 'ae3e6a54-17a3-4915-9c3e-48779b5dbf09',
  updated_at = now()
WHERE name = 'Alum Rock Animal Hospital';


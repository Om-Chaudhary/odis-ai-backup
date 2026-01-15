-- Rename phone_number_id to outbound_phone_number_id for consistency
-- This makes the naming convention clearer:
-- - outbound_phone_number_id: VAPI phone number for outbound calls (caller ID)
-- - inbound_phone_number_id: VAPI phone number for inbound calls (routing)

-- Rename the column in clinics table
ALTER TABLE public.clinics
RENAME COLUMN phone_number_id TO outbound_phone_number_id;

-- Update the column comment
COMMENT ON COLUMN public.clinics.outbound_phone_number_id IS
  'VAPI phone number ID used as caller ID for outbound discharge/follow-up calls';

-- Rename the column in scheduled_discharge_calls table
ALTER TABLE public.scheduled_discharge_calls
RENAME COLUMN phone_number_id TO outbound_phone_number_id;

-- Update the column comment
COMMENT ON COLUMN public.scheduled_discharge_calls.outbound_phone_number_id IS
  'VAPI phone number ID used for this outbound call (typically from clinics.outbound_phone_number_id)';

-- Note: inbound_vapi_calls.phone_number_id stores the phone number that received the call
-- This is different from clinics.inbound_phone_number_id which is used for routing
-- We'll leave inbound_vapi_calls.phone_number_id as-is since it serves a different purpose

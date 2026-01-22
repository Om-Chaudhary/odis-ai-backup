-- Add action_card_data column to inbound_vapi_calls
-- Stores pre-formatted structured output from VAPI for action card display
-- Eliminates need for on-the-fly extraction/generation

ALTER TABLE inbound_vapi_calls
  ADD COLUMN IF NOT EXISTS action_card_data jsonb DEFAULT NULL;

-- Add index for querying by card type
CREATE INDEX IF NOT EXISTS idx_inbound_calls_action_card_type
  ON inbound_vapi_calls ((action_card_data->>'card_type'))
  WHERE action_card_data IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN inbound_vapi_calls.action_card_data IS 'VAPI structured output: pre-formatted data for action card display. Schema includes card_type, appointment_data, emergency_data, callback_data, info_data fields.';

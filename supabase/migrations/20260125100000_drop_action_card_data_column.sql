-- Drop action_card_data column from inbound_vapi_calls
--
-- This column is no longer needed because action card data now comes from
-- VAPI's analysis.structuredData (saved to the structured_data column)
-- rather than artifact.structuredOutputs.
--
-- The structured_data column already contains the action card format:
-- {"card_type": "callback", "callback_data": {"reason": "...", "pet_name": "..."}}

-- Drop the index first
DROP INDEX IF EXISTS idx_inbound_vapi_calls_action_card_type;

-- Drop the column
ALTER TABLE inbound_vapi_calls
  DROP COLUMN IF EXISTS action_card_data;

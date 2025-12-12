-- Add urgent_reason_summary column to scheduled_discharge_calls
-- This column caches the LLM-generated summary explaining why a call was flagged as urgent

ALTER TABLE scheduled_discharge_calls
ADD COLUMN IF NOT EXISTS urgent_reason_summary text;

COMMENT ON COLUMN scheduled_discharge_calls.urgent_reason_summary IS 'LLM-generated summary explaining why this call was flagged as urgent by the AI agent';

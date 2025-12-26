-- Add call intelligence columns to inbound_vapi_calls
-- These columns mirror the structured output data from scheduled_discharge_calls
-- to enable AI-powered call insights for inbound calls

-- Call intelligence columns (6 categories)
ALTER TABLE inbound_vapi_calls
  ADD COLUMN IF NOT EXISTS call_outcome_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pet_health_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS medication_compliance_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS owner_sentiment_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS escalation_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS follow_up_data jsonb DEFAULT NULL;

-- Attention tracking columns
ALTER TABLE inbound_vapi_calls
  ADD COLUMN IF NOT EXISTS attention_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attention_severity text,
  ADD COLUMN IF NOT EXISTS attention_summary text,
  ADD COLUMN IF NOT EXISTS attention_flagged_at timestamptz;

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_inbound_calls_call_outcome 
  ON inbound_vapi_calls ((call_outcome_data->>'call_outcome'));
CREATE INDEX IF NOT EXISTS idx_inbound_calls_pet_recovery 
  ON inbound_vapi_calls ((pet_health_data->>'pet_recovery_status'));
CREATE INDEX IF NOT EXISTS idx_inbound_calls_owner_sentiment 
  ON inbound_vapi_calls ((owner_sentiment_data->>'owner_sentiment'));
CREATE INDEX IF NOT EXISTS idx_inbound_calls_escalation 
  ON inbound_vapi_calls ((escalation_data->>'escalation_triggered'));
CREATE INDEX IF NOT EXISTS idx_inbound_calls_attention_severity
  ON inbound_vapi_calls (attention_severity) WHERE attention_severity IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN inbound_vapi_calls.call_outcome_data IS 'VAPI structured output: call outcome, conversation stage, owner availability';
COMMENT ON COLUMN inbound_vapi_calls.pet_health_data IS 'VAPI structured output: pet recovery status, symptoms reported, concerns raised';
COMMENT ON COLUMN inbound_vapi_calls.medication_compliance_data IS 'VAPI structured output: medication compliance status and issues';
COMMENT ON COLUMN inbound_vapi_calls.owner_sentiment_data IS 'VAPI structured output: owner sentiment, engagement level, gratitude/concerns';
COMMENT ON COLUMN inbound_vapi_calls.escalation_data IS 'VAPI structured output: escalation triggers, type, transfer status';
COMMENT ON COLUMN inbound_vapi_calls.follow_up_data IS 'VAPI structured output: recheck reminder, appointment requests, follow-up needs';
COMMENT ON COLUMN inbound_vapi_calls.attention_types IS 'Array of attention types: health_concern, callback_request, medication_question, etc.';
COMMENT ON COLUMN inbound_vapi_calls.attention_severity IS 'Attention severity level: routine, urgent, or critical';
COMMENT ON COLUMN inbound_vapi_calls.attention_summary IS 'AI-generated summary explaining why attention is needed';
COMMENT ON COLUMN inbound_vapi_calls.attention_flagged_at IS 'Timestamp when the call was flagged for attention';


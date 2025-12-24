-- Add structured output columns for comprehensive call intelligence
-- These columns store VAPI structured output data for call analytics

ALTER TABLE scheduled_discharge_calls
  ADD COLUMN IF NOT EXISTS call_outcome_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pet_health_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS medication_compliance_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS owner_sentiment_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS escalation_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS follow_up_data jsonb DEFAULT NULL;

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_calls_call_outcome 
  ON scheduled_discharge_calls ((call_outcome_data->>'call_outcome'));
CREATE INDEX IF NOT EXISTS idx_calls_pet_recovery 
  ON scheduled_discharge_calls ((pet_health_data->>'pet_recovery_status'));
CREATE INDEX IF NOT EXISTS idx_calls_owner_sentiment 
  ON scheduled_discharge_calls ((owner_sentiment_data->>'owner_sentiment'));
CREATE INDEX IF NOT EXISTS idx_calls_escalation 
  ON scheduled_discharge_calls ((escalation_data->>'escalation_triggered'));

-- Add comments for documentation
COMMENT ON COLUMN scheduled_discharge_calls.call_outcome_data IS 'VAPI structured output: call outcome, conversation stage, owner availability';
COMMENT ON COLUMN scheduled_discharge_calls.pet_health_data IS 'VAPI structured output: pet recovery status, symptoms reported, concerns raised';
COMMENT ON COLUMN scheduled_discharge_calls.medication_compliance_data IS 'VAPI structured output: medication compliance status and issues';
COMMENT ON COLUMN scheduled_discharge_calls.owner_sentiment_data IS 'VAPI structured output: owner sentiment, engagement level, gratitude/concerns';
COMMENT ON COLUMN scheduled_discharge_calls.escalation_data IS 'VAPI structured output: escalation triggers, type, transfer status';
COMMENT ON COLUMN scheduled_discharge_calls.follow_up_data IS 'VAPI structured output: recheck reminder, appointment requests, follow-up needs';


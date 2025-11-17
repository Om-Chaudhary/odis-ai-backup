-- Rename vapi_calls table to scheduled_discharge_calls to follow naming convention
-- This aligns with scheduled_discharge_emails and represents the purpose better

-- Rename the table
ALTER TABLE IF EXISTS vapi_calls RENAME TO scheduled_discharge_calls;

-- Add missing columns to match email table pattern
ALTER TABLE scheduled_discharge_calls
ADD COLUMN IF NOT EXISTS case_id uuid REFERENCES cases(id) ON DELETE CASCADE;

-- Add qstash_message_id if it doesn't exist (for tracking scheduled execution)
ALTER TABLE scheduled_discharge_calls
ADD COLUMN IF NOT EXISTS qstash_message_id text;

-- Update status check constraint to match email table convention
-- Drop both old and new constraint names to ensure clean state
ALTER TABLE scheduled_discharge_calls
DROP CONSTRAINT IF EXISTS vapi_calls_status_check;

ALTER TABLE scheduled_discharge_calls
DROP CONSTRAINT IF EXISTS scheduled_discharge_calls_status_check;

-- Now add the constraint with the new name
ALTER TABLE scheduled_discharge_calls
ADD CONSTRAINT scheduled_discharge_calls_status_check
CHECK (status IN ('queued', 'ringing', 'in_progress', 'completed', 'failed', 'cancelled'));

-- Rename indexes to match new table name
ALTER INDEX IF EXISTS idx_vapi_calls_metadata RENAME TO idx_scheduled_calls_metadata;
ALTER INDEX IF EXISTS idx_vapi_calls_user_id RENAME TO idx_scheduled_calls_user_id;
ALTER INDEX IF EXISTS idx_vapi_calls_status RENAME TO idx_scheduled_calls_status;
ALTER INDEX IF EXISTS idx_vapi_calls_scheduled_for RENAME TO idx_scheduled_calls_scheduled_for;
ALTER INDEX IF EXISTS idx_vapi_calls_vapi_call_id RENAME TO idx_scheduled_calls_vapi_call_id;

-- Create missing indexes that match email table pattern
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_case_id ON scheduled_discharge_calls(case_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_customer_phone ON scheduled_discharge_calls(customer_phone);

-- Enable RLS if not already enabled
ALTER TABLE scheduled_discharge_calls ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies if any (from old table)
DROP POLICY IF EXISTS "Users can view own scheduled calls" ON scheduled_discharge_calls;
DROP POLICY IF EXISTS "Users can create own scheduled calls" ON scheduled_discharge_calls;
DROP POLICY IF EXISTS "Users can update own scheduled calls" ON scheduled_discharge_calls;
DROP POLICY IF EXISTS "Users can delete own scheduled calls" ON scheduled_discharge_calls;

-- Create RLS policies matching email table pattern
-- Users can only view their own scheduled calls
CREATE POLICY "Users can view own scheduled calls"
  ON scheduled_discharge_calls
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own scheduled calls
CREATE POLICY "Users can create own scheduled calls"
  ON scheduled_discharge_calls
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own scheduled calls
CREATE POLICY "Users can update own scheduled calls"
  ON scheduled_discharge_calls
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own scheduled calls
CREATE POLICY "Users can delete own scheduled calls"
  ON scheduled_discharge_calls
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at if not exists
CREATE OR REPLACE FUNCTION update_scheduled_discharge_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_scheduled_discharge_calls_updated_at ON scheduled_discharge_calls;

CREATE TRIGGER trigger_update_scheduled_discharge_calls_updated_at
  BEFORE UPDATE ON scheduled_discharge_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_discharge_calls_updated_at();

-- Add comments to document table structure
COMMENT ON TABLE scheduled_discharge_calls IS 'Manages scheduled discharge phone calls via VAPI AI assistant (follows same pattern as scheduled_discharge_emails)';
COMMENT ON COLUMN scheduled_discharge_calls.case_id IS 'Optional reference to the case this call is related to';
COMMENT ON COLUMN scheduled_discharge_calls.customer_phone IS 'Phone number to call in E.164 format (e.g., +14155551234)';
COMMENT ON COLUMN scheduled_discharge_calls.scheduled_for IS 'When the call should be executed (UTC timezone)';
COMMENT ON COLUMN scheduled_discharge_calls.dynamic_variables IS 'Variables passed to VAPI assistant for personalization - includes AI-extracted patient info, clinical data, medications, etc.';
COMMENT ON COLUMN scheduled_discharge_calls.vapi_call_id IS 'VAPI''s call ID returned after call is initiated';
COMMENT ON COLUMN scheduled_discharge_calls.metadata IS 'Additional metadata including retry tracking (retry_count, max_retries, timezone, notes), entity_extraction, case_id, discharge_summary_id';
COMMENT ON COLUMN scheduled_discharge_calls.qstash_message_id IS 'QStash message ID for tracking scheduled execution (managed by QStash webhook system)';

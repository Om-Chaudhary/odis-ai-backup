-- Create inbound_vapi_calls table for tracking inbound VAPI phone calls
-- Separate from scheduled_discharge_calls which handles outbound calls

CREATE TABLE IF NOT EXISTS inbound_vapi_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- VAPI identifiers
  vapi_call_id text UNIQUE NOT NULL,
  assistant_id text NOT NULL,
  phone_number_id text,
  
  -- User/clinic mapping
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  clinic_name text,
  
  -- Call metadata
  customer_phone text,
  customer_number text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'ringing', 'in_progress', 'completed', 'failed', 'cancelled')),
  type text NOT NULL DEFAULT 'inbound' CHECK (type = 'inbound'),
  
  -- Timestamps
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Call data
  duration_seconds integer,
  recording_url text,
  stereo_recording_url text,
  transcript text,
  transcript_messages jsonb,
  
  -- Analysis
  call_analysis jsonb,
  summary text,
  success_evaluation text,
  structured_data jsonb,
  user_sentiment text CHECK (user_sentiment IN ('positive', 'neutral', 'negative')),
  
  -- Costs
  cost numeric(10, 4),
  
  -- Ending info
  ended_reason text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_inbound_calls_vapi_call_id ON inbound_vapi_calls(vapi_call_id);
CREATE INDEX idx_inbound_calls_assistant_id ON inbound_vapi_calls(assistant_id);
CREATE INDEX idx_inbound_calls_user_id ON inbound_vapi_calls(user_id);
CREATE INDEX idx_inbound_calls_clinic_name ON inbound_vapi_calls(clinic_name);
CREATE INDEX idx_inbound_calls_status ON inbound_vapi_calls(status);
CREATE INDEX idx_inbound_calls_created_at ON inbound_vapi_calls(created_at DESC);
CREATE INDEX idx_inbound_calls_customer_phone ON inbound_vapi_calls(customer_phone);

-- Enable RLS
ALTER TABLE inbound_vapi_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view calls for their clinic (via assistant_id mapping) or their own calls
CREATE POLICY "Users can view clinic inbound calls"
  ON inbound_vapi_calls
  FOR SELECT
  USING (
    -- Users can see calls for their clinic
    clinic_name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    OR
    -- Users can see calls assigned to them
    user_id = auth.uid()
    OR
    -- Admins and practice owners can see all calls for their clinic
    (
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'practice_owner')
        AND clinic_name = inbound_vapi_calls.clinic_name
      )
    )
  );

-- Service role can do everything (for webhook handler)
CREATE POLICY "Service role can manage inbound calls"
  ON inbound_vapi_calls
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_inbound_vapi_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inbound_vapi_calls_updated_at
  BEFORE UPDATE ON inbound_vapi_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_inbound_vapi_calls_updated_at();

-- Add comments
COMMENT ON TABLE inbound_vapi_calls IS 'Tracks inbound VAPI phone calls received by assistants. Separate from scheduled_discharge_calls which handles outbound calls.';
COMMENT ON COLUMN inbound_vapi_calls.vapi_call_id IS 'VAPI call ID from webhook (unique identifier)';
COMMENT ON COLUMN inbound_vapi_calls.assistant_id IS 'VAPI assistant ID that handled the call';
COMMENT ON COLUMN inbound_vapi_calls.phone_number_id IS 'VAPI phone number ID that received the call';
COMMENT ON COLUMN inbound_vapi_calls.user_id IS 'User who owns the clinic (mapped via assistant_id)';
COMMENT ON COLUMN inbound_vapi_calls.clinic_name IS 'Clinic name (denormalized for performance and RLS)';
COMMENT ON COLUMN inbound_vapi_calls.customer_phone IS 'Caller phone number in E.164 format';
COMMENT ON COLUMN inbound_vapi_calls.status IS 'Call status: queued, ringing, in_progress, completed, failed, cancelled';
COMMENT ON COLUMN inbound_vapi_calls.type IS 'Always "inbound" for this table';
COMMENT ON COLUMN inbound_vapi_calls.transcript_messages IS 'Array of message objects with role, message, time';
COMMENT ON COLUMN inbound_vapi_calls.call_analysis IS 'Full call analysis object from VAPI';
COMMENT ON COLUMN inbound_vapi_calls.structured_data IS 'Extracted structured data from call analysis';
COMMENT ON COLUMN inbound_vapi_calls.metadata IS 'Additional metadata for flexible storage';


-- Add recording URL columns to scheduled_discharge_calls
-- This enables storing VAPI call recordings for outbound discharge calls
-- Mirrors the columns already present in inbound_vapi_calls table

-- Add recording_url column for mono recording
ALTER TABLE scheduled_discharge_calls
ADD COLUMN IF NOT EXISTS recording_url text;

-- Add stereo_recording_url column for stereo recording with separate channels
ALTER TABLE scheduled_discharge_calls
ADD COLUMN IF NOT EXISTS stereo_recording_url text;

-- Add helpful comments to document these columns
COMMENT ON COLUMN scheduled_discharge_calls.recording_url IS 'URL to the call recording from VAPI (mono audio)';
COMMENT ON COLUMN scheduled_discharge_calls.stereo_recording_url IS 'URL to the stereo recording from VAPI (separate channels for each speaker)';

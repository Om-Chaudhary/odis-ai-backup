-- Add voicemail_detection_enabled flag to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS voicemail_detection_enabled boolean DEFAULT false;

-- Add comment
COMMENT ON COLUMN users.voicemail_detection_enabled IS 'Enable automatic voicemail detection and message leaving for VAPI calls';


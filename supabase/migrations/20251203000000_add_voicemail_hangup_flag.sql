-- Add voicemail hangup configuration flag to users table
-- This allows users to choose whether to hang up or leave a message when voicemail is detected

ALTER TABLE users
ADD COLUMN voicemail_hangup_on_detection BOOLEAN NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN users.voicemail_hangup_on_detection IS 
'When true and voicemail_detection_enabled is true, the agent will hang up when voicemail is detected instead of leaving a message. When false, the agent will leave a voicemail message.';


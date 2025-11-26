-- Add test mode columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS test_mode_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS test_contact_name TEXT,
ADD COLUMN IF NOT EXISTS test_contact_email TEXT,
ADD COLUMN IF NOT EXISTS test_contact_phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.test_mode_enabled IS 'Enable test mode to auto-fill discharge contact info with test data';
COMMENT ON COLUMN users.test_contact_name IS 'Test contact name for discharge testing';
COMMENT ON COLUMN users.test_contact_email IS 'Test contact email for discharge testing';
COMMENT ON COLUMN users.test_contact_phone IS 'Test contact phone for discharge testing';


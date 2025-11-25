-- Add emergency_phone column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS emergency_phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.emergency_phone IS 'After-hours emergency contact phone number for veterinary clinic';

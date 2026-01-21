-- Add daily_hours JSONB column to clinic_schedule_config
-- Enables per-day business hours configuration (e.g., Mon-Fri 9-5, Sat 10-3)
--
-- JSON Structure:
-- {
--   "0": { "enabled": false },                                    -- Sunday closed
--   "1": { "enabled": true, "open": "09:00", "close": "17:00" },  -- Monday
--   "2": { "enabled": true, "open": "09:00", "close": "17:00" },  -- Tuesday
--   "3": { "enabled": true, "open": "09:00", "close": "17:00" },  -- Wednesday
--   "4": { "enabled": true, "open": "09:00", "close": "17:00" },  -- Thursday
--   "5": { "enabled": true, "open": "09:00", "close": "17:00" },  -- Friday
--   "6": { "enabled": true, "open": "10:00", "close": "15:00" }   -- Saturday (different hours!)
-- }

ALTER TABLE clinic_schedule_config
ADD COLUMN daily_hours JSONB DEFAULT NULL;

COMMENT ON COLUMN clinic_schedule_config.daily_hours IS
  'Per-day hours configuration. If NULL, falls back to open_time/close_time/days_of_week. Structure: { "0": { "enabled": false }, "1": { "enabled": true, "open": "09:00", "close": "17:00" }, ... } where keys are day numbers (0=Sunday, 6=Saturday)';

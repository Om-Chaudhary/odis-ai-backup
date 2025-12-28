-- Insert default configuration for existing clinics
-- Specifically for Alum Rock Animal Hospital (the active IDEXX clinic)

-- Insert default schedule config for Alum Rock Animal Hospital
INSERT INTO clinic_schedule_config (
  clinic_id,
  open_time,
  close_time,
  days_of_week,
  slot_duration_minutes,
  default_capacity,
  sync_horizon_days,
  stale_threshold_minutes,
  timezone
)
SELECT
  id,
  '08:00'::time,      -- Default open time
  '18:00'::time,      -- Default close time
  ARRAY[1,2,3,4,5,6], -- Mon-Sat (closed Sunday)
  15,                 -- 15-minute slots
  2,                  -- 2 appointments per slot (will be updated from IDEXX rooms)
  14,                 -- Sync 2 weeks ahead
  60,                 -- Consider stale after 60 minutes
  'America/Los_Angeles'
FROM clinics
WHERE name = 'Alum Rock Animal Hospital'
  AND is_active = true
ON CONFLICT (clinic_id) DO NOTHING;

-- Insert default lunch break for Alum Rock Animal Hospital
INSERT INTO clinic_blocked_periods (
  clinic_id,
  name,
  start_time,
  end_time,
  days_of_week,
  is_active
)
SELECT
  id,
  'Lunch Break',
  '12:00'::time,      -- 12 PM
  '14:00'::time,      -- 2 PM
  ARRAY[1,2,3,4,5,6], -- Mon-Sat
  true
FROM clinics
WHERE name = 'Alum Rock Animal Hospital'
  AND is_active = true;

-- Also insert config for any other active clinics
INSERT INTO clinic_schedule_config (
  clinic_id,
  open_time,
  close_time,
  days_of_week,
  slot_duration_minutes,
  default_capacity,
  sync_horizon_days,
  stale_threshold_minutes,
  timezone
)
SELECT
  id,
  '08:00'::time,
  '18:00'::time,
  ARRAY[1,2,3,4,5,6],
  15,
  2,
  14,
  60,
  'America/Los_Angeles'
FROM clinics
WHERE is_active = true
  AND id NOT IN (SELECT clinic_id FROM clinic_schedule_config)
ON CONFLICT (clinic_id) DO NOTHING;

-- Insert default lunch break for all active clinics that don't have one
INSERT INTO clinic_blocked_periods (
  clinic_id,
  name,
  start_time,
  end_time,
  days_of_week,
  is_active
)
SELECT
  c.id,
  'Lunch Break',
  '12:00'::time,
  '14:00'::time,
  ARRAY[1,2,3,4,5,6],
  true
FROM clinics c
WHERE c.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM clinic_blocked_periods bp
    WHERE bp.clinic_id = c.id
      AND bp.name = 'Lunch Break'
  );

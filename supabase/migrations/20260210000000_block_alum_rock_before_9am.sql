-- Block Alum Rock Animal Hospital appointments before 9:00 AM
-- VAPI will not offer or book these early morning slots
-- IDEXX-synced appointments at these times are unaffected

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
  'Early Morning - No VAPI Booking',
  '08:00'::time,
  '09:00'::time,
  ARRAY[1,2,3,4,5,6],  -- Mon-Sat (same as open days)
  true
FROM clinics
WHERE name = 'Alum Rock Animal Hospital'
  AND is_active = true;

-- Block Alum Rock Animal Hospital appointments after 5:30 PM
-- VAPI will not offer or book these late afternoon/evening slots
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
  'After 5:30 PM - No VAPI Booking',
  '17:30'::time,
  '22:00'::time,
  ARRAY[1,2,3,4,5,6],  -- Mon-Sat (Sunday already closes at 5pm)
  true
FROM clinics
WHERE name = 'Alum Rock Animal Hospital'
  AND is_active = true;

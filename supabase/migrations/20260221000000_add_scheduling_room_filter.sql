-- Add room-based filtering for availability checks
-- When scheduling_room_names is set, only appointments in those rooms count toward capacity.
-- This allows clinics like Masson to only check "Exam Room One" for availability
-- while ignoring Technician, Surgery, Hospitalization, etc.
-- When NULL (default), all rooms count (existing behavior for Alumrock, etc.)

-- 1. Add column to clinic_schedule_config
ALTER TABLE clinic_schedule_config
ADD COLUMN IF NOT EXISTS scheduling_room_names text[];

COMMENT ON COLUMN clinic_schedule_config.scheduling_room_names IS
  'When set, only count appointments from these IDEXX rooms (provider_name) toward capacity. NULL = count all rooms.';

-- 2. Update count_booked_in_range to accept optional room filter
CREATE OR REPLACE FUNCTION count_booked_in_range(
  p_clinic_id uuid,
  p_time_range tstzrange,
  p_scheduling_rooms text[] DEFAULT NULL
) RETURNS int
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM (
    -- Appointments from PIMS
    SELECT id FROM pims_appointments
    WHERE clinic_id = p_clinic_id
      AND time_range && p_time_range
      AND deleted_at IS NULL
      AND status NOT IN ('cancelled', 'no_show')
      AND (p_scheduling_rooms IS NULL
           OR provider_name = ANY(p_scheduling_rooms)
           OR appointment_type = 'block')

    UNION ALL

    -- Active bookings (pending with valid hold OR confirmed)
    SELECT id FROM appointment_bookings
    WHERE clinic_id = p_clinic_id
      AND time_range && p_time_range
      AND (
        (status = 'pending' AND (hold_expires_at IS NULL OR hold_expires_at > now()))
        OR status = 'confirmed'
      )
  ) combined;

  RETURN v_count;
END;
$$;

-- 3. Update check_availability to read room filter from config and pass it
CREATE OR REPLACE FUNCTION check_availability(
  p_clinic_id uuid,
  p_time_range tstzrange
) RETURNS TABLE(
  is_available boolean,
  capacity int,
  booked_count int,
  available_count int,
  is_blocked boolean,
  block_reason text
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_capacity int;
  v_booked int;
  v_day_of_week int;
  v_start_time time;
  v_end_time time;
  v_blocked boolean := false;
  v_block_reason text;
  v_scheduling_rooms text[];
BEGIN
  -- Extract day of week and time from time range
  v_day_of_week := EXTRACT(DOW FROM lower(p_time_range) AT TIME ZONE (
    SELECT COALESCE(timezone, 'America/Los_Angeles') FROM clinics WHERE id = p_clinic_id
  ));
  v_start_time := (lower(p_time_range) AT TIME ZONE (
    SELECT COALESCE(timezone, 'America/Los_Angeles') FROM clinics WHERE id = p_clinic_id
  ))::time;
  v_end_time := (upper(p_time_range) AT TIME ZONE (
    SELECT COALESCE(timezone, 'America/Los_Angeles') FROM clinics WHERE id = p_clinic_id
  ))::time;

  -- Check blocked periods
  SELECT true, bp.name INTO v_blocked, v_block_reason
  FROM clinic_blocked_periods bp
  WHERE bp.clinic_id = p_clinic_id
    AND v_day_of_week = ANY(bp.days_of_week)
    AND bp.is_active = true
    AND v_start_time >= bp.start_time
    AND v_start_time < bp.end_time
  LIMIT 1;

  IF v_blocked THEN
    RETURN QUERY SELECT false, 0, 0, 0, true, v_block_reason;
    RETURN;
  END IF;

  -- Get capacity and room filter from config
  SELECT COALESCE(csc.default_capacity, 2), csc.scheduling_room_names
  INTO v_capacity, v_scheduling_rooms
  FROM clinic_schedule_config csc
  WHERE csc.clinic_id = p_clinic_id;

  IF v_capacity IS NULL THEN
    v_capacity := 2;
  END IF;

  -- Count booked (with optional room filter)
  v_booked := count_booked_in_range(p_clinic_id, p_time_range, v_scheduling_rooms);

  RETURN QUERY SELECT
    v_booked < v_capacity,
    v_capacity,
    v_booked,
    GREATEST(v_capacity - v_booked, 0),
    false,
    NULL::text;
END;
$$;

-- 4. Set Masson to only check Exam Room One with capacity 1
UPDATE clinic_schedule_config
SET scheduling_room_names = ARRAY['Exam Room One'],
    default_capacity = 1
WHERE clinic_id = 'efcc1733-7a7b-4eab-8104-a6f49defd7a6';

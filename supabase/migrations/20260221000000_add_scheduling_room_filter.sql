-- Masson room-level scheduling: capacity override
--
-- The sync service (pims-sync) now filters appointments by IDEXX resource ID
-- before writing to pims_appointments. Only the correct room's appointments
-- exist in the table, so SQL functions do NOT need room-name filtering.
--
-- This migration:
-- 1. Adds scheduling_room_names column (kept for documentation, not used in queries)
-- 2. Restores count_booked_in_range to NOT filter by room (sync handles it)
-- 3. Restores check_availability to NOT pass room filter
-- 4. Sets Masson capacity to 1 (single exam room)

-- 1. Add column to clinic_schedule_config (informational only)
ALTER TABLE clinic_schedule_config
ADD COLUMN IF NOT EXISTS scheduling_room_names text[];

COMMENT ON COLUMN clinic_schedule_config.scheduling_room_names IS
  'Informational: which IDEXX rooms this clinic uses for scheduling. Actual filtering happens at sync time via resource IDs.';

-- 2. Restore count_booked_in_range WITHOUT room filtering
-- (sync already ensures only the correct room's appointments are in the table)
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
    -- Appointments from PIMS (already room-filtered by sync)
    SELECT id FROM pims_appointments
    WHERE clinic_id = p_clinic_id
      AND time_range && p_time_range
      AND deleted_at IS NULL
      AND status NOT IN ('cancelled', 'no_show')

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

-- 3. Restore check_availability WITHOUT room filter pass-through
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

  -- Get capacity from config
  SELECT COALESCE(csc.default_capacity, 2)
  INTO v_capacity
  FROM clinic_schedule_config csc
  WHERE csc.clinic_id = p_clinic_id;

  IF v_capacity IS NULL THEN
    v_capacity := 2;
  END IF;

  -- Count booked (sync already filtered to correct room)
  v_booked := count_booked_in_range(p_clinic_id, p_time_range);

  RETURN QUERY SELECT
    v_booked < v_capacity,
    v_capacity,
    v_booked,
    GREATEST(v_capacity - v_booked, 0),
    false,
    NULL::text;
END;
$$;

-- 4. Set Masson capacity to 1 (single exam room for scheduling)
UPDATE clinic_schedule_config
SET scheduling_room_names = ARRAY['Exam Room One'],
    default_capacity = 1
WHERE clinic_id = 'efcc1733-7a7b-4eab-8104-a6f49defd7a6';

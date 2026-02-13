-- Fix check_availability function to use correct table and column names
-- Issue: Function referenced non-existent 'schedule_blocked_periods' table
-- Actual table name: 'clinic_blocked_periods'
-- Also fixes column names: day_of_week -> days_of_week (array), reason -> name

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

  -- Check blocked periods (fixed: use clinic_blocked_periods, days_of_week array, name column)
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
  SELECT COALESCE(csc.default_capacity, 2) INTO v_capacity
  FROM clinic_schedule_config csc
  WHERE csc.clinic_id = p_clinic_id;

  IF v_capacity IS NULL THEN
    v_capacity := 2;
  END IF;

  -- Count booked
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

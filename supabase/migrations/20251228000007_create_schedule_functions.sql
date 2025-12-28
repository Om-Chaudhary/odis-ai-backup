-- Create schedule-related PostgreSQL functions
-- 1. get_available_slots - Main availability query for VAPI
-- 2. book_slot_with_hold - Atomic booking with 5-min hold
-- 3. auto_reschedule_conflicts - Conflict resolution after sync

-- ============================================================================
-- FUNCTION: get_available_slots
-- ============================================================================
-- Returns available time slots for a clinic on a given date
-- Accounts for: capacity, blocked periods, staleness

CREATE OR REPLACE FUNCTION get_available_slots(
  p_clinic_id uuid,
  p_date date
)
RETURNS TABLE (
  slot_start time,
  slot_end time,
  capacity int,
  booked_count int,
  available_count int,
  is_blocked boolean,
  block_reason text,
  last_synced_at timestamptz,
  is_stale boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_config clinic_schedule_config%ROWTYPE;
  v_day_of_week int;
  v_stale_threshold interval;
BEGIN
  -- Get clinic config (or use defaults)
  SELECT * INTO v_config
  FROM clinic_schedule_config
  WHERE clinic_schedule_config.clinic_id = p_clinic_id;

  -- Day of week for the requested date
  v_day_of_week := EXTRACT(DOW FROM p_date)::int;

  -- Stale threshold (default 60 minutes if no config)
  v_stale_threshold := COALESCE(v_config.stale_threshold_minutes, 60) * INTERVAL '1 minute';

  RETURN QUERY
  WITH
  -- Get blocked periods for this day
  blocked_periods AS (
    SELECT
      bp.start_time,
      bp.end_time,
      bp.name
    FROM clinic_blocked_periods bp
    WHERE bp.clinic_id = p_clinic_id
      AND bp.is_active = true
      AND v_day_of_week = ANY(bp.days_of_week)
  ),
  -- Get slots for this date
  slots AS (
    SELECT
      s.start_time,
      s.end_time,
      s.capacity,
      s.booked_count,
      s.last_synced_at
    FROM schedule_slots s
    WHERE s.clinic_id = p_clinic_id
      AND s.date = p_date
    ORDER BY s.start_time
  ),
  -- Count active holds on vapi_bookings
  active_holds AS (
    SELECT
      vb.start_time,
      COUNT(*) as hold_count
    FROM vapi_bookings vb
    WHERE vb.clinic_id = p_clinic_id
      AND vb.date = p_date
      AND vb.status = 'pending'
      AND vb.hold_expires_at > now()
    GROUP BY vb.start_time
  )
  SELECT
    s.start_time,
    s.end_time,
    s.capacity,
    (s.booked_count + COALESCE(h.hold_count, 0))::int,
    GREATEST(0, s.capacity - s.booked_count - COALESCE(h.hold_count, 0))::int,
    EXISTS (
      SELECT 1 FROM blocked_periods bp
      WHERE s.start_time < bp.end_time AND s.end_time > bp.start_time
    ),
    (
      SELECT bp.name FROM blocked_periods bp
      WHERE s.start_time < bp.end_time AND s.end_time > bp.start_time
      LIMIT 1
    ),
    s.last_synced_at,
    s.last_synced_at IS NULL OR s.last_synced_at < now() - v_stale_threshold
  FROM slots s
  LEFT JOIN active_holds h ON h.start_time = s.start_time
  ORDER BY s.start_time;
END;
$$;

COMMENT ON FUNCTION get_available_slots(uuid, date) IS
'Returns available time slots for a clinic on a given date. Includes capacity, blocked period checks, and staleness indicators.';

-- ============================================================================
-- FUNCTION: book_slot_with_hold
-- ============================================================================
-- Creates a VAPI booking with a 5-minute hold
-- Returns success/failure with alternative times if slot is full

CREATE OR REPLACE FUNCTION book_slot_with_hold(
  p_clinic_id uuid,
  p_date date,
  p_time time,
  p_client_name text,
  p_client_phone text,
  p_patient_name text,
  p_species text,
  p_reason text,
  p_is_new_client boolean,
  p_vapi_call_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot schedule_slots%ROWTYPE;
  v_current_booked int;
  v_hold_count int;
  v_total_booked int;
  v_booking_id uuid;
  v_confirmation text;
  v_latest_sync schedule_syncs%ROWTYPE;
  v_alternatives jsonb;
BEGIN
  -- Get the slot for this time
  SELECT * INTO v_slot
  FROM schedule_slots
  WHERE clinic_id = p_clinic_id
    AND date = p_date
    AND start_time = p_time
  FOR UPDATE;  -- Lock the row

  IF v_slot IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No slot available for this time'
    );
  END IF;

  -- Count current bookings (appointments + active holds)
  v_current_booked := v_slot.booked_count;

  SELECT COUNT(*) INTO v_hold_count
  FROM vapi_bookings
  WHERE clinic_id = p_clinic_id
    AND date = p_date
    AND start_time = p_time
    AND status = 'pending'
    AND hold_expires_at > now();

  v_total_booked := v_current_booked + v_hold_count;

  -- Check capacity
  IF v_total_booked >= v_slot.capacity THEN
    -- Get alternative times
    SELECT jsonb_agg(
      jsonb_build_object(
        'time', to_char(slot_start, 'HH12:MI AM'),
        'available', available_count
      )
    ) INTO v_alternatives
    FROM get_available_slots(p_clinic_id, p_date)
    WHERE available_count > 0 AND NOT is_blocked
    LIMIT 5;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'This time slot is no longer available',
      'alternative_times', COALESCE(v_alternatives, '[]'::jsonb)
    );
  END IF;

  -- Get latest sync for freshness tracking
  SELECT * INTO v_latest_sync
  FROM schedule_syncs
  WHERE clinic_id = p_clinic_id
    AND status = 'completed'
  ORDER BY completed_at DESC
  LIMIT 1;

  -- Generate confirmation number
  v_confirmation := 'ODIS-' || upper(substring(gen_random_uuid()::text, 1, 8));

  -- Create the booking with 5-minute hold
  INSERT INTO vapi_bookings (
    clinic_id,
    slot_id,
    date,
    start_time,
    client_name,
    client_phone,
    patient_name,
    species,
    reason,
    is_new_client,
    status,
    confirmation_number,
    vapi_call_id,
    hold_expires_at,
    booked_at_sync_id,
    sync_freshness_at_booking
  ) VALUES (
    p_clinic_id,
    v_slot.id,
    p_date,
    p_time,
    p_client_name,
    p_client_phone,
    p_patient_name,
    p_species,
    p_reason,
    p_is_new_client,
    'pending',
    v_confirmation,
    p_vapi_call_id,
    now() + interval '5 minutes',
    v_latest_sync.id,
    v_latest_sync.completed_at
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'confirmation_number', v_confirmation,
    'slot_id', v_slot.id
  );
END;
$$;

COMMENT ON FUNCTION book_slot_with_hold(uuid, date, time, text, text, text, text, text, boolean, text) IS
'Creates a VAPI booking with a 5-minute hold. Returns success with confirmation number or failure with alternative times.';

-- ============================================================================
-- FUNCTION: auto_reschedule_conflicts
-- ============================================================================
-- Finds and auto-reschedules VAPI bookings that conflict with new IDEXX appointments
-- Called after a sync operation

CREATE OR REPLACE FUNCTION auto_reschedule_conflicts(
  p_clinic_id uuid,
  p_date date
)
RETURNS TABLE (
  booking_id uuid,
  old_time time,
  new_time time,
  client_name text,
  patient_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_new_slot RECORD;
  v_slot schedule_slots%ROWTYPE;
BEGIN
  -- Find conflicted bookings
  FOR v_booking IN
    SELECT
      vb.id,
      vb.start_time,
      vb.client_name,
      vb.patient_name,
      vb.slot_id
    FROM vapi_bookings vb
    JOIN schedule_slots s ON s.id = vb.slot_id
    WHERE vb.clinic_id = p_clinic_id
      AND vb.date = p_date
      AND vb.status = 'pending'
      AND vb.hold_expires_at > now()  -- Only active holds
      AND s.booked_count >= s.capacity  -- Slot is now full
  LOOP
    -- Find next available slot on same day
    SELECT slot_start, slot_end INTO v_new_slot
    FROM get_available_slots(p_clinic_id, p_date)
    WHERE available_count > 0
      AND NOT is_blocked
      AND slot_start > v_booking.start_time  -- Prefer later time
    ORDER BY slot_start
    LIMIT 1;

    -- If no later slot, try earlier
    IF v_new_slot IS NULL THEN
      SELECT slot_start, slot_end INTO v_new_slot
      FROM get_available_slots(p_clinic_id, p_date)
      WHERE available_count > 0
        AND NOT is_blocked
      ORDER BY slot_start
      LIMIT 1;
    END IF;

    -- If found a new slot, reschedule
    IF v_new_slot IS NOT NULL THEN
      -- Get the new slot record
      SELECT * INTO v_slot
      FROM schedule_slots
      WHERE clinic_id = p_clinic_id
        AND date = p_date
        AND start_time = v_new_slot.slot_start;

      -- Update the booking
      UPDATE vapi_bookings
      SET
        start_time = v_new_slot.slot_start,
        slot_id = v_slot.id,
        has_conflict = true,
        original_date = p_date,
        original_time = v_booking.start_time,
        rescheduled_at = now(),
        rescheduled_reason = 'Conflict with IDEXX appointment - auto-rescheduled',
        updated_at = now()
      WHERE id = v_booking.id;

      -- Return the rescheduled booking
      booking_id := v_booking.id;
      old_time := v_booking.start_time;
      new_time := v_new_slot.slot_start;
      client_name := v_booking.client_name;
      patient_name := v_booking.patient_name;
      RETURN NEXT;
    ELSE
      -- No available slot - mark as conflict for manual resolution
      UPDATE vapi_bookings
      SET
        has_conflict = true,
        rescheduled_reason = 'No alternative slot available - needs manual resolution',
        updated_at = now()
      WHERE id = v_booking.id;
    END IF;
  END LOOP;

  RETURN;
END;
$$;

COMMENT ON FUNCTION auto_reschedule_conflicts(uuid, date) IS
'Finds VAPI bookings that conflict with new IDEXX appointments and auto-reschedules them to the next available slot.';

-- ============================================================================
-- FUNCTION: update_slot_booked_count
-- ============================================================================
-- Updates the booked_count for a slot based on schedule_appointments

CREATE OR REPLACE FUNCTION update_slot_booked_count(
  p_clinic_id uuid,
  p_date date,
  p_start_time time
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  -- Count non-cancelled, non-deleted appointments that overlap this slot
  SELECT COUNT(*) INTO v_count
  FROM schedule_appointments sa
  WHERE sa.clinic_id = p_clinic_id
    AND sa.date = p_date
    AND sa.deleted_at IS NULL
    AND sa.status NOT IN ('cancelled', 'no_show')
    AND sa.start_time < (p_start_time + interval '15 minutes')
    AND sa.end_time > p_start_time;

  -- Update the slot
  UPDATE schedule_slots
  SET
    booked_count = v_count,
    updated_at = now()
  WHERE clinic_id = p_clinic_id
    AND date = p_date
    AND start_time = p_start_time;
END;
$$;

COMMENT ON FUNCTION update_slot_booked_count(uuid, date, time) IS
'Updates the booked_count for a slot based on overlapping appointments.';

-- ============================================================================
-- FUNCTION: generate_confirmation_number
-- ============================================================================
-- Generates a unique confirmation number for VAPI bookings

CREATE OR REPLACE FUNCTION generate_confirmation_number()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'ODIS-' || upper(substring(gen_random_uuid()::text, 1, 8));
END;
$$;

COMMENT ON FUNCTION generate_confirmation_number() IS
'Generates a unique confirmation number in format ODIS-XXXXXXXX';

-- Fix VAPI Double-Booking Issue
--
-- Problem: Bookings with expired holds (>5 mins) are invisible to availability checks,
-- allowing double-bookings. This migration updates get_available_slots() and
-- book_slot_with_hold() to count ALL pending/confirmed VAPI bookings, not just
-- active holds.
--
-- Production evidence (Alum Rock, last 30 days):
-- - 4 confirmed double-bookings (same clinic + date + time)
-- - 73 pending bookings with expired holds invisible to the system
--
-- Root cause: Both functions filter WHERE hold_expires_at > now(), causing
-- bookings to disappear after 5 minutes.

-- ============================================================================
-- FUNCTION: get_available_slots (UPDATED)
-- ============================================================================
-- Returns available time slots for a clinic on a given date
-- FIX: Count all pending/confirmed VAPI bookings, not just active holds

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
  -- Count ALL pending/confirmed VAPI bookings (renamed from active_holds)
  -- FIX: Remove hold_expires_at filter to prevent double-booking
  vapi_bookings_count AS (
    SELECT
      vb.start_time,
      COUNT(*) as booking_count
    FROM vapi_bookings vb
    WHERE vb.clinic_id = p_clinic_id
      AND vb.date = p_date
      AND vb.status IN ('pending', 'confirmed')  -- Count all non-cancelled bookings
    GROUP BY vb.start_time
  )
  SELECT
    s.start_time,
    s.end_time,
    s.capacity,
    (s.booked_count + COALESCE(vbc.booking_count, 0))::int,
    GREATEST(0, s.capacity - s.booked_count - COALESCE(vbc.booking_count, 0))::int,
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
  LEFT JOIN vapi_bookings_count vbc ON vbc.start_time = s.start_time
  ORDER BY s.start_time;
END;
$$;

COMMENT ON FUNCTION get_available_slots(uuid, date) IS
'Returns available time slots for a clinic on a given date. Includes capacity, blocked period checks, and staleness indicators. Updated to count all pending/confirmed VAPI bookings.';

-- ============================================================================
-- FUNCTION: book_slot_with_hold (UPDATED)
-- ============================================================================
-- Creates a VAPI booking with a 5-minute hold
-- FIX: Count all pending/confirmed bookings in capacity check

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
  v_vapi_bookings_count int;
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

  -- Count current bookings (appointments + all pending/confirmed VAPI bookings)
  v_current_booked := v_slot.booked_count;

  -- FIX: Count all pending/confirmed bookings, not just active holds
  SELECT COUNT(*) INTO v_vapi_bookings_count
  FROM vapi_bookings
  WHERE clinic_id = p_clinic_id
    AND date = p_date
    AND start_time = p_time
    AND status IN ('pending', 'confirmed');

  v_total_booked := v_current_booked + v_vapi_bookings_count;

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
'Creates a VAPI booking with a 5-minute hold. Returns success with confirmation number or failure with alternative times. Updated to count all pending/confirmed bookings.';

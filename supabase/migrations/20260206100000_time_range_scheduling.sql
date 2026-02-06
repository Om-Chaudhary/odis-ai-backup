-- ============================================================================
-- Migration: Time Range-Based Scheduling (V2)
--
-- Adds PostgreSQL native time ranges (tstzrange) alongside existing tables
-- for gradual migration. Existing schedule_appointments and vapi_bookings
-- tables remain unchanged for backward compatibility.
--
-- Key benefits:
-- - Variable appointment durations per clinic (no fixed 15-min slots)
-- - Efficient range queries with GiST indexes
-- - Simple overlap detection using && operator
-- - No pre-generated slots needed
-- ============================================================================

-- Enable btree_gist extension for composite GiST indexes
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- TABLE: schedule_appointments_v2
-- Time range-based appointments table (runs alongside existing table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS schedule_appointments_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Time range (the core change) - stores start and end as a single range
  time_range tstzrange NOT NULL,

  -- Derived date for simpler queries (computed column)
  date date GENERATED ALWAYS AS (date(lower(time_range) AT TIME ZONE 'UTC')) STORED,

  -- Source tracking
  source text NOT NULL DEFAULT 'idexx', -- 'idexx' | 'vapi' | 'manual'

  -- IDEXX appointment data
  neo_appointment_id text,
  patient_name text,
  client_name text,
  client_phone text,
  provider_name text,
  room_id text,
  appointment_type text,
  status text NOT NULL DEFAULT 'scheduled',

  -- Sync tracking
  sync_hash text,
  last_synced_at timestamptz DEFAULT now(),
  deleted_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure range is valid and bounded
  CONSTRAINT valid_range_v2 CHECK (NOT isempty(time_range)),
  CONSTRAINT bounded_range_v2 CHECK (lower(time_range) IS NOT NULL AND upper(time_range) IS NOT NULL)
);

-- GiST index for efficient overlap queries (THE KEY INDEX)
-- This enables fast && (overlap) operator queries
CREATE INDEX IF NOT EXISTS idx_appointments_v2_time_range
  ON schedule_appointments_v2 USING GiST (clinic_id, time_range);

-- B-tree for date queries (common filter)
CREATE INDEX IF NOT EXISTS idx_appointments_v2_clinic_date
  ON schedule_appointments_v2 (clinic_id, date);

-- Partial index for active appointments only
CREATE INDEX IF NOT EXISTS idx_appointments_v2_active
  ON schedule_appointments_v2 (clinic_id, date)
  WHERE deleted_at IS NULL AND status NOT IN ('cancelled', 'no_show');

-- Unique constraint for IDEXX deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_v2_neo_unique
  ON schedule_appointments_v2 (clinic_id, neo_appointment_id)
  WHERE neo_appointment_id IS NOT NULL;

-- ============================================================================
-- TABLE: vapi_bookings_v2
-- Time range-based VAPI bookings table (runs alongside existing table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vapi_bookings_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Time range
  time_range tstzrange NOT NULL,
  date date GENERATED ALWAYS AS (date(lower(time_range) AT TIME ZONE 'UTC')) STORED,

  -- Client and patient info
  client_name text NOT NULL,
  client_phone text NOT NULL,
  patient_name text NOT NULL,
  species text,
  breed text,
  reason text,
  is_new_client boolean DEFAULT false,

  -- Booking status
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'cancelled'
  confirmation_number text UNIQUE,
  vapi_call_id text,
  hold_expires_at timestamptz,

  -- Conflict tracking (for rescheduling)
  has_conflict boolean NOT NULL DEFAULT false,
  original_time_range tstzrange,
  rescheduled_at timestamptz,
  rescheduled_reason text,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_booking_range_v2 CHECK (NOT isempty(time_range))
);

-- GiST index for time range overlap queries
CREATE INDEX IF NOT EXISTS idx_vapi_bookings_v2_time_range
  ON vapi_bookings_v2 USING GiST (clinic_id, time_range);

-- Index for active holds (without now() since it's not immutable)
CREATE INDEX IF NOT EXISTS idx_vapi_bookings_v2_active_holds
  ON vapi_bookings_v2 (clinic_id, hold_expires_at)
  WHERE status = 'pending';

-- Index for confirmation number lookup
CREATE INDEX IF NOT EXISTS idx_vapi_bookings_v2_confirmation
  ON vapi_bookings_v2 (confirmation_number)
  WHERE confirmation_number IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE schedule_appointments_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE vapi_bookings_v2 ENABLE ROW LEVEL SECURITY;

-- Service role can manage all v2 appointments
CREATE POLICY "Service role can manage appointments v2"
  ON schedule_appointments_v2 FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Service role can manage all v2 bookings
CREATE POLICY "Service role can manage bookings v2"
  ON vapi_bookings_v2 FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- FUNCTION: count_booked_in_range_v2
-- Counts the number of bookings that overlap with a given time range
-- ============================================================================
CREATE OR REPLACE FUNCTION count_booked_in_range_v2(
  p_clinic_id uuid,
  p_time_range tstzrange
)
RETURNS int
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM (
    -- Confirmed appointments from IDEXX/manual sources
    SELECT 1 FROM schedule_appointments_v2
    WHERE clinic_id = p_clinic_id
      AND time_range && p_time_range  -- && is the overlap operator
      AND deleted_at IS NULL
      AND status NOT IN ('cancelled', 'no_show')
    UNION ALL
    -- Active VAPI holds (pending bookings with unexpired holds)
    SELECT 1 FROM vapi_bookings_v2
    WHERE clinic_id = p_clinic_id
      AND time_range && p_time_range
      AND status = 'pending'
      AND hold_expires_at > now()
  ) combined;

  RETURN v_count;
END;
$$;

-- ============================================================================
-- FUNCTION: check_availability_v2
-- Checks if a specific time range is available for booking
-- ============================================================================
CREATE OR REPLACE FUNCTION check_availability_v2(
  p_clinic_id uuid,
  p_time_range tstzrange
)
RETURNS TABLE (
  is_available boolean,
  capacity int,
  booked_count int,
  available_count int,
  is_blocked boolean,
  block_reason text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_capacity int;
  v_booked int;
  v_blocked boolean;
  v_block_reason text;
  v_day_of_week int;
  v_start_time time;
  v_end_time time;
BEGIN
  -- Extract day and times for blocked period check
  v_day_of_week := EXTRACT(DOW FROM lower(p_time_range))::int;
  v_start_time := (lower(p_time_range))::time;
  v_end_time := (upper(p_time_range))::time;

  -- Check if time falls within any blocked period
  SELECT true, bp.name INTO v_blocked, v_block_reason
  FROM clinic_blocked_periods bp
  WHERE bp.clinic_id = p_clinic_id
    AND bp.is_active = true
    AND v_day_of_week = ANY(bp.days_of_week)
    AND (v_start_time, v_end_time) OVERLAPS (bp.start_time, bp.end_time)
  LIMIT 1;

  -- If blocked, return immediately
  IF v_blocked THEN
    RETURN QUERY SELECT false, 0, 0, 0, true, v_block_reason;
    RETURN;
  END IF;

  -- Get capacity from clinic schedule config
  SELECT COALESCE(csc.default_capacity, 2) INTO v_capacity
  FROM clinic_schedule_config csc
  WHERE csc.clinic_id = p_clinic_id;

  v_capacity := COALESCE(v_capacity, 2);

  -- Count overlapping bookings
  v_booked := count_booked_in_range_v2(p_clinic_id, p_time_range);

  -- Return availability result
  RETURN QUERY SELECT
    v_booked < v_capacity,
    v_capacity,
    v_booked,
    GREATEST(0, v_capacity - v_booked),
    false,
    NULL::text;
END;
$$;

-- ============================================================================
-- FUNCTION: get_available_slots_v2
-- Generates available time slots for a given date
-- Uses clinic config for duration and business hours
-- ============================================================================
CREATE OR REPLACE FUNCTION get_available_slots_v2(
  p_clinic_id uuid,
  p_date date,
  p_duration_minutes int DEFAULT NULL
)
RETURNS TABLE (
  slot_start timestamptz,
  slot_end timestamptz,
  capacity int,
  booked_count int,
  available_count int,
  is_blocked boolean,
  block_reason text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_config clinic_schedule_config%ROWTYPE;
  v_duration interval;
  v_current timestamptz;
  v_slot_range tstzrange;
  v_timezone text;
  v_open_time time;
  v_close_time time;
BEGIN
  -- Get clinic schedule config
  SELECT * INTO v_config FROM clinic_schedule_config WHERE clinic_id = p_clinic_id;

  -- Use provided duration or fall back to config, then default to 15 minutes
  v_duration := COALESCE(p_duration_minutes, COALESCE(v_config.slot_duration_minutes, 15)) * INTERVAL '1 minute';
  v_timezone := COALESCE(v_config.timezone, 'America/Los_Angeles');

  -- Default business hours
  v_open_time := COALESCE(v_config.open_time, '08:00'::time);
  v_close_time := COALESCE(v_config.close_time, '18:00'::time);

  -- Check if clinic is open on this day of week
  IF v_config IS NOT NULL AND NOT (EXTRACT(DOW FROM p_date)::int = ANY(v_config.days_of_week)) THEN
    -- Clinic is closed on this day - return no slots
    RETURN;
  END IF;

  -- Start at open time in clinic timezone
  v_current := (p_date || ' ' || v_open_time)::timestamp AT TIME ZONE v_timezone;

  -- Generate slots until close time
  WHILE v_current + v_duration <= (p_date || ' ' || v_close_time)::timestamp AT TIME ZONE v_timezone LOOP
    v_slot_range := tstzrange(v_current, v_current + v_duration);

    -- Return availability for this slot
    RETURN QUERY SELECT
      lower(v_slot_range),
      upper(v_slot_range),
      ca.capacity,
      ca.booked_count,
      ca.available_count,
      ca.is_blocked,
      ca.block_reason
    FROM check_availability_v2(p_clinic_id, v_slot_range) ca;

    -- Move to next slot
    v_current := v_current + v_duration;
  END LOOP;
END;
$$;

-- ============================================================================
-- FUNCTION: book_appointment_with_hold_v2
-- Creates a VAPI booking with a hold period
-- Returns success/failure with alternatives if slot is taken
-- ============================================================================
CREATE OR REPLACE FUNCTION book_appointment_with_hold_v2(
  p_clinic_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_client_name text,
  p_client_phone text,
  p_patient_name text,
  p_species text DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_is_new_client boolean DEFAULT false,
  p_vapi_call_id text DEFAULT NULL,
  p_hold_minutes int DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_time_range tstzrange;
  v_avail RECORD;
  v_booking_id uuid;
  v_confirmation text;
  v_alternatives jsonb;
BEGIN
  -- Create time range from start/end times
  v_time_range := tstzrange(p_start_time, p_end_time);

  -- Check availability for the requested time
  SELECT * INTO v_avail FROM check_availability_v2(p_clinic_id, v_time_range);

  -- If not available, return alternatives
  IF NOT v_avail.is_available THEN
    -- Get up to 5 alternative slots
    SELECT jsonb_agg(jsonb_build_object(
      'start', slot_start,
      'end', slot_end
    ))
    INTO v_alternatives
    FROM (
      SELECT slot_start, slot_end
      FROM get_available_slots_v2(p_clinic_id, p_start_time::date)
      WHERE available_count > 0 AND NOT is_blocked
      LIMIT 5
    ) alternatives;

    RETURN jsonb_build_object(
      'success', false,
      'error', COALESCE(v_avail.block_reason, 'Time slot not available'),
      'alternatives', COALESCE(v_alternatives, '[]'::jsonb)
    );
  END IF;

  -- Generate confirmation number
  v_confirmation := 'ODIS-' || upper(substring(gen_random_uuid()::text, 1, 8));

  -- Create the booking with hold
  INSERT INTO vapi_bookings_v2 (
    clinic_id, time_range, client_name, client_phone, patient_name,
    species, reason, is_new_client, status, confirmation_number,
    vapi_call_id, hold_expires_at
  ) VALUES (
    p_clinic_id, v_time_range, p_client_name, p_client_phone, p_patient_name,
    p_species, p_reason, p_is_new_client, 'pending', v_confirmation,
    p_vapi_call_id, now() + (p_hold_minutes || ' minutes')::interval
  )
  RETURNING id INTO v_booking_id;

  -- Return success with booking details
  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'confirmation_number', v_confirmation,
    'time_range', jsonb_build_object(
      'start', p_start_time,
      'end', p_end_time
    )
  );
END;
$$;

-- ============================================================================
-- FUNCTION: confirm_booking_v2
-- Confirms a pending VAPI booking
-- ============================================================================
CREATE OR REPLACE FUNCTION confirm_booking_v2(
  p_booking_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_booking vapi_bookings_v2%ROWTYPE;
BEGIN
  -- Get the booking
  SELECT * INTO v_booking
  FROM vapi_bookings_v2
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Booking not found'
    );
  END IF;

  IF v_booking.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Booking is not in pending status'
    );
  END IF;

  -- Check if hold has expired
  IF v_booking.hold_expires_at < now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Booking hold has expired'
    );
  END IF;

  -- Update to confirmed
  UPDATE vapi_bookings_v2
  SET status = 'confirmed',
      hold_expires_at = NULL,
      updated_at = now()
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'confirmation_number', v_booking.confirmation_number
  );
END;
$$;

-- ============================================================================
-- FUNCTION: cancel_booking_v2
-- Cancels a VAPI booking
-- ============================================================================
CREATE OR REPLACE FUNCTION cancel_booking_v2(
  p_booking_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE vapi_bookings_v2
  SET status = 'cancelled',
      metadata = metadata || jsonb_build_object('cancellation_reason', p_reason),
      updated_at = now()
  WHERE id = p_booking_id
    AND status IN ('pending', 'confirmed');

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Booking not found or already cancelled'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id
  );
END;
$$;

-- ============================================================================
-- FUNCTION: cleanup_expired_holds_v2
-- Cleans up expired booking holds (run via cron)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_holds_v2()
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE vapi_bookings_v2
  SET status = 'cancelled',
      metadata = metadata || jsonb_build_object('cancellation_reason', 'hold_expired'),
      updated_at = now()
  WHERE status = 'pending'
    AND hold_expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================================
-- Updated at trigger for both v2 tables
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_schedule_appointments_v2_updated_at ON schedule_appointments_v2;
CREATE TRIGGER update_schedule_appointments_v2_updated_at
  BEFORE UPDATE ON schedule_appointments_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vapi_bookings_v2_updated_at ON vapi_bookings_v2;
CREATE TRIGGER update_vapi_bookings_v2_updated_at
  BEFORE UPDATE ON vapi_bookings_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION count_booked_in_range_v2(uuid, tstzrange) TO service_role;
GRANT EXECUTE ON FUNCTION check_availability_v2(uuid, tstzrange) TO service_role;
GRANT EXECUTE ON FUNCTION get_available_slots_v2(uuid, date, int) TO service_role;
GRANT EXECUTE ON FUNCTION book_appointment_with_hold_v2(uuid, timestamptz, timestamptz, text, text, text, text, text, boolean, text, int) TO service_role;
GRANT EXECUTE ON FUNCTION confirm_booking_v2(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION cancel_booking_v2(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_holds_v2() TO service_role;

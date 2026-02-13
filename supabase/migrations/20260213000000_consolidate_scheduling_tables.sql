-- ============================================================================
-- Migration: Consolidate Scheduling Tables
--
-- Merges 5 scheduling tables (v1 + v2) into 2 clean tables:
--   schedule_appointments_v2 -> pims_appointments
--   vapi_bookings + vapi_bookings_v2 -> appointment_bookings
--
-- Drops:
--   schedule_slots, schedule_appointments, schedule_appointments_v2,
--   vapi_bookings, vapi_bookings_v2
--
-- Also consolidates all _v2 functions to clean names (no suffix).
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1a. Create pims_appointments (replaces schedule_appointments_v2)
-- ============================================================================
CREATE TABLE pims_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Time range (tstzrange)
  time_range tstzrange NOT NULL,

  -- Derived date for simpler queries
  date date GENERATED ALWAYS AS (date(lower(time_range) AT TIME ZONE 'UTC')) STORED,

  -- Source tracking
  source text NOT NULL DEFAULT 'idexx',

  -- Appointment data
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

  -- Constraints
  CONSTRAINT pims_valid_range CHECK (NOT isempty(time_range)),
  CONSTRAINT pims_bounded_range CHECK (lower(time_range) IS NOT NULL AND upper(time_range) IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_pims_appointments_time_range ON pims_appointments USING GiST (clinic_id, time_range);
CREATE INDEX idx_pims_appointments_clinic_date ON pims_appointments (clinic_id, date);
CREATE INDEX idx_pims_appointments_active ON pims_appointments (clinic_id, date) WHERE deleted_at IS NULL AND status NOT IN ('cancelled', 'no_show');
CREATE UNIQUE INDEX idx_pims_appointments_neo_unique ON pims_appointments (clinic_id, neo_appointment_id);

-- RLS
ALTER TABLE pims_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage pims_appointments" ON pims_appointments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_pims_appointments_updated_at
  BEFORE UPDATE ON pims_appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 1b. Migrate data from schedule_appointments_v2 -> pims_appointments
-- ============================================================================
INSERT INTO pims_appointments (
  id, clinic_id, time_range, source, neo_appointment_id,
  patient_name, client_name, client_phone, provider_name, room_id,
  appointment_type, status, sync_hash, last_synced_at, deleted_at,
  created_at, updated_at
)
SELECT
  id, clinic_id, time_range, source, neo_appointment_id,
  patient_name, client_name, client_phone, provider_name, room_id,
  appointment_type, status, sync_hash, last_synced_at, deleted_at,
  created_at, updated_at
FROM schedule_appointments_v2;


-- ============================================================================
-- 1c. Create appointment_bookings (replaces vapi_bookings + vapi_bookings_v2)
-- ============================================================================
CREATE TABLE appointment_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Time range (tstzrange) - the canonical time representation
  time_range tstzrange NOT NULL,

  -- Generated columns for backward compatibility with dashboard reads
  date date GENERATED ALWAYS AS (date(lower(time_range) AT TIME ZONE 'UTC')) STORED,
  start_time time GENERATED ALWAYS AS ((lower(time_range) AT TIME ZONE 'America/Los_Angeles')::time) STORED,
  end_time time GENERATED ALWAYS AS ((upper(time_range) AT TIME ZONE 'America/Los_Angeles')::time) STORED,

  -- Client info
  client_name text NOT NULL,
  client_phone text NOT NULL,
  patient_name text NOT NULL,
  species text,
  breed text,
  reason text,
  is_new_client boolean DEFAULT false,

  -- Booking status
  status text NOT NULL DEFAULT 'pending',
  confirmation_number text UNIQUE,
  vapi_call_id text,
  hold_expires_at timestamptz,
  has_conflict boolean NOT NULL DEFAULT false,

  -- Rescheduling
  original_time_range tstzrange,
  original_date date GENERATED ALWAYS AS (
    CASE WHEN original_time_range IS NOT NULL
      THEN date(lower(original_time_range) AT TIME ZONE 'UTC')
      ELSE NULL
    END
  ) STORED,
  original_time time GENERATED ALWAYS AS (
    CASE WHEN original_time_range IS NOT NULL
      THEN (lower(original_time_range) AT TIME ZONE 'America/Los_Angeles')::time
      ELSE NULL
    END
  ) STORED,
  rescheduled_at timestamptz,
  rescheduled_reason text,
  rescheduled_from_id uuid REFERENCES appointment_bookings(id),
  rescheduled_to_id uuid REFERENCES appointment_bookings(id),

  -- Additional columns from v1 for backward compat
  cancelled_at timestamptz,
  cancelled_reason text,
  idexx_appointment_id text,
  idexx_client_id text,
  idexx_patient_id text,
  provider_name text,
  appointment_type text,
  room_id text,
  slot_id uuid, -- nullable, for backward compat during transition

  -- Sync tracking
  booked_at_sync_id uuid,
  sync_freshness_at_booking timestamptz,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT bookings_valid_range CHECK (NOT isempty(time_range))
);

-- Indexes
CREATE INDEX idx_appointment_bookings_time_range ON appointment_bookings USING GiST (clinic_id, time_range);
CREATE INDEX idx_appointment_bookings_confirmation ON appointment_bookings (confirmation_number) WHERE confirmation_number IS NOT NULL;
CREATE INDEX idx_appointment_bookings_active_holds ON appointment_bookings (clinic_id, hold_expires_at) WHERE status = 'pending';
CREATE INDEX idx_appointment_bookings_vapi_call ON appointment_bookings (vapi_call_id);
CREATE INDEX idx_appointment_bookings_clinic_date ON appointment_bookings (clinic_id, date);
CREATE INDEX idx_appointment_bookings_status ON appointment_bookings (status);

-- RLS
ALTER TABLE appointment_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage appointment_bookings" ON appointment_bookings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can view appointment_bookings for their clinic" ON appointment_bookings FOR SELECT TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'practice_owner')
    )
  );
CREATE POLICY "Users can update appointment_bookings for their clinic" ON appointment_bookings FOR UPDATE TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'practice_owner')
    )
  );
CREATE POLICY "Users can delete appointment_bookings for their clinic" ON appointment_bookings FOR DELETE TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'practice_owner')
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_appointment_bookings_updated_at
  BEFORE UPDATE ON appointment_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 1d. Migrate data
-- ============================================================================

-- From vapi_bookings_v2 (primary - has time_range)
INSERT INTO appointment_bookings (
  id, clinic_id, time_range,
  client_name, client_phone, patient_name, species, breed, reason,
  is_new_client, status, confirmation_number, vapi_call_id,
  hold_expires_at, has_conflict,
  original_time_range, rescheduled_at, rescheduled_reason,
  metadata, created_at, updated_at
)
SELECT
  id, clinic_id, time_range,
  client_name, client_phone, patient_name, species, breed, reason,
  is_new_client, status, confirmation_number, vapi_call_id,
  hold_expires_at, has_conflict,
  original_time_range, rescheduled_at, rescheduled_reason,
  metadata, created_at, updated_at
FROM vapi_bookings_v2;

-- From vapi_bookings v1 that DON'T exist in v2 (by vapi_call_id match)
-- Convert date+start_time to tstzrange
INSERT INTO appointment_bookings (
  id, clinic_id, time_range,
  client_name, client_phone, patient_name, species, breed, reason,
  is_new_client, status, confirmation_number, vapi_call_id,
  hold_expires_at, has_conflict,
  original_time_range,
  rescheduled_at, rescheduled_reason,
  rescheduled_from_id, rescheduled_to_id,
  cancelled_at, cancelled_reason,
  idexx_appointment_id, idexx_client_id, idexx_patient_id,
  provider_name, appointment_type, room_id, slot_id,
  booked_at_sync_id, sync_freshness_at_booking,
  metadata, created_at, updated_at
)
SELECT
  vb.id, vb.clinic_id,
  -- Build tstzrange from date + start_time (assume America/Los_Angeles)
  tstzrange(
    (vb.date::text || ' ' || COALESCE(vb.start_time::text, '09:00:00'))::timestamp AT TIME ZONE 'America/Los_Angeles',
    (vb.date::text || ' ' || COALESCE(vb.end_time::text,
      -- If no end_time, add 15 minutes to start_time
      ((vb.date::text || ' ' || COALESCE(vb.start_time::text, '09:00:00'))::timestamp + interval '15 minutes')::time::text
    ))::timestamp AT TIME ZONE 'America/Los_Angeles',
    '[)'
  ),
  vb.client_name, vb.client_phone, vb.patient_name, vb.species, vb.breed, vb.reason,
  vb.is_new_client, vb.status, vb.confirmation_number, vb.vapi_call_id,
  vb.hold_expires_at, vb.has_conflict,
  -- Build original_time_range if original_date exists
  CASE WHEN vb.original_date IS NOT NULL THEN
    tstzrange(
      (vb.original_date::text || ' ' || COALESCE(vb.original_time::text, '09:00:00'))::timestamp AT TIME ZONE 'America/Los_Angeles',
      (vb.original_date::text || ' ' || COALESCE(vb.original_time::text, '09:00:00'))::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '15 minutes',
      '[)'
    )
  ELSE NULL END,
  vb.rescheduled_at, vb.rescheduled_reason,
  vb.rescheduled_from_id, vb.rescheduled_to_id,
  vb.cancelled_at, vb.cancelled_reason,
  vb.idexx_appointment_id, vb.idexx_client_id, vb.idexx_patient_id,
  vb.provider_name, vb.appointment_type, vb.room_id, vb.slot_id,
  vb.booked_at_sync_id, vb.sync_freshness_at_booking,
  vb.metadata, vb.created_at, vb.updated_at
FROM vapi_bookings vb
WHERE NOT EXISTS (
  SELECT 1 FROM vapi_bookings_v2 v2 WHERE v2.vapi_call_id = vb.vapi_call_id
)
-- Also exclude any records that would conflict on id
AND NOT EXISTS (
  SELECT 1 FROM appointment_bookings ab WHERE ab.id = vb.id
);


-- ============================================================================
-- 1e. Create consolidated DB functions (drop _v2 suffix)
-- ============================================================================

-- count_booked_in_range: Count booked appointments + active bookings in a time range
CREATE OR REPLACE FUNCTION count_booked_in_range(
  p_clinic_id uuid,
  p_time_range tstzrange
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


-- check_availability: Check if a time range is available
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
  SELECT true, bp.reason INTO v_blocked, v_block_reason
  FROM schedule_blocked_periods bp
  WHERE bp.clinic_id = p_clinic_id
    AND bp.day_of_week = v_day_of_week
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


-- get_available_slots: Generate and check availability for a date
CREATE OR REPLACE FUNCTION get_available_slots(
  p_clinic_id uuid,
  p_date date,
  p_duration_minutes int DEFAULT NULL
) RETURNS TABLE(
  slot_start timestamptz,
  slot_end timestamptz,
  capacity int,
  booked_count int,
  available_count int,
  is_blocked boolean,
  block_reason text
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_config record;
  v_duration int;
  v_open_time time;
  v_close_time time;
  v_day_of_week int;
  v_daily_hours jsonb;
  v_day_config jsonb;
  v_timezone text;
  v_current_start timestamptz;
  v_current_end timestamptz;
  v_slot_range tstzrange;
  v_result record;
BEGIN
  -- Get clinic config
  SELECT csc.*, c.timezone INTO v_config
  FROM clinic_schedule_config csc
  JOIN clinics c ON c.id = csc.clinic_id
  WHERE csc.clinic_id = p_clinic_id;

  IF v_config IS NULL THEN
    -- No config, use defaults
    v_duration := COALESCE(p_duration_minutes, 15);
    v_open_time := '08:00'::time;
    v_close_time := '18:00'::time;
    v_timezone := 'America/Los_Angeles';
  ELSE
    v_duration := COALESCE(p_duration_minutes, v_config.slot_duration_minutes, 15);
    v_timezone := COALESCE(v_config.timezone, 'America/Los_Angeles');

    -- Check daily hours
    v_day_of_week := EXTRACT(DOW FROM p_date);
    v_daily_hours := v_config.daily_hours;

    IF v_daily_hours IS NOT NULL AND v_daily_hours ? v_day_of_week::text THEN
      v_day_config := v_daily_hours -> v_day_of_week::text;

      IF NOT (v_day_config ->> 'enabled')::boolean THEN
        RETURN; -- Clinic closed on this day
      END IF;

      v_open_time := COALESCE((v_day_config ->> 'open')::time, '08:00'::time);
      v_close_time := COALESCE((v_day_config ->> 'close')::time, '18:00'::time);
    ELSE
      v_open_time := COALESCE(v_config.open_time, '08:00'::time);
      v_close_time := COALESCE(v_config.close_time, '18:00'::time);
    END IF;
  END IF;

  -- Generate slots
  v_current_start := (p_date::text || ' ' || v_open_time::text)::timestamp AT TIME ZONE v_timezone;

  WHILE (v_current_start AT TIME ZONE v_timezone)::time < v_close_time LOOP
    v_current_end := v_current_start + (v_duration || ' minutes')::interval;
    v_slot_range := tstzrange(v_current_start, v_current_end, '[)');

    SELECT * INTO v_result FROM check_availability(p_clinic_id, v_slot_range);

    RETURN QUERY SELECT
      v_current_start,
      v_current_end,
      v_result.capacity,
      v_result.booked_count,
      v_result.available_count,
      v_result.is_blocked,
      v_result.block_reason;

    v_current_start := v_current_start + (v_duration || ' minutes')::interval;
  END LOOP;
END;
$$;


-- book_appointment_with_hold: Book an appointment with a temporary hold
CREATE OR REPLACE FUNCTION book_appointment_with_hold(
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
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_time_range tstzrange;
  v_availability record;
  v_booking_id uuid;
  v_confirmation text;
  v_alternatives jsonb;
BEGIN
  -- Create time range
  v_time_range := tstzrange(p_start_time, p_end_time, '[)');

  -- Check availability
  SELECT * INTO v_availability FROM check_availability(p_clinic_id, v_time_range);

  IF NOT v_availability.is_available THEN
    -- Get alternatives
    SELECT jsonb_agg(jsonb_build_object('start', slot_start, 'end', slot_end))
    INTO v_alternatives
    FROM (
      SELECT slot_start, slot_end
      FROM get_available_slots(p_clinic_id, p_start_time::date)
      WHERE available_count > 0 AND NOT is_blocked
      LIMIT 5
    ) alt;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'slot_not_available',
      'alternatives', COALESCE(v_alternatives, '[]'::jsonb)
    );
  END IF;

  -- Generate confirmation number
  v_confirmation := 'ODIS-' || upper(substr(md5(random()::text), 1, 8));

  -- Create booking
  INSERT INTO appointment_bookings (
    clinic_id, time_range,
    client_name, client_phone, patient_name,
    species, reason, is_new_client,
    status, confirmation_number, vapi_call_id,
    hold_expires_at
  ) VALUES (
    p_clinic_id, v_time_range,
    p_client_name, p_client_phone, p_patient_name,
    p_species, p_reason, p_is_new_client,
    'pending', v_confirmation, p_vapi_call_id,
    now() + (p_hold_minutes || ' minutes')::interval
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'confirmation_number', v_confirmation,
    'time_range', jsonb_build_object('start', p_start_time, 'end', p_end_time)
  );
END;
$$;


-- confirm_booking: Confirm a pending booking
CREATE OR REPLACE FUNCTION confirm_booking(
  p_booking_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking record;
BEGIN
  SELECT * INTO v_booking FROM appointment_bookings WHERE id = p_booking_id;

  IF v_booking IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_not_found');
  END IF;

  IF v_booking.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_not_pending');
  END IF;

  IF v_booking.hold_expires_at IS NOT NULL AND v_booking.hold_expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'hold_expired');
  END IF;

  UPDATE appointment_bookings
  SET status = 'confirmed', hold_expires_at = NULL, updated_at = now()
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'confirmation_number', v_booking.confirmation_number
  );
END;
$$;


-- cancel_booking: Cancel a booking
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id uuid,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking record;
BEGIN
  SELECT * INTO v_booking FROM appointment_bookings WHERE id = p_booking_id;

  IF v_booking IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_not_found');
  END IF;

  UPDATE appointment_bookings
  SET status = 'cancelled',
      cancelled_at = now(),
      cancelled_reason = COALESCE(p_reason, 'Cancelled'),
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('cancellation_reason', COALESCE(p_reason, 'Cancelled')),
      updated_at = now()
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id
  );
END;
$$;


-- cleanup_expired_holds: Cancel bookings with expired holds
CREATE OR REPLACE FUNCTION cleanup_expired_holds() RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE appointment_bookings
  SET status = 'cancelled',
      cancelled_at = now(),
      cancelled_reason = 'hold_expired',
      metadata = COALESCE(metadata, '{}'::jsonb) || '{"cancellation_reason": "hold_expired"}'::jsonb,
      updated_at = now()
  WHERE status = 'pending'
    AND hold_expires_at IS NOT NULL
    AND hold_expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


-- ============================================================================
-- 1f. Drop old functions
-- ============================================================================

-- Drop v1 functions
DROP FUNCTION IF EXISTS get_available_slots(uuid, date) CASCADE;
DROP FUNCTION IF EXISTS book_slot_with_hold(uuid, date, time, text, text, text, text, text, boolean, text) CASCADE;
DROP FUNCTION IF EXISTS update_slot_booked_counts(uuid, date, date) CASCADE;
DROP FUNCTION IF EXISTS update_slot_booked_count(uuid, date, time) CASCADE;
DROP FUNCTION IF EXISTS update_slot_counts_bulk(uuid, date, date) CASCADE;
DROP FUNCTION IF EXISTS auto_reschedule_conflicts(uuid, date) CASCADE;
DROP FUNCTION IF EXISTS confirm_idexx_booking(uuid, text, text, text) CASCADE;

-- Drop v2 functions (replaced by new ones without suffix)
DROP FUNCTION IF EXISTS count_booked_in_range_v2(uuid, tstzrange) CASCADE;
DROP FUNCTION IF EXISTS check_availability_v2(uuid, tstzrange) CASCADE;
DROP FUNCTION IF EXISTS get_available_slots_v2(uuid, date, int) CASCADE;
DROP FUNCTION IF EXISTS book_appointment_with_hold_v2(uuid, timestamptz, timestamptz, text, text, text, text, text, boolean, text, int) CASCADE;
DROP FUNCTION IF EXISTS confirm_booking_v2(uuid) CASCADE;
DROP FUNCTION IF EXISTS cancel_booking_v2(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_holds_v2() CASCADE;


-- ============================================================================
-- 1g. Drop old tables
-- ============================================================================
DROP TABLE IF EXISTS schedule_slots CASCADE;
DROP TABLE IF EXISTS schedule_appointments CASCADE;
DROP TABLE IF EXISTS schedule_appointments_v2 CASCADE;
DROP TABLE IF EXISTS vapi_bookings CASCADE;
DROP TABLE IF EXISTS vapi_bookings_v2 CASCADE;


-- ============================================================================
-- 1h. Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION count_booked_in_range(uuid, tstzrange) TO service_role;
GRANT EXECUTE ON FUNCTION check_availability(uuid, tstzrange) TO service_role;
GRANT EXECUTE ON FUNCTION get_available_slots(uuid, date, int) TO service_role;
GRANT EXECUTE ON FUNCTION book_appointment_with_hold(uuid, timestamptz, timestamptz, text, text, text, text, text, boolean, text, int) TO service_role;
GRANT EXECUTE ON FUNCTION confirm_booking(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION cancel_booking(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_holds() TO service_role;

GRANT EXECUTE ON FUNCTION count_booked_in_range(uuid, tstzrange) TO authenticated;
GRANT EXECUTE ON FUNCTION check_availability(uuid, tstzrange) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots(uuid, date, int) TO authenticated;
GRANT EXECUTE ON FUNCTION book_appointment_with_hold(uuid, timestamptz, timestamptz, text, text, text, text, text, boolean, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_booking(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_holds() TO authenticated;

COMMIT;

-- ============================================================================
-- FUNCTION: confirm_idexx_booking
-- ============================================================================
-- After a successful IDEXX Neo API booking, atomically:
-- 1. Increment schedule_slots.booked_count (permanent booking)
-- 2. Confirm the vapi_bookings hold (remove from transient holds)
--
-- This ensures no double-counting: the hold is removed from active_holds
-- at the same instant booked_count is incremented, so get_available_slots()
-- always sees exactly one unit of capacity consumed for this booking.

CREATE OR REPLACE FUNCTION confirm_idexx_booking(
  p_booking_id uuid,
  p_idexx_appointment_id text,
  p_idexx_client_id text DEFAULT NULL,
  p_idexx_patient_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking vapi_bookings%ROWTYPE;
BEGIN
  -- Get the booking record
  SELECT * INTO v_booking
  FROM vapi_bookings
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
      'error', 'Booking is not in pending status (status: ' || v_booking.status || ')'
    );
  END IF;

  -- Lock and increment the schedule_slots row (permanent booking count)
  UPDATE schedule_slots
  SET booked_count = booked_count + 1,
      updated_at = now()
  WHERE id = v_booking.slot_id;

  -- Confirm the booking hold (removes from active_holds CTE in get_available_slots)
  UPDATE vapi_bookings
  SET status = 'confirmed',
      idexx_appointment_id = p_idexx_appointment_id,
      idexx_client_id = p_idexx_client_id,
      idexx_patient_id = p_idexx_patient_id,
      hold_expires_at = NULL,
      updated_at = now()
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'slot_id', v_booking.slot_id
  );
END;
$$;

COMMENT ON FUNCTION confirm_idexx_booking(uuid, text, text, text) IS
'Atomically confirms an IDEXX booking: increments schedule_slots.booked_count and updates vapi_bookings status to confirmed. Prevents double-counting by running both operations in one transaction.';

GRANT EXECUTE ON FUNCTION confirm_idexx_booking(uuid, text, text, text) TO service_role;

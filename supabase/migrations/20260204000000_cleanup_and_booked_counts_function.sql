-- Migration: Cleanup + Update Slot Booked Counts Function
--
-- This migration:
-- 1. Deletes stuck in_progress records from schedule_syncs (bad data cleanup)
-- 2. Drops the unused daily_hours column from clinic_schedule_config
-- 3. Creates a function to update schedule_slots.booked_count from schedule_appointments
--
-- The update_slot_booked_counts function is critical for inbound appointment sync:
-- After syncing appointments from IDEXX, this function recalculates how many appointments
-- fall within each schedule slot, allowing VAPI to show accurate availability.

-- ============================================================================
-- 1. DATA CLEANUP: Delete stuck sync records
-- ============================================================================
-- These records were never completed (likely from Dec 31 abandoned syncs)
DELETE FROM schedule_syncs
WHERE status = 'in_progress'
  AND completed_at IS NULL;

-- ============================================================================
-- 2. SCHEMA CLEANUP: Drop unused daily_hours column
-- ============================================================================
-- This column was added but never used - all rows have NULL values
-- Business hours are stored in clinics.business_hours instead
ALTER TABLE clinic_schedule_config
DROP COLUMN IF EXISTS daily_hours;

-- ============================================================================
-- 3. CREATE FUNCTION: update_slot_booked_counts
-- ============================================================================
-- Recalculates booked_count for all schedule_slots in a date range
-- based on overlapping appointments in schedule_appointments.
--
-- Logic: Count appointments where:
--   - Same clinic
--   - Same date
--   - Appointment start_time falls within the slot's [start_time, end_time)
--   - Appointment is not cancelled or no_show
--
-- Parameters:
--   p_clinic_id: UUID of the clinic to update
--   p_start_date: Start of date range (inclusive)
--   p_end_date: End of date range (inclusive)
--
-- Example usage:
--   SELECT update_slot_booked_counts('33f3bbb8-6613-45bc-a1f2-d55e30c243ae', '2026-02-04', '2026-02-14');
--
CREATE OR REPLACE FUNCTION update_slot_booked_counts(
  p_clinic_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  slots_updated integer,
  total_appointments integer
) AS $$
DECLARE
  v_slots_updated integer;
  v_total_appointments integer;
BEGIN
  -- Update booked_count for each slot based on overlapping appointments
  WITH appointment_counts AS (
    SELECT
      s.id AS slot_id,
      COUNT(a.id) AS appt_count
    FROM schedule_slots s
    LEFT JOIN schedule_appointments a ON (
      a.clinic_id = s.clinic_id
      AND a.date = s.date
      AND a.start_time >= s.start_time
      AND a.start_time < s.end_time
      AND a.deleted_at IS NULL
      AND a.status NOT IN ('cancelled', 'no_show', 'Cancelled', 'No Show')
    )
    WHERE s.clinic_id = p_clinic_id
      AND s.date BETWEEN p_start_date AND p_end_date
    GROUP BY s.id
  )
  UPDATE schedule_slots s
  SET
    booked_count = COALESCE(ac.appt_count, 0),
    last_synced_at = now()
  FROM appointment_counts ac
  WHERE s.id = ac.slot_id;

  GET DIAGNOSTICS v_slots_updated = ROW_COUNT;

  -- Count total active appointments in range
  SELECT COUNT(*)
  INTO v_total_appointments
  FROM schedule_appointments
  WHERE clinic_id = p_clinic_id
    AND date BETWEEN p_start_date AND p_end_date
    AND deleted_at IS NULL
    AND status NOT IN ('cancelled', 'no_show', 'Cancelled', 'No Show');

  RETURN QUERY SELECT v_slots_updated, v_total_appointments;
END;
$$ LANGUAGE plpgsql;

-- Add function documentation
COMMENT ON FUNCTION update_slot_booked_counts(uuid, date, date) IS
  'Recalculates schedule_slots.booked_count based on schedule_appointments for a clinic and date range. Called after syncing appointments from IDEXX.';

-- ============================================================================
-- 4. ADD SYNC_TYPE COLUMN TO SCHEDULE_SYNCS (for appointment sync tracking)
-- ============================================================================
-- Add sync_type to differentiate between slot generation and appointment sync
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedule_syncs' AND column_name = 'sync_type'
  ) THEN
    ALTER TABLE schedule_syncs
    ADD COLUMN sync_type text DEFAULT 'slots';

    COMMENT ON COLUMN schedule_syncs.sync_type IS 'Type of sync operation: "slots" for slot generation, "appointments" for IDEXX appointment sync';
  END IF;
END $$;

-- Add bulk slot count update function and progress tracking columns
-- Part of IDEXX Sync Production Optimization

-- Add progress tracking columns to schedule_syncs table
ALTER TABLE schedule_syncs
ADD COLUMN IF NOT EXISTS progress_percentage int DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_date date,
ADD COLUMN IF NOT EXISTS failed_dates text[], -- Array of failed dates
ADD COLUMN IF NOT EXISTS partial_success boolean DEFAULT false;

-- Add index for progress queries
CREATE INDEX IF NOT EXISTS idx_schedule_syncs_status_clinic 
  ON schedule_syncs(clinic_id, status, completed_at DESC);

-- Create bulk slot count update function
-- This replaces individual slot updates with a single efficient query
CREATE OR REPLACE FUNCTION update_slot_counts_bulk(
  p_clinic_id uuid,
  p_start_date date,
  p_end_date date
) 
RETURNS TABLE(updated_count bigint) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_count bigint;
BEGIN
  -- Update all slots in the date range with their correct booked counts
  WITH slot_counts AS (
    SELECT 
      s.id,
      COALESCE(COUNT(a.id), 0)::int AS new_booked_count
    FROM schedule_slots s
    LEFT JOIN schedule_appointments a ON 
      a.clinic_id = s.clinic_id
      AND a.date = s.date
      AND a.deleted_at IS NULL
      AND a.status NOT IN ('cancelled', 'no_show')
      AND a.start_time < s.end_time
      AND a.end_time > s.start_time
    WHERE s.clinic_id = p_clinic_id
      AND s.date >= p_start_date
      AND s.date <= p_end_date
    GROUP BY s.id
  )
  UPDATE schedule_slots s
  SET 
    booked_count = sc.new_booked_count,
    updated_at = now()
  FROM slot_counts sc
  WHERE s.id = sc.id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_updated_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_slot_counts_bulk(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION update_slot_counts_bulk(uuid, date, date) TO service_role;

-- Create function to get active sync count for a clinic (for concurrency control)
CREATE OR REPLACE FUNCTION get_active_sync_count(p_clinic_id uuid)
RETURNS int
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::int
  FROM schedule_syncs
  WHERE clinic_id = p_clinic_id
    AND status = 'in_progress'
    AND created_at > now() - interval '10 minutes'; -- Ignore stuck syncs older than 10 min
$$;

GRANT EXECUTE ON FUNCTION get_active_sync_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_sync_count(uuid) TO service_role;

-- Add comment
COMMENT ON FUNCTION update_slot_counts_bulk IS 'Efficiently updates booked_count for all slots in a date range by calculating overlapping appointments';
COMMENT ON FUNCTION get_active_sync_count IS 'Returns count of active (in_progress) syncs for a clinic, used for concurrency control';


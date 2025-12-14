-- Create a function to cleanup stale scheduled calls
-- This can be called manually or by a cron job

CREATE OR REPLACE FUNCTION cleanup_stale_scheduled_calls(
  never_executed_threshold_hours INTEGER DEFAULT 1,
  stuck_queued_threshold_hours INTEGER DEFAULT 2
)
RETURNS TABLE(
  cleaned_type TEXT,
  call_id UUID,
  case_id UUID,
  original_status TEXT,
  new_status TEXT,
  scheduled_for TIMESTAMPTZ
) AS $$
BEGIN
  -- Return calls that will be cleaned up (for logging/visibility)
  RETURN QUERY
  
  -- First, handle never-executed calls
  WITH never_executed AS (
    UPDATE scheduled_discharge_calls sdc
    SET 
      status = 'cancelled',
      ended_at = NOW(),
      ended_reason = 'scheduled-execution-missed',
      metadata = COALESCE(sdc.metadata, '{}'::jsonb) || jsonb_build_object(
        'cleanup_reason', 'never_executed',
        'cleanup_at', NOW(),
        'original_scheduled_for', sdc.scheduled_for
      )
    WHERE sdc.status = 'queued'
      AND sdc.vapi_call_id IS NULL
      AND sdc.scheduled_for < (NOW() - (never_executed_threshold_hours || ' hours')::INTERVAL)
    RETURNING 
      'never_executed'::TEXT AS cleaned_type,
      sdc.id AS call_id,
      sdc.case_id,
      'queued'::TEXT AS original_status,
      'cancelled'::TEXT AS new_status,
      sdc.scheduled_for
  ),
  
  -- Then, handle stuck-queued calls
  stuck_queued AS (
    UPDATE scheduled_discharge_calls sdc
    SET 
      status = 'failed',
      ended_at = NOW(),
      ended_reason = 'status-update-missed',
      metadata = COALESCE(sdc.metadata, '{}'::jsonb) || jsonb_build_object(
        'cleanup_reason', 'stuck_in_queued',
        'cleanup_at', NOW(),
        'original_scheduled_for', sdc.scheduled_for
      )
    WHERE sdc.status = 'queued'
      AND sdc.vapi_call_id IS NOT NULL
      AND sdc.scheduled_for < (NOW() - (stuck_queued_threshold_hours || ' hours')::INTERVAL)
    RETURNING 
      'stuck_queued'::TEXT AS cleaned_type,
      sdc.id AS call_id,
      sdc.case_id,
      'queued'::TEXT AS original_status,
      'failed'::TEXT AS new_status,
      sdc.scheduled_for
  )
  
  SELECT * FROM never_executed
  UNION ALL
  SELECT * FROM stuck_queued;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION cleanup_stale_scheduled_calls IS 
'Cleans up stale scheduled_discharge_calls that were never executed or got stuck in queued status.
Usage: SELECT * FROM cleanup_stale_scheduled_calls();
Parameters:
  - never_executed_threshold_hours: Cancel queued calls without vapi_call_id older than this (default 1 hour)
  - stuck_queued_threshold_hours: Fail queued calls with vapi_call_id older than this (default 2 hours)
Returns the list of calls that were cleaned up.';

-- Grant execute permission to authenticated users (for admin operations)
GRANT EXECUTE ON FUNCTION cleanup_stale_scheduled_calls TO authenticated;


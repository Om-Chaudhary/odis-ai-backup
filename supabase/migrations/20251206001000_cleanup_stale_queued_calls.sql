-- Cleanup stale queued calls that were never executed or got stuck
-- 
-- This migration handles two scenarios:
-- 1. Calls with no vapi_call_id and scheduled_for > 1 hour ago -> cancelled (never executed)
-- 2. Calls with vapi_call_id but still "queued" and scheduled_for > 2 hours ago -> failed (stuck)
--
-- Note: We use a longer threshold for calls with vapi_call_id since they may be legitimately
-- in progress, but if they've been "queued" for 2+ hours with a VAPI ID, something went wrong.

-- First, let's see what we're about to clean up (for logging)
DO $$
DECLARE
  never_executed_count INTEGER;
  stuck_queued_count INTEGER;
BEGIN
  -- Count calls that were never executed (no vapi_call_id, past scheduled time)
  SELECT COUNT(*) INTO never_executed_count
  FROM scheduled_discharge_calls
  WHERE status = 'queued'
    AND vapi_call_id IS NULL
    AND scheduled_for < (NOW() - INTERVAL '1 hour');
    
  -- Count calls that got stuck (have vapi_call_id but still queued)
  SELECT COUNT(*) INTO stuck_queued_count
  FROM scheduled_discharge_calls
  WHERE status = 'queued'
    AND vapi_call_id IS NOT NULL
    AND scheduled_for < (NOW() - INTERVAL '2 hours');
    
  RAISE NOTICE 'Cleaning up % never-executed calls and % stuck-queued calls', 
    never_executed_count, stuck_queued_count;
END $$;

-- Cancel calls that were never executed
-- These had a scheduled_for time that passed but QStash/execute-call never triggered
UPDATE scheduled_discharge_calls
SET 
  status = 'cancelled',
  ended_at = NOW(),
  ended_reason = 'scheduled-execution-missed',
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'cleanup_reason', 'never_executed',
    'cleanup_at', NOW(),
    'original_scheduled_for', scheduled_for
  )
WHERE status = 'queued'
  AND vapi_call_id IS NULL
  AND scheduled_for < (NOW() - INTERVAL '1 hour');

-- Mark stuck calls as failed
-- These have a vapi_call_id so the call was initiated, but status never updated
UPDATE scheduled_discharge_calls
SET 
  status = 'failed',
  ended_at = NOW(),
  ended_reason = 'status-update-missed',
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'cleanup_reason', 'stuck_in_queued',
    'cleanup_at', NOW(),
    'original_scheduled_for', scheduled_for
  )
WHERE status = 'queued'
  AND vapi_call_id IS NOT NULL
  AND scheduled_for < (NOW() - INTERVAL '2 hours');

-- Also clean up any failed calls older than 7 days by marking them as archived
-- (We don't delete, just add metadata for historical tracking)
UPDATE scheduled_discharge_calls
SET 
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'archived_at', NOW(),
    'archive_reason', 'old_failed_call'
  )
WHERE status = 'failed'
  AND created_at < (NOW() - INTERVAL '7 days')
  AND (metadata IS NULL OR NOT (metadata ? 'archived_at'));

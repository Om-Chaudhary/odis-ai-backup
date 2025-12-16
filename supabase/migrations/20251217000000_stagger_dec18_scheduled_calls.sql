-- Migration: Stagger Dec 18 scheduled calls to prevent VAPI concurrency limit
-- 
-- Problem: 37 calls were scheduled for exactly 2025-12-18 22:00:00 UTC.
-- VAPI has a 10-call concurrency limit, so calls beyond the limit fail with
-- "Over Concurrency Limit" error.
--
-- Solution: Spread the calls out with 2-minute intervals starting from 22:00 UTC.
-- This matches the stagger interval used in the batch processor.
--
-- IMPORTANT NOTE: This migration updates the database scheduled_for times, but
-- the QStash jobs are already scheduled at the original time (22:00 UTC).
-- QStash will still trigger all webhooks at 22:00, but they may fail due to
-- concurrency limits. Failed calls can be retried via the dashboard.
--
-- For future calls, the auto-stagger logic in CasesService.scheduleDischargeCall()
-- will prevent this issue by staggering calls at scheduling time.

-- Update scheduled_for for each queued call at 2025-12-17 22:00:00+00
-- Stagger by 2 minutes per call based on created_at order
WITH ranked_calls AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 as row_idx
  FROM scheduled_discharge_calls
  WHERE status = 'queued'
    AND scheduled_for = '2025-12-17 22:00:00+00'
)
UPDATE scheduled_discharge_calls
SET scheduled_for = '2025-12-17 22:00:00+00'::timestamptz + (ranked_calls.row_idx * INTERVAL '2 minutes')
FROM ranked_calls
WHERE scheduled_discharge_calls.id = ranked_calls.id;

-- Update scheduled_for for each queued call at 2025-12-18 22:00:00+00
-- Stagger by 2 minutes per call based on created_at order
WITH ranked_calls AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 as row_idx
  FROM scheduled_discharge_calls
  WHERE status = 'queued'
    AND scheduled_for = '2025-12-18 22:00:00+00'
)
UPDATE scheduled_discharge_calls
SET scheduled_for = '2025-12-18 22:00:00+00'::timestamptz + (ranked_calls.row_idx * INTERVAL '2 minutes')
FROM ranked_calls
WHERE scheduled_discharge_calls.id = ranked_calls.id;

-- Log what was updated
DO $$
DECLARE
  dec17_count INTEGER;
  dec18_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dec17_count
  FROM scheduled_discharge_calls
  WHERE status = 'queued'
    AND scheduled_for >= '2025-12-17 22:00:00+00'
    AND scheduled_for < '2025-12-18 00:00:00+00';
    
  SELECT COUNT(*) INTO dec18_count
  FROM scheduled_discharge_calls
  WHERE status = 'queued'
    AND scheduled_for >= '2025-12-18 22:00:00+00'
    AND scheduled_for < '2025-12-19 00:00:00+00';
  
  RAISE NOTICE 'Staggered % calls for Dec 17, % calls for Dec 18', dec17_count, dec18_count;
END $$;

-- Backfill migration: Mark calls with failure-indicating ended_reasons as failed
-- 
-- This migration updates scheduled_discharge_calls where the ended_reason indicates
-- a failure (silence timeout, no answer, connection error, etc.) but the status
-- was incorrectly set to 'completed' or 'queued'.
--
-- Failure-indicating ended_reasons:
-- - silence-timed-out: Customer didn't respond, call timed out
-- - customer-did-not-answer: No answer from customer
-- - dial-no-answer: Phone rang but no answer
-- - dial-busy: Phone was busy
-- - dial-failed: Failed to dial
-- - Any reason containing 'error' or 'failed-to-connect': Connection issues
-- - voicemail: Only if hangup_on_detection is enabled (handled separately)

-- Update calls with silence-timed-out to failed
UPDATE scheduled_discharge_calls
SET status = 'failed'
WHERE ended_reason = 'silence-timed-out'
  AND status != 'failed';

-- Update calls with customer-did-not-answer to failed
UPDATE scheduled_discharge_calls
SET status = 'failed'
WHERE ended_reason = 'customer-did-not-answer'
  AND status != 'failed';

-- Update calls with dial-no-answer to failed
UPDATE scheduled_discharge_calls
SET status = 'failed'
WHERE ended_reason ILIKE '%dial-no-answer%'
  AND status != 'failed';

-- Update calls with dial-busy to failed
UPDATE scheduled_discharge_calls
SET status = 'failed'
WHERE ended_reason ILIKE '%dial-busy%'
  AND status != 'failed';

-- Update calls with dial-failed to failed
UPDATE scheduled_discharge_calls
SET status = 'failed'
WHERE ended_reason ILIKE '%dial-failed%'
  AND status != 'failed';

-- Update calls with connection errors (SIP errors, failed-to-connect, etc.)
UPDATE scheduled_discharge_calls
SET status = 'failed'
WHERE (
    ended_reason ILIKE '%error%'
    OR ended_reason ILIKE '%failed-to-connect%'
    OR ended_reason ILIKE '%sip%'
  )
  AND status != 'failed';

-- Update calls with voicemail detection where hangup was enabled
-- (These should be retried, so mark as failed)
UPDATE scheduled_discharge_calls
SET status = 'failed'
WHERE ended_reason ILIKE '%voicemail%'
  AND status != 'failed'
  AND (metadata->>'voicemail_hangup_on_detection')::boolean = true;

-- Log the migration results (for debugging, can be removed in production)
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM scheduled_discharge_calls
  WHERE status = 'failed'
    AND ended_reason IS NOT NULL
    AND ended_reason NOT IN ('assistant-ended-call', 'customer-ended-call', 'assistant-forwarded-call');
  
  RAISE NOTICE 'Total failed calls after migration: %', updated_count;
END $$;


-- Fix: Add non-partial unique constraint for upsert compatibility
--
-- Problem: The existing partial index (WHERE deleted_at IS NULL) doesn't work
-- with Supabase's .upsert() method because PostgreSQL requires explicit
-- ON CONFLICT ON CONSTRAINT syntax for partial indexes, which the Supabase
-- JS client doesn't support.
--
-- Solution: Add a regular (non-partial) unique constraint that upsert can target.
-- The partial index remains for query performance on active records.
--
-- Note: Must first clean up duplicates that were allowed by the partial index
-- (e.g., one active record and one soft-deleted record with same neo_appointment_id)

-- Step 1: Remove duplicate records, keeping the "best" version for each (clinic_id, neo_appointment_id)
-- Priority: prefer deleted_at IS NULL (active), then prefer most recent updated_at
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY clinic_id, neo_appointment_id
           ORDER BY
             -- Prefer active (non-deleted) records first
             CASE WHEN deleted_at IS NULL THEN 0 ELSE 1 END,
             -- Then prefer most recently updated
             updated_at DESC
         ) AS rn
  FROM schedule_appointments
),
to_delete AS (
  SELECT id FROM duplicates WHERE rn > 1
)
DELETE FROM schedule_appointments
WHERE id IN (SELECT id FROM to_delete);

-- Step 2: Add a regular unique constraint (works with upsert onConflict)
ALTER TABLE schedule_appointments
  ADD CONSTRAINT schedule_appointments_clinic_neo_unique
  UNIQUE (clinic_id, neo_appointment_id);

-- Keep the partial index for query performance on active records
-- (already exists: schedule_appointments_neo_unique)

-- Add comment explaining the dual-index strategy
COMMENT ON CONSTRAINT schedule_appointments_clinic_neo_unique ON schedule_appointments IS
  'Non-partial unique constraint for upsert compatibility. The partial index (schedule_appointments_neo_unique) remains for query optimization on active records.';

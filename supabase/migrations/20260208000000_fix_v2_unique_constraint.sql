-- Fix schedule_appointments_v2 unique constraint for PostgREST upsert compatibility
-- The partial unique index (WHERE neo_appointment_id IS NOT NULL) cannot be matched
-- by Supabase's PostgREST upsert onConflict specification, causing all V2 writes to fail.
-- Replace with a non-partial unique index. PostgreSQL treats NULLs as distinct by default,
-- so rows without neo_appointment_id (e.g., VAPI bookings) can still have multiple entries.

-- Drop the partial unique index
DROP INDEX IF EXISTS idx_appointments_v2_neo_unique;

-- Create a non-partial unique index that PostgREST can match
CREATE UNIQUE INDEX idx_appointments_v2_neo_unique
  ON schedule_appointments_v2 (clinic_id, neo_appointment_id);

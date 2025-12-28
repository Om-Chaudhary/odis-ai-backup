-- Drop legacy schedule tables and functions
-- This is part of the schedule sync redesign for VAPI booking integration
-- IMPORTANT: This drops all existing appointment data (only 3 test records exist)

-- First drop the function (has dependencies on tables)
DROP FUNCTION IF EXISTS get_available_slots(uuid, date, uuid, integer, time, time) CASCADE;

-- Drop RLS policies before tables
DROP POLICY IF EXISTS "Users can view appointment requests for their clinic" ON appointment_requests;
DROP POLICY IF EXISTS "Users can create appointment requests for their clinic" ON appointment_requests;
DROP POLICY IF EXISTS "Users can update appointment requests for their clinic" ON appointment_requests;
DROP POLICY IF EXISTS "Service role can manage appointment requests" ON appointment_requests;

DROP POLICY IF EXISTS "Users can view appointments for their clinic" ON appointments;
DROP POLICY IF EXISTS "Users can create appointments for their clinic" ON appointments;
DROP POLICY IF EXISTS "Users can update appointments for their clinic" ON appointments;
DROP POLICY IF EXISTS "Users can delete appointments for their clinic" ON appointments;
DROP POLICY IF EXISTS "Service role can manage appointments" ON appointments;

DROP POLICY IF EXISTS "Users can view schedule syncs for their clinic" ON schedule_syncs;
DROP POLICY IF EXISTS "Admins can manage schedule syncs" ON schedule_syncs;
DROP POLICY IF EXISTS "Service role can manage schedule syncs" ON schedule_syncs;

-- Now drop tables in correct order (respect foreign key constraints)
DROP TABLE IF EXISTS appointment_requests CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS schedule_syncs CASCADE;

-- Note: We keep the following tables as they're still needed:
-- - clinics (central clinic registry)
-- - providers (veterinarians linked to clinics)
-- - clinic_messages (voicemail/callback requests)

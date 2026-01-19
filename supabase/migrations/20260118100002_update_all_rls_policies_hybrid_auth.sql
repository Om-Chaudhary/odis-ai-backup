-- ============================================================================
-- MIGRATION: Update ALL Remaining RLS Policies for Hybrid Auth
-- ============================================================================
-- This migration updates ALL remaining table RLS policies to work with both:
-- - Clerk JWTs (web app)
-- - Supabase Auth JWTs (iOS app)
--
-- Tables updated:
-- - inbound_vapi_calls
-- - clinic_messages
-- - vapi_bookings
-- - clinic_assistants
-- - schedule_slots
-- - schedule_appointments
-- - clinic_schedule_config
-- - clinic_blocked_periods
-- - schedule_syncs
-- - patients
-- - discharge_summaries
-- - scheduled_discharge_calls
-- - scheduled_discharge_emails
-- - soap_notes
-- - transcriptions
-- - outbound_calls
-- - call_patients
--
-- Pattern: Replace clinic_name lookups with user_has_clinic_access(clinic_id)
--
-- Date: 2026-01-18
-- Phase: 4 of 8 (Clerk Integration)
-- ============================================================================

-- ============================================================================
-- 1. INBOUND_VAPI_CALLS - Inbound Call Tracking
-- ============================================================================
DROP POLICY IF EXISTS "Users can view clinic inbound calls" ON inbound_vapi_calls;
DROP POLICY IF EXISTS "Users can delete inbound calls for their clinic" ON inbound_vapi_calls;
DROP POLICY IF EXISTS "Service role can manage inbound calls" ON inbound_vapi_calls;

CREATE POLICY "Users can view inbound calls" ON inbound_vapi_calls
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  -- Note: inbound_vapi_calls uses clinic_name (legacy) not clinic_id
  -- Will need data migration to add clinic_id column later
  OR clinic_name IN (
    SELECT c.name FROM clinics c
    WHERE user_has_clinic_access(c.id)
  )
);

CREATE POLICY "Admins can delete inbound calls" ON inbound_vapi_calls
FOR DELETE
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  OR (
    clinic_name IN (
      SELECT c.name FROM clinics c
      WHERE user_has_clinic_access(c.id)
    )
    AND auth.is_org_owner_or_admin()
  )
);

CREATE POLICY "Service role manages inbound calls" ON inbound_vapi_calls
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 2. CLINIC_MESSAGES - Messages
-- ============================================================================
DROP POLICY IF EXISTS "Users can view clinic messages" ON clinic_messages;
DROP POLICY IF EXISTS "Users can delete messages for their clinic" ON clinic_messages;
DROP POLICY IF EXISTS "Users can create messages for their clinic" ON clinic_messages;
DROP POLICY IF EXISTS "Users can update messages for their clinic" ON clinic_messages;
DROP POLICY IF EXISTS "Service role can manage clinic messages" ON clinic_messages;

CREATE POLICY "Users can view messages" ON clinic_messages
FOR SELECT
USING (
  auth.is_super_admin()
  OR assigned_to_user_id = auth.uid()
  OR user_has_clinic_access(clinic_id)
);

CREATE POLICY "Users can create messages" ON clinic_messages
FOR INSERT
WITH CHECK (
  user_has_clinic_access(clinic_id)
);

CREATE POLICY "Users can update messages" ON clinic_messages
FOR UPDATE
USING (
  auth.is_super_admin()
  OR assigned_to_user_id = auth.uid()
  OR user_has_clinic_access(clinic_id)
);

CREATE POLICY "Admins can delete messages" ON clinic_messages
FOR DELETE
USING (
  auth.is_super_admin()
  OR assigned_to_user_id = auth.uid()
  OR (
    user_has_clinic_access(clinic_id)
    AND auth.is_org_owner_or_admin()
  )
);

CREATE POLICY "Service role manages messages" ON clinic_messages
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 3. VAPI_BOOKINGS - Appointment Bookings
-- ============================================================================
DROP POLICY IF EXISTS "Users can view bookings for their clinic" ON vapi_bookings;
DROP POLICY IF EXISTS "Users can update bookings for their clinic" ON vapi_bookings;
DROP POLICY IF EXISTS "Users can delete bookings for their clinic" ON vapi_bookings;
DROP POLICY IF EXISTS "Service role can manage bookings" ON vapi_bookings;

CREATE POLICY "Users can view bookings" ON vapi_bookings
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_has_clinic_access(clinic_id)
);

CREATE POLICY "Users can update bookings" ON vapi_bookings
FOR UPDATE
USING (
  auth.is_super_admin()
  OR user_has_clinic_access(clinic_id)
);

CREATE POLICY "Admins can delete bookings" ON vapi_bookings
FOR DELETE
USING (
  auth.is_super_admin()
  OR (
    user_has_clinic_access(clinic_id)
    AND auth.is_org_owner_or_admin()
  )
);

CREATE POLICY "Service role manages bookings" ON vapi_bookings
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 4. CLINIC_ASSISTANTS - VAPI Assistant Configurations
-- ============================================================================
DROP POLICY IF EXISTS "Users can view clinic assistants" ON clinic_assistants;
DROP POLICY IF EXISTS "Admins can manage clinic assistants" ON clinic_assistants;
DROP POLICY IF EXISTS "Service role can manage clinic assistants" ON clinic_assistants;

CREATE POLICY "Users can view assistants" ON clinic_assistants
FOR SELECT
USING (
  auth.is_super_admin()
  -- Note: clinic_assistants uses clinic_name not clinic_id
  OR clinic_name IN (
    SELECT c.name FROM clinics c
    WHERE user_has_clinic_access(c.id)
  )
);

CREATE POLICY "Admins can manage assistants" ON clinic_assistants
FOR ALL
USING (
  auth.is_super_admin()
  OR (
    clinic_name IN (
      SELECT c.name FROM clinics c
      WHERE user_has_clinic_access(c.id)
    )
    AND auth.is_org_owner_or_admin()
  )
);

CREATE POLICY "Service role manages assistants" ON clinic_assistants
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 5. SCHEDULE_SLOTS - Available Time Slots
-- ============================================================================
DROP POLICY IF EXISTS "Users can view slots for their clinic" ON schedule_slots;
DROP POLICY IF EXISTS "Users can view schedule slots for their clinic" ON schedule_slots;
DROP POLICY IF EXISTS "Service role can manage slots" ON schedule_slots;

CREATE POLICY "Users can view slots" ON schedule_slots
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_has_clinic_access(clinic_id)
);

CREATE POLICY "Service role manages slots" ON schedule_slots
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 6. SCHEDULE_APPOINTMENTS - Scheduled Appointments
-- ============================================================================
DROP POLICY IF EXISTS "Users can view appointments for their clinic" ON schedule_appointments;
DROP POLICY IF EXISTS "Users can create appointments for their clinic" ON schedule_appointments;
DROP POLICY IF EXISTS "Users can update appointments for their clinic" ON schedule_appointments;
DROP POLICY IF EXISTS "Users can delete appointments for their clinic" ON schedule_appointments;
DROP POLICY IF EXISTS "Service role can manage appointments" ON schedule_appointments;

CREATE POLICY "Users can view appointments" ON schedule_appointments
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_has_clinic_access(clinic_id)
);

CREATE POLICY "Users can create appointments" ON schedule_appointments
FOR INSERT
WITH CHECK (
  user_has_clinic_access(clinic_id)
);

CREATE POLICY "Users can update appointments" ON schedule_appointments
FOR UPDATE
USING (
  auth.is_super_admin()
  OR user_has_clinic_access(clinic_id)
);

CREATE POLICY "Admins can delete appointments" ON schedule_appointments
FOR DELETE
USING (
  auth.is_super_admin()
  OR (
    user_has_clinic_access(clinic_id)
    AND auth.is_org_owner_or_admin()
  )
);

CREATE POLICY "Service role manages appointments" ON schedule_appointments
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 7. CLINIC_SCHEDULE_CONFIG - Schedule Configuration
-- ============================================================================
DROP POLICY IF EXISTS "Users can view config for their clinic" ON clinic_schedule_config;
DROP POLICY IF EXISTS "Users can view their clinic schedule config" ON clinic_schedule_config;
DROP POLICY IF EXISTS "Admins can manage config" ON clinic_schedule_config;
DROP POLICY IF EXISTS "Service role can manage config" ON clinic_schedule_config;

CREATE POLICY "Users can view schedule config" ON clinic_schedule_config
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_has_clinic_access(clinic_id)
);

CREATE POLICY "Admins can manage schedule config" ON clinic_schedule_config
FOR ALL
USING (
  auth.is_super_admin()
  OR (
    user_has_clinic_access(clinic_id)
    AND auth.is_org_owner_or_admin()
  )
);

CREATE POLICY "Service role manages schedule config" ON clinic_schedule_config
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 8. CLINIC_BLOCKED_PERIODS - Blocked Time Periods
-- ============================================================================
DROP POLICY IF EXISTS "Users can view blocked periods for their clinic" ON clinic_blocked_periods;
DROP POLICY IF EXISTS "Users can view their clinic blocked periods" ON clinic_blocked_periods;
DROP POLICY IF EXISTS "Admins can manage blocked periods" ON clinic_blocked_periods;
DROP POLICY IF EXISTS "Service role can manage blocked periods" ON clinic_blocked_periods;

CREATE POLICY "Users can view blocked periods" ON clinic_blocked_periods
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_has_clinic_access(clinic_id)
);

CREATE POLICY "Admins can manage blocked periods" ON clinic_blocked_periods
FOR ALL
USING (
  auth.is_super_admin()
  OR (
    user_has_clinic_access(clinic_id)
    AND auth.is_org_owner_or_admin()
  )
);

CREATE POLICY "Service role manages blocked periods" ON clinic_blocked_periods
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 9. SCHEDULE_SYNCS - Schedule Sync Status
-- ============================================================================
DROP POLICY IF EXISTS "Users can view syncs for their clinic" ON schedule_syncs;
DROP POLICY IF EXISTS "Users can view schedule syncs for their clinic" ON schedule_syncs;
DROP POLICY IF EXISTS "Users can view their clinic schedule syncs" ON schedule_syncs;
DROP POLICY IF EXISTS "Admins can manage schedule syncs" ON schedule_syncs;
DROP POLICY IF EXISTS "Service role can manage schedule syncs" ON schedule_syncs;
DROP POLICY IF EXISTS "Service role can manage syncs" ON schedule_syncs;

CREATE POLICY "Users can view schedule syncs" ON schedule_syncs
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_has_clinic_access(clinic_id)
);

CREATE POLICY "Admins can manage schedule syncs" ON schedule_syncs
FOR ALL
USING (
  auth.is_super_admin()
  OR (
    user_has_clinic_access(clinic_id)
    AND auth.is_org_owner_or_admin()
  )
);

CREATE POLICY "Service role manages schedule syncs" ON schedule_syncs
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 10. PATIENTS - Patient Records (Legacy table - uses case_id)
-- ============================================================================
-- Note: patients table has case_id, user_id but NO clinic_id
-- Access is via case relationship for backward compatibility
DROP POLICY IF EXISTS "Users can view patients" ON patients;
DROP POLICY IF EXISTS "Users can insert patients" ON patients;
DROP POLICY IF EXISTS "Users can update patients" ON patients;
DROP POLICY IF EXISTS "Users can delete patients" ON patients;

CREATE POLICY "Users can view patients" ON patients
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  OR clinic_id IN (
    SELECT id FROM clinics WHERE user_has_clinic_access(id)
  )
  OR case_id IN (
    SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
  )
);

CREATE POLICY "Users can insert patients" ON patients
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR clinic_id IN (
    SELECT id FROM clinics WHERE user_has_clinic_access(id)
  )
);

CREATE POLICY "Users can update patients" ON patients
FOR UPDATE
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  OR clinic_id IN (
    SELECT id FROM clinics WHERE user_has_clinic_access(id)
  )
);

CREATE POLICY "Users can delete patients" ON patients
FOR DELETE
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
);

-- ============================================================================
-- 11. DISCHARGE_SUMMARIES - Discharge Information
-- ============================================================================
DROP POLICY IF EXISTS "Users can view discharge summaries" ON discharge_summaries;
DROP POLICY IF EXISTS "Users can insert discharge summaries" ON discharge_summaries;
DROP POLICY IF EXISTS "Users can update discharge summaries" ON discharge_summaries;
DROP POLICY IF EXISTS "Users can delete discharge summaries" ON discharge_summaries;

CREATE POLICY "Users can view discharge summaries" ON discharge_summaries
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  OR case_id IN (
    SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
  )
);

CREATE POLICY "Users can insert discharge summaries" ON discharge_summaries
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR case_id IN (
    SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
  )
);

CREATE POLICY "Users can update discharge summaries" ON discharge_summaries
FOR UPDATE
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  OR case_id IN (
    SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
  )
);

CREATE POLICY "Vets can delete discharge summaries" ON discharge_summaries
FOR DELETE
USING (
  auth.is_super_admin()
  OR (
    case_id IN (
      SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
    )
    AND auth.is_veterinarian()
  )
);

-- ============================================================================
-- 12. SCHEDULED_DISCHARGE_CALLS - Outbound Call Scheduling
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own scheduled calls" ON scheduled_discharge_calls;
DROP POLICY IF EXISTS "Users can create own scheduled calls" ON scheduled_discharge_calls;
DROP POLICY IF EXISTS "Users can update own scheduled calls" ON scheduled_discharge_calls;
DROP POLICY IF EXISTS "Users can delete own scheduled calls" ON scheduled_discharge_calls;
DROP POLICY IF EXISTS "Service role can manage calls" ON scheduled_discharge_calls;

CREATE POLICY "Users can view scheduled calls" ON scheduled_discharge_calls
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  OR case_id IN (
    SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
  )
);

CREATE POLICY "Users can create scheduled calls" ON scheduled_discharge_calls
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR case_id IN (
    SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
  )
);

CREATE POLICY "Users can update scheduled calls" ON scheduled_discharge_calls
FOR UPDATE
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  OR case_id IN (
    SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
  )
);

CREATE POLICY "Users can delete scheduled calls" ON scheduled_discharge_calls
FOR DELETE
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  OR (
    case_id IN (
      SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
    )
    AND auth.is_org_owner_or_admin()
  )
);

CREATE POLICY "Service role manages calls" ON scheduled_discharge_calls
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 13. SCHEDULED_DISCHARGE_EMAILS - Outbound Email Scheduling
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own scheduled emails" ON scheduled_discharge_emails;
DROP POLICY IF EXISTS "Users can create own scheduled emails" ON scheduled_discharge_emails;
DROP POLICY IF EXISTS "Users can update own scheduled emails" ON scheduled_discharge_emails;
DROP POLICY IF EXISTS "Users can delete own scheduled emails" ON scheduled_discharge_emails;
DROP POLICY IF EXISTS "Service role can manage emails" ON scheduled_discharge_emails;

CREATE POLICY "Users can view scheduled emails" ON scheduled_discharge_emails
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  OR case_id IN (
    SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
  )
);

CREATE POLICY "Users can create scheduled emails" ON scheduled_discharge_emails
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR case_id IN (
    SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
  )
);

CREATE POLICY "Users can update scheduled emails" ON scheduled_discharge_emails
FOR UPDATE
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  OR case_id IN (
    SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
  )
);

CREATE POLICY "Users can delete scheduled emails" ON scheduled_discharge_emails
FOR DELETE
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  OR (
    case_id IN (
      SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
    )
    AND auth.is_org_owner_or_admin()
  )
);

CREATE POLICY "Service role manages emails" ON scheduled_discharge_emails
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 14. SOAP_NOTES - Medical Notes
-- ============================================================================
DROP POLICY IF EXISTS "Users can view soap notes" ON soap_notes;
DROP POLICY IF EXISTS "Users can insert soap notes" ON soap_notes;
DROP POLICY IF EXISTS "Users can update soap notes" ON soap_notes;
DROP POLICY IF EXISTS "Vets can delete soap notes" ON soap_notes;

CREATE POLICY "Users can view soap notes" ON soap_notes
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  OR case_id IN (
    SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
  )
);

CREATE POLICY "Users can insert soap notes" ON soap_notes
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR case_id IN (
    SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
  )
);

CREATE POLICY "Users can update soap notes" ON soap_notes
FOR UPDATE
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  OR (
    case_id IN (
      SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
    )
    AND auth.is_veterinarian()
  )
);

CREATE POLICY "Vets can delete soap notes" ON soap_notes
FOR DELETE
USING (
  auth.is_super_admin()
  OR (
    case_id IN (
      SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
    )
    AND auth.is_veterinarian()
  )
);

-- ============================================================================
-- 15. TRANSCRIPTIONS - Call Transcriptions
-- ============================================================================
DROP POLICY IF EXISTS "Users can view transcriptions" ON transcriptions;
DROP POLICY IF EXISTS "Users can insert transcriptions" ON transcriptions;
DROP POLICY IF EXISTS "Users can update transcriptions" ON transcriptions;
DROP POLICY IF EXISTS "Users can delete transcriptions" ON transcriptions;

CREATE POLICY "Users can view transcriptions" ON transcriptions
FOR SELECT
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
  OR case_id IN (
    SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
  )
);

CREATE POLICY "Users can insert transcriptions" ON transcriptions
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR case_id IN (
    SELECT id FROM cases WHERE user_has_clinic_access(clinic_id)
  )
);

CREATE POLICY "Users can update transcriptions" ON transcriptions
FOR UPDATE
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
);

CREATE POLICY "Users can delete transcriptions" ON transcriptions
FOR DELETE
USING (
  auth.is_super_admin()
  OR user_id = auth.uid()
);

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- Tables with clinic_name (legacy pattern) that need data migration:
-- - inbound_vapi_calls
-- - clinic_assistants
--
-- These tables should eventually have clinic_id added and populated.
-- For now, policies use: clinic_name IN (SELECT name FROM clinics WHERE ...)
--
-- All other tables now use the hybrid auth pattern via:
-- - user_has_clinic_access(clinic_id) for direct clinic access
-- - case_id subqueries for case-related tables
-- - auth.is_super_admin() for admin override
-- - auth.is_org_owner_or_admin() for management operations
-- - auth.is_veterinarian() for medical operations
-- ============================================================================

-- Migration: Migrate pilot clinics to schedule sync schema
-- Jira: ODIS-63
-- Date: 2025-12-01
-- Purpose: Create clinic and provider records for 2 pilot clinics
-- 
-- Pilot Clinics:
-- 1. Alum Rock Animal Hospital
--    - garrybath@hotmail.com
--    - nimirbath@gmail.com
-- 2. Del Valle Pet Hospital
--    - jattvc@gmail.com
--    - ramirezernestina409@gmail.com
--    - chaudharyom17@gmail.com

-- ============================================================================
-- VALIDATION QUERIES (Run these first to review what will be created)
-- ============================================================================

-- 1. Check current users with clinic names
-- SELECT 
--   email,
--   first_name,
--   last_name,
--   role,
--   clinic_name,
--   clinic_email,
--   clinic_phone,
--   pims_systems
-- FROM users
-- WHERE clinic_name IN ('Alum Rock Animal Hospital', 'Del Valle Pet Hospital')
-- ORDER BY clinic_name, email;

-- 2. Check for any existing clinics
-- SELECT id, name, email, phone, pims_type, is_active
-- FROM clinics
-- WHERE name IN ('Alum Rock Animal Hospital', 'Del Valle Pet Hospital');

-- 3. Check for any existing providers
-- SELECT p.id, p.name, p.role, c.name as clinic_name
-- FROM providers p
-- JOIN clinics c ON c.id = p.clinic_id
-- WHERE c.name IN ('Alum Rock Animal Hospital', 'Del Valle Pet Hospital');

-- ============================================================================
-- MIGRATION: CREATE CLINICS
-- ============================================================================

-- Create clinic records for the 2 pilot clinics
INSERT INTO clinics (name, email, phone, pims_type, is_active)
VALUES
  (
    'Alum Rock Animal Hospital',
    'alumrockanimalhospital@yahoo.com',
    '+14082903744',
    'idexx_neo',
    true
  ),
  (
    'Del Valle Pet Hospital',
    'info@delvallepethospital.com',
    '(925) 443-6000',
    'avimark',
    true
  )
ON CONFLICT (name) DO UPDATE
SET
  email = COALESCE(EXCLUDED.email, clinics.email),
  phone = COALESCE(EXCLUDED.phone, clinics.phone),
  pims_type = COALESCE(EXCLUDED.pims_type, clinics.pims_type),
  updated_at = now();

-- ============================================================================
-- MIGRATION: CREATE PROVIDERS
-- ============================================================================

-- Create provider records for users who are veterinarians, vet techs, or practice owners
-- Maps user roles to provider roles:
--   - veterinarian -> veterinarian
--   - vet_tech -> vet_tech
--   - practice_owner -> veterinarian (default)
--   - admin -> excluded (admins are not providers)
INSERT INTO providers (clinic_id, neo_provider_id, name, role, is_active)
SELECT 
  c.id as clinic_id,
  -- Generate neo_provider_id as UUID (users table doesn't have metadata column)
  gen_random_uuid()::text as neo_provider_id,
  -- Build full name from first_name and last_name
  TRIM(
    CONCAT(
      COALESCE(u.first_name, ''),
      CASE 
        WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL THEN ' ' 
        ELSE '' 
      END,
      COALESCE(u.last_name, '')
    )
  ) as name,
  -- Map user role to provider role
  CASE 
    WHEN u.role = 'veterinarian' THEN 'veterinarian'
    WHEN u.role = 'vet_tech' THEN 'vet_tech'
    WHEN u.role = 'practice_owner' THEN 'veterinarian' -- Practice owners are veterinarians
    ELSE 'veterinarian' -- Default fallback
  END as role,
  true as is_active
FROM users u
INNER JOIN clinics c ON c.name = TRIM(u.clinic_name)
WHERE u.clinic_name IN ('Alum Rock Animal Hospital', 'Del Valle Pet Hospital')
  AND u.role IN ('veterinarian', 'vet_tech', 'practice_owner')
  -- Note: Multiple users with the same name are allowed (each gets unique neo_provider_id UUID)
  -- The ON CONFLICT clause handles any actual duplicates based on (clinic_id, neo_provider_id)
ON CONFLICT (clinic_id, neo_provider_id) DO NOTHING;

-- ============================================================================
-- VALIDATION QUERIES (Run these after migration to verify)
-- ============================================================================

-- 1. Verify clinics were created
-- SELECT id, name, email, phone, pims_type, is_active, created_at
-- FROM clinics
-- WHERE name IN ('Alum Rock Animal Hospital', 'Del Valle Pet Hospital')
-- ORDER BY name;

-- 2. Verify providers were created
-- SELECT 
--   p.id,
--   p.name,
--   p.role,
--   p.neo_provider_id,
--   c.name as clinic_name,
--   u.email as user_email
-- FROM providers p
-- JOIN clinics c ON c.id = p.clinic_id
-- LEFT JOIN users u ON 
--   TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) = p.name
--   AND u.clinic_name = c.name
-- WHERE c.name IN ('Alum Rock Animal Hospital', 'Del Valle Pet Hospital')
-- ORDER BY c.name, p.name;

-- 3. Check for users without matching clinics (should be none for pilot clinics)
-- SELECT 
--   u.id,
--   u.email,
--   u.first_name,
--   u.last_name,
--   u.clinic_name,
--   u.role
-- FROM users u
-- WHERE u.clinic_name IN ('Alum Rock Animal Hospital', 'Del Valle Pet Hospital')
--   AND NOT EXISTS (
--     SELECT 1 FROM clinics c 
--     WHERE c.name = TRIM(u.clinic_name)
--   );

-- 4. Check for users who should be providers but aren't
-- SELECT 
--   u.id,
--   u.email,
--   u.first_name,
--   u.last_name,
--   u.clinic_name,
--   u.role
-- FROM users u
-- WHERE u.clinic_name IN ('Alum Rock Animal Hospital', 'Del Valle Pet Hospital')
--   AND u.role IN ('veterinarian', 'vet_tech', 'practice_owner')
--   AND NOT EXISTS (
--     SELECT 1 
--     FROM providers p
--     JOIN clinics c ON c.id = p.clinic_id
--     WHERE c.name = TRIM(u.clinic_name)
--       AND p.name = TRIM(
--         CONCAT(
--           COALESCE(u.first_name, ''),
--           CASE 
--             WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL THEN ' ' 
--             ELSE '' 
--           END,
--           COALESCE(u.last_name, '')
--         )
--       )
--   );

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. This migration preserves backward compatibility:
--    - Users still have clinic_name field (not changed)
--    - RLS policies match users.clinic_name = clinics.name (text-based)
--    - Existing code using users.clinic_name continues to work
--
-- 2. Provider creation:
--    - Only creates providers for users with clinic_name matching pilot clinics
--    - Only creates providers for roles: veterinarian, vet_tech, practice_owner
--    - Admins are NOT created as providers
--    - neo_provider_id is generated if not in user metadata
--
-- 3. Clinic information:
--    - Alum Rock Animal Hospital: idexx_neo, alumrockanimalhospital@yahoo.com, +14082903744
--    - Del Valle Pet Hospital: avimark, info@delvallepethospital.com, (925) 443-6000
--
-- 4. Next steps:
--    - Run validation queries before migration (uncomment and run)
--    - Run migration
--    - Run validation queries after migration to verify
--    - Test RLS policies work correctly

-- ============================================================================
-- USER DATA MIGRATION: Transfer data from drkchaudhary@gmail.com to jattvc@gmail.com
-- ============================================================================
-- This section transfers all data from drkchaudhary@gmail.com to jattvc@gmail.com
-- and then deletes the old user account.
--
-- Data to transfer:
--   - 29 cases
--   - 29 transcriptions
--   - 15 patients
--   - 1 temp_soap_templates
--   - 1 temp_discharge_summary_templates
--   - Plus any other related records

DO $$
DECLARE
  source_user_id UUID;
  target_user_id UUID;
  transferred_count INTEGER;
BEGIN
  -- Get user IDs
  SELECT id INTO source_user_id FROM users WHERE email = 'drkchaudhary@gmail.com';
  SELECT id INTO target_user_id FROM users WHERE email = 'jattvc@gmail.com';
  
  -- Verify both users exist
  IF source_user_id IS NULL THEN
    RAISE NOTICE 'Source user drkchaudhary@gmail.com not found. Skipping data transfer.';
    RETURN;
  END IF;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user jattvc@gmail.com not found. Cannot transfer data.';
  END IF;
  
  RAISE NOTICE 'Transferring data from user % to user %', source_user_id, target_user_id;
  
  -- Transfer cases
  UPDATE cases SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % cases', transferred_count;
  
  -- Transfer transcriptions
  UPDATE transcriptions SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % transcriptions', transferred_count;
  
  -- Transfer patients
  UPDATE patients SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % patients', transferred_count;
  
  -- Transfer discharge_summaries
  UPDATE discharge_summaries SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % discharge_summaries', transferred_count;
  
  -- Transfer temp_soap_templates
  -- Handle unique constraint: only one default template per user
  -- If target user already has a default template, set source template to non-default before transfer
  UPDATE temp_soap_templates 
  SET 
    is_default = CASE 
      WHEN is_default = true AND EXISTS (
        SELECT 1 FROM temp_soap_templates 
        WHERE user_id = target_user_id AND is_default = true
      ) THEN false
      ELSE is_default
    END,
    user_id = target_user_id 
  WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % temp_soap_templates', transferred_count;
  
  -- Transfer temp_discharge_summary_templates
  -- Handle unique constraint: only one default template per user
  -- If target user already has a default template, set source template to non-default before transfer
  UPDATE temp_discharge_summary_templates 
  SET 
    is_default = CASE 
      WHEN is_default = true AND EXISTS (
        SELECT 1 FROM temp_discharge_summary_templates 
        WHERE user_id = target_user_id AND is_default = true
      ) THEN false
      ELSE is_default
    END,
    user_id = target_user_id 
  WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % temp_discharge_summary_templates', transferred_count;
  
  -- Transfer scheduled_discharge_calls
  UPDATE scheduled_discharge_calls SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % scheduled_discharge_calls', transferred_count;
  
  -- Transfer scheduled_discharge_emails
  UPDATE scheduled_discharge_emails SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % scheduled_discharge_emails', transferred_count;
  
  -- Transfer clinic_messages (assigned_to_user_id)
  UPDATE clinic_messages SET assigned_to_user_id = target_user_id WHERE assigned_to_user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % clinic_messages', transferred_count;
  
  -- Transfer call_patients
  UPDATE call_patients SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % call_patients', transferred_count;
  
  -- Transfer case_shares (shared_by_user_id)
  UPDATE case_shares SET shared_by_user_id = target_user_id WHERE shared_by_user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % case_shares (shared_by)', transferred_count;
  
  -- Transfer case_shares (shared_with_user_id)
  UPDATE case_shares SET shared_with_user_id = target_user_id WHERE shared_with_user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % case_shares (shared_with)', transferred_count;
  
  -- Transfer discharge_template_shares (shared_by_user_id)
  UPDATE discharge_template_shares SET shared_by_user_id = target_user_id WHERE shared_by_user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % discharge_template_shares (shared_by)', transferred_count;
  
  -- Transfer discharge_template_shares (shared_with_user_id)
  UPDATE discharge_template_shares SET shared_with_user_id = target_user_id WHERE shared_with_user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % discharge_template_shares (shared_with)', transferred_count;
  
  -- Transfer soap_template_shares (shared_by_user_id)
  UPDATE soap_template_shares SET shared_by_user_id = target_user_id WHERE shared_by_user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % soap_template_shares (shared_by)', transferred_count;
  
  -- Transfer soap_template_shares (shared_with_user_id)
  UPDATE soap_template_shares SET shared_with_user_id = target_user_id WHERE shared_with_user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % soap_template_shares (shared_with)', transferred_count;
  
  -- Transfer error_logs
  UPDATE error_logs SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % error_logs', transferred_count;
  
  -- Transfer feature_usage
  UPDATE feature_usage SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % feature_usage', transferred_count;
  
  -- Transfer idexx_credentials
  UPDATE idexx_credentials SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % idexx_credentials', transferred_count;
  
  -- Transfer idexx_sync_audit_log
  UPDATE idexx_sync_audit_log SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % idexx_sync_audit_log', transferred_count;
  
  -- Transfer idexx_sync_sessions
  UPDATE idexx_sync_sessions SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % idexx_sync_sessions', transferred_count;
  
  -- Transfer inbound_vapi_calls
  UPDATE inbound_vapi_calls SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % inbound_vapi_calls', transferred_count;
  
  -- Transfer session_analytics
  UPDATE session_analytics SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % session_analytics', transferred_count;
  
  -- Transfer user_events
  UPDATE user_events SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % user_events', transferred_count;
  
  -- Transfer vital_signs
  UPDATE vital_signs SET user_id = target_user_id WHERE user_id = source_user_id;
  GET DIAGNOSTICS transferred_count = ROW_COUNT;
  RAISE NOTICE 'Transferred % vital_signs', transferred_count;
  
  RAISE NOTICE 'Data transfer complete. Deleting source user...';
  
  -- Delete from public.users (this will cascade to any remaining references)
  DELETE FROM users WHERE id = source_user_id;
  RAISE NOTICE 'Deleted user from public.users';
  
  -- Delete from auth.users (Supabase auth table)
  DELETE FROM auth.users WHERE id = source_user_id;
  RAISE NOTICE 'Deleted user from auth.users';
  
  RAISE NOTICE 'User data migration complete!';
END $$;

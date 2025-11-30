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
  -- Avoid duplicates: check if provider with same name already exists for this clinic
  AND NOT EXISTS (
    SELECT 1 
    FROM providers p 
    WHERE p.clinic_id = c.id 
      AND p.name = TRIM(
        CONCAT(
          COALESCE(u.first_name, ''),
          CASE 
            WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL THEN ' ' 
            ELSE '' 
          END,
          COALESCE(u.last_name, '')
        )
      )
  )
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

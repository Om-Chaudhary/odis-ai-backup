# Clinic Schedule Database Integration Analysis

**Jira Issues:** ODIS-45, ODIS-46  
**Date:** 2025-01-XX  
**Status:** Analysis Complete

## Executive Summary

The clinic schedule database schema is **already implemented** and ready for use. The schema is designed to work alongside existing user data without breaking current functionality. This document outlines what exists, how it integrates with current data, and what steps are needed to activate it.

### Jira Status Summary

**✅ Completed:**

- **ODIS-45** - Database schema (Done)
- **ODIS-46** - `get_available_slots()` function (Done)

**🔄 In Progress:**

- **ODIS-47** - IDEXX Neo schedule scraping (Extension)
- **ODIS-48** - Schedule sync API endpoint
- **ODIS-49** - Available slots API endpoint
- **ODIS-50** - Confirm appointment API endpoint
- **ODIS-51** - Leave message API endpoint
- **ODIS-63** - Migrate existing users to clinic schedule schema (Phase 1)
- **ODIS-64** - Add clinic lookup utilities and integrate with existing code (Phase 2)

**📋 To Do:**

- **ODIS-52** - VAPI assistant tool configuration

## Current Schema Status

### ✅ Tables Already Created

The following tables exist in the database:

1. **`clinics`** - Central clinic registry
2. **`providers`** - Veterinarians and staff linked to clinics
3. **`appointments`** - Core appointment data from PIMS systems
4. **`appointment_requests`** - VAPI-booked appointments pending confirmation
5. **`schedule_syncs`** - Audit log of schedule synchronization operations
6. **`clinic_messages`** - Messages left by callers (voicemail, callback requests)

### ✅ Row Level Security (RLS) Policies

All tables have RLS enabled with policies that:

- Match users to clinics via `users.clinic_name = clinics.name`
- Allow admins and practice owners full access
- Allow service role full access (for webhooks/background jobs)
- Restrict regular users to their own clinic's data

### ✅ Database Function

- **`get_available_slots()`** - Computes available appointment slots for a clinic on a given date (ODIS-46)

## Integration with Existing Data

### Current User Data Structure

The existing `users` table has:

- `clinic_name` (text) - Currently used for clinic identification
- `role` (enum) - User role (veterinarian, vet_tech, admin, practice_owner, client)
- Other clinic-related fields: `clinic_phone`, `clinic_email`, `emergency_phone`

### Backward Compatibility Design

The schema is designed for **gradual migration**:

1. **Text-based matching**: RLS policies use `users.clinic_name = clinics.name` to match users to clinics
2. **No breaking changes**: Existing code using `users.clinic_name` continues to work
3. **Optional clinic_id**: Future migration can add `clinic_id` to users table, but it's not required

### Current Data State

**Users:**

- 30 users in the system
- Some users have `clinic_name` set (e.g., "Alum Rock Animal Hospital", "Alum Rock")
- Some users have `clinic_name = NULL`

**Clinics:**

- 1 test clinic exists: "Test Clinic" (id: `11111111-1111-1111-1111-111111111111`)
- No real clinic records yet

**Appointments:**

- 2 test appointments exist
- 1 provider exists
- 0 appointment requests
- 0 schedule syncs

## What Needs to Be Done

### Phase 1: Data Migration (Required)

**Jira:** [ODIS-63](https://odisai.atlassian.net/browse/ODIS-63) - Status: **In Progress**

#### 1.1 Create Clinic Records from User Data

**Goal:** Create `clinics` table records for each unique `clinic_name` in the `users` table.

**Steps:**

1. Extract unique clinic names from `users.clinic_name` (excluding NULL)
2. For each unique clinic name:
   - Create a `clinics` record with matching `name`
   - Set `pims_type` based on user's `pims_systems` field (default: 'idexx_neo')
   - Copy clinic contact info from user records (phone, email)
3. Handle name variations (e.g., "Alum Rock Animal Hospital" vs "Alum Rock Animal Hospital " - trailing space)

**SQL Migration Example:**

```sql
-- Create clinics from unique user clinic names
INSERT INTO clinics (name, email, phone, pims_type, is_active)
SELECT DISTINCT
  TRIM(u.clinic_name) as name,
  MAX(u.clinic_email) as email,  -- Take first non-null email
  MAX(u.clinic_phone) as phone,  -- Take first non-null phone
  COALESCE(
    CASE
      WHEN u.pims_systems::text LIKE '%idexx_neo%' THEN 'idexx_neo'
      WHEN u.pims_systems::text LIKE '%avimark%' THEN 'avimark'
      ELSE 'idexx_neo'
    END,
    'idexx_neo'
  ) as pims_type,
  true as is_active
FROM users u
WHERE u.clinic_name IS NOT NULL
  AND TRIM(u.clinic_name) != ''
GROUP BY TRIM(u.clinic_name)
ON CONFLICT (name) DO NOTHING;
```

**Considerations:**

- Handle NULL clinic names (users without clinics)
- Normalize clinic names (trim whitespace, handle variations)
- Merge duplicate clinic names with slight variations
- Set `pims_type` based on user's `pims_systems` JSONB field

#### 1.2 Create Provider Records

**Goal:** Create `providers` records for users who are veterinarians or vet techs.

**Steps:**

1. For each user with `clinic_name`:
   - Find matching `clinics` record by name
   - Create `providers` record linking user to clinic
   - Set `neo_provider_id` to a generated ID (or extract from user metadata if available)
   - Set `role` based on user's `role` field
   - Set `name` from user's `first_name` and `last_name`

**SQL Migration Example:**

```sql
-- Create providers from users
INSERT INTO providers (clinic_id, neo_provider_id, name, role, is_active)
SELECT
  c.id as clinic_id,
  COALESCE(
    u.metadata->>'neo_provider_id',
    gen_random_uuid()::text
  ) as neo_provider_id,
  CONCAT(
    COALESCE(u.first_name, ''),
    CASE WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL THEN ' ' ELSE '' END,
    COALESCE(u.last_name, '')
  ) as name,
  CASE
    WHEN u.role = 'veterinarian' THEN 'veterinarian'
    WHEN u.role = 'vet_tech' THEN 'vet_tech'
    ELSE 'veterinarian'
  END as role,
  true as is_active
FROM users u
INNER JOIN clinics c ON c.name = TRIM(u.clinic_name)
WHERE u.clinic_name IS NOT NULL
  AND u.role IN ('veterinarian', 'vet_tech', 'practice_owner')
  AND NOT EXISTS (
    SELECT 1 FROM providers p
    WHERE p.clinic_id = c.id
    AND p.name = CONCAT(
      COALESCE(u.first_name, ''),
      CASE WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL THEN ' ' ELSE '' END,
      COALESCE(u.last_name, '')
    )
  );
```

**Considerations:**

- Only create providers for users with `clinic_name`
- Map user roles to provider roles appropriately
- Handle users without first_name/last_name
- Avoid duplicate providers (check by name + clinic_id)

### Phase 2: Code Integration (Required)

**Jira:** [ODIS-64](https://odisai.atlassian.net/browse/ODIS-64) - Status: **In Progress**

#### 2.1 Helper Functions for Clinic Lookup

Create utility functions to:

- Get clinic_id from user's clinic_name
- Get user's clinic record
- Validate clinic access

**Example Implementation:**

```typescript
// src/lib/clinics/utils.ts
import { createClient } from "~/lib/supabase/server";

export async function getUserClinic(userId: string) {
  const supabase = await createClient();

  // Get user's clinic_name
  const { data: user } = await supabase
    .from("users")
    .select("clinic_name")
    .eq("id", userId)
    .single();

  if (!user?.clinic_name) {
    return null;
  }

  // Get clinic record
  const { data: clinic } = await supabase
    .from("clinics")
    .select("*")
    .eq("name", user.clinic_name.trim())
    .single();

  return clinic;
}

export async function getUserClinicId(userId: string): Promise<string | null> {
  const clinic = await getUserClinic(userId);
  return clinic?.id ?? null;
}
```

#### 2.2 Update Existing Code to Use Clinic Tables

**Areas to update:**

1. **Appointment scheduling** - Use `appointments` table instead of ad-hoc scheduling
2. **Provider selection** - Use `providers` table for provider lists
3. **Clinic information** - Use `clinics` table for clinic details
4. **VAPI integration** - Link appointment requests to `appointment_requests` table

**Example:**

```typescript
// Before: Using users.clinic_name directly
const clinicName = user.clinic_name;

// After: Using clinics table
const clinic = await getUserClinic(user.id);
const clinicName = clinic?.name ?? user.clinic_name; // Fallback for backward compatibility
```

### Phase 3: API Endpoints (✅ Already Tracked in Jira)

**Status:** These API endpoints are already tracked as separate Jira tickets and are in progress.

#### 3.1 Appointment Availability API

**Jira:** [ODIS-49](https://odisai.atlassian.net/browse/ODIS-49) - Status: **In Progress**

**Endpoint:** `GET /api/vapi/available-slots`

**Purpose:** Get available appointment slots for a clinic

**Implementation Details:**

- Uses the `get_available_slots()` function (ODIS-46 - ✅ Done)
- Query parameters: `clinic_id` (required), `date` (required), `provider_id` (optional), `duration` (optional)
- Returns slots with provider names for VAPI to read aloud
- See [ODIS-49](https://odisai.atlassian.net/browse/ODIS-49) for full specification

#### 3.2 Appointment Booking & Management APIs

**Jira Tickets:**

- [ODIS-50](https://odisai.atlassian.net/browse/ODIS-50) - `POST /api/vapi/confirm-appointment` - Status: **In Progress**
- [ODIS-51](https://odisai.atlassian.net/browse/ODIS-51) - `POST /api/vapi/leave-message` - Status: **In Progress**
- [ODIS-48](https://odisai.atlassian.net/browse/ODIS-48) - `POST /api/schedule/sync` - Status: **In Progress**

**Endpoints:**

- `GET /api/vapi/available-slots` - Get available appointment slots (ODIS-49)
- `POST /api/vapi/confirm-appointment` - Book a confirmed appointment slot (ODIS-50)
- `POST /api/vapi/leave-message` - Leave a message or urgent callback request (ODIS-51)
- `POST /api/schedule/sync` - Sync schedule data from IDEXX Neo extension (ODIS-48)

### Phase 4: Testing & Validation

#### 4.1 Data Integrity Checks

**Verify:**

1. All users with `clinic_name` have matching `clinics` records
2. All active providers are linked to valid clinics
3. RLS policies work correctly (users can only see their clinic's data)
4. No orphaned appointments (appointments without valid clinic_id)

**SQL Validation Queries:**

```sql
-- Check for users without matching clinics
SELECT u.id, u.email, u.clinic_name
FROM users u
WHERE u.clinic_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM clinics c
    WHERE c.name = TRIM(u.clinic_name)
  );

-- Check for orphaned appointments
SELECT a.id, a.clinic_id, a.date
FROM appointments a
WHERE NOT EXISTS (
  SELECT 1 FROM clinics c WHERE c.id = a.clinic_id
);

-- Check RLS is working (should only return user's clinic)
SELECT * FROM clinics
WHERE name = (SELECT clinic_name FROM users WHERE id = auth.uid());
```

#### 4.2 Functional Testing

**Test scenarios:**

1. User can view their clinic's appointments
2. User can create appointment requests
3. Admin can confirm/reject appointment requests
4. `get_available_slots()` returns correct availability
5. VAPI can create appointment requests via webhook

## Schema Relationships

```
users (existing)
  └─ clinic_name (text) ──┐
                          │
                          ├─> clinics.name (text) [MATCHES FOR RLS]
                          │
                          └─> clinics (new)
                                ├─> providers (new)
                                │     └─> appointments.provider_id
                                │
                                ├─> appointments (new)
                                │     ├─> schedule_syncs.sync_id
                                │     └─> appointment_requests.confirmed_appointment_id
                                │
                                ├─> appointment_requests (new)
                                │     └─> appointments (when confirmed)
                                │
                                ├─> schedule_syncs (new)
                                │     └─> appointments.sync_id
                                │
                                └─> clinic_messages (new)
```

## RLS Policy Details

### How RLS Works

All clinic schedule tables use **text-based matching** for backward compatibility:

```sql
-- Example RLS policy (from appointments table)
CREATE POLICY "Users can view appointments for their clinic"
  ON appointments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      WHERE clinics.id = appointments.clinic_id
      AND clinics.name = (SELECT clinic_name FROM users WHERE id = auth.uid())
    )
  );
```

**Key Points:**

- Matches `users.clinic_name` (text) to `clinics.name` (text)
- No foreign key from users to clinics (backward compatible)
- Admins and practice owners can see all clinics
- Service role bypasses RLS (for webhooks/background jobs)

## Migration Strategy

### Safe Migration Approach

1. **Phase 1: Data Migration** (No code changes)
   - Create clinic records from user data
   - Create provider records from users
   - Validate data integrity
   - Test RLS policies

2. **Phase 2: Code Integration** (Gradual)
   - Add helper functions for clinic lookup
   - Update new features to use clinic tables
   - Keep existing code using `users.clinic_name` (backward compatible)
   - Add feature flags for gradual rollout

3. **Phase 3: Full Integration** (Future)
   - Migrate all code to use clinic tables
   - Add `clinic_id` to users table (optional optimization)
   - Deprecate direct `users.clinic_name` usage

### Rollback Plan

If issues arise:

1. Clinic tables are separate - existing code continues to work
2. RLS policies can be temporarily disabled if needed
3. Data can be re-synced from users table

## Current Limitations & Considerations

### 1. Clinic Name Matching

**Issue:** Clinic names must match exactly between `users.clinic_name` and `clinics.name` for RLS to work.

**Solution:**

- Normalize clinic names during migration (trim, lowercase)
- Consider adding a `clinic_id` to users table in the future

### 2. Users Without Clinics

**Issue:** Users with `clinic_name = NULL` cannot access clinic schedule features.

**Solution:**

- Prompt users to set clinic_name during onboarding
- Allow admins to assign users to clinics
- Create default clinic for users without clinic_name (if needed)

### 3. Provider Mapping

**Issue:** Users are not directly linked to providers table.

**Solution:**

- Create provider records from users during migration
- Consider adding `provider_id` to users table in the future
- Use name matching for now (provider.name = user.first_name + user.last_name)

## Next Steps

### Immediate Actions

1. **Create migration script** to populate clinics and providers from users
2. **Test migration** on staging/dev environment
3. **Validate RLS policies** work correctly
4. **Create helper functions** for clinic lookup

### Short-term (1-2 weeks)

1. **Complete ODIS-49** - Appointment availability API (In Progress)
2. **Complete ODIS-50** - Appointment confirmation API (In Progress)
3. **Complete ODIS-51** - Leave message API (In Progress)
4. **Complete ODIS-48** - Schedule sync endpoint (In Progress)
5. **Complete ODIS-47** - IDEXX Neo schedule scraping (In Progress)
6. **Add appointment request management UI** (Not yet tracked)
7. **Test end-to-end appointment booking flow**

### Long-term (Future)

1. **Add `clinic_id` to users table** for better performance
2. **Add `provider_id` to users table** for direct linking
3. **Migrate all code** to use clinic tables instead of `users.clinic_name`
4. **Add clinic management UI** for admins

## Files to Create/Modify

### New Files

- `src/lib/clinics/utils.ts` - Clinic lookup utilities
- `src/app/api/vapi/available-slots/route.ts` - Availability API (ODIS-49)
- `src/app/api/vapi/confirm-appointment/route.ts` - Appointment booking (ODIS-50)
- `src/app/api/vapi/leave-message/route.ts` - Leave message handler (ODIS-51)
- `src/app/api/schedule/sync/route.ts` - Schedule sync endpoint (ODIS-48)
- `supabase/migrations/YYYYMMDDHHMMSS_migrate_users_to_clinics.sql` - Data migration

### Modified Files

- `src/app/api/webhooks/vapi/route.ts` - Add appointment request creation
- Any code that uses `users.clinic_name` - Add clinic table lookups

## Conclusion

The clinic schedule database schema is **production-ready** and designed for backward compatibility. The main work needed is:

1. **Data migration** - Create clinic and provider records from existing user data
2. **Code integration** - Add helper functions and update new features
3. **Testing** - Validate RLS policies and data integrity

The schema will not break existing functionality because:

- RLS uses text-based matching (backward compatible)
- Existing code using `users.clinic_name` continues to work
- Clinic tables are separate and optional

**Estimated effort:** 2-3 days for migration + 1 week for code integration

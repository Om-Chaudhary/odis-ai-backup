# Clinic Migration to Clerk Organizations

Guide for migrating existing Supabase-only clinics to Clerk Organizations.

## Overview

With the Clerk integration, clinics need to be mapped to Clerk Organizations. This allows:

- Web users to manage clinic settings via Clerk Dashboard
- Organization-based access control
- Multi-tenant isolation via Clerk's org_id in JWTs

## Current State

**Existing Clinics (Pre-Clerk):**

- ✅ Stored in `clinics` table in Supabase
- ✅ Members tracked in `user_clinic_access` table
- ❌ No `clerk_org_id` (not linked to Clerk Organizations)

**Your Login Migration:**

- ✅ When users log in via web, they're linked by email (`clerk_user_id` added)
- ✅ Preserves all existing data (cases, notes, clinic access)
- ❌ **BUT** clinics themselves aren't migrated to Clerk Organizations

## Pilot Clinics

| Clinic                    | Owner Email           | Status          |
| ------------------------- | --------------------- | --------------- |
| Alum Rock Animal Hospital | garrybath@hotmail.com | Needs migration |
| Del Valle Pet Hospital    | jattvc@gmail.com      | Needs migration |

## Migration Process

### Step 1: Verify Current State

Check the current status of pilot clinics:

```bash
pnpm tsx scripts/check-pilot-clinic-status.ts
```

This will show:

- ✅ If clinic exists in database
- ✅ If owner has a Clerk account (`clerk_user_id`)
- ✅ Current members and their Clerk status
- ✅ Clinic access roles

**Important:** Owners must have Clerk accounts before migration. If they don't:

1. Ask them to sign up at your web app using their email
2. They'll be auto-linked to their existing Supabase account (via your login migration webhook)
3. Then proceed with organization migration

### Step 2: Dry Run

Run migration in dry-run mode to preview changes:

```bash
pnpm tsx scripts/migrate-pilot-clinics.ts --dry-run
```

This will show what would happen without making changes:

- Which Clerk Organizations would be created
- Who would be added as members
- Any issues or warnings

### Step 3: Execute Migration

If dry run looks good, run the actual migration:

```bash
pnpm tsx scripts/migrate-pilot-clinics.ts
```

This will:

1. ✅ Find each clinic in Supabase
2. ✅ Create a Clerk Organization with matching name/slug
3. ✅ Update `clinics.clerk_org_id` in Supabase
4. ✅ Add owner as organization creator
5. ✅ Add all members who have Clerk accounts
6. ✅ Report any members who need invites (no Clerk account yet)

### Step 4: Verify Migration

After migration, verify in Clerk Dashboard:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Organizations
2. You should see both clinics listed
3. Check members and roles

Also verify in your app:

```bash
pnpm tsx scripts/check-pilot-clinic-status.ts
```

Should now show `clerk_org_id` populated.

## What Happens to Members

### Members with Clerk Accounts

- ✅ Automatically added to Clerk Organization
- ✅ Role mapped from ODIS AI to Clerk format:
  - `owner` → `org:owner`
  - `admin` → `org:admin`
  - `veterinarian` → `org:veterinarian`
  - `member` → `org:member`
  - `viewer` → `org:viewer`

### Members without Clerk Accounts

- ℹ️ Not automatically added (can't add without Clerk user ID)
- ℹ️ Two options:
  1. **Self-signup:** They sign up at web app → auto-linked → webhook adds them to org
  2. **Clerk invite:** Send Clerk org invite via Dashboard → they accept → joined

## Post-Migration

### For Owners

- Can manage organization in Clerk Dashboard
- Can invite new members via Clerk
- Existing clinic access preserved
- All cases, patients, calls still accessible

### For Members

- Continue using iOS app with Supabase Auth (no change)
- If they sign up for web app, they're auto-linked and added to org
- All existing data preserved

### For New Users

- Sign up via Clerk
- Get added to organization
- Automatic clinic access via `organizationMembership.created` webhook

## Troubleshooting

### "Owner does not have a Clerk account yet"

**Solution:**

1. Ask owner to visit your web app
2. Sign up/sign in with their email (garrybath@hotmail.com or jattvc@gmail.com)
3. Webhook will auto-link their account
4. Run migration script again

### "Clinic not found"

**Solution:**

- Check clinic name spelling in `clinics` table
- Script uses case-insensitive ILIKE matching
- Adjust `PILOT_CLINICS` array in script if needed

### "Failed to create Clerk Organization"

**Possible causes:**

- Slug already taken (unlikely with specific clinic names)
- Clerk API key issue (check `CLERK_SECRET_KEY` env var)
- Rate limiting (wait and retry)

**Solution:**

- Check error message for details
- Verify Clerk API key is valid
- Check Clerk Dashboard for partial org creation

### "Clerk Organization already exists"

**Solution:**

- Script will skip and log that org already exists
- Check Clerk Dashboard to verify org is correct
- If incorrect org, delete from Clerk Dashboard and re-run

## Scripts Reference

| Script                              | Purpose                                 |
| ----------------------------------- | --------------------------------------- |
| `check-pilot-clinic-status.ts`      | View current state of pilot clinics     |
| `migrate-pilot-clinics.ts`          | Migrate Alum Rock & Del Valle to Clerk  |
| `migrate-clinics-to-clerk.ts`       | General migration for all clinics       |
| `list-clinics-needing-migration.ts` | List all clinics without `clerk_org_id` |

## Database Schema

### Before Migration

```sql
-- Clinic without Clerk Organization
SELECT id, name, clerk_org_id FROM clinics WHERE name ILIKE '%alum rock%';
-- clerk_org_id: NULL
```

### After Migration

```sql
-- Clinic linked to Clerk Organization
SELECT id, name, clerk_org_id FROM clinics WHERE name ILIKE '%alum rock%';
-- clerk_org_id: org_xxxxxxxxxxxxx
```

## Future Clinics

For new clinics created after Clerk integration:

1. **Web users:** Create org in Clerk Dashboard → webhook syncs to Supabase
2. **iOS users:** Clinic created in Supabase → manually create Clerk org (or wait for web signup)

Eventually, consider making Clerk the source of truth for all clinic creation.

## References

- [Clerk Webhook Handler](../apps/web/src/app/api/webhooks/clerk/route.ts)
- [Account Linking Guide](../docs/authentication/ACCOUNT_LINKING.md)
- [Hybrid Auth Functions](../supabase/migrations/20260118100000_add_hybrid_auth_functions.sql)

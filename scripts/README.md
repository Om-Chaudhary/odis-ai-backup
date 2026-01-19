# Migration Scripts

Scripts for migrating existing Supabase-only clinics and users to Clerk Organizations.

## Setup

### 1. Set Environment Variables

Either set in your shell or create a `.env` file in the `scripts/` directory:

```bash
# Copy example and fill in values
cp scripts/.env.example scripts/.env

# Then edit scripts/.env with your credentials
```

Required variables:

- `CLERK_SECRET_KEY` - From Clerk Dashboard → API Keys
- `SUPABASE_URL` - From Supabase Dashboard → Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` - From Supabase Dashboard → Settings → API

### 2. Load Environment Variables

If using a `.env` file:

```bash
# Load before running scripts
source scripts/.env

# Or use dotenv-cli
pnpm add -g dotenv-cli
dotenv -e scripts/.env -- pnpm tsx scripts/debug-user-clerk-sync.ts <email>
```

## User Debugging & Sync

### Debug User Account

Check if a user's Clerk account is properly synced to Supabase:

```bash
pnpm tsx scripts/debug-user-clerk-sync.ts <email>
```

**Example:**

```bash
pnpm tsx scripts/debug-user-clerk-sync.ts garrybath@hotmail.com
```

This will show:

- ✅ If user exists in Clerk
- ✅ If user is synced to Supabase
- ✅ User's clinic access
- ✅ Which organizations they're in
- ✅ Specific fix instructions if something is broken

### Link Existing Account

For users who had a Supabase Auth account before Clerk:

```bash
pnpm tsx scripts/link-clerk-account.ts <email>
```

This will:

1. Find the Clerk user
2. Find the existing Supabase user (by email)
3. Link them by setting `clerk_user_id`
4. Sync organization memberships to clinic access
5. Preserve all existing data (cases, calls, etc.)

### Create New User

For brand new users who signed up via Clerk but weren't synced:

```bash
pnpm tsx scripts/sync-clerk-user.ts <email>
```

This will:

1. Find the Clerk user
2. Create a new Supabase user record
3. Set `clerk_user_id` to link accounts
4. Sync organization memberships to clinic access

## Clinic Migration

### Check Pilot Clinic Status

View current state of Alum Rock and Del Valle:

```bash
pnpm tsx scripts/check-pilot-clinic-status.ts
```

### Migrate Pilot Clinics

Migrate Alum Rock Animal Hospital and Del Valle Pet Hospital to Clerk Organizations:

```bash
# Dry run first (safe - no changes)
pnpm tsx scripts/migrate-pilot-clinics.ts --dry-run

# Execute migration
pnpm tsx scripts/migrate-pilot-clinics.ts
```

**Prerequisites:**

- Clinic owners must have Clerk accounts (signed up at web app)
- Check with `check-pilot-clinic-status.ts` first

### List All Unmigrated Clinics

See which clinics don't have `clerk_org_id` yet:

```bash
pnpm tsx scripts/list-clinics-needing-migration.ts
```

### Migrate All Clinics

Migrate all clinics without `clerk_org_id` to Clerk Organizations:

```bash
# Dry run first
pnpm tsx scripts/migrate-clinics-to-clerk.ts --dry-run

# Execute migration
pnpm tsx scripts/migrate-clinics-to-clerk.ts
```

## Troubleshooting

See [TROUBLESHOOTING_CLERK_AUTH.md](./TROUBLESHOOTING_CLERK_AUTH.md) for common issues and fixes.

Quick diagnostic flowchart:

1. **Can't sign in?** → Check Clerk credentials, reset password
2. **Can sign in but can't find account?** → Run `debug-user-clerk-sync.ts`
   - If "NOT synced to Supabase" → Run `link-clerk-account.ts` or `sync-clerk-user.ts`
3. **Can sign in but no data shows?** → Check clinic migration status
   - If "NOT LINKED TO CLERK" → Run clinic migration scripts
4. **"Organization membership required"?** → Join/create organization or migrate clinic

## Common Workflows

### New User Can't Access App

```bash
# 1. Diagnose
pnpm tsx scripts/debug-user-clerk-sync.ts user@example.com

# 2. Fix (based on diagnosis output)
# If has Supabase account:
pnpm tsx scripts/link-clerk-account.ts user@example.com

# If brand new:
pnpm tsx scripts/sync-clerk-user.ts user@example.com
```

### Existing Clinic Owner Can't See Data

```bash
# 1. Check clinic status
pnpm tsx scripts/check-pilot-clinic-status.ts

# 2. Ensure owner has Clerk account
pnpm tsx scripts/debug-user-clerk-sync.ts owner@example.com

# 3. Link account if needed
pnpm tsx scripts/link-clerk-account.ts owner@example.com

# 4. Migrate clinic
pnpm tsx scripts/migrate-pilot-clinics.ts
```

### Bulk Migration for Production

```bash
# 1. List all unmigrated clinics
pnpm tsx scripts/list-clinics-needing-migration.ts

# 2. Dry run migration
pnpm tsx scripts/migrate-clinics-to-clerk.ts --dry-run

# 3. Review output carefully

# 4. Execute if looks good
pnpm tsx scripts/migrate-clinics-to-clerk.ts

# 5. Verify each clinic owner can access
pnpm tsx scripts/debug-user-clerk-sync.ts owner1@example.com
pnpm tsx scripts/debug-user-clerk-sync.ts owner2@example.com
```

## Safety Notes

- ✅ All migration scripts support `--dry-run` flag
- ✅ Scripts preserve existing data (never delete)
- ✅ Account linking is idempotent (safe to run multiple times)
- ✅ Scripts use service role key (bypasses RLS) - keep it secret!
- ⚠️ Never commit `.env` files with real credentials

## Script Reference

| Script                              | Purpose                                      |
| ----------------------------------- | -------------------------------------------- |
| `debug-user-clerk-sync.ts`          | Diagnose user account sync issues            |
| `link-clerk-account.ts`             | Link Clerk account to existing Supabase user |
| `sync-clerk-user.ts`                | Create new Supabase user from Clerk account  |
| `check-pilot-clinic-status.ts`      | Check Alum Rock & Del Valle migration status |
| `migrate-pilot-clinics.ts`          | Migrate Alum Rock & Del Valle to Clerk       |
| `list-clinics-needing-migration.ts` | List all unmigrated clinics                  |
| `migrate-clinics-to-clerk.ts`       | Migrate all clinics to Clerk Organizations   |

# Troubleshooting Clerk Authentication Issues

Common issues when users can't access the app after signing in with Clerk.

## Symptom: "Cannot find account" after signing in

When you sign in via Clerk on the web app but can't see your data or get access errors.

### Root Cause

The Clerk user exists, but there's no corresponding record in Supabase's `users` table with the `clerk_user_id` set. This causes the tRPC context to fail lookup (see `apps/web/src/server/api/trpc.ts:47-66`).

### Diagnosis

Run the debug script with your email:

```bash
pnpm tsx scripts/debug-user-clerk-sync.ts <your-email@example.com>
```

This will show:

- ✅ If you exist in Clerk
- ✅ If you're synced to Supabase
- ✅ Your clinic access
- ✅ Which organizations you're in
- ❌ What's broken and how to fix it

### Fix Option 1: Account Exists in Supabase (Link Accounts)

**When to use:** You had an iOS account or Supabase Auth account before Clerk.

```bash
pnpm tsx scripts/link-clerk-account.ts <your-email@example.com>
```

This will:

1. Find your Clerk user
2. Find your existing Supabase user (by email)
3. Link them by setting `clerk_user_id`
4. Sync organization memberships to clinic access
5. Preserve all your existing data

### Fix Option 2: No Supabase Account (Create New)

**When to use:** You're a brand new user who signed up via Clerk web app.

```bash
pnpm tsx scripts/sync-clerk-user.ts <your-email@example.com>
```

This will:

1. Find your Clerk user
2. Create a new Supabase user record
3. Set `clerk_user_id` to link accounts
4. Sync organization memberships to clinic access

## Symptom: "Organization membership required"

You can sign in, but get errors about needing organization membership.

### Root Cause

You're authenticated but not part of any Clerk Organization (clinic).

### Diagnosis

```bash
pnpm tsx scripts/debug-user-clerk-sync.ts <your-email@example.com>
```

Look for: "Not a member of any organizations"

### Fix: Join or Create Organization

**Option 1: Join existing clinic**

1. Ask a clinic owner to invite you via Clerk Dashboard
2. Accept the invitation
3. Webhook will sync your access automatically

**Option 2: Create new clinic**

1. Go to Clerk Dashboard → Organizations
2. Create a new organization
3. Webhook will create corresponding clinic in Supabase

**Option 3: Migrate existing clinic**
If you're the owner of Alum Rock or Del Valle:

```bash
pnpm tsx scripts/migrate-pilot-clinics.ts
```

## Symptom: Clinic exists but no data shows up

You can sign in and are part of an organization, but don't see cases/calls/etc.

### Root Cause

The clinic exists in Supabase but isn't linked to your Clerk Organization (`clerk_org_id` is null).

### Diagnosis

```bash
pnpm tsx scripts/debug-user-clerk-sync.ts <your-email@example.com>
```

Look for: "Clerk Org ID: ❌ NOT LINKED TO CLERK"

### Fix: Migrate Clinic

```bash
# For pilot clinics (Alum Rock, Del Valle)
pnpm tsx scripts/migrate-pilot-clinics.ts

# For other clinics
pnpm tsx scripts/migrate-clinics-to-clerk.ts
```

## Symptom: Webhook not syncing users

New users sign up but don't get synced to Supabase.

### Root Cause

Clerk webhook isn't configured or failing.

### Diagnosis

1. Check Clerk Dashboard → Webhooks
2. Verify webhook URL: `https://your-domain.com/api/webhooks/clerk`
3. Check recent webhook attempts for errors
4. Check your server logs for webhook processing errors

### Fix: Configure Webhook

1. Go to Clerk Dashboard → Webhooks → Add Endpoint
2. URL: `https://your-prod-domain.com/api/webhooks/clerk`
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `organization.created`
   - `organization.updated`
   - `organizationMembership.created`
   - `organizationMembership.updated`
   - `organizationMembership.deleted`
4. Copy webhook signing secret to `CLERK_WEBHOOK_SECRET` env var
5. Deploy and test

### Manual Sync (Emergency)

If webhook is broken and you need immediate access:

```bash
# Sync individual user
pnpm tsx scripts/sync-clerk-user.ts <email>

# Or link existing account
pnpm tsx scripts/link-clerk-account.ts <email>
```

## Symptom: RLS Policy blocking access

You're authenticated and in an organization, but queries return no data.

### Root Cause

RLS policies might not be updated for hybrid auth.

### Diagnosis

Check the database logs:

```sql
-- Run in Supabase SQL editor
SELECT * FROM auth.current_user_id(); -- Should return your clerk_user_id
SELECT * FROM auth.current_org_id();  -- Should return clerk_org_id
SELECT * FROM auth.current_org_role(); -- Should return org:owner, etc.
```

If these return NULL, the hybrid auth functions aren't working.

### Fix: Update RLS Policies

Ensure migration `20260118100000_add_hybrid_auth_functions.sql` was applied.

Check policies use hybrid auth functions:

```sql
-- Example correct policy
CREATE POLICY "Users can view their clinic's cases"
ON cases FOR SELECT
USING (
  auth.is_super_admin()
  OR
  user_has_clinic_access(clinic_id)
);
```

## Quick Diagnostic Flowchart

```
Can you sign in to Clerk?
├─ NO → Check Clerk credentials, reset password
└─ YES → Run debug script
         ├─ "No Clerk user found"
         │  └─ Sign up at web app first
         ├─ "Clerk user NOT synced to Supabase"
         │  ├─ Has existing Supabase account?
         │  │  ├─ YES → Run link-clerk-account.ts
         │  │  └─ NO → Run sync-clerk-user.ts
         ├─ "User has no clinic access"
         │  └─ Join/create organization or migrate clinic
         └─ "Clinic NOT LINKED TO CLERK"
            └─ Run migrate-pilot-clinics.ts or migrate-clinics-to-clerk.ts
```

## Scripts Quick Reference

| Script                         | Purpose                              | Usage                                                   |
| ------------------------------ | ------------------------------------ | ------------------------------------------------------- |
| `debug-user-clerk-sync.ts`     | Diagnose sync issues                 | `pnpm tsx scripts/debug-user-clerk-sync.ts <email>`     |
| `link-clerk-account.ts`        | Link existing Supabase user to Clerk | `pnpm tsx scripts/link-clerk-account.ts <email>`        |
| `sync-clerk-user.ts`           | Create new Supabase user from Clerk  | `pnpm tsx scripts/sync-clerk-user.ts <email>`           |
| `migrate-pilot-clinics.ts`     | Migrate Alum Rock & Del Valle        | `pnpm tsx scripts/migrate-pilot-clinics.ts [--dry-run]` |
| `check-pilot-clinic-status.ts` | Check clinic migration status        | `pnpm tsx scripts/check-pilot-clinic-status.ts`         |

## Prevention

To avoid these issues in the future:

1. **Always use webhook for production**
   - Automatic account syncing
   - No manual intervention needed

2. **Test webhook in staging first**
   - Verify events are being received
   - Check logs for errors

3. **Document onboarding flow**
   - New users: Sign up → Create/join org → Auto-synced
   - Existing users: Sign in → Auto-linked → Auto-synced

4. **Monitor sync status**
   - Set up alerts for failed webhooks
   - Periodic audit of unsynced users

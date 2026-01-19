# Account Linking: Clerk + Supabase Auth

> Automatic account linking between Clerk (web app) and Supabase Auth (iOS app)

## Overview

ODIS AI uses a **hybrid authentication system** with automatic account linking:

- **Web App**: Clerk authentication
- **iOS App**: Supabase Auth (existing implementation)
- **Account Linking**: Automatic linking by email address

## How It Works

### Scenario 1: iOS User Signs Into Web App

When an existing iOS user (Supabase Auth) signs into the web app via Clerk:

1. User signs up/in with Clerk using the same email
2. Clerk webhook fires `user.created` event
3. Webhook checks for existing user with matching email
4. If found, links the accounts:
   ```sql
   UPDATE users
   SET clerk_user_id = 'clerk_user_id_here'
   WHERE email = 'user@example.com'
   AND clerk_user_id IS NULL
   ```

### Scenario 2: Web User Joins Organization

When a linked user joins a Clerk Organization (clinic):

1. Clerk fires `organizationMembership.created` event
2. Webhook checks for existing clinic access
3. If user already has access (from iOS app):
   - **Preserves** `is_primary` setting
   - **Updates** role from Clerk Organization
4. If new clinic:
   - Creates clinic access as normal

## What Gets Preserved

When linking accounts, we preserve iOS user data:

| Field | Behavior |
|-------|----------|
| `first_name` | Uses Clerk value if iOS user has none |
| `last_name` | Uses Clerk value if iOS user has none |
| `avatar_url` | Uses Clerk value if iOS user has none |
| `clerk_user_id` | **Added** to existing user record |
| Clinic access | **Preserved** with existing `is_primary` setting |
| Cases, notes, etc. | **All preserved** (linked by user UUID) |

## Database Schema

```sql
-- Users table with dual auth support
CREATE TABLE users (
  id UUID PRIMARY KEY,              -- Supabase Auth UUID (iOS)
  clerk_user_id TEXT UNIQUE,        -- Clerk user ID (web)
  email TEXT UNIQUE NOT NULL,       -- Linking key
  -- ... other fields
);

-- Clinics can be managed via Clerk Organizations
CREATE TABLE clinics (
  id UUID PRIMARY KEY,
  clerk_org_id TEXT UNIQUE,         -- Clerk Organization ID
  -- ... other fields
);
```

## Hybrid Auth Functions

The database includes helper functions that work with both auth systems:

```sql
-- Returns user ID from either Clerk JWT or Supabase Auth JWT
SELECT auth.current_user_id();

-- Returns organization/clinic ID from either JWT type
SELECT auth.current_org_id();

-- Returns user's role in their active organization
SELECT auth.current_org_role();

-- Checks if user has access to a specific clinic
SELECT user_has_clinic_access('clinic-uuid-here');
```

See: `supabase/migrations/20260118100000_add_hybrid_auth_functions.sql`

## RLS Policies

All RLS policies have been updated to work with both auth systems:

```sql
-- Example: Cases access policy works with both Clerk and Supabase Auth
CREATE POLICY "Users can view their clinic's cases"
ON cases FOR SELECT
USING (
  -- Super admin access
  auth.is_super_admin()
  OR
  -- User has access to the case's clinic
  user_has_clinic_access(clinic_id)
);
```

## Logging

Account linking events are logged with Clerk webhook logs:

```typescript
logger.info("Account linked: Clerk account linked to existing iOS user", {
  supabaseUserId: existingUser.id,
  clerkUserId: id,
  email: primaryEmail,
  hadExistingData: !!(existingUser.first_name || existingUser.last_name),
});
```

## User Experience

### For iOS Users
- Sign into iOS app with Supabase Auth (no change)
- Sign into web app with Clerk using same email
- **All data carries over** automatically
- Clinic access, cases, settings preserved

### For New Web Users
- Sign up via Clerk
- Create or join organizations
- Later download iOS app and sign in with Supabase Auth
- Accounts remain separate until manually linked

## Implementation Files

| File | Purpose |
|------|---------|
| `apps/web/src/app/api/webhooks/clerk/route.ts` | Account linking webhook handler |
| `supabase/migrations/20260118000000_add_clerk_ids.sql` | Add `clerk_user_id` column |
| `supabase/migrations/20260118100000_add_hybrid_auth_functions.sql` | Hybrid auth helper functions |
| `supabase/migrations/20260118100001_update_rls_policies_hybrid_auth.sql` | Update RLS policies |
| `libs/data-access/supabase-client/src/clerk-server.ts` | Clerk Supabase client |
| `apps/web/src/proxy.ts` | Hybrid auth proxy middleware |

## Testing Account Linking

### Test Case 1: Existing iOS User Signs Into Web

1. Create user via iOS app (Supabase Auth)
2. Sign up on web app with same email (Clerk)
3. Verify:
   - `users.clerk_user_id` is populated
   - User's cases/clinics still accessible
   - Both iOS and web logins work

### Test Case 2: Existing Clinic Access

1. User has access to clinic via iOS app
2. User signs into web and joins same clinic via Clerk
3. Verify:
   - Existing clinic access preserved
   - `is_primary` setting maintained
   - Role updated from Clerk Organization

## Migration Path for Existing Supabase Auth Users

**Current approach: Automatic linking by email**

When an existing Supabase Auth user signs into the web app with Clerk, their account is automatically linked. No manual migration needed.

**Future option: Bulk import to Clerk**

If you later decide to fully migrate iOS to Clerk:

1. Export Supabase Auth users
2. Import to Clerk via API
3. Update iOS app to use Clerk SDK
4. Remove Supabase Auth dependency

## Security Considerations

- **Email verification**: Clerk and Supabase both verify emails independently
- **No automatic merges**: Only links accounts with exact email match
- **One-way linking**: Can link Clerk to Supabase, but not vice versa
- **Preserves iOS data**: Existing user data takes precedence
- **Service client**: Webhook uses service client to bypass RLS

## Monitoring

Watch for these log messages:

```
✅ "Account linked: Clerk account linked to existing iOS user"
✅ "Updated existing clinic access for linked account"
⚠️ "User has no primary email" - Clerk account missing email
⚠️ "Clinic not found for organization" - Clerk org not synced yet
```

## Next Steps

- Monitor account linking in production logs
- Track successful links via analytics
- Consider adding admin UI to view linked accounts
- Document edge cases as they arise

## References

- [Clerk + Supabase Setup](./CLERK_SUPABASE_SETUP.md)
- [Hybrid Auth Functions](../../supabase/migrations/20260118100000_add_hybrid_auth_functions.sql)
- [Auth Proxy Pattern](../architecture/AUTH_PROXY_PATTERN.md)

# Phase 3: Clerk Webhook Setup

## Summary

Phase 3 is complete! This phase added:

1. **Database Migration** - Added Clerk IDs to users and clinics tables
2. **Webhook Handler** - Created comprehensive Clerk webhook endpoint
3. **Proxy Pattern** - Documented existing auth proxy (no changes needed)

## Files Created/Modified

### 1. Database Migration
**File**: `supabase/migrations/20260118000000_add_clerk_ids.sql`

Adds:
- `clerk_user_id` to users table (links Clerk users to Supabase users)
- `clerk_org_id` to clinics table (links Clerk organizations to clinics)
- Indexes for efficient lookups

**To apply:**
```bash
# Local development
supabase db reset

# Production
supabase db push
```

### 2. Webhook Handler
**File**: `apps/web/src/app/api/webhooks/clerk/route.ts`

Handles these webhook events:
- `user.created` / `user.updated` - Syncs user data to Supabase
- `organization.created` / `organization.updated` - Syncs clinic data
- `organizationMembership.created` / `organizationMembership.updated` - Syncs clinic access
- `organizationMembership.deleted` - Removes clinic access

**Webhook URL for Clerk Dashboard:**
```
https://your-domain.com/api/webhooks/clerk
```

### 3. Authentication Proxy (Existing)
**File**: `apps/web/src/proxy.ts`

⚠️ **Note**: This project uses a **proxy pattern** instead of standard Next.js middleware.

The existing proxy already supports Clerk authentication and protects routes. It:
- Runs Clerk authentication when configured
- Always refreshes Supabase sessions (iOS compatibility)
- Allows public access to webhooks, auth pages, and marketing routes

See: `docs/architecture/AUTH_PROXY_PATTERN.md`

## Clerk Configuration Steps

### Step 1: Configure JWT Template

1. Go to Clerk Dashboard → **Configure** → **JWT Templates**
2. Click **New template** → **Supabase**
3. Name it: `supabase`
4. Save and note the template name

### Step 2: Set Up Webhook

1. Go to Clerk Dashboard → **Webhooks** → **Add Endpoint**
2. Enter webhook URL:
   ```
   https://your-domain.com/api/webhooks/clerk
   ```
3. Subscribe to these events:
   - `user.created`
   - `user.updated`
   - `organization.created`
   - `organization.updated`
   - `organizationMembership.created`
   - `organizationMembership.updated`
   - `organizationMembership.deleted`
4. Copy the **Signing Secret** (starts with `whsec_`)
5. Add to `.env.local`:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

### Step 3: Configure Organization Roles

1. Go to Clerk Dashboard → **Organizations** → **Roles & Permissions**
2. Create these custom roles:
   - `org:owner` - Full clinic access, manage team, billing
   - `org:veterinarian` - Full case access, medical decisions
   - `org:member` - View/edit cases, make calls
   - `org:viewer` - Read-only access

### Step 4: Environment Variables

Required environment variables:

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Clerk domain for Supabase (from JWT template page)
CLERK_DOMAIN=your-app.clerk.accounts.dev
```

## Testing the Webhook

### Local Testing with ngrok

1. Start ngrok:
   ```bash
   ngrok http 3000
   ```

2. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

3. Update Clerk webhook endpoint:
   ```
   https://abc123.ngrok.io/api/webhooks/clerk
   ```

4. Test events:
   - Create a user in Clerk Dashboard
   - Create an organization
   - Add a member to the organization
   - Check Supabase tables to verify sync

### Health Check

Test the webhook endpoint is accessible:
```bash
curl https://your-domain.com/api/webhooks/clerk
```

Expected response:
```json
{
  "status": "ok",
  "message": "Clerk webhook endpoint is active",
  "supportedEvents": [
    "user.created",
    "user.updated",
    "organization.created",
    "organization.updated",
    "organizationMembership.created",
    "organizationMembership.updated",
    "organizationMembership.deleted"
  ]
}
```

## Role Mapping

Clerk organization roles are mapped to ODIS AI clinic roles:

| Clerk Role | ODIS AI Role | Description |
|------------|--------------|-------------|
| `org:owner` | `owner` | Practice owner, full access |
| `org:admin` | `admin` | Clinic administrator |
| `org:veterinarian` | `veterinarian` | Licensed vet, medical decisions |
| `org:member` | `member` | Vet tech, staff |
| `org:viewer` | `viewer` | Read-only access |
| `admin` | `admin` | Fallback admin role |
| `basic_member` | `member` | Fallback member role |

## Database Schema

### users table (additions)
```sql
clerk_user_id TEXT UNIQUE  -- Clerk user ID (web app)
```

### clinics table (additions)
```sql
clerk_org_id TEXT UNIQUE  -- Clerk organization ID
```

### user_clinic_access table (existing)
```sql
user_id UUID              -- References users.id
clinic_id UUID            -- References clinics.id
role TEXT                 -- Mapped Clerk role
is_primary BOOLEAN        -- First clinic is primary
```

## Verification Checklist

- [ ] Database migration applied successfully
- [ ] JWT template configured in Clerk (`supabase`)
- [ ] Webhook endpoint added to Clerk Dashboard
- [ ] `CLERK_WEBHOOK_SECRET` set in environment
- [ ] Custom organization roles created
- [ ] Test user created and synced to Supabase
- [ ] Test organization created and synced to clinics table
- [ ] Test membership added and synced to user_clinic_access
- [ ] Webhook health check returns 200 OK

## Next Steps

Continue to **Phase 4: RLS Policy Updates** to:
- Create hybrid auth helper functions
- Update RLS policies to work with both Clerk and Supabase JWTs
- Enable seamless authentication across web and iOS apps

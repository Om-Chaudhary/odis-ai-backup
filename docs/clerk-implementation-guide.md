# Clerk Implementation Guide - Option 1 (Clerk Default URLs)

## ✅ What's Already Done (Code Complete)

All 8 phases of Clerk integration are implemented. You just need to configure external services.

---

## 🚀 Step-by-Step Implementation

### Step 1: Create Clerk Account (15 min)

1. **Sign up**: https://dashboard.clerk.com
2. **Create Application**:
   - Name: "ODIS AI"
   - Application type: "Production" (or "Development" for testing)
3. **Configure OAuth**:
   - Enable **Google** as sign-in method
   - Clerk will guide you through Google OAuth setup
4. **Set Application URLs**:
   - Homepage: `https://odisai.net`
   - Sign-in URL: `https://odisai.net/sign-in`
   - Sign-up URL: `https://odisai.net/sign-up`
   - After sign-in: `https://odisai.net/dashboard`
   - After sign-up: `https://odisai.net/onboarding`

**Save these for later**:
- ✅ Publishable Key (starts with `pk_live_...` or `pk_test_...`)
- ✅ Secret Key (starts with `sk_live_...` or `sk_test_...`)
- ✅ Your Clerk domain (e.g., `odisai.clerk.accounts.dev`)

---

### Step 2: Configure Clerk for Supabase (10 min)

1. **In Clerk Dashboard**, visit: https://dashboard.clerk.com/setup/supabase
2. **Follow the wizard** - it will:
   - Add `role: 'authenticated'` claim to session tokens
   - Configure JWT template for Supabase compatibility
3. **Note**: This is the NEW official integration (no JWT secret sharing needed!)

---

### Step 3: Enable Supabase Third-Party Auth (10 min)

#### Production (Supabase Dashboard)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to: **Authentication** → **Third-Party Auth**
3. Click **"Add Integration"**
4. Select **Clerk**
5. Enter your Clerk domain: `odisai.clerk.accounts.dev` (use your actual domain)
6. Click **Save**

#### Local Development

Add to `supabase/config.toml`:

```toml
[auth.third_party.clerk]
enabled = true
domain = "odisai.clerk.accounts.dev"  # Replace with your Clerk domain
```

Then restart Supabase:
```bash
supabase stop
supabase start
```

---

### Step 4: Configure Environment Variables (10 min)

#### Production (Vercel)

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these:

```env
# Clerk API Keys (from Step 1)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...  # Get this in Step 5

# Clerk URLs (already configured in code)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

#### Local Development

Create/update `.env.local`:

```env
# Clerk API Keys (use TEST keys for local)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...  # Get this in Step 5

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

**Restart your dev server** after adding these:
```bash
pnpm dev
```

---

### Step 5: Create Webhook Endpoint (15 min)

#### Production Webhook

1. **In Clerk Dashboard**, go to: **Webhooks**
2. Click **"Add Endpoint"**
3. **Endpoint URL**: `https://odisai.net/api/webhooks/clerk`
4. **Select Events** (check all):
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `organization.created`
   - ✅ `organization.updated`
   - ✅ `organizationMembership.created`
   - ✅ `organizationMembership.updated`
   - ✅ `organizationMembership.deleted`
5. Click **Create**
6. **Copy the Signing Secret** (starts with `whsec_...`)
7. **Add to Vercel**:
   - Vercel Dashboard → Environment Variables
   - Add `CLERK_WEBHOOK_SECRET=whsec_...`
   - Redeploy your app

#### Local Development Webhook (Optional)

For local testing, use ngrok:

```bash
# Terminal 1: Start your app
pnpm dev

# Terminal 2: Create tunnel
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
```

In Clerk Dashboard:
- Create a **second** webhook endpoint (for testing)
- URL: `https://abc123.ngrok.io/api/webhooks/clerk`
- Select same events as production
- Copy signing secret to `.env.local`

---

### Step 6: Configure Organization Roles (10 min)

1. **In Clerk Dashboard**, go to: **Organizations** → **Roles**
2. Click **"Create Role"** for each:

| Role Name | Role Key | Description | Permissions |
|-----------|----------|-------------|-------------|
| Owner | `org:owner` | Practice owner - full access | All (default admin role) |
| Admin | `org:admin` | Clinic administrator | Manage members, settings |
| Veterinarian | `org:veterinarian` | Licensed veterinarian | Medical decisions, discharge approval |
| Member | `org:member` | Staff member (vet tech) | View/edit cases, make calls |
| Viewer | `org:viewer` | Read-only guest | View-only access |

3. **Set default role**: `org:member`

---

### Step 7: Verify Database Migrations (5 min)

Check that migrations have been applied:

```sql
-- In Supabase SQL Editor, run:

-- Check Clerk columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'clerk_user_id';
-- Should return 1 row

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'clinics' AND column_name = 'clerk_org_id';
-- Should return 1 row

-- Test hybrid auth functions
SELECT auth.current_user_id();
-- Should work (returns NULL if not authenticated)

SELECT auth.current_org_id();
-- Should work (returns NULL if not authenticated)
```

If migrations aren't applied (unlikely), run:
```bash
supabase db push
```

---

### Step 8: Clean Up Old Auth Pages (5 min)

The redirects in `proxy.ts` handle old URLs automatically:
- `/login` → redirects to → `/sign-in`
- `/signup` → redirects to → `/sign-up`

**Optional cleanup** (can do later):
```bash
# These old auth pages are no longer used (Clerk handles auth UI)
# You can delete them once you verify Clerk is working:
rm -rf apps/web/src/app/\(auth\)/login
rm -rf apps/web/src/app/\(auth\)/signup
```

**Note**: Keep them for now until you verify Clerk works in production!

---

## ✅ Testing Checklist

### Local Testing (Before Production)

1. **Start your app**:
   ```bash
   pnpm dev
   ```

2. **Test sign-up flow**:
   - Visit: http://localhost:3000/sign-in
   - Should see Clerk UI with dark teal theme
   - Click "Sign up" → Create account with Google
   - Should redirect to `/onboarding` or `/dashboard`

3. **Test redirect**:
   - Visit: http://localhost:3000/login
   - Should auto-redirect to `/sign-in`

4. **Check webhook sync**:
   - After signing up, check your app logs
   - Should see: `[webhook] User synced successfully`
   - In Supabase, check:
     ```sql
     SELECT * FROM users WHERE clerk_user_id IS NOT NULL;
     ```

5. **Test organization creation**:
   - In your app, create an organization (clinic)
   - Check logs: `[webhook] Organization synced successfully`
   - In Supabase:
     ```sql
     SELECT * FROM clinics WHERE clerk_org_id IS NOT NULL;
     ```

6. **Test iOS compatibility**:
   - Open iOS app
   - Sign in with existing Supabase Auth
   - Verify app works normally
   - **Critical**: iOS users should NOT be affected

---

### Production Testing

After deploying to production:

1. **Verify webhook endpoint**:
   - In Clerk Dashboard → Webhooks
   - Check webhook status (should show successful deliveries)
   - Test by creating a user

2. **Test complete flow**:
   - Visit https://odisai.net/sign-in
   - Sign up with Google
   - Create organization
   - Invite team member
   - Verify all data syncs to Supabase

3. **Monitor for errors**:
   - Clerk webhook logs
   - Vercel function logs
   - Supabase logs

---

## 🐛 Troubleshooting

### "Clerk UI not showing"

**Problem**: Visiting `/sign-in` shows blank page

**Solution**:
```bash
# 1. Check env vars are set
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# 2. Restart dev server
pnpm dev

# 3. Clear browser cache
# 4. Check browser console for errors
```

---

### "Webhook not syncing"

**Problem**: Users/orgs not appearing in Supabase

**Solution**:
1. **Check webhook endpoint is reachable**:
   ```bash
   curl https://odisai.net/api/webhooks/clerk
   # Should return: {"status":"ok","message":"Clerk webhook endpoint is active"}
   ```

2. **Check Clerk webhook logs**:
   - Clerk Dashboard → Webhooks → Click your endpoint
   - Look for delivery failures or errors

3. **Check app logs** (Vercel):
   - Vercel Dashboard → Your Project → Logs
   - Filter for `webhook`

4. **Verify signing secret**:
   - Make sure `CLERK_WEBHOOK_SECRET` matches Clerk Dashboard

---

### "RLS denying access"

**Problem**: Users can't access data after sign-in

**Solution**:
```sql
-- Test hybrid auth functions (in Supabase SQL Editor)
SELECT auth.current_user_id();
-- Should return your Clerk user ID

SELECT auth.current_org_id();
-- Should return your organization ID

-- Check if user has clinic access
SELECT * FROM user_clinic_access WHERE user_id IN (
  SELECT id FROM users WHERE clerk_user_id = '<your-clerk-user-id>'
);
-- Should show at least one row
```

If no clinic access, webhook didn't fire. Check webhook configuration.

---

### "iOS app stopped working"

**Problem**: iOS users can't access data

**Solution**:
```sql
-- Verify hybrid auth functions work with Supabase JWT
-- (Test this by signing in via iOS app first)
SELECT auth.current_user_id();
-- Should return iOS user's UUID

-- Check if iOS user has clinic access
SELECT * FROM user_clinic_access WHERE user_id = auth.uid();
-- Should show rows

-- Check RLS policies are using hybrid functions
SELECT schemaname, tablename, policyname, definition
FROM pg_policies
WHERE tablename = 'cases';
-- Should reference auth.current_org_id(), not just auth.uid()
```

---

## 🎯 Next Steps After Setup

### 1. Migrate Existing Users (Optional)

If you have existing users you want to migrate to Clerk:

```typescript
// One-time migration script
// Run this carefully in production console

import { clerkClient } from '@clerk/nextjs/server'
import { createServiceClient } from '@odis-ai/data-access/db/server'

async function migrateExistingUsers() {
  const supabase = await createServiceClient()
  const clerk = await clerkClient()

  // Get users without clerk_user_id
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .is('clerk_user_id', null)

  for (const user of users) {
    try {
      // Create Clerk user
      const clerkUser = await clerk.users.createUser({
        emailAddress: [user.email],
        firstName: user.first_name,
        lastName: user.last_name,
        skipPasswordRequirement: true,
      })

      // Link accounts
      await supabase
        .from('users')
        .update({ clerk_user_id: clerkUser.id })
        .eq('id', user.id)

      console.log(`✅ Migrated: ${user.email}`)
    } catch (error) {
      console.error(`❌ Failed: ${user.email}`, error)
    }
  }
}
```

### 2. Add Organization Switcher UI

For users with multiple clinics:

```tsx
// In your app header/sidebar
import { OrganizationSwitcher } from '@clerk/nextjs'

<OrganizationSwitcher
  appearance={{
    elements: {
      organizationSwitcherTrigger: 'w-full justify-between',
    },
  }}
  afterSelectOrganizationUrl="/dashboard"
  afterCreateOrganizationUrl="/onboarding/clinic"
/>
```

### 3. Enable Feature Gating

Add subscription checks to tRPC procedures:

```typescript
// Example: Restrict outbound calls to professional+ tier
import { tierHasFeature } from '@odis-ai/shared/constants'

export const outboundRouter = createTRPCRouter({
  scheduleBatch: orgProtectedProcedure
    .input(batchSchema)
    .mutation(async ({ ctx, input }) => {
      // Get clinic subscription
      const { data: clinic } = await ctx.supabase
        .from('clinics')
        .select('subscription_tier')
        .eq('clerk_org_id', ctx.orgId)
        .single()

      const tier = clinic?.subscription_tier ?? 'none'

      if (!tierHasFeature(tier, 'batch_scheduling')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Batch scheduling requires Professional tier or higher',
        })
      }

      // Continue with scheduling...
    }),
})
```

---

## 📊 Verification SQL

Run this to check integration health:

```sql
-- Integration Health Check
SELECT
  'Total Users' as metric,
  COUNT(*) as count,
  NULL as percentage
FROM users

UNION ALL

SELECT
  'Users with Clerk ID',
  COUNT(*),
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM users) * 100, 1)
FROM users
WHERE clerk_user_id IS NOT NULL

UNION ALL

SELECT
  'Clinics with Clerk Org ID',
  COUNT(*),
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM clinics) * 100, 1)
FROM clinics
WHERE clerk_org_id IS NOT NULL

UNION ALL

SELECT
  'Total Clinic Access Entries',
  COUNT(*),
  NULL
FROM user_clinic_access

ORDER BY metric;
```

---

## 🎉 Success Criteria

Your Clerk integration is successful when:

- ✅ Users can sign up via `/sign-in` with Google OAuth
- ✅ Users appear in Supabase `users` table with `clerk_user_id`
- ✅ Organizations sync to `clinics` table with `clerk_org_id`
- ✅ Team invitations work (webhook creates `user_clinic_access` records)
- ✅ RLS policies filter data by organization correctly
- ✅ iOS app continues to work with Supabase Auth
- ✅ Stripe subscriptions sync with `clerk_org_id` in metadata
- ✅ Super admins can access all clinics
- ✅ Old `/login` and `/signup` URLs redirect properly

---

## 📚 Additional Resources

- **Clerk Docs**: https://clerk.com/docs
- **Clerk + Supabase Integration**: https://clerk.com/docs/integrations/databases/supabase
- **Supabase Third-Party Auth**: https://supabase.com/docs/guides/auth/third-party
- **Clerk Roles & Permissions**: https://clerk.com/docs/organizations/roles-permissions

---

## ⏱️ Estimated Timeline

| Task | Time | Status |
|------|------|--------|
| Create Clerk account | 15 min | ⬜ |
| Configure Supabase integration | 10 min | ⬜ |
| Enable third-party auth | 10 min | ⬜ |
| Set environment variables | 10 min | ⬜ |
| Create webhook endpoint | 15 min | ⬜ |
| Configure organization roles | 10 min | ⬜ |
| Verify migrations | 5 min | ⬜ |
| Local testing | 30 min | ⬜ |
| Deploy to production | 15 min | ⬜ |
| Production testing | 30 min | ⬜ |

**Total: ~2.5 hours**

---

## ✨ Summary

Your Clerk integration is **100% code-complete**. All you need to do is:

1. ✅ Configure Clerk (create account, enable Google OAuth)
2. ✅ Connect Clerk ↔ Supabase (third-party auth)
3. ✅ Set environment variables
4. ✅ Create webhook endpoint
5. ✅ Test locally, then deploy

The code is production-ready. Just plug in the configuration and you're live! 🚀

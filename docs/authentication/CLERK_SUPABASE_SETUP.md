# Clerk + Supabase Integration Setup Guide

> **Phase 2 Complete**: Third-Party Auth Integration
>
> This guide covers the configuration of Clerk as a third-party authentication provider for Supabase, enabling hybrid authentication where the web app uses Clerk while the iOS app continues using Supabase Auth.

## Overview

ODIS AI uses a hybrid authentication approach:

- **Web App**: Clerk authentication (Google OAuth only)
- **iOS App**: Supabase Auth (existing implementation)
- **Database**: Supabase PostgreSQL with RLS policies supporting both auth methods

This enables incremental migration to Clerk without disrupting the iOS app.

---

## Environment Variables

### Required Clerk Variables

Add these to your `.env.local` file:

```bash
# Clerk Configuration
# Get these from: https://dashboard.clerk.com/

# Secret key for server-side operations (NEVER expose to browser)
CLERK_SECRET_KEY="sk_live_..."

# Publishable key for client-side SDK
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."

# Webhook secret for verifying webhook signatures
CLERK_WEBHOOK_SECRET="whsec_..."

# Clerk domain for Supabase third-party auth
# Format: <your-app>.clerk.accounts.dev
CLERK_DOMAIN="odis-ai.clerk.accounts.dev"

# Route configuration (optional - defaults shown)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
```

### Finding Your Values

1. **CLERK_SECRET_KEY & NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**
   - Go to: https://dashboard.clerk.com/
   - Navigate to: **Configure > API Keys**
   - Copy the values for your environment

2. **CLERK_WEBHOOK_SECRET**
   - Go to: **Configure > Webhooks**
   - Create a new endpoint (see Webhook Setup below)
   - Copy the signing secret

3. **CLERK_DOMAIN**
   - Go to: **Configure > Domains**
   - Copy your primary domain (format: `your-app.clerk.accounts.dev`)

---

## Clerk JWT Template Configuration

**Critical**: Supabase requires specific JWT claims to validate Clerk tokens. You must configure a custom JWT template in Clerk.

### Step 1: Create Supabase JWT Template

1. Go to: https://dashboard.clerk.com/
2. Navigate to: **Configure > JWT Templates**
3. Click **"+ New template"**
4. Select **"Supabase"** from the templates list
5. Name it: **`supabase`** (exact name - used in code)

### Step 2: Configure JWT Claims

The Supabase template should include these claims:

```json
{
  "aud": "authenticated",
  "exp": {{exp}},
  "iat": {{iat}},
  "iss": "{{CLERK_DOMAIN}}",
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "phone": "{{user.primary_phone_number}}",
  "app_metadata": {
    "provider": "clerk",
    "org_id": "{{org.id}}",
    "org_role": "{{org.role}}",
    "org_slug": "{{org.slug}}"
  },
  "user_metadata": {
    "email": "{{user.primary_email_address}}",
    "email_verified": {{user.email_verified}},
    "phone_verified": {{user.phone_verified}},
    "full_name": "{{user.full_name}}",
    "first_name": "{{user.first_name}}",
    "last_name": "{{user.last_name}}"
  }
}
```

### Step 3: Save and Activate

1. Click **"Apply Changes"**
2. **Important**: The template name must be **`supabase`** (lowercase, no spaces)
3. This name is referenced in the client code: `getToken({ template: "supabase" })`

---

## Supabase Configuration

### Enable Third-Party Auth

The Supabase configuration is already set in `supabase/config.toml`:

```toml
[auth.third_party.clerk]
enabled = true
domain = "env(CLERK_DOMAIN)"
```

### Apply Configuration

For local development:

```bash
supabase stop
supabase start
```

For production:

1. Go to: https://supabase.com/dashboard
2. Navigate to: **Authentication > Providers**
3. Enable **Clerk** under "Third-Party Auth"
4. Enter your `CLERK_DOMAIN`

---

## Usage

### Server Components

```typescript
import { createClerkClient } from '@odis-ai/data-access/db';

export async function ServerComponent() {
  const supabase = await createClerkClient();
  const { data: cases } = await supabase
    .from('cases')
    .select('*');

  return <div>{/* Render cases */}</div>;
}
```

### Client Components

```typescript
'use client';

import { useClerkSupabaseClient } from '@odis-ai/data-access/db';
import { useEffect, useState } from 'react';

export function ClientComponent() {
  const supabase = useClerkSupabaseClient();
  const [cases, setCases] = useState([]);

  useEffect(() => {
    async function fetchCases() {
      const { data } = await supabase.from('cases').select('*');
      setCases(data);
    }
    fetchCases();
  }, [supabase]);

  return <div>{/* Render cases */}</div>;
}
```

### Optional Authentication

For public pages that may or may not have an authenticated user:

```typescript
import { createOptionalClerkClient } from "@odis-ai/data-access/db";

export async function PublicPage() {
  const supabase = await createOptionalClerkClient();
  // Works whether user is logged in or not
}
```

---

## Testing

### Verify JWT Template

1. Sign in to your Clerk-protected app
2. Open browser DevTools > Console
3. Run:
   ```javascript
   await window.Clerk.session.getToken({ template: "supabase" });
   ```
4. Decode the JWT at https://jwt.io
5. Verify claims match the template configuration

### Verify Supabase Integration

```typescript
// In a server component or API route
const supabase = await createClerkClient();

// This should work with RLS enabled
const { data, error } = await supabase.from("cases").select("*");

if (error) {
  console.error("Auth failed:", error);
} else {
  console.log("Auth succeeded, got", data.length, "cases");
}
```

---

## Troubleshooting

### "Invalid JWT" Error

**Cause**: Clerk JWT template not configured or incorrect name

**Fix**:

1. Verify template name is exactly `supabase` (lowercase)
2. Verify JWT claims match the template above
3. Restart Supabase: `supabase stop && supabase start`

### "No active session" Error

**Cause**: User not signed in via Clerk

**Fix**:

1. Ensure `ClerkProvider` wraps your app in `app/layout.tsx`
2. Verify environment variables are set
3. Check middleware allows access to the route

### RLS Policies Not Working

**Cause**: JWT claims don't match RLS policy expectations

**Fix**:

1. Check JWT claims using jwt.io
2. Verify `sub` claim contains Clerk user ID
3. Update RLS policies to use Clerk JWT structure (Phase 4)

---

## Next Steps

- **Phase 3**: Organizations = Clinics webhook integration
- **Phase 4**: Update RLS policies for hybrid auth
- **Phase 5**: Integrate Clerk with tRPC context

---

## Reference

- [Clerk Dashboard](https://dashboard.clerk.com/)
- [Clerk + Supabase Guide](https://clerk.com/docs/integrations/databases/supabase)
- [Supabase Third-Party Auth](https://supabase.com/docs/guides/auth/third-party/clerk)
- [JWT Template Docs](https://clerk.com/docs/backend-requests/making/jwt-templates)

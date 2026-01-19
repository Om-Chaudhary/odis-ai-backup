# Clerk UI Component Audit & Recommendations

> Analysis of existing auth UI and recommendations for Clerk component integration

## Executive Summary

Your web app **already uses Clerk** for authentication, but has a mix of:

- ✅ **Clerk native components** (sign-in, sign-up, org switcher)
- ⚠️ **Custom-built components** that duplicate Clerk functionality (profile pages, user menus)
- ⚠️ **Server Actions for auth** that should use Clerk's built-in features

**Recommendation**: Replace custom auth components with Clerk's pre-built UI for better maintenance and feature parity.

---

## Current State Analysis

### ✅ Already Using Clerk (Keep These)

| Component       | File                                                       | Status                             |
| --------------- | ---------------------------------------------------------- | ---------------------------------- |
| Sign-In Page    | `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx`         | ✅ Uses `<SignIn />`               |
| Sign-Up Page    | `apps/web/src/app/sign-up/[[...sign-up]]/page.tsx`         | ✅ Uses `<SignUp />`               |
| Clinic Switcher | `apps/web/src/components/organization/clinic-switcher.tsx` | ✅ Uses `<OrganizationSwitcher />` |

### ⚠️ Should Replace with Clerk Components

| Component          | File                                                           | Replace With                         |
| ------------------ | -------------------------------------------------------------- | ------------------------------------ |
| User Menu (Header) | `apps/web/src/components/dashboard/shell/dashboard-header.tsx` | `<UserButton />`                     |
| Profile Page       | `apps/web/src/components/profile-page/page.tsx`                | `<UserProfile />`                    |
| Team Members List  | `apps/web/src/components/team/team-members-list.tsx`           | `<OrganizationProfile />`            |
| Invite Team Member | `apps/web/src/components/team/invite-team-member-dialog.tsx`   | Built into `<OrganizationProfile />` |

### ⚠️ Custom Auth Logic to Remove

| Server Action            | File                                  | Replace With                     |
| ------------------------ | ------------------------------------- | -------------------------------- |
| `signUp()`               | `apps/web/src/server/actions/auth.ts` | Clerk's built-in sign-up         |
| `signIn()`               | `apps/web/src/server/actions/auth.ts` | Clerk's built-in sign-in         |
| `signOut()`              | `apps/web/src/server/actions/auth.ts` | `useClerk().signOut()`           |
| `requestPasswordReset()` | `apps/web/src/server/actions/auth.ts` | Clerk's built-in password reset  |
| `updatePassword()`       | `apps/web/src/server/actions/auth.ts` | Clerk's built-in password update |

---

## Clerk Pre-Built Components Reference

### 1. `<UserButton />` - User Menu & Profile

**What it provides:**

- User avatar with dropdown menu
- User profile management (name, email, avatar, password)
- Organization switcher (if multi-tenant)
- Sign-out button
- Custom menu items support
- Appearance customization

**Replaces:**

- `apps/web/src/components/dashboard/shell/dashboard-header.tsx` (user menu)
- Custom user dropdown logic

**Implementation:**

```tsx
import { UserButton } from "@clerk/nextjs";

<UserButton
  appearance={{
    elements: {
      avatarBox: "w-10 h-10",
    },
  }}
  afterSignOutUrl="/sign-in"
  showName={true}
  // Add custom menu items
  userProfileMode="navigation"
  userProfileUrl="/dashboard/profile"
/>;
```

**Features:**

- ✅ Automatic avatar updates
- ✅ Profile photo upload
- ✅ Email management
- ✅ Password changes
- ✅ MFA configuration
- ✅ Active sessions view
- ✅ Connected accounts
- ✅ Delete account

---

### 2. `<UserProfile />` - Full Profile Management

**What it provides:**

- Complete user profile editor
- Security settings (password, 2FA)
- Active sessions management
- Connected accounts
- Delete account
- Custom pages support
- Appearance customization

**Replaces:**

- `apps/web/src/components/profile-page/page.tsx`
- `apps/web/src/components/profile-page/components/profile-header.tsx`
- `apps/web/src/components/profile-page/components/profile-content.tsx`

**Implementation:**

```tsx
import { UserProfile } from "@clerk/nextjs";

<UserProfile
  appearance={{
    elements: {
      rootBox: "w-full",
      card: "shadow-none",
    },
  }}
  // Add custom tabs
>
  <UserProfile.Page label="Notifications" url="notifications">
    <CustomNotificationsSettings />
  </UserProfile.Page>
</UserProfile>;
```

**Features:**

- ✅ Profile fields (name, email, phone)
- ✅ Avatar upload with cropping
- ✅ Password management
- ✅ Two-factor authentication
- ✅ Active sessions with device info
- ✅ Connected accounts (OAuth)
- ✅ Account deletion workflow

---

### 3. `<OrganizationSwitcher />` - Clinic Switcher

**Already implemented** in:

- `apps/web/src/components/organization/clinic-switcher.tsx`

**Enhancement opportunity:**

```tsx
import { OrganizationSwitcher } from "@clerk/nextjs";

<OrganizationSwitcher
  hidePersonal={true}
  appearance={{
    elements: {
      rootBox: "flex items-center justify-center",
      organizationSwitcherTrigger: "px-3 py-2",
    },
  }}
  afterCreateOrganizationUrl="/dashboard/:slug"
  afterSelectOrganizationUrl="/dashboard/:slug"
  createOrganizationMode="modal" // or "navigation"
/>;
```

---

### 4. `<OrganizationProfile />` - Team Management

**What it provides:**

- Organization settings editor
- Member management (invite, remove, change roles)
- Pending invitations list
- Organization deletion
- Custom pages support
- Appearance customization

**Replaces:**

- `apps/web/src/components/team/team-members-list.tsx`
- `apps/web/src/components/team/invite-team-member-dialog.tsx`
- Custom team management logic

**Implementation:**

```tsx
import { OrganizationProfile } from "@clerk/nextjs";

<OrganizationProfile
  appearance={{
    elements: {
      rootBox: "w-full",
      card: "shadow-none",
    },
  }}
>
  <OrganizationProfile.Page label="VAPI Settings" url="vapi">
    <CustomVapiSettings />
  </OrganizationProfile.Page>
  <OrganizationProfile.Page label="PIMS Sync" url="pims">
    <CustomPimsSettings />
  </OrganizationProfile.Page>
</OrganizationProfile>;
```

**Features:**

- ✅ Member list with avatars and roles
- ✅ Invite members by email
- ✅ Pending invitations management
- ✅ Remove members
- ✅ Change member roles
- ✅ Organization settings
- ✅ Delete organization

---

### 5. `<OrganizationList />` - Organization Selection

**What it provides:**

- Grid/list of user's organizations
- Create new organization button
- Join with invitation
- Switch between organizations

**Use case:**

- Onboarding flow when user has no organization
- Organization selection page

**Implementation:**

```tsx
import { OrganizationList } from "@clerk/nextjs";

<OrganizationList
  hidePersonal={true}
  afterCreateOrganizationUrl="/dashboard/:slug"
  afterSelectOrganizationUrl="/dashboard/:slug"
  skipInvitationScreen={false}
/>;
```

---

### 6. Clerk Hooks & Utilities

**Client-side hooks:**

```tsx
import { useUser, useOrganization, useClerk, useAuth } from "@clerk/nextjs";

// Get current user
const { user, isLoaded, isSignedIn } = useUser();

// Get current organization (clinic)
const { organization, membership } = useOrganization();

// Sign out, navigate, etc.
const { signOut, redirectToSignIn } = useClerk();

// Get auth state
const { userId, orgId, orgRole } = useAuth();
```

**Server-side functions:**

```tsx
import { auth, currentUser } from "@clerk/nextjs/server";

// In Server Components
const { userId, orgId } = await auth();
const user = await currentUser();

// In API Routes
import { getAuth } from "@clerk/nextjs/server";
const { userId } = getAuth(request);
```

---

## Recommended Implementation Plan

### Phase 1: Low-Hanging Fruit (1-2 hours)

**Replace User Menu in Header:**

- File: `apps/web/src/components/dashboard/shell/dashboard-header.tsx`
- Replace custom user dropdown with `<UserButton />`
- Remove custom auth logic
- Keep notification bell and test mode badge

**Benefits:**

- Automatic avatar updates
- Built-in profile management
- Better mobile experience
- Less maintenance

---

### Phase 2: Profile Page Replacement (2-3 hours)

**Replace Custom Profile Page:**

- File: `apps/web/src/components/profile-page/page.tsx`
- Replace entire custom profile with `<UserProfile />`
- Add custom tabs for notifications and clinic-specific settings
- Migrate notification preferences to custom tab

**Benefits:**

- Professional UI out-of-the-box
- Built-in security features (2FA, sessions)
- Automatic feature updates from Clerk
- Less code to maintain

---

### Phase 3: Team Management (2-3 hours)

**Replace Team Members Components:**

- File: `apps/web/src/components/team/team-members-list.tsx`
- Replace with `<OrganizationProfile />` component
- Add custom tabs for clinic settings (VAPI, PIMS)
- Remove custom invite dialog

**Benefits:**

- Native role management
- Invitation email handling
- Pending invitations UI
- Less custom code

---

### Phase 4: Auth Server Actions Cleanup (1-2 hours)

**Remove Redundant Server Actions:**

- File: `apps/web/src/server/actions/auth.ts`
- Remove: `signUp()`, `signIn()`, `signOut()`, `requestPasswordReset()`, `updatePassword()`
- Keep: `getUser()`, `getUserProfile()`, `updateUserProfile()` (these sync Clerk → Supabase)
- Update any components using these actions

**Benefits:**

- Single source of truth (Clerk)
- Fewer auth bugs
- Less code to maintain

---

### Phase 5: Admin User Management (Optional, 2-3 hours)

**Enhance Admin User Management:**

- Use Clerk's admin SDK for user operations
- Replace custom invite logic with Clerk's organization invitations
- Use Clerk's user metadata for platform roles

---

## Custom Features to Preserve

### 1. Clinic-Scoped Routing

Keep your existing clinic-scoped routing pattern:

```
/dashboard/{clinicSlug}/...
```

Clerk's `afterSelectOrganizationUrl` supports this with `:slug` placeholder.

---

### 2. Supabase User Profiles

Keep syncing Clerk users to Supabase via webhook:

- File: `apps/web/src/app/api/webhooks/clerk/route.ts`
- Maintains user profiles in database
- Supports hybrid auth (Clerk + Supabase Auth for iOS)

---

### 3. Role-Based Access Control

Continue using Clerk organization roles mapped to your domain:

```typescript
const ROLE_MAP = {
  "org:owner": "owner",
  "org:admin": "admin",
  "org:veterinarian": "veterinarian",
  "org:member": "member",
  "org:viewer": "viewer",
};
```

Clerk's `<OrganizationProfile />` respects these custom roles.

---

### 4. Multi-Clinic Support

Keep your clinic selector for quick switching:

- File: `apps/web/src/components/dashboard/clinic-selector.tsx`
- Complements `<OrganizationSwitcher />` with inline dropdown

---

### 5. Custom Notifications System

Add as custom tab in `<UserProfile />`:

```tsx
<UserProfile>
  <UserProfile.Page label="Notifications" url="notifications">
    <NotificationsSettings />
  </UserProfile.Page>
</UserProfile>
```

---

## Appearance Customization

### Teal Theme (Your Brand)

```typescript
// apps/web/src/lib/clerk-theme.ts
import type { Appearance } from "@clerk/types";

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#0f766e", // teal-700
    colorBackground: "#ffffff",
    colorText: "#1f2937", // gray-800
    colorTextSecondary: "#6b7280", // gray-500
    borderRadius: "0.5rem",
  },
  elements: {
    card: "shadow-lg",
    formButtonPrimary: "bg-teal-600 hover:bg-teal-700",
    formFieldInput: "border-gray-300 focus:border-teal-500 focus:ring-teal-500",
    headerTitle: "text-teal-900 font-bold",
    headerSubtitle: "text-gray-600",
  },
};
```

**Apply globally:**

```tsx
// apps/web/src/app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "~/lib/clerk-theme";

<ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>;
```

---

## Testing Strategy

### 1. Test Account Linking

Verify existing Supabase Auth users (iOS) can sign into web app:

1. Existing iOS user signs up on web with same email
2. Webhook links accounts (`clerk_user_id` populated)
3. User retains clinic access from iOS

### 2. Test Organization Features

1. Create new clinic via `<OrganizationSwitcher />`
2. Invite team member via `<OrganizationProfile />`
3. Change member role
4. Remove member
5. Switch between clinics

### 3. Test Profile Management

1. Update profile photo via `<UserButton />`
2. Change password via `<UserProfile />`
3. Enable 2FA
4. View active sessions
5. Delete account workflow

---

## Migration Checklist

- [ ] Phase 1: Replace user menu with `<UserButton />`
- [ ] Phase 2: Replace profile page with `<UserProfile />`
- [ ] Phase 3: Replace team management with `<OrganizationProfile />`
- [ ] Phase 4: Remove redundant auth server actions
- [ ] Phase 5: Update admin user management (optional)
- [ ] Apply custom teal theme to all Clerk components
- [ ] Test account linking with iOS users
- [ ] Test organization/clinic features
- [ ] Test profile management features
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Monitor Clerk webhook logs

---

## Cost Considerations

**Clerk Pricing (as of 2024):**

- Free tier: 10,000 MAUs (monthly active users)
- Pro tier: $25/month + $0.02/MAU after 10,000
- Production tier: Custom pricing

**Features included:**

- ✅ All UI components
- ✅ Organizations (multi-tenancy)
- ✅ Webhooks
- ✅ Custom roles
- ✅ SSO (Production tier)
- ✅ SAML (Production tier)

**Current usage:**

- You're already paying for Clerk
- Replacing custom UI components is **free**
- Just reduces maintenance burden

---

## Resources

- [Clerk Components Documentation](https://clerk.com/docs/components/overview)
- [Clerk Customization Guide](https://clerk.com/docs/customization/overview)
- [Clerk Next.js Integration](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Webhooks Reference](https://clerk.com/docs/integrations/webhooks)
- [Clerk + Supabase Integration](https://clerk.com/docs/integrations/databases/supabase)

---

## Next Steps

1. **Review this document** with your team
2. **Approve implementation plan** (or suggest changes)
3. **Start with Phase 1** (user menu replacement) - lowest risk, immediate benefit
4. **Test in staging** before rolling to production
5. **Monitor user feedback** during rollout

Questions? Let me know which phase you'd like to start with!

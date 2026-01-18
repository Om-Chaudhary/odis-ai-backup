# Admin Dashboard PRD - ODIS AI Platform

> **Status**: Draft
> **Author**: Claude Code
> **Created**: 2026-01-17
> **Last Updated**: 2026-01-17

## Executive Summary

This PRD defines a comprehensive admin dashboard for the ODIS AI veterinary platform, enabling platform administrators to manage multiple clinics, users, PIMS sync operations, and workflows from a centralized interface. The dashboard introduces a `super_admin` role with cross-clinic visibility and control.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Goals & Success Criteria](#2-goals--success-criteria)
3. [Architecture Design](#3-architecture-design)
4. [Feature Specifications](#4-feature-specifications)
5. [PIMS Sync Management](#5-pims-sync-management)
6. [Technical Implementation](#6-technical-implementation)
7. [Security Considerations](#7-security-considerations)
8. [Implementation Phases](#8-implementation-phases)
9. [Verification Plan](#9-verification-plan)
10. [Risks & Mitigations](#10-risks--mitigations)

---

## 1. Problem Statement

Currently, the ODIS AI platform lacks:

- **Cross-clinic visibility**: Admins can only see data for their assigned clinic(s)
- **Centralized user management**: No way to manage users across all clinics
- **PIMS sync monitoring**: No admin UI for monitoring/controlling the pims-sync microservice
- **Operational oversight**: Limited visibility into scheduled calls/emails across the platform

### Current State

```
┌─────────────────────────────────────────────────────────┐
│                   Current Architecture                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  /dashboard/[clinicSlug]/  ← Clinic-scoped only         │
│                                                          │
│  • Users see only their assigned clinic(s)              │
│  • Admin role has limited cross-clinic visibility       │
│  • No PIMS sync management UI                           │
│  • No centralized operations view                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Desired State

```
┌─────────────────────────────────────────────────────────┐
│                   Desired Architecture                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  /admin/*  ← Platform-wide admin access                 │
│                                                          │
│  • Super admins see ALL clinics                         │
│  • Centralized user management                          │
│  • PIMS sync monitoring & control                       │
│  • Cross-clinic workflow visibility                     │
│                                                          │
│  /dashboard/[clinicSlug]/  ← Clinic-scoped (unchanged)  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Goals & Success Criteria

| Goal                      | Success Metric                                               |
| ------------------------- | ------------------------------------------------------------ |
| Cross-clinic management   | Admin can view/manage all 100% of clinics from one interface |
| User lifecycle management | Admin can invite, modify roles, and deactivate users         |
| PIMS sync control         | Admin can trigger syncs, view history, configure schedules   |
| Operational visibility    | Admin can view/manage all scheduled workflows across clinics |
| Security                  | All admin actions logged, role-based access enforced         |

### Non-Goals (Out of Scope)

- Billing/subscription management (keep in Stripe portal)
- Client-facing portal
- Mobile admin app

---

## 3. Architecture Design

### 3.1 Routing Strategy

**Top-level `/admin` route** (separate from clinic-scoped `/dashboard/[clinicSlug]`):

```
/admin                           # Overview dashboard
/admin/clinics                   # All clinics list
/admin/clinics/[clinicId]        # Clinic detail + config
/admin/users                     # All users list
/admin/users/[userId]            # User detail + clinic assignments
/admin/sync                      # PIMS sync overview (all clinics)
/admin/sync/[clinicId]           # Clinic-specific sync management
/admin/operations                # Scheduled calls/emails across clinics
/admin/settings                  # Platform settings
```

**Rationale**:

- Clear separation from clinic-scoped `/dashboard/[clinicSlug]/*` routes
- Avoids polluting existing user-facing dashboard
- Existing `userHasClinicAccess()` function already handles admin role checks

### 3.2 Authorization Model

**Use existing `admin` role** as platform-wide super admin (no new role needed)

```typescript
// Role hierarchy
type UserRole =
  | "admin" // Platform super admin (full access to ALL clinics)
  | "practice_owner" // Clinic owner/admin (clinic-level management)
  | "veterinarian" // Standard vet
  | "vet_tech" // Vet technician
  | "client"; // Pet owner (future)

// Access control
const ADMIN_DASHBOARD_ACCESS = ["admin"];
```

**Key distinctions**:

- `admin`: Platform-level super admin with access to ALL clinics, system settings, PIMS sync management
- `practice_owner`: Clinic-level admin for their assigned clinic(s), no platform access
- Per-clinic permissions can be further refined via `user_clinic_access.role` field

### 3.3 Multi-Tenant Admin Pattern

**Global view with clinic context selector**:

```typescript
interface AdminContextValue {
  selectedClinicId: string | null; // null = all clinics
  clinics: Clinic[];
  setSelectedClinic: (id: string | null) => void;
  isGlobalView: boolean;
}
```

**UI Pattern**:

- Clinic dropdown in admin header ("All Clinics" or specific clinic)
- URL query param sync: `?clinic=uuid`
- Data tables filter based on selected clinic context

### 3.4 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Admin Dashboard (Next.js)                    │
│                         /admin/*                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Admin Layout  │  │  Clinic Selector│  │  System Health  │ │
│  │   (Sidebar +    │  │  (Context)      │  │  Monitor        │ │
│  │    Header)      │  │                 │  │                 │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                 │
│  ┌─────────────────────────────┴─────────────────────────────┐ │
│  │                    Page Components                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │ │
│  │  │ Clinics  │ │  Users   │ │  PIMS    │ │  Operations  │  │ │
│  │  │ Manager  │ │  Manager │ │  Sync    │ │  Dashboard   │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                │                                 │
└────────────────────────────────┼────────────────────────────────┘
                                 │
                                 │ tRPC (admin.*)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      tRPC API Layer                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  adminRouter = {                                                 │
│    clinics: adminClinicsRouter,   // CRUD for clinics           │
│    users: adminUsersRouter,       // User management            │
│    sync: adminSyncRouter,         // PIMS sync control          │
│    operations: adminOperationsRouter, // Workflow management    │
│  }                                                               │
│                                                                  │
│  Middleware: superAdminProcedure (verifies super_admin role)    │
│                                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
┌───────────────────┐ ┌───────────┐ ┌───────────────────┐
│   Supabase DB     │ │ pims-sync │ │   External APIs   │
│                   │ │ (Railway) │ │                   │
│  • clinics        │ │           │ │  • Stripe         │
│  • users          │ │  /health  │ │  • Resend         │
│  • user_clinic_   │ │  /api/    │ │  • VAPI           │
│    access         │ │   sync/*  │ │                   │
│  • cases          │ │           │ │                   │
│  • case_sync_     │ └───────────┘ └───────────────────┘
│    audits         │       │
│  • idexx_         │       │
│    credentials    │       ▼
│  • scheduled_     │ ┌───────────┐
│    discharge_*    │ │ IDEXX Neo │
└───────────────────┘ │   PMS     │
                      └───────────┘
```

---

## 4. Feature Specifications

### 4.1 Admin Overview Dashboard (`/admin`)

**Purpose**: High-level platform health and activity summary

**Components**:

| Component            | Data Source         | Refresh Rate |
| -------------------- | ------------------- | ------------ |
| `SystemHealthCard`   | pims-sync `/health` | 30s          |
| `ClinicStatsGrid`    | `clinics` table     | 60s          |
| `ActiveSyncsCard`    | `case_sync_audits`  | 10s          |
| `RecentActivityFeed` | `user_events`       | 30s          |
| `QuickActions`       | N/A                 | N/A          |

**Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│  Admin Dashboard                    [Clinic: All Clinics ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ System Health                                           ││
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   ││
│  │ │ pims-sync│ │ Database │ │ Active   │ │ Errors   │   ││
│  │ │ ✅ Online│ │ ✅ Online│ │ Syncs: 2 │ │ (24h): 3 │   ││
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────┐ ┌────────────────────────────┐│
│  │ Clinic Stats             │ │ Quick Actions              ││
│  │                          │ │                            ││
│  │ Total Clinics: 12        │ │ [+ Invite User]            ││
│  │ Active: 10               │ │ [+ Create Clinic]          ││
│  │ Users: 45                │ │ [⟳ Trigger Sync]           ││
│  │ Cases Today: 127         │ │ [📊 View Reports]          ││
│  └──────────────────────────┘ └────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Recent Activity                                         ││
│  │ ─────────────────────────────────────────────────────── ││
│  │ • Alum Rock: Inbound sync completed (127 appointments)  ││
│  │ • Happy Paws: User invited (john@example.com)           ││
│  │ • VetCare: Case sync failed (auth error)                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Clinic Management (`/admin/clinics`)

#### 4.2.1 Clinics List Page

**Features**:

- DataTable with search, sort, pagination
- Filters: active/inactive, subscription tier, PIMS type
- Quick actions: view, edit, toggle active

**Columns**:

| Column       | Type     | Sortable | Description                  |
| ------------ | -------- | -------- | ---------------------------- |
| Name         | Link     | ✅       | Clinic name (link to detail) |
| Slug         | Text     | ✅       | URL slug                     |
| Users        | Number   | ✅       | User count                   |
| Cases (7d)   | Number   | ✅       | Cases created in last 7 days |
| Subscription | Badge    | ✅       | Tier + status                |
| PIMS         | Badge    | ✅       | IDEXX Neo, EzyVet, etc.      |
| Status       | Badge    | ✅       | Active/Inactive              |
| Last Sync    | DateTime | ✅       | Last PIMS sync timestamp     |
| Actions      | Buttons  | ❌       | Edit, Deactivate             |

#### 4.2.2 Clinic Detail Page (`/admin/clinics/[clinicId]`)

**Tab Structure**:

```
┌─────────────────────────────────────────────────────────────┐
│  Alum Rock Veterinary Hospital                              │
│  ───────────────────────────────────────────────────────── │
│  [Overview] [Settings] [Users] [IDEXX] [Sync] [Activity]    │
├─────────────────────────────────────────────────────────────┤
```

**Tab 1: Overview**

- Basic info card (name, address, phone, email)
- VAPI configuration (assistant IDs, phone numbers)
- Subscription details (Stripe customer ID, tier, status)
- Quick stats (users, cases, calls this week)

**Tab 2: Settings**

- Business hours editor (per day of week)
- Timezone selector
- Branding (logo upload, primary color, email templates)
- PIMS type selection

**Tab 3: Users**

- Users with access to this clinic
- Per-user role in this clinic
- Invite new user button
- Remove access action

**Tab 4: IDEXX Credentials**

- Credential status indicator
- Last validated timestamp
- Test connection button
- Update credentials form (Company ID, Username, Password)

**Tab 5: Sync Configuration**

- Automated sync schedules (cron editor)
- Manual sync trigger buttons
- Sync history table (last 10 syncs)

**Tab 6: Activity**

- Audit log of changes to this clinic
- User actions within clinic
- System events (syncs, errors)

#### 4.2.3 Clinic CRUD Operations

**Create Clinic**:

```typescript
interface CreateClinicInput {
  name: string; // Required
  slug?: string; // Auto-generated if not provided
  email?: string;
  phone?: string;
  address?: string;
  timezone: string; // Default: 'America/Los_Angeles'
  pims_type?: PimsType; // 'idexx_neo' | 'ezyvet' | 'shepherd'
}
```

**Update Clinic**:

```typescript
interface UpdateClinicInput {
  clinicId: string; // Required
  name?: string;
  slug?: string; // Warning if changed (affects URLs)
  email?: string;
  phone?: string;
  address?: string;
  timezone?: string;
  pims_type?: PimsType;
  is_active?: boolean;
  // VAPI config
  inbound_assistant_id?: string;
  outbound_assistant_id?: string;
  inbound_phone_number_id?: string;
  outbound_phone_number_id?: string;
  // Branding
  logo_url?: string;
  primary_color?: string;
  email_header_text?: string;
  email_footer_text?: string;
}
```

**Deactivate Clinic**:

- Sets `is_active = false`
- Preserves all data (soft delete)
- Blocks user access via RLS policies
- Cancels scheduled syncs
- Requires confirmation dialog

### 4.3 User Management (`/admin/users`)

#### 4.3.1 Users List Page

**Features**:

- DataTable with search, sort, pagination
- Filters: role, clinic, active status
- Bulk actions: deactivate selected

**Columns**:

| Column      | Type     | Sortable | Description              |
| ----------- | -------- | -------- | ------------------------ |
| Name        | Link     | ✅       | First + Last name        |
| Email       | Text     | ✅       | Email address            |
| Role        | Badge    | ✅       | Platform role            |
| Clinics     | Tags     | ❌       | List of assigned clinics |
| Last Active | DateTime | ✅       | Last login               |
| Created     | DateTime | ✅       | Account creation         |
| Status      | Badge    | ✅       | Active/Inactive          |
| Actions     | Buttons  | ❌       | Edit, Deactivate         |

#### 4.3.2 User Detail Page (`/admin/users/[userId]`)

**Sections**:

```
┌─────────────────────────────────────────────────────────────┐
│  Dr. Jane Smith                                             │
│  jane.smith@alumrock.vet                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Profile                                                 ││
│  │ Role: [veterinarian ▼]                                  ││
│  │ Created: Jan 15, 2025                                   ││
│  │ Last Active: 2 hours ago                                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Clinic Access                          [+ Add Clinic]   ││
│  │ ─────────────────────────────────────────────────────── ││
│  │ ✓ Alum Rock Veterinary (Primary)    [admin]    [Remove] ││
│  │ ✓ Happy Paws Clinic                 [member]   [Remove] ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Recent Activity                                         ││
│  │ ─────────────────────────────────────────────────────── ││
│  │ • Created case for "Bella" (2h ago)                     ││
│  │ • Scheduled discharge call (3h ago)                     ││
│  │ • Updated clinic settings (yesterday)                   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 4.3.3 User Operations

**Invite User**:

```typescript
interface InviteUserInput {
  email: string; // Required
  firstName?: string;
  lastName?: string;
  role: UserRole; // Platform role
  clinicIds: string[]; // Clinics to grant access
  primaryClinicId: string; // Default clinic
  clinicRoles?: Record<string, ClinicRole>; // Per-clinic roles
}
```

Flow:

1. Create `clinic_invitations` record with secure token
2. Send invite email via Resend
3. User clicks link → creates account
4. Auto-create `user_clinic_access` records

**Update User Role**:

- Changes `users.role` column
- Audit logged to `user_events`
- Cannot demote self

**Grant Clinic Access**:

```typescript
interface GrantClinicAccessInput {
  userId: string;
  clinicId: string;
  role: ClinicRole; // 'owner' | 'admin' | 'member' | 'viewer'
  isPrimary?: boolean;
}
```

**Revoke Clinic Access**:

- Removes `user_clinic_access` record
- Cannot remove user's only clinic access
- Cannot remove primary clinic (must change primary first)

**Deactivate User**:

- Removes all `user_clinic_access` records
- Preserves `users` record (soft delete)
- Future: disable Supabase auth.users record

---

## 5. PIMS Sync Management

### 5.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│          Next.js Admin Panel (apps/web)                     │
│          /admin/sync/*                                      │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Sync Dashboard                                        │ │
│  │  ├── Service Health Monitor (polls /health)           │ │
│  │  ├── Active Sync Status (polls /api/sync/status)      │ │
│  │  └── Quick Actions (trigger buttons)                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────────────┐ │
│  │ Inbound Schedule    │  │ Deep Consultation Sync      │ │
│  │ ├── Trigger Sync    │  │ ├── Trigger Sync            │ │
│  │ ├── View History    │  │ ├── View History            │ │
│  │ ├── Configure Range │  │ ├── Batch Config            │ │
│  │ └── Schedule Config │  │ └── Schedule Config         │ │
│  └─────────────────────┘  └─────────────────────────────┘ │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Sync History & Audit Log                              │ │
│  │  ├── Timeline View (grouped by date)                  │ │
│  │  ├── Filters (type, status, date range)               │ │
│  │  └── Detailed Stats & Error Logs                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ IDEXX Credentials Management                          │ │
│  │  ├── Connection Status                                │ │
│  │  ├── Test Connection                                  │ │
│  │  └── Update Credentials (encrypted)                   │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ tRPC (admin.sync.*)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              tRPC API Layer (Server-side)                    │
│  ├── getHealth() → HTTP to pims-sync                        │
│  ├── getActiveSyncs() → Query in-progress syncs             │
│  ├── triggerInboundSync() → POST /api/sync/inbound          │
│  ├── triggerConsultationSync() → POST /api/sync/cases       │
│  ├── getSyncHistory() → Query case_sync_audits              │
│  ├── updateScheduleConfig() → Update sync_schedules         │
│  ├── getCredentialStatus() → Query idexx_credentials        │
│  ├── updateCredentials() → Encrypted credential update      │
│  └── testConnection() → Test IDEXX auth                     │
└────────┬────────────────────────────────────┬───────────────┘
         │                                     │
         │ HTTP (X-API-Key)                    │ Supabase Client
         ▼                                     ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│  PIMS Sync Service       │    │    Supabase Database     │
│  (Express + Playwright)  │◄───┤  ├── case_sync_audits    │
│                          │    │  ├── idexx_credentials   │
│  Endpoints:              │    │  ├── clinic_api_keys     │
│  ├── GET /health         │    │  ├── cases (synced data) │
│  ├── POST /api/sync/     │    │  └── clinic_schedule_    │
│  │   inbound             │    │      configs             │
│  ├── POST /api/sync/     │    └──────────────────────────┘
│  │   cases               │              ▲
│  └── Scheduler (cron)    │              │
│      ├── Inbound: 6am    │              │
│      └── Cases: 3x/day   │──────────────┘
└──────────────────────────┘    Writes audit logs & synced data
         │
         │ Playwright automation
         ▼
┌──────────────────────────┐
│    IDEXX Neo PMS         │
│  ├── Appointments API    │
│  ├── Consultations API   │
│  └── Authentication      │
└──────────────────────────┘
```

### 5.2 Sync Types

| Sync Type          | Purpose                           | Frequency   | Duration   |
| ------------------ | --------------------------------- | ----------- | ---------- |
| **Inbound**        | Sync appointments 1-14 days ahead | Daily @ 6am | ~2-5 min   |
| **Cases**          | Enrich cases with SOAP notes      | 3x daily    | ~5-15 min  |
| **Reconciliation** | Match/deduplicate records         | Daily @ 2am | ~1-3 min   |
| **Full**           | Complete pipeline                 | On-demand   | ~10-20 min |

### 5.3 Data Model

**Existing Tables (No Changes)**:

```sql
-- Sync audit trail
CREATE TABLE case_sync_audits (
  id uuid PRIMARY KEY,
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  sync_type text NOT NULL,     -- 'inbound' | 'cases' | 'reconciliation' | 'full'
  status text NOT NULL,        -- 'running' | 'success' | 'partial' | 'failed'
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  appointments_found integer,
  cases_created integer,
  cases_updated integer,
  cases_skipped integer,
  cases_deleted integer,
  error_details jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- IDEXX credentials (encrypted)
CREATE TABLE idexx_credentials (
  id uuid PRIMARY KEY,
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  username_encrypted bytea NOT NULL,
  password_encrypted bytea NOT NULL,
  company_id_encrypted bytea NOT NULL,
  encryption_key_id text NOT NULL,
  last_used_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Sync schedule configuration (stored in clinic_schedule_configs)
-- sync_schedules JSONB column format:
[
  {"type": "inbound", "cron": "0 6 * * *", "enabled": true, "daysAhead": 14},
  {"type": "cases", "cron": "0 8,14,20 * * *", "enabled": true, "batchSize": 20},
  {"type": "reconciliation", "cron": "0 2 * * *", "enabled": true}
]
```

### 5.4 TypeScript Types

```typescript
// Sync configuration
interface InboundSyncConfig {
  daysAhead: number; // How many days to sync (default: 14)
  enabled: boolean;
  cron?: string; // e.g., "0 6 * * *" for 6am daily
}

interface ConsultationSyncConfig {
  batchSize: number; // Consultations per batch (default: 20)
  enabled: boolean;
  cron?: string; // e.g., "0 8,14,20 * * *" for 3x daily
}

// Service health
interface PimsSyncHealth {
  status: "healthy" | "degraded" | "down";
  uptime: number; // seconds
  memory: { used: number; total: number };
  version: string;
  scheduler: {
    status: "running" | "stopped";
    totalJobs: number;
    nextRuns: Array<{
      type: "inbound" | "cases";
      scheduledAt: Date;
    }>;
  };
}

// Sync result
interface SyncResult {
  success: boolean;
  syncId: string;
  type: "inbound" | "cases" | "reconciliation" | "full";
  stats: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  durationMs: number;
  errors?: Array<{ message: string; context?: Record<string, unknown> }>;
}

// Sync history item
interface SyncHistoryItem {
  id: string;
  clinicId: string;
  clinicName: string;
  syncType: "inbound" | "cases" | "reconciliation" | "full";
  status: "running" | "success" | "partial" | "failed";
  startedAt: Date;
  completedAt: Date | null;
  stats: {
    appointmentsFound?: number;
    casesCreated: number;
    casesUpdated: number;
    casesSkipped: number;
    casesFailed: number;
  };
  errorDetails?: Record<string, unknown>;
}
```

### 5.5 tRPC Procedures

```typescript
// apps/web/src/server/api/routers/admin/sync/router.ts

export const adminSyncRouter = createTRPCRouter({
  // Service health check
  getServiceHealth: superAdminProcedure.query(async () => {
    const res = await fetch(`${PIMS_SYNC_URL}/health`);
    return res.json() as PimsSyncHealth;
  }),

  // Active syncs across all clinics
  getActiveSyncs: superAdminProcedure
    .input(z.object({ clinicId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      const query = ctx.supabase
        .from("case_sync_audits")
        .select("*, clinics(name)")
        .eq("status", "running");

      if (input.clinicId) query.eq("clinic_id", input.clinicId);

      return query;
    }),

  // Trigger inbound schedule sync
  triggerInboundSync: superAdminProcedure
    .input(
      z.object({
        clinicId: z.string().uuid(),
        daysAhead: z.number().min(1).max(14).default(7),
      }),
    )
    .mutation(async ({ input }) => {
      const apiKey = await getClinicApiKey(input.clinicId);
      const res = await fetch(`${PIMS_SYNC_URL}/api/sync/inbound`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({ daysAhead: input.daysAhead }),
      });
      return res.json() as SyncResult;
    }),

  // Trigger case enrichment sync
  triggerCaseSync: superAdminProcedure
    .input(
      z.object({
        clinicId: z.string().uuid(),
        batchSize: z.number().min(1).max(100).default(20),
      }),
    )
    .mutation(async ({ input }) => {
      /* similar */
    }),

  // Get sync history with filters
  getSyncHistory: superAdminProcedure
    .input(
      z.object({
        clinicId: z.string().uuid().optional(),
        syncType: z
          .enum(["inbound", "cases", "reconciliation", "full"])
          .optional(),
        status: z.enum(["running", "success", "partial", "failed"]).optional(),
        dateRange: z
          .object({
            start: z.string().datetime(),
            end: z.string().datetime(),
          })
          .optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      /* query case_sync_audits */
    }),

  // Update sync schedules
  updateSyncSchedules: superAdminProcedure
    .input(
      z.object({
        clinicId: z.string().uuid(),
        schedules: z.array(syncScheduleSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      /* update clinic_schedule_configs */
    }),

  // Credential status (without revealing values)
  getCredentialStatus: superAdminProcedure
    .input(z.object({ clinicId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.supabase
        .from("idexx_credentials")
        .select("id, created_at, updated_at, last_used_at, is_active")
        .eq("clinic_id", input.clinicId)
        .eq("is_active", true)
        .single();

      return {
        hasCredentials: !!data,
        lastUsed: data?.last_used_at,
        isActive: data?.is_active ?? false,
      };
    }),

  // Test IDEXX connection
  testConnection: superAdminProcedure
    .input(z.object({ clinicId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const apiKey = await getClinicApiKey(input.clinicId);
      const res = await fetch(`${PIMS_SYNC_URL}/api/sync/test-auth`, {
        method: "POST",
        headers: { "X-API-Key": apiKey },
      });
      return res.json() as { success: boolean; error?: string };
    }),

  // Update credentials (encrypted storage)
  updateCredentials: superAdminProcedure
    .input(updateCredentialsSchema)
    .mutation(async ({ ctx, input }) => {
      /* encrypt and store */
    }),
});
```

### 5.6 UI Components

```
apps/web/src/components/admin/sync/
├── sync-dashboard.tsx          # Main overview layout
├── health-monitor.tsx          # Service health display
├── active-sync-card.tsx        # Running sync status
├── sync-trigger-panel.tsx      # Trigger buttons + options
├── sync-history-table.tsx      # Paginated audit log
├── sync-history-filters.tsx    # Filter controls
├── sync-stats-card.tsx         # Visual stats (created/updated/etc)
├── schedule-config-form.tsx    # Cron schedule editor
├── credential-status-card.tsx  # Credential info + test button
├── credential-update-form.tsx  # Update credentials form
└── sync-status-badge.tsx       # Status indicator component
```

---

## 6. Technical Implementation

### 6.1 Database Migrations

```sql
-- Migration: 20260117000001_admin_dashboard_indexes.sql

-- No role changes needed - using existing 'admin' role as platform super admin

-- Add indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_case_sync_audits_clinic_started
ON case_sync_audits(clinic_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_case_sync_audits_status
ON case_sync_audits(status) WHERE status = 'running';

CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

CREATE INDEX IF NOT EXISTS idx_user_clinic_access_user
ON user_clinic_access(user_id);

CREATE INDEX IF NOT EXISTS idx_user_clinic_access_clinic
ON user_clinic_access(clinic_id);
```

### 6.2 tRPC Router Structure

```
apps/web/src/server/api/routers/admin/
├── index.ts                 # Export combined router
├── middleware.ts            # superAdminProcedure
├── clinics/
│   ├── router.ts           # adminClinicsRouter
│   ├── schemas.ts          # Zod schemas
│   └── procedures/
│       ├── list.ts
│       ├── get-by-id.ts
│       ├── create.ts
│       ├── update.ts
│       └── toggle-active.ts
├── users/
│   ├── router.ts           # adminUsersRouter
│   ├── schemas.ts
│   └── procedures/
│       ├── list.ts
│       ├── get-by-id.ts
│       ├── invite.ts
│       ├── update-role.ts
│       ├── update-clinic-access.ts
│       └── deactivate.ts
├── sync/
│   ├── router.ts           # adminSyncRouter
│   ├── schemas.ts
│   └── procedures/
│       ├── get-health.ts
│       ├── get-active-syncs.ts
│       ├── trigger-inbound.ts
│       ├── trigger-cases.ts
│       ├── get-history.ts
│       ├── update-schedules.ts
│       ├── get-credential-status.ts
│       ├── test-connection.ts
│       └── update-credentials.ts
└── operations/
    ├── router.ts           # adminOperationsRouter
    ├── schemas.ts
    └── procedures/
        ├── get-all-scheduled.ts
        ├── get-metrics.ts
        ├── bulk-cancel.ts
        └── bulk-reschedule.ts
```

### 6.3 File Structure

```
apps/web/src/app/admin/
├── layout.tsx                  # Admin layout (auth check, sidebar)
├── page.tsx                    # Overview dashboard
├── clinics/
│   ├── page.tsx               # Clinics list
│   └── [clinicId]/
│       ├── page.tsx           # Clinic detail (tabs)
│       └── loading.tsx
├── users/
│   ├── page.tsx               # Users list
│   └── [userId]/
│       ├── page.tsx           # User detail
│       └── loading.tsx
├── sync/
│   ├── page.tsx               # Sync overview
│   └── [clinicId]/
│       ├── page.tsx           # Clinic sync management
│       ├── history/
│       │   └── page.tsx       # Full sync history
│       └── schedules/
│           └── page.tsx       # Schedule configuration
├── operations/
│   ├── page.tsx               # Operations overview
│   ├── calls/
│   │   └── page.tsx           # Scheduled calls
│   └── emails/
│       └── page.tsx           # Scheduled emails
└── settings/
    └── page.tsx               # Platform settings
```

### 6.4 Component Structure

```
apps/web/src/components/admin/
├── layout/
│   ├── admin-sidebar.tsx      # Navigation sidebar
│   ├── admin-header.tsx       # Header with clinic selector
│   ├── clinic-selector.tsx    # Dropdown component
│   └── admin-breadcrumbs.tsx
├── clinics/
│   ├── clinics-data-table.tsx
│   ├── clinic-detail-tabs.tsx
│   ├── clinic-overview-tab.tsx
│   ├── clinic-settings-form.tsx
│   ├── clinic-users-tab.tsx
│   ├── clinic-create-dialog.tsx
│   └── clinic-deactivate-dialog.tsx
├── users/
│   ├── users-data-table.tsx
│   ├── user-detail-card.tsx
│   ├── user-profile-section.tsx
│   ├── user-clinics-section.tsx
│   ├── invite-user-dialog.tsx
│   └── clinic-access-manager.tsx
├── sync/
│   ├── sync-dashboard.tsx
│   ├── health-monitor.tsx
│   ├── active-sync-card.tsx
│   ├── sync-trigger-panel.tsx
│   ├── sync-history-table.tsx
│   ├── sync-schedule-config.tsx
│   ├── credential-status-card.tsx
│   └── credential-update-form.tsx
├── operations/
│   ├── scheduled-items-table.tsx
│   ├── workflow-filters.tsx
│   ├── bulk-action-bar.tsx
│   └── performance-charts.tsx
└── overview/
    ├── system-health-card.tsx
    ├── clinic-stats-grid.tsx
    ├── quick-actions-card.tsx
    └── recent-activity-feed.tsx
```

### 6.5 Admin Context Provider

```typescript
// apps/web/src/lib/admin-context.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Clinic {
  id: string;
  name: string;
  slug: string;
}

interface AdminContextValue {
  selectedClinicId: string | null;
  clinics: Clinic[];
  setSelectedClinic: (id: string | null) => void;
  isGlobalView: boolean;
  isSuperAdmin: boolean;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({
  children,
  clinics,
  isSuperAdmin,
}: {
  children: React.ReactNode;
  clinics: Clinic[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);

  // Sync with URL query param
  useEffect(() => {
    const clinicParam = searchParams.get('clinic');
    if (clinicParam && clinics.some(c => c.id === clinicParam)) {
      setSelectedClinicId(clinicParam);
    }
  }, [searchParams, clinics]);

  const setSelectedClinic = (id: string | null) => {
    setSelectedClinicId(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set('clinic', id);
    } else {
      params.delete('clinic');
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <AdminContext.Provider
      value={{
        selectedClinicId,
        clinics,
        setSelectedClinic,
        isGlobalView: !selectedClinicId,
        isSuperAdmin,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within AdminProvider');
  }
  return context;
}
```

### 6.6 Admin Middleware

```typescript
// apps/web/src/server/api/routers/admin/middleware.ts
import { TRPCError } from "@trpc/server";
import { middleware } from "../../trpc";

export const platformAdminMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const { data: profile, error } = await ctx.supabase
    .from("users")
    .select("role")
    .eq("id", ctx.user.id)
    .single();

  // 'admin' role = platform-wide super admin
  if (error || profile?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Platform admin access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      isPlatformAdmin: true,
    },
  });
});

// Export the procedure for admin dashboard routes
export const adminProcedure = protectedProcedure.use(platformAdminMiddleware);
```

### 6.7 Environment Variables

```bash
# apps/web/.env.local

# PIMS Sync Service
PIMS_SYNC_URL=https://pims-sync-production.up.railway.app
PIMS_SYNC_ADMIN_API_KEY=sk_admin_xxx  # Master key for health checks

# Existing variables
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 7. Security Considerations

### 7.1 Access Control

| Layer    | Protection                                              |
| -------- | ------------------------------------------------------- |
| Route    | Admin layout checks `super_admin` role server-side      |
| API      | `superAdminProcedure` middleware on all tRPC procedures |
| Database | RLS policies (future enhancement for admin tables)      |

### 7.2 Data Protection

| Data              | Protection                                              |
| ----------------- | ------------------------------------------------------- |
| IDEXX credentials | AES-256-GCM encryption, never returned decrypted        |
| API keys          | Only bcrypt hash stored, raw key shown once at creation |
| Passwords         | Never logged, never included in error messages          |

### 7.3 Audit Logging

All admin mutations logged to `user_events` table:

```typescript
interface AdminAuditLog {
  user_id: string; // Admin who performed action
  action: string; // e.g., 'clinic.update', 'user.deactivate'
  target_type: string; // 'clinic' | 'user' | 'sync' | etc.
  target_id: string; // ID of affected entity
  details: Json; // Action-specific data
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
```

### 7.4 Rate Limiting

| Action              | Limit                 |
| ------------------- | --------------------- |
| Manual sync trigger | 5 per hour per clinic |
| Bulk operations     | 100 items per request |
| API key generation  | 5 per clinic          |
| Credential updates  | 10 per day per clinic |

---

## 8. Implementation Phases

### Phase 1: Foundation (3-4 days)

- [ ] Database migration: Add performance indexes for admin queries
- [ ] Create `adminProcedure` middleware (checks for `admin` role)
- [ ] Create `/admin` layout with sidebar and header
- [ ] Create `AdminProvider` context
- [ ] Create clinic selector component
- [ ] Add basic overview page

**Deliverable**: Admin can access `/admin` with basic layout

### Phase 2: Clinic Management (3-4 days)

- [ ] Implement `adminClinicsRouter` procedures
- [ ] Build clinics list page with DataTable
- [ ] Build clinic detail page with tabs
- [ ] Build clinic settings form
- [ ] Build clinic create dialog
- [ ] Build deactivate confirmation dialog

**Deliverable**: Full clinic CRUD from admin dashboard

### Phase 3: User Management (3-4 days)

- [ ] Implement `adminUsersRouter` procedures
- [ ] Build users list page with DataTable
- [ ] Build user detail page with clinic assignments
- [ ] Build invite user dialog
- [ ] Build clinic access manager
- [ ] Implement invitation email flow

**Deliverable**: Full user management from admin dashboard

### Phase 4: PIMS Sync Management (4-5 days)

- [ ] Implement `adminSyncRouter` procedures
- [ ] Build sync overview page with health monitor
- [ ] Build clinic sync page with triggers
- [ ] Build sync history table with filters
- [ ] Build schedule configuration form
- [ ] Build credentials management (status, test, update)

**Deliverable**: Full PIMS sync control from admin dashboard

### Phase 5: Operations & Polish (3-4 days)

- [ ] Implement `adminOperationsRouter` procedures
- [ ] Build operations page with scheduled items table
- [ ] Build bulk action bar (cancel, reschedule)
- [ ] Build admin overview dashboard with stats
- [ ] Add system health monitoring
- [ ] Add performance metrics charts
- [ ] Polish UI/UX and error handling

**Deliverable**: Complete admin dashboard ready for production

---

## 9. Verification Plan

### 9.1 Manual Testing Checklist

**Authentication & Authorization**:

- [ ] Super admin can access `/admin/*` routes
- [ ] Non-super-admin redirected to `/dashboard`
- [ ] Regular admin cannot access admin dashboard
- [ ] Clinic selector filters data correctly

**Clinic Management**:

- [ ] Can list all clinics with search/filter
- [ ] Can create new clinic with all fields
- [ ] Can edit existing clinic settings
- [ ] Can deactivate/reactivate clinic
- [ ] Deactivated clinic blocks user access

**User Management**:

- [ ] Can list all users with search/filter
- [ ] Can view user detail with clinic assignments
- [ ] Can invite new user to multiple clinics
- [ ] Invitation email sent and works
- [ ] Can modify user role
- [ ] Can grant/revoke clinic access
- [ ] Can deactivate user

**PIMS Sync**:

- [ ] Health monitor shows service status
- [ ] Can trigger inbound sync manually
- [ ] Can trigger case sync manually
- [ ] Sync history shows with correct stats
- [ ] Can filter sync history by type/status/date
- [ ] Can configure automated schedules
- [ ] Credential status displays correctly
- [ ] Test connection works
- [ ] Can update credentials

**Operations**:

- [ ] Can view all scheduled calls/emails
- [ ] Clinic filter works correctly
- [ ] Can cancel individual item
- [ ] Can reschedule individual item
- [ ] Bulk cancel works
- [ ] Bulk reschedule works

### 9.2 Automated Tests

```typescript
// Example test cases
describe('adminClinicsRouter', () => {
  it('rejects non-super-admin users', async () => { ... });
  it('lists all clinics for super admin', async () => { ... });
  it('creates clinic with valid input', async () => { ... });
  it('prevents duplicate slug', async () => { ... });
});

describe('adminSyncRouter', () => {
  it('returns service health', async () => { ... });
  it('triggers inbound sync', async () => { ... });
  it('filters sync history correctly', async () => { ... });
});
```

### 9.3 E2E Tests

- [ ] Full admin workflow: login → view clinics → create clinic → configure
- [ ] User invitation flow: invite → email → accept → verify access
- [ ] PIMS sync workflow: trigger → monitor progress → view history
- [ ] Operations workflow: view scheduled → bulk select → cancel

---

## 10. Risks & Mitigations

| Risk                       | Impact                      | Likelihood | Mitigation                                           |
| -------------------------- | --------------------------- | ---------- | ---------------------------------------------------- |
| pims-sync service down     | Sync management unavailable | Medium     | Show error state, allow history viewing from DB      |
| Large data volumes         | Slow page loads             | Medium     | Pagination, server-side filtering, virtual scrolling |
| Concurrent sync operations | Race conditions             | Low        | Implement sync locking per clinic in pims-sync       |
| Credential exposure        | Security breach             | Low        | Never return decrypted, encrypt at rest              |
| Admin action mistakes      | Data corruption             | Medium     | Confirmation dialogs, audit logging, soft deletes    |
| Role escalation            | Unauthorized access         | Low        | Server-side role checks, middleware enforcement      |

---

## Appendix A: Design Decisions (Resolved)

1. **Role Strategy**: ✅ RESOLVED
   - Use existing `admin` role as platform-wide super admin (no new role needed)
   - `practice_owner` serves as clinic-level admin
   - No database migration for roles required

2. **Subscription Management**: ✅ RESOLVED
   - Phase 2 feature - use Stripe dashboard for initial release
   - May add read-only subscription view in future

3. **Real-time Sync Updates**: ✅ RESOLVED
   - Use polling (5-second intervals when sync is running)
   - Simple and reliable, no extra infrastructure needed

4. **Multi-clinic User Invites**: (Open)
   - **Recommendation**: Single email with list of clinics

---

## Appendix B: Related Documents

- [AGENTS.md](/AGENTS.md) - AI coding assistant guide
- [RBAC Enhancement Plan](/docs/architecture/RBAC_ENHANCEMENT_PLAN.md) - Role-based access control design
- [NX Projects Reference](/docs/reference/NX_PROJECTS.md) - Monorepo project inventory
- [Testing Strategy](/docs/testing/TESTING_STRATEGY.md) - Test coverage requirements

---

## Appendix C: Glossary

| Term             | Definition                                               |
| ---------------- | -------------------------------------------------------- |
| **Super Admin**  | Platform-level administrator with access to all clinics  |
| **Clinic Admin** | Clinic-level administrator (assigned clinics only)       |
| **PIMS**         | Practice Information Management System (e.g., IDEXX Neo) |
| **Inbound Sync** | Syncing future appointments from PIMS                    |
| **Case Sync**    | Enriching cases with SOAP notes from PIMS                |
| **RLS**          | Row-Level Security (Supabase/PostgreSQL)                 |

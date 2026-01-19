# Standalone Migration Scripts

These are standalone versions of the migration scripts that don't depend on the monorepo's environment validation. Use these if you're having issues with environment variables.

## Quick Start (Easiest)

### 1. Create .env file

```bash
cp scripts/standalone/.env.example scripts/standalone/.env
# Edit scripts/standalone/.env with your credentials
```

### 2. Run with helper script

```bash
# Debug a user
./scripts/standalone/run.sh debug garrybath@hotmail.com

# Link account
./scripts/standalone/run.sh link garrybath@hotmail.com

# Migrate pilot clinics (dry run)
./scripts/standalone/run.sh migrate-pilots --dry-run

# Migrate pilot clinics (live)
./scripts/standalone/run.sh migrate-pilots
```

## Manual Setup

### Set Environment Variables

Option 1 - Export in shell:

```bash
export CLERK_SECRET_KEY=sk_test_...
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Option 2 - Prefix each command:

```bash
CLERK_SECRET_KEY=sk_xxx SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=eyJ... \
  pnpm tsx scripts/standalone/debug-user-clerk-sync.ts <email>
```

## Available Scripts

### 1. Debug User Sync

```bash
pnpm tsx scripts/standalone/debug-user-clerk-sync.ts <email>
```

Example:

```bash
pnpm tsx scripts/standalone/debug-user-clerk-sync.ts garrybath@hotmail.com
```

### 2. Link Clerk Account

```bash
pnpm tsx scripts/standalone/link-clerk-account.ts <email>
```

Use when user has existing Supabase account.

### 3. Sync Clerk User

```bash
pnpm tsx scripts/standalone/sync-clerk-user.ts <email>
```

Use when user is brand new (Clerk only, no Supabase account).

### 4. Migrate Pilot Clinics

```bash
# Dry run first
pnpm tsx scripts/standalone/migrate-pilot-clinics.ts --dry-run

# Execute
pnpm tsx scripts/standalone/migrate-pilot-clinics.ts
```

Migrates Alum Rock Animal Hospital and Del Valle Pet Hospital.

## Quick Example

```bash
# Export env vars
export CLERK_SECRET_KEY=sk_test_xxxxx
export SUPABASE_URL=https://yourproject.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Debug a user
pnpm tsx scripts/standalone/debug-user-clerk-sync.ts garrybath@hotmail.com

# If output says to link account:
pnpm tsx scripts/standalone/link-clerk-account.ts garrybath@hotmail.com

# If output says to migrate clinic:
pnpm tsx scripts/standalone/migrate-pilot-clinics.ts --dry-run
pnpm tsx scripts/standalone/migrate-pilot-clinics.ts
```

## Differences from Regular Scripts

- ✅ No monorepo package dependencies
- ✅ No environment validation (only checks required vars)
- ✅ Direct Supabase and Clerk client creation
- ✅ Simpler error messages
- ✅ Works even if other env vars are missing

Use these if the regular scripts fail with environment variable errors.

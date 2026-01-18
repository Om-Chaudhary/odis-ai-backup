# Getting Started with PIMS Sync

> Complete setup and development guide for the PIMS Sync Service

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Service](#running-the-service)
- [Making Your First Request](#making-your-first-request)
- [Using the CLI](#using-the-cli)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Check Command    |
| ----------- | ------- | ---------------- |
| Node.js     | 20+     | `node --version` |
| pnpm        | 10+     | `pnpm --version` |
| Nx CLI      | Latest  | `nx --version`   |

**Additional Requirements:**

- Access to a Supabase project (URL + Service Role Key)
- Access to IDEXX Neo credentials for a clinic (for testing)
- 32+ character encryption key for credential storage

---

## Quick Start

```bash
# 1. Clone and install dependencies (if not already done)
cd /path/to/odis-ai
pnpm install

# 2. Build the service
nx build pims-sync

# 3. Set up environment variables
cp apps/pims-sync/.env.example apps/pims-sync/.env
# Edit .env with your credentials

# 4. Start the service
pnpm --filter pims-sync start

# 5. Verify it's running
curl http://localhost:3001/health
```

---

## Environment Setup

### Step 1: Create Environment File

```bash
# From the project root
cp apps/pims-sync/.env.example apps/pims-sync/.env
```

### Step 2: Configure Required Variables

Edit `apps/pims-sync/.env`:

```env
# ============================================
# REQUIRED - Supabase Configuration
# ============================================

# Your Supabase project URL
SUPABASE_URL=https://your-project-ref.supabase.co

# Service role key (bypasses RLS - keep secret!)
# Found in: Supabase Dashboard > Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# ============================================
# REQUIRED - Security
# ============================================

# AES-256 encryption key for PIMS credentials (minimum 32 characters)
# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=your-32-character-encryption-key-here

# ============================================
# OPTIONAL - Server Configuration
# ============================================

# Server port (default: 3001)
PORT=3001

# Server host (default: 0.0.0.0)
HOST=0.0.0.0

# Environment (development | production)
NODE_ENV=development

# ============================================
# OPTIONAL - Browser Automation
# ============================================

# Show browser window during sync (default: true = hidden)
# Set to 'false' for debugging to see the browser
HEADLESS=true

# ============================================
# OPTIONAL - Scheduler
# ============================================

# Enable per-clinic cron scheduler (default: true)
ENABLE_SCHEDULER=true

# ============================================
# OPTIONAL - Timeouts
# ============================================

# Sync operation timeout in milliseconds (default: 300000 = 5 min)
SYNC_TIMEOUT_MS=300000
```

### Step 3: Generate an Encryption Key

```bash
# Generate a secure 32-character key
openssl rand -base64 32

# Example output: K7gN+xR2mQ9pL3wF8vB5tY6hJ4dM0cS1aZ8eI2nU7kA=
# Copy this to your ENCRYPTION_KEY
```

---

## Database Setup

The service requires several database tables. Run these migrations if they don't exist.

### Required Tables

#### 1. Clinic API Keys

```sql
-- API key authentication for sync endpoints
CREATE TABLE IF NOT EXISTS clinic_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  name TEXT NOT NULL DEFAULT 'default',
  key_prefix TEXT NOT NULL,          -- First 8 chars for fast lookup
  key_hash TEXT NOT NULL,            -- SHA256 hash of full key
  permissions TEXT[] DEFAULT NULL,   -- NULL = full access
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast key lookup
CREATE INDEX idx_clinic_api_keys_prefix ON clinic_api_keys(key_prefix);
CREATE INDEX idx_clinic_api_keys_clinic ON clinic_api_keys(clinic_id);
```

#### 2. PIMS Credentials

```sql
-- Encrypted PIMS credentials storage
CREATE TABLE IF NOT EXISTS pims_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) UNIQUE,
  provider_type TEXT NOT NULL DEFAULT 'idexx',
  encrypted_data TEXT NOT NULL,      -- AES-256-GCM encrypted JSON
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. Case Sync Audits

```sql
-- Audit trail for sync operations
CREATE TABLE IF NOT EXISTS case_sync_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('inbound', 'cases', 'reconciliation', 'full')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  appointments_found INTEGER DEFAULT 0,
  cases_created INTEGER DEFAULT 0,
  cases_updated INTEGER DEFAULT 0,
  cases_enriched INTEGER DEFAULT 0,
  cases_deleted INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_case_sync_audits_clinic ON case_sync_audits(clinic_id);
CREATE INDEX idx_case_sync_audits_type ON case_sync_audits(sync_type);
```

#### 4. Clinic Schedule Configs (for Scheduler)

```sql
-- Per-clinic sync schedules
ALTER TABLE clinic_schedule_configs
ADD COLUMN IF NOT EXISTS sync_schedules JSONB DEFAULT '[]'::jsonb;

-- Example sync_schedules format:
-- [
--   {"type": "inbound", "cron": "0 6 * * *", "enabled": true},
--   {"type": "cases", "cron": "0 8,14,20 * * *", "enabled": true},
--   {"type": "reconciliation", "cron": "0 2 * * *", "enabled": true}
-- ]
```

### Setting Up an API Key

Generate and store an API key for a clinic:

```typescript
import crypto from "crypto";

// Generate a new API key
const apiKey = crypto.randomBytes(32).toString("hex");
const keyPrefix = apiKey.substring(0, 8);
const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

console.log(`API Key: ${apiKey}`); // Save this - shown only once!
console.log(`Prefix: ${keyPrefix}`);
console.log(`Hash: ${keyHash}`);
```

```sql
-- Insert the API key
INSERT INTO clinic_api_keys (clinic_id, key_prefix, key_hash, name)
VALUES (
  'your-clinic-uuid',
  'abcd1234',                          -- First 8 chars
  'sha256-hash-from-script',
  'production-key'
);
```

### Storing PIMS Credentials

Use the encryption utility to store IDEXX credentials:

```typescript
import { encrypt } from "@odis-ai/shared/crypto";

const credentials = {
  username: "clinic@example.com",
  password: "secure-password",
  practiceId: "practice-123",
};

const encryptedData = encrypt(
  JSON.stringify(credentials),
  process.env.ENCRYPTION_KEY,
);

// Store in database
await supabase.from("pims_credentials").upsert({
  clinic_id: "your-clinic-uuid",
  provider_type: "idexx",
  encrypted_data: encryptedData,
});
```

---

## Running the Service

### Development Mode

```bash
# Build and start with watch mode
nx serve pims-sync

# Or build first, then run
nx build pims-sync
pnpm --filter pims-sync start
```

### Visible Browser (Debugging)

```bash
# Show the browser window during sync
pnpm --filter pims-sync start:visible

# Or set environment variable
HEADLESS=false pnpm --filter pims-sync start
```

### Interactive CLI

```bash
# Launch the interactive CLI
pnpm --filter pims-sync cli
```

### Production Build

```bash
# Build for production
nx build pims-sync

# Output is in dist/apps/pims-sync/
ls dist/apps/pims-sync/
# main.js
# package.json
```

---

## Making Your First Request

### Health Check

```bash
# Verify the service is running
curl http://localhost:3001/health

# Response:
{
  "status": "healthy",
  "uptime": 123.456,
  "memory": {
    "heapUsed": 45678912,
    "heapTotal": 67890123
  },
  "version": "4.0.0"
}
```

### Readiness Check

```bash
# Verify database connection
curl http://localhost:3001/ready

# Response:
{
  "status": "ready",
  "database": "connected"
}
```

### Run Inbound Sync

```bash
# Sync appointments from PIMS to cases
curl -X POST http://localhost:3001/api/sync/inbound \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "startDate": "2026-01-17",
    "endDate": "2026-01-24"
  }'

# Response:
{
  "success": true,
  "syncId": "uuid",
  "stats": {
    "appointmentsFound": 25,
    "casesCreated": 18,
    "casesUpdated": 7,
    "casesSkipped": 0
  },
  "durationMs": 4532
}
```

### Run Full Sync Pipeline

```bash
# Run all three phases: inbound → cases → reconciliation
curl -X POST http://localhost:3001/api/sync/full \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "daysAhead": 7,
    "lookbackDays": 7
  }'

# Response:
{
  "success": true,
  "syncId": "uuid",
  "inboundResult": {
    "success": true,
    "stats": { "appointmentsFound": 25, "casesCreated": 18, "casesUpdated": 7 }
  },
  "casesResult": {
    "success": true,
    "stats": { "casesFound": 25, "casesEnriched": 22, "casesSkipped": 3 }
  },
  "reconciliationResult": {
    "success": true,
    "stats": { "casesChecked": 120, "casesDeleted": 3 }
  },
  "durationMs": 12456
}
```

---

## Using the CLI

The interactive CLI provides comprehensive monitoring and control.

### Launch CLI

```bash
pnpm --filter pims-sync cli
```

### Main Menu Options

```
┌─────────────────────────────────────────┐
│          PIMS SYNC CLI v3.0.0           │
├─────────────────────────────────────────┤
│  1. Run Sync (with progress)            │
│  2. View Sync Status                    │
│  3. View Sync History                   │
│  4. Live Health Monitor                 │
│  5. Scheduler Status                    │
│  6. Exit                                │
└─────────────────────────────────────────┘
```

### CLI Features

| Feature                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| **Multi-phase Progress** | Unicode progress bars for each sync phase      |
| **Live Processing Log**  | Scrolling feed of sync events (10-line buffer) |
| **Sync History**         | Detailed history with inline statistics        |
| **Health Monitor**       | Real-time memory, uptime, and sparkline trends |
| **Scheduler Status**     | View and manage per-clinic cron jobs           |

### Example: Running a Sync

```
? Select sync type: Full Sync
? Enter start date (YYYY-MM-DD): 2026-01-17
? Days ahead to sync: 7
? Lookback days for reconciliation: 7

Starting full sync...

Phase 1: Inbound Sync
████████████████████████████████░░░░░░░░ 80% | Fetching appointments...

Processing Log:
  ✓ Authenticated with IDEXX Neo
  ✓ Found 25 appointments
  ✓ Created 18 cases
  ✓ Updated 7 cases
  ⟳ Starting case enrichment...
```

---

## Development Workflow

### Project Structure

```
apps/pims-sync/
├── src/
│   ├── main.ts              # Express server entry point
│   ├── cli-runner.mjs       # Interactive CLI
│   ├── config/              # Environment validation
│   ├── routes/              # HTTP endpoints
│   ├── middleware/          # API key auth
│   ├── scheduler/           # Per-clinic cron jobs
│   └── services/            # Business logic
├── docs/                    # Documentation
├── Dockerfile               # Production container
├── railway.toml             # Railway deployment
└── project.json             # Nx configuration
```

### Nx Commands

```bash
# Build
nx build pims-sync

# Run dev server with watch
nx serve pims-sync

# Lint
nx lint pims-sync

# Type check
nx typecheck pims-sync

# Test
nx test pims-sync

# Docker build
nx docker:build pims-sync

# Run CLI
pnpm --filter pims-sync cli
```

### Key Files to Understand

| File                              | Purpose                           |
| --------------------------------- | --------------------------------- |
| `src/main.ts`                     | Server startup, graceful shutdown |
| `src/routes/sync.route.ts`        | Sync API endpoints                |
| `src/middleware/api-key-auth.ts`  | Authentication                    |
| `src/scheduler/sync-scheduler.ts` | Cron job management               |
| `src/config/index.ts`             | Zod env validation                |

### Related Libraries

| Library           | Path                       | Purpose                        |
| ----------------- | -------------------------- | ------------------------------ |
| Domain Sync       | `libs/domain/sync/`        | Business logic services        |
| IDEXX Integration | `libs/integrations/idexx/` | IDEXX provider implementation  |
| Data Access       | `libs/data-access/`        | Supabase clients, repositories |
| Shared Crypto     | `libs/shared/crypto/`      | Encryption utilities           |

---

## Troubleshooting

### Common Issues

#### "ENCRYPTION_KEY must be at least 32 characters"

```bash
# Generate a valid key
openssl rand -base64 32
# Use the output as your ENCRYPTION_KEY
```

#### "Invalid API key"

1. Verify the key exists in `clinic_api_keys` table
2. Check `is_active` is `true`
3. Check `expires_at` hasn't passed
4. Ensure you're using the full key, not just the prefix

#### Browser fails to launch

```bash
# Install Playwright browsers
npx playwright install chromium

# Or install all dependencies
npx playwright install-deps chromium
```

#### "Timeout waiting for IDEXX login"

1. Set `HEADLESS=false` to see the browser
2. Check IDEXX Neo credentials in `pims_credentials`
3. Verify the IDEXX service is available
4. Increase `SYNC_TIMEOUT_MS` if needed

#### Database connection errors

1. Verify `SUPABASE_URL` is correct
2. Check `SUPABASE_SERVICE_ROLE_KEY` is valid
3. Ensure your IP is allowed (if using IP restrictions)

### Debug Mode

```bash
# Enable verbose logging
NODE_ENV=development HEADLESS=false pnpm --filter pims-sync start

# View browser during sync
HEADLESS=false pnpm --filter pims-sync start:visible
```

### Getting Help

- **Logs**: Check console output for detailed error messages
- **Audit Trail**: Query `case_sync_audits` for sync history
- **Health Endpoint**: `GET /health` for service status
- **Documentation**: See `apps/pims-sync/docs/` for detailed guides

---

## Next Steps

1. **[Workflows Guide](./WORKFLOWS.md)** - Understand the sync pipeline in detail
2. **[Railway Deployment](./RAILWAY_DEPLOYMENT.md)** - Deploy to production
3. **[API Reference](./PIMS_SYNC_API.md)** - Complete endpoint documentation
4. **[Architecture](./PIMS_SYNC_ARCHITECTURE.md)** - System design deep-dive

---

**Version**: 4.0.0
**Last Updated**: 2026-01-17

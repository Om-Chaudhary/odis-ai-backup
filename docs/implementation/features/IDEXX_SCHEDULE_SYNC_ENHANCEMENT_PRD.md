⏺ IDEXX Schedule Sync Enhancement with Automated Reconciliation

Product Requirements Document

Version 2.0 | November 29, 2024

| Field            | Value                            |
| ---------------- | -------------------------------- |
| Document Version | 2.0                              |
| Date             | November 29, 2024                |
| Author           | Engineering Team                 |
| Status           | Updated with Automation Strategy |

---

1. Executive Summary

1.1 Purpose

This PRD defines a comprehensive enhancement to the IDEXX Neo schedule sync system that solves the "stale consultation notes" problem through automated Playwright-based reconciliation. The system will autonomously sync clinical notes written after appointments,
eliminating manual intervention requirements.

1.2 Scope

In Scope:

- Automated notes reconciliation via Playwright
- Secure credential storage with AES-256 encryption
- Containerized cron-based sync automation
- Automatic discharge call scheduling post-appointment
- Multi-clinic support with isolated data
- Comprehensive audit logging for HIPAA compliance
- Monitoring dashboard for sync operations
- Chrome extension credential configuration UI

Out of Scope (Future Phases):

- VAPI booking integration (Phase 3)
- Full PIMS migration for Cornerstone/ezyVet (Phase 4)
- OAuth integration with IDEXX (requires partnership)

  1.3 Key Outcomes

- Zero-touch reconciliation: Clinical notes automatically synced every 4 hours
- Automated discharge calls: Scheduled immediately when appointments complete
- 95%+ sync success rate: Reliable autonomous operation
- Full audit trail: HIPAA-compliant logging of all operations
- Multi-clinic scalability: Support 100+ clinics with isolated data

---

2. Problem Statement

2.1 The Stale Data Problem

Current State:
graph LR
A[Night Before] -->|Sync Schedule| B[Cases Created]
B -->|No Notes| C[Appointment Day]
C -->|Vet Writes Notes| D[Notes in IDEXX]
D -->|Manual Sync Required| E[Notes in Supabase]
D -->|Often Forgotten| F[Stale Data Forever]

Future State with Automation:
graph LR
A[Night Before] -->|Sync Schedule| B[Cases Created]
B --> C[Appointment Day]
C -->|Vet Writes Notes| D[Notes in IDEXX]
D -->|Auto Sync Every 4hrs| E[Notes in Supabase]
E -->|Auto Schedule| F[Discharge Call in 2 Days]

2.2 Evidence from Production Data

garrybath@hotmail.com Analysis:

- Nov 16: 9 cases WITH SOAP notes (manually synced post-appointment)
- Nov 23-29: 252 cases with 0 SOAP notes (synced pre-appointment)
- Impact: 96.5% of cases missing critical clinical data
- consultation_id availability: 0.8% (2/252 cases)

  2.3 Root Cause Analysis

The IDEXX API architecture requires:

1. Session-based authentication (cookies, not API keys)
2. Separate endpoints for appointments vs consultations
3. Browser context for accessing consultation details
4. Manual trigger for reconciliation

Solution: Playwright automation with stored credentials eliminates all manual requirements.

---

3. Solution Architecture

3.1 High-Level Architecture

┌─────────────────────────────────────────────────────────┐
│ User Configuration Layer │
│ Chrome Extension | Web Dashboard | iOS App │
└────────────────────┬────────────────────────────────────┘
│
┌────────────────────▼────────────────────────────────────┐
│ API & Security Layer │
│ Credential Encryption | Authentication | RLS │
└────────────────────┬────────────────────────────────────┘
│
┌────────────────────▼────────────────────────────────────┐
│ Data Persistence Layer │
│ Supabase PostgreSQL with Encrypted Storage │
│ ┌──────────────────────────────────────────────────┐ │
│ │ idexx_credentials │ consultation_sync_status │ │
│ │ idexx_sync_sessions │ idexx_sync_audit_log │ │
│ │ cases (enhanced) │ scheduled_discharge_calls │ │
│ └──────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────┘
│
┌────────────────────▼────────────────────────────────────┐
│ Automation Orchestration Layer │
│ Railway Container (Playwright + Cron) │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Every 4 hours: │ │
│ │ 1. Decrypt credentials │ │
│ │ 2. Launch Playwright browser │ │
│ │ 3. Login to IDEXX Neo │ │
│ │ 4. Scrape consultations (last 48h) │ │
│ │ 5. Reconcile with database │ │
│ │ 6. Schedule discharge calls via QStash │ │
│ │ 7. Update audit logs │ │
│ └──────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────┘
│
┌────────────────────▼────────────────────────────────────┐
│ External Services │
│ IDEXX Neo | QStash | VAPI | PostHog │
└─────────────────────────────────────────────────────────┘

3.2 Data Flow Sequence

sequenceDiagram
participant Cron as Cron Job
participant PS as Playwright Service
participant DB as Supabase
participant IDEXX as IDEXX Neo
participant QS as QStash
participant VAPI as VAPI

      Cron->>PS: Trigger sync (every 4hrs)
      PS->>DB: Fetch enabled clinics
      loop For each clinic
          PS->>DB: Decrypt credentials
          PS->>IDEXX: Login with credentials
          PS->>IDEXX: Navigate to consultations
          PS->>IDEXX: Scrape last 48hrs data
          PS->>DB: Compare with existing cases
          alt Has new notes
              PS->>DB: Update case metadata
              PS->>QS: Schedule discharge call
              QS->>VAPI: Execute call (at scheduled time)
          end
          PS->>DB: Log sync session
      end

---

4. User Personas & Workflows

4.1 Enhanced Persona B: IDEXX Extension User (Automated)

Representative: garrybath@hotmail.com

Current Workflow (Manual):

1. Sync tomorrow's schedule (manual button click)
2. Cases created without notes
3. Complete appointments
4. Forget to sync notes ❌
5. Discharge calls never happen

New Workflow (Automated):

1. One-time credential setup ✅
2. Schedule syncs automatically every night
3. Complete appointments normally
4. Notes sync automatically within 4 hours ✅
5. Discharge calls scheduled automatically ✅
6. Dashboard shows sync status

4.2 Workflow Comparison Matrix

| Aspect          | iOS User             | IDEXX Manual   | IDEXX Automated |
| --------------- | -------------------- | -------------- | --------------- |
| Case Creation   | Auto from transcript | Manual sync    | Auto sync daily |
| Note Capture    | Real-time recording  | Manual resync  | Auto every 4hrs |
| Discharge Calls | Manual trigger       | Manual trigger | Auto scheduled  |
| User Effort     | Record & review      | Multiple syncs | One-time setup  |
| Data Freshness  | Immediate            | Often stale    | Max 4hrs delay  |

---

5. Detailed Requirements

5.1 Functional Requirements

FR-1: Automated Reconciliation System

| ID      | Requirement                                         | Priority |
| ------- | --------------------------------------------------- | -------- |
| FR-1.1  | Store encrypted IDEXX credentials with AES-256-GCM  | P0       |
| FR-1.2  | Validate credentials before storage                 | P0       |
| FR-1.3  | Automated login to IDEXX Neo via Playwright         | P0       |
| FR-1.4  | Scrape consultations from last 48 hours             | P0       |
| FR-1.5  | Match consultations to existing cases               | P0       |
| FR-1.6  | Update case metadata with clinical notes            | P0       |
| FR-1.7  | Detect session timeout and re-authenticate          | P0       |
| FR-1.8  | Schedule discharge calls for completed appointments | P0       |
| FR-1.9  | Run sync every 4 hours via cron                     | P0       |
| FR-1.10 | Support manual sync trigger from UI                 | P1       |

FR-2: Security & Compliance

| ID     | Requirement                                      | Priority |
| ------ | ------------------------------------------------ | -------- |
| FR-2.1 | Encrypt credentials at rest with AES-256-GCM     | P0       |
| FR-2.2 | Audit log all credential access                  | P0       |
| FR-2.3 | HIPAA-compliant data handling                    | P0       |
| FR-2.4 | RLS policies for multi-tenant isolation          | P0       |
| FR-2.5 | Credential rotation without service interruption | P1       |
| FR-2.6 | Emergency credential revocation                  | P1       |

FR-3: Monitoring & Operations

| ID     | Requirement                              | Priority |
| ------ | ---------------------------------------- | -------- |
| FR-3.1 | Dashboard showing sync status per clinic | P0       |
| FR-3.2 | Real-time sync progress indicators       | P1       |
| FR-3.3 | Error logs with screenshots              | P0       |
| FR-3.4 | Success rate metrics                     | P1       |
| FR-3.5 | Email alerts for failures                | P1       |
| FR-3.6 | PostHog event tracking                   | P2       |

5.2 Non-Functional Requirements

| ID    | Requirement                    | Target                      | Category    |
| ----- | ------------------------------ | --------------------------- | ----------- |
| NFR-1 | Sync completion time           | <5 min for 50 consultations | Performance |
| NFR-2 | System availability            | 99.9% uptime                | Reliability |
| NFR-3 | Concurrent clinic support      | 100+ clinics                | Scalability |
| NFR-4 | Credential encryption strength | AES-256-GCM                 | Security    |
| NFR-5 | Audit log retention            | 6 years (HIPAA)             | Compliance  |
| NFR-6 | Session recovery time          | <30 seconds                 | Resilience  |
| NFR-7 | Resource usage per clinic      | <512MB RAM, 0.5 CPU         | Efficiency  |

---

6. Technical Implementation

6.1 Database Schema

New Tables for Automation

-- 1. Encrypted IDEXX Credentials
CREATE TABLE idexx_credentials (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES users(id) ON DELETE CASCADE,
encrypted_username TEXT NOT NULL,
encrypted_password TEXT NOT NULL,
encryption_key_id TEXT NOT NULL,
last_validated_at TIMESTAMPTZ,
validation_status TEXT CHECK (validation_status IN ('valid', 'invalid', 'unknown')),
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now(),
UNIQUE(user_id)
);

-- 2. Sync Session Tracking
CREATE TABLE idexx_sync_sessions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES users(id) ON DELETE CASCADE,
clinic_id UUID REFERENCES clinics(id),
status TEXT CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
started_at TIMESTAMPTZ DEFAULT now(),
completed_at TIMESTAMPTZ,
consultations_synced INTEGER DEFAULT 0,
consultations_failed INTEGER DEFAULT 0,
discharge_calls_scheduled INTEGER DEFAULT 0,
error_details JSONB,
next_scheduled_sync TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Consultation Reconciliation Status
CREATE TABLE consultation_sync_status (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
consultation_id TEXT NOT NULL,
user_id UUID REFERENCES users(id) ON DELETE CASCADE,
case_id UUID REFERENCES cases(id),
sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'failed')),
has_clinical_notes BOOLEAN DEFAULT false,
notes_synced_at TIMESTAMPTZ,
discharge_call_scheduled BOOLEAN DEFAULT false,
discharge_call_id UUID REFERENCES scheduled_discharge_calls(id),
last_sync_attempt TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now(),
UNIQUE(consultation_id, user_id)
);

-- 4. Audit Log for Compliance
CREATE TABLE idexx_sync_audit_log (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
timestamp TIMESTAMPTZ DEFAULT now(),
user_id UUID REFERENCES users(id) ON DELETE CASCADE,
action TEXT NOT NULL,
status TEXT,
ip_address INET,
session_id TEXT,
error_details JSONB,
metadata JSONB
);

-- Enable RLS
ALTER TABLE idexx_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE idexx_sync_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE idexx_sync_audit_log ENABLE ROW LEVEL SECURITY;

6.2 Encryption Service

// src/lib/crypto/aes-encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export class AESEncryption {
private algorithm = 'aes-256-gcm';
private keyDerivation = 'pbkdf2';

    async encrypt(text: string, keyId: string): Promise<EncryptedData> {
      const key = await this.deriveKey(keyId);
      const iv = randomBytes(16);
      const cipher = createCipheriv(this.algorithm, key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        keyId
      };
    }

    async decrypt(data: EncryptedData): Promise<string> {
      const key = await this.deriveKey(data.keyId);
      const decipher = createDecipheriv(
        this.algorithm,
        key,
        Buffer.from(data.iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    }

    private async deriveKey(keyId: string): Promise<Buffer> {
      const secret = process.env[`ENCRYPTION_KEY_${keyId}`];
      if (!secret) throw new Error(`Key ${keyId} not found`);

      return pbkdf2Sync(secret, 'idexx-salt', 100000, 32, 'sha256');
    }

}

6.3 Playwright Sync Service

// src/lib/idexx/sync-service.ts
import { chromium, Browser, Page } from 'playwright';

export class IdexxSyncService {
private browser: Browser | null = null;

    async syncClinic(userId: string): Promise<SyncResult> {
      const session = await this.createSyncSession(userId);

      try {
        // 1. Retrieve and decrypt credentials
        const credentials = await this.credentialManager.retrieveCredentials(userId);

        // 2. Launch browser
        this.browser = await chromium.launch({
          headless: true,
          args: ['--disable-blink-features=AutomationControlled']
        });

        const page = await this.browser.newPage();

        // 3. Login to IDEXX
        await this.login(page, credentials);

        // 4. Scrape consultations
        const consultations = await this.scrapeConsultations(page);

        // 5. Reconcile with database
        const reconciled = await this.reconcileWithDatabase(consultations, userId);

        // 6. Schedule discharge calls
        const scheduled = await this.scheduleDiscargeCalls(reconciled);

        // 7. Update session
        await this.completeSyncSession(session.id, {
          consultations_synced: consultations.length,
          discharge_calls_scheduled: scheduled.length
        });

        return { success: true, synced: consultations.length };

      } catch (error) {
        await this.failSyncSession(session.id, error);
        throw error;

      } finally {
        await this.browser?.close();
      }
    }

    private async login(page: Page, credentials: Credentials) {
      await page.goto('https://neo.idexx.com/login');

      // Fill login form
      await page.fill('input[name="username"]', credentials.username);
      await page.fill('input[name="password"]', credentials.password);
      await page.click('button[type="submit"]');

      // Wait for dashboard
      await page.waitForURL('**/dashboard', { timeout: 30000 });

      // Verify login success
      const userMenu = await page.locator('[data-testid="user-menu"]');
      if (!await userMenu.isVisible()) {
        throw new Error('Login failed - user menu not found');
      }
    }

    private async scrapeConsultations(page: Page): Promise<Consultation[]> {
      await page.goto('https://neo.idexx.com/consultations');

      // Set date range to last 48 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);

      await page.fill('input[name="startDate"]', yesterday.toISOString().split('T')[0]);
      await page.click('button[data-testid="search"]');

      // Wait for results
      await page.waitForSelector('[data-testid="consultation-row"]');

      // Extract consultation data
      const consultations = await page.evaluate(() => {
        const rows = document.querySelectorAll('[data-testid="consultation-row"]');
        return Array.from(rows).map(row => ({
          id: row.getAttribute('data-consultation-id'),
          patientName: row.querySelector('.patient-name')?.textContent,
          date: row.querySelector('.consultation-date')?.textContent,
          hasNotes: row.querySelector('.notes-indicator')?.classList.contains('has-notes')
        }));
      });

      // Fetch detailed notes for each consultation
      for (const consultation of consultations) {
        if (consultation.hasNotes) {
          const notes = await this.fetchConsultationNotes(page, consultation.id);
          consultation.notes = notes;
        }
      }

      return consultations;
    }

    private async handleSessionTimeout(page: Page) {
      // Check for session timeout indicators
      const isTimedOut = await page.locator('.session-expired').isVisible();

      if (isTimedOut) {
        console.log('Session timeout detected, re-authenticating...');

        // Re-login
        const credentials = await this.credentialManager.retrieveCredentials(this.currentUserId);
        await this.login(page, credentials);

        return true;
      }

      return false;
    }

}

6.4 Cron Job Entry Point

// scripts/idexx-sync-cron.ts
import { IdexxSyncService } from '../src/lib/idexx/sync-service';
import { createServiceClient } from '../src/lib/supabase/server';

async function main() {
const supabase = await createServiceClient();
const syncService = new IdexxSyncService();

    // Get all enabled clinics
    const { data: enabledUsers } = await supabase
      .from('users')
      .select('id, clinic_name')
      .eq('idexx_sync_enabled', true);

    console.log(`Starting sync for ${enabledUsers?.length} clinics`);

    // Process clinics sequentially to avoid rate limits
    for (const user of enabledUsers || []) {
      try {
        console.log(`Syncing clinic: ${user.clinic_name}`);

        const result = await syncService.syncClinic(user.id);

        console.log(`✓ Synced ${result.synced} consultations for ${user.clinic_name}`);

        // Add delay between clinics
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        console.error(`✗ Failed to sync ${user.clinic_name}:`, error);

        // Log to audit table
        await supabase.from('idexx_sync_audit_log').insert({
          user_id: user.id,
          action: 'sync_failed',
          status: 'error',
          error_details: { message: error.message, stack: error.stack }
        });
      }
    }

    console.log('Sync complete');

}

// Run immediately
main().catch(console.error);

6.5 Docker Configuration

# docker/Dockerfile.idexx-sync

FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Install cron

RUN apt-get update && apt-get install -y cron

# Set working directory

WORKDIR /app

# Install dependencies

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy application code

COPY . .

# Build TypeScript

RUN pnpm build

# Setup cron job (every 4 hours)

RUN echo "0 _/4 _ \* \* node /app/scripts/idexx-sync-cron.js >> /var/log/cron.log 2>&1" > /etc/cron.d/idexx-sync
RUN chmod 0644 /etc/cron.d/idexx-sync
RUN crontab /etc/cron.d/idexx-sync

# Create log file

RUN touch /var/log/cron.log

# Health check

HEALTHCHECK --interval=5m --timeout=3s \
 CMD curl -f http://localhost:3001/health || exit 1

# Start cron and tail logs

CMD cron && tail -f /var/log/cron.log

---

7. API Specifications

7.1 Credential Management APIs

POST /api/idexx/configure-credentials

interface Request {
username: string;
password: string;
}

interface Response {
success: boolean;
validationStatus: 'valid' | 'invalid' | 'unknown';
lastValidated: string;
}

GET /api/idexx/sync-status

interface Response {
lastSync: {
timestamp: string;
status: 'completed' | 'failed' | 'running';
consultationsSynced: number;
dischargeCallsScheduled: number;
};
nextScheduledSync: string;
syncEnabled: boolean;
credentialStatus: 'valid' | 'invalid' | 'not_configured';
}

POST /api/idexx/trigger-sync

interface Request {
dateRange?: {
start: string; // ISO date
end: string; // ISO date
};
}

interface Response {
syncId: string;
status: 'started' | 'queued';
estimatedCompletion: string;
}

7.2 Monitoring APIs

GET /api/admin/idexx-sync/metrics

interface Response {
totalClinics: number;
enabledClinics: number;
successRate: number; // percentage
averageSyncTime: number; // seconds
last24Hours: {
syncs: number;
failures: number;
consultationsSynced: number;
dischargeCallsScheduled: number;
};
errorLog: Array<{
timestamp: string;
clinic: string;
error: string;
}>;
}

---

8. Security & Compliance

8.1 Security Architecture

┌─────────────────────────────────────────────────────────┐
│ Security Layers │
├─────────────────────────────────────────────────────────┤
│ Layer 1: Transport Security │
│ - HTTPS/TLS 1.3 for all API calls │
│ - Certificate pinning for IDEXX connections │
├─────────────────────────────────────────────────────────┤
│ Layer 2: Authentication & Authorization │
│ - Supabase Auth for user authentication │
│ - RLS policies for data isolation │
│ - Service role for automated operations │
├─────────────────────────────────────────────────────────┤
│ Layer 3: Credential Encryption │
│ - AES-256-GCM encryption at rest │
│ - PBKDF2 key derivation │
│ - Separate encryption keys per environment │
├─────────────────────────────────────────────────────────┤
│ Layer 4: Audit & Compliance │
│ - Comprehensive audit logging │
│ - 6-year retention (HIPAA requirement) │
│ - Tamper-proof audit trail │
└─────────────────────────────────────────────────────────┘

8.2 HIPAA Compliance Checklist

- Encryption: AES-256 for data at rest and in transit
- Access Control: RLS policies enforce user isolation
- Audit Logs: All access logged with timestamp and user
- Data Retention: 6-year retention policy
- Breach Notification: Alert system for unauthorized access
- Business Associate Agreement: Required with IDEXX

  8.3 Credential Lifecycle Management

stateDiagram-v2
[*] --> NotConfigured
NotConfigured --> Configured: Store Credentials
Configured --> Validated: Test Login Success
Validated --> Active: Enable Sync
Active --> Refreshed: Rotate Credentials
Active --> Suspended: Validation Failure
Suspended --> Active: Re-validate
Active --> Revoked: User Action
Revoked --> [*]

---

9. Rollout Plan

9.1 Phase 1: Foundation (Week 1-2)

- Database schema creation
- Encryption service implementation
- Credential management APIs
- Unit tests for encryption

  9.2 Phase 2: Automation Core (Week 3-4)

- Playwright sync service
- Consultation scraping logic
- Reconciliation engine
- Discharge call scheduling

  9.3 Phase 3: Infrastructure (Week 5-6)

- Docker containerization
- Railway deployment
- Cron job configuration
- Health monitoring

  9.4 Phase 4: User Experience (Week 7-8)

- Chrome extension credential UI
- Monitoring dashboard
- Manual sync triggers
- Error notifications

  9.5 Phase 5: Production Rollout (Week 9-10)

- Beta test with 5 clinics
- Performance optimization
- Full production deployment
- Documentation and training

---

10. Success Metrics

    10.1 Primary KPIs

| Metric              | Target | Current   | Measurement                              |
| ------------------- | ------ | --------- | ---------------------------------------- |
| Sync Success Rate   | >95%   | N/A       | successful_syncs / total_syncs           |
| Notes Completeness  | >90%   | 3.5%      | cases_with_notes / total_cases           |
| Discharge Call Rate | >80%   | <5%       | calls_scheduled / completed_appointments |
| Sync Latency        | <4 hrs | 24-48 hrs | time_to_sync after appointment           |
| User Adoption       | >75%   | 0%        | enabled_users / total_idexx_users        |

10.2 Operational Metrics

- Mean Time Between Failures (MTBF): >7 days
- Mean Time To Recovery (MTTR): <30 minutes
- Resource Utilization: <50% CPU, <1GB RAM per clinic
- Cost per Clinic: <$0.50/month

  10.3 User Satisfaction

- Setup Complexity: <5 minutes to configure
- Manual Intervention Required: 0 after setup
- Support Tickets: <1 per clinic per month

---

11. Risk Analysis

    11.1 Risk Matrix

| Risk              | Probability | Impact   | Mitigation Strategy                                            |
| ----------------- | ----------- | -------- | -------------------------------------------------------------- |
| IDEXX UI Changes  | Medium      | High     | Robust selectors, visual regression testing, fallback patterns |
| Session Timeout   | High        | Low      | Automatic re-authentication, session refresh every 30 min      |
| Credential Breach | Low         | Critical | AES-256 encryption, key rotation, audit logging, breach alerts |
| Rate Limiting     | Medium      | Medium   | Request throttling, exponential backoff, staggered syncs       |
| Railway Downtime  | Low         | High     | Multi-region deployment, automatic failover, local queue       |
| Playwright Bugs   | Low         | Medium   | Version pinning, comprehensive testing, gradual rollout        |

11.2 Mitigation Details

IDEXX UI Change Detection

// Implement multiple selector strategies
const selectors = {
primary: '[data-testid="consultation-row"]',
fallback1: '.consultation-item',
fallback2: 'tr[class*="consultation"]'
};

// Visual regression testing
await page.screenshot({ path: 'idexx-consultation-page.png' });
const similarity = await compareImages(baseline, current);
if (similarity < 0.95) {
await notifyAdmin('IDEXX UI change detected');
}

Session Management

class SessionManager {
private sessionRefreshInterval = 25 _ 60 _ 1000; // 25 minutes

    async maintainSession(page: Page) {
      setInterval(async () => {
        // Keep session alive
        await page.goto('https://neo.idexx.com/api/heartbeat');
      }, this.sessionRefreshInterval);
    }

    async detectTimeout(page: Page): Promise<boolean> {
      return await page.locator('.session-expired, .login-required').isVisible();
    }

}

---

12. Future Enhancements

    12.1 Phase 2: Advanced Automation (Q1 2025)

- Intelligent Scheduling: ML-based optimal sync times
- Predictive Retry: Anticipate failures and pre-retry
- Multi-browser Support: Firefox/Safari for resilience
- Distributed Syncing: Parallel processing for scale

  12.2 Phase 3: VAPI Integration (Q2 2025)

- Available Slots Sync: Real-time appointment availability
- Booking Confirmation: Auto-confirm VAPI bookings
- Waitlist Management: Fill cancellations automatically
- Multi-provider Scheduling: Complex availability rules

  12.3 Phase 4: Multi-PIMS Support (Q3 2025)

- Cornerstone Integration: Adapter for Cornerstone API
- ezyVet Support: Native ezyVet sync
- AVImark Compatibility: Legacy system support
- Universal Adapter: Plugin architecture for any PIMS

  12.4 Phase 5: AI Enhancement (Q4 2025)

- Smart Note Extraction: GPT-4 powered note parsing
- Anomaly Detection: Identify unusual patterns
- Predictive Scheduling: AI-driven call timing
- Natural Language Queries: "Show me all post-surgery cases"

---

13. Technical Specifications

    13.1 Infrastructure Requirements

| Component  | Specification    | Justification                  |
| ---------- | ---------------- | ------------------------------ |
| Container  | 2 vCPU, 4GB RAM  | Playwright browser overhead    |
| Storage    | 20GB SSD         | Browser cache and screenshots  |
| Network    | 100 Mbps         | Multiple concurrent page loads |
| Database   | 100GB, 1000 IOPS | Audit logs and sync data       |
| Monitoring | 1GB/month logs   | Comprehensive debugging        |

13.2 Performance Benchmarks

Sync Operations:
Login Time: < 5 seconds
Page Load: < 3 seconds per page
Consultation Scrape: < 100ms per item
Database Update: < 50ms per record
Total Sync Time: < 5 minutes for 50 consultations

Resource Usage:
CPU: < 50% average, < 80% peak
Memory: < 1GB per browser instance
Network: < 10 MB per sync
Disk I/O: < 100 IOPS average

13.3 Monitoring & Alerting

// PostHog Events
interface SyncEvents {
'sync.started': { userId: string; clinicName: string };
'sync.completed': { userId: string; consultations: number; duration: number };
'sync.failed': { userId: string; error: string; step: string };
'discharge.scheduled': { consultationId: string; scheduledFor: Date };
'credential.validated': { userId: string; status: 'valid' | 'invalid' };
}

// Alert Thresholds
const alerts = {
syncFailureRate: 0.1, // Alert if >10% failures
syncDuration: 600, // Alert if >10 minutes
consecutiveFailures: 3, // Alert after 3 failures
noSyncIn: 24 _ 60 _ 60, // Alert if no sync in 24 hours
};

---

14. Documentation

    14.1 User Documentation

- Setup Guide: Step-by-step credential configuration
- Troubleshooting: Common issues and solutions
- FAQ: Frequently asked questions
- Video Tutorial: 5-minute setup walkthrough

  14.2 Developer Documentation

- API Reference: Complete endpoint documentation
- Database Schema: Entity relationship diagrams
- Deployment Guide: Infrastructure setup
- Contributing Guide: Development workflow

  14.3 Operational Documentation

- Runbook: Incident response procedures
- Monitoring Guide: Dashboard interpretation
- Maintenance Schedule: Planned downtime
- Disaster Recovery: Backup and restore procedures

---

15. Appendix

    15.1 Glossary

| Term           | Definition                                           |
| -------------- | ---------------------------------------------------- |
| PIMS           | Practice Information Management System               |
| IDEXX Neo      | Cloud-based veterinary practice management software  |
| Reconciliation | Process of syncing missing consultation notes        |
| Playwright     | Browser automation framework for web scraping        |
| RLS            | Row-Level Security in PostgreSQL                     |
| QStash         | Serverless queue for delayed task execution          |
| VAPI           | Voice AI platform for automated phone calls          |
| Consultation   | Completed veterinary appointment with clinical notes |

15.2 Document History

| Version | Date       | Author           | Changes                     |
| ------- | ---------- | ---------------- | --------------------------- |
| 1.0     | 2024-11-29 | Taylor Allen     | Initial PRD                 |
| 2.0     | 2024-11-29 | Engineering Team | Added Playwright automation |

15.3 References

- https://playwright.dev
- https://supabase.com/docs/guides/auth/row-level-security
- https://www.hhs.gov/hipaa
- https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197.pdf

---

16. Approval & Sign-off

| Role               | Name | Date | Signature |
| ------------------ | ---- | ---- | --------- |
| Product Owner      |      |      |           |
| Engineering Lead   |      |      |           |
| Security Officer   |      |      |           |
| Compliance Officer |      |      |           |

---

End of Document

This comprehensive PRD now includes the complete Playwright automation strategy, making the IDEXX schedule sync fully autonomous while maintaining security, compliance, and scalability for 100+ clinics.

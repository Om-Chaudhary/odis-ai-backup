# Slack Daily Checklist Bot - Next Steps

## Overview

This document outlines the steps required to deploy and operationalize the Slack Daily Checklist Bot feature implemented in PR #85.

**PR:** https://github.com/Odis-AI/odis-ai-web/pull/85
**Branch:** `feat/slack-checklist-bot`
**Status:** Implementation complete, pending deployment

---

## 1. Environment Setup

### Required Environment Variables

Add these to your `.env` files (local, staging, production):

```bash
# Slack App Credentials (from https://api.slack.com/apps)
SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret
SLACK_SIGNING_SECRET=your_signing_secret
```

**Where to find these:**

1. Go to https://api.slack.com/apps
2. Select your app (or create one)
3. **Client ID & Secret:** "Basic Information" → "App Credentials"
4. **Signing Secret:** "Basic Information" → "App Credentials" → "Signing Secret"

### Update Environment Validation

The environment variables should be added to `libs/env/src/index.ts`:

```typescript
// Slack (optional - only required if using Slack bot)
SLACK_CLIENT_ID: z.string().optional(),
SLACK_CLIENT_SECRET: z.string().optional(),
SLACK_SIGNING_SECRET: z.string().optional(),
```

---

## 2. Slack App Configuration

### Create/Configure Slack App

1. **Go to:** https://api.slack.com/apps
2. **Create New App** → "From scratch"
3. **App Name:** "ODIS Daily Checklist" (or your preferred name)
4. **Workspace:** Select your development workspace

### OAuth & Permissions

**Bot Token Scopes** (add all):

- `channels:read` - Read channel info
- `chat:write` - Post messages
- `commands` - Handle slash commands
- `users:read` - Read user info for completion attribution

**Redirect URLs:**

```
https://your-domain.com/api/slack/oauth/callback
```

For local development:

```
https://your-ngrok-domain.ngrok.io/api/slack/oauth/callback
```

### Slash Commands

Create the `/checklist` command:

| Field             | Value                                                 |
| ----------------- | ----------------------------------------------------- |
| Command           | `/checklist`                                          |
| Request URL       | `https://your-domain.com/api/slack/webhooks/commands` |
| Short Description | Manage daily checklist tasks                          |
| Usage Hint        | `[add \| list \| status \| delete \| help]`           |

### Interactivity & Shortcuts

Enable interactivity and set:

| Field       | Value                                                     |
| ----------- | --------------------------------------------------------- |
| Request URL | `https://your-domain.com/api/slack/webhooks/interactions` |

### Event Subscriptions (Optional)

If you want real-time events (not required for MVP):

| Field       | Value                                               |
| ----------- | --------------------------------------------------- |
| Request URL | `https://your-domain.com/api/slack/webhooks/events` |

**Subscribe to bot events:**

- `app_home_opened` (for app home tab)
- `member_joined_channel` (auto-welcome)

### Distribution

If distributing to multiple workspaces:

1. Go to "Manage Distribution"
2. Complete the checklist
3. Enable "Distribute App"

---

## 3. Database Migration

### Apply the Migration

The migration file is at:

```
supabase/migrations/20251214000000_create_slack_tables.sql
```

**To apply:**

```bash
# Using Supabase CLI
npx supabase db push

# Or via MCP tool
# Use mcp__supabase__apply_migration
```

**Tables created:**

- `slack_workspaces` - Workspace installations with encrypted bot tokens
- `slack_reminder_channels` - Channels subscribed to reminders
- `slack_tasks` - Recurring task definitions
- `slack_task_completions` - Daily completion tracking

### Verify Migration

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'slack_%';

-- Should return:
-- slack_workspaces
-- slack_reminder_channels
-- slack_tasks
-- slack_task_completions
```

---

## 4. QStash Cron Setup

### Create the Cron Schedule

The daily reminder system needs a QStash cron job that runs every 15 minutes to check for tasks that need to be posted.

**Endpoint:** `POST /api/slack/cron/daily-reminders`

**Schedule:** Every 15 minutes (`*/15 * * * *`)

**Setup via QStash Dashboard:**

1. Go to https://console.upstash.com/qstash
2. Create new schedule:
   - **Destination:** `https://your-domain.com/api/slack/cron/daily-reminders`
   - **Schedule:** `*/15 * * * *`
   - **Method:** POST

**Or programmatically:**

```typescript
import { Client } from "@upstash/qstash";

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

await qstash.schedules.create({
  destination: "https://your-domain.com/api/slack/cron/daily-reminders",
  cron: "*/15 * * * *",
});
```

### How It Works

The cron job:

1. Queries `slack_reminder_channels` for channels with tasks due in the current 15-min window
2. For each channel, fetches active tasks from `slack_tasks`
3. Posts reminder messages with completion buttons
4. Records message timestamps for later updates

---

## 5. Testing Checklist

### Local Development Testing

1. **Tunnel Setup:**

   ```bash
   ngrok http 3000
   ```

   Update Slack app URLs with ngrok domain

2. **OAuth Flow:**
   - Visit `/api/slack/oauth/install`
   - Complete OAuth flow
   - Verify workspace appears in `slack_workspaces` table

3. **Slash Commands:**

   ```
   /checklist help
   /checklist add 09:00 Sync the schedule
   /checklist list
   /checklist status
   /checklist delete
   ```

4. **Interactive Components:**
   - Click "Mark Complete" button
   - Verify message updates with completion info
   - Verify `slack_task_completions` record created

5. **Cron Trigger:**
   ```bash
   curl -X POST http://localhost:3000/api/slack/cron/daily-reminders \
     -H "Content-Type: application/json"
   ```

### Integration Test Scenarios

| Scenario           | Steps                            | Expected Result                        |
| ------------------ | -------------------------------- | -------------------------------------- |
| Fresh install      | Complete OAuth                   | Workspace created, token encrypted     |
| Add task           | `/checklist add 09:00 Task name` | Task in DB, confirmation message       |
| Complete task      | Click "Mark Complete"            | Completion recorded, message updated   |
| Duplicate complete | Click button twice               | Second click shows "already completed" |
| Daily status       | `/checklist status`              | Shows today's completion summary       |
| Cron trigger       | POST to cron endpoint            | Messages posted to due channels        |

---

## 6. Production Readiness Checklist

### Before Go-Live

- [ ] Environment variables set in production
- [ ] Database migration applied to production
- [ ] Slack app configured with production URLs
- [ ] QStash cron schedule created for production
- [ ] OAuth redirect URL updated for production domain
- [ ] SSL/TLS configured (required by Slack)

### Security Verification

- [ ] SLACK_SIGNING_SECRET is set and verified
- [ ] Bot tokens are encrypted in database (AES-256-GCM)
- [ ] OAuth state tokens use HTTP-only cookies
- [ ] Webhook signature verification is working
- [ ] Service client (RLS bypass) only used in webhooks

### Monitoring Setup

- [ ] Error logging configured (console.error statements exist)
- [ ] Consider adding PostHog events for:
  - Workspace installations
  - Command usage
  - Task completions
  - Cron job executions

---

## 7. Known Limitations & Future Work

### Current Limitations

1. **Timezone Handling:** All times stored as UTC. Tasks post at the specified time in UTC, not local timezone.

2. **No Unit Tests:** Phase 6 (testing) was not implemented. Should add:
   - `libs/slack/src/__tests__/client.test.ts`
   - `libs/slack/src/__tests__/commands.test.ts`
   - `libs/slack/src/__tests__/validators.test.ts`
   - `libs/slack/src/__tests__/signature.test.ts`

3. **No Rate Limiting:** Webhook endpoints don't have rate limiting beyond Slack's built-in retries.

4. **No Retry Logic:** If Slack API call fails, no automatic retry mechanism.

### Recommended Enhancements

#### Priority 1: Testing

```typescript
// Example test structure
describe("handleAdd command", () => {
  it("creates task with valid time format", async () => {
    // Test implementation
  });

  it("rejects invalid time format", async () => {
    // Test implementation
  });
});
```

#### Priority 2: Timezone Support

```sql
-- Add timezone to channels table (already exists but unused)
ALTER TABLE slack_reminder_channels
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';
```

Update scheduler to convert times:

```typescript
import { zonedTimeToUtc } from "date-fns-tz";
const channelTime = zonedTimeToUtc(taskTime, channel.timezone);
```

#### Priority 3: Observability

```typescript
// Add PostHog tracking
posthog.capture("slack_task_completed", {
  workspaceId: team.id,
  taskId: task.id,
  completedBy: user.id,
});
```

#### Priority 4: Rate Limiting

```typescript
// Add rate limiting middleware
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

---

## 8. SMS Extensibility Architecture

The system was designed with multi-channel extensibility in mind. Here's the recommended approach for adding SMS:

### Interface Pattern

```typescript
// libs/notifications/src/notification-adapter.interface.ts
export interface INotificationAdapter {
  send(input: NotificationInput): Promise<NotificationResult>;
  getChannelType(): "slack" | "sms" | "email";
}

export interface NotificationInput {
  recipientId: string;
  message: string;
  metadata?: Record<string, unknown>;
}
```

### Implementation Steps

1. **Create `libs/notifications/`** - Abstract notification routing
2. **Create SMS adapter** - Twilio or AWS SNS integration
3. **Add `notification_preferences` table** - User channel preferences
4. **Create `NotificationRouter`** - Routes to appropriate adapter

### Database Schema Addition

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  channel_type TEXT NOT NULL, -- 'slack', 'sms', 'email'
  channel_identifier TEXT NOT NULL, -- Slack user ID, phone number, email
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, channel_type)
);
```

---

## 9. Quick Reference

### API Endpoints

| Endpoint                           | Method | Purpose                      |
| ---------------------------------- | ------ | ---------------------------- |
| `/api/slack/oauth/install`         | GET    | Initiate OAuth installation  |
| `/api/slack/oauth/callback`        | GET    | Handle OAuth callback        |
| `/api/slack/webhooks/commands`     | POST   | Handle slash commands        |
| `/api/slack/webhooks/interactions` | POST   | Handle button clicks, modals |
| `/api/slack/cron/daily-reminders`  | POST   | QStash cron trigger          |

### Slash Commands

| Command                         | Description               |
| ------------------------------- | ------------------------- |
| `/checklist help`               | Show available commands   |
| `/checklist add <time> <title>` | Add recurring task        |
| `/checklist list`               | Show all tasks            |
| `/checklist status`             | Today's completion status |
| `/checklist delete`             | Delete a task (modal)     |

### Database Tables

| Table                     | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `slack_workspaces`        | Installed workspaces with encrypted tokens |
| `slack_reminder_channels` | Channels receiving reminders               |
| `slack_tasks`             | Recurring task definitions                 |
| `slack_task_completions`  | Daily completion records                   |

---

## 10. Support & Troubleshooting

### Common Issues

**"Invalid signature" errors:**

- Verify `SLACK_SIGNING_SECRET` matches your Slack app
- Check timestamp isn't too old (>2 min)
- Ensure raw body is passed to verification (not parsed JSON)

**OAuth fails:**

- Verify redirect URL matches exactly in Slack app config
- Check `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET`
- Ensure cookies are enabled for state token

**Tasks not posting:**

- Verify QStash cron is running
- Check `slack_tasks.is_active` is true
- Verify `slack_reminder_channels.is_active` is true
- Check reminder_time matches current time window

**Bot can't post to channel:**

- Ensure bot is invited to the channel
- Verify `chat:write` scope is granted
- Check bot token is valid and not revoked

### Logs to Check

```typescript
// Search for these log prefixes
[SLACK_OAUTH] - OAuth flow logs
[SLACK_WEBHOOK] - Webhook processing logs
[SLACK_INIT] - Token resolver logs
[SLACK_CRON] - Cron job logs
```

---

## Changelog

| Date       | Change                                   |
| ---------- | ---------------------------------------- |
| 2024-12-14 | Initial implementation complete (PR #85) |

# Slack Appointment Notifications for Alum Rock

## Overview

When an appointment is successfully booked through the Alum Rock After-Hours Inbound VAPI assistant (ID: `ae3e6a54-17a3-4915-9c3e-48779b5dbf09`), the system automatically sends a notification to the #alum-rock Slack channel with the appointment details.

## Implementation

The notification logic is implemented in:

- `libs/integrations/vapi/src/webhooks/handlers/end-of-call-report.ts:406-527`

The webhook handler:

1. Receives the end-of-call-report from VAPI
2. Checks if the call was from the Alum Rock assistant
3. Queries the `vapi_bookings` table for any appointment created during the call
4. If a booking exists, sends a formatted Slack message to #alum-rock channel

## Configuration Requirements

### 1. Slack App Setup

You need to create and configure a Slack app with the following:

**Required Scopes:**

- `chat:write` - Send messages to channels
- `chat:write.public` - Send messages to public channels without joining

**Steps:**

1. Go to https://api.slack.com/apps
2. Create a new app or select existing app
3. Navigate to "OAuth & Permissions"
4. Add the required Bot Token Scopes
5. Install the app to your workspace
6. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### 2. Get Your Slack Team ID

**Option A: From Slack Web App**

1. Open Slack in your web browser
2. Look at the URL: `https://app.slack.com/client/{TEAM_ID}/...`
3. Copy the TEAM_ID value

**Option B: Using Slack API**

```bash
curl -H "Authorization: Bearer YOUR_BOT_TOKEN" \
  https://slack.com/api/team.info
```

### 3. Get the #alum-rock Channel ID

**Option A: From Slack Web App**

1. Open the #alum-rock channel
2. Click the channel name at the top
3. Scroll down to find "Channel ID"

**Option B: Using Slack API**

```bash
curl -H "Authorization: Bearer YOUR_BOT_TOKEN" \
  "https://slack.com/api/conversations.list?types=public_channel"
```

### 4. Database Setup

Create the `slack_installations` table if it doesn't exist:

```sql
CREATE TABLE IF NOT EXISTS slack_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text UNIQUE NOT NULL,
  team_name text,
  bot_token text NOT NULL,  -- Encrypted bot token
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE slack_installations ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admin only access"
  ON slack_installations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

### 5. Store Slack Credentials

Insert your Slack workspace credentials into the database:

```sql
INSERT INTO slack_installations (team_id, team_name, bot_token)
VALUES (
  'YOUR_TEAM_ID',
  'Alum Rock Workspace',
  'YOUR_BOT_TOKEN'  -- Note: Should be encrypted in production
);
```

### 6. Environment Variables

Add to your `.env` file:

```bash
# Alum Rock Slack Configuration
ALUM_ROCK_SLACK_TEAM_ID=T12345678  # Your Slack Team ID
ALUM_ROCK_SLACK_CHANNEL=alum-rock  # Channel name (without #)
```

## Testing

### Test Script

Run the test script to verify Slack integration:

```bash
cd apps/web
export ALUM_ROCK_SLACK_TEAM_ID=T12345678
export ALUM_ROCK_SLACK_CHANNEL=alum-rock
npx tsx test-slack-notification.ts
```

### Expected Output

```
Testing Slack notification to #alum-rock...
Sending test message to channel: alum-rock
Team ID: T12345678
✅ Slack notification sent successfully!
   Channel: C12345678
   Message TS: 1704391234.123456
```

### Message Format

The notification includes:

- 🎉 Header
- Client Name
- Pet Name
- Date (YYYY-MM-DD)
- Time (HH:MM:SS)
- Phone Number
- Reason for visit
- Species (if provided)
- Breed (if provided)
- New Client indicator (if applicable)
- Booking ID (for reference)

Example:

```
🎉 *New Appointment Booked*

*Client Name:* John Smith
*Pet Name:* Max
*Date:* 2026-01-15
*Time:* 14:30:00
*Phone:* +14081234567
*Reason:* Annual checkup
*Species:* Dog
*Breed:* Golden Retriever

_Booking ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890_
```

## Troubleshooting

### "Failed to send Slack notification"

1. **Check bot token:** Verify the token is correct and hasn't expired
2. **Check permissions:** Ensure the bot has `chat:write` and `chat:write.public` scopes
3. **Check channel:** Verify the channel name or ID is correct
4. **Check bot membership:** For private channels, the bot must be invited first

### "No bot token found for workspace"

1. Verify `slack_installations` table exists
2. Check that Team ID in environment matches database
3. Ensure bot_token is stored in database

### "Channel not found"

1. Verify channel name is correct (without #)
2. For private channels, invite the bot: `/invite @YourBotName`
3. Check that the channel exists in your workspace

## Security Notes

- **Bot Token Security:** Store tokens encrypted in the database
- **Row Level Security:** Enable RLS on `slack_installations` table
- **Environment Variables:** Never commit `.env` files with real tokens
- **Token Rotation:** Implement token rotation for production
- **Webhook Verification:** VAPI webhooks are already verified by the handler

## Future Improvements

- [ ] Support multiple clinics with different Slack workspaces
- [ ] Add configuration UI for Slack settings per clinic
- [ ] Implement token encryption/decryption
- [ ] Add notification preferences (enable/disable per clinic)
- [ ] Support custom message templates per clinic
- [ ] Add notification delivery confirmation tracking

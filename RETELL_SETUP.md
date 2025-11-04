# Retell AI Call Management Setup

This guide explains how to set up and configure the Retell AI call management system.

## Prerequisites

1. **Retell AI Account**: Sign up at [https://app.retellai.com/](https://app.retellai.com/)
2. **Retell API Key**: Obtain from your Retell AI dashboard
3. **Phone Number**: Configure a phone number in your Retell AI account
4. **Agent**: Create an AI agent in your Retell AI dashboard

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Retell AI Configuration
RETELL_API_KEY=your_api_key_here          # Required: Your Retell AI API key
RETELL_FROM_NUMBER=+14157774444           # Optional: Default from number for calls
RETELL_AGENT_ID=agent_abc123xyz           # Optional: Default agent ID to use
```

### Getting Your Configuration Values

1. **API Key** (`RETELL_API_KEY`):
   - Go to [Retell AI Dashboard](https://app.retellai.com/)
   - Navigate to Settings → API Keys
   - Create a new API key or copy an existing one
   - **Important**: Keep this key secure and never commit it to version control

2. **From Number** (`RETELL_FROM_NUMBER`):
   - Go to Phone Numbers section in your Retell dashboard
   - Purchase or configure a phone number
   - Use the number in E.164 format (e.g., +14157774444)
   - You can also specify this per-call in the UI

3. **Agent ID** (`RETELL_AGENT_ID`):
   - Go to Agents section in your Retell dashboard
   - Create a new agent or copy the ID of an existing one
   - Format: `agent_` followed by alphanumeric characters
   - You can also specify this per-call in the UI

## Database Setup

The database migration has been automatically applied. It creates:

- `retell_calls` table to store call history
- Indexes for performance
- Row Level Security (RLS) policies for admin-only access

## Webhook Setup (Required for Real-Time Status Updates)

To receive real-time call status updates, you **must** configure webhooks in your Retell AI dashboard.

### Why Webhooks?

Without webhooks, call statuses only update when:

- Someone is actively viewing the call detail page (polls every 5 seconds)
- You manually refresh the calls list page

With webhooks, your app receives instant notifications when:

- A call starts (`call_started`)
- A call ends (`call_ended`)

This ensures your database always has the latest call status, recording URL, transcript, and analysis.

### Configure Webhook in Retell AI Dashboard

1. **Get Your Webhook URL**
   - Production: `https://your-domain.com/api/webhooks/retell`
   - Development (with ngrok): `https://your-ngrok-url.ngrok.io/api/webhooks/retell`

2. **Set Up Webhook in Retell Dashboard**
   - Go to [Retell AI Dashboard](https://app.retellai.com/)
   - Navigate to **Settings** → **Webhooks**
   - Click **Add Webhook**
   - Enter your webhook URL
   - Select events: **call_started** and **call_ended**
   - Save the webhook configuration

3. **Test the Webhook**
   - The webhook includes a GET endpoint for health checks
   - Visit `https://your-domain.com/api/webhooks/retell` to verify it's active
   - You should see: `{"status":"ok","message":"Retell webhook endpoint is active"}`

### Development with ngrok

For local development, use [ngrok](https://ngrok.com/) to expose your localhost:

```bash
# Start your Next.js dev server
pnpm dev

# In another terminal, start ngrok
ngrok http 3000

# Use the ngrok HTTPS URL in your Retell webhook configuration
# Example: https://abc123.ngrok.io/api/webhooks/retell
```

### Security

The webhook endpoint:

- ✅ Verifies the `x-retell-signature` header matches your API key
- ✅ Rejects unauthorized requests with 401 status
- ✅ Handles malformed payloads gracefully
- ✅ Returns 200 status to prevent retries for expected errors

### Webhook Events Handled

**call_started**: Triggered when a call connects

- Updates status to `in_progress`
- Records start timestamp
- Updates call details in database

**call_ended**: Triggered when a call ends

- Updates final status (`completed`, `failed`, or `cancelled`)
- Records end timestamp and duration
- Saves recording URL (when available)
- Saves transcript and call analysis
- Records disconnection reason

### Status Mapping

| Retell Status/Reason                                                  | Your App Status |
| --------------------------------------------------------------------- | --------------- |
| `ongoing`, `active`                                                   | `in_progress`   |
| `user_hangup`                                                         | `completed`     |
| `dial_failed`, `dial_no_answer`, `dial_busy`, `error_inbound_webhook` | `failed`        |
| `registered`                                                          | `initiated`     |
| `ended`                                                               | `completed`     |

### Troubleshooting Webhooks

**Webhook not receiving events:**

- Verify webhook URL is publicly accessible (not localhost without ngrok)
- Check Retell dashboard webhook configuration
- Verify API key is correctly set in `.env.local`
- Check server logs for incoming webhook requests

**Signature verification failing:**

- Ensure `RETELL_API_KEY` environment variable matches your Retell API key exactly
- Restart your Next.js server after changing environment variables

**Call status not updating:**

- Check webhook logs in Retell dashboard for delivery status
- Verify webhook endpoint is returning 200 status
- Check application logs for database update errors

## Features

### 1. Send Call (`/dashboard/calls/send`)

Initiate outbound calls with custom parameters:

- **Phone Number**: International format (E.164)
- **Agent ID**: The AI agent to use for the call
- **Custom Variables**: Key-value pairs to pass to the agent
  - Variables are accessible in agent prompts using `{{variable_name}}`
  - All values must be strings
  - Example: `customer_name: "John Doe"`

### 2. Call History (`/dashboard/calls`)

View all past calls with:

- Call status tracking
- Duration and timestamps
- Custom variables display
- Filtering by status
- Real-time updates

## Usage Examples

### Basic Call

```typescript
// Minimal required fields
{
  phoneNumber: "+12137774445",
  agentId: "agent_abc123",
  variables: {},
}
```

### Call with Custom Variables

```typescript
{
  phoneNumber: "+12137774445",
  agentId: "agent_abc123",
  variables: {
    customer_name: "John Doe",
    appointment_time: "2:00 PM",
    clinic_name: "Veterinary Clinic",
  },
}
```

### Using Variables in Agent Prompts

In your Retell AI agent configuration, you can reference variables like this:

```
Hello {{customer_name}}, this is a reminder about your appointment at {{appointment_time}}...
```

## Call Status Lifecycle

1. **initiated**: Call has been created but not yet connected
2. **ringing**: Phone is ringing
3. **in_progress**: Call is active and in conversation
4. **completed**: Call ended successfully
5. **failed**: Call failed to connect or encountered an error
6. **cancelled**: Call was cancelled before completion

## Security

- **Admin Only**: Only users with `admin` role can access call management
- **RLS Policies**: Database-level security ensures data isolation
- **API Key**: Never exposed to client-side code
- **Audit Trail**: All calls are logged with creator information

## Troubleshooting

### "RETELL_API_KEY is not defined"

- Ensure `.env.local` file exists in project root
- Restart your Next.js development server after adding env variables

### "Unauthorized: Admin access required"

- Check your user role in the database
- Only users with `role = 'admin'` can access call management

### "Invalid phone number format"

- Use E.164 format: `+[country code][number]`
- Examples: `+12137774445` (US), `+447911123456` (UK)

### Calls not showing in history

- Check database connection
- Verify RLS policies are correctly configured
- Ensure user has admin role

## API Documentation

For detailed Retell AI API documentation, visit:

- [Retell AI Docs](https://docs.retellai.com/)
- [API Reference](https://docs.retellai.com/api-reference)

## Support

For issues specific to:

- **Retell AI Platform**: Contact Retell AI support
- **This Integration**: Check application logs and database

## Next Steps

1. Add environment variables to `.env.local`
2. Restart your development server
3. Navigate to `/dashboard/calls/send`
4. Send your first test call
5. View call history at `/dashboard/calls`

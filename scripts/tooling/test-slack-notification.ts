/**
 * Test Slack Notification
 *
 * Quick script to verify Slack integration is working.
 *
 * Usage:
 *   pnpm tsx scripts/tooling/test-slack-notification.ts
 *   pnpm tsx scripts/tooling/test-slack-notification.ts --type=emergency
 */

import {
  loadScriptEnv,
  parseScriptArgs,
  scriptLog,
} from "@odis-ai/shared/script-utils";

loadScriptEnv({ required: [] });

import {
  sendSlackNotification,
  isEnvSlackConfigured,
  type SlackNotificationType,
} from "@odis-ai/integrations/slack";

async function main() {
  const args = parseScriptArgs();
  const type = (args.type as SlackNotificationType) || "appointment_booked";

  scriptLog.info("Testing Slack notification...");

  // Check if Slack is configured
  if (!isEnvSlackConfigured()) {
    scriptLog.error("SLACK_BOT_TOKEN is not set in environment");
    process.exit(1);
  }

  scriptLog.info("Slack is configured ✓");
  scriptLog.info(`Sending test notification: ${type}`);

  let result;

  switch (type) {
    case "appointment_booked":
      result = await sendSlackNotification("appointment_booked", {
        clinicName: "Test Clinic",
        clientName: "John Smith",
        petName: "Max",
        date: "Monday, Feb 17, 2026",
        time: "2:30 PM",
        phone: "(555) 123-4567",
        reason: "Annual checkup",
        species: "Dog",
        breed: "Golden Retriever",
        isNewClient: true,
        bookingId: "test-booking-123",
      });
      break;

    case "emergency_triage":
      result = await sendSlackNotification("emergency_triage", {
        clinicName: "Test Clinic",
        urgency: "critical",
        petName: "Buddy",
        species: "Cat",
        symptoms: "Difficulty breathing, lethargy",
        action: "Sent to ER",
        phone: "(555) 987-6543",
        callId: "test-call-456",
      });
      break;

    case "call_failed":
      result = await sendSlackNotification("call_failed", {
        clinicName: "Test Clinic",
        callId: "test-call-789",
        errorMessage: "Connection timeout after 30 seconds",
        errorCode: "TIMEOUT",
        phone: "(555) 111-2222",
        retryCount: 2,
      });
      break;

    case "sync_error":
      result = await sendSlackNotification("sync_error", {
        service: "IDEXX Schedule Sync",
        clinicName: "Test Clinic",
        errorMessage: "Authentication failed - invalid credentials",
        errorCode: "AUTH_ERROR",
        timestamp: new Date().toLocaleTimeString(),
      });
      break;

    case "admin_alert":
      result = await sendSlackNotification("admin_alert", {
        title: "Test Admin Alert",
        message: "This is a test notification from the ODIS system.",
        severity: "info",
        metadata: {
          environment: "development",
          triggered_by: "test-script",
        },
      });
      break;

    default:
      scriptLog.error(`Unknown notification type: ${type}`);
      process.exit(1);
  }

  if (result.ok) {
    scriptLog.success(
      "Notification sent successfully! Check your Slack channel.",
    );
  } else {
    scriptLog.error(`Failed to send notification: ${result.error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  scriptLog.error("Script failed", error);
  process.exit(1);
});

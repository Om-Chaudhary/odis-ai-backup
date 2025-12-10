/**
 * Built-in Tool Handlers
 *
 * Default tool implementations that can be enabled.
 * These are examples - customize based on your needs.
 *
 * @module vapi/webhooks/tools/built-in
 */

import { registerTool } from "./registry";
import { loggers } from "@odis-ai/logger";

const logger = loggers.webhook.child("built-in-tools");

/**
 * Register all built-in tools
 * Call this at application startup to enable default tools
 */
export function registerBuiltInTools(): void {
  // Book appointment tool (placeholder)
  registerTool({
    name: "book_appointment",
    description: "Book a follow-up appointment for the pet",
    handler: async (params, context) => {
      const { date, reason, petName } = params as {
        date?: string;
        reason?: string;
        petName?: string;
      };

      logger.info("Book appointment called", {
        callId: context.callId,
        date,
        reason,
        petName,
      });

      // TODO: Implement actual appointment booking logic
      // This could integrate with your scheduling system

      return {
        success: true,
        appointmentId: `apt_${Date.now()}`,
        date: date ?? "next available",
        message:
          "Appointment booking request received. Our team will confirm shortly.",
      };
    },
  });

  // Lookup pet records tool (placeholder)
  registerTool({
    name: "lookup_pet_records",
    description: "Look up pet medical records",
    handler: async (params, context) => {
      const { petName, ownerName, phoneNumber } = params as {
        petName?: string;
        ownerName?: string;
        phoneNumber?: string;
      };

      logger.info("Lookup pet records called", {
        callId: context.callId,
        petName,
        ownerName,
      });

      // TODO: Implement actual record lookup
      // This could query your PIMS system

      return {
        found: false,
        message: "Record lookup is not yet implemented.",
        searchCriteria: { petName, ownerName, phoneNumber },
      };
    },
  });

  // Send SMS notification tool (placeholder)
  registerTool({
    name: "send_sms_notification",
    description: "Send an SMS notification to the pet owner",
    handler: async (params, context) => {
      const { phoneNumber, message: smsMessage } = params as {
        phoneNumber?: string;
        message?: string;
      };

      logger.info("Send SMS called", {
        callId: context.callId,
        phoneNumber: phoneNumber?.substring(0, 6) + "****",
        messageLength: smsMessage?.length,
      });

      // TODO: Implement actual SMS sending
      // This could integrate with Twilio, AWS SNS, etc.

      return {
        sent: false,
        message: "SMS sending is not yet implemented.",
      };
    },
  });

  // Get clinic hours tool
  registerTool({
    name: "get_clinic_hours",
    description: "Get the clinic's business hours",
    handler: async (params, context) => {
      logger.info("Get clinic hours called", {
        callId: context.callId,
      });

      // TODO: Fetch actual clinic hours from database
      return {
        success: true,
        hours: {
          monday: "8:00 AM - 6:00 PM",
          tuesday: "8:00 AM - 6:00 PM",
          wednesday: "8:00 AM - 6:00 PM",
          thursday: "8:00 AM - 6:00 PM",
          friday: "8:00 AM - 5:00 PM",
          saturday: "9:00 AM - 2:00 PM",
          sunday: "Closed",
        },
        emergencyInfo:
          "For after-hours emergencies, please call our emergency line.",
      };
    },
  });

  // Check appointment availability tool
  registerTool({
    name: "check_availability",
    description: "Check appointment availability for a specific date",
    handler: async (params, context) => {
      const { date, appointmentType } = params as {
        date?: string;
        appointmentType?: string;
      };

      logger.info("Check availability called", {
        callId: context.callId,
        date,
        appointmentType,
      });

      // TODO: Implement actual availability check
      return {
        date: date ?? "not specified",
        appointmentType: appointmentType ?? "general",
        available: true,
        slots: ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"],
        message:
          "These are example slots. Actual availability check not implemented.",
      };
    },
  });

  logger.info("Built-in tools registered", {
    tools: [
      "book_appointment",
      "lookup_pet_records",
      "send_sms_notification",
      "get_clinic_hours",
      "check_availability",
    ],
  });
}

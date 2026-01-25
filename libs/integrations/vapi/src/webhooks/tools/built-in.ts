/**
 * Built-in Tool Handlers
 *
 * Default tool implementations that can be enabled.
 * These are examples - customize based on your needs.
 *
 * @module vapi/webhooks/tools/built-in
 */

import { registerTool } from "./registry";
import { loggers } from "@odis-ai/shared/logger";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { findClinicWithConfigByAssistantId } from "../../inbound-tools/find-clinic-by-assistant";
import {
  processCheckAvailability,
  processCheckAvailabilityRange,
} from "../../processors/appointments";

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
        assistantId: context.assistantId,
      });

      if (!context.assistantId) {
        return {
          success: false,
          error: "Assistant ID not available",
          message: "Unable to retrieve clinic hours.",
        };
      }

      try {
        const supabase = await createServiceClient();

        // Get clinic from assistant_id
        const { data: clinic, error } = await supabase
          .from("clinics")
          .select("id, name, business_hours")
          .or(
            `inbound_assistant_id.eq.${context.assistantId},outbound_assistant_id.eq.${context.assistantId}`,
          )
          .single();

        if (error || !clinic) {
          logger.warn("Clinic not found for assistant", {
            assistantId: context.assistantId,
            error: error?.message,
          });
          return {
            success: false,
            error: "Clinic not found",
            message: "Unable to retrieve clinic hours.",
          };
        }

        // Format business hours for display
        interface DayHours {
          open: string;
          close: string;
          closed?: boolean;
        }

        type BusinessHours = Record<string, DayHours | undefined>;

        const businessHours = clinic.business_hours as BusinessHours | null;

        if (!businessHours) {
          logger.warn("No business hours configured for clinic", {
            clinicId: clinic.id,
            clinicName: clinic.name,
          });
          return {
            success: false,
            error: "Hours not configured",
            message:
              "Business hours are not yet configured. Please contact the clinic directly.",
          };
        }

        // Convert 24h format to 12h AM/PM format for display
        const formatTime = (time24: string): string => {
          const parts = time24.split(":");
          const hours = Number(parts[0] ?? 0);
          const minutes = Number(parts[1] ?? 0);
          const period = hours >= 12 ? "PM" : "AM";
          const hours12 = hours % 12 || 12;
          return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
        };

        const formatDayHours = (day: DayHours | undefined): string => {
          if (!day || day.closed) return "Closed";
          return `${formatTime(day.open)} - ${formatTime(day.close)}`;
        };

        const formattedHours = {
          monday: formatDayHours(businessHours.monday),
          tuesday: formatDayHours(businessHours.tuesday),
          wednesday: formatDayHours(businessHours.wednesday),
          thursday: formatDayHours(businessHours.thursday),
          friday: formatDayHours(businessHours.friday),
          saturday: formatDayHours(businessHours.saturday),
          sunday: formatDayHours(businessHours.sunday),
        };

        logger.info("Clinic hours retrieved", {
          clinicId: clinic.id,
          clinicName: clinic.name,
        });

        return {
          success: true,
          clinic_name: clinic.name,
          hours: formattedHours,
          emergencyInfo:
            "For after-hours emergencies, please call our emergency line.",
        };
      } catch (error) {
        logger.error("Failed to get clinic hours", {
          error: error instanceof Error ? error.message : String(error),
          assistantId: context.assistantId,
        });

        return {
          success: false,
          error: "Failed to retrieve hours",
          message: "I'm having trouble accessing our hours right now.",
        };
      }
    },
  });

  // Check appointment availability tool
  registerTool({
    name: "check_availability",
    description: "Check appointment availability for a specific date",
    handler: async (params, context) => {
      const { date } = params as {
        date?: string;
      };

      logger.info("Check availability called", {
        callId: context.callId,
        date,
      });

      if (!date) {
        return {
          error: "Date is required",
          message: "Please provide a date to check availability.",
        };
      }

      // Validate assistant ID is available
      if (!context.assistantId) {
        return {
          error: "Assistant ID not available",
          message:
            "Unable to check availability. Assistant context not found.",
        };
      }

      // Get clinic from assistant_id using the standard lookup
      const supabase = await createServiceClient();
      const clinic = await findClinicWithConfigByAssistantId(
        supabase,
        context.assistantId,
      );

      // Call the processor directly (no HTTP roundtrip)
      const result = await processCheckAvailability(
        { date, include_blocked: false },
        {
          callId: context.callId,
          toolCallId: context.toolCallId,
          assistantId: context.assistantId,
          clinic,
          supabase,
          logger,
        },
      );

      logger.info("Availability check completed", {
        date,
        success: result.success,
        callId: context.callId,
      });

      // Spread result to match expected Record<string, unknown> return type
      return { ...result };
    },
  });

  // Check availability range tool (for multi-day scheduling)
  registerTool({
    name: "check_availability_range",
    description:
      "Check appointment availability for the next 1-14 days. Returns which days have openings and the first available times.",
    handler: async (params, context) => {
      const { days_ahead = 14 } = params as {
        days_ahead?: number;
      };

      logger.info("Check availability range called", {
        callId: context.callId,
        days_ahead,
      });

      if (!context.assistantId) {
        return {
          error: "Assistant ID not available",
          message: "Unable to check availability. Assistant context not found.",
        };
      }

      // Get clinic from assistant_id using the standard lookup
      const supabase = await createServiceClient();
      const clinic = await findClinicWithConfigByAssistantId(
        supabase,
        context.assistantId,
      );

      // Call the processor directly (no HTTP roundtrip)
      const result = await processCheckAvailabilityRange(
        { days_ahead: Math.min(Math.max(1, days_ahead), 14) },
        {
          callId: context.callId,
          toolCallId: context.toolCallId,
          assistantId: context.assistantId,
          clinic,
          supabase,
          logger,
        },
      );

      logger.info("Availability range check completed", {
        days_ahead,
        success: result.success,
        callId: context.callId,
      });

      // Spread result to match expected Record<string, unknown> return type
      return { ...result };
    },
  });

  logger.info("Built-in tools registered", {
    tools: [
      "book_appointment",
      "lookup_pet_records",
      "send_sms_notification",
      "get_clinic_hours",
      "check_availability",
      "check_availability_range",
    ],
  });
}

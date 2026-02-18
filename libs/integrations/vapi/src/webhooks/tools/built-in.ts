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
  processBookAppointment,
} from "../../processors/appointments";
import { processLeaveMessage } from "../../processors/messaging";
import { processLogEmergencyTriage } from "../../processors/triage";
import { LeaveMessageSchema } from "../../schemas/messaging";
import { LogEmergencyTriageSchema } from "../../schemas/triage";
import { BookAppointmentSchema } from "../../schemas/appointments";

const logger = loggers.webhook.child("built-in-tools");

/**
 * Register all built-in tools
 * Call this at application startup to enable default tools
 */
export function registerBuiltInTools(): void {
  // Book appointment tool - books appointments via IDEXX, Avimark, or schedule_slots
  registerTool({
    name: "book_appointment",
    description:
      "Book an appointment for a pet. Supports natural language dates and times.",
    handler: async (params, context) => {
      logger.info("Book appointment called", {
        callId: context.callId,
        assistantId: context.assistantId,
      });

      // Validate assistant ID is available
      if (!context.assistantId) {
        return {
          error: "Assistant ID not available",
          message: "Unable to book appointment. Assistant context not found.",
        };
      }

      // Parse and validate input
      const parsed = BookAppointmentSchema.safeParse(params);
      if (!parsed.success) {
        logger.warn("Book appointment validation failed", {
          callId: context.callId,
          errors: parsed.error.flatten(),
        });
        return {
          error: "validation_error",
          message:
            "I need some information to book your appointment. Please provide the date, time, your name, phone number, and your pet's name.",
        };
      }

      // Get clinic from assistant_id using the standard lookup
      const supabase = await createServiceClient();
      const clinic = await findClinicWithConfigByAssistantId(
        supabase,
        context.assistantId,
      );

      // Call the processor directly (no HTTP roundtrip)
      const result = await processBookAppointment(parsed.data, {
        callId: context.callId,
        toolCallId: context.toolCallId,
        assistantId: context.assistantId,
        clinic,
        supabase,
        logger,
      });

      logger.info("Book appointment completed", {
        success: result.success,
        callId: context.callId,
        clinicId: clinic?.id,
      });

      // Spread result to match expected Record<string, unknown> return type
      return { ...result };
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

  // Leave message tool - records callback requests for clinic staff
  registerTool({
    name: "leave_message",
    description: "Record a callback message for clinic staff",
    handler: async (params, context) => {
      logger.info("Leave message called", {
        callId: context.callId,
        assistantId: context.assistantId,
      });

      // Validate assistant ID is available
      if (!context.assistantId) {
        return {
          error: "Assistant ID not available",
          message: "Unable to record message. Assistant context not found.",
        };
      }

      // Parse and validate input
      const parsed = LeaveMessageSchema.safeParse(params);
      if (!parsed.success) {
        logger.warn("Leave message validation failed", {
          callId: context.callId,
          errors: parsed.error.flatten(),
        });
        return {
          error: "validation_error",
          message:
            "I need some information to record your message. Please provide your name and phone number.",
        };
      }

      // Get clinic from assistant_id using the standard lookup
      const supabase = await createServiceClient();
      const clinic = await findClinicWithConfigByAssistantId(
        supabase,
        context.assistantId,
      );

      // Call the processor directly (no HTTP roundtrip)
      const result = await processLeaveMessage(parsed.data, {
        callId: context.callId,
        toolCallId: context.toolCallId,
        assistantId: context.assistantId,
        clinic,
        supabase,
        logger,
      });

      logger.info("Leave message completed", {
        success: result.success,
        callId: context.callId,
        clinicId: clinic?.id,
      });

      // Spread result to match expected Record<string, unknown> return type
      return { ...result };
    },
  });

  // Log emergency triage tool - records ER triage outcomes
  registerTool({
    name: "log_emergency_triage",
    description:
      "Log emergency triage outcomes when a caller is referred to ER or triaged",
    handler: async (params, context) => {
      logger.info("Log emergency triage called", {
        callId: context.callId,
        assistantId: context.assistantId,
      });

      if (!context.assistantId) {
        return {
          error: "Assistant ID not available",
          message: "Unable to log triage. Assistant context not found.",
        };
      }

      const parsed = LogEmergencyTriageSchema.safeParse(params);
      if (!parsed.success) {
        logger.warn("Log emergency triage validation failed", {
          callId: context.callId,
          errors: parsed.error.flatten(),
        });
        return {
          error: "validation_error",
          message:
            "I need some information to log this emergency. Please provide the caller's name, phone number, pet name, symptoms, and urgency level.",
        };
      }

      const supabase = await createServiceClient();
      const clinic = await findClinicWithConfigByAssistantId(
        supabase,
        context.assistantId,
      );

      const result = await processLogEmergencyTriage(parsed.data, {
        callId: context.callId,
        toolCallId: context.toolCallId,
        assistantId: context.assistantId,
        clinic,
        supabase,
        logger,
      });

      logger.info("Log emergency triage completed", {
        success: result.success,
        callId: context.callId,
        clinicId: clinic?.id,
      });

      return { ...result };
    },
  });

  logger.info("Built-in tools registered", {
    tools: [
      "book_appointment",
      "get_clinic_hours",
      "check_availability",
      "check_availability_range",
      "leave_message",
      "log_emergency_triage",
    ],
  });
}

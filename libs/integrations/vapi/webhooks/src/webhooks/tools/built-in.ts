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

const logger = loggers.webhook.child("built-in-tools");

/**
 * Get clinic hours based on day of week
 * Currently configured for Alum Rock Animal Hospital
 *
 * @param date - Date string in YYYY-MM-DD format
 * @returns Object with start_time and end_time in HH:MM format
 */
function getClinicHoursForDate(date: string): {
  start_time: string;
  end_time: string;
  day_name: string;
} {
  const dateObj = new Date(date + "T00:00:00");
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Alum Rock Animal Hospital Schedule:
  // Monday-Friday: 8:00 AM - 7:00 PM
  // Saturday: 8:00 AM - 6:00 PM
  // Sunday: 9:00 AM - 5:00 PM
  let start_time: string;
  let end_time: string;

  if (dayOfWeek === 0) {
    // Sunday
    start_time = "09:00";
    end_time = "17:00";
  } else if (dayOfWeek === 6) {
    // Saturday
    start_time = "08:00";
    end_time = "18:00";
  } else {
    // Monday-Friday
    start_time = "08:00";
    end_time = "19:00";
  }

  return {
    start_time,
    end_time,
    day_name: dayNames[dayOfWeek]!,
  };
}

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

      // Alum Rock Animal Hospital hours
      return {
        success: true,
        hours: {
          monday: "8:00 AM - 7:00 PM",
          tuesday: "8:00 AM - 7:00 PM",
          wednesday: "8:00 AM - 7:00 PM",
          thursday: "8:00 AM - 7:00 PM",
          friday: "8:00 AM - 7:00 PM",
          saturday: "8:00 AM - 6:00 PM",
          sunday: "9:00 AM - 5:00 PM",
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
      const { date, provider_name } = params as {
        date?: string;
        provider_name?: string;
      };

      logger.info("Check availability called", {
        callId: context.callId,
        date,
        provider_name,
      });

      if (!date) {
        return {
          error: "Date is required",
          message: "Please provide a date to check availability.",
        };
      }

      try {
        // Validate assistant ID is available
        if (!context.assistantId) {
          return {
            error: "Assistant ID not available",
            message:
              "Unable to check availability. Assistant context not found.",
          };
        }

        // Get clinic_id from assistant_id
        const supabase = await createServiceClient();

        const { data: clinic } = await supabase
          .from("clinics")
          .select("id, name")
          .or(
            `inbound_assistant_id.eq.${context.assistantId},outbound_assistant_id.eq.${context.assistantId}`,
          )
          .single();

        if (!clinic) {
          return {
            error: "Clinic not found",
            message:
              "Unable to check availability. Clinic configuration not found.",
          };
        }

        // Get clinic hours for this specific day
        const hours = getClinicHoursForDate(date);

        logger.info("Using clinic hours", {
          date,
          day: hours.day_name,
          start: hours.start_time,
          end: hours.end_time,
        });

        // Build query params with day-specific hours
        const params = new URLSearchParams({
          clinic_id: clinic.id,
          date,
          slot_duration_minutes: "15", // 15-minute intervals as configured
          start_time: hours.start_time,
          end_time: hours.end_time,
        });

        // If provider_name specified, look up provider_id
        if (provider_name) {
          const { data: provider } = await supabase
            .from("providers")
            .select("id, name")
            .eq("clinic_id", clinic.id)
            .ilike("name", `%${provider_name}%`)
            .maybeSingle();

          if (provider) {
            params.append("provider_id", provider.id);
            logger.info("Provider filter applied", {
              provider_name,
              provider_id: provider.id,
            });
          }
        }

        // Call availability API
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
        const response = await fetch(
          `${baseUrl}/api/appointments/availability?${params}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            (data as { error?: string }).error ?? "Availability check failed",
          );
        }

        interface AvailabilityResponse {
          available_slots: Array<{ start: string }>;
        }

        // Format response for VAPI agent
        const availableTimes = (
          data as AvailabilityResponse
        ).available_slots.map((s) => s.start);

        logger.info("Availability check successful", {
          date,
          available_count: availableTimes.length,
          clinic_id: clinic.id,
        });

        return {
          date: data.date,
          available_times: availableTimes,
          total_available: data.available_slots.length,
          last_synced: data.sync_freshness,
          message:
            data.available_slots.length > 0
              ? `We have ${data.available_slots.length} available slots on ${date}`
              : `No available slots on ${date}. The schedule was last updated ${data.sync_freshness}.`,
        };
      } catch (error) {
        logger.error("Availability check failed", {
          error: error instanceof Error ? error.message : String(error),
          date,
        });

        return {
          error: "Failed to check availability",
          message:
            "I'm having trouble checking our schedule right now. Let me take your information and have someone call you back to schedule.",
        };
      }
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

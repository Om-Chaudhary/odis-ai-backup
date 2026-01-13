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

        // Build query params
        const params = new URLSearchParams({
          clinic_id: clinic.id,
          date,
          slot_duration_minutes: "30",
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

      try {
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

        // Call availability range API
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
        const response = await fetch(
          `${baseUrl}/api/vapi/tools/check-availability-range`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assistant_id: context.assistantId,
              days_ahead: Math.min(Math.max(1, days_ahead), 14),
              vapi_call_id: context.callId,
            }),
          },
        );

        const data = (await response.json()) as {
          available: boolean;
          summary?: {
            days_with_availability: number;
            total_available_slots: number;
          };
          first_available?: {
            formatted_date: string;
            day_of_week: string;
            times: Array<{ time: string }>;
          };
          availability?: Array<{
            date: string;
            formatted_date: string;
            day_of_week: string;
            available_slots: number;
          }>;
          message: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Availability check failed");
        }

        logger.info("Availability range check successful", {
          days_ahead,
          days_with_availability: data.summary?.days_with_availability ?? 0,
          clinic_id: clinic.id,
        });

        return {
          available: data.available,
          days_checked: days_ahead,
          days_with_availability: data.summary?.days_with_availability ?? 0,
          total_slots: data.summary?.total_available_slots ?? 0,
          first_available: data.first_available
            ? {
                date: data.first_available.formatted_date,
                day: data.first_available.day_of_week,
                times: data.first_available.times
                  .slice(0, 5)
                  .map((t) => t.time),
              }
            : null,
          availability: data.availability
            ?.filter((d) => d.available_slots > 0)
            .slice(0, 7),
          message: data.message,
        };
      } catch (error) {
        logger.error("Availability range check failed", {
          error: error instanceof Error ? error.message : String(error),
          days_ahead,
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
      "check_availability_range",
    ],
  });
}

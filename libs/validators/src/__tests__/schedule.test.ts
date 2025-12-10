/**
 * Tests for Schedule Sync Validation Schemas
 */

import { describe, it, expect } from "vitest";
import {
  AppointmentInputSchema,
  ScheduleSyncRequestSchema,
} from "../lib/schedule";

describe("AppointmentInputSchema", () => {
  describe("valid inputs", () => {
    it("accepts complete valid appointment", () => {
      const validAppointment = {
        neo_appointment_id: "NEO123",
        date: "2024-02-15",
        start_time: "09:00",
        end_time: "09:30",
        patient_name: "Max",
        client_name: "John Doe",
        client_phone: "+15551234567",
        appointment_type: "Wellness Exam",
        status: "scheduled",
        notes: "Annual checkup",
        provider_id: "PROV123",
        provider_name: "Dr. Smith",
        metadata: { source: "idexx_neo" },
      };
      const result = AppointmentInputSchema.safeParse(validAppointment);
      expect(result.success).toBe(true);
    });

    it("accepts minimal valid appointment", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "10:00",
        end_time: "10:30",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("scheduled"); // Default value
      }
    });

    it("accepts all valid status values", () => {
      const statuses = [
        "scheduled",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ];
      statuses.forEach((status) => {
        const result = AppointmentInputSchema.safeParse({
          date: "2024-02-15",
          start_time: "10:00",
          end_time: "10:30",
          status,
        });
        expect(result.success).toBe(true);
      });
    });

    it("defaults status to 'scheduled'", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "10:00",
        end_time: "10:30",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("scheduled");
      }
    });

    it("accepts null for optional fields", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "10:00",
        end_time: "10:30",
        patient_name: null,
        client_name: null,
        client_phone: null,
        appointment_type: null,
        notes: null,
        metadata: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts various phone number formats", () => {
      const phoneFormats = [
        "+15551234567",
        "555-123-4567",
        "(555) 123-4567",
        "555 123 4567",
        "+44 20 7123 4567",
      ];
      phoneFormats.forEach((phone) => {
        const result = AppointmentInputSchema.safeParse({
          date: "2024-02-15",
          start_time: "10:00",
          end_time: "10:30",
          client_phone: phone,
        });
        expect(result.success).toBe(true);
      });
    });

    it("accepts times at boundaries", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "00:00",
        end_time: "23:59",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects invalid date format", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "02/15/2024",
        start_time: "10:00",
        end_time: "10:30",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain("ISO format");
      }
    });

    it("rejects invalid date (not a real date)", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-31", // February doesn't have 31 days
        start_time: "10:00",
        end_time: "10:30",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain("valid date");
      }
    });

    it("rejects invalid time format", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "10:00 AM",
        end_time: "10:30",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain("HH:mm");
      }
    });

    it("rejects time with invalid hours", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "24:00",
        end_time: "10:30",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "valid (00:00-23:59)",
        );
      }
    });

    it("rejects time with invalid minutes", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "10:60",
        end_time: "11:00",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "valid (00:00-23:59)",
        );
      }
    });

    it("rejects single-digit time components", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "9:00",
        end_time: "10:30",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid status", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "10:00",
        end_time: "10:30",
        status: "pending",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "Status must be one of",
        );
      }
    });

    it("rejects notes exceeding 5000 characters", () => {
      const longNotes = "A".repeat(5001);
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "10:00",
        end_time: "10:30",
        notes: longNotes,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain("5000 characters");
      }
    });

    it("rejects invalid phone number format", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "10:00",
        end_time: "10:30",
        client_phone: "abc",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "Phone number format",
        );
      }
    });

    it("rejects missing required date", () => {
      const result = AppointmentInputSchema.safeParse({
        start_time: "10:00",
        end_time: "10:30",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required start_time", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        end_time: "10:30",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required end_time", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "10:00",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("accepts maximum valid notes length", () => {
      const maxNotes = "A".repeat(5000);
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "10:00",
        end_time: "10:30",
        notes: maxNotes,
      });
      expect(result.success).toBe(true);
    });

    it("accepts midnight time", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "00:00",
        end_time: "01:00",
      });
      expect(result.success).toBe(true);
    });

    it("accepts special characters in names", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "10:00",
        end_time: "10:30",
        patient_name: "Mr. Whiskers O'Malley III",
        client_name: "Jean-Pierre D'Arcy",
      });
      expect(result.success).toBe(true);
    });

    it("accepts unicode characters", () => {
      const result = AppointmentInputSchema.safeParse({
        date: "2024-02-15",
        start_time: "10:00",
        end_time: "10:30",
        patient_name: "雪球",
        client_name: "王先生",
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("ScheduleSyncRequestSchema", () => {
  describe("valid inputs", () => {
    it("accepts valid sync request with single appointment", () => {
      const validRequest = {
        syncDate: "2024-02-15",
        appointments: [
          {
            date: "2024-02-15",
            start_time: "09:00",
            end_time: "09:30",
            patient_name: "Max",
            client_name: "John Doe",
          },
        ],
      };
      const result = ScheduleSyncRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("accepts multiple appointments", () => {
      const validRequest = {
        syncDate: "2024-02-15",
        appointments: [
          {
            date: "2024-02-15",
            start_time: "09:00",
            end_time: "09:30",
          },
          {
            date: "2024-02-15",
            start_time: "10:00",
            end_time: "10:30",
          },
          {
            date: "2024-02-15",
            start_time: "14:00",
            end_time: "14:45",
          },
        ],
      };
      const result = ScheduleSyncRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("accepts request with metadata", () => {
      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "2024-02-15",
        appointments: [
          {
            date: "2024-02-15",
            start_time: "09:00",
            end_time: "09:30",
          },
        ],
        metadata: {
          source: "idexx_neo",
          syncedBy: "user123",
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts sync date up to 1 year in future", () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 11);
      const dateStr = futureDate.toISOString().split("T")[0];

      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: dateStr,
        appointments: [
          {
            date: dateStr,
            start_time: "09:00",
            end_time: "09:30",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("accepts many appointments (up to 1000)", () => {
      const appointments = Array.from({ length: 100 }, (_, i) => ({
        date: "2024-02-15",
        start_time: "09:00",
        end_time: "09:30",
        neo_appointment_id: `APT${i}`,
      }));

      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "2024-02-15",
        appointments,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty appointments array", () => {
      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "2024-02-15",
        appointments: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "At least one appointment",
        );
      }
    });

    it("rejects more than 1000 appointments", () => {
      const appointments = Array.from({ length: 1001 }, (_, i) => ({
        date: "2024-02-15",
        start_time: "09:00",
        end_time: "09:30",
        neo_appointment_id: `APT${i}`,
      }));

      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "2024-02-15",
        appointments,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "Cannot sync more than 1000",
        );
      }
    });

    it("rejects sync date more than 1 year in future", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const dateStr = futureDate.toISOString().split("T")[0];

      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: dateStr,
        appointments: [
          {
            date: dateStr,
            start_time: "09:00",
            end_time: "09:30",
          },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "more than 1 year in the future",
        );
      }
    });

    it("rejects when end_time is before start_time", () => {
      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "2024-02-15",
        appointments: [
          {
            date: "2024-02-15",
            start_time: "10:00",
            end_time: "09:00",
          },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "End time must be after start time",
        );
      }
    });

    it("rejects when end_time equals start_time", () => {
      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "2024-02-15",
        appointments: [
          {
            date: "2024-02-15",
            start_time: "10:00",
            end_time: "10:00",
          },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "End time must be after start time",
        );
      }
    });

    it("rejects invalid appointment within array", () => {
      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "2024-02-15",
        appointments: [
          {
            date: "2024-02-15",
            start_time: "09:00",
            end_time: "09:30",
          },
          {
            date: "invalid-date",
            start_time: "10:00",
            end_time: "10:30",
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing syncDate", () => {
      const result = ScheduleSyncRequestSchema.safeParse({
        appointments: [
          {
            date: "2024-02-15",
            start_time: "09:00",
            end_time: "09:30",
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing appointments", () => {
      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "2024-02-15",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid syncDate format", () => {
      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "02/15/2024",
        appointments: [
          {
            date: "2024-02-15",
            start_time: "09:00",
            end_time: "09:30",
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("accepts appointments with 1-minute duration", () => {
      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "2024-02-15",
        appointments: [
          {
            date: "2024-02-15",
            start_time: "09:00",
            end_time: "09:01",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("accepts appointment spanning midnight", () => {
      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "2024-02-15",
        appointments: [
          {
            date: "2024-02-15",
            start_time: "23:00",
            end_time: "23:59",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("accepts null metadata", () => {
      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "2024-02-15",
        appointments: [
          {
            date: "2024-02-15",
            start_time: "09:00",
            end_time: "09:30",
          },
        ],
        metadata: null,
      });
      expect(result.success).toBe(true);
    });

    it("validates all appointments in batch", () => {
      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "2024-02-15",
        appointments: [
          {
            date: "2024-02-15",
            start_time: "09:00",
            end_time: "09:30",
          },
          {
            date: "2024-02-15",
            start_time: "09:30", // One invalid
            end_time: "09:00", // end before start
          },
          {
            date: "2024-02-15",
            start_time: "10:00",
            end_time: "10:30",
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("accepts today as sync date", () => {
      const today = new Date().toISOString().split("T")[0];
      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: today,
        appointments: [
          {
            date: today,
            start_time: "09:00",
            end_time: "09:30",
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("date validation edge cases", () => {
    it("accepts leap year date", () => {
      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "2024-02-29",
        appointments: [
          {
            date: "2024-02-29",
            start_time: "09:00",
            end_time: "09:30",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid leap year date", () => {
      const result = ScheduleSyncRequestSchema.safeParse({
        syncDate: "2023-02-29",
        appointments: [
          {
            date: "2023-02-29",
            start_time: "09:00",
            end_time: "09:30",
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });
});

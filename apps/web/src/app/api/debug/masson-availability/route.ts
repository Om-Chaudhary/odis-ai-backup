/**
 * Diagnostic endpoint for availability debugging.
 *
 * GET /api/debug/masson-availability?date=2026-02-23
 * GET /api/debug/masson-availability?date=2026-02-25&clinic=alumrock
 * GET /api/debug/masson-availability?lookup=alum rock   ← find clinic UUID by name
 *
 * Returns raw database contents, SQL RPC output, and TypeScript recount
 * so we can identify exactly what's wrong before attempting more fixes.
 *
 * Uses service client (bypasses RLS).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import {
  parsePostgresTimeRange,
  rangesOverlap,
  type TimeRange,
} from "@odis-ai/shared/util";
import { applyClinicHoursFilter } from "@odis-ai/integrations/vapi/processors/appointments/clinic-hours-filter";

const MASSON_CLINIC_ID = "efcc1733-7a7b-4eab-8104-a6f49defd7a6";
const ALUMROCK_CLINIC_ID = "33f3bbb8-6613-45bc-a1f2-d55e30c243ae";

const CLINIC_MAP: Record<string, string> = {
  masson: MASSON_CLINIC_ID,
  alumrock: ALUMROCK_CLINIC_ID,
};

export async function GET(request: NextRequest) {
  // ── Clinic lookup mode: ?lookup=<name fragment> ──
  const lookup = request.nextUrl.searchParams.get("lookup");
  if (lookup) {
    const supabase = await createServiceClient();
    const { data: clinics, error } = await supabase
      .from("clinics")
      .select("id, name, timezone, pims_type, business_hours")
      .ilike("name", `%${lookup}%`);

    return NextResponse.json({
      query: lookup,
      error,
      count: clinics?.length ?? 0,
      clinics: clinics?.map((c) => ({
        id: c.id,
        name: c.name,
        timezone: c.timezone,
        pims_type: c.pims_type,
        business_hours: c.business_hours,
      })),
    });
  }

  const date = request.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Missing or invalid ?date=YYYY-MM-DD parameter or ?lookup=<name>. Optional: &clinic=alumrock" },
      { status: 400 },
    );
  }

  // Support ?clinic=alumrock or ?clinic=masson (default: masson)
  const clinicParam = (request.nextUrl.searchParams.get("clinic") ?? "masson").toLowerCase();
  const CLINIC_ID = CLINIC_MAP[clinicParam] ?? MASSON_CLINIC_ID;

  const supabase = await createServiceClient();

  // ── Section 1: pims_appointments for the date ──
  const { data: pimsRows, error: pimsError } = await supabase
    .from("pims_appointments")
    .select(
      "time_range, date, status, deleted_at, provider_name, room_id, appointment_type, patient_name",
    )
    .eq("clinic_id", CLINIC_ID)
    .eq("date", date)
    .is("deleted_at", null)
    .not("status", "in", '("cancelled","no_show")');

  // Also fetch cancelled/deleted to see full picture
  const { data: pimsAllStatusRows, error: pimsAllStatusError } = await supabase
    .from("pims_appointments")
    .select(
      "time_range, date, status, deleted_at, provider_name, room_id, appointment_type, patient_name",
    )
    .eq("clinic_id", CLINIC_ID)
    .eq("date", date);

  // ── Section 2: All dates (no date filter) to catch UTC mismatch ──
  const { data: pimsAllDates, error: pimsAllDatesError } = await supabase
    .from("pims_appointments")
    .select("date, time_range")
    .eq("clinic_id", CLINIC_ID)
    .is("deleted_at", null)
    .not("status", "in", '("cancelled","no_show")')
    .gte("date", shiftDate(date, -1))
    .lte("date", shiftDate(date, 1));

  const dateDistribution: Record<string, number> = {};
  if (pimsAllDates) {
    for (const row of pimsAllDates) {
      const d = String(row.date);
      dateDistribution[d] = (dateDistribution[d] ?? 0) + 1;
    }
  }

  // ── Section 3: appointment_bookings for the date ──
  const { data: bookingRows, error: bookingError } = await supabase
    .from("appointment_bookings")
    .select("time_range, status, hold_expires_at, date")
    .eq("clinic_id", CLINIC_ID)
    .eq("date", date);

  // ── Section 4: Raw SQL RPC output ──
  const { data: rpcSlots, error: rpcError } = await supabase.rpc(
    "get_available_slots",
    {
      p_clinic_id: CLINIC_ID,
      p_date: date,
    },
  );

  // ── Section 5: TypeScript recount ──
  const bookingsParsed: Array<{
    source: string;
    raw_time_range: unknown;
    start: string | null;
    end: string | null;
    parse_error: string | null;
  }> = [];

  const activeBookings: TimeRange[] = [];

  // Parse pims_appointments
  if (pimsRows) {
    for (const row of pimsRows) {
      const entry: (typeof bookingsParsed)[number] = {
        source: "pims_appointments",
        raw_time_range: row.time_range,
        start: null,
        end: null,
        parse_error: null,
      };
      try {
        if (typeof row.time_range === "string" && row.time_range.length >= 5) {
          const parsed = parsePostgresTimeRange(row.time_range);
          entry.start = parsed.start.toISOString();
          entry.end = parsed.end.toISOString();
          activeBookings.push(parsed);
        } else {
          entry.parse_error = `Not a string or too short: ${typeof row.time_range}`;
        }
      } catch (err) {
        entry.parse_error = String(err);
      }
      bookingsParsed.push(entry);
    }
  }

  // Parse appointment_bookings (only confirmed or active holds)
  if (bookingRows) {
    const now = new Date();
    for (const row of bookingRows) {
      const isActive =
        row.status === "confirmed" ||
        (row.status === "pending" &&
          row.hold_expires_at &&
          new Date(row.hold_expires_at) > now);

      const entry: (typeof bookingsParsed)[number] = {
        source: `appointment_bookings (status=${row.status}, active=${isActive})`,
        raw_time_range: row.time_range,
        start: null,
        end: null,
        parse_error: null,
      };
      try {
        if (typeof row.time_range === "string" && row.time_range.length >= 5) {
          const parsed = parsePostgresTimeRange(row.time_range);
          entry.start = parsed.start.toISOString();
          entry.end = parsed.end.toISOString();
          if (isActive) activeBookings.push(parsed);
        } else {
          entry.parse_error = `Not a string or too short: ${typeof row.time_range}`;
        }
      } catch (err) {
        entry.parse_error = String(err);
      }
      bookingsParsed.push(entry);
    }
  }

  // Recount per slot
  type SlotRecount = {
    slot_start: string;
    slot_end: string;
    is_blocked: boolean;
    sql_booked: number;
    ts_booked: number;
    capacity: number;
    available: number;
    overlapping_bookings: string[];
  };

  const slotRecounts: SlotRecount[] = [];
  const CAPACITY = 1;

  if (rpcSlots) {
    for (const slot of rpcSlots as Array<{
      slot_start: string;
      slot_end: string;
      is_blocked: boolean;
      booked_count: number;
      capacity: number;
      available_count: number;
    }>) {
      const slotRange: TimeRange = {
        start: new Date(slot.slot_start),
        end: new Date(slot.slot_end),
      };

      const overlapping = activeBookings.filter((b) =>
        rangesOverlap(slotRange, b),
      );

      slotRecounts.push({
        slot_start: slot.slot_start,
        slot_end: slot.slot_end,
        is_blocked: slot.is_blocked,
        sql_booked: slot.booked_count,
        ts_booked: overlapping.length,
        capacity: CAPACITY,
        available: slot.is_blocked
          ? 0
          : Math.max(CAPACITY - overlapping.length, 0),
        overlapping_bookings: overlapping.map(
          (b) => `${b.start.toISOString()} - ${b.end.toISOString()}`,
        ),
      });
    }
  }

  // ── Section 6: Clinic hours filter ──
  const CLINIC_TIMEZONE = "America/Los_Angeles";
  type SlotShape = {
    slot_start: string;
    slot_end: string;
    is_blocked: boolean;
    booked_count: number;
    capacity: number;
    available_count: number;
    block_reason: string | null;
  };

  const slotsForHoursFilter: SlotShape[] = slotRecounts.map((s) => ({
    slot_start: s.slot_start,
    slot_end: s.slot_end,
    is_blocked: s.is_blocked,
    booked_count: s.ts_booked,
    capacity: s.capacity,
    available_count: s.available,
    block_reason: null,
  }));

  const hoursFiltered = applyClinicHoursFilter(
    slotsForHoursFilter,
    CLINIC_ID,
    CLINIC_TIMEZONE,
  );

  const hoursFilteredOpen = hoursFiltered.filter(
    (s) => !s.is_blocked && s.available_count > 0,
  );

  return NextResponse.json({
    _meta: {
      clinic_id: CLINIC_ID,
      clinic_name: clinicParam,
      date,
      generated_at: new Date().toISOString(),
    },

    pims_appointments: {
      query: {
        clinic_id: CLINIC_ID,
        date,
        filters: 'deleted_at IS NULL, status NOT IN ("cancelled","no_show")',
      },
      error: pimsError,
      count: pimsRows?.length ?? 0,
      rows: pimsRows,
    },

    pims_appointments_all_statuses: {
      error: pimsAllStatusError,
      count: pimsAllStatusRows?.length ?? 0,
      rows: pimsAllStatusRows,
    },

    pims_appointments_adjacent_dates: {
      error: pimsAllDatesError,
      date_range: `${shiftDate(date, -1)} to ${shiftDate(date, 1)}`,
      date_distribution: dateDistribution,
      total: pimsAllDates?.length ?? 0,
    },

    appointment_bookings: {
      error: bookingError,
      count: bookingRows?.length ?? 0,
      rows: bookingRows,
    },

    get_available_slots_raw: {
      error: rpcError,
      count: (rpcSlots as unknown[] | null)?.length ?? 0,
      slots: rpcSlots,
    },

    typescript_recount: {
      bookings_parsed: bookingsParsed,
      active_booking_count: activeBookings.length,
      slots: slotRecounts,
    },

    clinic_hours_filter: {
      timezone: CLINIC_TIMEZONE,
      input_slots: slotsForHoursFilter.length,
      blocked_by_hours: slotsForHoursFilter.length - hoursFilteredOpen.length,
      open_after_filter: hoursFilteredOpen.length,
      open_slots: hoursFilteredOpen.map((s) => ({
        slot_start: s.slot_start,
        available_count: s.available_count,
      })),
      all_slots: hoursFiltered.map((s) => ({
        slot_start: s.slot_start,
        is_blocked: s.is_blocked,
        available_count: s.available_count,
      })),
    },
  });
}

/** Shift a YYYY-MM-DD date string by N days */
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z"); // noon UTC to avoid DST edge
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

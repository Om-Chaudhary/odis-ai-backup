/**
 * Tests for processCheckAvailability
 *
 * Verifies slot filtering (blocked, zero availability, holds),
 * error handling, past-date rejection, and pims_clinic_id usage.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ToolContext } from "../../../core/types";
import type { ClinicWithConfig } from "../../../inbound-tools/find-clinic-by-assistant";
import type { CheckAvailabilityInput } from "../../../schemas/appointments";
import { processCheckAvailability } from "../check-availability";

/* ===================== helpers ===================== */

function makeFutureDate(daysFromNow = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0]!;
}

function makeClinic(overrides: Partial<ClinicWithConfig> = {}): ClinicWithConfig {
  return {
    id: "clinic-uuid-1",
    name: "Test Clinic",
    timezone: "America/Los_Angeles",
    pims_type: "idexx",
    pims_clinic_id: null,
    ...overrides,
  };
}

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
  return {
    callId: "call-1",
    toolCallId: "tc-1",
    assistantId: "asst-1",
    clinic: makeClinic(),
    supabase: { rpc } as unknown as ToolContext["supabase"],
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: vi.fn().mockReturnThis(),
    } as unknown as ToolContext["logger"],
    ...overrides,
  };
}

function slot(
  start: string,
  available: number,
  opts: { is_blocked?: boolean; block_reason?: string | null } = {},
) {
  return {
    slot_start: start,
    slot_end: `${start.split(":")[0]}:${String(Number(start.split(":")[1]) + 15).padStart(2, "0")}:00`,
    capacity: 3,
    booked_count: 3 - available,
    available_count: available,
    is_blocked: opts.is_blocked ?? false,
    block_reason: opts.block_reason ?? null,
  };
}

/* ===================== tests ===================== */

describe("processCheckAvailability", () => {
  let ctx: ToolContext;

  beforeEach(() => {
    ctx = makeCtx();
  });

  /* ---------- 1. Returns available slots ---------- */
  it("returns available slots with formatted 12-hour times", async () => {
    const slots = [
      slot("09:00:00", 2),
      slot("09:15:00", 1),
      slot("10:30:00", 3),
    ];
    (ctx.supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: slots,
      error: null,
    });

    const input: CheckAvailabilityInput = { date: makeFutureDate() };
    const result = await processCheckAvailability(input, ctx);

    expect(result.success).toBe(true);
    expect(result.data?.available).toBe(true);
    expect(result.data?.times).toHaveLength(3);
    expect((result.data?.times as Array<{ time_12h: string }>)[0]!.time_12h).toBe("9:00 AM");
    expect((result.data?.times as Array<{ time_12h: string }>)[2]!.time_12h).toBe("10:30 AM");
  });

  /* ---------- 2. Excludes zero-availability slots (holds consumed capacity) ---------- */
  it("excludes slots with zero availability (VAPI holds consumed capacity)", async () => {
    const slots = [
      slot("09:00:00", 0), // fully held/booked
      slot("09:15:00", 0),
      slot("10:00:00", 1), // open
    ];
    (ctx.supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: slots,
      error: null,
    });

    const result = await processCheckAvailability({ date: makeFutureDate() }, ctx);

    expect(result.success).toBe(true);
    expect(result.data?.times).toHaveLength(1);
    expect((result.data?.times as Array<{ time_24h: string }>)[0]!.time_24h).toBe("10:00:00");
  });

  /* ---------- 3. Mixed availability ---------- */
  it("returns only open slots when mix of full and available", async () => {
    const slots = [
      slot("08:00:00", 0),
      slot("09:00:00", 2),
      slot("10:00:00", 0),
      slot("11:00:00", 1),
    ];
    (ctx.supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: slots,
      error: null,
    });

    const result = await processCheckAvailability({ date: makeFutureDate() }, ctx);

    expect(result.success).toBe(true);
    expect(result.data?.count).toBe(2);
    const times = result.data?.times as Array<{ time_24h: string }>;
    expect(times.map((t) => t.time_24h)).toEqual(["09:00:00", "11:00:00"]);
  });

  /* ---------- 4. All slots fully booked ---------- */
  it("returns no-availability message when all slots have zero available_count", async () => {
    const slots = [
      slot("09:00:00", 0),
      slot("09:15:00", 0),
      slot("10:00:00", 0),
    ];
    (ctx.supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: slots,
      error: null,
    });

    const result = await processCheckAvailability({ date: makeFutureDate() }, ctx);

    expect(result.success).toBe(true);
    expect(result.data?.available).toBe(false);
    expect(result.data?.times).toEqual([]);
    expect(result.message).toContain("don't have any appointments available");
  });

  /* ---------- 5. Blocked slots filtered out ---------- */
  it("filters out blocked slots even if available_count > 0", async () => {
    const slots = [
      slot("08:00:00", 2, { is_blocked: true, block_reason: "Early Morning - No VAPI Booking" }),
      slot("08:15:00", 3, { is_blocked: true, block_reason: "Early Morning - No VAPI Booking" }),
      slot("09:00:00", 2),
      slot("09:15:00", 1),
    ];
    (ctx.supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: slots,
      error: null,
    });

    const result = await processCheckAvailability({ date: makeFutureDate() }, ctx);

    expect(result.success).toBe(true);
    expect(result.data?.available).toBe(true);
    const times = result.data?.times as Array<{ time_24h: string }>;
    expect(times).toHaveLength(2);
    expect(times.map((t) => t.time_24h)).toEqual(["09:00:00", "09:15:00"]);
  });

  /* ---------- 6. Handles RPC error gracefully ---------- */
  it("returns error response when RPC fails", async () => {
    (ctx.supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: null,
      error: { message: "connection timeout", code: "PGRST000" },
    });

    const result = await processCheckAvailability({ date: makeFutureDate() }, ctx);

    expect(result.success).toBe(false);
    expect(result.error).toBe("database_error");
    expect(result.message).toContain("trouble seeing the calendar");
    expect(ctx.logger.error).toHaveBeenCalled();
  });

  /* ---------- 7. Rejects past dates ---------- */
  it("returns past_date error for dates before today", async () => {
    const result = await processCheckAvailability({ date: "2020-01-01" }, ctx);

    expect(result.success).toBe(false);
    expect(result.error).toBe("past_date");
    expect(result.message).toContain("today or future dates");
  });

  /* ---------- 8. Uses pims_clinic_id when set ---------- */
  it("calls RPC with pims_clinic_id instead of clinic.id when set", async () => {
    const pimsClinicId = "pims-clinic-uuid-99";
    ctx = makeCtx({
      clinic: makeClinic({ pims_clinic_id: pimsClinicId }),
    });
    (ctx.supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [slot("09:00:00", 2)],
      error: null,
    });

    const futureDate = makeFutureDate();
    await processCheckAvailability({ date: futureDate }, ctx);

    expect(ctx.supabase.rpc).toHaveBeenCalledWith("get_available_slots", {
      p_clinic_id: pimsClinicId,
      p_date: futureDate,
    });
  });

  /* ---------- 9. Uses clinic.id when pims_clinic_id is null ---------- */
  it("calls RPC with clinic.id when pims_clinic_id is null", async () => {
    (ctx.supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [slot("09:00:00", 1)],
      error: null,
    });

    const futureDate = makeFutureDate();
    await processCheckAvailability({ date: futureDate }, ctx);

    expect(ctx.supabase.rpc).toHaveBeenCalledWith("get_available_slots", {
      p_clinic_id: "clinic-uuid-1",
      p_date: futureDate,
    });
  });

  /* ---------- 10. Returns clinic_not_found when clinic is null ---------- */
  it("returns clinic_not_found error when clinic is null", async () => {
    ctx = makeCtx({ clinic: null });

    const result = await processCheckAvailability({ date: makeFutureDate() }, ctx);

    expect(result.success).toBe(false);
    expect(result.error).toBe("clinic_not_found");
  });
});

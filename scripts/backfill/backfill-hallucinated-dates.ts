#!/usr/bin/env npx tsx
/**
 * Backfill Hallucinated Appointment Dates
 *
 * Description: Fixes inbound_vapi_calls where structured_data.appointment is
 * missing or has incorrect dates by joining with appointment_bookings to get
 * the real booking date/time.
 *
 * Usage: pnpm tsx scripts/backfill/backfill-hallucinated-dates.ts [options]
 *
 * Options:
 *   --dry-run     Show what would happen without making changes
 *   --verbose     Show detailed output
 *   --limit=N     Limit number of records to process
 *   --days=N      Filter to last N days (default: 90)
 *
 * Environment:
 *   SUPABASE_SERVICE_ROLE_KEY - Required for database access
 *
 * Examples:
 *   pnpm tsx scripts/backfill/backfill-hallucinated-dates.ts --dry-run
 *   pnpm tsx scripts/backfill/backfill-hallucinated-dates.ts --days=30 --verbose
 */

import {
  loadScriptEnv,
  parseScriptArgs,
  createScriptSupabaseClient,
  scriptLog,
} from "@odis-ai/shared/script-utils";

loadScriptEnv({ required: ["SUPABASE_SERVICE_ROLE_KEY"] });

const args = parseScriptArgs({
  flags: {},
});

async function main(): Promise<void> {
  scriptLog.header("Backfill Hallucinated Appointment Dates");

  const supabase = createScriptSupabaseClient();
  const days = args.days ?? 90;

  if (args.dryRun) {
    scriptLog.dryRun("Running in dry-run mode - no changes will be made");
  }

  scriptLog.info(
    `Finding V2 bookings with missing structured_data.appointment (last ${days} days)...`,
  );

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Find appointment_bookings that have a matching inbound_vapi_calls record
  // but where structured_data.appointment is missing
  let query = supabase
    .from("appointment_bookings")
    .select(
      "id, vapi_call_id, client_name, client_phone, patient_name, species, reason, date, start_time, status, confirmation_number",
    )
    .not("vapi_call_id", "is", null)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (args.limit) {
    query = query.limit(args.limit);
  }

  const { data: bookings, error } = await query;

  if (error) {
    scriptLog.error("Failed to fetch bookings:", error.message);
    throw error;
  }

  if (!bookings || bookings.length === 0) {
    scriptLog.info("No bookings found to process");
    return;
  }

  scriptLog.info(`Found ${bookings.length} bookings to check`);

  let updated = 0;
  let skipped = 0;
  let alreadyCorrect = 0;

  for (const booking of bookings) {
    // Fetch the corresponding inbound_vapi_calls record
    const { data: call, error: callError } = await supabase
      .from("inbound_vapi_calls")
      .select("id, vapi_call_id, structured_data, outcome")
      .eq("vapi_call_id", booking.vapi_call_id!)
      .single();

    if (callError || !call) {
      skipped++;
      if (args.verbose) {
        scriptLog.debug(
          `Skipping booking ${booking.id} — no matching inbound call for vapi_call_id=${booking.vapi_call_id}`,
        );
      }
      continue;
    }

    const structuredData = call.structured_data as Record<
      string,
      unknown
    > | null;
    const appointment = structuredData?.appointment as Record<
      string,
      unknown
    > | null;

    // Check if appointment data already matches
    if (appointment?.date === booking.date && appointment?.time === booking.start_time) {
      alreadyCorrect++;
      if (args.verbose) {
        scriptLog.debug(
          `Skipping ${call.id} — appointment data already correct (${booking.date} ${booking.start_time})`,
        );
      }
      continue;
    }

    if (args.verbose) {
      scriptLog.info(
        `${call.id}: current appointment.date=${appointment?.date ?? "null"} → ${booking.date}, time=${appointment?.time ?? "null"} → ${booking.start_time}`,
      );
    }

    // Build updated structured data
    const updatedStructuredData = {
      ...(structuredData ?? {}),
      appointment: {
        ...(appointment ?? {}),
        date: booking.date,
        time: booking.start_time,
        client_name: booking.client_name,
        client_phone: booking.client_phone,
        patient_name: booking.patient_name,
        reason: booking.reason,
        species: booking.species,
        booking_id: booking.id,
        confirmation_number: booking.confirmation_number,
        booked_at:
          (appointment?.booked_at as string) ?? new Date().toISOString(),
      },
    };

    if (args.dryRun) {
      scriptLog.dryRun(
        `Would update ${call.id}: appointment.date=${booking.date}, time=${booking.start_time}`,
      );
    } else {
      const { error: updateError } = await supabase
        .from("inbound_vapi_calls")
        .update({
          structured_data: updatedStructuredData,
          outcome: call.outcome ?? "Scheduled",
        })
        .eq("id", call.id);

      if (updateError) {
        scriptLog.error(`Failed to update ${call.id}: ${updateError.message}`);
        continue;
      }
    }

    updated++;

    if (bookings.length > 10) {
      scriptLog.progress(updated + skipped + alreadyCorrect, bookings.length);
    }
  }

  scriptLog.divider();
  scriptLog.success(`Updated: ${updated}`);
  if (alreadyCorrect > 0) {
    scriptLog.info(`Already correct: ${alreadyCorrect}`);
  }
  if (skipped > 0) {
    scriptLog.warn(`Skipped (no matching call): ${skipped}`);
  }
  scriptLog.success("Done!");
}

main().catch((error) => {
  scriptLog.error("Script failed:", error);
  process.exit(1);
});

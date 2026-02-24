#!/usr/bin/env npx tsx
/**
 * Update Happy Tails Demo Dates
 *
 * Updates delivery dates for the Happy Tails demo clinic:
 * - scheduled_discharge_calls.ended_at → Feb 5, 2026
 * - scheduled_discharge_calls.started_at → Feb 5, 2026 (a few min before ended_at)
 * - scheduled_discharge_emails.sent_at → Feb 5, 2026
 *
 * The demo story: calls were discharged on Feb 2, emails/calls delivered on Feb 5.
 *
 * Usage: pnpm tsx scripts/backfill/update-happy-tails-demo-dates.ts [options]
 *
 * Options:
 *   --dry-run     Show what would happen without making changes
 *   --verbose     Show detailed output
 *
 * Environment:
 *   SUPABASE_SERVICE_ROLE_KEY - Required for database access
 */

import {
  loadScriptEnv,
  parseScriptArgs,
  createScriptSupabaseClient,
  scriptLog,
} from "@odis-ai/shared/script-utils";

loadScriptEnv({ required: ["SUPABASE_SERVICE_ROLE_KEY"] });

const args = parseScriptArgs({});

/** Target delivery date: Feb 5, 2026 at various times (PST) */
const DELIVERY_DATE_BASE = "2026-02-05";

async function main(): Promise<void> {
  scriptLog.header("Update Happy Tails Demo Dates");

  const supabase = createScriptSupabaseClient();

  if (args.dryRun) {
    scriptLog.dryRun("Running in dry-run mode - no changes will be made");
  }

  // 1. Find Happy Tails clinic
  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .select("id, name, slug")
    .or("slug.eq.happy-tails,slug.eq.happy-tails-veterinary-clinic")
    .single();

  if (clinicError || !clinic) {
    scriptLog.error(
      "Could not find Happy Tails clinic:",
      clinicError?.message ?? "No results",
    );

    // Try broader search
    const { data: allClinics } = await supabase
      .from("clinics")
      .select("id, name, slug")
      .ilike("name", "%happy%tails%");

    if (allClinics?.length) {
      scriptLog.info("Found clinics matching 'happy tails':");
      for (const c of allClinics) {
        scriptLog.info(`  ${c.name} (slug: ${c.slug}, id: ${c.id})`);
      }
    }
    return;
  }

  scriptLog.info(`Found clinic: ${clinic.name} (id: ${clinic.id})`);

  // 2. Get user IDs for this clinic
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id")
    .eq("clinic_id", clinic.id);

  if (usersError || !users?.length) {
    // Try via clinic_users join table
    const { data: clinicUsers } = await supabase
      .from("clinic_users")
      .select("user_id")
      .eq("clinic_id", clinic.id);

    if (!clinicUsers?.length) {
      scriptLog.error("No users found for this clinic");
      return;
    }

    const userIds = clinicUsers.map((u) => u.user_id);
    scriptLog.info(`Found ${userIds.length} users via clinic_users table`);
    await updateCasesForUsers(supabase, userIds);
    return;
  }

  const userIds = users.map((u) => u.id);
  scriptLog.info(`Found ${userIds.length} users for clinic`);
  await updateCasesForUsers(supabase, userIds);
}

async function updateCasesForUsers(
  supabase: ReturnType<typeof createScriptSupabaseClient>,
  userIds: string[],
): Promise<void> {
  // 3. Get all cases for these users
  const { data: cases, error: casesError } = await supabase
    .from("cases")
    .select(
      `
      id,
      created_at,
      scheduled_discharge_calls (id, ended_at, started_at, status),
      scheduled_discharge_emails (id, sent_at, status)
    `,
    )
    .in("user_id", userIds);

  if (casesError) {
    scriptLog.error("Failed to fetch cases:", casesError.message);
    return;
  }

  if (!cases?.length) {
    scriptLog.info("No cases found for these users");
    return;
  }

  scriptLog.info(`Found ${cases.length} cases`);

  let callsUpdated = 0;
  let emailsUpdated = 0;

  for (const caseRow of cases) {
    const calls = (
      caseRow as unknown as {
        scheduled_discharge_calls: Array<{
          id: string;
          ended_at: string | null;
          started_at: string | null;
          status: string;
        }>;
      }
    ).scheduled_discharge_calls;
    const emails = (
      caseRow as unknown as {
        scheduled_discharge_emails: Array<{
          id: string;
          sent_at: string | null;
          status: string;
        }>;
      }
    ).scheduled_discharge_emails;

    // Update calls
    if (calls?.length) {
      for (const call of calls) {
        if (call.ended_at || call.status === "completed") {
          // Set ended_at to Feb 5 at a random morning time (9am-11am PST = 17:00-19:00 UTC)
          const hour = 17 + Math.floor(Math.random() * 3);
          const minute = Math.floor(Math.random() * 60);
          const endedAt = `${DELIVERY_DATE_BASE}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`;
          // started_at = 2-4 minutes before ended_at
          const startedAt = new Date(
            new Date(endedAt).getTime() -
              (120 + Math.floor(Math.random() * 120)) * 1000,
          ).toISOString();

          if (args.verbose) {
            scriptLog.debug(
              `Call ${call.id}: ended_at ${call.ended_at} → ${endedAt}`,
            );
          }

          if (!args.dryRun) {
            const { error } = await supabase
              .from("scheduled_discharge_calls")
              .update({ ended_at: endedAt, started_at: startedAt })
              .eq("id", call.id);

            if (error) {
              scriptLog.error(
                `Failed to update call ${call.id}:`,
                error.message,
              );
              continue;
            }
          } else {
            scriptLog.dryRun(
              `Would update call ${call.id}: ended_at → ${endedAt}`,
            );
          }

          callsUpdated++;
        }
      }
    }

    // Update emails
    if (emails?.length) {
      for (const email of emails) {
        if (email.sent_at || email.status === "sent") {
          // Set sent_at to Feb 5 at a random morning time (matching call time roughly)
          const hour = 17 + Math.floor(Math.random() * 3);
          const minute = Math.floor(Math.random() * 60);
          const sentAt = `${DELIVERY_DATE_BASE}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`;

          if (args.verbose) {
            scriptLog.debug(
              `Email ${email.id}: sent_at ${email.sent_at} → ${sentAt}`,
            );
          }

          if (!args.dryRun) {
            const { error } = await supabase
              .from("scheduled_discharge_emails")
              .update({ sent_at: sentAt })
              .eq("id", email.id);

            if (error) {
              scriptLog.error(
                `Failed to update email ${email.id}:`,
                error.message,
              );
              continue;
            }
          } else {
            scriptLog.dryRun(
              `Would update email ${email.id}: sent_at → ${sentAt}`,
            );
          }

          emailsUpdated++;
        }
      }
    }
  }

  scriptLog.divider();
  scriptLog.success(`Calls updated: ${callsUpdated}`);
  scriptLog.success(`Emails updated: ${emailsUpdated}`);
  scriptLog.success("Done!");
}

main().catch((error) => {
  scriptLog.error("Script failed:", error);
  process.exit(1);
});

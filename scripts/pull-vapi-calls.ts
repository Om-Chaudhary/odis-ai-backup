/**
 * Pull Vapi Calls Script
 *
 * Fetches calls from Vapi for a specified time period.
 * Usage: tsx scripts/pull-vapi-calls.ts [--days=1] [--limit=100]
 */

/* eslint-disable @nx/enforce-module-boundaries */
import { listCalls } from "@odis-ai/vapi";

interface CallSummary {
  id: string;
  type: string;
  status: string;
  phoneNumber?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: string;
  endedReason?: string;
  transcript?: string;
  recordingUrl?: string;
  totalCost?: number;
  createdAt: string;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const daysArg = args.find((arg) => arg.startsWith("--days="));
  const limitArg = args.find((arg) => arg.startsWith("--limit="));

  const days = daysArg ? parseInt(daysArg.split("=")[1]) : 1;
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : 100;

  console.log(`\n📞 Fetching Vapi calls from the last ${days} day(s)...\n`);

  // Calculate date range (last N days)
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  try {
    // Fetch calls from Vapi
    const calls = await listCalls({
      createdAtGe: startDate,
      limit: limit,
    });

    console.log(`✅ Found ${calls.length} call(s)\n`);

    if (calls.length === 0) {
      console.log("No calls found in the specified time period.");
      return;
    }

    // Transform to summary format
    const summaries: CallSummary[] = calls.map((call) => {
      const duration =
        call.startedAt && call.endedAt
          ? calculateDuration(call.startedAt, call.endedAt)
          : undefined;

      const totalCost = call.costs?.reduce((sum, cost) => sum + cost.amount, 0);

      return {
        id: call.id,
        type: call.type,
        status: call.status,
        phoneNumber: call.customer?.number ?? call.phoneNumber?.number,
        startedAt: call.startedAt,
        endedAt: call.endedAt,
        duration,
        endedReason: call.endedReason,
        transcript: call.transcript,
        recordingUrl: call.recordingUrl,
        totalCost,
        createdAt: call.createdAt,
      };
    });

    // Display summary table
    console.log("📊 Call Summary:\n");
    console.log("─".repeat(120));
    console.log(
      "ID".padEnd(30) +
        "Type".padEnd(15) +
        "Status".padEnd(12) +
        "Phone".padEnd(18) +
        "Duration".padEnd(12) +
        "Cost".padEnd(10) +
        "Created",
    );
    console.log("─".repeat(120));

    summaries.forEach((call) => {
      const id = call.id.substring(0, 27) + "...";
      const phone = call.phoneNumber ?? "N/A";
      const duration = call.duration ?? "N/A";
      const cost = call.totalCost ? `$${call.totalCost.toFixed(4)}` : "N/A";
      const created = new Date(call.createdAt).toLocaleString();

      console.log(
        id.padEnd(30) +
          call.type.padEnd(15) +
          call.status.padEnd(12) +
          phone.padEnd(18) +
          duration.padEnd(12) +
          cost.padEnd(10) +
          created,
      );
    });

    console.log("─".repeat(120));

    // Display statistics
    const totalCost = summaries.reduce(
      (sum, call) => sum + (call.totalCost ?? 0),
      0,
    );
    const completedCalls = summaries.filter((c) => c.status === "ended").length;
    const inProgressCalls = summaries.filter(
      (c) => c.status === "in-progress",
    ).length;
    const failedCalls = summaries.filter(
      (c) =>
        c.endedReason && c.endedReason !== "pipeline-error-openai-voice-failed",
    ).length;

    console.log("\n📈 Statistics:");
    console.log(`   Total Calls: ${calls.length}`);
    console.log(`   Completed: ${completedCalls}`);
    console.log(`   In Progress: ${inProgressCalls}`);
    console.log(`   Failed: ${failedCalls}`);
    console.log(`   Total Cost: $${totalCost.toFixed(4)}`);

    // Display detailed view if there are few calls
    if (calls.length <= 5) {
      console.log("\n📝 Detailed Call Information:\n");
      summaries.forEach((call, index) => {
        console.log(`\n[${index + 1}] Call ID: ${call.id}`);
        console.log(`    Type: ${call.type}`);
        console.log(`    Status: ${call.status}`);
        console.log(`    Phone: ${call.phoneNumber ?? "N/A"}`);
        console.log(
          `    Created: ${new Date(call.createdAt).toLocaleString()}`,
        );
        if (call.startedAt)
          console.log(
            `    Started: ${new Date(call.startedAt).toLocaleString()}`,
          );
        if (call.endedAt)
          console.log(`    Ended: ${new Date(call.endedAt).toLocaleString()}`);
        if (call.duration) console.log(`    Duration: ${call.duration}`);
        if (call.endedReason)
          console.log(`    Ended Reason: ${call.endedReason}`);
        if (call.totalCost)
          console.log(`    Cost: $${call.totalCost.toFixed(4)}`);
        if (call.recordingUrl)
          console.log(`    Recording: ${call.recordingUrl}`);
        if (call.transcript) {
          console.log(
            `    Transcript Preview: ${call.transcript.substring(0, 200)}...`,
          );
        }
      });
    }

    // Export to JSON option
    const exportArg = args.find((arg) => arg.startsWith("--export="));
    if (exportArg) {
      const filename = exportArg.split("=")[1];
      const fs = await import("fs");
      fs.writeFileSync(filename, JSON.stringify(summaries, null, 2));
      console.log(`\n💾 Exported calls to ${filename}`);
    }

    console.log("\n✨ Done!\n");
  } catch (error) {
    console.error("\n❌ Error fetching calls:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
    process.exit(1);
  }
}

function calculateDuration(startedAt: string, endedAt: string): string {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const durationMs = end.getTime() - start.getTime();

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

// Run the script
void main();

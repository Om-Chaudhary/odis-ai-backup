#!/usr/bin/env node
/**
 * IDEXX Sync CLI
 *
 * Interactive terminal UI for managing IDEXX schedule syncs.
 * Run alongside the API server (main.ts) to trigger syncs and view status.
 *
 * Usage: pnpm --filter idexx-sync cli
 */

import { select, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import figlet from "figlet";
import ora from "ora";
import Table from "cli-table3";

const API_BASE_URL = process.env.IDEXX_SYNC_API_URL ?? "http://localhost:5050";

// ============================================================================
// Utilities
// ============================================================================

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes === 1) return "1 minute ago";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

// ============================================================================
// API Functions
// ============================================================================

async function checkApiConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function getHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error(`Health check failed: ${response.statusText}`);
  return response.json();
}

async function triggerScheduleSync(clinicId, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/idexx/schedule-sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clinicId, ...options }),
  });
  return response.json();
}

async function getSyncStatus(clinicId) {
  const response = await fetch(`${API_BASE_URL}/api/idexx/schedule-sync/status?clinicId=${clinicId}`);
  if (!response.ok) throw new Error(`Failed to get sync status: ${response.statusText}`);
  return response.json();
}

async function fetchClinics() {
  const { createServiceClient } = await import("@odis-ai/data-access/db");
  const supabase = await createServiceClient();

  const { data: credentials, error: credError } = await supabase
    .from("idexx_credentials")
    .select("clinic_id")
    .eq("is_active", true);

  if (credError) throw new Error(`Failed to fetch credentials: ${credError.message}`);

  const clinicIds = credentials?.map((c) => c.clinic_id) ?? [];
  if (clinicIds.length === 0) return [];

  const { data: clinics, error: clinicError } = await supabase
    .from("clinics")
    .select("id, name")
    .in("id", clinicIds)
    .order("name");

  if (clinicError) throw new Error(`Failed to fetch clinics: ${clinicError.message}`);

  const { data: syncs } = await supabase
    .from("schedule_syncs")
    .select("clinic_id, completed_at")
    .eq("status", "completed")
    .in("clinic_id", clinicIds)
    .order("completed_at", { ascending: false });

  const syncMap = new Map();
  for (const sync of syncs ?? []) {
    if (!syncMap.has(sync.clinic_id)) {
      syncMap.set(sync.clinic_id, sync.completed_at);
    }
  }

  return (clinics ?? []).map((clinic) => ({
    id: clinic.id,
    name: clinic.name,
    lastSyncAt: syncMap.get(clinic.id) ?? null,
  }));
}

async function fetchSyncHistory(limit = 15) {
  const { createServiceClient } = await import("@odis-ai/data-access/db");
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("schedule_syncs")
    .select(`
      id,
      clinic_id,
      status,
      sync_start_date,
      sync_end_date,
      completed_at,
      duration_ms,
      slots_created,
      appointments_added,
      appointments_updated,
      appointments_removed,
      error_message,
      clinics!inner(name)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch sync history: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    clinicId: row.clinic_id,
    clinicName: row.clinics?.name ?? "Unknown",
    status: row.status,
    syncStartDate: row.sync_start_date,
    syncEndDate: row.sync_end_date,
    completedAt: row.completed_at,
    durationMs: row.duration_ms,
    slotsCreated: row.slots_created ?? 0,
    appointmentsAdded: row.appointments_added ?? 0,
    appointmentsUpdated: row.appointments_updated ?? 0,
    appointmentsRemoved: row.appointments_removed ?? 0,
    errorMessage: row.error_message,
  }));
}

// ============================================================================
// UI Components
// ============================================================================

function printHeader(isConnected) {
  console.clear();
  console.log(chalk.cyan(figlet.textSync("IDEXX SYNC", { font: "Small" })));
  console.log(chalk.gray("─".repeat(50)));
  
  if (isConnected === null) {
    console.log(chalk.yellow("◌") + " Checking API connection...");
  } else if (isConnected) {
    console.log(chalk.green("●") + chalk.green(" API Connected") + chalk.gray(` (${API_BASE_URL})`));
  } else {
    console.log(chalk.red("●") + chalk.red(" API Disconnected"));
    console.log(chalk.gray("  Start the server with: ") + chalk.yellow("pnpm --filter idexx-sync start"));
  }
  console.log(chalk.gray("─".repeat(50)));
  console.log();
}

// ============================================================================
// Actions
// ============================================================================

async function handleScheduleSync() {
  const spinner = ora("Loading clinics...").start();
  let clinics;
  
  try {
    clinics = await fetchClinics();
    spinner.stop();
  } catch (error) {
    spinner.fail(`Failed to load clinics: ${error.message}`);
    await pressEnterToContinue();
    return;
  }

  if (clinics.length === 0) {
    console.log(chalk.yellow("\nNo clinics with IDEXX credentials found."));
    console.log(chalk.gray("Add credentials via the dashboard first."));
    await pressEnterToContinue();
    return;
  }

  const clinicId = await select({
    message: "Select a clinic:",
    choices: [
      ...clinics.map((c) => ({
        name: c.lastSyncAt
          ? `${c.name} (synced ${formatRelativeTime(c.lastSyncAt)})`
          : `${c.name} (never synced)`,
        value: c.id,
      })),
      { name: chalk.gray("← Back"), value: "__back__" },
    ],
  });

  if (clinicId === "__back__") return;

  const clinic = clinics.find((c) => c.id === clinicId);
  
  const daysAhead = await select({
    message: "Select sync horizon:",
    choices: [
      { name: "7 days", value: 7 },
      { name: "14 days (default)", value: 14 },
      { name: "21 days", value: 21 },
      { name: "30 days", value: 30 },
    ],
    default: 14,
  });

  const shouldProceed = await confirm({
    message: `Sync ${clinic.name} for ${daysAhead} days ahead?`,
    default: true,
  });

  if (!shouldProceed) return;

  console.log();
  const syncSpinner = ora(`Syncing ${clinic.name}... (this may take up to 2 minutes)`).start();

  try {
    const result = await triggerScheduleSync(clinicId, { daysAhead });

    if (result.success) {
      syncSpinner.succeed(chalk.green("Sync completed successfully!"));
      console.log();
      
      const table = new Table({
        head: [chalk.cyan("Metric"), chalk.cyan("Value")],
        style: { head: [], border: [] },
      });

      table.push(
        ["Sync ID", result.syncId],
        ["Date Range", `${result.dateRange?.start} → ${result.dateRange?.end}`],
        ["Duration", formatDuration(result.durationMs)],
        [chalk.green("Slots Created"), result.stats?.slotsCreated ?? 0],
        [chalk.green("Appointments Added"), result.stats?.appointmentsAdded ?? 0],
        [chalk.blue("Appointments Updated"), result.stats?.appointmentsUpdated ?? 0],
        [chalk.red("Appointments Removed"), result.stats?.appointmentsRemoved ?? 0],
      );

      if (result.stats?.conflictsDetected > 0) {
        table.push(
          [chalk.yellow("Conflicts Detected"), result.stats.conflictsDetected],
          [chalk.green("Conflicts Resolved"), result.stats.conflictsResolved],
        );
      }

      console.log(table.toString());
      
      if (result.nextStaleAt) {
        console.log(chalk.gray(`\nData will be stale at: ${new Date(result.nextStaleAt).toLocaleString()}`));
      }
    } else {
      syncSpinner.fail(chalk.red("Sync failed"));
      console.log(chalk.red(`\nErrors: ${result.errors?.join(", ") || "Unknown error"}`));
    }
  } catch (error) {
    syncSpinner.fail(chalk.red(`Sync failed: ${error.message}`));
  }

  await pressEnterToContinue();
}

async function handleCheckStatus() {
  const spinner = ora("Loading clinics...").start();
  let clinics;

  try {
    clinics = await fetchClinics();
    spinner.stop();
  } catch (error) {
    spinner.fail(`Failed to load clinics: ${error.message}`);
    await pressEnterToContinue();
    return;
  }

  if (clinics.length === 0) {
    console.log(chalk.yellow("\nNo clinics found."));
    await pressEnterToContinue();
    return;
  }

  const clinicId = await select({
    message: "Select a clinic:",
    choices: [
      ...clinics.map((c) => ({ name: c.name, value: c.id })),
      { name: chalk.gray("← Back"), value: "__back__" },
    ],
  });

  if (clinicId === "__back__") return;

  const statusSpinner = ora("Loading sync status...").start();

  try {
    const status = await getSyncStatus(clinicId);
    statusSpinner.stop();
    console.log();

    console.log(`Clinic: ${chalk.green(status.clinicName)}`);
    
    if (status.hasData) {
      if (status.isStale) {
        console.log(chalk.yellow("⚠ Data is STALE"));
      } else {
        console.log(chalk.green("✓ Data is FRESH"));
      }
    } else {
      console.log(chalk.red("✗ No sync data available"));
    }

    console.log(chalk.gray(`\n${status.message}`));

    if (status.freshness) {
      console.log();
      const table = new Table({ style: { head: [], border: [] } });
      table.push(
        [chalk.cyan("Last Synced"), formatRelativeTime(status.freshness.syncedAt)],
        [chalk.cyan("Next Stale At"), new Date(status.freshness.nextStaleAt).toLocaleString()],
        [chalk.cyan("Stale Threshold"), `${status.freshness.staleThresholdMinutes} minutes`],
        [chalk.cyan("Sync Horizon"), `${status.freshness.syncHorizonDays} days`],
      );
      console.log(table.toString());
    }

    if (status.lastSync) {
      console.log();
      console.log(chalk.bold("Last Sync Stats:"));
      const statsTable = new Table({ style: { head: [], border: [] } });
      statsTable.push(
        [chalk.cyan("Date Range"), `${status.lastSync.dateRange.start} → ${status.lastSync.dateRange.end}`],
        [chalk.cyan("Duration"), formatDuration(status.lastSync.durationMs)],
        [chalk.green("Slots Created"), status.lastSync.stats.slotsCreated],
        [chalk.green("Appointments Added"), status.lastSync.stats.appointmentsAdded],
        [chalk.blue("Appointments Updated"), status.lastSync.stats.appointmentsUpdated],
        [chalk.red("Appointments Removed"), status.lastSync.stats.appointmentsRemoved],
      );
      console.log(statsTable.toString());
    }
  } catch (error) {
    statusSpinner.fail(`Failed to load status: ${error.message}`);
  }

  await pressEnterToContinue();
}

async function handleSyncHistory() {
  const spinner = ora("Loading sync history...").start();

  try {
    const history = await fetchSyncHistory();
    spinner.stop();

    if (history.length === 0) {
      console.log(chalk.yellow("\nNo sync history found."));
      await pressEnterToContinue();
      return;
    }

    console.log();
    const table = new Table({
      head: [
        chalk.cyan("Status"),
        chalk.cyan("Clinic"),
        chalk.cyan("Date Range"),
        chalk.cyan("Duration"),
        chalk.cyan("Completed"),
      ],
      style: { head: [], border: [] },
      colWidths: [8, 25, 25, 12, 18],
    });

    for (const record of history) {
      const statusIcon =
        record.status === "completed"
          ? chalk.green("✓")
          : record.status === "failed"
          ? chalk.red("✗")
          : chalk.yellow("◌");

      table.push([
        statusIcon,
        record.clinicName.slice(0, 23),
        `${record.syncStartDate} → ${record.syncEndDate}`,
        record.durationMs ? formatDuration(record.durationMs) : "-",
        record.completedAt ? formatRelativeTime(record.completedAt) : "in progress",
      ]);
    }

    console.log(table.toString());
  } catch (error) {
    spinner.fail(`Failed to load history: ${error.message}`);
  }

  await pressEnterToContinue();
}

async function handleHealthCheck() {
  const spinner = ora("Checking API health...").start();

  try {
    const health = await getHealth();
    spinner.succeed(chalk.green("API Server Healthy"));
    console.log();

    const memoryUsedMB = Math.round(health.memory.used / 1024 / 1024);
    const memoryTotalMB = Math.round(health.memory.total / 1024 / 1024);
    const memoryPercent = Math.round((health.memory.used / health.memory.total) * 100);

    const table = new Table({ style: { head: [], border: [] } });
    table.push(
      [chalk.cyan("Status"), chalk.green(health.status)],
      [chalk.cyan("Uptime"), formatDuration(health.uptime * 1000)],
      [chalk.cyan("Memory"), `${memoryUsedMB} MB / ${memoryTotalMB} MB (${memoryPercent}%)`],
      [chalk.cyan("Last Check"), new Date(health.timestamp).toLocaleTimeString()],
    );
    console.log(table.toString());

    console.log();
    console.log(chalk.bold("Available Endpoints:"));
    console.log(chalk.green("  ✓") + " POST /api/idexx/schedule-sync");
    console.log(chalk.green("  ✓") + " GET  /api/idexx/schedule-sync/status");
    console.log(chalk.green("  ✓") + " GET  /health");
    console.log(chalk.green("  ✓") + " GET  /ready");
  } catch (error) {
    spinner.fail(chalk.red("API Unavailable"));
    console.log(chalk.red(`\n${error.message}`));
    console.log(chalk.gray("\nMake sure the server is running:"));
    console.log(chalk.yellow("  pnpm --filter idexx-sync start"));
  }

  await pressEnterToContinue();
}

async function pressEnterToContinue() {
  await select({
    message: "Press Enter to continue...",
    choices: [{ name: "Continue", value: true }],
  });
}

// ============================================================================
// Main Loop
// ============================================================================

async function main() {
  let isConnected = await checkApiConnection();
  
  while (true) {
    printHeader(isConnected);

    const action = await select({
      message: "Select an action:",
      choices: [
        { name: "📅  Sync Schedule", value: "sync" },
        { name: "📊  Check Sync Status", value: "status" },
        { name: "📜  View Sync History", value: "history" },
        { name: "💚  Health Check", value: "health" },
        { name: "🔄  Refresh Connection", value: "refresh" },
        { name: "🚪  Exit", value: "exit" },
      ],
    });

    console.log();

    switch (action) {
      case "sync":
        await handleScheduleSync();
        break;
      case "status":
        await handleCheckStatus();
        break;
      case "history":
        await handleSyncHistory();
        break;
      case "health":
        await handleHealthCheck();
        break;
      case "refresh":
        const refreshSpinner = ora("Checking connection...").start();
        isConnected = await checkApiConnection();
        refreshSpinner.stop();
        break;
      case "exit":
        console.log(chalk.gray("Goodbye! 👋"));
        process.exit(0);
    }
  }
}

// Run
main().catch((error) => {
  console.error(chalk.red("Fatal error:"), error.message);
  process.exit(1);
});

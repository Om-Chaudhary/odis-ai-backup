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
import cliProgress from "cli-progress";
import logUpdate from "log-update";
import EventSource from "eventsource";

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
  const data = await response.json();
  
  // Enhance with progress info if available
  if (data.lastSync) {
    data.lastSync.progressPercentage = data.lastSync.progress_percentage || 0;
    data.lastSync.currentDate = data.lastSync.current_date;
    data.lastSync.syncId = data.lastSync.id;
  }
  
  return data;
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
  
  // Start sync with detailed progress tracking
  await syncWithProgress(clinicId, clinic.name, daysAhead);
  
  await pressEnterToContinue();
}

/**
 * Execute sync with real-time progress indicators via SSE
 */
async function syncWithProgress(clinicId, clinicName, daysAhead) {
  const startTime = Date.now();
  
  // Log buffer for live feed
  const logLines = [];
  const MAX_LOGS = 10;
  
  // Progress tracking
  let totalDates = daysAhead;
  let datesProcessed = 0;
  
  // Start sync (don't await - we'll connect to stream while it runs)
  console.log(chalk.cyan('\nStarting sync...\n'));
  
  let syncId = null;
  let syncCompleted = false;
  let finalSyncResult = null;
  
  // Start the sync in background
  const syncPromise = triggerScheduleSync(clinicId, { daysAhead }).then(result => {
    syncCompleted = true;
    finalSyncResult = result;
    return result;
  });
  
  // Poll database for the in-progress sync to get syncId
  const { createServiceClient } = await import("@odis-ai/data-access/db");
  const supabase = await createServiceClient();
  
  const spinner = ora('Waiting for sync to start...').start();
  
  for (let attempts = 0; attempts < 20; attempts++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const { data: inProgressSync } = await supabase
        .from("schedule_syncs")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (inProgressSync) {
        syncId = inProgressSync.id;
        spinner.succeed(chalk.green('Sync started!'));
        break;
      }
    } catch (err) {
      // Ignore and retry
    }
  }
  
  if (!syncId) {
    spinner.fail(chalk.red('Could not get sync ID'));
    console.log(chalk.yellow('⚠ Falling back to waiting for completion...'));
    const result = await syncPromise;
    console.log(result.success ? chalk.green('✓ Sync completed') : chalk.red('✗ Sync failed'));
    return;
  }

  console.log(chalk.gray(`Sync ID: ${syncId}`));
  console.log(chalk.cyan('Connecting to live stream...\n'));
  
  // Progress bars
  const phases = {
    config: { value: 0, status: 'Pending...' },
    slots: { value: 0, status: 'Pending...' },
    appointments: { value: 0, status: 'Pending...' },
    reconciliation: { value: 0, status: 'Pending...' },
    conflicts: { value: 0, status: 'Pending...' },
  };

  // Connect to SSE stream
  const eventSource = new EventSource(`${API_BASE_URL}/api/idexx/schedule-sync/stream/${syncId}`);
  
  let isCompleted = false;
  let finalResult = null;

  // Helper to render combined view
  function renderView() {
    let output = '';
    
    // Progress bars section
    output += chalk.bold('┌─ Progress ────────────────────────────────────────┐\n');
    output += renderProgressBar('⚙️  Config    ', phases.config.value, 100, phases.config.status) + '\n';
    output += renderProgressBar('📅 Slots     ', phases.slots.value, 100, phases.slots.status) + '\n';
    output += renderProgressBar('🗓️  Appts     ', phases.appointments.value, totalDates, phases.appointments.status) + '\n';
    output += renderProgressBar('🔄 Reconcile ', phases.reconciliation.value, 100, phases.reconciliation.status) + '\n';
    output += renderProgressBar('⚔️  Conflicts ', phases.conflicts.value, 100, phases.conflicts.status) + '\n';
    output += chalk.bold('└───────────────────────────────────────────────────┘\n\n');
    
    // Log feed section
    output += chalk.bold('┌─ Live Processing Log ─────────────────────────────┐\n');
    if (logLines.length === 0) {
      output += chalk.gray('│ Waiting for events...\n');
    } else {
      for (const line of logLines) {
        output += `│ ${line}\n`;
      }
    }
    output += chalk.bold('└───────────────────────────────────────────────────┘\n');
    
    logUpdate(output);
  }

  function renderProgressBar(label, value, total, status) {
    const percentage = Math.round((value / total) * 100);
    const barLength = 30;
    const filled = Math.round((percentage / 100) * barLength);
    const bar = chalk.cyan('█'.repeat(filled)) + chalk.gray('░'.repeat(barLength - filled));
    return `│ ${label} ${bar} ${percentage}% ${chalk.gray(status)}`;
  }

  function addLog(message, color = chalk.white) {
    logLines.push(color(message));
    if (logLines.length > MAX_LOGS) logLines.shift();
    renderView();
  }

  // Initial render
  renderView();

  // Event handlers
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'connected':
          addLog(`Connected to stream (${data.syncId})`, chalk.green);
          break;
          
        case 'phase':
          addLog(`Phase: ${data.message}`, chalk.yellow);
          if (data.phase === 'config_loaded') {
            phases.config.value = 100;
            phases.config.status = 'Loaded ✓';
          } else if (data.phase === 'slots_generated') {
            phases.slots.value = 100;
            phases.slots.status = `Generated ${data.slotsCreated} slots ✓`;
          } else if (data.phase === 'reconciling') {
            phases.reconciliation.value = 50;
            phases.reconciliation.status = 'Reconciling...';
          } else if (data.phase === 'resolving_conflicts') {
            phases.reconciliation.value = 100;
            phases.reconciliation.status = 'Reconciled ✓';
            phases.conflicts.value = 50;
            phases.conflicts.status = 'Resolving...';
          }
          renderView();
          break;
          
        case 'progress':
          // General progress update
          break;
          
        case 'date_completed':
          datesProcessed++;
          phases.appointments.value = datesProcessed;
          phases.appointments.status = `${datesProcessed}/${totalDates} dates`;
          
          const stats = `${data.appointmentsFound} appts  ${chalk.green(`+${data.added}`)} ${chalk.blue(`↻${data.updated}`)} ${chalk.red(`-${data.removed}`)}`;
          addLog(`${chalk.green('✓')} ${data.date}  ${stats}`);
          break;
          
        case 'completed':
          isCompleted = true;
          finalResult = data;
          phases.reconciliation.value = 100;
          phases.reconciliation.status = 'Reconciled ✓';
          phases.conflicts.value = 100;
          phases.conflicts.status = 'Resolved ✓';
          addLog('Sync completed!', chalk.green.bold);
          renderView();
          eventSource.close();
          break;
          
        case 'error':
          addLog(`Error: ${data.message}`, chalk.red);
          eventSource.close();
          break;
      }
    } catch (err) {
      addLog(`Parse error: ${err.message}`, chalk.red);
    }
  };

  eventSource.onerror = (error) => {
    addLog('Stream connection error', chalk.red);
    eventSource.close();
  };

  // Wait for completion
  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (isCompleted || syncCompleted || !eventSource || eventSource.readyState === 2) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 500);
    
    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      eventSource.close();
      resolve();
    }, 300000);
  });

  // Ensure we have the final result
  if (!finalResult && finalSyncResult) {
    finalResult = {
      syncId: finalSyncResult.syncId,
      success: finalSyncResult.success,
      stats: finalSyncResult.stats,
      durationMs: finalSyncResult.durationMs,
      errors: finalSyncResult.errors,
    };
  }

  logUpdate.done();
  console.log();

  // Show final results
  if (finalResult && finalResult.success) {
    console.log(chalk.green.bold('✓ Sync completed successfully!'));
    console.log(chalk.gray(`  Completed in ${formatDuration(finalResult.durationMs)}`));
    console.log();
    
    const table = new Table({
      head: [chalk.cyan("Metric"), chalk.cyan("Value")],
      style: { head: [], border: [] },
    });

    table.push(
      ["Sync ID", finalResult.syncId],
      ["Duration", formatDuration(finalResult.durationMs)],
      [chalk.green("Slots Created"), finalResult.stats?.slotsCreated ?? 0],
      [chalk.green("Appointments Added"), finalResult.stats?.appointmentsAdded ?? 0],
      [chalk.blue("Appointments Updated"), finalResult.stats?.appointmentsUpdated ?? 0],
      [chalk.red("Appointments Removed"), finalResult.stats?.appointmentsRemoved ?? 0],
    );

    if (finalResult.stats?.conflictsDetected > 0) {
      table.push(
        [chalk.yellow("Conflicts Detected"), finalResult.stats.conflictsDetected],
        [chalk.green("Conflicts Resolved"), finalResult.stats.conflictsResolved],
      );
    }

    console.log(table.toString());
  } else if (finalSyncResult) {
    // Use the actual sync result if SSE didn't provide final stats
    console.log(finalSyncResult.success ? chalk.green.bold('✓ Sync completed successfully!') : chalk.red.bold('✗ Sync failed'));
    
    if (finalSyncResult.success) {
      console.log(chalk.gray(`  Completed in ${formatDuration(finalSyncResult.durationMs)}`));
      console.log();
      
      const table = new Table({
        head: [chalk.cyan("Metric"), chalk.cyan("Value")],
        style: { head: [], border: [] },
      });

      table.push(
        ["Sync ID", finalSyncResult.syncId],
        ["Duration", formatDuration(finalSyncResult.durationMs)],
        [chalk.green("Slots Created"), finalSyncResult.stats?.slotsCreated ?? 0],
        [chalk.green("Appointments Added"), finalSyncResult.stats?.appointmentsAdded ?? 0],
        [chalk.blue("Appointments Updated"), finalSyncResult.stats?.appointmentsUpdated ?? 0],
        [chalk.red("Appointments Removed"), finalSyncResult.stats?.appointmentsRemoved ?? 0],
      );

      console.log(table.toString());
    } else if (finalSyncResult.errors) {
      console.log(chalk.red(`Errors: ${finalSyncResult.errors.join(", ")}`));
      }
    } else {
    console.log(chalk.red.bold('✗ Sync failed or timed out'));
  }
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

  const viewMode = await select({
    message: "Select view mode:",
    choices: [
      { name: "📊 Static Status", value: "static" },
      { name: "📡 Live Status (real-time)", value: "live" },
      { name: chalk.gray("← Back"), value: "__back__" },
    ],
  });

  if (viewMode === "__back__") return;

  if (viewMode === "live") {
    await handleLiveStatus(clinicId);
  } else {
    await handleStaticStatus(clinicId);
  }

  await pressEnterToContinue();
}

/**
 * Static status view (one-time snapshot)
 */
async function handleStaticStatus(clinicId) {
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
}

/**
 * Live status view (real-time updates)
 */
async function handleLiveStatus(clinicId) {
  console.log(chalk.cyan("\n🔄 Live Status Monitor"));
  console.log(chalk.gray("Press Ctrl+C to exit\n"));

  let lastStatus = null;
  
  const updateInterval = setInterval(async () => {
    try {
      const status = await getSyncStatus(clinicId);
      
      // Build output
      let output = "";
      output += chalk.bold(`Clinic: ${status.clinicName}\n`);
      output += chalk.gray(`Updated: ${new Date().toLocaleTimeString()}\n\n`);
      
      // Current status
      if (status.hasData) {
        if (status.isStale) {
          output += chalk.yellow("⚠ Data Status: STALE\n");
        } else {
          output += chalk.green("✓ Data Status: FRESH\n");
        }
      } else {
        output += chalk.red("✗ No sync data available\n");
      }
      
      // Freshness info
      if (status.freshness) {
        output += chalk.gray(`Last synced: ${formatRelativeTime(status.freshness.syncedAt)}\n`);
        output += chalk.gray(`Next stale at: ${new Date(status.freshness.nextStaleAt).toLocaleString()}\n`);
      }
      
      output += "\n";
      
      // Active sync progress
      if (status.lastSync && status.lastSync.status === "in_progress") {
        output += chalk.cyan.bold("🔄 Sync In Progress\n");
        const progress = status.lastSync.progressPercentage || 0;
        const barLength = 30;
        const filled = Math.round((progress / 100) * barLength);
        const bar = "█".repeat(filled) + "░".repeat(barLength - filled);
        output += chalk.cyan(`${bar} ${progress}%\n`);
        
        if (status.lastSync.currentDate) {
          output += chalk.gray(`Processing: ${status.lastSync.currentDate}\n`);
        }
        output += "\n";
      }
      
      // Latest stats
      if (status.lastSync && status.lastSync.stats) {
        output += chalk.bold("Latest Stats:\n");
        output += chalk.green(`  ✓ Slots: ${status.lastSync.stats.slotsCreated || 0}\n`);
        output += chalk.green(`  ✓ Added: ${status.lastSync.stats.appointmentsAdded || 0}\n`);
        output += chalk.blue(`  ↻ Updated: ${status.lastSync.stats.appointmentsUpdated || 0}\n`);
        output += chalk.red(`  ✗ Removed: ${status.lastSync.stats.appointmentsRemoved || 0}\n`);
      }
      
      // Update display
      logUpdate(output);
      lastStatus = status;
    } catch (error) {
      logUpdate(chalk.red(`Error: ${error.message}\n`) + chalk.gray("Press Ctrl+C to exit"));
    }
  }, 2000);

  // Initial fetch
  try {
    const status = await getSyncStatus(clinicId);
    lastStatus = status;
  } catch (error) {
    console.log(chalk.red(`Error: ${error.message}`));
  }

  // Wait for user interrupt
  return new Promise((resolve) => {
    process.on('SIGINT', () => {
      clearInterval(updateInterval);
      logUpdate.clear();
      console.log(chalk.gray("\nLive monitor stopped."));
      resolve();
    });
  });
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
    console.log(chalk.bold(`Sync History (${history.length} records)\n`));

    const table = new Table({
      head: [
        chalk.cyan("Status"),
        chalk.cyan("Clinic"),
        chalk.cyan("Date Range"),
        chalk.cyan("Stats"),
        chalk.cyan("Duration"),
        chalk.cyan("Completed"),
      ],
      style: { head: [], border: [] },
      colWidths: [8, 20, 22, 25, 10, 18],
    });

    for (const record of history) {
      const statusIcon =
        record.status === "completed"
          ? chalk.green("✓")
          : record.status === "failed"
          ? chalk.red("✗")
          : record.status === "in_progress"
          ? chalk.yellow("⟳")
          : chalk.gray("◌");

      // Build stats summary
      let stats = "";
      if (record.status === "completed") {
        const added = record.appointmentsAdded || 0;
        const updated = record.appointmentsUpdated || 0;
        const removed = record.appointmentsRemoved || 0;
        stats = chalk.green(`+${added}`) + " " + 
                chalk.blue(`↻${updated}`) + " " + 
                chalk.red(`-${removed}`);
      } else if (record.status === "in_progress") {
        stats = chalk.yellow("Syncing...");
      } else if (record.errorMessage) {
        stats = chalk.red(record.errorMessage.slice(0, 20));
      }

      table.push([
        statusIcon,
        record.clinicName.slice(0, 18),
        `${record.syncStartDate} → ${record.syncEndDate}`,
        stats,
        record.durationMs ? formatDuration(record.durationMs) : "-",
        record.completedAt ? formatRelativeTime(record.completedAt) : chalk.yellow("running"),
      ]);
    }

    console.log(table.toString());

    // Summary stats
    const completed = history.filter(h => h.status === "completed").length;
    const failed = history.filter(h => h.status === "failed").length;
    const inProgress = history.filter(h => h.status === "in_progress").length;
    
    console.log();
    console.log(chalk.bold("Summary:"));
    console.log(`  ${chalk.green("✓")} Completed: ${completed}`);
    console.log(`  ${chalk.red("✗")} Failed: ${failed}`);
    if (inProgress > 0) {
      console.log(`  ${chalk.yellow("⟳")} In Progress: ${inProgress}`);
    }
    
    // Calculate success rate
    const total = completed + failed;
    if (total > 0) {
      const successRate = Math.round((completed / total) * 100);
      const rateColor = successRate >= 90 ? chalk.green : successRate >= 70 ? chalk.yellow : chalk.red;
      console.log(`  ${rateColor("Success Rate:")} ${successRate}%`);
    }
  } catch (error) {
    spinner.fail(`Failed to load history: ${error.message}`);
  }

  await pressEnterToContinue();
}

async function handleHealthCheck() {
  const viewMode = await select({
    message: "Health check mode:",
    choices: [
      { name: "📊 Quick Check", value: "quick" },
      { name: "📡 Live Monitor", value: "live" },
      { name: chalk.gray("← Back"), value: "__back__" },
    ],
  });

  if (viewMode === "__back__") return;

  if (viewMode === "live") {
    await handleLiveHealthMonitor();
  } else {
    await handleQuickHealthCheck();
  }

  await pressEnterToContinue();
}

/**
 * Quick health check (one-time)
 */
async function handleQuickHealthCheck() {
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
}

/**
 * Live health monitor with real-time metrics
 */
async function handleLiveHealthMonitor() {
  console.log(chalk.cyan("\n🔄 Live Health Monitor"));
  console.log(chalk.gray("Press Ctrl+C to exit\n"));

  const memoryHistory = [];
  const maxHistoryLength = 20;

  const updateInterval = setInterval(async () => {
    try {
      const health = await getHealth();
      
      const memoryUsedMB = Math.round(health.memory.used / 1024 / 1024);
      const memoryTotalMB = Math.round(health.memory.total / 1024 / 1024);
      const memoryPercent = Math.round((health.memory.used / health.memory.total) * 100);
      
      // Track memory history
      memoryHistory.push(memoryPercent);
      if (memoryHistory.length > maxHistoryLength) {
        memoryHistory.shift();
      }

      // Build output
      let output = "";
      output += chalk.bold("API Health Status\n");
      output += chalk.gray(`Updated: ${new Date().toLocaleTimeString()}\n\n`);
      
      // Status indicator
      output += chalk.green("● ") + chalk.bold("Server Status: ") + chalk.green("HEALTHY\n");
      output += chalk.gray(`Uptime: ${formatDuration(health.uptime * 1000)}\n\n`);
      
      // Memory usage
      output += chalk.bold("Memory Usage:\n");
      output += `  ${memoryUsedMB} MB / ${memoryTotalMB} MB (${memoryPercent}%)\n`;
      
      // Memory usage bar
      const barLength = 40;
      const filled = Math.round((memoryPercent / 100) * barLength);
      const memColor = memoryPercent > 80 ? chalk.red : memoryPercent > 60 ? chalk.yellow : chalk.green;
      const bar = memColor("█".repeat(filled)) + chalk.gray("░".repeat(barLength - filled));
      output += `  ${bar}\n\n`;
      
      // Memory trend (mini sparkline)
      if (memoryHistory.length > 1) {
        output += chalk.bold("Memory Trend:\n  ");
        for (let i = 0; i < memoryHistory.length; i++) {
          const val = memoryHistory[i];
          const char = val > 80 ? "█" : val > 60 ? "▓" : val > 40 ? "▒" : "░";
          const color = val > 80 ? chalk.red : val > 60 ? chalk.yellow : chalk.green;
          output += color(char);
        }
        output += chalk.gray(` (${memoryHistory.length}s history)\n`);
      }
      
      // Update display
      logUpdate(output);
    } catch (error) {
      logUpdate(
        chalk.red("● ") + chalk.bold("Server Status: ") + chalk.red("OFFLINE\n") +
        chalk.gray(`Error: ${error.message}\n`) +
        chalk.gray("Press Ctrl+C to exit")
      );
    }
  }, 1000);

  // Wait for user interrupt
  return new Promise((resolve) => {
    process.on('SIGINT', () => {
      clearInterval(updateInterval);
      logUpdate.clear();
      console.log(chalk.gray("\nHealth monitor stopped."));
      resolve();
    });
  });
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

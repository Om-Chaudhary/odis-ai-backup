# IDEXX Sync CLI - Progress Indicators

> Comprehensive progress tracking and live monitoring for IDEXX schedule synchronization

## Overview

The IDEXX Sync CLI has been enhanced with comprehensive progress indicators, real-time monitoring, and detailed status views to provide full visibility into sync operations.

## Features

### 1. Multi-Phase Progress Bars 📊

When running a schedule sync, you'll see real-time progress across all sync phases:

```
🔐 Auth       |████████████████████████████████| 100% | 100/100 %   | Authenticated ✓
⚙️  Config     |████████████████████████████████| 100% | 100/100 %   | Config loaded ✓
📅 Slots      |████████████████████████████████| 100% | 100/100 %   | Slots generated ✓
🗓️  Appts      |██████████████████░░░░░░░░░░░░░░| 67% | 10/15 days  | 2025-01-05
🔄 Reconcile  |████████████░░░░░░░░░░░░░░░░░░░░| 40% | 40/100 %   | Reconciling data...
⚔️  Conflicts  |░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| 0% | 0/100 %    | Pending...
```

**Phases tracked:**

- **Authentication** (🔐) - Browser authentication with IDEXX Neo
- **Configuration** (⚙️) - Fetching clinic schedule config
- **Slots** (📅) - Generating appointment slots
- **Appointments** (🗓️) - Fetching and processing appointments per day
- **Reconciliation** (🔄) - Reconciling data (add/update/remove)
- **Conflicts** (⚔️) - Detecting and resolving booking conflicts

### 2. Live Status Monitor 📡

Real-time monitoring of sync status with auto-updating display:

```
Clinic: Alum Rock Animal Hospital
Updated: 3:45:30 PM

✓ Data Status: FRESH
Last synced: 5 minutes ago
Next stale at: 1/5/2025, 4:00:00 PM

🔄 Sync In Progress
██████████████████░░░░░░░░░░░░ 67%
Processing: 2025-01-05

Latest Stats:
  ✓ Slots: 450
  ✓ Added: 25
  ↻ Updated: 12
  ✗ Removed: 3
```

**Features:**

- Auto-refresh every 2 seconds
- Live progress bar for active syncs
- Current date being processed
- Real-time statistics
- Press Ctrl+C to exit

### 3. Enhanced Sync History 📜

Improved sync history view with detailed statistics:

```
Sync History (15 records)

Status │ Clinic               │ Date Range            │ Stats              │ Duration │ Completed
───────┼──────────────────────┼───────────────────────┼────────────────────┼──────────┼──────────
✓      │ Alum Rock Animal Ho… │ 2025-01-01 → 2025-… │ +25 ↻12 -3         │ 1m 34s   │ 2 hours ago
✓      │ Another Clinic       │ 2025-01-01 → 2025-… │ +18 ↻8 -1          │ 1m 12s   │ 5 hours ago
⟳      │ Alum Rock Animal Ho… │ 2025-01-01 → 2025-… │ Syncing...         │ -        │ running
✗      │ Test Clinic          │ 2025-01-01 → 2025-… │ Auth failed        │ 15s      │ 1 day ago

Summary:
  ✓ Completed: 12
  ✗ Failed: 2
  ⟳ In Progress: 1
  Success Rate: 86%
```

**Features:**

- Color-coded status indicators
- Inline statistics (added/updated/removed)
- Success rate calculation
- Running syncs highlighted

### 4. Live Health Monitor 💚

Real-time server health monitoring with memory tracking:

```
API Health Status
Updated: 3:45:30 PM

● Server Status: HEALTHY
Uptime: 2h 15m

Memory Usage:
  1234 MB / 4096 MB (30%)
  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░

Memory Trend:
  ░░▒▒▓▓▓▒▒░░░░▒▒▓▓▓▓▒▒░░ (20s history)
```

**Features:**

- Real-time memory usage tracking
- Visual memory trend (sparkline)
- Uptime tracking
- Auto-refresh every second
- Press Ctrl+C to exit

## Usage

### Start the CLI

```bash
pnpm --filter idexx-sync cli
```

### Main Menu Options

```
📅  Sync Schedule       - Trigger a new schedule sync with progress tracking
📊  Check Sync Status   - View sync status (static or live mode)
📜  View Sync History   - Browse past syncs with statistics
💚  Health Check        - Check API health (quick or live monitor)
🔄  Refresh Connection  - Test API connectivity
🚪  Exit                - Exit the CLI
```

### Sync Schedule

1. Select a clinic from the list
2. Choose sync horizon (7, 14, 21, or 30 days)
3. Confirm to start
4. Watch real-time progress bars for each phase
5. View detailed results when complete

### Check Sync Status

Choose between two modes:

**Static Status** - One-time snapshot:

- Current data freshness
- Last sync statistics
- Next stale time
- Quick overview

**Live Status** - Real-time monitoring:

- Auto-updates every 2 seconds
- Live progress for active syncs
- Current processing date
- Real-time statistics
- Press Ctrl+C to stop

### View Sync History

Browse past sync operations with:

- Status indicators (✓ completed, ✗ failed, ⟳ in progress)
- Inline statistics showing changes
- Duration and completion time
- Overall success rate

### Health Check

Choose between two modes:

**Quick Check** - One-time health check:

- Server status
- Uptime
- Memory usage
- Available endpoints

**Live Monitor** - Real-time health monitoring:

- Auto-updates every second
- Memory usage trends
- Visual memory bar
- Historical sparkline
- Press Ctrl+C to stop

## Progress Indicator Technologies

### Libraries Used

- **ora** - Elegant terminal spinners for loading states
- **cli-progress** - Customizable multi-bar progress bars
- **log-update** - Update terminal output in-place for live views
- **cli-table3** - Beautiful ASCII tables for structured data
- **chalk** - Terminal string styling with colors
- **figlet** - ASCII art for headers

### Architecture

The progress system works by:

1. **Phase Tracking** - Each sync operation reports progress through multiple phases
2. **Database Polling** - CLI polls the `schedule_syncs` table for progress updates
3. **Real-time Updates** - `log-update` refreshes display without scrolling
4. **Multi-bar Display** - Separate progress bars for each phase
5. **Live Monitoring** - Interval-based updates for status and health views

## Technical Details

### Progress Storage

Sync progress is stored in the `schedule_syncs` table:

```sql
-- Progress tracking columns
progress_percentage  int          -- Overall progress (0-100)
current_date        text         -- Currently processing date
status              text         -- completed | in_progress | failed
```

### Update Frequency

- **Progress bars during sync**: Updated after each date completes
- **Live status monitor**: Polls every 2 seconds
- **Live health monitor**: Updates every 1 second

### Error Handling

All progress indicators gracefully handle:

- API connection failures (shows offline status)
- Sync failures (displays error messages)
- User interruption (Ctrl+C exits cleanly)
- Missing data (shows appropriate fallbacks)

## Benefits

1. **Visibility** - See exactly what's happening during long-running syncs
2. **Debugging** - Identify which phase is taking longest or failing
3. **Monitoring** - Track server health and sync status in real-time
4. **Confidence** - Know the sync is progressing, not stuck
5. **History** - Review past performance and success rates

## Future Enhancements

Potential additions:

- Export sync history to CSV
- Email/Slack notifications on completion
- Performance benchmarking across syncs
- Estimated time remaining for syncs
- Parallel clinic sync orchestration
- Sync scheduling from CLI

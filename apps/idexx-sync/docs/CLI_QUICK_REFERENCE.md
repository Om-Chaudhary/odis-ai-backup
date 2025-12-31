# IDEXX Sync CLI - Quick Reference Card

## Starting the CLI

```bash
pnpm --filter idexx-sync cli
```

## Main Menu

| Icon | Action             | Description                          |
| ---- | ------------------ | ------------------------------------ |
| 📅   | Sync Schedule      | Start sync with multi-phase progress |
| 📊   | Check Sync Status  | View status (static/live)            |
| 📜   | View Sync History  | Browse past syncs with stats         |
| 💚   | Health Check       | Monitor API health (quick/live)      |
| 🔄   | Refresh Connection | Test API connectivity                |
| 🚪   | Exit               | Close CLI                            |

## Progress Bar Phases

```
🔐 Auth       - Authentication with IDEXX Neo
⚙️  Config     - Fetching clinic configuration
📅 Slots      - Generating appointment slots
🗓️  Appts      - Processing appointments by date
🔄 Reconcile  - Reconciling data changes
⚔️  Conflicts  - Resolving booking conflicts
```

## Status Indicators

| Icon | Meaning                |
| ---- | ---------------------- |
| ✓    | Completed successfully |
| ✗    | Failed with error      |
| ⟳    | In progress            |
| ●    | Active/Online          |
| ◌    | Pending                |

## Live Monitor Controls

- **Auto-refresh**: Every 1-2 seconds
- **Exit**: Press `Ctrl+C`
- **Pause**: N/A (always live)

## Sync Status Modes

### Static Mode

- One-time snapshot
- Current freshness status
- Last sync statistics
- Quick overview

### Live Mode

- Real-time updates every 2s
- Active sync progress bar
- Current processing date
- Live statistics

## Health Check Modes

### Quick Check

- Server status
- Current uptime
- Memory usage snapshot
- Available endpoints

### Live Monitor

- Memory usage trends
- Visual sparkline graph
- Real-time updates (1s)
- Historical tracking

## Color Coding

| Color  | Meaning                     |
| ------ | --------------------------- |
| Green  | Success, healthy, added     |
| Blue   | Updated, info               |
| Yellow | Warning, in progress, stale |
| Red    | Error, failed, removed      |
| Gray   | Inactive, historical        |
| Cyan   | Headers, system info        |

## Keyboard Shortcuts

| Key    | Action                         |
| ------ | ------------------------------ |
| ↑/↓    | Navigate menu options          |
| Enter  | Select option                  |
| Ctrl+C | Exit live monitor              |
| Ctrl+C | Interrupt sync (not available) |

## API Endpoints Used

| Endpoint                            | Purpose         |
| ----------------------------------- | --------------- |
| POST /api/idexx/schedule-sync       | Trigger sync    |
| GET /api/idexx/schedule-sync/status | Get sync status |
| GET /health                         | Health check    |
| GET /ready                          | Readiness probe |

## Common Sync Durations

| Days | Typical Duration | Appointments |
| ---- | ---------------- | ------------ |
| 7    | 30-60s           | ~50-100      |
| 14   | 60-120s          | ~100-200     |
| 21   | 90-180s          | ~150-300     |
| 30   | 120-240s         | ~200-400     |

## Troubleshooting

### API Not Connected

```bash
# Check if server is running
pnpm --filter idexx-sync start

# Verify in another terminal
curl http://localhost:5050/health
```

### Sync Stuck

- Check live status monitor for current phase
- Review logs in server terminal
- Check IDEXX Neo credentials in database

### Progress Not Updating

- Verify `schedule_syncs` table has records
- Check database connection
- Ensure API server is responding

## Tips

1. **Use Live Monitors** - Better visibility during long operations
2. **Check History First** - Review past performance before syncing
3. **Monitor Memory** - Watch trends during busy periods
4. **Static for Quick Checks** - Faster for one-time status
5. **Ctrl+C Always Works** - Safe to exit live monitors anytime

## Related Docs

- [CLI Features](../CLI_FEATURES.md) - Comprehensive feature documentation
- [README](../README.md) - Project overview and setup
- [Service Documentation](../../../docs/integrations/IDEXX_SYNC_SERVICE.md)

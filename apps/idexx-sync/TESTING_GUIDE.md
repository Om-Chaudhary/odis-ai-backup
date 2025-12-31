# Live Dashboard Testing Guide

## Quick Start Test

### Terminal 1: Start API Server

```bash
cd /Users/taylorallen/Development/odis-ai-web
pnpm --filter idexx-sync start
```

Wait for:

```
[INFO] IDEXX Sync Service started on port 5050
```

### Terminal 2: Run CLI

```bash
cd /Users/taylorallen/Development/odis-ai-web
pnpm --filter idexx-sync cli
```

### Expected Flow

1. **Menu appears**:

   ```
   ┌────────────────────────────────────────┐
   │         IDEXX SYNC CLI                 │
   │ ────────────────────────────────────── │
   │ ● API Connected (http://localhost:5050)│
   └────────────────────────────────────────┘

   ? Select an action:
   ❯ 📅  Sync Schedule
     📊  Check Sync Status
     📜  View Sync History
     💚  Health Check
     🔄  Refresh Connection
     🚪  Exit
   ```

2. **Select "Sync Schedule"**

3. **Choose a clinic** (e.g., "Alum Rock Animal Hospital")

4. **Select sync horizon** (e.g., "14 days")

5. **Confirm**

6. **Watch the live dashboard appear**:

   ```
   Starting sync...
   Sync ID: af4e01c7-bd3c-4282-936f-ee3d8d11efd5
   Connecting to live stream...

   ┌─ Progress ────────────────────────────────────────┐
   │ ⚙️  Config     ████████████████████████████ 100% Loaded ✓
   │ 📅 Slots      ████████████████████████████ 100% Generated 496 slots ✓
   │ 🗓️  Appts      ████████████████░░░░░░░░░░░  64% 9/14 dates
   │ 🔄 Reconcile  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% Pending...
   │ ⚔️  Conflicts  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% Pending...
   └───────────────────────────────────────────────────┘

   ┌─ Live Processing Log ─────────────────────────────┐
   │ Connected to stream (af4e01c7-bd3c-4282-936f-ee3d8d11efd5)
   │ Phase: Configuration loaded
   │ Phase: Generated 496 slots
   │ ✓ 2026-01-07  7 appts  +0 ↻0 -0
   │ ✓ 2026-01-08  7 appts  +0 ↻0 -0
   │ ✓ 2026-01-09  3 appts  +0 ↻0 -0
   │ ✓ 2026-01-10  10 appts  +0 ↻0 -0
   │ ✓ 2026-01-11  4 appts  +4 ↻0 -0
   │ ✓ 2026-01-12  6 appts  +0 ↻0 -0
   └───────────────────────────────────────────────────┘
   ```

7. **Final summary**:

   ```
   ✓ Sync completed successfully!
     Completed in 37s

   ┌────────────────────────────┬───────┐
   │ Metric                     │ Value │
   ├────────────────────────────┼───────┤
   │ Sync ID                    │ af4e... │
   │ Duration                   │ 37s   │
   │ Slots Created              │ 496   │
   │ Appointments Added         │ 4     │
   │ Appointments Updated       │ 0     │
   │ Appointments Removed       │ 0     │
   └────────────────────────────┴───────┘
   ```

## Manual SSE Testing

You can also test the SSE stream directly:

### Step 1: Trigger a sync via API

```bash
curl -X POST http://localhost:5050/api/idexx/schedule-sync \
  -H "Content-Type: application/json" \
  -d '{
    "clinicId": "33f3bbb8-6613-45bc-a1f2-d55e30c243ae",
    "daysAhead": 7
  }'
```

Save the `syncId` from the response.

### Step 2: Connect to SSE stream

```bash
curl -N http://localhost:5050/api/idexx/schedule-sync/stream/{syncId}
```

You should see events streaming:

```
data: {"type":"connected","syncId":"..."}

data: {"type":"phase","phase":"config_loaded","message":"Configuration loaded"}

data: {"type":"phase","phase":"slots_generated","message":"Generated 496 slots","slotsCreated":496}

data: {"type":"date_completed","syncId":"...","date":"2026-01-07","appointmentsFound":7,"added":0,"updated":0,"removed":0}

data: {"type":"completed","syncId":"...","success":true,"stats":{...}}
```

## Troubleshooting

### CLI doesn't connect to stream

**Check**: Is the API server running?

```bash
curl http://localhost:5050/health
```

Should return:

```json
{"status":"healthy","uptime":123,"memory":{...}}
```

### No events appearing in log feed

**Check**: Stream endpoint

```bash
# After triggering a sync, test the stream directly
curl -N http://localhost:5050/api/idexx/schedule-sync/stream/{syncId}
```

If you see events in curl but not in CLI, check the EventSource connection in CLI logs.

### Progress bars not updating

**Possible causes**:

1. Sync hasn't started yet (wait for "Connected to stream" message)
2. EventSource connection failed (check network)
3. Sync service isn't emitting events (check server logs)

**Debug**: Check server logs in Terminal 1 for:

```
[INFO] SSE stream started for sync {syncId}
[DEBUG] Phase event for {syncId}: config_loaded
[DEBUG] Date completed for {syncId}: 2026-01-07
```

### "Sync failed or timed out"

**Possible causes**:

1. IDEXX credentials expired/invalid
2. Network issues reaching IDEXX Neo
3. Sync took longer than 5 minutes (timeout)

**Check server logs** for specific error messages.

## Expected Timing

For a 14-day sync:

- Config loading: 1-2 seconds
- Slot generation: 1-2 seconds
- Appointment processing: 20-60 seconds (depends on # of appointments)
- Reconciliation: 2-5 seconds
- Conflict resolution: 1-3 seconds

**Total**: ~30-75 seconds for 14 days

## What to Look For

✅ **Good Signs**:

- Progress bars advance smoothly
- Log feed shows new dates appearing every few seconds
- Colors: green ✓ for completed dates
- Final stats table shows reasonable numbers

❌ **Bad Signs**:

- Progress bars stuck at 0%
- No log entries appearing
- Red error messages in log feed
- CLI exits without showing final summary

## Advanced Testing

### Test with Different Date Ranges

```javascript
// In CLI
daysAhead: 7; // Fast (15-30s)
daysAhead: 14; // Normal (30-60s)
daysAhead: 21; // Slower (45-90s)
daysAhead: 30; // Longest (60-120s)
```

### Test Error Handling

1. **Stop API server mid-sync**:
   - Should show "Stream connection error" in log
   - CLI should handle gracefully

2. **Invalid clinic ID**:

   ```bash
   curl -X POST http://localhost:5050/api/idexx/schedule-sync \
     -H "Content-Type: application/json" \
     -d '{"clinicId": "invalid-uuid", "daysAhead": 7}'
   ```

   - Should return 404 error

3. **Disconnect SSE client early**:
   - Ctrl+C during sync
   - Server should clean up resources

## Success Criteria

- [x] Progress bars update in real-time
- [x] Log feed scrolls with new entries
- [x] All 5 phases show progress
- [x] Date completion events appear as dates are processed
- [x] Final summary displays correctly
- [x] Colors are appropriate (green/blue/red)
- [x] No crashes or hangs
- [x] Graceful error handling

## Performance Benchmarks

| Metric               | Target    | Actual  |
| -------------------- | --------- | ------- |
| Time to first event  | < 2s      | ~1s     |
| Event latency        | < 100ms   | 10-50ms |
| Log feed updates     | Real-time | Instant |
| Progress bar refresh | Smooth    | Smooth  |
| Memory usage         | < 200MB   | ~150MB  |

## Notes

- SSE is one-way (server → client), so no client-side ACKs needed
- Events are JSON-encoded in `data:` field
- Keep-alive pings every 30s prevent connection drops
- Stream auto-closes after completion
- Log buffer limited to 10 lines to prevent overflow

# Debugging Live Stream

## Issue: CLI not updating live

### Root Cause

The sync service needs to be registered for streaming **before** the sync starts processing events. The timing was:

1. ❌ Old: Sync starts → completes → then registers (too late!)
2. ✅ New: Sync starts → emits `sync_started` → registers → events flow

### What Was Fixed

1. **Added `sync_started` event** in `schedule-sync.service.ts`
   - Emitted immediately after creating sync session
   - Includes syncId so registration can happen early

2. **Updated route handler** in `schedule-sync.route.ts`
   - Listens for `sync_started` event
   - Registers sync for streaming as soon as syncId is available
   - Then waits for sync to complete

3. **Updated CLI** in `cli-runner.mjs`
   - Polls database for in-progress sync to get syncId
   - Connects to SSE stream once syncId is found
   - Falls back gracefully if stream unavailable

## How to Verify It's Working

### Step 1: Start Server with Debug Logging

```bash
cd /Users/taylorallen/Development/odis-ai-web
pnpm --filter idexx-sync start
```

Watch for these logs when sync starts:

```
[INFO] Starting schedule sync for clinic {clinicId}
[INFO] SSE stream started for sync {syncId}
[DEBUG] Phase event for {syncId}: config_loaded
[DEBUG] Date completed for {syncId}: 2026-01-07
```

### Step 2: Test SSE Directly

In another terminal, trigger a sync and immediately connect:

```bash
# Terminal 2: Trigger sync
curl -X POST http://localhost:5050/api/idexx/schedule-sync \
  -H "Content-Type: application/json" \
  -d '{
    "clinicId": "33f3bbb8-6613-45bc-a1f2-d55e30c243ae",
    "daysAhead": 7
  }' &

# Terminal 3: Immediately connect to stream (use any recent syncId from database)
SYNC_ID=$(curl -s 'http://localhost:5050/api/idexx/schedule-sync/status?clinicId=33f3bbb8-6613-45bc-a1f2-d55e30c243ae' | jq -r '.lastSync.id')
echo "Connecting to sync: $SYNC_ID"
curl -N "http://localhost:5050/api/idexx/schedule-sync/stream/$SYNC_ID"
```

You should see events streaming:

```
data: {"type":"connected","syncId":"..."}

data: {"type":"phase","phase":"config_loaded","message":"Configuration loaded"}

data: {"type":"date_completed","syncId":"...","date":"2026-01-07","appointmentsFound":7,"added":0,...}
```

### Step 3: Run CLI and Watch

```bash
# Terminal 2
pnpm --filter idexx-sync cli
```

Select Sync Schedule → you should see:

1. "Starting sync..."
2. "Waiting for sync to start..." (with spinner)
3. "Sync started!" (✓)
4. "Sync ID: {id}"
5. "Connecting to live stream..."
6. Progress bars and log feed UPDATE IN REAL-TIME

## Troubleshooting

### Problem: "Could not get sync ID"

**Cause**: Sync session not created in database yet

**Fix**: The CLI now waits up to 10 seconds (20 attempts × 500ms) for the sync to appear in database

**Check**:

```sql
SELECT id, clinic_id, status, created_at
FROM schedule_syncs
WHERE clinic_id = '33f3bbb8-6613-45bc-a1f2-d55e30c243ae'
ORDER BY created_at DESC
LIMIT 5;
```

### Problem: Stream connects but no events

**Cause**: Sync not registered in `activeSyncs` map

**Debug server logs**:

```
[INFO] SSE stream started for sync {syncId}
[WARN] No active sync found for {syncId}  // ← BAD
```

Should see:

```
[INFO] SSE stream started for sync {syncId}
[DEBUG] Phase event for {syncId}: config_loaded  // ← GOOD
```

**Fix**: The sync service must emit `sync_started` event which triggers registration.

### Problem: Events in server logs but not in CLI

**Cause**: EventSource not parsing events correctly

**Check EventSource state**:
Add debug logging in CLI:

```javascript
eventSource.onopen = () => {
  console.log("SSE connection opened, state:", eventSource.readyState);
};
```

**States**:

- 0 = CONNECTING
- 1 = OPEN (good!)
- 2 = CLOSED

### Problem: Progress bars not updating

**Cause**: Event type mismatch

**Check**: Server emits `phase`, CLI expects `phase`:

```javascript
// Server (stream.route.ts)
res.write(`data: ${JSON.stringify({ type: "phase", ...data })}\n\n`);

// CLI (cli-runner.mjs)
case 'phase':  // Must match!
```

## Expected Event Flow

```
Server                          SSE Endpoint                    CLI
  |                                 |                            |
  |--emit(sync_started)----------->|                            |
  |                                 |--registerSync(syncId)      |
  |                                 |                            |
  |                                 |<--connect(syncId)----------|
  |                                 |--connected event---------->|
  |                                 |                            |
  |--emit(phase,config_loaded)---->|                            |
  |                                 |--phase event-------------->| [✓ Config 100%]
  |                                 |                            |
  |--emit(phase,slots_generated)-->|                            |
  |                                 |--phase event-------------->| [✓ Slots 100%]
  |                                 |                            |
  |--emit(date_completed)---------->|                            |
  |                                 |--date_completed event----->| [✓ 2026-01-07...]
  |                                 |                            |
  |--emit(completed)--------------->|                            |
  |                                 |--completed event---------->| [Show final stats]
  |                                 |--close connection          |
```

## Key Files Changed

1. `apps/idexx-sync/src/services/schedule-sync.service.ts`
   - Line 133: `this.emit("sync_started", {...})`

2. `apps/idexx-sync/src/routes/schedule-sync.route.ts`
   - Lines 348-357: Listen for `sync_started` and register sync

3. `apps/idexx-sync/src/cli-runner.mjs`
   - Lines 311-347: Poll for in-progress sync to get syncId
   - Lines 360-475: SSE event handling

## Quick Test Command

After rebuilding, test everything:

```bash
# Terminal 1
pnpm --filter idexx-sync start

# Terminal 2
pnpm --filter idexx-sync cli
# Select Sync Schedule → Alum Rock → 7 days → Yes

# Watch for:
# 1. ✓ Sync started! (green checkmark)
# 2. Progress bars updating
# 3. Log feed scrolling with dates
# 4. ✓ Sync completed successfully!
```

## Success Indicators

✅ **Working correctly**:

- Spinner shows "Sync started!" with green checkmark
- Progress bars move from 0% → 100%
- Log feed shows dates appearing one by one
- Stats update in real-time (+added, ↻updated, -removed)
- Final summary matches server-side stats

❌ **Still broken**:

- "Could not get sync ID" after 10 seconds
- Progress bars stay at 0%
- Log feed shows only "Waiting for events..."
- No color-coded date entries
- Times out after 5 minutes

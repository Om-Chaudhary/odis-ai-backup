# Performance Testing Guide

## Baseline Performance Test

### Before Optimization

Run a 14-day sync and measure baseline performance:

```bash
# Start the service
pnpm --filter idexx-sync start

# Run sync with timing
time curl -X POST http://localhost:5050/api/idexx/schedule-sync \
  -H "Content-Type: application/json" \
  -d '{"clinicId": "YOUR_CLINIC_ID", "daysAhead": 14}'
```

**Expected baseline**: 2-3 minutes for 14 days

### After Optimization

Run the same test with the optimized version:

```bash
time curl -X POST http://localhost:5050/api/idexx/schedule-sync \
  -H "Content-Type: application/json" \
  -d '{"clinicId": "YOUR_CLINIC_ID", "daysAhead": 14}'
```

**Expected optimized**: 30-45 seconds for 14 days (10x improvement)

## Load Testing

### Concurrent Syncs Test

Test concurrency control by hitting the endpoint multiple times:

```bash
# Terminal 1
curl -X POST http://localhost:5050/api/idexx/schedule-sync \
  -H "Content-Type: application/json" \
  -d '{"clinicId": "CLINIC_1", "daysAhead": 14}'

# Terminal 2 (should queue)
curl -X POST http://localhost:5050/api/idexx/schedule-sync \
  -H "Content-Type: application/json" \
  -d '{"clinicId": "CLINIC_1", "daysAhead": 14}'

# Terminal 3 (should queue)
curl -X POST http://localhost:5050/api/idexx/schedule-sync \
  -H "Content-Type: application/json" \
  -d '{"clinicId": "CLINIC_1", "daysAhead": 14}'
```

**Expected behavior**:

- Max 2 concurrent syncs per clinic (configurable via `MAX_CONCURRENT_SYNCS`)
- Additional requests queued with 202 status
- Queue full returns 429 after 10 queued requests

### Rate Limiting Test

Monitor IDEXX API rate limiting:

```bash
# Watch metrics during sync
watch -n 1 "curl -s http://localhost:5050/metrics | grep idexx_api"
```

**Expected behavior**:

- Requests throttled to configured rate (default 10/sec)
- No 429 errors from IDEXX API

## Memory Profiling

### Memory Leak Test

Run continuous syncs and monitor memory:

```bash
# Terminal 1: Monitor metrics
watch -n 5 "curl -s http://localhost:5050/metrics | grep process_memory_bytes"

# Terminal 2: Run syncs continuously
for i in {1..10}; do
  echo "Sync $i"
  curl -X POST http://localhost:5050/api/idexx/schedule-sync \
    -H "Content-Type: application/json" \
    -d '{"clinicId": "YOUR_CLINIC_ID", "daysAhead": 7}'
  sleep 60
done
```

**Expected behavior**:

- Memory should stabilize after initial syncs
- No continuous growth indicating leaks
- Browser pool should reuse instances

## Partial Failure Tests

### Network Interruption Test

Simulate network failure mid-sync:

```bash
# Start sync
curl -X POST http://localhost:5050/api/idexx/schedule-sync \
  -H "Content-Type: application/json" \
  -d '{"clinicId": "YOUR_CLINIC_ID", "daysAhead": 14}' &

# After 5 seconds, kill network (if testing locally)
# sleep 5 && sudo pfctl -d  # macOS
```

**Expected behavior**:

- Partial success reported
- Failed dates logged
- Completed dates persisted
- Queue slot released

### Timeout Test

Test timeout handling:

```bash
# Set low timeout (requires restart with env var)
SYNC_TIMEOUT_MS=10000 pnpm --filter idexx-sync start

# Run sync (should timeout)
curl -X POST http://localhost:5050/api/idexx/schedule-sync \
  -H "Content-Type: application/json" \
  -d '{"clinicId": "YOUR_CLINIC_ID", "daysAhead": 14}'
```

**Expected behavior**:

- 408 status after timeout
- Browser cleaned up
- Queue slot released

## Integration Tests

### Database Batch Operations Test

Verify batch operations work correctly:

```sql
-- Check slot counts are correct after sync
SELECT
  date,
  COUNT(*) as slots,
  SUM(booked_count) as total_booked
FROM schedule_slots
WHERE clinic_id = 'YOUR_CLINIC_ID'
GROUP BY date
ORDER BY date;

-- Verify appointments were batch inserted
SELECT
  date,
  COUNT(*) as appointments
FROM schedule_appointments
WHERE clinic_id = 'YOUR_CLINIC_ID'
  AND deleted_at IS NULL
GROUP BY date
ORDER BY date;
```

### Progress Tracking Test

Monitor sync progress in real-time:

```sql
-- In another terminal, watch progress
watch -n 1 "psql -c \"SELECT
  id,
  status,
  progress_percentage,
  current_date,
  created_at
FROM schedule_syncs
WHERE clinic_id = 'YOUR_CLINIC_ID'
ORDER BY created_at DESC
LIMIT 1;\""
```

**Expected behavior**:

- Progress percentage increases from 0 to 100
- Current date updates as sync progresses
- Status transitions: in_progress → completed

## Metrics Validation

### Check Metrics Endpoint

Verify metrics are being collected:

```bash
curl http://localhost:5050/metrics
```

**Expected metrics**:

- `process_uptime_seconds` - Process uptime
- `process_memory_bytes` - Memory usage
- `sync_queue_active` - Active syncs
- `sync_queue_queued` - Queued syncs
- `browser_pool_total` - Total browsers
- `browser_pool_in_use` - Browsers in use
- `browser_pool_available` - Available browsers

### Health Check Validation

Test enhanced health checks:

```bash
curl http://localhost:5050/health | jq
```

**Expected checks**:

- `process` - pass
- `memory` - pass
- `environment` - pass
- `sync_queue` - pass/warn
- `browser_pool` - pass/warn

## Graceful Shutdown Test

### SIGTERM Handling

Test graceful shutdown:

```bash
# Terminal 1: Start service
pnpm --filter idexx-sync start

# Terminal 2: Start sync
curl -X POST http://localhost:5050/api/idexx/schedule-sync \
  -H "Content-Type: application/json" \
  -d '{"clinicId": "YOUR_CLINIC_ID", "daysAhead": 14}' &

# Terminal 3: Send SIGTERM after 5 seconds
sleep 5 && pkill -SIGTERM -f "idexx-sync"
```

**Expected behavior**:

- Service stops accepting new requests
- Active sync continues (up to 30s)
- Queued syncs cancelled
- Browser pool closed
- Clean exit with code 0

## Performance Benchmarks

### Target Metrics

| Metric           | Before         | After            | Target           |
| ---------------- | -------------- | ---------------- | ---------------- |
| 14-day sync      | 2-3 min        | 30-45 sec        | 10x faster ✅    |
| DB writes        | N × individual | Batched          | 50% reduction ✅ |
| Slot updates     | 14+ queries    | 1 query          | 90% reduction ✅ |
| Memory usage     | ~300MB         | ~300MB           | Stable ✅        |
| Concurrent syncs | 1              | 2 (configurable) | Controlled ✅    |
| IDEXX API rate   | Unlimited      | 10/sec           | Rate limited ✅  |

### Monitoring in Production

```bash
# Set up monitoring alerts (example for Prometheus)
- alert: HighSyncDuration
  expr: sync_duration_seconds > 60
  annotations:
    summary: "Sync taking longer than expected"

- alert: HighMemoryUsage
  expr: process_memory_bytes > 500000000
  annotations:
    summary: "Memory usage above 500MB"

- alert: QueueBacklog
  expr: sync_queue_queued > 5
  annotations:
    summary: "Sync queue backing up"
```

## Test Checklist

- [ ] Baseline performance measured
- [ ] Optimized performance measured (10x improvement confirmed)
- [ ] Concurrent syncs tested (queue works)
- [ ] Rate limiting verified (no 429s from IDEXX)
- [ ] Memory leak test passed (stable memory)
- [ ] Partial failure handling verified
- [ ] Timeout handling works
- [ ] Batch operations correct
- [ ] Progress tracking updates
- [ ] Metrics endpoint functional
- [ ] Health checks enhanced
- [ ] Graceful shutdown tested
- [ ] Production monitoring configured

## Next Steps

1. Run all tests above and document results
2. Set up continuous monitoring in production
3. Create alerts for key metrics
4. Schedule regular performance audits
5. Monitor for regression after updates

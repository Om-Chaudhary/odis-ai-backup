# VAPI Rate Limit Avoidance Strategy

## Problem

When loading the inbound dashboard, multiple calls may be missing `recording_url` or other data, causing simultaneous VAPI API requests that hit rate limits.

## Root Cause Analysis

1. **Multiple simultaneous queries**: When the dashboard loads, if 10+ calls are missing data, React Query fires 10+ VAPI requests simultaneously
2. **No request throttling**: No mechanism to limit concurrent VAPI requests
3. **No retry with backoff**: Failed requests don't retry with exponential backoff
4. **Lazy loading without prioritization**: All missing data is fetched, even for off-screen items

## Strategies (Prioritized)

### 1. **Request Queuing & Throttling** (High Priority)

Implement a request queue that limits concurrent VAPI requests to a safe number (e.g., 2-3 concurrent requests).

**Implementation:**

- Create a VAPI request queue service
- Limit concurrent requests to 2-3
- Queue additional requests and process them sequentially
- Add exponential backoff for rate limit errors

**Benefits:**

- Prevents overwhelming VAPI API
- Automatic retry with backoff
- Predictable request patterns

### 2. **Lazy Loading with Intersection Observer** (High Priority)

Only fetch VAPI data when the call detail panel is actually opened, not when the table renders.

**Current Issue:**

```typescript
// In call-detail.tsx - fetches immediately when component mounts
const vapiQuery = api.inboundCalls.fetchCallFromVAPI.useQuery(...)
```

**Solution:**

- Only enable the query when the detail panel is opened
- Use `enabled: false` by default, enable on user interaction
- This reduces initial load requests by ~90%

### 3. **Database-First Approach** (Medium Priority)

Ensure webhooks always populate all needed data so we rarely need to fetch from VAPI.

**Current Status:**

- ✅ Webhooks already save `recording_url`, `transcript`, `summary` to database
- ⚠️ Some older calls may be missing data

**Actions:**

- Run a one-time backfill for calls missing critical data
- Monitor webhook success rates
- Add alerts if webhook failures increase

### 4. **Request Deduplication** (Medium Priority)

React Query already deduplicates identical queries, but we can improve this:

**Current:**

- React Query deduplicates by query key
- Multiple components requesting same call = 1 request

**Enhancement:**

- Add request-level caching in the tRPC procedure
- Cache successful responses for 5-10 minutes
- Return cached data immediately if available

### 5. **Batch Fetching** (Low Priority - if VAPI supports it)

If VAPI API supports batch requests, fetch multiple calls in a single request.

**Note:** VAPI API may not support batch requests - needs verification.

### 6. **Exponential Backoff Retry** (Already Partially Implemented)

Improve retry logic with exponential backoff for rate limit errors.

**Current:**

- `retry: false` in React Query
- No automatic retry

**Solution:**

- Enable retry with exponential backoff
- Use `retry: 3` with `retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)`
- Only retry on rate limit errors, not other errors

### 7. **Request Prioritization** (Low Priority)

Prioritize fetching data for:

1. Currently selected/visible items
2. Recent calls
3. Calls with attention flags

**Implementation:**

- Use a priority queue
- Process high-priority requests first
- Defer low-priority requests

## Recommended Implementation Order

1. **Phase 1: Quick Wins** (1-2 days)
   - ✅ Improve error handling (already done)
   - Implement lazy loading (only fetch when detail panel opens)
   - Enable retry with exponential backoff

2. **Phase 2: Request Management** (3-5 days)
   - Implement request queuing/throttling
   - Add request-level caching in tRPC procedure
   - Monitor and alert on rate limit errors

3. **Phase 3: Data Completeness** (1-2 days)
   - Backfill missing data for older calls
   - Monitor webhook success rates
   - Add database indexes for faster lookups

## Code Examples

### Lazy Loading Implementation

```typescript
// In call-detail.tsx
export function CallDetail({ call, onDelete, isSubmitting }: CallDetailProps) {
  const [shouldFetchVAPI, setShouldFetchVAPI] = useState(false);

  // Only fetch when user explicitly needs it (e.g., clicks "Load Recording")
  const vapiQuery = api.inboundCalls.fetchCallFromVAPI.useQuery(
    { vapiCallId: call.vapi_call_id },
    {
      enabled: shouldFetchVAPI && !call.recording_url && !!call.vapi_call_id,
      staleTime: 5 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  );

  // ... rest of component
}
```

### Request Queue Service

```typescript
// libs/integrations/vapi/src/request-queue.ts
class VapiRequestQueue {
  private queue: Array<() => Promise<unknown>> = [];
  private active = 0;
  private maxConcurrent = 2;
  private delayBetweenRequests = 500; // 500ms between requests

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.active++;
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } finally {
        this.active--;
        await new Promise((resolve) =>
          setTimeout(resolve, this.delayBetweenRequests),
        );
        this.process();
      }
    }
  }
}

export const vapiRequestQueue = new VapiRequestQueue();
```

### Usage in tRPC Procedure

```typescript
fetchCallFromVAPI: protectedProcedure
  .input(z.object({ vapiCallId: z.string() }))
  .query(async ({ input }) => {
    // Check cache first
    const cacheKey = `vapi-call-${input.vapiCallId}`;
    const cached = await getFromCache(cacheKey);
    if (cached) return cached;

    // Use request queue
    const callData = await vapiRequestQueue.enqueue(() =>
      getCall(input.vapiCallId)
    );

    // Cache result
    await setCache(cacheKey, callData, 5 * 60); // 5 minutes

    return callData;
  }),
```

## Monitoring

Add metrics to track:

- Number of VAPI requests per minute
- Rate limit error rate
- Average request latency
- Cache hit rate
- Webhook success rate

## Success Criteria

- ✅ Zero rate limit errors in production
- ✅ < 5 VAPI requests per page load
- ✅ < 2 second average latency for fetching call data
- ✅ 80%+ cache hit rate for VAPI requests

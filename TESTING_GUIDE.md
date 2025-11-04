# Testing Guide: Auto-Refresh Implementation

## Quick Start Testing

### Prerequisites

```bash
# Ensure development server is running
cd C:\Users\taylo\Documents\GitHub\odis-ai-web
npm run dev
```

Navigate to: `http://localhost:3000/dashboard/calls`

## Manual Testing Checklist

### 1. Initial Load Test

- [ ] Page loads without errors
- [ ] Calls table displays existing calls
- [ ] Loading spinner shows during initial fetch
- [ ] "Last updated" indicator appears after load

**Expected Result:**

```
✓ Table shows call data
✓ Header shows "X calls found"
✓ Polling status shows "Updated just now"
✓ Pulsing green dot visible
```

### 2. Active Polling Test (with active calls)

**Setup:** Ensure you have calls with status: `initiated`, `ringing`, or `in_progress`

**Steps:**

1. Observe the "Updated X ago" text
2. Wait 5 seconds
3. Watch for the timestamp to update

**Expected Result:**

```
✓ Polling occurs every 5 seconds
✓ "Updated just now" → "Updated 5s ago" → "Updated just now" (cycle)
✓ Green dot continues pulsing
✓ Status indicator shows "(5s)"
```

**Validation:**
Open browser DevTools → Network tab:

- Should see `fetchCalls` requests every ~5 seconds
- Requests should be successful (200 status)

### 3. Idle Polling Test (no active calls)

**Setup:** Ensure all calls have status: `completed`, `failed`, or `cancelled`

**Steps:**

1. Wait for active calls to complete or filter to "completed" status
2. Observe polling interval changes

**Expected Result:**

```
✓ Polling slows to every 30 seconds
✓ "Updated X ago" increments more slowly
✓ Status indicator shows "(30s)"
✓ Green dot continues pulsing
```

**Validation:**
Open DevTools → Network tab:

- Should see `fetchCalls` requests every ~30 seconds
- Gap between requests is 6x longer than active polling

### 4. Tab Visibility Test

**Steps:**

1. Note the current "Updated X ago" time
2. Switch to a different browser tab
3. Wait 30+ seconds
4. Return to the calls tab
5. Observe the behavior

**Expected Result:**

```
✓ Polling pauses when tab is hidden
✓ Dot changes from green (pulsing) to gray (static)
✓ "Updated X ago" time increases without updates
✓ Upon return, immediate poll is triggered
✓ Dot returns to green (pulsing)
✓ "Updated just now" appears
```

**Validation:**
Open DevTools → Network tab (before switching tabs):

- No `fetchCalls` requests while tab is hidden
- Immediate request when tab becomes visible

### 5. Manual Refresh Test

**Steps:**

1. Click the "Refresh" button in the card header
2. Observe the button behavior
3. Try clicking rapidly multiple times

**Expected Result:**

```
✓ Refresh icon spins during refresh
✓ Button is disabled during refresh
✓ "Updated just now" appears after completion
✓ Rapid clicks don't trigger multiple requests
✓ Automatic polling continues normally
```

**Validation:**

- Only ONE request per button click (debounce protection)
- Button re-enables after completion

### 6. Status Filter Test

**Steps:**

1. Select different status filters (All, Initiated, Ringing, etc.)
2. Observe polling behavior

**Expected Result:**

```
✓ Table updates with filtered results
✓ Polling continues with new filter
✓ "Last updated" timestamp persists
✓ Active/idle polling adapts to visible calls
```

### 7. Active Calls Counter Test

**Steps:**

1. Observe the header description
2. Note the active calls count
3. Wait for calls to complete
4. Observe count update

**Expected Result:**

```
✓ Shows "(X active)" when active calls exist
✓ Count updates as calls complete
✓ Text disappears when no active calls
✓ Updates happen during polling cycles
```

**Example:**

```
"50 calls found (3 active) - Click on any row..."
            ↓ (after polling)
"50 calls found (2 active) - Click on any row..."
            ↓ (after polling)
"50 calls found - Click on any row..."
```

### 8. Error Handling Test

**Setup:** Temporarily disable network or cause API error

**Steps:**

1. Open DevTools → Network tab → Throttling → Offline
2. Wait for next poll
3. Observe error behavior
4. Re-enable network
5. Wait for recovery

**Expected Result:**

```
✓ Toast notification shows error
✓ Polling continues (doesn't stop)
✓ "Updated X ago" time continues incrementing
✓ When network recovers, normal polling resumes
✓ UI remains functional
```

### 9. Performance Test

**Steps:**

1. Open DevTools → Performance tab
2. Start recording
3. Let the page run for 1 minute with active polling
4. Stop recording
5. Analyze the performance profile

**Expected Result:**

```
✓ No memory leaks (heap size stable)
✓ CPU usage minimal between polls
✓ No excessive re-renders
✓ Smooth UI interactions during updates
```

### 10. Component Re-render Test

**Setup:** Install React DevTools browser extension

**Steps:**

1. Open React DevTools → Profiler
2. Start recording
3. Wait for several polling cycles
4. Stop recording
5. Review component render times

**Expected Result:**

```
✓ CallHistoryPage re-renders on poll
✓ Individual CallRow components don't re-render unnecessarily
✓ Render times are consistent (<16ms for 60fps)
✓ No cascading re-renders
```

## Automated Testing Scenarios

### Unit Test: useCallPolling Hook

```typescript
// Example test structure (pseudocode)

describe("useCallPolling", () => {
  it("should poll at specified interval", () => {
    const mockOnPoll = jest.fn();
    const { result } = renderHook(() =>
      useCallPolling({
        enabled: true,
        interval: 1000,
        onPoll: mockOnPoll,
      }),
    );

    // Fast-forward time
    jest.advanceTimersByTime(1000);
    expect(mockOnPoll).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    expect(mockOnPoll).toHaveBeenCalledTimes(2);
  });

  it("should pause when tab is hidden", () => {
    // Test visibility change behavior
  });

  it("should adapt interval based on active calls", () => {
    // Test interval switching
  });
});
```

### Integration Test: Full Page

```typescript
// Example test structure (pseudocode)

describe('CallHistoryPage', () => {
  it('should display calls and start polling', async () => {
    render(<CallHistoryPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/calls found/i)).toBeInTheDocument();
    });

    // Verify polling indicator
    expect(screen.getByText(/Updated just now/i)).toBeInTheDocument();
  });

  it('should refresh on manual button click', async () => {
    render(<CallHistoryPage />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Verify refresh behavior
    expect(refreshButton).toBeDisabled();
    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    });
  });
});
```

## Browser Compatibility Testing

Test in multiple browsers to ensure Visibility API works correctly:

| Browser | Version | Status | Notes        |
| ------- | ------- | ------ | ------------ |
| Chrome  | Latest  | ✓      | Full support |
| Firefox | Latest  | ✓      | Full support |
| Safari  | Latest  | ✓      | Full support |
| Edge    | Latest  | ✓      | Full support |
| Opera   | Latest  | ✓      | Full support |

## Performance Benchmarks

### Expected Metrics

**Network:**

- Active polling: ~1 request per 5 seconds
- Idle polling: ~1 request per 30 seconds
- Request size: ~5-50KB (depending on call count)
- Response time: <500ms (typical)

**Memory:**

- Initial: ~20-30MB
- After 10 minutes: <50MB increase
- No memory leaks over extended use

**CPU:**

- Idle: <1% usage
- During poll: <5% spike
- Average: <2% sustained

**Battery (Mobile):**

- Tab visible: Moderate drain
- Tab hidden: Minimal drain (polling paused)

## Troubleshooting

### Issue: Polling doesn't start

**Diagnosis:**

- Check browser console for errors
- Verify user has admin access
- Check network tab for failed requests

**Solution:**

```typescript
// Verify in browser console:
console.log("Polling enabled:", enabled);
console.log("Tab visible:", !document.hidden);
console.log("Has active calls:", hasActiveCalls());
```

### Issue: Polling too frequent/slow

**Diagnosis:**

- Check active calls count
- Verify ACTIVE_STATUSES constant

**Solution:**

```typescript
// In page.tsx, adjust intervals:
const { isPolling, lastUpdated, refresh, isRefreshing } = useCallPolling({
  interval: 5000, // Adjust this (milliseconds)
  idleInterval: 30000, // Adjust this (milliseconds)
  // ...
});
```

### Issue: UI updates are jarring

**Diagnosis:**

- Check for loading spinner during background updates
- Verify smooth transitions

**Solution:**

```typescript
// Ensure loadCalls only shows spinner on initial load:
const isInitialLoad = calls.length === 0;
if (isInitialLoad) {
  setIsLoading(true);
}
```

### Issue: Memory leak detected

**Diagnosis:**

- Check interval cleanup
- Verify visibility listener removal

**Solution:**

```typescript
// Ensure cleanup in useEffect:
return () => {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
  }
  document.removeEventListener("visibilitychange", handler);
};
```

## Test Results Template

```markdown
## Test Results: [Date]

### Environment

- Browser: [Chrome 120]
- OS: [Windows 11]
- Screen: [1920x1080]
- Network: [Fast 3G / 4G / WiFi]

### Test Results

| Test           | Status | Notes |
| -------------- | ------ | ----- |
| Initial Load   | ✓ / ✗  |       |
| Active Polling | ✓ / ✗  |       |
| Idle Polling   | ✓ / ✗  |       |
| Tab Visibility | ✓ / ✗  |       |
| Manual Refresh | ✓ / ✗  |       |
| Status Filter  | ✓ / ✗  |       |
| Active Counter | ✓ / ✗  |       |
| Error Handling | ✓ / ✗  |       |
| Performance    | ✓ / ✗  |       |
| Re-render Test | ✓ / ✗  |       |

### Performance Metrics

- Initial Load Time: [X ms]
- Average Poll Time: [X ms]
- Memory Usage: [X MB]
- CPU Usage: [X%]

### Issues Found

1. [Issue description]
2. [Issue description]

### Recommendations

1. [Recommendation]
2. [Recommendation]
```

## Continuous Testing

For ongoing development, consider:

1. **Automated E2E Tests** with Playwright
2. **Performance Monitoring** with Lighthouse CI
3. **Real User Monitoring** with PostHog or similar
4. **Error Tracking** with Sentry

## Conclusion

Following this testing guide ensures the auto-refresh implementation:

- Functions correctly across scenarios
- Performs efficiently
- Handles errors gracefully
- Provides excellent user experience

All tests should pass before deploying to production.

# Debugging Commands

Complete reference for debugging workflows.

## Console Error Investigation

### Get All Console Messages

```typescript
// Get all console messages
const messages = browser_console_messages();

// Filter by level
const errors = messages.filter((m) => m.level === "error");
const warnings = messages.filter((m) => m.level === "warn");
const info = messages.filter((m) => m.level === "info");

// Filter by content
const apiErrors = messages.filter(
  (m) =>
    m.text.includes("API") ||
    m.text.includes("fetch") ||
    m.text.includes("network"),
);

// Filter by source
const componentErrors = messages.filter(
  (m) => m.text.includes("Component") || m.text.includes("React"),
);
```

### Check for Specific Errors

```typescript
// After an action, check for errors
browser_click("Submit button", "button-ref");
browser_wait_for({ time: 1 });

const messages = browser_console_messages();
const recentErrors = messages.filter(
  (m) => m.level === "error" && m.timestamp > Date.now() - 2000, // Last 2 seconds
);

if (recentErrors.length > 0) {
  console.error("Errors after action:", recentErrors);
}
```

## Network Request Analysis

### Monitor All Requests

```typescript
// Get all network requests
const requests = browser_network_requests();

// Filter by type
const apiRequests = requests.filter(
  (req) => req.url.includes("/api/") || req.url.includes("/trpc/"),
);

const failedRequests = requests.filter((req) => req.status >= 400);

const slowRequests = requests.filter(
  (req) => req.duration > 1000, // Over 1 second
);
```

### Analyze Request Details

```typescript
// Analyze specific request
const caseRequest = requests.find((req) => req.url.includes("cases"));

if (caseRequest) {
  console.log({
    url: caseRequest.url,
    method: caseRequest.method,
    status: caseRequest.status,
    duration: caseRequest.duration,
    requestSize: caseRequest.requestHeaders?.["content-length"],
    responseSize: caseRequest.responseHeaders?.["content-length"],
    timing: {
      dns: caseRequest.timing?.dns,
      connect: caseRequest.timing?.connect,
      response: caseRequest.timing?.response,
    },
  });
}
```

### Check for Failed Requests

```typescript
// After page load or action
browser_wait_for({ time: 2 });

const requests = browser_network_requests();
const failures = requests.filter(
  (req) => req.status >= 400 || req.status === 0, // Network error
);

if (failures.length > 0) {
  console.error(
    "Failed requests:",
    failures.map((req) => ({
      url: req.url,
      status: req.status,
      method: req.method,
    })),
  );
}
```

## Performance Debugging

### Measure Page Load Time

```typescript
// Navigate and measure
browser_navigate("http://localhost:3000/dashboard");

// Wait for page to be interactive
browser_wait_for({ textGone: "Loading..." });

// Measure load performance
const performance = browser_evaluate(() => {
  const perf = performance.getEntriesByType("navigation")[0];
  return {
    domContentLoaded:
      perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
    loadComplete: perf.loadEventEnd - perf.loadEventStart,
    firstPaint: performance
      .getEntriesByType("paint")
      .find((p) => p.name === "first-paint")?.startTime,
    firstContentfulPaint: performance
      .getEntriesByType("paint")
      .find((p) => p.name === "first-contentful-paint")?.startTime,
  };
});

console.log("Page Load Performance:", performance);
```

### Analyze Network Performance

```typescript
// Get all requests with timing
const requests = browser_network_requests();

const analysis = {
  totalRequests: requests.length,
  totalSize: requests.reduce(
    (sum, req) =>
      sum + parseInt(req.responseHeaders?.["content-length"] || "0"),
    0,
  ),
  averageTime:
    requests.reduce((sum, req) => sum + (req.duration || 0), 0) /
    requests.length,
  slowestRequest: requests.reduce(
    (slowest, req) =>
      (req.duration || 0) > (slowest.duration || 0) ? req : slowest,
    requests[0],
  ),
  failedRequests: requests.filter((req) => req.status >= 400).length,
};

console.log("Network Analysis:", analysis);
```

### Check Render Performance

```typescript
// Measure frame rate
const frameRate = browser_evaluate(() => {
  let frames = 0;
  let lastTime = performance.now();

  function countFrame() {
    frames++;
    const currentTime = performance.now();
    if (currentTime - lastTime < 1000) {
      requestAnimationFrame(countFrame);
    } else {
      return frames;
    }
  }

  requestAnimationFrame(countFrame);
  return new Promise((resolve) => {
    setTimeout(() => resolve(frames), 1000);
  });
});

// Check for layout shifts
const layoutShifts = browser_evaluate(() => {
  if ("PerformanceObserver" in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.value > 0.1) {
          // Significant shift
          return entry.value;
        }
      }
    });
    observer.observe({ entryTypes: ["layout-shift"] });
  }
  return null;
});
```

## State Debugging

### Inspect URL State

```typescript
// Get current URL state
const urlState = browser_evaluate(() => {
  const params = new URLSearchParams(window.location.search);
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    params: Object.fromEntries(params.entries()),
  };
});

console.log("URL State:", urlState);
```

### Check Component State

```typescript
// Get component data attributes
const componentState = browser_evaluate(() => {
  const element = document.querySelector('[data-testid="my-component"]');
  return {
    dataAttributes: Array.from(element?.attributes || [])
      .filter((attr) => attr.name.startsWith("data-"))
      .reduce((obj, attr) => {
        obj[attr.name] = attr.value;
        return obj;
      }, {}),
    classes: element?.className.split(" ") || [],
    visible: element?.getBoundingClientRect().width > 0,
  };
});
```

### Trace State Changes

```typescript
// Monitor state changes over time
const states = [];

// Initial state
states.push({
  time: Date.now(),
  state: browser_evaluate(() => window.location.search),
});

// Perform action
browser_click("Filter button", "button-ref");
browser_wait_for({ time: 0.5 });

// Check state after action
states.push({
  time: Date.now(),
  state: browser_evaluate(() => window.location.search),
});

// Compare states
const stateChanged = states[0].state !== states[1].state;
console.log("State changed:", stateChanged, states);
```

## Error Tracing

### Trace Error Source

```typescript
// Get error with stack trace
const errorInfo = browser_evaluate(() => {
  // Trigger error or check existing
  try {
    // Code that might error
    return null;
  } catch (error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }
});

// Or check console for stack traces
const messages = browser_console_messages();
const errorsWithStack = messages.filter((m) => m.level === "error" && m.stack);
```

### Check React Errors

```typescript
// Check for React error boundaries
const reactErrors = browser_evaluate(() => {
  // Check for error boundary indicators
  const errorElements = document.querySelectorAll("[data-error-boundary]");
  return Array.from(errorElements).map((el) => ({
    message: el.textContent,
    component: el.getAttribute("data-component"),
  }));
});

// Check console for React warnings
const reactWarnings = browser_console_messages().filter(
  (m) =>
    m.text.includes("React") ||
    m.text.includes("Warning") ||
    m.text.includes("component"),
);
```

## Best Practices

### Systematic Debugging

1. **Reproduce consistently** - Ensure issue is reproducible
2. **Check console first** - Often the quickest path to solution
3. **Monitor network** - API errors are common
4. **Inspect state** - Verify data flow
5. **Document findings** - Keep track of what you've checked

### Error Documentation

1. **Capture error message** - Full text
2. **Get stack trace** - If available
3. **Note reproduction steps** - How to trigger
4. **Check related requests** - Network context
5. **Document environment** - Browser, viewport, etc.

### Performance Analysis

1. **Measure baseline** - Before optimization
2. **Identify bottlenecks** - Slow requests, renders
3. **Compare before/after** - Verify improvements
4. **Monitor over time** - Track regressions

## Related Documentation

- [Debugging README](./README.md) - Overview
- [Browser Testing](../browser-testing/) - Visual debugging
- [API Testing](../api-testing/) - API debugging

---

**Last Updated**: 2025-01-27

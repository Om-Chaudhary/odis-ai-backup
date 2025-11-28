# API Testing Commands

Complete reference for API testing workflows.

## Browser-Based API Testing

### Monitor Network Requests

```typescript
// 1. Navigate to page that makes API calls
browser_navigate("http://localhost:3000/dashboard");

// 2. Trigger API call (click button, submit form, etc.)
browser_click("Load Cases button", "button-ref");

// 3. Wait for request to complete
browser_wait_for({ time: 2 });

// 4. Get network requests
const requests = browser_network_requests();

// 5. Filter API calls
const apiCalls = requests.filter(
  (req) => req.url.includes("/api/") || req.url.includes("/trpc/"),
);

// 6. Verify request details
const caseRequest = apiCalls.find((req) => req.url.includes("cases"));

console.log({
  url: caseRequest.url,
  method: caseRequest.method,
  status: caseRequest.status,
  requestHeaders: caseRequest.requestHeaders,
  responseHeaders: caseRequest.responseHeaders,
});
```

### Test API Response

```typescript
// 1. Intercept and verify response
const response = browser_evaluate(async () => {
  const response = await fetch("/api/cases", {
    headers: {
      "Content-Type": "application/json",
      // Add auth headers if needed
    },
  });
  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.json(),
  };
});

// 2. Verify response structure
const isValid = response.status === 200 && Array.isArray(response.body.data);

// 3. Check for errors
if (response.status !== 200) {
  // Document error
  console.error("API Error:", response.body);
}
```

## Authentication Testing

### Test Bearer Token Auth

```typescript
// 1. Test with valid token
const validResponse = browser_evaluate(async () => {
  const response = await fetch("/api/calls/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer valid-token-here",
    },
    body: JSON.stringify({
      phoneNumber: "+15551234567",
      petName: "Max",
      ownerName: "John Doe",
    }),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
});

// 2. Test with invalid token
const invalidResponse = browser_evaluate(async () => {
  const response = await fetch("/api/calls/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid-token",
    },
    body: JSON.stringify({}),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
});

// 3. Verify 401 for invalid token
const isUnauthorized = invalidResponse.status === 401;
```

### Test Cookie-Based Auth

```typescript
// Cookies are sent automatically by browser
// Test authenticated endpoint
browser_navigate("http://localhost:3000/dashboard");

// Make authenticated request
const response = browser_evaluate(async () => {
  const response = await fetch("/api/cases", {
    credentials: "include", // Include cookies
  });
  return {
    status: response.status,
    body: await response.json(),
  };
});

// Verify authenticated response
const isAuthenticated = response.status === 200;
```

## Error Scenario Testing

### Test Invalid Input

```typescript
// 1. Test missing required fields
const missingFields = browser_evaluate(async () => {
  const response = await fetch("/api/calls/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    },
    body: JSON.stringify({
      // Missing required fields
    }),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
});

// 2. Verify validation error
const hasValidationError =
  missingFields.status === 400 &&
  missingFields.body.error?.includes("required");

// 3. Test invalid data types
const invalidTypes = browser_evaluate(async () => {
  const response = await fetch("/api/calls/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    },
    body: JSON.stringify({
      phoneNumber: 123, // Should be string
      petName: null,
    }),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
});
```

### Test Rate Limiting

```typescript
// Make multiple rapid requests
const requests = [];
for (let i = 0; i < 10; i++) {
  const response = browser_evaluate(async () => {
    const response = await fetch("/api/calls/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({
        phoneNumber: "+15551234567",
        petName: "Test",
        ownerName: "Test",
      }),
    });
    return response.status;
  });
  requests.push(response);
  browser_wait_for({ time: 0.1 }); // Small delay
}

// Check for rate limit (429)
const rateLimited = requests.some((status) => status === 429);
```

## Integration Testing

### Test Webhook Trigger

```typescript
// 1. Trigger action that should send webhook
browser_navigate("http://localhost:3000/dashboard");
browser_click("Schedule Call button", "button-ref");

// 2. Fill form
browser_type("Phone input", "input-ref", "+15551234567");
browser_type("Pet name input", "pet-input-ref", "Max");
browser_type("Owner name input", "owner-input-ref", "John Doe");

// 3. Submit
browser_click("Submit button", "submit-ref");

// 4. Monitor network for webhook
browser_wait_for({ time: 3 });

const requests = browser_network_requests();
const webhookCall = requests.find(
  (req) => req.url.includes("webhook") || req.url.includes("qstash"),
);

// 5. Verify webhook was called
const webhookTriggered = !!webhookCall;
```

### Test Database Updates

```typescript
// 1. Create record via API
const createResponse = browser_evaluate(async () => {
  const response = await fetch("/api/calls/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    },
    body: JSON.stringify({
      phoneNumber: "+15551234567",
      petName: "Max",
      ownerName: "John Doe",
      scheduledFor: new Date().toISOString(),
    }),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
});

// 2. Verify creation
const created = createResponse.status === 200;
const callId = createResponse.body.data?.id;

// 3. Verify in UI (navigate to calls list)
browser_navigate("http://localhost:3000/dashboard/calls");
browser_wait_for({ text: "Max" }); // Pet name should appear

// 4. Verify record exists
const snapshot = browser_snapshot();
const callItem = snapshot.find(
  (el) => el.name?.includes("Max") || el.name?.includes("John Doe"),
);
const recordVisible = !!callItem;
```

## Console Error Checking

### Check for API Errors

```typescript
// After API interaction, check console
const messages = browser_console_messages();
const errors = messages.filter(
  (m) =>
    m.level === "error" && (m.text.includes("API") || m.text.includes("fetch")),
);

// Document any API-related errors
if (errors.length > 0) {
  console.error("API Errors found:", errors);
}
```

## Best Practices

### Test Coverage

1. **Happy path** - Valid requests with valid data
2. **Error cases** - Invalid data, missing fields
3. **Auth cases** - Valid/invalid tokens, expired tokens
4. **Edge cases** - Boundary values, special characters
5. **Integration** - End-to-end workflows

### Request Verification

1. **Check status codes** - 200, 400, 401, 500, etc.
2. **Verify response structure** - Expected fields present
3. **Validate data types** - Correct types returned
4. **Check error messages** - Clear, helpful errors

### Network Monitoring

1. **Monitor all requests** - Don't miss any API calls
2. **Check timing** - Response times acceptable
3. **Verify headers** - Correct auth, content-type
4. **Check for errors** - Network failures, timeouts

## Related Documentation

- [API Testing README](./README.md) - Overview
- [API Reference](../../api/API_REFERENCE.md) - API documentation
- [Testing Strategy](../../testing/TESTING_STRATEGY.md) - Testing approach

---

**Last Updated**: 2025-01-27

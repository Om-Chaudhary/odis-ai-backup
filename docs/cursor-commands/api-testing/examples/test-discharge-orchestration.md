# Test Discharge Orchestration API

## Scenario

Test the `/api/discharge/orchestrate` endpoint with various input modes and step combinations.

## Command Sequence

```typescript
// 1. Navigate to a page that can make API calls (or use browser_evaluate)
browser_navigate("http://localhost:3000/dashboard");

// 2. Test orchestration with text input
const textResponse = browser_evaluate(async () => {
  const response = await fetch("/api/discharge/orchestrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Cookies are sent automatically
    },
    credentials: "include",
    body: JSON.stringify({
      input: {
        rawData: {
          mode: "text",
          source: "manual",
          text: "Max, a 5-year-old Golden Retriever, came in for ear infection. Prescribed antibiotics and ear drops. Recheck in 2 weeks.",
        },
      },
      steps: {
        ingest: true,
        generateSummary: true,
      },
    }),
  });

  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.json(),
  };
});

console.log("Text Input Response:", textResponse);

// 3. Verify response structure
const isValidResponse =
  textResponse.status === 200 &&
  textResponse.body.success === true &&
  textResponse.body.data?.ingestion?.caseId;

// 4. Test with structured input
const structuredResponse = browser_evaluate(async () => {
  const response = await fetch("/api/discharge/orchestrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      input: {
        rawData: {
          mode: "structured",
          source: "idexx_extension",
          structured: {
            patientName: "Max",
            species: "Dog",
            age: 5,
            diagnosis: "Ear infection",
            medications: ["Antibiotics", "Ear drops"],
          },
        },
      },
      steps: {
        ingest: true,
        generateSummary: true,
        sendEmail: false,
      },
    }),
  });

  return {
    status: response.status,
    body: await response.json(),
  };
});

console.log("Structured Input Response:", structuredResponse);

// 5. Test with only ingest step
const ingestOnlyResponse = browser_evaluate(async () => {
  const response = await fetch("/api/discharge/orchestrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      input: {
        rawData: {
          mode: "text",
          source: "manual",
          text: "Test case for ingest only",
        },
      },
      steps: {
        ingest: true,
        generateSummary: false,
      },
    }),
  });

  return {
    status: response.status,
    body: await response.json(),
  };
});

console.log("Ingest Only Response:", ingestOnlyResponse);

// 6. Test error case - missing required fields
const errorResponse = browser_evaluate(async () => {
  const response = await fetch("/api/discharge/orchestrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      input: {
        rawData: {
          // Missing required fields
        },
      },
      steps: {
        ingest: true,
      },
    }),
  });

  return {
    status: response.status,
    body: await response.json(),
  };
});

console.log("Error Response:", errorResponse);
const hasValidationError = errorResponse.status === 400;

// 7. Test Bearer token authentication (simulate extension)
const bearerTokenResponse = browser_evaluate(async () => {
  // Note: Replace with actual token from session
  const token = "YOUR_BEARER_TOKEN_HERE";

  const response = await fetch("/api/discharge/orchestrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      input: {
        rawData: {
          mode: "text",
          source: "idexx_extension",
          text: "Test from extension",
        },
      },
      steps: {
        ingest: true,
      },
    }),
  });

  return {
    status: response.status,
    body: await response.json(),
  };
});

console.log("Bearer Token Response:", bearerTokenResponse);

// 8. Monitor network requests
browser_wait_for({ time: 1 });
const requests = browser_network_requests();
const orchestrateRequests = requests.filter((req) =>
  req.url.includes("/api/discharge/orchestrate"),
);

console.log(
  "Orchestration Requests:",
  orchestrateRequests.map((req) => ({
    method: req.method,
    status: req.status,
    duration: req.duration,
  })),
);

// 9. Check for CORS headers (if testing from extension context)
const corsHeaders = browser_evaluate(async () => {
  const response = await fetch("/api/discharge/orchestrate", {
    method: "OPTIONS",
    headers: {
      Origin: "https://us.idexxneo.com",
      "Access-Control-Request-Method": "POST",
    },
  });

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
  };
});

console.log("CORS Headers:", corsHeaders);

// 10. Check console for errors
const messages = browser_console_messages();
const apiErrors = messages.filter(
  (m) =>
    m.level === "error" &&
    (m.text.includes("orchestrate") || m.text.includes("API")),
);
if (apiErrors.length > 0) {
  console.error("API Errors:", apiErrors);
}
```

## Expected Results

- Text input mode works
- Structured input mode works
- Individual steps can be enabled/disabled
- Validation errors return 400
- Bearer token auth works
- CORS headers present for extension
- No console errors

## What to Verify

1. **Text Input**: Creates case and generates summary
2. **Structured Input**: Handles structured data correctly
3. **Step Control**: Can enable/disable individual steps
4. **Error Handling**: Returns proper error for invalid input
5. **Authentication**: Works with both cookies and Bearer token
6. **CORS**: Headers present for extension access
7. **Response Structure**: Consistent response format

## Common Issues to Check

- Missing required fields not validated
- Steps not executing when enabled
- Authentication failing
- CORS headers missing
- Response structure inconsistent
- Console errors on API calls

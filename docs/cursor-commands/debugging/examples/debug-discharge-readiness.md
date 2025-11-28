# Debug Discharge Readiness Logic

## Scenario

Debug why a case is not showing as "Ready" for discharge when it should be, or why readiness indicators are incorrect.

## Command Sequence

```typescript
// 1. Navigate to case detail page
browser_navigate("http://localhost:3000/dashboard/cases/CASE_ID");

// 2. Wait for page load
browser_wait_for({ textGone: "Loading..." });

// 3. Get case data from page
const caseData = browser_evaluate(() => {
  // Try to find case data in window or DOM
  const caseElement = document.querySelector("[data-case-id]");
  const caseId = caseElement?.getAttribute("data-case-id");

  // Check for React component data
  const reactData = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;

  return {
    caseId,
    url: window.location.href,
    hasSOAPNote: !!document.querySelector('[class*="soap"]'),
    hasDischargeSummary: !!document.querySelector('[class*="discharge"]'),
    hasPatientInfo: !!document.querySelector('[class*="patient"]'),
    statusBadges: Array.from(document.querySelectorAll('[class*="badge"]')).map(
      (b) => ({
        text: b.textContent?.trim(),
        classes: b.className,
      }),
    ),
  };
});

console.log("Case Data:", caseData);

// 4. Check readiness indicators
const readinessCheck = browser_evaluate(() => {
  const indicators = Array.from(
    document.querySelectorAll('[class*="readiness"], [class*="ready"]'),
  );
  return indicators.map((ind) => ({
    text: ind.textContent?.trim(),
    isWarning:
      ind.classList.contains("warning") ||
      ind.classList.contains("error") ||
      ind.classList.contains("danger"),
    isSuccess:
      ind.classList.contains("success") || ind.classList.contains("ready"),
    element: {
      tag: ind.tagName,
      classes: ind.className,
      attributes: Array.from(ind.attributes).map((a) => ({
        name: a.name,
        value: a.value,
      })),
    },
  }));
});

console.log("Readiness Indicators:", readinessCheck);

// 5. Check for missing data warnings
const missingDataWarnings = browser_evaluate(() => {
  const warnings = Array.from(
    document.querySelectorAll('[class*="missing"], [class*="required"]'),
  );
  return warnings.map((w) => ({
    text: w.textContent?.trim(),
    type: w.getAttribute("data-type") || w.className,
    parent: w.parentElement?.textContent?.substring(0, 100),
  }));
});

console.log("Missing Data Warnings:", missingDataWarnings);

// 6. Check contact information
const contactInfo = browser_evaluate(() => {
  const contactElements = Array.from(
    document.querySelectorAll(
      '[class*="contact"], [class*="phone"], [class*="email"]',
    ),
  );
  return contactElements.map((el) => ({
    text: el.textContent?.trim(),
    isPlaceholder:
      el.textContent?.includes("placeholder") ||
      el.textContent?.includes("Not provided"),
    hasValue:
      el.textContent &&
      !el.textContent.includes("placeholder") &&
      !el.textContent.includes("Not provided"),
  }));
});

console.log("Contact Information:", contactInfo);

// 7. Check API response for case data
const apiData = browser_evaluate(async () => {
  // Extract case ID from URL
  const caseId = window.location.pathname.split("/").pop();

  try {
    const response = await fetch(
      `/api/trpc/cases.getCase?input=${encodeURIComponent(JSON.stringify({ caseId }))}`,
      {
        credentials: "include",
      },
    );

    const data = await response.json();
    return {
      status: response.status,
      hasData: !!data.result?.data,
      case: data.result?.data,
      hasSOAP: !!data.result?.data?.soap_notes?.length,
      hasDischarge: !!data.result?.data?.discharge_summaries?.length,
      hasPatient: !!data.result?.data?.patient,
      patientContact:
        data.result?.data?.patient?.phone_number ||
        data.result?.data?.patient?.email,
    };
  } catch (error) {
    return { error: error.message };
  }
});

console.log("API Case Data:", apiData);

// 8. Check network requests for case data
const requests = browser_network_requests();
const caseRequests = requests.filter(
  (req) =>
    req.url.includes("cases") &&
    (req.url.includes(caseData.caseId || "") || req.url.includes("getCase")),
);

console.log(
  "Case API Requests:",
  caseRequests.map((req) => ({
    url: req.url,
    status: req.status,
    duration: req.duration,
    responseSize: req.responseHeaders?.["content-length"],
  })),
);

// 9. Check console for readiness-related errors
const messages = browser_console_messages();
const readinessErrors = messages.filter(
  (m) =>
    m.text.includes("readiness") ||
    m.text.includes("discharge") ||
    m.text.includes("ready") ||
    m.text.includes("missing"),
);

console.log("Readiness Errors:", readinessErrors);

// 10. Verify discharge readiness function logic
const readinessLogic = browser_evaluate(() => {
  // Check if readiness check function is available
  const checkFunction = (window as any).checkCaseDischargeReadiness;

  if (checkFunction && apiData.case) {
    try {
      const result = checkFunction(apiData.case);
      return result;
    } catch (error) {
      return { error: error.message };
    }
  }

  return {
    note: "Function not available in browser context",
    suggestion: "Check server-side readiness logic",
  };
});

console.log("Readiness Logic Result:", readinessLogic);

// 11. Compare expected vs actual readiness
const readinessComparison = {
  expected: {
    hasSOAP: apiData.hasSOAP,
    hasDischarge: apiData.hasDischarge,
    hasContact: !!apiData.patientContact,
    allRequired:
      apiData.hasSOAP && apiData.hasDischarge && !!apiData.patientContact,
  },
  actual: {
    indicators: readinessCheck,
    warnings: missingDataWarnings,
    contact: contactInfo,
  },
  discrepancy: {
    shouldBeReady:
      apiData.hasSOAP && apiData.hasDischarge && !!apiData.patientContact,
    isShowingReady: readinessCheck.some((ind) => ind.isSuccess),
    missingItems: [
      !apiData.hasSOAP && "SOAP Note",
      !apiData.hasDischarge && "Discharge Summary",
      !apiData.patientContact && "Contact Information",
    ].filter(Boolean),
  },
};

console.log("Readiness Comparison:", readinessComparison);
```

## Expected Results

- Case data loads correctly
- Readiness indicators match actual data
- Missing data warnings are accurate
- Contact information is checked
- API data matches UI display
- No console errors

## What to Verify

1. **Data Consistency**: API data matches UI display
2. **Readiness Logic**: Indicators match actual case state
3. **Missing Data**: Warnings show correct missing items
4. **Contact Info**: Placeholder detection works
5. **Status Badges**: Show correct status
6. **API Requests**: All necessary data loaded

## Common Issues to Check

- Readiness check not running
- Missing data not detected
- Contact info not validated
- API data not matching UI
- Readiness indicators incorrect
- Console errors in readiness logic

## Debugging Steps

1. **Check API Data**: Verify case has required data
2. **Check Readiness Function**: Verify logic is correct
3. **Check UI Indicators**: Verify indicators match data
4. **Check Missing Warnings**: Verify warnings are accurate
5. **Check Contact Validation**: Verify placeholder detection
6. **Check Console**: Look for errors in readiness logic

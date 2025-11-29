# Test Case Detail Page

## Scenario

Test the case detail page showing all case information, discharge summaries, SOAP notes, transcripts, and action buttons.

## Command Sequence

```typescript
// 1. Navigate to a specific case (replace CASE_ID with actual case ID)
browser_navigate("http://localhost:3000/dashboard/cases/CASE_ID");

// 2. Wait for page load
browser_wait_for({ textGone: "Loading..." });

// 3. Take initial screenshot
browser_take_screenshot("01-case-detail-initial.png");

// 4. Get page snapshot
const snapshot = browser_snapshot();

// 5. Test back button
const backButton = snapshot.find(
  (el) => el.name?.includes("Back") || el.name?.includes("←"),
);
if (backButton) {
  browser_click(backButton.name, backButton.ref);
  browser_wait_for({ time: 0.5 });
  browser_take_screenshot("02-back-button-navigation.png");

  // Navigate back to case
  browser_navigate("http://localhost:3000/dashboard/cases/CASE_ID");
  browser_wait_for({ textGone: "Loading..." });
}

// 6. Test discharge action buttons
const callButton = snapshot.find(
  (el) => el.name?.includes("Call") || el.name?.includes("Phone"),
);
const emailButton = snapshot.find(
  (el) => el.name?.includes("Email") || el.name?.includes("Mail"),
);

if (callButton) {
  browser_hover(callButton.name, callButton.ref);
  browser_wait_for({ time: 0.3 });
  browser_take_screenshot("03-call-button-hover.png");
}

if (emailButton) {
  browser_hover(emailButton.name, emailButton.ref);
  browser_wait_for({ time: 0.3 });
  browser_take_screenshot("04-email-button-hover.png");
}

// 7. Test accordion sections (SOAP notes, Discharge summaries, etc.)
const accordions = snapshot.filter(
  (el) =>
    el.role === "button" &&
    (el.name?.includes("SOAP") ||
      el.name?.includes("Discharge") ||
      el.name?.includes("Transcript")),
);

for (const accordion of accordions) {
  // Click to expand
  browser_click(accordion.name, accordion.ref);
  browser_wait_for({ time: 0.5 });
  browser_take_screenshot(
    `05-accordion-${accordion.name.replace(/\s+/g, "-").toLowerCase()}.png`,
  );

  // Click to collapse
  browser_click(accordion.name, accordion.ref);
  browser_wait_for({ time: 0.3 });
}

// 8. Test status badges
const statusBadges = browser_evaluate(() => {
  const badges = Array.from(document.querySelectorAll('[class*="badge"]'));
  return badges.map((badge) => ({
    text: badge.textContent?.trim(),
    classes: badge.className,
  }));
});
console.log("Status Badges:", statusBadges);

// 9. Test patient information display
const patientInfo = browser_evaluate(() => {
  const patientSection =
    document.querySelector('[data-testid="patient-info"]') ||
    document.querySelector('[class*="patient"]');
  if (!patientSection) return null;

  return {
    name: patientSection.querySelector('[class*="name"]')?.textContent,
    species: patientSection.querySelector('[class*="species"]')?.textContent,
    age: patientSection.querySelector('[class*="age"]')?.textContent,
    weight: patientSection.querySelector('[class*="weight"]')?.textContent,
  };
});
console.log("Patient Info:", patientInfo);

// 10. Test audio player (if transcript exists)
const audioPlayer = snapshot.find(
  (el) =>
    el.name?.includes("Play") ||
    el.name?.includes("audio") ||
    el.role === "button",
);
if (audioPlayer) {
  browser_click(audioPlayer.name, audioPlayer.ref);
  browser_wait_for({ time: 1 });
  browser_take_screenshot("06-audio-player-playing.png");

  // Pause
  browser_click(audioPlayer.name, audioPlayer.ref);
  browser_wait_for({ time: 0.3 });
}

// 11. Test responsive - Mobile
browser_resize(375, 667);
browser_wait_for({ time: 0.5 });
browser_take_screenshot("07-case-detail-mobile.png");

// 12. Test responsive - Tablet
browser_resize(768, 1024);
browser_wait_for({ time: 0.5 });
browser_take_screenshot("08-case-detail-tablet.png");

// 13. Scroll to bottom to test long content
browser_evaluate(() => {
  window.scrollTo(0, document.body.scrollHeight);
});
browser_wait_for({ time: 0.5 });
browser_take_screenshot("09-case-detail-scrolled.png");

// 14. Check for console errors
const messages = browser_console_messages();
const errors = messages.filter((m) => m.level === "error");
if (errors.length > 0) {
  console.error("Errors found:", errors);
}

// 15. Verify discharge readiness indicators
const readinessIndicators = browser_evaluate(() => {
  const indicators = Array.from(
    document.querySelectorAll('[class*="readiness"]'),
  );
  return indicators.map((ind) => ({
    text: ind.textContent?.trim(),
    hasWarning:
      ind.classList.contains("warning") || ind.classList.contains("error"),
  }));
});
console.log("Readiness Indicators:", readinessIndicators);
```

## Expected Results

- Case information displays correctly
- All accordion sections expand/collapse
- Action buttons are visible and functional
- Status badges show correct status
- Audio player works (if transcript exists)
- Responsive layout works
- No console errors
- Discharge readiness indicators show correctly

## What to Verify

1. **Case Information**: Patient name, species, age, weight displayed
2. **Status Badges**: Correct status colors and text
3. **SOAP Notes**: Accordion expands and shows content
4. **Discharge Summaries**: Accordion expands and shows content
5. **Transcripts**: Accordion expands, audio player works
6. **Action Buttons**: Call/Email buttons visible for ready cases
7. **Readiness Indicators**: Shows what's missing for discharge
8. **Responsive**: Layout works on mobile/tablet
9. **Navigation**: Back button returns to list

## Common Issues to Check

- Missing patient information
- Status badges incorrect
- Accordions don't expand
- Audio player doesn't work
- Action buttons missing
- Readiness indicators incorrect
- Layout breaks on mobile
- Console errors

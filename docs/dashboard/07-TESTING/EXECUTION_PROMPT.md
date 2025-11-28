# Playwright MCP Testing Execution Prompt

## Instructions for Cursor Agent

You are tasked with executing comprehensive dashboard testing using Playwright MCP (Model Context Protocol) browser automation tools and documenting all findings.

## Objective

Systematically test the Odis AI Dashboard at `http://localhost:3000/dashboard` using Playwright MCP tools and document all visual inconsistencies, layout issues, responsive behavior problems, and UX improvements.

**CRITICAL**: This is a documentation/testing exercise. Do NOT implement any fixes - only document findings.

## Testing Documentation Structure

All testing guides are organized in the `docs/dashboard/07-TESTING/` directory:

- **[README.md](./README.md)** - Overview and navigation
- **[strategy.md](./strategy.md)** - Test setup and approach
- **[checklist.md](./checklist.md)** - Comprehensive checklist
- **[sidebar-navigation.md](./sidebar-navigation.md)** - Sidebar and navigation testing
- **[overview-tab.md](./overview-tab.md)** - Overview tab testing
- **[cases-tab.md](./cases-tab.md)** - Cases tab testing
- **[discharges-tab.md](./discharges-tab.md)** - Discharges tab testing
- **[case-detail-page.md](./case-detail-page.md)** - Case detail page testing
- **[settings-page.md](./settings-page.md)** - Settings page testing
- **[responsive-design.md](./responsive-design.md)** - Responsive testing
- **[accessibility.md](./accessibility.md)** - Accessibility testing
- **[animations-interactions.md](./animations-interactions.md)** - Animations testing
- **[edge-cases.md](./edge-cases.md)** - Edge cases testing
- **[performance.md](./performance.md)** - Performance testing
- **[results.md](./results.md)** - Document all findings here

## Playwright MCP Tools Available

You have access to these browser automation tools:

### Navigation

- `browser_navigate(url)` - Navigate to a URL
- `browser_navigate_back()` - Go back
- `browser_resize(width, height)` - Resize viewport

### Interaction

- `browser_click(element, ref)` - Click an element
- `browser_type(element, ref, text)` - Type text
- `browser_hover(element, ref)` - Hover over element
- `browser_press_key(key)` - Press keyboard key
- `browser_select_option(element, ref, values)` - Select dropdown option

### Inspection

- `browser_snapshot()` - Get accessibility snapshot of current page
- `browser_take_screenshot(filename, ...)` - Capture screenshot
- `browser_evaluate(function)` - Run JavaScript on page
- `browser_console_messages()` - Get console messages
- `browser_network_requests()` - Get network requests

### Utilities

- `browser_wait_for(time, text, textGone)` - Wait for conditions
- `browser_tabs(action, index)` - Manage browser tabs

## Execution Workflow

### Phase 1: Setup & Initial Testing

1. **Navigate to Dashboard**

   ```
   Use: browser_navigate("http://localhost:3000/dashboard")
   ```

2. **Resize to Desktop Viewport**

   ```
   Use: browser_resize(1920, 1080)
   ```

3. **Take Initial Screenshot**

   ```
   Use: browser_take_screenshot("01-initial-desktop.png")
   ```

4. **Get Page Snapshot**
   ```
   Use: browser_snapshot() to understand page structure
   ```

### Phase 2: Systematic Testing

Follow the testing guides in this order:

1. **Sidebar & Navigation** (`sidebar-navigation.md`)
   - Test sidebar toggle (expanded/collapsed)
   - Test profile header
   - Test tab navigation
   - Test date filters
   - Document all findings

2. **Overview Tab** (`overview-tab.md`)
   - Test stat cards (measure heights with `browser_evaluate`)
   - Test weekly activity chart
   - Test cases needing attention card
   - Test recent cases list
   - Test activity timeline
   - Document all findings

3. **Cases Tab** (`cases-tab.md`)
   - Test view toggle (grid/list)
   - Test all filters (quick, status, source, date)
   - Test search functionality
   - Test case cards/list items
   - Test pagination
   - Document all findings

4. **Discharges Tab** (`discharges-tab.md`)
   - Test header and controls
   - Test search
   - Test day pagination
   - Test status summary bar
   - Test case cards
   - Document all findings

5. **Responsive Design** (`responsive-design.md`)
   - Test mobile (375x667, 414x896)
   - Test tablet (768x1024)
   - Test desktop (1280x720, 1440x900, 1920x1080)
   - Compare layouts across breakpoints
   - Document all findings

6. **Accessibility** (`accessibility.md`)
   - Test keyboard navigation
   - Check ARIA labels with `browser_evaluate`
   - Test focus indicators
   - Document all findings

7. **Animations & Interactions** (`animations-interactions.md`)
   - Test page transitions
   - Test hover states
   - Test click feedback
   - Test loading states
   - Document all findings

8. **Edge Cases** (`edge-cases.md`)
   - Test empty states
   - Test error states (simulate API errors)
   - Test long content
   - Test rapid interactions
   - Test filter combinations
   - Document all findings

9. **Performance** (`performance.md`)
   - Measure load times
   - Check animation frame rates
   - Document all findings

## Documentation Format

For each issue found, document in `results.md` using this format:

```markdown
### Issue #X: [Brief Description]

**Location**: [Component/Page/Section]
**Severity**: [Critical/High/Medium/Low]
**State**: [Sidebar Expanded/Collapsed/Both]
**Viewport**: [Mobile/Tablet/Desktop/All]

**Description**:
[Detailed description of the issue]

**Steps to Reproduce**:

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Visual Evidence**:

- Screenshot: `[filename].png`
- Snapshot reference: `[element ref]`
- Measurements: [specific pixel values if applicable]

**Responsive Impact**:

- Mobile: [Yes/No - description]
- Tablet: [Yes/No - description]
- Desktop: [Yes/No - description]

**Additional Notes**:
[Any other relevant information]
```

## Key Testing Principles

1. **Be Systematic**: Follow the guides in order, don't skip steps
2. **Take Screenshots**: Capture visual evidence for all issues
3. **Measure Precisely**: Use `browser_evaluate` to measure dimensions, spacing
4. **Compare States**: Always test sidebar expanded vs collapsed
5. **Test Interactions**: Click, hover, type in every interactive element
6. **Document Everything**: Even minor issues - they add up
7. **Be Specific**: Include exact component names, file paths when possible
8. **Note Patterns**: If an issue appears in multiple places, note it
9. **Performance**: Note any slow interactions or janky animations
10. **Accessibility**: Don't skip keyboard navigation testing

## Measurement Examples

### Measure Card Heights

```javascript
browser_evaluate(() => {
  const cards = Array.from(document.querySelectorAll('[class*="card"]'));
  return cards.map((card) => ({
    text: card.textContent?.substring(0, 30),
    height: card.getBoundingClientRect().height,
    width: card.getBoundingClientRect().width,
  }));
});
```

### Check Sidebar State

```javascript
browser_evaluate(() => {
  const sidebar = document.querySelector('[class*="sidebar"]');
  return {
    visible: sidebar?.getBoundingClientRect().width > 0,
    width: sidebar?.getBoundingClientRect().width,
  };
});
```

### Get Active Filters

```javascript
browser_evaluate(() => {
  return {
    url: window.location.href,
    searchParams: Object.fromEntries(
      new URLSearchParams(window.location.search),
    ),
  };
});
```

## Screenshot Naming Convention

Use descriptive names with numbers for sequence:

- `01-initial-desktop.png`
- `02-sidebar-expanded.png`
- `03-sidebar-collapsed.png`
- `04-overview-stat-cards.png`
- `05-cases-tab-grid-view.png`
- `06-cases-tab-list-view.png`
- `07-mobile-overview.png`
- etc.

## Progress Tracking

Update the checklist in `checklist.md` as you complete each item:

- [x] Completed
- [ ] Not yet tested
- [⚠️] Partially tested (note what's missing)

## Priority Areas

Focus extra attention on:

1. **HIGH**: Sidebar collapse/expand state differences (especially card heights)
2. **HIGH**: Filter combinations and state persistence
3. **HIGH**: Responsive layouts across all breakpoints
4. **MEDIUM**: Animation smoothness and performance
5. **MEDIUM**: Empty states and error handling

## Final Deliverable

After completing all testing:

1. **Update `results.md`** with all findings organized by:
   - Working correctly (positive observations)
   - Issues found (with full documentation)
   - Recommendations (prioritized)
   - Test coverage summary

2. **Ensure all screenshots** are saved and referenced

3. **Update test coverage** in `results.md` showing what was tested vs. not tested

4. **Provide summary** of:
   - Total issues found
   - Severity breakdown
   - Priority recommendations

## Getting Started

1. Read `strategy.md` for test setup requirements
2. Read `checklist.md` to understand full scope
3. Start with `sidebar-navigation.md` for Phase 1
4. Work through each guide systematically
5. Document findings in `results.md` as you go

## Important Notes

- **Do NOT fix issues** - only document them
- **Take screenshots liberally** - visual evidence is crucial
- **Test both sidebar states** - expanded and collapsed
- **Test all viewport sizes** - mobile, tablet, desktop
- **Be thorough** - even minor issues should be documented
- **Use browser_evaluate** for precise measurements
- **Check console messages** for errors or warnings

## Questions?

Refer to the testing guides in `docs/dashboard/07-TESTING/` for detailed instructions on each testing area.

---

**Ready to begin? Start with Phase 1: Setup & Initial Testing above.**

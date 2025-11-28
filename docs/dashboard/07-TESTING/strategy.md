# Testing Strategy

## Overview

This document outlines the testing strategy and environment setup for comprehensive dashboard testing using Playwright MCP.

## Test Environment Setup

### Browser Configuration

1. **Browser**: Chrome/Chromium (default)
2. **Viewport Sizes**:
   - Desktop: 1920x1080, 1440x900, 1280x720
   - Tablet: 768x1024
   - Mobile: 375x667, 414x896
3. **Sidebar States**: Test with sidebar expanded AND collapsed states

### Authentication

- Ensure you're logged in as a user with dashboard access
- Test with a user that has multiple cases, some with missing data

### Data Requirements

Ensure test data includes:

- Cases with all statuses (draft, ongoing, completed, reviewed)
- Cases from different sources (manual, idexx_neo, etc.)
- Cases with missing discharges
- Cases with missing SOAP notes
- Cases with scheduled calls/emails (queued, in-progress, completed, failed)
- Cases from different date ranges

## Testing Approach

### Systematic Testing

1. Test each section methodically
2. Don't skip steps
3. Document everything, even minor issues

### Visual Documentation

- Take screenshots of issues
- Note specific pixel differences
- Document spacing issues

### State Comparison

- Always compare sidebar expanded vs collapsed
- Compare different viewport sizes
- Compare different filter states

### Interaction Testing

- Click, hover, type in every interactive element
- Test rapid interactions
- Test edge cases

## Documentation Format

For each issue found, document in this format:

```markdown
### Issue #X: [Brief Description]

**Location**: [Component/Page/Section]
**Severity**: [Critical/High/Medium/Low]
**State**: [Sidebar Expanded/Collapsed/Both]

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

**Visual Notes**:

- [Screenshot reference or description]
- [Measurement details if applicable]

**Responsive Impact**:

- Mobile: [Yes/No - description]
- Tablet: [Yes/No - description]
- Desktop: [Yes/No - description]

**Additional Notes**:
[Any other relevant information]
```

## Priority Areas for Testing

1. **HIGH PRIORITY**: Sidebar collapse/expand state differences (especially card heights)
2. **HIGH PRIORITY**: Filter combinations and state persistence
3. **HIGH PRIORITY**: Responsive layouts across all breakpoints
4. **MEDIUM PRIORITY**: Animation smoothness and performance
5. **MEDIUM PRIORITY**: Empty states and error handling
6. **LOW PRIORITY**: Accessibility improvements

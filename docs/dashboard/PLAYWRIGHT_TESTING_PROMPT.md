# Dashboard Testing Documentation

This document provides a comprehensive testing guide for the Odis AI Dashboard using Playwright MCP (Model Context Protocol).

**IMPORTANT**: This is a documentation/testing exercise. Do NOT implement any fixes - only document findings.

## Quick Navigation

All testing documentation has been organized into the [`07-TESTING/`](./07-TESTING/) directory. See the [Testing README](./07-TESTING/README.md) for the complete structure.

## Main Testing Documents

- **[Testing Overview & Index](./07-TESTING/README.md)** - Start here for testing documentation structure
- **[Testing Strategy](./07-TESTING/strategy.md)** - Test environment setup and approach
- **[Test Checklist](./07-TESTING/checklist.md)** - Comprehensive testing checklist
- **[Test Results](./07-TESTING/results.md)** - Test execution results and findings

## Navigation & Layout Testing

- **[Sidebar Navigation](./07-TESTING/sidebar-navigation.md)** - Sidebar, profile header, tab navigation, and date filters

## Tab-Specific Testing Guides

- **[Overview Tab](./07-TESTING/overview-tab.md)** - Complete testing guide for Overview tab
- **[Cases Tab](./07-TESTING/cases-tab.md)** - Complete testing guide for Cases tab
- **[Discharges Tab](./07-TESTING/discharges-tab.md)** - Complete testing guide for Discharges tab
- **[Case Detail Page](./07-TESTING/case-detail-page.md)** - Testing guide for individual case pages
- **[Settings Page](./07-TESTING/settings-page.md)** - Testing guide for settings page

## Cross-Cutting Testing Guides

- **[Responsive Design](./07-TESTING/responsive-design.md)** - Mobile, tablet, and desktop viewport testing
- **[Accessibility](./07-TESTING/accessibility.md)** - Keyboard navigation, screen readers, ARIA labels
- **[Animations & Interactions](./07-TESTING/animations-interactions.md)** - Page transitions, hover states, click feedback
- **[Edge Cases](./07-TESTING/edge-cases.md)** - Empty states, error handling, long content, rapid interactions
- **[Performance](./07-TESTING/performance.md)** - Load times, animation smoothness, frame rates

## Quick Start

1. **Read the Strategy**: Start with [strategy.md](./07-TESTING/strategy.md) to understand test setup
2. **Use the Checklist**: Follow [checklist.md](./07-TESTING/checklist.md) for systematic testing
3. **Test Each Tab**: Follow tab-specific guides in order
4. **Document Findings**: Record all findings in [results.md](./07-TESTING/results.md)
5. **Test Cross-Cutting**: Complete responsive, accessibility, and performance testing

## Testing Workflow

```
1. Setup (strategy.md)
   ↓
2. Overview Tab (overview-tab.md)
   ↓
3. Cases Tab (cases-tab.md)
   ↓
4. Discharges Tab (discharges-tab.md)
   ↓
5. Case Detail Page (case-detail-page.md)
   ↓
6. Settings Page (settings-page.md)
   ↓
7. Responsive Design (responsive-design.md)
   ↓
8. Accessibility (accessibility.md)
   ↓
9. Animations & Interactions (animations-interactions.md)
   ↓
10. Edge Cases (edge-cases.md)
   ↓
11. Performance (performance.md)
   ↓
12. Document Results (results.md)
```

## Key Principles

1. **Systematic Approach**: Test each section methodically, don't skip steps
2. **Visual Documentation**: Take screenshots of issues
3. **Measurements**: Note specific pixel differences, spacing issues
4. **Compare States**: Always compare sidebar expanded vs collapsed
5. **Test Interactions**: Click, hover, type in every interactive element
6. **Document Everything**: Even minor issues - they add up
7. **Be Specific**: Include exact component names, file paths when possible
8. **Note Patterns**: If an issue appears in multiple places, note it
9. **Performance**: Note any slow interactions or janky animations
10. **Accessibility**: Don't skip keyboard navigation and screen reader testing

## Related Documentation

- [Dashboard Overview](./README.md)
- [Tab Documentation](./02-TABS/)
- [Component Documentation](./03-COMPONENTS/)
- [Pattern Documentation](./04-PATTERNS/)

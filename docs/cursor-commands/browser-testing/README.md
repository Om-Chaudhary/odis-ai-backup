# Browser Testing Commands

This directory contains commands and workflows for visual testing using browser automation tools.

## Overview

Visual testing is a critical workflow in this project. We use browser automation to:

- Verify UI components render correctly
- Test responsive designs across viewports
- Validate accessibility features
- Check visual consistency
- Document visual regressions

## Tool Selection

**Primary Tool: Playwright MCP**

This project uses **Playwright MCP** (Model Context Protocol) for browser testing. See [tool-comparison.md](./tool-comparison.md) for detailed analysis.

**Why Playwright MCP?**

- Comprehensive browser automation features
- AI-friendly accessibility snapshots
- Cross-browser support
- Advanced interaction capabilities
- Well-documented and actively maintained

## Quick Start

### Basic Visual Test Workflow

1. **Navigate to page**

   ```
   Use: browser_navigate("http://localhost:3000/dashboard")
   ```

2. **Set viewport size**

   ```
   Use: browser_resize(1920, 1080)
   ```

3. **Take screenshot**

   ```
   Use: browser_take_screenshot("test-name.png")
   ```

4. **Get page snapshot**
   ```
   Use: browser_snapshot() to understand page structure
   ```

## Available Commands

See [visual-test-commands.md](./visual-test-commands.md) for complete command reference.

## Common Workflows

### Visual Regression Testing

1. Navigate to component/page
2. Set viewport size
3. Take baseline screenshot
4. Make changes
5. Take comparison screenshot
6. Document differences

### Responsive Design Testing

1. Test mobile viewport (375x667)
2. Test tablet viewport (768x1024)
3. Test desktop viewport (1920x1080)
4. Compare layouts
5. Document responsive issues

### Accessibility Testing

1. Get accessibility snapshot
2. Check ARIA labels
3. Test keyboard navigation
4. Verify focus indicators
5. Document accessibility issues

## Examples

See the [examples/](./examples/) directory for:

- Component visual testing
- Page-level testing
- Responsive design verification
- Accessibility checks

## Related Documentation

- [Tool Comparison](./tool-comparison.md) - Cursor vs Playwright MCP
- [Visual Test Commands](./visual-test-commands.md) - Complete command reference
- [Dashboard Testing Guide](../../dashboard/07-TESTING/) - Dashboard-specific testing
- [Testing Strategy](../../testing/TESTING_STRATEGY.md) - Overall testing approach

---

**Last Updated**: 2025-01-27

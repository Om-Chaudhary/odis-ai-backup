# Cursor Commands & Rules

This directory contains project-specific Cursor commands, rules, and workflow documentation for the ODIS AI Web application.

## Overview

This documentation system provides:

- **Project-level rules** (`.cursorrules` in project root) - Quick reference patterns
- **Detailed command documentation** - Step-by-step workflows for common tasks
- **Workflow templates** - Reusable patterns for new commands
- **Tool comparisons** - Analysis of available tools and when to use them

## Directory Structure

```
cursor-commands/
├── README.md                    # This file
├── browser-testing/             # Visual testing workflows
│   ├── README.md
│   ├── tool-comparison.md      # Cursor vs Playwright MCP
│   ├── visual-test-commands.md
│   └── examples/
│       ├── test-discharge-management.md
│       └── test-case-detail-page.md
├── component-development/        # Component dev workflows
│   ├── README.md
│   ├── component-commands.md
│   └── examples/
├── api-testing/                 # API testing workflows
│   ├── README.md
│   ├── api-test-commands.md
│   └── examples/
│       └── test-discharge-orchestration.md
├── debugging/                   # Debugging workflows
│   ├── README.md
│   ├── debug-commands.md
│   └── examples/
│       └── debug-discharge-readiness.md
└── templates/                   # Command templates
    ├── command-template.md
    └── rule-template.md
```

## Quick Navigation

### By Workflow

- **[Visual Testing](./browser-testing/)** - Browser-based visual testing and verification
- **[Component Development](./component-development/)** - Building and testing React components
- **[API Testing](./api-testing/)** - Testing API endpoints and integrations
- **[Debugging](./debugging/)** - Debugging workflows and patterns

### By Tool

- **[Browser Testing Tools](./browser-testing/tool-comparison.md)** - Cursor browser agent vs Playwright MCP
- **[Command Templates](./templates/)** - Templates for creating new commands

## Project-Specific Commands

### Dashboard Testing

- **[Test Discharge Management](./browser-testing/examples/test-discharge-management.md)** - Test the discharge management interface with filters, search, and actions
- **[Test Case Detail Page](./browser-testing/examples/test-case-detail-page.md)** - Test case detail page with all sections and interactions

### API Testing

- **[Test Discharge Orchestration](./api-testing/examples/test-discharge-orchestration.md)** - Test the `/api/discharge/orchestrate` endpoint with various inputs

### Debugging

- **[Debug Discharge Readiness](./debugging/examples/debug-discharge-readiness.md)** - Debug why cases aren't showing as ready for discharge

## Usage

### For AI Assistants (Claude/Cursor)

When working on this project, refer to:

1. **`.cursorrules`** - Quick project patterns and rules
2. **Workflow-specific docs** - Detailed commands for specific tasks
3. **Tool comparisons** - Understanding which tools to use

### For Developers

Use these commands as:

- **Reference guides** - When performing common workflows
- **Onboarding material** - Understanding project-specific patterns
- **Command templates** - Creating new workflows

## Integration with Project

This documentation integrates with:

- **[CLAUDE.md](../CLAUDE.md)** - Main AI assistant guide
- **[Testing Documentation](../testing/)** - Testing strategies and guides
- **[Dashboard Testing](../dashboard/07-TESTING/)** - Dashboard-specific testing

## Notion Integration

All documentation is structured for easy export to Notion:

- Clear headings and sections
- Metadata tags (workflow type, tool, priority)
- Code examples with syntax highlighting
- Step-by-step instructions

## Contributing

When adding new commands:

1. Use the [command template](./templates/command-template.md)
2. Follow the existing structure and format
3. Include examples in the `examples/` subdirectory
4. Update this README with links

## Related Documentation

- [Project README](../README.md) - Main documentation index
- [CLAUDE.md](../CLAUDE.md) - AI assistant guide
- [Testing Strategy](../testing/TESTING_STRATEGY.md) - Testing approach
- [Dashboard Testing](../dashboard/07-TESTING/) - Dashboard testing guides

---

**Last Updated**: 2025-01-27

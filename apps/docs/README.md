# ODIS AI Documentation

Documentation site built with [Docusaurus](https://docusaurus.io/) for the ODIS AI veterinary platform.

## Development

```bash
# Start development server
nx start docs

# Or from workspace root
pnpm nx start docs
```

The development server runs at `http://localhost:3000` with hot reloading.

## Build

```bash
# Build for production
nx build docs

# Output is in apps/docs/build/
```

## Available Commands

| Command             | Description                    |
| ------------------- | ------------------------------ |
| `nx start docs`     | Start development server       |
| `nx build docs`     | Build for production           |
| `nx serve docs`     | Serve production build locally |
| `nx typecheck docs` | TypeScript type checking       |
| `nx clear docs`     | Clear Docusaurus cache         |

## Documentation Structure

```
docs/
├── getting-started/      # Setup and quickstart guides
├── guides/               # Feature-specific guides
├── api/                  # API reference documentation
├── integrations/         # Third-party integration docs
└── intro.md              # Landing page (/)
```

## Adding Documentation

1. Create `.md` files in the appropriate `docs/` subdirectory
2. Add frontmatter with `sidebar_position` for ordering
3. Category configuration is in `_category_.json` files

```md
---
sidebar_position: 1
title: My Page Title
description: Brief description for SEO
---

# My Page

Content goes here...
```

## Styling

Custom ODIS branding is applied via:

- `src/css/custom.scss` - ODIS design tokens mapped to Infima variables
- `plugins/tailwind-plugin.js` - Tailwind CSS v4 integration

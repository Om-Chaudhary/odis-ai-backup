# Vitest Coverage Configuration

This document describes the coverage configuration and thresholds for the ODIS AI monorepo.

## Overview

All libraries in the monorepo use Vitest with v8 coverage provider and consistent coverage thresholds to ensure code quality and test completeness.

## Coverage Thresholds

The following minimum coverage thresholds are enforced across all libraries:

- **Lines**: 60%
- **Functions**: 60%
- **Branches**: 50%
- **Statements**: 60%

These thresholds are defined in `/vitest.config.shared.ts` and applied to all library configurations.

## Shared Configuration

The root-level `/vitest.config.shared.ts` provides:

1. **Shared coverage settings** (`sharedCoverageConfig`):
   - Coverage provider: v8
   - Reporters: text, json, html, lcov
   - Coverage thresholds (as above)
   - Standard exclusions

2. **Configuration factory** (`createVitestConfig`):
   - Helper function for creating consistent library configs
   - Allows per-library customization while maintaining defaults

## Coverage Reporters

All libraries generate four types of coverage reports:

- **text**: Console output during test runs
- **json**: Machine-readable coverage data
- **html**: Browsable HTML report in `{library}/coverage/`
- **lcov**: For CI/CD integration (e.g., Codecov, Coveralls)

## Standard Exclusions

The following files are excluded from coverage calculations:

- `node_modules/`
- `**/*.d.ts` (TypeScript definition files)
- `**/*.config.*` (Configuration files)
- `**/*.test.ts` and `**/*.spec.ts` (Test files)
- `**/index.ts` (Barrel exports)
- `**/types/**` (Type definitions)
- `**/__mocks__/**` (Mock implementations)
- `**/__tests__/**` (Test utilities)

## Library Coverage Configurations

All libraries follow the same pattern. Here are the libraries with updated configurations:

### Core Libraries
- `/libs/validators/vitest.config.ts`
- `/libs/utils/vitest.config.ts`
- `/libs/types/` (if applicable)

### Service Libraries
- `/libs/services-cases/vitest.config.ts`
- `/libs/services-discharge/vitest.config.ts`
- `/libs/services-shared/vitest.config.ts`

### Data & Repository Libraries
- `/libs/db/vitest.config.ts`
- `/libs/api/vitest.config.ts`

### Integration Libraries
- `/libs/vapi/vitest.config.ts`
- `/libs/qstash/vitest.config.ts`
- `/libs/ai/vitest.config.ts`

## Running Coverage

### Single Library
```bash
# Run tests with coverage for a specific library
nx test validators --coverage
nx test utils --coverage
nx test services-cases --coverage
```

### All Libraries
```bash
# Run all tests with coverage
pnpm test:coverage:all

# Or using nx directly
nx run-many -t test --coverage
```

### CI Mode
```bash
# Run tests in CI mode with coverage
pnpm test:ci

# This is equivalent to:
nx run-many -t test --coverage --ci
```

## Nx Integration

The `nx.json` configuration includes:

```json
{
  "targetDefaults": {
    "test": {
      "cache": true,
      "inputs": ["default", "^production"],
      "outputs": ["{projectRoot}/coverage"]
    }
  }
}
```

This ensures:
- Test results are cached for faster subsequent runs
- Coverage reports are stored in each project's `coverage/` directory
- Nx can track and invalidate cache based on test file changes

## Coverage Reports Location

Coverage reports are generated in each library's directory:

```
libs/
  validators/
    coverage/          # HTML, JSON, LCOV reports
  utils/
    coverage/
  services-cases/
    coverage/
  ...
```

## Adjusting Thresholds

### Library-Specific Overrides

If a library needs different thresholds, you can override them in its `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  // ... other config
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: path.resolve(__dirname, "coverage"),
      thresholds: {
        lines: 80,      // Higher threshold
        functions: 75,  // Higher threshold
        branches: 60,   // Higher threshold
        statements: 80, // Higher threshold
      },
      exclude: [
        // Standard exclusions
      ],
    },
  },
});
```

### Global Threshold Changes

To change thresholds globally, update `/vitest.config.shared.ts`:

```typescript
export const sharedCoverageConfig: CoverageOptions = {
  // ...
  thresholds: {
    lines: 70,      // Updated
    functions: 70,  // Updated
    branches: 60,   // Updated
    statements: 70, // Updated
  },
};
```

Then regenerate individual configs or apply changes manually to each library.

## Best Practices

1. **Run coverage locally** before pushing:
   ```bash
   pnpm test:coverage:all
   ```

2. **Check coverage reports** in the HTML output:
   ```bash
   open libs/validators/coverage/index.html
   ```

3. **Focus on meaningful coverage**:
   - Don't just chase numbers
   - Ensure critical paths are tested
   - Test edge cases and error handling

4. **Exclude appropriately**:
   - Type-only files don't need coverage
   - Pure configuration can be excluded
   - Focus coverage on business logic

5. **Increase thresholds incrementally**:
   - Start at 60% for new libraries
   - Increase to 70-80% as tests mature
   - Aim for 90%+ on critical services

## CI/CD Integration

The `pnpm test:ci` command is designed for CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests with coverage
  run: pnpm test:ci

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./libs/*/coverage/lcov.info
    flags: unittests
```

## Troubleshooting

### Coverage thresholds not met

If tests fail due to coverage thresholds:

1. Check which files are under-covered:
   ```bash
   nx test <library> --coverage
   ```

2. Review the HTML report for details:
   ```bash
   open libs/<library>/coverage/index.html
   ```

3. Add tests for uncovered code or adjust exclusions if appropriate

### Cache issues

If coverage seems incorrect:

```bash
# Clear Nx cache
nx reset

# Run tests again
pnpm test:coverage:all
```

## Future Improvements

Potential enhancements to consider:

1. **Per-file thresholds**: Set higher thresholds for critical files
2. **Trend tracking**: Monitor coverage over time
3. **Differential coverage**: Require 100% coverage on changed files
4. **Integration with PR checks**: Block PRs below threshold
5. **Coverage badges**: Display coverage in README files

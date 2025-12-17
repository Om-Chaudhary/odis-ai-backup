import { defineConfig, type CoverageOptions } from "vitest/config";

/**
 * Shared Vitest coverage configuration for all libraries in the monorepo.
 *
 * Coverage thresholds:
 * - lines: 60%
 * - functions: 60%
 * - branches: 50%
 * - statements: 60%
 *
 * Libraries can override these settings in their own vitest.config.ts if needed.
 */
export const sharedCoverageConfig: CoverageOptions = {
  provider: "v8",
  reporter: ["text", "json", "html", "lcov"],
  thresholds: {
    lines: 60,
    functions: 60,
    branches: 50,
    statements: 60,
  },
  exclude: [
    "node_modules/",
    "**/*.d.ts",
    "**/*.config.*",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/index.ts",
    "**/types/**",
    "**/__mocks__/**",
    "**/__tests__/**",
  ],
};

/**
 * Base Vitest configuration factory.
 * Use this in library vitest.config.ts files:
 *
 * @example
 * ```ts
 * import { createVitestConfig } from "../../vitest.config.shared";
 *
 * export default createVitestConfig({
 *   name: "my-lib",
 *   coverageDir: path.resolve(__dirname, "coverage"),
 * });
 * ```
 */
export function createVitestConfig(options: {
  name: string;
  coverageDir: string;
  coverageOverrides?: Partial<CoverageOptions>;
}) {
  return defineConfig({
    test: {
      name: options.name,
      globals: true,
      environment: "node",
      include: ["src/**/*.{test,spec}.ts", "{tests}/**/*.{test,spec}.ts"],
      exclude: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
      passWithNoTests: true,
      setupFiles: [],
      coverage: {
        ...sharedCoverageConfig,
        reportsDirectory: options.coverageDir,
        ...options.coverageOverrides,
      },
    },
  });
}

// Default export for Nx plugin compatibility
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [],
    passWithNoTests: true,
  },
});

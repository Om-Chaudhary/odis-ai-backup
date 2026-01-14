/**
 * Vitest Configuration for ODIS AI Nx Monorepo
 *
 * This configuration enables Vitest projects mode (Vitest 4.0+), allowing:
 * - Running tests across all projects with a single command
 * - Parallel test execution across projects
 * - Project-specific configurations while sharing common settings
 * - Aggregated coverage reports
 *
 * @see https://vitest.dev/guide/projects
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      // Main web application
      "apps/web/vitest.config.ts",

      // Library packages - will be enabled as vitest.config.ts files are created
      "libs/*/vitest.config.ts",
      "libs/*/*/vitest.config.ts",
      "libs/*/*/*/vitest.config.ts",
    ],
  },
});

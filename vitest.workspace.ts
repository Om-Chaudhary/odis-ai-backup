/**
 * Vitest Workspace Configuration for ODIS AI Nx Monorepo
 *
 * This configuration enables Vitest workspace mode, allowing:
 * - Running tests across all projects with a single command
 * - Parallel test execution across projects
 * - Project-specific configurations while sharing common settings
 * - Aggregated coverage reports
 *
 * @see https://vitest.dev/guide/workspace
 */
import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  // Main web application
  "apps/web/vitest.config.ts",

  // Library packages - will be enabled as vitest.config.ts files are created
  "libs/*/vitest.config.ts",
]);

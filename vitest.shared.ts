/**
 * Shared Vitest configuration for the ODIS AI Nx monorepo
 *
 * This provides a base configuration that can be extended by all apps and libs.
 * Use defineProject() from 'vitest/config' in individual project configs.
 *
 * @example
 * // libs/my-lib/vitest.config.ts
 * import { defineProject, mergeConfig } from 'vitest/config';
 * import { createSharedConfig } from '../../vitest.shared';
 *
 * export default mergeConfig(
 *   createSharedConfig(__dirname),
 *   defineProject({
 *     // project-specific overrides
 *   })
 * );
 */
import { type ViteUserConfig as UserConfig } from "vitest/config";
import path from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";

export interface SharedConfigOptions {
  /**
   * Root directory of the project (pass __dirname)
   */
  root: string;

  /**
   * Test environment - 'node' for libs, 'happy-dom' for React components
   * @default 'node'
   */
  environment?: "node" | "happy-dom" | "jsdom";

  /**
   * Whether this project includes React components
   * @default false
   */
  react?: boolean;

  /**
   * Custom setup files relative to project root
   */
  setupFiles?: string[];

  /**
   * Additional test file patterns to include
   */
  includePatterns?: string[];

  /**
   * Additional patterns to exclude from coverage
   */
  coverageExclude?: string[];
}

/**
 * Creates a shared Vitest configuration for a project
 */
export function createSharedConfig(options: SharedConfigOptions): UserConfig {
  const {
    root,
    environment = "node",
    react = false,
    setupFiles = [],
    includePatterns = [],
    coverageExclude = [],
  } = options;

  // Base plugins - always include tsconfig paths
  const plugins: UserConfig["plugins"] = [
    tsconfigPaths({
      root: path.resolve(root, "../.."),
    }),
  ];

  // Add React plugin if needed (lazy loaded)
  if (react) {
    // React plugin will be added dynamically by the project
  }

  return {
    plugins,
    test: {
      globals: true,
      environment,
      root,

      // Test file patterns
      include: [
        "**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        ...includePatterns,
      ],

      // Exclusions
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/.{idea,git,cache,output,temp}/**",
        "**/e2e/**",
        "**/coverage/**",
      ],

      // Setup files
      setupFiles: setupFiles.length > 0 ? setupFiles : undefined,

      // Reporter configuration
      reporters: ["default"],

      // Pool configuration for better isolation
      pool: "forks",
      poolOptions: {
        forks: {
          singleFork: false,
        },
      },

      // Coverage configuration
      coverage: {
        enabled: false, // Enable via --coverage flag
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"],
        reportsDirectory: path.resolve(root, "coverage"),

        // Coverage thresholds (can be overridden per project)
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },

        // Exclusions
        exclude: [
          "node_modules/",
          "**/test/**",
          "**/__tests__/**",
          "**/__mocks__/**",
          "**/*.d.ts",
          "**/*.config.*",
          "**/mockData/**",
          "**/*.test.{ts,tsx}",
          "**/*.spec.{ts,tsx}",
          "**/index.ts", // Re-export files typically don't need coverage
          ...coverageExclude,
        ],
      },

      // Timeouts
      testTimeout: 10000,
      hookTimeout: 10000,

      // Watch mode settings
      watch: false,
      watchExclude: ["**/node_modules/**", "**/dist/**"],

      // Snapshot settings
      snapshotFormat: {
        printBasicPrototype: false,
      },
    },
  };
}

/**
 * Creates a React-enabled shared configuration
 * Includes happy-dom environment and React Testing Library setup
 */
export function createReactConfig(
  options: Omit<SharedConfigOptions, "react" | "environment">,
): UserConfig {
  return createSharedConfig({
    ...options,
    environment: "happy-dom",
    react: true,
  });
}

/**
 * Creates a Node.js-only shared configuration
 * Optimized for testing pure functions, services, and utilities
 */
export function createNodeConfig(
  options: Omit<SharedConfigOptions, "react" | "environment">,
): UserConfig {
  return createSharedConfig({
    ...options,
    environment: "node",
    react: false,
  });
}

export default createSharedConfig;

import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [tsconfigPaths({ root: path.resolve(__dirname, "../../..") })],
  test: {
    name: "utils",
    globals: true,
    environment: "node",
    root: __dirname,
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    passWithNoTests: true,
    setupFiles: [],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: path.resolve(__dirname, "coverage"),
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
      ],
    },
  },
});

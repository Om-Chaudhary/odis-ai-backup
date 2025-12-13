import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [
    tsconfigPaths({
      root: path.resolve(__dirname, "../.."),
    }),
  ],
  test: {
    name: "services-cases",
    globals: true,
    environment: "node",
    root: __dirname,
    include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/.git/**"],
    passWithNoTests: true,
    setupFiles: [],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: path.resolve(__dirname, "coverage"),
      exclude: [
        "node_modules/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/index.ts",
      ],
    },
  },
});

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["../../../libs/shared/testing/src/setup/node.ts"],
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@odis-ai/shared/constants": path.resolve(
        __dirname,
        "../../../libs/shared/constants/src",
      ),
      "@odis-ai/shared/logger": path.resolve(
        __dirname,
        "../../../libs/shared/logger/src",
      ),
    },
  },
});

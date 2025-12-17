import { config } from "dotenv";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const baseEnv =
  (
    config({
      path: `${__dirname}/../../../../.env`,
    }) as { parsed?: Record<string, string> }
  ).parsed ?? {};

export const dynamicEnvValues = {
  CEB_NODE_ENV: baseEnv.CEB_DEV === "true" ? "development" : "production",
} as const;

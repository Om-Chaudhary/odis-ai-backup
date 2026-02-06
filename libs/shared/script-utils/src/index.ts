/**
 * Script utilities library
 *
 * Provides standardized infrastructure for scripts:
 * - Environment variable loading
 * - Supabase client creation
 * - CLI argument parsing
 * - Logging utilities
 *
 * @example
 * import {
 *   loadScriptEnv,
 *   parseScriptArgs,
 *   createScriptSupabaseClient,
 *   scriptLog,
 * } from "@odis-ai/shared/script-utils";
 *
 * loadScriptEnv({ required: ["SUPABASE_SERVICE_ROLE_KEY"] });
 * const args = parseScriptArgs();
 * const supabase = createScriptSupabaseClient();
 *
 * if (args.dryRun) {
 *   scriptLog.dryRun("Would process records...");
 * }
 */

export { loadScriptEnv, requireEnv, optionalEnv } from "./env-loader";
export { createScriptSupabaseClient } from "./supabase";
export { parseScriptArgs, showHelp, type ScriptArgs } from "./cli";
export { scriptLog } from "./logger";

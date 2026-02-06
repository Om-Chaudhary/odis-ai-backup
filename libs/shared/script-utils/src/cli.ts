/**
 * CLI argument parsing utilities for scripts
 */

export interface ScriptArgs {
  /** Dry run mode - show what would happen without making changes */
  dryRun: boolean;
  /** Verbose output mode */
  verbose: boolean;
  /** Limit number of records to process */
  limit?: number;
  /** Filter by number of days (e.g., last 30 days) */
  days?: number;
  /** Additional custom flags */
  [key: string]: boolean | number | string | undefined;
}

interface FlagConfig {
  type: "boolean" | "number" | "string";
  default?: boolean | number | string;
  alias?: string;
}

interface ParseArgsConfig {
  flags?: Record<string, FlagConfig>;
}

/**
 * Parses command line arguments for scripts
 * Supports standard flags: --dry-run, --verbose, --limit=N, --days=N
 *
 * @example
 * const args = parseScriptArgs({
 *   flags: {
 *     "clinic-id": { type: "string" },
 *     "force": { type: "boolean", default: false }
 *   }
 * });
 * console.log(args.dryRun, args.limit, args["clinic-id"]);
 */
export function parseScriptArgs(config: ParseArgsConfig = {}): ScriptArgs {
  const args = process.argv.slice(2);
  const result: ScriptArgs = {
    dryRun: false,
    verbose: false,
    limit: undefined,
    days: undefined,
  };

  // Built-in flags
  const builtInFlags: Record<string, FlagConfig> = {
    "dry-run": { type: "boolean", default: false },
    verbose: { type: "boolean", default: false, alias: "v" },
    limit: { type: "number" },
    days: { type: "number" },
  };

  const allFlags = { ...builtInFlags, ...config.flags };

  for (const arg of args) {
    // Handle --flag=value format
    if (arg.startsWith("--")) {
      const parts = arg.slice(2).split("=");
      const key = parts[0];
      const rawValue = parts[1];

      if (!key) continue;

      const flagConfig = allFlags[key];

      if (flagConfig) {
        if (flagConfig.type === "boolean") {
          result[toCamelCase(key)] = rawValue !== "false";
        } else if (flagConfig.type === "number" && rawValue) {
          const num = parseInt(rawValue, 10);
          if (!isNaN(num)) {
            result[toCamelCase(key)] = num;
          }
        } else if (rawValue) {
          result[toCamelCase(key)] = rawValue;
        }
      }
    }
    // Handle -v style short flags
    else if (arg.startsWith("-") && !arg.startsWith("--")) {
      const shortFlag = arg.slice(1);
      for (const [key, flagConfig] of Object.entries(allFlags)) {
        if (flagConfig.alias === shortFlag && flagConfig.type === "boolean") {
          result[toCamelCase(key)] = true;
        }
      }
    }
  }

  // Apply defaults for missing flags
  for (const [key, flagConfig] of Object.entries(allFlags)) {
    const camelKey = toCamelCase(key);
    if (result[camelKey] === undefined && flagConfig.default !== undefined) {
      result[camelKey] = flagConfig.default;
    }
  }

  return result;
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Shows help text for a script
 */
export function showHelp(scriptName: string, description: string): void {
  console.log(`
Usage: pnpm tsx ${scriptName} [options]

${description}

Options:
  --dry-run     Show what would happen without making changes
  --verbose     Show detailed output
  --limit=N     Limit number of records to process
  --days=N      Filter to last N days

Examples:
  pnpm tsx ${scriptName} --dry-run
  pnpm tsx ${scriptName} --limit=10 --verbose
`);
}

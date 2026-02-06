/**
 * Logging utilities for scripts
 */

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

/**
 * Script logging utilities with consistent formatting
 *
 * @example
 * scriptLog.info("Processing 100 records...");
 * scriptLog.success("Done!");
 * scriptLog.warn("Skipped 5 records");
 * scriptLog.error("Failed:", error);
 */
export const scriptLog = {
  /** Log informational message */
  info: (...args: unknown[]): void => {
    console.log(`${colors.blue}[INFO]${colors.reset}`, ...args);
  },

  /** Log success message */
  success: (...args: unknown[]): void => {
    console.log(`${colors.green}[SUCCESS]${colors.reset}`, ...args);
  },

  /** Log warning message */
  warn: (...args: unknown[]): void => {
    console.log(`${colors.yellow}[WARN]${colors.reset}`, ...args);
  },

  /** Log error message */
  error: (...args: unknown[]): void => {
    console.error(`${colors.red}[ERROR]${colors.reset}`, ...args);
  },

  /** Log debug message (only shown in verbose mode) */
  debug: (...args: unknown[]): void => {
    if (process.env.VERBOSE === "true" || process.argv.includes("--verbose")) {
      console.log(`${colors.dim}[DEBUG]${colors.reset}`, ...args);
    }
  },

  /** Log a divider line */
  divider: (): void => {
    console.log(`${colors.dim}${"─".repeat(50)}${colors.reset}`);
  },

  /** Log a header with emphasis */
  header: (text: string): void => {
    console.log();
    console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`);
    console.log(`${colors.dim}${"─".repeat(text.length)}${colors.reset}`);
  },

  /** Log progress update (same line) */
  progress: (current: number, total: number, message = ""): void => {
    const percent = Math.round((current / total) * 100);
    const bar =
      "█".repeat(Math.floor(percent / 5)) +
      "░".repeat(20 - Math.floor(percent / 5));
    process.stdout.write(
      `\r${colors.cyan}[${bar}]${colors.reset} ${percent}% (${current}/${total}) ${message}`,
    );
    if (current === total) {
      console.log(); // New line when complete
    }
  },

  /** Log a table of data */
  table: (data: Record<string, unknown>[]): void => {
    console.table(data);
  },

  /** Log dry run mode indicator */
  dryRun: (message: string): void => {
    console.log(`${colors.yellow}[DRY RUN]${colors.reset} ${message}`);
  },
};

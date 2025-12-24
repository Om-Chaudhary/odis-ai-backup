/**
 * Browser-safe logger for Chrome extensions and client-side code
 * Uses console methods directly without Node.js dependencies
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  namespace?: string;
  level?: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export function createBrowserLogger(options: LoggerOptions = {}) {
  const { namespace = "", level = "info" } = options;
  const minLevel = LOG_LEVELS[level];

  const log = (logLevel: LogLevel, message: string, data?: unknown) => {
    if (LOG_LEVELS[logLevel] < minLevel) return;

    const prefix = namespace ? `[${namespace}]` : "";
    const method = logLevel === "debug" ? "log" : logLevel;
    const timestamp = new Date().toISOString();

    if (data !== undefined) {
      console[method](`${timestamp} ${prefix} ${message}`, data);
    } else {
      console[method](`${timestamp} ${prefix} ${message}`);
    }
  };

  return {
    debug: (msg: string, data?: unknown) => log("debug", msg, data),
    info: (msg: string, data?: unknown) => log("info", msg, data),
    warn: (msg: string, data?: unknown) => log("warn", msg, data),
    error: (msg: string, data?: unknown) => log("error", msg, data),
    child: (childNamespace: string) =>
      createBrowserLogger({
        namespace: namespace
          ? `${namespace}:${childNamespace}`
          : childNamespace,
        level,
      }),
  };
}

// Default logger instance
export const logger = createBrowserLogger();

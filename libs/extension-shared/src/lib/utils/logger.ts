import { COLORS } from "./const";
import { IS_DEV } from "@odis-ai/extension-env";

/**
 * Log levels in order of severity (lowest to highest)
 */
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Emoji icons for each log level
 */
const LOG_EMOJIS = {
  [LogLevel.DEBUG]: "🔍",
  [LogLevel.INFO]: "ℹ️",
  [LogLevel.WARN]: "⚠️",
  [LogLevel.ERROR]: "❌",
} as const;

/**
 * ANSI color codes for terminal output
 */
const LOG_COLORS = {
  [LogLevel.DEBUG]: COLORS.FgBlack + COLORS.Dim,
  [LogLevel.INFO]: COLORS.FgBlue,
  [LogLevel.WARN]: COLORS.FgYellow,
  [LogLevel.ERROR]: COLORS.FgRed,
} as const;

/**
 * CSS styles for browser console output
 */
const LOG_STYLES = {
  [LogLevel.DEBUG]: "color: #888; font-weight: normal;",
  [LogLevel.INFO]: "color: #2196F3; font-weight: normal;",
  [LogLevel.WARN]: "color: #FF9800; font-weight: bold;",
  [LogLevel.ERROR]: "color: #F44336; font-weight: bold;",
} as const;

/**
 * Logger configuration
 */
interface LoggerConfig {
  /**
   * Minimum log level to output (logs below this level are ignored)
   * Defaults to DEBUG in development, INFO in production
   */
  level?: LogLevel;
  /**
   * Whether to include timestamps in logs
   */
  includeTimestamp?: boolean;
  /**
   * Whether to include context information
   */
  includeContext?: boolean;
}

/**
 * Log entry data
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  prefix?: string;
  timestamp?: string;
}

/**
 * Transport function for handling log entries
 * Can be extended to send logs to external services, files, etc.
 */
type LogTransport = (entry: LogEntry) => void;

/**
 * Check if we're in a browser environment (supports CSS styling)
 */
const isBrowser =
  typeof window !== "undefined" && typeof window.console !== "undefined";

/**
 * Default console transport with colors and emojis
 */
const consoleTransport: LogTransport = (entry: LogEntry) => {
  const { level, message, context, prefix, timestamp } = entry;
  const emoji = LOG_EMOJIS[level];
  const timestampStr = timestamp ? `[${timestamp}] ` : "";
  const prefixStr = prefix ? `${prefix} ` : "";

  // Build the formatted message
  const formattedMessage = `${emoji} ${timestampStr}${prefixStr}${message}`;

  // Use CSS styling for browser console, ANSI codes for terminal
  if (isBrowser) {
    const style = LOG_STYLES[level];
    const logArgs: unknown[] = [`%c${formattedMessage}`, style];

    if (context && Object.keys(context).length > 0) {
      logArgs.push(context);
    }

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(...logArgs);
        break;
      case LogLevel.INFO:
        console.info(...logArgs);
        break;
      case LogLevel.WARN:
        console.warn(...logArgs);
        break;
      case LogLevel.ERROR:
        console.error(...logArgs);
        break;
    }
  } else {
    // Terminal/Node.js environment - use ANSI colors
    const color = LOG_COLORS[level];
    const reset = COLORS.Reset;
    const coloredMessage = `${color}${formattedMessage}${reset}`;

    const logArgs: unknown[] = [coloredMessage];
    if (context && Object.keys(context).length > 0) {
      logArgs.push(context);
    }

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(...logArgs);
        break;
      case LogLevel.INFO:
        console.info(...logArgs);
        break;
      case LogLevel.WARN:
        console.warn(...logArgs);
        break;
      case LogLevel.ERROR:
        console.error(...logArgs);
        break;
    }
  }
};

/**
 * Logger class
 */
class Logger {
  private config: Required<LoggerConfig>;
  private transports: LogTransport[];

  constructor(config: LoggerConfig = {}) {
    this.config = {
      // Production: Only WARN and ERROR. Development: All levels including DEBUG
      level: config.level ?? (IS_DEV ? LogLevel.DEBUG : LogLevel.WARN),
      includeTimestamp: config.includeTimestamp ?? IS_DEV,
      includeContext: config.includeContext ?? true,
    };
    this.transports = [consoleTransport];
  }

  /**
   * Add a custom transport (e.g., external logging service)
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /**
   * Remove a transport
   */
  removeTransport(transport: LogTransport): void {
    this.transports = this.transports.filter((t) => t !== transport);
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Internal method to log an entry
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    prefix?: string,
  ): void {
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context: this.config.includeContext ? context : undefined,
      prefix,
      timestamp: this.config.includeTimestamp
        ? new Date().toISOString()
        : undefined,
    };

    this.transports.forEach((transport) => {
      try {
        transport(entry);
      } catch (error) {
        // Fallback to console if transport fails (use plain console to avoid recursion)

        console.error("❌ [Logger] Transport error:", error);
      }
    });
  }

  /**
   * Log a debug message
   */
  debug(
    message: string,
    context?: Record<string, unknown>,
    prefix?: string,
  ): void {
    this.log(LogLevel.DEBUG, message, context, prefix);
  }

  /**
   * Log an info message
   */
  info(
    message: string,
    context?: Record<string, unknown>,
    prefix?: string,
  ): void {
    this.log(LogLevel.INFO, message, context, prefix);
  }

  /**
   * Log a warning message
   */
  warn(
    message: string,
    context?: Record<string, unknown>,
    prefix?: string,
  ): void {
    this.log(LogLevel.WARN, message, context, prefix);
  }

  /**
   * Log an error message
   */
  error(
    message: string,
    context?: Record<string, unknown>,
    prefix?: string,
  ): void {
    this.log(LogLevel.ERROR, message, context, prefix);
  }

  /**
   * Create a child logger with a default prefix
   */
  child(prefix: string): Logger {
    const childLogger = new Logger(this.config);
    childLogger.transports = [...this.transports];

    // Override public methods to include prefix
    const originalDebug = childLogger.debug.bind(childLogger);
    const originalInfo = childLogger.info.bind(childLogger);
    const originalWarn = childLogger.warn.bind(childLogger);
    const originalError = childLogger.error.bind(childLogger);

    childLogger.debug = (
      message: string,
      context?: Record<string, unknown>,
      prefixOverride?: string,
    ) => {
      originalDebug(message, context, prefixOverride ?? prefix);
    };

    childLogger.info = (
      message: string,
      context?: Record<string, unknown>,
      prefixOverride?: string,
    ) => {
      originalInfo(message, context, prefixOverride ?? prefix);
    };

    childLogger.warn = (
      message: string,
      context?: Record<string, unknown>,
      prefixOverride?: string,
    ) => {
      originalWarn(message, context, prefixOverride ?? prefix);
    };

    childLogger.error = (
      message: string,
      context?: Record<string, unknown>,
      prefixOverride?: string,
    ) => {
      originalError(message, context, prefixOverride ?? prefix);
    };

    return childLogger;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a new logger instance with custom configuration
 */
export const createLogger = function (config?: LoggerConfig): Logger {
  return new Logger(config);
};

/**
 * Export LogLevel for external use
 */
export { LogLevel as LoggerLevel };

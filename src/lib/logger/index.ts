/**
 * Structured Logging Utility
 *
 * Provides consistent, searchable logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Structured context (key-value pairs)
 * - Namespacing for different modules
 * - JSON output for log aggregation services
 *
 * @example
 * ```ts
 * const logger = createLogger("vapi-webhook");
 *
 * logger.info("Webhook received", {
 *   callId: "123",
 *   eventType: "status-update",
 *   status: "in-progress"
 * });
 *
 * logger.error("Call creation failed", {
 *   error: error.message,
 *   phoneNumber: "+11234567890"
 * });
 * ```
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  namespace: string;
  message: string;
  context?: LogContext;
  environment?: string;
}

/**
 * Logger class with structured logging capabilities
 */
export class Logger {
  constructor(private namespace: string) {}

  /**
   * Core logging method - formats and outputs log entries
   *
   * @param level - Log level (debug, info, warn, error)
   * @param message - Human-readable log message
   * @param context - Additional structured data
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      namespace: this.namespace,
      message,
      context,
      environment: process.env.NODE_ENV,
    };

    // In production, send to log aggregation service (e.g., Datadog, Sentry, LogTail)
    if (process.env.NODE_ENV === "production") {
      // TODO: Integrate with log aggregation service
      // Example: await logAggregator.send(logEntry);
    }

    // Format for console output
    const formattedMessage = this.formatConsoleOutput(logEntry);

    // Output to appropriate console method
    switch (level) {
      case "debug":
        console.debug(formattedMessage);
        break;
      case "info":
        console.info(formattedMessage);
        break;
      case "warn":
        console.warn(formattedMessage);
        break;
      case "error":
        console.error(formattedMessage);
        break;
    }
  }

  /**
   * Formats log entry for console output
   * - Development: Human-readable format
   * - Production: JSON format for parsing
   *
   * @param entry - Log entry to format
   * @returns Formatted string
   */
  private formatConsoleOutput(entry: LogEntry): string {
    if (process.env.NODE_ENV === "production") {
      // JSON format for production (easier to parse by log aggregators)
      return JSON.stringify(entry);
    }

    // Human-readable format for development
    const contextStr = entry.context
      ? ` ${JSON.stringify(entry.context, null, 2)}`
      : "";

    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.namespace}] ${entry.message}${contextStr}`;
  }

  /**
   * Log debug information (verbose, development only)
   *
   * @param message - Debug message
   * @param context - Additional context
   *
   * @example
   * ```ts
   * logger.debug("Processing call variables", {
   *   petName: "Max",
   *   ownerName: "John Doe"
   * });
   * ```
   */
  debug(message: string, context?: LogContext): void {
    // Only log debug in development
    if (process.env.NODE_ENV !== "production") {
      this.log("debug", message, context);
    }
  }

  /**
   * Log informational messages (normal operations)
   *
   * @param message - Info message
   * @param context - Additional context
   *
   * @example
   * ```ts
   * logger.info("Call scheduled successfully", {
   *   callId: "123",
   *   scheduledFor: "2025-11-17T10:00:00Z"
   * });
   * ```
   */
  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  /**
   * Log warnings (unusual but not error conditions)
   *
   * @param message - Warning message
   * @param context - Additional context
   *
   * @example
   * ```ts
   * logger.warn("Retry attempt for failed call", {
   *   callId: "123",
   *   retryCount: 2,
   *   maxRetries: 3
   * });
   * ```
   */
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  /**
   * Log errors (operation failures, exceptions)
   *
   * @param message - Error message
   * @param context - Additional context (include error details, stack traces)
   *
   * @example
   * ```ts
   * logger.error("Failed to create VAPI call", {
   *   error: error.message,
   *   stack: error.stack,
   *   callId: "123",
   *   phoneNumber: "+11234567890"
   * });
   * ```
   */
  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }

  /**
   * Log errors with full Error object details
   *
   * @param message - Error message
   * @param error - Error instance
   * @param context - Additional context
   *
   * @example
   * ```ts
   * try {
   *   await createCall();
   * } catch (error) {
   *   logger.logError("Call creation failed", error, { callId: "123" });
   * }
   * ```
   */
  logError(message: string, error: Error, context?: LogContext): void {
    this.error(message, {
      ...context,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    });
  }

  /**
   * Create a child logger with nested namespace
   *
   * @param childNamespace - Child namespace to append
   * @returns New Logger instance with combined namespace
   *
   * @example
   * ```ts
   * const logger = createLogger("api");
   * const webhookLogger = logger.child("webhook");
   * webhookLogger.info("Processing webhook"); // [api:webhook] Processing webhook
   * ```
   */
  child(childNamespace: string): Logger {
    return new Logger(`${this.namespace}:${childNamespace}`);
  }
}

/**
 * Creates a new logger instance with the given namespace
 *
 * @param namespace - Logger namespace (e.g., "vapi-webhook", "call-service")
 * @returns Logger instance
 *
 * @example
 * ```ts
 * const logger = createLogger("call-scheduling");
 * logger.info("Scheduling call", { phoneNumber: "+11234567890" });
 * ```
 */
export function createLogger(namespace: string): Logger {
  return new Logger(namespace);
}

/**
 * Pre-configured loggers for common modules
 */
export const loggers = {
  api: createLogger("api"),
  auth: createLogger("auth"),
  database: createLogger("database"),
  webhook: createLogger("webhook"),
  vapi: createLogger("vapi"),
  email: createLogger("email"),
  qstash: createLogger("qstash"),
  supabase: createLogger("supabase"),
} as const;

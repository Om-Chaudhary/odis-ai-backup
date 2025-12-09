/**
 * Structured Logging Utility
 *
 * Provides consistent, searchable logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Structured context (key-value pairs)
 * - Namespacing for different modules
 * - JSON output for log aggregation services
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

export class Logger {
  constructor(private namespace: string) {}

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      namespace: this.namespace,
      message,
      context,
      environment: process.env.NODE_ENV,
    };

    if (process.env.NODE_ENV === "production") {
      // TODO: integrate with log aggregation service
    }

    const formattedMessage = this.formatConsoleOutput(logEntry);

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

  private formatConsoleOutput(entry: LogEntry): string {
    if (process.env.NODE_ENV === "production") {
      return JSON.stringify(entry);
    }

    const contextStr = entry.context
      ? ` ${JSON.stringify(entry.context, null, 2)}`
      : "";

    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.namespace}] ${entry.message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== "production") {
      this.log("debug", message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }

  logError(message: string, error: Error, context?: LogContext): void {
    this.error(message, {
      ...context,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    });
  }

  child(childNamespace: string): Logger {
    return new Logger(`${this.namespace}:${childNamespace}`);
  }
}

export function createLogger(namespace: string): Logger {
  return new Logger(namespace);
}

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

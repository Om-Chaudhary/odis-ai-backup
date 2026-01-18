/**
 * Structured Logging Utility
 *
 * Provides consistent, searchable logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Structured context (key-value pairs)
 * - Namespacing for different modules
 * - JSON output for log aggregation services
 * - Custom transports (Axiom, CloudWatch, etc.)
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
 * Log transport interface
 * Implement this to send logs to external services (Axiom, CloudWatch, etc.)
 */
export interface LogTransport {
  log(entry: LogEntry): void;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}

export class Logger {
  private transports: LogTransport[] = [];

  constructor(
    private namespace: string,
    options?: {
      transports?: LogTransport[];
    },
  ) {
    this.transports = options?.transports ?? [];
  }

  /**
   * Add a transport to this logger
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /**
   * Flush all transports (if they support flushing)
   */
  async flush(): Promise<void> {
    await Promise.all(
      this.transports.map((t) => (t.flush ? t.flush() : Promise.resolve())),
    );
  }

  /**
   * Close all transports (if they support closing)
   */
  async close(): Promise<void> {
    await Promise.all(
      this.transports.map((t) => (t.close ? t.close() : Promise.resolve())),
    );
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      namespace: this.namespace,
      message,
      context,
      environment: process.env.NODE_ENV,
    };

    // Send to all transports
    for (const transport of this.transports) {
      try {
        transport.log(logEntry);
      } catch (error) {
        console.error(
          `[Logger] Transport failed for ${this.namespace}:`,
          error,
        );
      }
    }

    // Always log to console
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
    return new Logger(`${this.namespace}:${childNamespace}`, {
      transports: this.transports,
    });
  }
}

export function createLogger(
  namespace: string,
  options?: {
    transports?: LogTransport[];
  },
): Logger {
  return new Logger(namespace, options);
}

/**
 * Create a logger with Axiom transport
 * Note: Import AxiomLoggerAdapter from @odis-ai/integrations/axiom and pass it as a transport
 *
 * @example
 * ```typescript
 * import { AxiomLoggerAdapter } from '@odis-ai/integrations/axiom';
 * import { createLogger } from '@odis-ai/shared/logger';
 *
 * const adapter = new AxiomLoggerAdapter({
 *   apiToken: process.env.AXIOM_API_TOKEN!,
 *   dataset: 'idexx-sync',
 * });
 *
 * const logger = createLogger('idexx-sync', {
 *   transports: [adapter]
 * });
 *
 * // Or add transport to existing logger
 * const logger = createLogger('idexx-sync');
 * logger.addTransport(adapter);
 * ```
 */
export function createLoggerWithTransports(
  namespace: string,
  transports: LogTransport[],
): Logger {
  return new Logger(namespace, { transports });
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

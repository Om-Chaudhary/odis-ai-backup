import type { LogEntry, LogTransport } from "@odis-ai/shared/logger";
import { AxiomTransport } from "./axiom.transport";
import type { AxiomTransportConfig, AxiomLogEntry } from "./types";

/**
 * Adapter to connect AxiomTransport to the shared logger's LogTransport interface
 *
 * @example
 * ```typescript
 * import { AxiomLoggerAdapter } from '@odis-ai/integrations/axiom';
 * import { createLogger } from '@odis-ai/shared/logger';
 *
 * const adapter = new AxiomLoggerAdapter({
 *   apiToken: process.env.AXIOM_API_TOKEN!,
 *   dataset: 'idexx-sync'
 * });
 *
 * const logger = createLogger('idexx-sync', {
 *   transports: [adapter]
 * });
 * ```
 */
export class AxiomLoggerAdapter implements LogTransport {
  private axiomTransport: AxiomTransport;

  constructor(config: AxiomTransportConfig) {
    this.axiomTransport = new AxiomTransport(config);
  }

  log(entry: LogEntry): void {
    const axiomEntry: AxiomLogEntry = {
      _time: entry.timestamp,
      level: entry.level,
      message: entry.message,
      namespace: entry.namespace,
      environment: entry.environment,
      ...entry.context, // Spread context fields as top-level fields for better querying
    };

    this.axiomTransport.log(axiomEntry);
  }

  async flush(): Promise<void> {
    await this.axiomTransport.flush();
  }

  async close(): Promise<void> {
    await this.axiomTransport.close();
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.axiomTransport.getBufferSize();
  }
}

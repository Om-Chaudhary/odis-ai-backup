import type {
  AxiomLogEntry,
  AxiomTransportConfig,
  AxiomIngestResponse,
} from "./types";

/**
 * Axiom transport for batched log ingestion
 *
 * Features:
 * - Automatic batching with configurable size
 * - Periodic auto-flush
 * - Manual flush support
 * - Error handling and retry logic
 *
 * @example
 * ```typescript
 * const transport = new AxiomTransport({
 *   apiToken: process.env.AXIOM_API_TOKEN!,
 *   dataset: 'idexx-sync',
 *   batchSize: 100,
 *   flushIntervalMs: 10000
 * });
 *
 * transport.log({
 *   _time: new Date().toISOString(),
 *   level: 'info',
 *   message: 'Sync completed',
 *   namespace: 'idexx-sync',
 *   casesCreated: 42
 * });
 *
 * await transport.flush();
 * await transport.close();
 * ```
 */
export class AxiomTransport {
  private buffer: AxiomLogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isClosed = false;

  private readonly apiToken: string;
  private readonly dataset: string;
  private readonly batchSize: number;
  private readonly flushIntervalMs: number;
  private readonly debug: boolean;
  private readonly apiUrl: string;

  constructor(config: AxiomTransportConfig) {
    this.apiToken = config.apiToken;
    this.dataset = config.dataset;
    this.batchSize = config.batchSize ?? 100;
    this.flushIntervalMs = config.flushIntervalMs ?? 10000;
    this.debug = config.debug ?? false;
    this.apiUrl = `https://api.axiom.co/v1/datasets/${this.dataset}/ingest`;

    // Start auto-flush timer
    this.startFlushTimer();
  }

  /**
   * Add a log entry to the buffer
   * Automatically flushes when batch size is reached
   */
  log(entry: AxiomLogEntry): void {
    if (this.isClosed) {
      console.warn("[AxiomTransport] Cannot log after transport is closed");
      return;
    }

    // Ensure _time is set
    const logEntry: AxiomLogEntry = {
      ...entry,
      _time: entry._time || new Date().toISOString(),
    };

    this.buffer.push(logEntry);

    if (this.debug) {
      console.log(
        `[AxiomTransport] Buffered log (${this.buffer.length}/${this.batchSize})`,
        logEntry,
      );
    }

    // Auto-flush if batch size reached
    if (this.buffer.length >= this.batchSize) {
      void this.flush();
    }
  }

  /**
   * Manually flush all buffered logs to Axiom
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logsToSend),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Axiom API error (${response.status}): ${errorText}`);
      }

      const result = (await response.json()) as AxiomIngestResponse;

      if (this.debug) {
        console.log(
          `[AxiomTransport] Flushed ${result.ingested} logs to Axiom (${logsToSend.length} sent)`,
        );
      }

      if (result.failed > 0 && result.failures) {
        console.error(
          `[AxiomTransport] ${result.failed} logs failed to ingest:`,
          result.failures,
        );
      }
    } catch (error) {
      console.error("[AxiomTransport] Failed to flush logs to Axiom:", error);
      // Re-buffer failed logs for retry
      this.buffer.unshift(...logsToSend);
    }
  }

  /**
   * Close the transport, flushing all remaining logs
   */
  async close(): Promise<void> {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;

    // Stop auto-flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush
    await this.flush();

    if (this.debug) {
      console.log("[AxiomTransport] Transport closed");
    }
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Start the auto-flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.flushIntervalMs);

    // Don't prevent process exit
    this.flushTimer.unref();
  }
}

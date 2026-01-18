/**
 * Axiom log entry structure
 */
export interface AxiomLogEntry {
  _time: string; // ISO 8601 timestamp
  level: string; // 'debug' | 'info' | 'warn' | 'error'
  message: string;
  namespace?: string;
  [key: string]: unknown; // Additional metadata
}

/**
 * Axiom transport configuration
 */
export interface AxiomTransportConfig {
  /**
   * Axiom API token
   */
  apiToken: string;

  /**
   * Axiom dataset name
   */
  dataset: string;

  /**
   * Batch size before auto-flush (default: 100)
   */
  batchSize?: number;

  /**
   * Auto-flush interval in milliseconds (default: 10000)
   */
  flushIntervalMs?: number;

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Axiom API response
 */
export interface AxiomIngestResponse {
  ingested: number;
  failed: number;
  failures?: Array<{
    timestamp: string;
    error: string;
  }>;
  processedBytes: number;
  blocksCreated: number;
  walLength: number;
}

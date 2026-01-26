/**
 * Bytea Utilities
 *
 * Utilities for handling PostgreSQL bytea data types.
 * Shared between pims-sync service and IDEXX integration.
 */

/**
 * Parse PostgreSQL bytea data into a Buffer
 *
 * Handles multiple formats that Supabase might return:
 * - Uint8Array (native binary)
 * - Buffer (Node.js)
 * - String with \x prefix (hex encoding)
 * - Plain hex string
 *
 * @param data - Bytea data in various formats
 * @returns Buffer containing the binary data
 * @throws Error if data type is unexpected
 */
export function parseByteaData(data: unknown): Buffer {
  if (data instanceof Uint8Array) {
    return Buffer.from(data);
  }
  if (Buffer.isBuffer(data)) {
    return data;
  }
  if (typeof data === "string") {
    // Supabase returns bytea as hex string with \x prefix
    if (data.startsWith("\\x")) {
      return Buffer.from(data.slice(2), "hex");
    }
    // Try plain hex
    return Buffer.from(data, "hex");
  }
  throw new Error(`Unexpected bytea data type: ${typeof data}`);
}

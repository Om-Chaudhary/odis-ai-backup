import { logger } from "./logger";

const timeoutLogger = logger.child("[TimeoutManager]");

/**
 * Metadata for tracked timeouts
 */
interface TimeoutMetadata {
  id: number;
  callback: () => void;
  delay: number;
  createdAt: number;
  description?: string;
  stack?: string;
}

/**
 * TimeoutManager - Tracks and manages setTimeout calls to prevent orphaned timeouts
 *
 * Features:
 * - Tracks all active timeouts with metadata
 * - Prevents memory leaks from orphaned timeouts
 * - Provides cleanup methods to clear all timeouts
 * - Debug mode to track timeout lifecycle
 *
 * Usage:
 * ```typescript
 * const manager = new TimeoutManager();
 * const timeoutId = manager.setTimeout(() => console.log('Hello'), 1000, 'greeting');
 * manager.clearTimeout(timeoutId);
 * manager.clearAll(); // Clear all active timeouts
 * ```
 */
class TimeoutManager {
  private activeTimeouts = new Map<number, TimeoutMetadata>();
  private debug: boolean;

  constructor(debug = false) {
    this.debug = debug;
  }

  /**
   * Create a managed timeout
   */
  setTimeout(
    callback: () => void,
    delay: number,
    description?: string,
  ): number {
    const metadata: TimeoutMetadata = {
      id: -1, // Will be set after setTimeout
      callback,
      delay,
      createdAt: Date.now(),
      description,
      stack: this.debug ? new Error().stack : undefined,
    };

    // Wrap callback to auto-remove from tracking
    const wrappedCallback = () => {
      this.activeTimeouts.delete(metadata.id);
      if (this.debug) {
        timeoutLogger.debug("Timeout executed", {
          id: metadata.id,
          description,
          elapsed: Date.now() - metadata.createdAt,
        });
      }
      try {
        callback();
      } catch (error) {
        timeoutLogger.error("Error in timeout callback", {
          id: metadata.id,
          description,
          error,
        });
      }
    };

    // Use globalThis.setTimeout for compatibility (service worker vs window)
    const timeoutId = globalThis.setTimeout(
      wrappedCallback,
      delay,
    ) as unknown as number;
    metadata.id = timeoutId;
    this.activeTimeouts.set(timeoutId, metadata);

    if (this.debug) {
      timeoutLogger.debug("Timeout created", {
        id: timeoutId,
        description,
        delay,
        activeCount: this.activeTimeouts.size,
      });
    }

    return timeoutId;
  }

  /**
   * Clear a managed timeout
   */
  clearTimeout(timeoutId: number): void {
    const metadata = this.activeTimeouts.get(timeoutId);
    if (metadata) {
      globalThis.clearTimeout(timeoutId);
      this.activeTimeouts.delete(timeoutId);

      if (this.debug) {
        timeoutLogger.debug("Timeout cleared", {
          id: timeoutId,
          description: metadata.description,
          elapsed: Date.now() - metadata.createdAt,
          activeCount: this.activeTimeouts.size,
        });
      }
    }
  }

  /**
   * Clear all active timeouts
   */
  clearAll(): void {
    const count = this.activeTimeouts.size;
    this.activeTimeouts.forEach((metadata, timeoutId) => {
      globalThis.clearTimeout(timeoutId);
    });
    this.activeTimeouts.clear();

    if (this.debug || count > 0) {
      timeoutLogger.info("Cleared all timeouts", { count });
    }
  }

  /**
   * Get count of active timeouts
   */
  getActiveCount(): number {
    return this.activeTimeouts.size;
  }

  /**
   * Get metadata for all active timeouts
   */
  getActiveTimeouts(): TimeoutMetadata[] {
    return Array.from(this.activeTimeouts.values());
  }

  /**
   * Find orphaned timeouts (running longer than expected)
   */
  findOrphanedTimeouts(maxAge = 60000): TimeoutMetadata[] {
    const now = Date.now();
    return Array.from(this.activeTimeouts.values()).filter((metadata) => {
      const age = now - metadata.createdAt;
      return age > maxAge && age > metadata.delay * 2;
    });
  }

  /**
   * Log statistics about active timeouts
   */
  logStats(): void {
    const activeCount = this.activeTimeouts.size;
    const orphaned = this.findOrphanedTimeouts();

    timeoutLogger.info("Timeout statistics", {
      activeCount,
      orphanedCount: orphaned.length,
      timeouts: Array.from(this.activeTimeouts.values()).map((t) => ({
        id: t.id,
        description: t.description,
        delay: t.delay,
        age: Date.now() - t.createdAt,
      })),
    });

    if (orphaned.length > 0) {
      timeoutLogger.warn("Found orphaned timeouts", {
        count: orphaned.length,
        orphaned: orphaned.map((t) => ({
          id: t.id,
          description: t.description,
          age: Date.now() - t.createdAt,
          stack: t.stack,
        })),
      });
    }
  }
}

/**
 * Global singleton instance for background script
 */
let globalInstance: TimeoutManager | null = null;

/**
 * Get or create the global TimeoutManager instance
 */
const getGlobalTimeoutManager = (debug = false): TimeoutManager => {
  globalInstance ??= new TimeoutManager(debug);
  return globalInstance;
};

/**
 * Clear the global TimeoutManager instance
 */
const clearGlobalTimeoutManager = (): void => {
  if (globalInstance) {
    globalInstance.clearAll();
    globalInstance = null;
  }
};

// Exports at the end (ESLint rule: import-x/exports-last)
export { TimeoutManager, getGlobalTimeoutManager, clearGlobalTimeoutManager };

/**
 * VAPI Request Queue
 *
 * Manages concurrent VAPI API requests to prevent rate limiting.
 * Limits concurrent requests and adds delays between requests.
 */

type QueueTask<T> = () => Promise<T>;

interface QueuedRequest<T> {
  task: QueueTask<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

/**
 * Request queue for VAPI API calls
 * Limits concurrent requests to prevent rate limiting
 */
class VapiRequestQueue {
  private queue: QueuedRequest<unknown>[] = [];
  private active = 0;
  private readonly maxConcurrent: number;
  private readonly delayBetweenRequests: number;

  constructor(
    maxConcurrent = 2,
    delayBetweenRequests = 500, // 500ms between requests
  ) {
    this.maxConcurrent = maxConcurrent;
    this.delayBetweenRequests = delayBetweenRequests;
  }

  /**
   * Enqueue a VAPI request
   * Returns a promise that resolves when the request completes
   */
  async enqueue<T>(task: QueueTask<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task: task as QueueTask<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      // Process queue asynchronously (fire and forget)
      void this.process();
    });
  }

  /**
   * Process the queue
   * Executes tasks up to maxConcurrent limit
   */
  private async process(): Promise<void> {
    // Don't process if we're at max concurrent or queue is empty
    if (this.active >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    // Get next task from queue
    const request = this.queue.shift();
    if (!request) {
      return;
    }

    this.active++;

    try {
      // Execute the task
      const result = await request.task();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.active--;
      // Add delay between requests to avoid rate limits
      if (this.delayBetweenRequests > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.delayBetweenRequests),
        );
      }
      // Process next item in queue (fire and forget)
      void this.process();
    }
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      active: this.active,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

// Singleton instance for VAPI requests
export const vapiRequestQueue = new VapiRequestQueue(2, 500);

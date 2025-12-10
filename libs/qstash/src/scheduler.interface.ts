/**
 * IScheduler Interface
 *
 * Interface for job scheduling systems that support delayed execution.
 * Enables dependency injection and testing for scheduling operations.
 *
 * @example
 * ```typescript
 * class QStashScheduler implements IScheduler {
 *   async schedule(id: string, at: Date, payload: unknown): Promise<string> {
 *     // Implementation using QStash
 *   }
 *
 *   async cancel(messageId: string): Promise<void> {
 *     // Implementation using QStash
 *   }
 * }
 * ```
 */
export interface IScheduler {
  /**
   * Schedule a job for delayed execution
   *
   * @param id - Unique identifier for the job (e.g., call ID, email ID)
   * @param at - Target execution time (must be in the future)
   * @param payload - Job payload data to be sent to the webhook
   * @returns Message/job ID for tracking and cancellation
   * @throws Error if scheduled time is in the past or scheduling fails
   */
  schedule(id: string, at: Date, payload: unknown): Promise<string>;

  /**
   * Cancel a scheduled job
   *
   * @param messageId - Message/job ID returned from schedule()
   * @returns Promise that resolves when cancellation is complete
   * @throws Error if cancellation fails or message not found
   */
  cancel(messageId: string): Promise<void>;
}

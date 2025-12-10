/**
 * Common test assertions and helpers
 */
import { vi, type Mock } from "vitest";

/**
 * Assert that a mock was called with specific arguments
 */
export function expectCalledWith<T extends Mock>(
  mock: T,
  ...args: Parameters<T>
): void {
  expect(mock).toHaveBeenCalledWith(...args);
}

/**
 * Assert that a mock was called exactly n times
 */
export function expectCalledTimes<T extends Mock>(mock: T, times: number): void {
  expect(mock).toHaveBeenCalledTimes(times);
}

/**
 * Assert that a mock was never called
 */
export function expectNotCalled<T extends Mock>(mock: T): void {
  expect(mock).not.toHaveBeenCalled();
}

/**
 * Assert that an async function throws with specific error
 */
export async function expectAsyncError(
  fn: () => Promise<unknown>,
  errorMatch?: string | RegExp
): Promise<void> {
  await expect(fn()).rejects.toThrow(errorMatch);
}

/**
 * Assert that an object has specific properties
 */
export function expectToHaveProperties<T extends object>(
  obj: T,
  properties: (keyof T)[]
): void {
  properties.forEach((prop) => {
    expect(obj).toHaveProperty(prop as string);
  });
}

/**
 * Assert that an array has specific length
 */
export function expectArrayLength<T>(arr: T[], length: number): void {
  expect(arr).toHaveLength(length);
}

/**
 * Assert that a value matches a Zod schema
 */
export function expectMatchesSchema<T>(
  value: unknown,
  schema: { safeParse: (v: unknown) => { success: boolean; error?: { message: string } } }
): asserts value is T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(`Value does not match schema: ${result.error?.message}`);
  }
}

/**
 * Create a spy that tracks all calls and can be asserted against
 */
export function createCallTracker<T extends (...args: unknown[]) => unknown>(): {
  fn: T;
  calls: Parameters<T>[];
  results: ReturnType<T>[];
  reset: () => void;
} {
  const calls: Parameters<T>[] = [];
  const results: ReturnType<T>[] = [];

  const fn = vi.fn((...args: Parameters<T>) => {
    calls.push(args);
    const result = undefined as ReturnType<T>;
    results.push(result);
    return result;
  }) as unknown as T;

  return {
    fn,
    calls,
    results,
    reset: () => {
      calls.length = 0;
      results.length = 0;
      (fn as Mock).mockClear();
    },
  };
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

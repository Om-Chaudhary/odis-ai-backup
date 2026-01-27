/**
 * Vitest setup for Chrome extension tests
 */

import { vi } from "vitest";

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    sendMessage: vi.fn(),
    query: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
};

// @ts-expect-error - Mocking global chrome
globalThis.chrome = mockChrome;

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

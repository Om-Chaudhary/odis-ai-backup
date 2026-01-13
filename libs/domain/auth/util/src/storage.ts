import type { AuthStorageAdapter } from "./types";

/**
 * Default localStorage adapter for web and Electron renderer
 */
export const localStorageAdapter: AuthStorageAdapter = {
  getItem: async (key: string) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

/**
 * In-memory storage adapter for testing or SSR contexts
 */
export function createMemoryStorageAdapter(): AuthStorageAdapter {
  const store = new Map<string, string>();
  return {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: async (key: string) => {
      store.delete(key);
    },
  };
}

/**
 * Detect the best storage adapter for the current environment
 */
export function detectStorageAdapter(): AuthStorageAdapter {
  // Browser/Electron renderer context
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorageAdapter;
  }

  // Fallback to memory storage (SSR, testing)
  return createMemoryStorageAdapter();
}

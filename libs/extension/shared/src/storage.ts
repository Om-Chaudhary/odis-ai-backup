/**
 * Type-safe Chrome storage wrapper
 */

import type { ExtensionSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const STORAGE_KEYS = {
  settings: "odis_settings",
  authToken: "odis_auth_token",
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Get a value from chrome.storage.local
 */
async function get<T>(key: StorageKey): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as T | undefined;
}

/**
 * Set a value in chrome.storage.local
 */
async function set<T>(key: StorageKey, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

/**
 * Remove a value from chrome.storage.local
 */
async function remove(key: StorageKey): Promise<void> {
  await chrome.storage.local.remove(key);
}

/**
 * Get extension settings with defaults
 */
export async function getSettings(): Promise<ExtensionSettings> {
  const stored = await get<Partial<ExtensionSettings>>(STORAGE_KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...stored };
}

/**
 * Update extension settings (partial update)
 */
export async function updateSettings(
  updates: Partial<ExtensionSettings>
): Promise<ExtensionSettings> {
  const current = await getSettings();
  const updated = { ...current, ...updates };
  await set(STORAGE_KEYS.settings, updated);
  return updated;
}

/**
 * Store auth token securely
 */
export async function setAuthToken(token: string): Promise<void> {
  await set(STORAGE_KEYS.authToken, token);
}

/**
 * Get stored auth token
 */
export async function getAuthToken(): Promise<string | undefined> {
  return get<string>(STORAGE_KEYS.authToken);
}

/**
 * Clear auth token
 */
export async function clearAuthToken(): Promise<void> {
  await remove(STORAGE_KEYS.authToken);
}

/**
 * Clear all extension storage
 */
export async function clearAll(): Promise<void> {
  await chrome.storage.local.clear();
}

/**
 * Listen for storage changes
 */
export function onStorageChange(
  callback: (changes: {
    [key: string]: chrome.storage.StorageChange;
  }) => void
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === "local") {
      callback(changes);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

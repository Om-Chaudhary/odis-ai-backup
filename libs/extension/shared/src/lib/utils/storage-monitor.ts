/**
 * Chrome storage quota monitoring and management
 *
 * Monitors chrome.storage.local usage and warns when approaching limits.
 * Chrome provides 10MB of storage.local quota (up to 100MB with unlimitedStorage permission).
 */

import { logger } from "./logger";

const storageLogger = logger.child("[StorageMonitor]");

// Chrome storage.local quota limits
const DEFAULT_QUOTA_BYTES = 10 * 1024 * 1024; // 10MB (default)
const UNLIMITED_QUOTA_BYTES = 100 * 1024 * 1024; // 100MB (with unlimitedStorage permission)

// Warning thresholds
const WARNING_THRESHOLD = 0.8; // 80% usage
const CRITICAL_THRESHOLD = 0.95; // 95% usage

interface StorageQuotaInfo {
  bytesInUse: number;
  quotaBytes: number;
  usagePercent: number;
  isNearLimit: boolean;
  isCritical: boolean;
  hasUnlimitedStorage: boolean;
}

/**
 * Get current storage quota information
 *
 * @returns Storage quota details including usage and thresholds
 */
const getStorageQuotaInfo = async (): Promise<StorageQuotaInfo> => {
  // Check if we have unlimitedStorage permission
  const hasUnlimitedStorage = await chrome.permissions.contains({
    permissions: ["unlimitedStorage"],
  });

  const quotaBytes = hasUnlimitedStorage
    ? UNLIMITED_QUOTA_BYTES
    : DEFAULT_QUOTA_BYTES;

  // Get current usage
  const bytesInUse = await chrome.storage.local.getBytesInUse();

  const usagePercent = bytesInUse / quotaBytes;
  const isNearLimit = usagePercent >= WARNING_THRESHOLD;
  const isCritical = usagePercent >= CRITICAL_THRESHOLD;

  return {
    bytesInUse,
    quotaBytes,
    usagePercent,
    isNearLimit,
    isCritical,
    hasUnlimitedStorage,
  };
};

/**
 * Format bytes to human-readable string
 */
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Log storage quota status
 *
 * @param info Storage quota information
 */
const logStorageStatus = (info: StorageQuotaInfo) => {
  const percentStr = `${(info.usagePercent * 100).toFixed(1)}%`;
  const usageStr = `${formatBytes(info.bytesInUse)} / ${formatBytes(info.quotaBytes)}`;

  if (info.isCritical) {
    storageLogger.error("Storage quota critical!", {
      usage: usageStr,
      percent: percentStr,
      hasUnlimitedStorage: info.hasUnlimitedStorage,
    });
  } else if (info.isNearLimit) {
    storageLogger.warn("Storage quota approaching limit", {
      usage: usageStr,
      percent: percentStr,
      hasUnlimitedStorage: info.hasUnlimitedStorage,
    });
  } else {
    storageLogger.debug("Storage quota OK", {
      usage: usageStr,
      percent: percentStr,
      hasUnlimitedStorage: info.hasUnlimitedStorage,
    });
  }
};

/**
 * Check storage quota and log warnings if needed
 *
 * Call this periodically or after large storage operations to monitor usage.
 *
 * @returns Storage quota information
 *
 * @example
 * ```typescript
 * // Check quota before large write
 * const quota = await checkStorageQuota();
 * if (quota.isCritical) {
 *   throw new Error('Storage quota exceeded');
 * }
 * ```
 */
const checkStorageQuota = async (): Promise<StorageQuotaInfo> => {
  const info = await getStorageQuotaInfo();
  logStorageStatus(info);
  return info;
};

/**
 * Clean up old data to free storage space
 *
 * This is a placeholder for cleanup strategies. Implement based on your needs:
 * - Remove old cached data
 * - Compress large data
 * - Archive to remote storage
 * - Delete least recently used items
 *
 * @param targetBytes Target bytes to free (optional)
 * @returns Number of bytes freed
 */
const cleanupStorage = async (targetBytes?: number): Promise<number> => {
  storageLogger.info("Storage cleanup requested", { targetBytes });

  // TODO: Implement cleanup strategies based on your data
  // Example strategies:
  // 1. Remove old cache entries
  // 2. Compress large objects
  // 3. Archive to remote storage
  // 4. Delete LRU items

  let bytesFreed = 0;

  // Get current usage
  const beforeBytes = await chrome.storage.local.getBytesInUse();

  // Example: Clear all data (use with caution!)
  // await chrome.storage.local.clear();

  // Get usage after cleanup
  const afterBytes = await chrome.storage.local.getBytesInUse();
  bytesFreed = beforeBytes - afterBytes;

  storageLogger.info("Storage cleanup completed", {
    bytesFreed: formatBytes(bytesFreed),
    before: formatBytes(beforeBytes),
    after: formatBytes(afterBytes),
  });

  return bytesFreed;
};

/**
 * Monitor storage usage and automatically cleanup if needed
 *
 * Checks storage quota and triggers cleanup if usage is critical.
 * Call this after large storage operations or periodically.
 *
 * @returns Storage quota information after monitoring
 */
const monitorAndCleanup = async (): Promise<StorageQuotaInfo> => {
  const info = await checkStorageQuota();

  if (info.isCritical) {
    storageLogger.warn("Storage critical - attempting cleanup");
    await cleanupStorage();
    // Check again after cleanup
    return checkStorageQuota();
  }

  return info;
};

// Exports at end of file (ESLint rule)
export type { StorageQuotaInfo };
export {
  getStorageQuotaInfo,
  checkStorageQuota,
  cleanupStorage,
  monitorAndCleanup,
  formatBytes,
};

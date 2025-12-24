import { logger } from '../utils/logger';
import { createStorage, StorageEnum } from '@odis-ai/extension/storage';
import type { BaseStorageType } from '@odis-ai/extension/storage';

/**
 * Feature flag storage for the dual-mode discharge API.
 *
 * NOTE: This storage is currently UNUSED. The migration plan originally included
 * a feature flag approach, but this was cancelled in favor of always using
 * orchestration mode with automatic legacy fallback on errors.
 *
 * This file is kept for potential future use if feature flags are needed,
 * but should not be imported or used in the current implementation.
 *
 * @deprecated Not currently used - extension always uses orchestration mode
 */
const storage = createStorage<boolean>('orchestration-api-storage-key', false, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
  serialization: {
    serialize: (value: boolean) => JSON.stringify(value),
    deserialize: (text: string | undefined) => {
      if (!text || text === 'undefined' || text === 'null') {
        return false;
      }
      try {
        const parsed = JSON.parse(text);
        return typeof parsed === 'boolean' ? parsed : false;
      } catch (error) {
        logger.warn('[orchestration-api-storage] Failed to parse storage value, using default', { error });
        return false;
      }
    },
  },
});

export const orchestrationApiStorage: BaseStorageType<boolean> = storage;

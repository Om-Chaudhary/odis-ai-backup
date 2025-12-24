import { logger } from "../utils/logger";
import { createStorage, StorageEnum } from "@odis-ai/extension/storage";
import type { BaseStorageType } from "@odis-ai/extension/storage";

interface TestModeState {
  enabled: boolean;
  testEmail: string;
  testPhone: string;
  emailScheduleMinutes: number;
  phoneScheduleMinutes: number;
}

const defaultTestModeState: TestModeState = {
  enabled: false,
  testEmail: "",
  testPhone: "",
  emailScheduleMinutes: 1,
  phoneScheduleMinutes: 1,
};

const storage = createStorage<TestModeState>(
  "test-mode-storage-key",
  defaultTestModeState,
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
    serialization: {
      serialize: (value: TestModeState) => JSON.stringify(value),
      deserialize: (text: string | undefined) => {
        if (!text || text === "undefined" || text === "null") {
          return defaultTestModeState;
        }
        try {
          return JSON.parse(text) as TestModeState;
        } catch (error) {
          logger.warn(
            "[test-mode-storage] Failed to parse storage value, using default",
            { error },
          );
          return defaultTestModeState;
        }
      },
    },
  },
);

export const testModeStorage: BaseStorageType<TestModeState> = storage;
export type { TestModeState };

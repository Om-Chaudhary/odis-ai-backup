import * as SecureStore from "expo-secure-store";
import type { TokenCache } from "@clerk/clerk-expo";

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        console.warn("SecureStore getToken error");
        return null;
      }
    },
    saveToken: async (key: string, token: string) => {
      try {
        await SecureStore.setItemAsync(key, token);
      } catch {
        console.warn("SecureStore saveToken error");
      }
    },
    clearToken: async (key: string) => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        console.warn("SecureStore clearToken error");
      }
    },
  };
};

export const tokenCache = createTokenCache();

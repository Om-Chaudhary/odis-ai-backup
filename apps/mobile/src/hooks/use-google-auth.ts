import { useCallback, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import { useOAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";

// Warm up browser for faster OAuth flow
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  // Warm up browser on mount
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/sso-callback"),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        return { success: true };
      }

      return { success: false, error: "OAuth flow did not complete" };
    } catch (err) {
      console.error("OAuth error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }, [startOAuthFlow]);

  return { signInWithGoogle };
}

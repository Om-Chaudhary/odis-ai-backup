import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function SSOCallback() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // Short delay to ensure session is fully established
    const timeout = setTimeout(() => {
      if (isSignedIn) {
        router.replace("/(app)");
      } else {
        router.replace("/(auth)/sign-in");
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [isLoaded, isSignedIn, router]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#0d3d38" />
      <Text className="mt-4 text-muted-foreground">Completing sign in...</Text>
    </View>
  );
}

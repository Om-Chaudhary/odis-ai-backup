import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { useState } from "react";

interface GoogleButtonProps {
  mode: "sign-in" | "sign-up";
  onError?: (error: string) => void;
}

export function GoogleButton({ mode, onError }: GoogleButtonProps) {
  const { signInWithGoogle } = useGoogleAuth();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    const result = await signInWithGoogle();
    if (!result.success && result.error) {
      onError?.(result.error);
    }
    setLoading(false);
  };

  return (
    <TouchableOpacity
      className="flex-row items-center justify-center rounded-lg border border-border bg-card py-4"
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#0d3d38" />
      ) : (
        <>
          <View className="mr-2 h-5 w-5 items-center justify-center">
            <Text className="text-lg font-medium">G</Text>
          </View>
          <Text className="font-medium text-foreground">
            Continue with Google
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

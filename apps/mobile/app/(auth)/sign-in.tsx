import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import { useSignIn } from "@clerk/clerk-expo";
import { useGoogleAuth } from "@/hooks/use-google-auth";

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signInWithGoogle } = useGoogleAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        setError("Sign in incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Sign in failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");

    const result = await signInWithGoogle();

    if (!result.success && result.error) {
      setError(result.error);
    }

    setGoogleLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground">Welcome back</Text>
            <Text className="mt-2 text-muted-foreground">
              Sign in to your OdisAI account
            </Text>
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            className="mb-4 flex-row items-center justify-center rounded-lg border border-border bg-card py-4"
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#0d3d38" />
            ) : (
              <>
                <Text className="mr-2 text-lg">G</Text>
                <Text className="font-medium text-foreground">
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="my-6 flex-row items-center">
            <View className="flex-1 border-t border-border" />
            <Text className="mx-4 text-muted-foreground">or</Text>
            <View className="flex-1 border-t border-border" />
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <Text className="mb-2 font-medium text-foreground">Email</Text>
            <TextInput
              className="rounded-lg border border-input bg-card px-4 py-3 text-foreground"
              placeholder="Enter your email"
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="mb-2 font-medium text-foreground">Password</Text>
            <TextInput
              className="rounded-lg border border-input bg-card px-4 py-3 text-foreground"
              placeholder="Enter your password"
              placeholderTextColor="#6b7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {/* Error Message */}
          {error ? (
            <Text className="mb-4 text-center text-destructive">{error}</Text>
          ) : null}

          {/* Sign In Button */}
          <TouchableOpacity
            className="items-center rounded-lg bg-primary py-4"
            onPress={handleSignIn}
            disabled={loading || !email || !password}
            style={{ opacity: loading || !email || !password ? 0.5 : 1 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="font-semibold text-primary-foreground">Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View className="mt-6 flex-row justify-center">
            <Text className="text-muted-foreground">Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text className="font-semibold text-primary">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

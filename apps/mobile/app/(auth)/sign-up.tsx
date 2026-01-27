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
import { Link, useRouter } from "expo-router";
import { useSignUp } from "@clerk/clerk-expo";
import { useGoogleAuth } from "@/hooks/use-google-auth";

export default function SignUp() {
  const { signUp, isLoaded } = useSignUp();
  const { signInWithGoogle } = useGoogleAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Navigate to verification screen
      router.push("/(auth)/verify-email");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Sign up failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError("");

    const result = await signInWithGoogle();

    if (!result.success && result.error) {
      setError(result.error);
    }

    setGoogleLoading(false);
  };

  const isFormValid = firstName && lastName && email && password;

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
            <Text className="text-3xl font-bold text-foreground">Create account</Text>
            <Text className="mt-2 text-muted-foreground">
              Sign up to get started with OdisAI
            </Text>
          </View>

          {/* Google Sign Up */}
          <TouchableOpacity
            className="mb-4 flex-row items-center justify-center rounded-lg border border-border bg-card py-4"
            onPress={handleGoogleSignUp}
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

          {/* Name Inputs */}
          <View className="mb-4 flex-row gap-4">
            <View className="flex-1">
              <Text className="mb-2 font-medium text-foreground">First name</Text>
              <TextInput
                className="rounded-lg border border-input bg-card px-4 py-3 text-foreground"
                placeholder="First"
                placeholderTextColor="#6b7280"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoComplete="given-name"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-2 font-medium text-foreground">Last name</Text>
              <TextInput
                className="rounded-lg border border-input bg-card px-4 py-3 text-foreground"
                placeholder="Last"
                placeholderTextColor="#6b7280"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoComplete="family-name"
              />
            </View>
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
              placeholder="Create a password"
              placeholderTextColor="#6b7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
            <Text className="mt-1 text-sm text-muted-foreground">
              Must be at least 8 characters
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <Text className="mb-4 text-center text-destructive">{error}</Text>
          ) : null}

          {/* Sign Up Button */}
          <TouchableOpacity
            className="items-center rounded-lg bg-primary py-4"
            onPress={handleSignUp}
            disabled={loading || !isFormValid}
            style={{ opacity: loading || !isFormValid ? 0.5 : 1 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="font-semibold text-primary-foreground">
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View className="mt-6 flex-row justify-center">
            <Text className="text-muted-foreground">Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text className="font-semibold text-primary">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

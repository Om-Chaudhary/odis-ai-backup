import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

const CODE_LENGTH = 6;

export default function VerifyEmail() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow single digits
    const digit = text.replace(/[^0-9]/g, "").slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError("");

    // Auto-focus next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newCode.every((d) => d) && newCode.join("").length === CODE_LENGTH) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    if (!isLoaded) return;

    const codeToVerify = verificationCode || code.join("");
    if (codeToVerify.length !== CODE_LENGTH) return;

    setLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: codeToVerify,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        // Navigation handled by auth gate
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid code. Please try again.";
      setError(message);
      // Clear code on error
      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded) return;

    setResending(true);
    setError("");

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to resend code.";
      setError(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-background px-6 py-12">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-3xl font-bold text-foreground">Verify email</Text>
        <Text className="mt-2 text-muted-foreground">
          Enter the 6-digit code sent to your email
        </Text>
      </View>

      {/* Code Input */}
      <View className="mb-6 flex-row justify-center gap-2">
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            className="h-14 w-12 rounded-lg border border-input bg-card text-center text-xl font-semibold text-foreground"
            value={digit}
            onChangeText={(text) => handleCodeChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            editable={!loading}
          />
        ))}
      </View>

      {/* Error Message */}
      {error ? (
        <Text className="mb-4 text-center text-destructive">{error}</Text>
      ) : null}

      {/* Verify Button */}
      <TouchableOpacity
        className="items-center rounded-lg bg-primary py-4"
        onPress={() => handleVerify()}
        disabled={loading || code.join("").length !== CODE_LENGTH}
        style={{
          opacity: loading || code.join("").length !== CODE_LENGTH ? 0.5 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text className="font-semibold text-primary-foreground">Verify Email</Text>
        )}
      </TouchableOpacity>

      {/* Resend Link */}
      <View className="mt-6 flex-row justify-center">
        <Text className="text-muted-foreground">Didn't receive the code? </Text>
        <TouchableOpacity onPress={handleResend} disabled={resending}>
          {resending ? (
            <ActivityIndicator size="small" color="#0d3d38" />
          ) : (
            <Text className="font-semibold text-primary">Resend</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Back to Sign In */}
      <TouchableOpacity
        className="mt-8 items-center"
        onPress={() => router.back()}
      >
        <Text className="text-muted-foreground">Go back</Text>
      </TouchableOpacity>
    </View>
  );
}

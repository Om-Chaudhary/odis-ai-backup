"use client";

import { useState } from "react";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { createClient } from "@odis-ai/data-access/db/client";

interface AccountStepProps {
  onComplete: () => void;
}

/**
 * Map auth errors to user-friendly messages
 */
function getUserFriendlyErrorMessage(errorMessage: string): string {
  // Database errors (500 errors from triggers)
  if (
    errorMessage.includes("Database error") ||
    errorMessage.includes("database")
  ) {
    return "There was a problem creating your account. Please try again in a moment. If the issue persists, contact support@odisai.net.";
  }

  // Email already registered
  if (
    errorMessage.includes("already registered") ||
    errorMessage.includes("User already registered")
  ) {
    return "This email is already registered. Try signing in instead or reset your password.";
  }

  // Invalid email format
  if (
    errorMessage.includes("invalid email") ||
    errorMessage.includes("Invalid email")
  ) {
    return "Please enter a valid email address.";
  }

  // Weak password
  if (errorMessage.includes("Password") && errorMessage.includes("weak")) {
    return "Password is too weak. Please use at least 6 characters with a mix of letters and numbers.";
  }

  // Rate limiting
  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("too many")
  ) {
    return "Too many signup attempts. Please wait a few minutes and try again.";
  }

  // Default: return original message for unknown errors
  return errorMessage;
}

export default function AccountStep({ onComplete }: AccountStepProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log("[Signup] Creating Supabase client...");
      const supabase = createClient();

      console.log("[Signup] Calling signUp...", { email });
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log("[Signup] SignUp response:", { data, error: signUpError });

      if (signUpError) {
        console.error("[Signup] SignUp error:", {
          message: signUpError.message,
          status: signUpError.status,
          code: signUpError.code,
          name: signUpError.name,
        });

        // Track critical errors (500, database errors)
        if (
          signUpError.status === 500 ||
          signUpError.message.includes("Database error")
        ) {
          console.error("[Signup] CRITICAL ERROR - Database trigger failed:", {
            email,
            error: signUpError,
            timestamp: new Date().toISOString(),
          });

          // TODO: Add Sentry tracking here when configured
          // if (typeof Sentry !== 'undefined') {
          //   Sentry.captureException(signUpError, {
          //     tags: { flow: 'signup', critical: true },
          //     extra: { email },
          //   });
          // }
        }

        setError(getUserFriendlyErrorMessage(signUpError.message));
        return;
      }

      if (data.user) {
        console.log("[Signup] User created successfully, calling onComplete");
        // User profile is automatically created by database trigger
        onComplete();
      } else {
        console.warn("[Signup] No user in response data");
        setError("Signup succeeded but no user was returned");
      }
    } catch (err) {
      console.error("[Signup] Unexpected error:", err);

      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";

      setError(getUserFriendlyErrorMessage(errorMessage));
    } finally {
      console.log("[Signup] Setting loading to false");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
          Create your account
        </h1>
        <p className="text-sm text-slate-200">
          Enter your email and password to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-100">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="veterinarian@clinic.com"
            className="border-slate-200 bg-white/90 text-slate-900 backdrop-blur-sm transition-all duration-200 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500/20"
          />
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-slate-100"
          >
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a secure password (min. 6 characters)"
            minLength={6}
            className="border-slate-200 bg-white/90 text-slate-900 backdrop-blur-sm transition-all duration-200 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500/20"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-teal-500 hover:to-teal-600 hover:shadow-xl hover:shadow-teal-500/30 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Creating account..." : "Continue"}
        </Button>
      </form>
    </div>
  );
}

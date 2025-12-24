import { useAuth, logger } from "@odis-ai/extension/shared";
import { Button, Input, Label } from "@odis-ai/shared/ui/extension";
import { useState } from "react";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { signIn, signUp, signOut, user } = useAuth();

  const clearError = () => setError(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp && password !== confirmPassword) {
      return;
    }

    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setSuccess(true);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        await signIn(email, password);
        setEmail("");
        setPassword("");

        // Refresh the active page to update unauthenticated components
        try {
          chrome.runtime.sendMessage({ type: "REFRESH_PAGE" }, () => {
            if (chrome.runtime.lastError) {
              logger.warn("[Auth] Failed to refresh page", {
                error: chrome.runtime.lastError.message,
              });
            }
          });
        } catch (refreshError) {
          logger.warn("[Auth] Error refreshing page", { error: refreshError });
        }
      }
    } catch (err) {
      logger.error("[Auth] Error during authentication", { error: err });
      const errorMessage =
        err instanceof Error ? err.message : "Authentication failed";
      setError(
        errorMessage.includes("Failed to fetch")
          ? "Cannot connect to Supabase. Please ensure email authentication is enabled in your Supabase dashboard (Authentication → Providers → Email)."
          : errorMessage,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed");
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password === confirmPassword || confirmPassword === "";

  // If user is logged in, show user info
  if (user) {
    return (
      <div className="border-border bg-card rounded-lg border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm font-medium">Signed in as</p>
            <p className="text-muted-foreground text-xs">{user.email}</p>
          </div>
          <Button
            onClick={handleSignOut}
            disabled={loading}
            variant="destructive"
            size="sm"
          >
            {loading ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </div>
    );
  }

  // Otherwise, show auth form
  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="space-y-1 text-center">
        <h1 className="text-primary text-xl font-bold">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="text-muted-foreground text-xs">
          {isSignUp
            ? "Sign up to get started"
            : "Sign in to access your account"}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError();
            }}
            required
            disabled={loading}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError();
            }}
            required
            disabled={loading}
            className="h-9"
          />
        </div>
        {isSignUp && (
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError();
              }}
              required
              disabled={loading}
              className={`h-9 ${!passwordsMatch ? "border-destructive" : ""}`}
            />
            {!passwordsMatch && (
              <p className="text-destructive text-xs">Passwords do not match</p>
            )}
          </div>
        )}
        {error && <div className="text-destructive text-xs">{error}</div>}
        {success && (
          <div className="text-success text-xs">
            Account created! Please sign in.
          </div>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={loading || (isSignUp && !passwordsMatch)}
        >
          {loading
            ? isSignUp
              ? "Creating..."
              : "Signing in..."
            : isSignUp
              ? "Sign Up"
              : "Sign In"}
        </Button>
      </form>
      <div className="text-center">
        <span className="text-muted-foreground text-xs">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
        </span>
        <Button
          variant="link"
          className="ml-1 h-auto p-0 text-xs"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setSuccess(false);
          }}
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </Button>
      </div>
    </div>
  );
};

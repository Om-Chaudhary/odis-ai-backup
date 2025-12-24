import { DateNavigator } from "./DateNavigator";
import { useAuth, now, isAuthError, logger } from "@odis-ai/extension/shared";
import { Button } from "@odis-ai/shared/ui/extension";
import { useCases } from "../../hooks/useCases";
import { LogOut, AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

export const CasesView = () => {
  const [currentDate, setCurrentDate] = useState(now());
  const { signOut, user } = useAuth();

  const { cases, loading, error, refetch } = useCases(currentDate);

  const handleSignOut = async (e?: React.MouseEvent) => {
    // Prevent any default behavior
    e?.preventDefault();
    e?.stopPropagation();

    try {
      await signOut();
    } catch (error) {
      logger.error("[CasesView] Error signing out", { error });
      // Even if sign out fails, try to reload or show error
      alert("Failed to sign out. Please try again or refresh the extension.");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Date Navigator */}
      <DateNavigator
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onRefresh={refetch}
        loading={loading}
        caseCount={cases.length}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border-destructive/50 rounded-lg border p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-destructive mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-destructive text-sm font-medium">
                {isAuthError(error)
                  ? "Authentication Error"
                  : "Failed to load cases"}
              </p>
              <p className="text-destructive/80 text-xs">{error}</p>
              {!isAuthError(error) && (
                <Button
                  onClick={() => void refetch()}
                  variant="outline"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
                  />
                  <span>Retry</span>
                </Button>
              )}
              {isAuthError(error) && (
                <p className="text-destructive/70 mt-1 text-xs">
                  Please sign out and sign in again, or use the sign out button
                  below.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Button - Always clickable, never disabled */}
      <div className="border-border relative z-10 border-t pt-2">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="pointer-events-auto flex w-full items-center justify-center gap-2"
          size="sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
          {user?.email && (
            <span className="text-muted-foreground ml-auto text-xs">
              ({user.email})
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

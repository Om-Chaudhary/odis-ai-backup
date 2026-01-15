"use client";

import { OnbordaProvider, Onborda, useOnborda } from "onborda";
import { createContext, useContext, type ReactNode } from "react";
import {
  firstTimeTour,
  CustomOnboardingCard,
} from "~/components/dashboard/inbound/onboarding";

/**
 * Safe onborda context that wraps the library's useOnborda hook
 * This allows graceful degradation when the provider is not available
 */
type SafeOnbordaContextType = ReturnType<typeof useOnborda> | null;

const SafeOnbordaContext = createContext<SafeOnbordaContextType>(null);

/**
 * Hook to safely access onborda context
 * Returns null if not within provider (instead of throwing)
 */
export function useSafeOnborda() {
  return useContext(SafeOnbordaContext);
}

/**
 * Inner component that bridges the onborda context to our safe context
 */
function SafeOnbordaBridge({ children }: { children: ReactNode }) {
  const onbordaContext = useOnborda();
  return (
    <SafeOnbordaContext.Provider value={onbordaContext}>
      {children}
    </SafeOnbordaContext.Provider>
  );
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  return (
    <OnbordaProvider>
      <Onborda
        steps={[firstTimeTour]}
        cardComponent={CustomOnboardingCard}
        shadowRgb="20, 184, 166" // Teal-500
        shadowOpacity="0.2"
        cardTransition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        <SafeOnbordaBridge>{children}</SafeOnbordaBridge>
      </Onborda>
    </OnbordaProvider>
  );
}

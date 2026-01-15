"use client";

import { OnbordaProvider, Onborda } from "onborda";
import type { ReactNode } from "react";
import {
  firstTimeTour,
  CustomOnboardingCard,
} from "~/components/dashboard/inbound/onboarding";

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
        {children}
      </Onborda>
    </OnbordaProvider>
  );
}

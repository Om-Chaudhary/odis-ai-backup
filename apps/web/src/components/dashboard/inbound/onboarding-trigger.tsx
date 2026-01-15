"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@odis-ai/shared/ui";
import { useInboundOnboarding } from "./hooks/use-inbound-onboarding";

/**
 * Manual trigger button for restarting the onboarding tour
 *
 * Usage: Add to page header or toolbar where users can easily access help
 */
export function OnboardingTrigger() {
  const { restartTour } = useInboundOnboarding();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={restartTour}
      className="gap-2"
      aria-label="Restart onboarding tour"
    >
      <HelpCircle className="h-4 w-4" />
      Tour
    </Button>
  );
}

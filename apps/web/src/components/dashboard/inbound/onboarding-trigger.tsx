"use client";

import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { Button } from "@odis-ai/shared/ui";
import { useSafeOnborda } from "~/components/providers/onboarding-provider";

/**
 * Manual trigger button for restarting the onboarding tour
 *
 * Only renders when:
 * 1. On the inbound dashboard page (path contains /inbound)
 * 2. Within an OnboardingProvider context
 *
 * Usage: Add to page header or toolbar where users can easily access help
 */
export function OnboardingTrigger() {
  const pathname = usePathname();
  const onbordaContext = useSafeOnborda();

  // Only render if on inbound page and provider is available
  const isOnInboundPage = pathname?.includes("/inbound");
  const hasProvider = onbordaContext !== null;

  if (!isOnInboundPage || !hasProvider) {
    return null;
  }

  const handleRestartTour = () => {
    onbordaContext.closeOnborda();
    setTimeout(() => {
      onbordaContext.startOnborda("inbound-first-time");
    }, 100);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRestartTour}
      className="gap-2"
      aria-label="Restart onboarding tour"
    >
      <HelpCircle className="h-4 w-4" />
      Tour
    </Button>
  );
}

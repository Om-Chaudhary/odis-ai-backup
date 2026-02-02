"use client";

import { useMemo } from "react";
import { isDemoClinic, HAPPY_TAILS_STORY } from "../mock-data";

interface UseDemoModeOptions {
  clinicSlug?: string;
  clinicEmail?: string;
}

interface UseDemoModeResult {
  isDemo: boolean;
  demoData: typeof HAPPY_TAILS_STORY | null;
}

/**
 * Hook to detect if the current clinic is in demo mode
 * and provide the demo data if applicable.
 *
 * Demo mode is auto-detected when:
 * - Clinic slug matches 'happy-tails' OR
 * - Clinic email matches 'happytails@odisai.net'
 */
export function useDemoMode({
  clinicSlug,
  clinicEmail,
}: UseDemoModeOptions): UseDemoModeResult {
  return useMemo(() => {
    const isDemo = isDemoClinic(clinicSlug, clinicEmail);

    return {
      isDemo,
      demoData: isDemo ? HAPPY_TAILS_STORY : null,
    };
  }, [clinicSlug, clinicEmail]);
}

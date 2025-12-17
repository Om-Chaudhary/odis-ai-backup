"use client";

import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";
import { useScrollTracking } from "~/hooks/useScrollTracking";

/**
 * Landing Page Analytics Component
 *
 * Handles all analytics tracking for the landing page:
 * - Pageview tracking with UTM params and referrer
 * - Scroll depth tracking (25%, 50%, 75%, 100%)
 * - Device detection for segmentation
 *
 * Usage: Add as a child of the landing page, renders nothing
 */
export function LandingAnalytics() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const hasTrackedPageview = useRef(false);

  // Initialize scroll depth tracking
  useScrollTracking();

  // Track pageview on mount
  useEffect(() => {
    // Skip if already tracked or posthog not available
    if (hasTrackedPageview.current || !posthog?.capture) return;
    hasTrackedPageview.current = true;

    // Parse UTM params from URL
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {
      utm_source: urlParams.get("utm_source"),
      utm_medium: urlParams.get("utm_medium"),
      utm_campaign: urlParams.get("utm_campaign"),
      utm_term: urlParams.get("utm_term"),
      utm_content: urlParams.get("utm_content"),
    };

    // Filter out null values
    const filteredUtmParams = Object.fromEntries(
      Object.entries(utmParams).filter(([, v]) => v !== null),
    );

    posthog.capture("landing_page_viewed", {
      referrer: document.referrer || "direct",
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
      viewport_height: deviceInfo.viewport_height,
      page_url: window.location.href,
      page_path: window.location.pathname,
      ...filteredUtmParams,
    });

    // Register UTM params as super properties for this session
    if (Object.keys(filteredUtmParams).length > 0) {
      posthog.register?.(filteredUtmParams);
    }
  }, [posthog, deviceInfo]);

  // This component renders nothing - it's purely for analytics
  return null;
}

/**
 * Track a Book Demo click and identify the user's intent
 *
 * Call this from any CTA that leads to booking a demo
 */
export function trackBookDemoClick(
  posthog: ReturnType<typeof usePostHog> | null | undefined,
  location: string,
) {
  if (!posthog?.capture) return;

  posthog.capture("book_demo_clicked", {
    location,
    timestamp: new Date().toISOString(),
  });

  // Set a property indicating user has shown demo interest
  posthog.people?.set({
    demo_interest_shown: true,
    demo_interest_location: location,
    demo_interest_date: new Date().toISOString(),
  });
}

/**
 * Track a demo phone call click
 */
export function trackDemoPhoneClick(
  posthog: ReturnType<typeof usePostHog> | null | undefined,
  location: string,
  phoneNumber: string,
) {
  if (!posthog?.capture) return;

  posthog.capture("demo_phone_clicked", {
    location,
    phone_number: phoneNumber,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track schedule demo click and identify user intent
 */
export function trackScheduleDemoClick(
  posthog: ReturnType<typeof usePostHog> | null | undefined,
  location: string,
) {
  if (!posthog?.capture) return;

  posthog.capture("schedule_demo_clicked", {
    location,
    timestamp: new Date().toISOString(),
  });

  // Set a property indicating user has shown scheduling interest
  posthog.people?.set({
    schedule_interest_shown: true,
    schedule_interest_location: location,
    schedule_interest_date: new Date().toISOString(),
  });
}

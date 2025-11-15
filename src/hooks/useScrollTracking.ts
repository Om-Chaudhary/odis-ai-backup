"use client";

import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { useDeviceDetection } from "./useDeviceDetection";

export function useScrollTracking() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const scrollMilestones = useRef(new Set<number>());
  const pageLoadTime = useRef(Date.now());

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce scroll events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const documentHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercentage = Math.round((scrollTop / documentHeight) * 100);

        // Track scroll depth milestones
        const milestones = [25, 50, 75, 100];
        milestones.forEach((milestone) => {
          if (
            scrollPercentage >= milestone &&
            !scrollMilestones.current.has(milestone)
          ) {
            scrollMilestones.current.add(milestone);

            posthog.capture("scroll_depth_reached", {
              depth_percentage: milestone,
              total_scroll_time: Date.now() - pageLoadTime.current,
              device_type: deviceInfo.device_type,
              viewport_width: deviceInfo.viewport_width,
            });
          }
        });
      }, 300); // 300ms debounce
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [posthog, deviceInfo]);
}

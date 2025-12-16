"use client";

import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { useDeviceDetection } from "./useDeviceDetection";

interface SectionVisibilityOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useSectionVisibility<T extends HTMLElement = HTMLDivElement>(
  sectionName: string,
  options: SectionVisibilityOptions = {},
) {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const sectionRef = useRef<T>(null);
  const hasBeenViewed = useRef(false);
  const viewStartTime = useRef<number | null>(null);
  const pageLoadTime = useRef(Date.now());

  const { threshold = 0.5, rootMargin = "0px" } = options;

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenViewed.current) {
            hasBeenViewed.current = true;
            viewStartTime.current = Date.now();

            posthog.capture("section_viewed", {
              section_name: sectionName,
              time_to_view: Date.now() - pageLoadTime.current,
              device_type: deviceInfo.device_type,
              viewport_width: deviceInfo.viewport_width,
            });
          } else if (
            !entry.isIntersecting &&
            hasBeenViewed.current &&
            viewStartTime.current
          ) {
            // Section is no longer visible, track time spent
            const timeSpent = Date.now() - viewStartTime.current;

            posthog.capture("section_engagement", {
              section_name: sectionName,
              time_spent: timeSpent,
              device_type: deviceInfo.device_type,
            });

            viewStartTime.current = null;
          }
        });
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [sectionName, threshold, rootMargin, posthog, deviceInfo]);

  return sectionRef;
}

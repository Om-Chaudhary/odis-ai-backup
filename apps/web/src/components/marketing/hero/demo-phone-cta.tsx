"use client";

import { PhoneCall, Sparkles } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";

const DEMO_PHONE_NUMBER = "(925) 678-5640";
const DEMO_PHONE_TEL = "tel:+19256785640";

export function DemoPhoneCTA() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();

  const handlePhoneClick = () => {
    posthog?.capture?.("demo_phone_clicked", {
      location: "hero_cta",
      phone_number: DEMO_PHONE_NUMBER,
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
    });
  };

  return (
    <div className="flex flex-col items-start gap-4">
      {/* Main CTA - Prominent phone button */}
      <a
        href={DEMO_PHONE_TEL}
        onClick={handlePhoneClick}
        className="group relative inline-flex items-center gap-4 overflow-hidden rounded-2xl border-2 border-teal-400/30 bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 px-6 py-4 text-white shadow-[0_8px_32px_rgba(49,171,163,0.35)] transition-all duration-500 hover:scale-[1.03] hover:border-teal-300/50 hover:shadow-[0_12px_48px_rgba(49,171,163,0.5)] active:scale-[0.98] sm:px-8 sm:py-5"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Shimmer sweep effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

        {/* Animated glow ring */}
        <div className="absolute -inset-1 -z-10 animate-pulse rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 opacity-50 blur-xl" />

        {/* Phone icon with pulse rings */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulse ring */}
          <div className="absolute h-14 w-14 animate-ping rounded-full bg-white/20 sm:h-16 sm:w-16" />
          {/* Inner pulse ring */}
          <div className="absolute h-12 w-12 animate-pulse rounded-full bg-white/15 sm:h-14 sm:w-14" />
          {/* Icon container */}
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-white/60 sm:h-14 sm:w-14">
            <PhoneCall className="h-5 w-5 transition-all duration-300 group-hover:rotate-12 sm:h-6 sm:w-6" />
          </div>
        </div>

        {/* Text content */}
        <div className="relative flex flex-col">
          <span className="text-xs font-medium tracking-wider text-teal-100/90 uppercase sm:text-sm">
            Try the Live Demo
          </span>
          <span className="text-2xl font-bold tracking-wide drop-shadow-lg sm:text-3xl">
            {DEMO_PHONE_NUMBER}
          </span>
        </div>

        {/* Sparkle accent */}
        <Sparkles className="absolute top-3 right-3 h-4 w-4 animate-pulse text-white/60 sm:h-5 sm:w-5" />
      </a>

      {/* Supporting info badges */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/60 bg-teal-50/80 px-3 py-1.5 text-xs font-medium text-teal-700 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Available 24/7
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/60 bg-teal-50/80 px-3 py-1.5 text-xs font-medium text-teal-700 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
          No signup required
        </span>
      </div>
    </div>
  );
}

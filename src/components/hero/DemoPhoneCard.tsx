"use client";

import { Sparkles, PhoneCall } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";

const DEMO_PHONE_NUMBER = "(925) 678-5640";
const DEMO_PHONE_TEL = "tel:+19256785640";

export function DemoPhoneCard() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();

  const handlePhoneClick = () => {
    posthog.capture("demo_phone_clicked", {
      location: "hero",
      phone_number: DEMO_PHONE_NUMBER,
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
    });
  };

  return (
    <div className="group relative">
      {/* Multi-layered animated glow background - reduced on mobile for performance */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 opacity-20 blur-lg transition-all duration-700 group-hover:opacity-40 sm:-inset-1.5 sm:rounded-3xl sm:opacity-25 sm:blur-xl sm:group-hover:opacity-50 sm:group-hover:blur-2xl" />
      <div className="absolute -inset-0.5 hidden rounded-2xl bg-gradient-to-br from-teal-300/40 to-emerald-400/30 opacity-0 blur-md transition-all duration-500 group-hover:opacity-60 sm:-inset-1 sm:block sm:rounded-3xl sm:blur-lg" />

      {/* Glassmorphic card - responsive padding */}
      <div className="relative overflow-hidden rounded-xl border border-white/40 bg-white/70 p-4 shadow-[0_4px_24px_rgba(49,171,163,0.12)] backdrop-blur-xl transition-all duration-300 group-hover:border-white/60 group-hover:bg-white/80 group-hover:shadow-[0_8px_32px_rgba(49,171,163,0.2)] sm:rounded-2xl sm:p-6 sm:shadow-[0_8px_32px_rgba(49,171,163,0.15)] sm:group-hover:shadow-[0_16px_48px_rgba(49,171,163,0.25)]">
        {/* Decorative gradient orbs - smaller on mobile */}
        <div className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br from-teal-400/25 via-emerald-300/15 to-transparent blur-xl sm:-top-8 sm:-right-8 sm:h-32 sm:w-32 sm:from-teal-400/30 sm:via-emerald-300/20 sm:blur-2xl" />
        <div className="pointer-events-none absolute -bottom-3 -left-3 h-16 w-16 rounded-full bg-gradient-to-tr from-emerald-400/15 to-transparent blur-lg sm:-bottom-4 sm:-left-4 sm:h-24 sm:w-24 sm:from-emerald-400/20 sm:blur-xl" />

        {/* Shimmer effect line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />

        {/* Badge */}
        <div className="relative mb-3 inline-flex items-center gap-1 rounded-full border border-teal-200/50 bg-gradient-to-r from-teal-50/80 to-emerald-50/80 px-2.5 py-1 text-[10px] font-semibold text-teal-700 shadow-sm backdrop-blur-sm sm:mb-4 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
          <Sparkles className="h-2.5 w-2.5 animate-pulse sm:h-3 sm:w-3" />
          Live Demo
        </div>

        {/* Content */}
        <div className="relative space-y-2 sm:space-y-3">
          <h3 className="text-base font-bold text-slate-800 sm:text-lg">
            Hear Odis AI in Action
          </h3>
          <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
            Call to learn about Odis and experience a live after-hours demo —
            see exactly how we handle calls with pet owners.
          </p>

          {/* Phone number display - Glassmorphic button - responsive sizing */}
          <a
            href={DEMO_PHONE_TEL}
            onClick={handlePhoneClick}
            className="group/phone relative mt-3 flex items-center gap-3 overflow-hidden rounded-lg border border-teal-500/20 bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 px-3.5 py-3 text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-teal-400/40 hover:shadow-[0_4px_16px_rgba(49,171,163,0.35)] active:scale-[0.98] sm:mt-4 sm:gap-4 sm:rounded-xl sm:px-5 sm:py-4 sm:shadow-lg sm:hover:shadow-[0_8px_24px_rgba(49,171,163,0.4)]"
          >
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/phone:translate-x-full" />

            {/* Phone icon with animated rings - smaller on mobile */}
            <div className="relative flex flex-shrink-0 items-center justify-center">
              <div className="absolute h-9 w-9 animate-ping rounded-full bg-white/20 opacity-75 sm:h-12 sm:w-12" />
              <div className="absolute h-8 w-8 animate-pulse rounded-full bg-white/15 sm:h-10 sm:w-10" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm sm:h-11 sm:w-11">
                <PhoneCall className="h-4 w-4 transition-all duration-300 group-hover/phone:scale-110 group-hover/phone:rotate-12 sm:h-5 sm:w-5" />
              </div>
            </div>

            {/* Number - responsive text sizes */}
            <div className="relative flex min-w-0 flex-col">
              <span className="text-[10px] font-medium tracking-wide text-teal-100 sm:text-xs">
                Try the live demo
              </span>
              <span className="text-lg font-bold tracking-wide drop-shadow-sm sm:text-xl">
                {DEMO_PHONE_NUMBER}
              </span>
            </div>
          </a>

          {/* Features row - responsive spacing and text */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-slate-500 sm:mt-3 sm:gap-x-4 sm:text-xs">
            <span className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-emerald-400 sm:h-1.5 sm:w-1.5" />
              24/7 Available
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-emerald-400 sm:h-1.5 sm:w-1.5" />
              No signup needed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

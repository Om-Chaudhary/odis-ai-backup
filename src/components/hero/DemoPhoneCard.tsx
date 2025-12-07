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
      {/* Multi-layered animated glow background */}
      <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 opacity-25 blur-xl transition-all duration-700 group-hover:opacity-50 group-hover:blur-2xl" />
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-teal-300/40 to-emerald-400/30 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-60" />

      {/* Glassmorphic card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(49,171,163,0.15)] backdrop-blur-xl transition-all duration-300 group-hover:border-white/60 group-hover:bg-white/80 group-hover:shadow-[0_16px_48px_rgba(49,171,163,0.25)]">
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-teal-400/30 via-emerald-300/20 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-gradient-to-tr from-emerald-400/20 to-transparent blur-xl" />

        {/* Shimmer effect line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />

        {/* Badge */}
        <div className="relative mb-4 inline-flex items-center gap-1.5 rounded-full border border-teal-200/50 bg-gradient-to-r from-teal-50/80 to-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm backdrop-blur-sm">
          <Sparkles className="h-3 w-3 animate-pulse" />
          Live Demo
        </div>

        {/* Content */}
        <div className="relative space-y-3">
          <h3 className="text-lg font-bold text-slate-800">
            Hear Odis AI in Action
          </h3>
          <p className="text-sm leading-relaxed text-slate-600">
            Call to learn about Odis and experience a live after-hours demo —
            see exactly how we handle calls with pet owners.
          </p>

          {/* Phone number display - Glassmorphic button */}
          <a
            href={DEMO_PHONE_TEL}
            onClick={handlePhoneClick}
            className="group/phone relative mt-4 flex items-center gap-4 overflow-hidden rounded-xl border border-teal-500/20 bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 px-5 py-4 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-teal-400/40 hover:shadow-[0_8px_24px_rgba(49,171,163,0.4)] active:scale-[0.98]"
          >
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/phone:translate-x-full" />

            {/* Phone icon with animated rings */}
            <div className="relative flex items-center justify-center">
              <div className="absolute h-12 w-12 animate-ping rounded-full bg-white/20 opacity-75" />
              <div className="absolute h-10 w-10 animate-pulse rounded-full bg-white/15" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm">
                <PhoneCall className="h-5 w-5 transition-all duration-300 group-hover/phone:scale-110 group-hover/phone:rotate-12" />
              </div>
            </div>

            {/* Number */}
            <div className="relative flex flex-col">
              <span className="text-xs font-medium tracking-wide text-teal-100">
                Try the live demo
              </span>
              <span className="text-xl font-bold tracking-wide drop-shadow-sm">
                {DEMO_PHONE_NUMBER}
              </span>
            </div>
          </a>

          {/* Features row */}
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              24/7 Available
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              No signup needed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

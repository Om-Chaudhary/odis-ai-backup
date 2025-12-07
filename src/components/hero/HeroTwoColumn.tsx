"use client";

import { useState } from "react";
import { usePostHog } from "posthog-js/react";
import { EnhancedButton } from "~/components/ui/enhanced-button";
import { ArrowRight } from "lucide-react";
import { LightRays } from "~/components/ui/light-rays";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";
import { ProcessAnimation } from "./ProcessAnimation";
import { DemoPhoneCard } from "./DemoPhoneCard";
import WaitlistModal from "../WaitlistModal";

export default function HeroTwoColumn() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleButtonClick = () => {
    posthog.capture("waitlist_cta_clicked", {
      location: "hero",
      button_text: "Join Waitlist - it's free",
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
    });
    setIsModalOpen(true);
  };

  return (
    <>
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-gradient-to-b from-white via-emerald-50 to-white pt-20 lg:pt-0">
        {/* Background Elements */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle, #31aba3 0.5px, transparent 0.5px)",
              backgroundSize: "24px 24px",
            }}
          />
          <LightRays className="opacity-40" />
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Column: Content */}
            <div className="relative z-10 flex flex-col items-start space-y-8 text-left">
              {/* Headline */}
              <h1 className="font-display text-4xl leading-tight font-bold text-slate-900 sm:text-5xl lg:text-6xl">
                Turn Every Appointment into a{" "}
                <span className="relative inline-block text-teal-600">
                  Lasting Connection
                  {/* Underline Decoration */}
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 10C50 2 150 2 298 8"
                      stroke="#31aba3"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeOpacity="0.3"
                    />
                  </svg>
                </span>
              </h1>

              {/* Subheadline */}
              <p className="max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                Odis AI listens to your consults and automatically delivers
                personalized discharge summaries and follow-up calls. Build
                trust and retain clients without the paperwork.
              </p>

              {/* CTA */}
              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                <EnhancedButton
                  onClick={handleButtonClick}
                  variant="gradient"
                  size="lg"
                  icon={
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  }
                  iconPosition="right"
                  className="group w-full sm:w-auto"
                >
                  Join Waitlist - it&apos;s free
                </EnhancedButton>
              </div>

              {/* Social Proof / Trust (Optional small text) */}
              <p className="text-sm text-slate-500">
                Trusted by forward-thinking veterinary practices.
              </p>

              {/* Demo Phone Card */}
              <div className="w-full pt-4 sm:max-w-sm">
                <DemoPhoneCard />
              </div>
            </div>

            {/* Right Column: Animation */}
            <div className="relative flex items-center justify-center lg:justify-end">
              {/* Animation Container */}
              <div className="relative flex min-h-[550px] w-full max-w-lg items-center justify-center">
                <ProcessAnimation />
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        triggerLocation="hero"
      />
    </>
  );
}

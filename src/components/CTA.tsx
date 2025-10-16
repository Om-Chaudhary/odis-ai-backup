"use client";

import { useState, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { Spinner } from "~/components/ui/spinner";
import { FloatingElements } from "~/components/ui/floating-elements";
import { TextReveal } from "~/components/ui/text-reveal";
import { ParticleBackground } from "~/components/ui/particle-background";
import WaitlistModal from "./WaitlistModal";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";

export default function CTA() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleJoinWaitlist = async () => {
    posthog.capture("waitlist_cta_clicked", {
      location: "cta_section",
      button_text: "Explore Our Solutions",
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
    });

    setIsLoading(true);
    // Simulate loading state
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsModalOpen(true);
  };

  const handleButtonHover = () => {
    // Debounce hover events
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      posthog.capture("cta_button_hover", {
        location: "cta_section",
        button_text: "Explore Our Solutions",
        device_type: deviceInfo.device_type,
      });
    }, 200);
  };

  const handleButtonLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  return (
    <>
      {/* Container with background that continues from the section above */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/20 via-emerald-50/30 to-emerald-50/20 py-12 sm:py-16 md:py-20 lg:py-24">
        {/* Subtle animated background elements */}
        <ParticleBackground
          className="opacity-5"
          particleCount={8}
          color="#31aba3"
          size={2}
        />
        <FloatingElements
          className="opacity-10"
          count={3}
          size="sm"
          color="#31aba3"
        />

        {/* Subtle original animated background elements */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute top-10 left-10 h-16 w-16 animate-pulse rounded-full bg-[#31aba3]/20"></div>
          <div className="absolute top-32 right-20 h-12 w-12 animate-pulse rounded-full bg-[#31aba3]/20 delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 h-8 w-8 animate-pulse rounded-full bg-[#31aba3]/20 delay-500"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
          {/* CTA Card with gradient background */}
          <div
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#31aba3]/80 via-[#2a9d96]/80 to-[#1f7a73]/80 px-12 py-20 shadow-2xl backdrop-blur-md sm:px-16 sm:py-24 md:px-20 md:py-28"
            style={{
              boxShadow:
                "0 0 40px rgba(49, 171, 163, 0.3), 0 0 80px rgba(49, 171, 163, 0.1)",
            }}
          >
            {/* Card background elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 h-12 w-12 animate-pulse rounded-full bg-white"></div>
              <div className="absolute top-8 right-8 h-8 w-8 animate-pulse rounded-full bg-white delay-1000"></div>
              <div className="absolute bottom-6 left-1/3 h-6 w-6 animate-pulse rounded-full bg-white delay-500"></div>
            </div>

            {/* Card content */}
            <div className="relative z-10 text-center text-white">
              <TextReveal direction="up" delay={0.2}>
                <h2 className="font-display mb-4 text-3xl leading-tight font-bold text-white sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
                  Solutions for Modern Veterinary Practices
                </h2>
              </TextReveal>

              <TextReveal direction="up" delay={0.4}>
                <p className="mb-10 font-serif text-lg leading-relaxed text-white/90 sm:text-xl">
                  Transform your workflow with cutting-edge AI technology
                </p>
              </TextReveal>

              <div className="mb-10">
                <button
                  onClick={handleJoinWaitlist}
                  onMouseEnter={handleButtonHover}
                  onMouseLeave={handleButtonLeave}
                  disabled={isLoading}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-white px-8 py-4 text-lg font-semibold text-[#31aba3] transition-all duration-300 hover:scale-105 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2 h-5 w-5" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">
                        Explore Our Solutions
                      </span>
                      <svg
                        className="ml-2 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        triggerLocation="cta_section"
      />
    </>
  );
}

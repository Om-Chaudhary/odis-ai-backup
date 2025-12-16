"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import Navigation from "~/components/layout/navigation";
import Hero from "~/components/marketing/hero/hero-hands-free";
import TrustLogos from "~/components/marketing/trust-logos";
import Testimonials from "~/components/marketing/testimonials";
import FAQ from "~/components/marketing/faq";
import CTA from "~/components/marketing/cta";
import Footer from "~/components/layout/footer";
import { useScrollTracking } from "~/hooks/useScrollTracking";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";
import { Handshake, Layers, Zap } from "lucide-react";

export default function HandsFreeLanding() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();

  // Initialize scroll tracking
  useScrollTracking();

  // Initialize section visibility tracking for hero
  const heroRef = useSectionVisibility("hero_hands_free");

  // Track page view on mount
  useEffect(() => {
    posthog.capture("hands_free_landing_page_viewed", {
      timestamp: Date.now(),
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
      viewport_height: deviceInfo.viewport_height,
    });
  }, [posthog, deviceInfo]);

  return (
    <main className="relative">
      <div className="dotted-background" />
      <Navigation />
      <div ref={heroRef}>
        <Hero />
      </div>
      <section
        className="mt-8 sm:mt-12 md:mt-16"
        aria-label="Trusted by veterinary practices"
      >
        <div className="mb-3 text-center">
          <div className="mx-auto inline-flex items-center justify-center rounded-full bg-[#31aba3]/10 px-4 py-2">
            <Layers className="mr-2 h-5 w-5 text-[#31aba3]" />
            <span className="text-sm font-semibold text-[#31aba3]">
              Seamless Integrations
            </span>
          </div>
        </div>
        <TrustLogos />
      </section>
      <section
        className="mt-8 sm:mt-12 md:mt-16"
        aria-label="Customer testimonials"
      >
        <div className="mb-3 text-center">
          <div className="mx-auto inline-flex items-center justify-center rounded-full bg-[#31aba3]/10 px-4 py-2">
            <Handshake className="mr-2 h-5 w-5 text-[#31aba3]" />
            <span className="text-sm font-semibold text-[#31aba3]">
              Zero-Friction Results
            </span>
          </div>
        </div>
        <Testimonials />
      </section>
      <section className="mt-8 sm:mt-12 md:mt-16" aria-label="FAQ">
        <FAQ />
      </section>
      <section className="mt-8 sm:mt-12 md:mt-16" aria-label="Call to action">
        <div className="mb-3 text-center">
          <div className="mx-auto inline-flex items-center justify-center rounded-full bg-[#31aba3]/10 px-4 py-2">
            <Zap className="mr-2 h-5 w-5 text-[#31aba3]" />
            <span className="text-sm font-semibold text-[#31aba3]">
              Start Your Zero-Friction Journey
            </span>
          </div>
        </div>
        <CTA />
      </section>
      <footer className="mt-8 sm:mt-12 md:mt-16">
        <Footer />
      </footer>
    </main>
  );
}

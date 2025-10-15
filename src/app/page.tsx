"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import Navigation from "~/components/Navigation";
import Hero from "~/components/HeroFloating";
import TrustLogos from "~/components/TrustLogos";
import Testimonials from "~/components/Testimonials";
import FAQ from "~/components/FAQ";
import CTA from "~/components/CTA";
import Footer from "~/components/Footer";
import { useScrollTracking } from "~/hooks/useScrollTracking";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";

export default function Home() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();

  // Initialize scroll tracking
  useScrollTracking();

  // Initialize section visibility tracking for hero
  const heroRef = useSectionVisibility("hero");

  // Track page view on mount
  useEffect(() => {
    posthog.capture("landing_page_viewed", {
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
      <div className="mt-8 sm:mt-12 md:mt-16">
        <TrustLogos />
      </div>
      <div className="mt-8 sm:mt-12 md:mt-16">
        <Testimonials />
      </div>
      <div className="mt-8 sm:mt-12 md:mt-16">
        <FAQ />
      </div>
      <div className="mt-8 sm:mt-12 md:mt-16">
        <CTA />
      </div>
      <div className="mt-8 sm:mt-12 md:mt-16">
        <Footer />
      </div>
    </main>
  );
}

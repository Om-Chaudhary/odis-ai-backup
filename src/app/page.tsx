"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import dynamic from "next/dynamic";
import Navigation from "~/components/Navigation";
import { useScrollTracking } from "~/hooks/useScrollTracking";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";

// Dynamic imports for heavy components
const Hero = dynamic(() => import("~/components/HeroFloating"), {
  loading: () => (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-100/40 to-emerald-50/30" />
  ),
});

const TrustLogos = dynamic(() => import("~/components/TrustLogos"), {
  loading: () => <div className="h-32" />,
});

const Testimonials = dynamic(() => import("~/components/Testimonials"), {
  loading: () => <div className="h-96" />,
});

const CTA = dynamic(() => import("~/components/CTA"), {
  loading: () => <div className="h-64" />,
});

const Footer = dynamic(() => import("~/components/Footer"), {
  loading: () => <div className="h-32" />,
});

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
    <>
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
          <TrustLogos />
        </section>
        <section
          className="mt-8 sm:mt-12 md:mt-16"
          aria-label="Customer testimonials"
        >
          <Testimonials />
        </section>
        <section className="mt-8 sm:mt-12 md:mt-16" aria-label="Call to action">
          <CTA />
        </section>
        <footer className="mt-8 sm:mt-12 md:mt-16">
          <Footer />
        </footer>
      </main>
    </>
  );
}

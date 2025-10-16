"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import Navigation from "~/components/Navigation";
import Hero from "~/components/HeroFloating";
import TrustLogos from "~/components/TrustLogos";
import Testimonials from "~/components/Testimonials";
import { Pricing } from "~/components/blocks/pricing";
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
      <section
        id="pricing"
        className="mt-8 sm:mt-12 md:mt-16"
        aria-label="Pricing plans"
      >
        <Pricing
          plans={[
            {
              name: "Core",
              price: "150",
              yearlyPrice: "120", // 20% discount
              period: "month",
              features: [
                "All Features",
                "Unlimited Generations",
                "Full time support",
                "Advanced AI SOAP note generation",
                "Practice management integration",
                "Priority customer support",
                "Custom workflow automation",
              ],
              description:
                "Perfect for general and specialty veterinary practices",
              buttonText: "General / Specialty",
              href: "/signup?plan=core",
              isPopular: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              yearlyPrice: "Custom",
              period: "contact",
              features: [
                "All Core Features",
                "Custom integrations",
                "Dedicated account manager",
                "White-label solutions",
                "Advanced analytics & reporting",
                "Multi-location support",
                "Custom training & onboarding",
                "SLA guarantees",
              ],
              description:
                "Tailored solutions for large veterinary organizations",
              buttonText: "Contact Us",
              href: "mailto:sales@odis.ai?subject=Enterprise Pricing Inquiry",
              isPopular: false,
            },
          ]}
          title="Pricing Plan"
          description="Choose the plan that works for your veterinary practice\nAll plans include access to our AI-powered SOAP note generation and practice management tools."
        />
      </section>
      <section className="mt-8 sm:mt-12 md:mt-16" aria-label="FAQ">
        <FAQ />
      </section>
      <section className="mt-8 sm:mt-12 md:mt-16" aria-label="Call to action">
        <CTA />
      </section>
      <footer className="mt-8 sm:mt-12 md:mt-16">
        <Footer />
      </footer>
    </main>
  );
}

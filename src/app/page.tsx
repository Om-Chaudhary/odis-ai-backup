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
import { CircleDollarSign, Handshake, Layers, Megaphone } from "lucide-react";

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
        <div className="mb-3 text-center">
          <div className="mx-auto inline-flex items-center justify-center rounded-full bg-[#31aba3]/10 px-4 py-2">
            <Layers className="mr-2 h-5 w-5 text-[#31aba3]" />
            <span className="text-sm font-semibold text-[#31aba3]">
              Integrations
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
              Testimonials
            </span>
          </div>
        </div>
        <Testimonials />
      </section>
      <section className="mt-8 sm:mt-12 md:mt-16" aria-label="FAQ">
        <FAQ />
      </section>
      <section
        id="pricing"
        className="mt-8 sm:mt-12 md:mt-16"
        aria-label="Pricing plans"
      >
        <div className="mb-3 text-center">
          <div className="mx-auto inline-flex items-center justify-center rounded-full bg-[#31aba3]/10 px-4 py-2">
            <CircleDollarSign className="mr-2 h-5 w-5 text-[#31aba3]" />
            <span className="text-sm font-semibold text-[#31aba3]">
              Pricing
            </span>
          </div>
        </div>
        <Pricing
          plans={[
            {
              name: "Starter",
              price: "120",
              yearlyPrice: "100", // ~20% discount
              period: "month",
              features: [
                "All Features",
                "30 Notes / Month (~1 per day)",
                "Pay-per use above",
              ],
              description: "Ideal for low volume vets or pilots",
              buttonText: "Low Volume Vets",
              href: "/signup?plan=starter",
              isPopular: false,
            },
            {
              name: "Core",
              price: "375",
              yearlyPrice: "300", // 20% discount
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
          description="Choose the plan that works for your veterinary practice. All plans include access to our AI-powered SOAP note generation and practice management tools."
        />
      </section>
      <section className="mt-8 sm:mt-12 md:mt-16" aria-label="Call to action">
        <div className="mb-3 text-center">
          <div className="mx-auto inline-flex items-center justify-center rounded-full bg-[#31aba3]/10 px-4 py-2">
            <Megaphone className="mr-2 h-5 w-5 text-[#31aba3]" />
            <span className="text-sm font-semibold text-[#31aba3]">
              Get Started
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

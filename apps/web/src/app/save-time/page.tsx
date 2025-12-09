"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import Navigation from "~/components/layout/navigation";
import Hero from "~/components/marketing/hero/hero-floating";
import TrustLogos from "~/components/marketing/trust-logos";
import Testimonials from "~/components/marketing/testimonials";
import FAQ from "~/components/marketing/faq";
import CTA from "~/components/marketing/cta";
import Footer from "~/components/layout/footer";
import { useScrollTracking } from "~/hooks/useScrollTracking";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";
import { Clock, Users, Zap } from "lucide-react";

export default function SaveTimeLanding() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();

  // Initialize scroll tracking
  useScrollTracking();

  // Initialize section visibility tracking for hero
  const heroRef = useSectionVisibility("hero");

  // Track page view on mount
  useEffect(() => {
    posthog.capture("page_viewed", {
      page: "save_time_landing",
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

      {/* Time Savings Stats Section */}
      <section
        className="mt-8 bg-gradient-to-b from-emerald-50/30 via-emerald-50/20 to-emerald-50/30 py-16 sm:mt-12 sm:py-20 md:mt-16"
        aria-label="Time savings statistics"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto inline-flex items-center justify-center rounded-full bg-[#31aba3]/15 px-6 py-3 shadow-sm">
            <Clock className="mr-2 h-6 w-6 text-[#31aba3]" />
            <span className="text-lg font-bold text-[#31aba3]">
              ⏰ Stop Losing Time to Paperwork
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-800 sm:text-4xl md:text-5xl">
            Real Results from Busy Veterinarians
          </h2>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#31aba3]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative z-10 text-center">
                <div className="mb-4 text-5xl font-bold text-[#31aba3] sm:text-6xl">
                  2+
                </div>
                <div className="mb-2 text-xl font-bold text-gray-800">
                  Hours Reclaimed Daily
                </div>
                <div className="text-sm text-gray-600">
                  From endless documentation
                </div>
                <div className="mt-4 text-xs font-semibold text-[#31aba3]">
                  ⚡ IMMEDIATE IMPACT
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#31aba3]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative z-10 text-center">
                <div className="mb-4 text-5xl font-bold text-[#31aba3] sm:text-6xl">
                  3-4
                </div>
                <div className="mb-2 text-xl font-bold text-gray-800">
                  More Patients Daily
                </div>
                <div className="text-sm text-gray-600">
                  Without feeling overwhelmed
                </div>
                <div className="mt-4 text-xs font-semibold text-[#31aba3]">
                  📈 REVENUE BOOST
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#31aba3]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative z-10 text-center">
                <div className="mb-4 text-5xl font-bold text-[#31aba3] sm:text-6xl">
                  95%
                </div>
                <div className="mb-2 text-xl font-bold text-gray-800">
                  Accuracy Rate
                </div>
                <div className="text-sm text-gray-600">
                  On first-pass SOAP notes
                </div>
                <div className="mt-4 text-xs font-semibold text-[#31aba3]">
                  🎯 RELIABLE RESULTS
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg font-medium text-gray-700">
              <span className="font-bold text-[#31aba3]">
                500+ veterinarians
              </span>{" "}
              have already reclaimed their time.
              <br className="hidden sm:block" />
              <span className="text-gray-600">You could be next.</span>
            </p>
          </div>
        </div>
      </section>

      <section
        className="mt-8 sm:mt-12 md:mt-16"
        aria-label="Trusted by veterinary practices"
      >
        <div className="mb-3 text-center">
          <div className="mx-auto inline-flex items-center justify-center rounded-full bg-[#31aba3]/15 px-6 py-3 shadow-sm">
            <Zap className="mr-2 h-6 w-6 text-[#31aba3]" />
            <span className="text-lg font-bold text-[#31aba3]">
              ⚡ Works with Your Existing System
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
          <div className="mx-auto inline-flex items-center justify-center rounded-full bg-[#31aba3]/15 px-6 py-3 shadow-sm">
            <Users className="mr-2 h-6 w-6 text-[#31aba3]" />
            <span className="text-lg font-bold text-[#31aba3]">
              🏆 Veterinarians Who Reclaimed Their Time
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
          <div className="mx-auto inline-flex items-center justify-center rounded-full bg-[#31aba3]/15 px-6 py-3 shadow-sm">
            <Clock className="mr-2 h-6 w-6 text-[#31aba3]" />
            <span className="text-lg font-bold text-[#31aba3]">
              🚀 Start Saving Time Today
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

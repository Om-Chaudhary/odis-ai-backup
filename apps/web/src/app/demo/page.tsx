"use client";

import { useEffect, useRef } from "react";
import { useScroll, useTransform } from "framer-motion";
import { GoogleGeminiEffect } from "@odis-ai/ui/google-gemini-effect";
import { usePostHog } from "posthog-js/react";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";
import { EnhancedButton } from "@odis-ai/ui/enhanced-button";
import { ArrowRight, Clock, FileText, Zap, CheckCircle2 } from "lucide-react";
import Navigation from "~/components/layout/navigation";
import Footer from "~/components/layout/footer";
import WaitlistModal from "~/components/marketing/waitlist-modal";
import { useState } from "react";

export default function DemoLandingPage() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pathLengthFirst = useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2]);
  const pathLengthSecond = useTransform(scrollYProgress, [0, 0.8], [0.15, 1.2]);
  const pathLengthThird = useTransform(scrollYProgress, [0, 0.8], [0.1, 1.2]);
  const pathLengthFourth = useTransform(scrollYProgress, [0, 0.8], [0.05, 1.2]);
  const pathLengthFifth = useTransform(scrollYProgress, [0, 0.8], [0, 1.2]);

  useEffect(() => {
    posthog.capture("demo_landing_page_viewed", {
      timestamp: Date.now(),
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
      viewport_height: deviceInfo.viewport_height,
    });
  }, [posthog, deviceInfo]);

  const handleCTAClick = () => {
    posthog.capture("demo_waitlist_cta_clicked", {
      location: "hero",
      device_type: deviceInfo.device_type,
    });
    setIsModalOpen(true);
  };

  return (
    <>
      <Navigation />
      <div
        className="relative h-[400vh] w-full overflow-clip bg-gradient-to-b from-emerald-50 via-white to-emerald-50/30"
        ref={ref}
      >
        {/* Hero section with scroll effect */}
        <div className="sticky top-0 h-screen w-full">
          <GoogleGeminiEffect
            pathLengths={[
              pathLengthFirst,
              pathLengthSecond,
              pathLengthThird,
              pathLengthFourth,
              pathLengthFifth,
            ]}
            title="Stop drowning in paperwork"
            description="AI-powered SOAP notes that write themselves while you focus on patient care"
            className="pb-24"
          />
        </div>
      </div>

      {/* Pain Points Section */}
      <section className="relative bg-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
              You&apos;re Losing{" "}
              <span className="bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                Hours Every Day.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-slate-600">
              The same problems plague veterinary practices everywhere.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-red-100 p-3">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
                2-3 Hours Daily on Documentation
              </h3>
              <p className="font-serif text-slate-600">
                Every veterinarian spends hours each day writing SOAP notes,
                discharge summaries, and client communications instead of seeing
                patients.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-orange-100 p-3">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
                Inconsistent Documentation
              </h3>
              <p className="font-serif text-slate-600">
                When you&apos;re rushed, notes get abbreviated or delayed. This
                creates compliance risks and makes it harder to provide
                continuity of care.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-yellow-100 p-3">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
                Burnout & Staff Turnover
              </h3>
              <p className="font-serif text-slate-600">
                Administrative burden is the #1 cause of veterinary burnout.
                Your team is exhausted from endless paperwork instead of doing
                what they love.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="relative bg-gradient-to-b from-emerald-50 to-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
              What if documentation{" "}
              <span className="bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                wrote itself?
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-slate-600">
              OdisAI listens to your consultations and generates complete,
              accurate SOAP notes automatically.
            </p>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    Hands-Free Documentation
                  </h3>
                  <p className="font-serif text-slate-600">
                    Focus on your patient while ODIS captures every detail. No
                    more typing during appointments or staying late to catch up
                    on notes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    Complete & Consistent
                  </h3>
                  <p className="font-serif text-slate-600">
                    Every SOAP note follows your practice&apos;s standards with
                    thorough subjective, objective, assessment, and plan
                    sections. Never miss important details.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    Seamless Integration
                  </h3>
                  <p className="font-serif text-slate-600">
                    Works with your existing PIMS. One click to transfer notes
                    to Avimark, Cornerstone, ezyVet, and more.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    Get Back 2+ Hours Daily
                  </h3>
                  <p className="font-serif text-slate-600">
                    See more patients, leave on time, or finally have lunch
                    breaks. The choice is yours when you&apos;re not buried in
                    paperwork.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-md rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-8 shadow-xl">
                <div className="mb-4">
                  <div className="mb-2 text-sm font-medium text-teal-600">
                    SOAP Note - Generated in seconds
                  </div>
                  <div className="space-y-4 font-mono text-sm text-slate-700">
                    <div>
                      <span className="font-semibold text-teal-700">S:</span>{" "}
                      Owner reports 3yo MN Labrador &quot;Max&quot; has been
                      limping on left hind leg for 2 days. No known trauma.
                      Eating and drinking normally.
                    </div>
                    <div>
                      <span className="font-semibold text-teal-700">O:</span> T:
                      101.2°F, HR: 92, RR: 24. BCS: 5/9. Lameness grade 2/5 left
                      hind. Pain on palpation of left stifle. Cranial drawer
                      test positive.
                    </div>
                    <div>
                      <span className="font-semibold text-teal-700">A:</span>{" "}
                      Cranial cruciate ligament rupture, left stifle
                    </div>
                    <div>
                      <span className="font-semibold text-teal-700">P:</span>{" "}
                      Discussed surgical options (TPLO vs lateral suture).
                      Prescribed carprofen 75mg PO BID. Recheck in 3 days.
                      Referral to orthopedic surgeon recommended.
                    </div>
                  </div>
                </div>
                <div className="mt-6 rounded-lg bg-white/80 p-3 text-center">
                  <div className="text-xs text-slate-500">
                    ⏱️ Generated automatically during consultation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-br from-teal-600 to-emerald-600 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Join Veterinarians Saving Hours Daily
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-teal-50">
            Book a demo call to see the difference in your first appointment.
          </p>

          <div className="mt-8 flex justify-center">
            <EnhancedButton
              onClick={handleCTAClick}
              variant="outline"
              size="lg"
              icon={
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              }
              iconPosition="right"
              className="group border-2 border-white bg-white text-teal-700 transition-all duration-300 hover:scale-105 hover:bg-teal-50 hover:shadow-xl"
            >
              Get Back 2+ Hours Daily - Book a Demo
            </EnhancedButton>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-teal-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-serif text-sm">14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-serif text-sm">No credit card needed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-serif text-sm">Setup in 5 minutes</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        triggerLocation="hero"
      />
    </>
  );
}

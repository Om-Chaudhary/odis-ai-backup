"use client";

import { useEffect, useRef } from "react";
import { useScroll, useTransform } from "framer-motion";
import { GoogleGeminiEffect } from "~/components/ui/google-gemini-effect";
import { usePostHog } from "posthog-js/react";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";
import { EnhancedButton } from "~/components/ui/enhanced-button";
import { ArrowRight, Clock, FileText, Zap, CheckCircle2 } from "lucide-react";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import WaitlistModal from "~/components/WaitlistModal";
import FAQ from "~/components/FAQ";
import Testimonials from "~/components/Testimonials";
import { useState } from "react";

export default function Demo1LandingPage() {
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
    posthog.capture("demo1_landing_page_viewed", {
      timestamp: Date.now(),
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
      viewport_height: deviceInfo.viewport_height,
    });
  }, [posthog, deviceInfo]);

  const handleCTAClick = () => {
    posthog.capture("demo1_waitlist_cta_clicked", {
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
            description="Focus on what matters most—your patients. Let AI handle the documentation."
            className="pb-24"
          />
        </div>
      </div>

      {/* Pain Points Section */}
      <section className="relative bg-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
              Documentation is{" "}
              <span className="bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                stealing your time
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-slate-600">
              You became a veterinarian to care for animals, not to spend hours on paperwork.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-red-100 p-3">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
                Hours Lost Daily
              </h3>
              <p className="font-serif text-slate-600">
                Veterinarians spend 2-3 hours every day writing SOAP notes and documentation—time that could be spent caring for patients or living your life.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-orange-100 p-3">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
                Quality Suffers Under Pressure
              </h3>
              <p className="font-serif text-slate-600">
                When time is tight, documentation gets rushed or postponed. This affects patient care continuity and creates compliance gaps.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-yellow-100 p-3">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
                Work Follows You Home
              </h3>
              <p className="font-serif text-slate-600">
                Staying late to finish notes or taking work home has become the norm. The paperwork burden never ends, affecting your work-life balance.
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
              Reclaim your time with{" "}
              <span className="bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                AI documentation
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-slate-600">
              OdisAI listens to your appointments and creates complete, accurate SOAP notes automatically—so you can focus entirely on your patients.
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
                    Eyes on Patients, Not Screens
                  </h3>
                  <p className="font-serif text-slate-600">
                    Maintain eye contact and connection with pets and their owners. OdisAI captures everything in the background while you focus on what you do best—providing exceptional care.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    Thorough, Consistent Documentation
                  </h3>
                  <p className="font-serif text-slate-600">
                    Every appointment gets complete SOAP notes with all essential details captured. No more rushed or incomplete records when you&apos;re running behind.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    Leave On Time
                  </h3>
                  <p className="font-serif text-slate-600">
                    Notes are ready immediately after each appointment. No more staying late to catch up on documentation or sacrificing your evening to paperwork.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    Works With Your Workflow
                  </h3>
                  <p className="font-serif text-slate-600">
                    Seamlessly integrates with Avimark, Cornerstone, ezyVet, and other PIMS. One click transfers notes into your existing system.
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

      {/* Testimonials Section */}
      <Testimonials />

      {/* FAQ Section */}
      <FAQ />

      {/* CTA Section */}
      <section className="relative bg-gradient-to-br from-teal-600 to-emerald-600 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Get Back Your Time
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-teal-50">
            Join veterinarians who are spending less time on paperwork and more time doing what they love—caring for animals.
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
              Focus on Care, Not Paperwork - Book Demo
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

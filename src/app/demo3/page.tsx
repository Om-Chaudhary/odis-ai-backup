"use client";

import { useEffect, useRef } from "react";
import { useScroll, useTransform } from "framer-motion";
import { GoogleGeminiEffectDemo3 } from "~/components/ui/google-gemini-effect-demo3";
import { usePostHog } from "posthog-js/react";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";
import { EnhancedButton } from "~/components/ui/enhanced-button";
import { ArrowRight, Clock, FileText, Zap, CheckCircle2 } from "lucide-react";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import WaitlistModal from "~/components/WaitlistModal";
import { Logos3 } from "~/components/ui/logos3";
import FAQ from "~/components/FAQ";
import Testimonials from "~/components/Testimonials";
import { useState } from "react";

export default function Demo3LandingPage() {
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
    posthog.capture("demo3_landing_page_viewed", {
      timestamp: Date.now(),
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
      viewport_height: deviceInfo.viewport_height,
    });
  }, [posthog, deviceInfo]);

  const handleCTAClick = () => {
    posthog.capture("demo3_waitlist_cta_clicked", {
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
          <GoogleGeminiEffectDemo3
            pathLengths={[
              pathLengthFirst,
              pathLengthSecond,
              pathLengthThird,
              pathLengthFourth,
              pathLengthFifth,
            ]}
            title="See more patients. Grow your practice"
            description="Scale your veterinary practice with AI documentation that eliminates bottlenecks and reduces liability."
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
                limiting your growth
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-slate-600">
              Your practice could see more patients and generate more revenue—if
              documentation wasn&apos;t the bottleneck.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-red-100 p-3">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
                Limited Appointment Capacity
              </h3>
              <p className="font-serif text-slate-600">
                You could see 20-30% more patients daily, but documentation time
                forces you to turn away appointments. Every declined booking is
                lost revenue.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-orange-100 p-3">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
                Compliance & Liability Risks
              </h3>
              <p className="font-serif text-slate-600">
                Rushed or incomplete documentation creates legal exposure.
                Missing details in medical records can be costly in disputes or
                malpractice cases.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-yellow-100 p-3">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
                Can&apos;t Scale Without More Vets
              </h3>
              <p className="font-serif text-slate-600">
                Hiring additional veterinarians is expensive and difficult. You
                need ways to increase productivity of your existing team to grow
                profitably.
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
              Unlock your practice&apos;s{" "}
              <span className="bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                growth potential
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-slate-600">
              OdisAI eliminates documentation bottlenecks so you can increase
              capacity, improve care quality, and scale your revenue.
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
                    Increase Appointment Capacity
                  </h3>
                  <p className="font-serif text-slate-600">
                    Save 2-3 hours daily per veterinarian. That&apos;s 4-6
                    additional appointments each day—translating to significant
                    revenue growth without hiring more staff.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    Reduce Legal Liability
                  </h3>
                  <p className="font-serif text-slate-600">
                    Complete, detailed documentation on every patient protects
                    your practice. Comprehensive SOAP notes with all clinical
                    findings strengthen your position if questions arise.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    Better Patient Outcomes
                  </h3>
                  <p className="font-serif text-slate-600">
                    More time with each patient means thorough exams, better
                    communication with owners, and improved care. Happy clients
                    become loyal, referring clients.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    Scale Efficiently
                  </h3>
                  <p className="font-serif text-slate-600">
                    Each veterinarian becomes more productive without burnout.
                    Grow your practice revenue without the massive cost of
                    hiring, onboarding, and managing new doctors.
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

      {/* Integrations Section */}
      <Logos3 heading="Seamless Integration With Your Existing PIMS" />

      {/* Testimonials Section */}
      <Testimonials />

      {/* FAQ Section */}
      <FAQ />

      {/* CTA Section */}
      <section className="relative bg-gradient-to-br from-teal-600 to-emerald-600 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Grow Your Revenue, Not Your Overhead
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-teal-50">
            See how veterinary practices are using OdisAI to increase capacity
            by 20-30% without adding staff.
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
              Scale Your Practice - Book Demo
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

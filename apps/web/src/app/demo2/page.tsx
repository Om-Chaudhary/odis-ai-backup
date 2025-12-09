"use client";

import { useEffect, useRef } from "react";
import { useScroll, useTransform } from "framer-motion";
import { GoogleGeminiEffectDemo2 } from "@odis/ui/google-gemini-effect-demo2";
import { usePostHog } from "posthog-js/react";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";
import { EnhancedButton } from "@odis/ui/enhanced-button";
import { ArrowRight, Clock, FileText, Zap, CheckCircle2 } from "lucide-react";
import Navigation from "~/components/layout/navigation";
import Footer from "~/components/layout/footer";
import WaitlistModal from "~/components/marketing/waitlist-modal";
import { Logos3 } from "@odis/ui/logos3";
import FAQ from "~/components/marketing/faq";
import Testimonials from "~/components/marketing/testimonials";
import { useState } from "react";

export default function Demo2LandingPage() {
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
    posthog.capture("demo2_landing_page_viewed", {
      timestamp: Date.now(),
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
      viewport_height: deviceInfo.viewport_height,
    });
  }, [posthog, deviceInfo]);

  const handleCTAClick = () => {
    posthog.capture("demo2_waitlist_cta_clicked", {
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
          <GoogleGeminiEffectDemo2
            pathLengths={[
              pathLengthFirst,
              pathLengthSecond,
              pathLengthThird,
              pathLengthFourth,
              pathLengthFifth,
            ]}
            title="Your scribe is slowing you down"
            description="Stop fighting with clunky tools. Get seamless AI documentation that actually works."
            className="pb-24"
          />
        </div>
      </div>

      {/* Pain Points Section */}
      <section className="relative bg-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
              Current scribes{" "}
              <span className="bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                create more problems
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-slate-600">
              You tried other solutions, but they added friction instead of
              solving it.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-red-100 p-3">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
                Clunky and Disruptive
              </h3>
              <p className="font-serif text-slate-600">
                Dictation systems that require constant correction, mobile apps
                that interrupt your workflow, or physical scribes that get in
                the way of patient exams.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-orange-100 p-3">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
                No Real Integration
              </h3>
              <p className="font-serif text-slate-600">
                Copy-paste nightmares, manual data entry, or notes that
                don&apos;t fit your PIMS format. You end up spending just as
                much time fixing and transferring.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-yellow-100 p-3">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
                Expensive with Hidden Costs
              </h3>
              <p className="font-serif text-slate-600">
                High monthly fees, per-note charges that add up fast, or human
                scribes at $30-50/hour. Plus the hidden cost of training and
                managing another system.
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
              A scribe that{" "}
              <span className="bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                actually helps
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-slate-600">
              OdisAI is the AI veterinary scribe built from the ground up for
              seamless, friction-free documentation.
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
                    Truly Hands-Free
                  </h3>
                  <p className="font-serif text-slate-600">
                    No apps to toggle, buttons to press, or commands to speak.
                    OdisAI simply listens and captures everything naturally—zero
                    disruption to your workflow.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    Real PIMS Integration
                  </h3>
                  <p className="font-serif text-slate-600">
                    One-click transfer to Avimark, Cornerstone, ezyVet, and
                    more. Notes are formatted exactly how your PIMS expects
                    them—no reformatting or manual entry required.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    Transparent, Predictable Pricing
                  </h3>
                  <p className="font-serif text-slate-600">
                    Simple flat-rate pricing with unlimited notes. No
                    per-appointment fees, no surprise charges. Know exactly what
                    you&apos;re paying each month.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    Works Immediately
                  </h3>
                  <p className="font-serif text-slate-600">
                    No complex training, no workflow changes, no steep learning
                    curve. Start using OdisAI in your first appointment with 5
                    minutes of setup.
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
            Experience Documentation That Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-teal-50">
            See why veterinarians are switching from clunky scribes to OdisAI
            for seamless, integrated documentation.
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
              Try Friction-Free Documentation - Book Demo
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

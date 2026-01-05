"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Phone, Calendar, Clock } from "lucide-react";
import { MarketingLayout, SectionContainer } from "~/components/marketing";
import { CalEmbedWrapper } from "~/components/landing/shared/cal-embed-wrapper";

const whatToExpect = [
  {
    icon: Phone,
    title: "Live Demo Call",
    description:
      "Experience OdisAI in action with a personalized live demonstration tailored to your clinic's needs.",
  },
  {
    icon: Calendar,
    title: "Personalized Walkthrough",
    description:
      "See how OdisAI handles discharge calls, after-hours inquiries, and appointment scheduling for your practice.",
  },
  {
    icon: Clock,
    title: "30-Minute Session",
    description:
      "Quick and efficient demo designed to show you the key features and answer all your questions.",
  },
];

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function DemoContent() {
  const formRef = useRef<HTMLDivElement>(null);
  const isFormInView = useInView(formRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <MarketingLayout navbar={{ variant: "solid" }}>
      {/* Demo Request Section */}
      <SectionContainer backgroundVariant="cool-blue" padding="none">
        <div className="py-16 sm:py-20 md:py-24">
          <div
            ref={formRef}
            className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8"
          >
            {/* Cal.com Booking Embed - Left Column */}
            <motion.div
              initial="hidden"
              animate={isFormInView ? "visible" : "hidden"}
              variants={fadeUpVariant}
              transition={transition}
              className="order-2 lg:order-1"
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {/* Cal.com Embed */}
                <CalEmbedWrapper
                  calLink="odis-ai-ecqxjw/odisai-demo"
                  className="h-[600px] max-h-[600px] overflow-auto rounded-lg"
                />
              </div>
            </motion.div>

            {/* What to Expect - Right Column */}
            <motion.div
              initial="hidden"
              animate={isFormInView ? "visible" : "hidden"}
              variants={fadeUpVariant}
              transition={{ ...transition, delay: 0.2 }}
              className="order-1 space-y-6 lg:order-2"
            >
              <div>
                <h2 className="font-display mb-3 text-2xl font-semibold text-slate-900">
                  What to Expect
                </h2>
                <p className="text-muted-foreground text-sm">
                  Get a personalized walkthrough of OdisAI tailored to your
                  clinic&apos;s needs.
                </p>
              </div>

              <div className="space-y-4">
                {whatToExpect.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial="hidden"
                      animate={isFormInView ? "visible" : "hidden"}
                      variants={fadeUpVariant}
                      transition={{
                        ...transition,
                        delay: 0.3 + index * 0.1,
                      }}
                      className="flex items-start gap-3"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-medium text-slate-900">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {item.description || "Description coming soon"}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </SectionContainer>
    </MarketingLayout>
  );
}

"use client";

import { useState, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
} from "motion/react";
import { Plus, Minus } from "lucide-react";
import { SectionBackground } from "~/components/ui/section-background";

// Animation variants - consistent with hero
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

interface FAQItem {
  question: string;
  answer: string;
}

const defaultFAQs: FAQItem[] = [
  {
    question: "How does OdisAI handle calls?",
    answer:
      "OdisAI uses advanced AI voice technology to answer calls naturally, just like a trained receptionist. It can schedule appointments, answer common questions about your clinic, take messages, and route urgent calls to your team.",
  },
  {
    question: "Will pet parents know they're talking to an AI?",
    answer:
      "Our AI is designed to sound natural and warm. Most callers don't realize they're speaking with AI—but we can configure transparent disclosure if your clinic prefers it.",
  },
  {
    question: "How does it integrate with my practice management system?",
    answer:
      "We currently offer deep integration with IDEXX Neo, with more PIMS integrations coming soon. The AI can check availability, book appointments, and log call notes directly in your system.",
  },
  {
    question: "What happens if the AI can't answer a question?",
    answer:
      "The AI gracefully routes complex or urgent calls to your team. It can take a message, schedule a callback, or transfer directly—whatever workflow you prefer.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most clinics are fully live within 48 hours. We handle the technical setup and train the AI on your clinic's specific information, services, and scheduling rules.",
  },
  {
    question: "Can it handle after-hours calls?",
    answer:
      "Absolutely. OdisAI works 24/7, so pet parents can schedule appointments or get answers even when your clinic is closed.",
  },
];

interface FAQSectionProps {
  title?: string;
  faqs?: FAQItem[];
}

export const FAQSection = ({
  title = "Frequently asked questions",
  faqs = defaultFAQs,
}: FAQSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="relative w-full overflow-hidden py-24 lg:py-32"
    >
      {/* Cohesive background */}
      <SectionBackground variant="transition" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <motion.div
              variants={fadeUpVariant}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ ...transition, delay: 0.4 }}
              className="lg:sticky lg:top-32"
            >
              <span className="text-primary mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
                <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
                Support
              </span>
              <h2 className="font-display text-foreground mb-4 text-3xl font-medium tracking-tight lg:text-4xl">
                {title}
              </h2>
              <p className="text-muted-foreground">
                Can&apos;t find what you&apos;re looking for?{" "}
                <a
                  href="mailto:hello@odis.ai"
                  className="text-primary hover:underline"
                >
                  Get in touch
                </a>
              </p>
            </motion.div>
          </div>

          <div className="lg:col-span-8">
            <div className="space-y-0">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  variants={fadeUpVariant}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  transition={{ ...transition, delay: 0.45 + index * 0.05 }}
                  className="border-border border-b"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="group flex w-full items-center justify-between py-5 text-left sm:py-6"
                    aria-expanded={openIndex === index}
                  >
                    <span className="text-foreground group-hover:text-primary pr-6 text-base font-medium transition-colors duration-200 sm:pr-8 lg:text-lg">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-secondary group-hover:bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors duration-200"
                    >
                      {openIndex === index ? (
                        <Minus className="text-foreground h-4 w-4" />
                      ) : (
                        <Plus className="text-foreground h-4 w-4" />
                      )}
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.3,
                          ease: [0.25, 0.1, 0.25, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pr-10 pb-5 sm:pr-12 sm:pb-6">
                          <p className="text-muted-foreground text-base leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

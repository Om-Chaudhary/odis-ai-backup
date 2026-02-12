"use client";

import { useState, useRef } from "react";
import {
  m,
  LazyMotion,
  domAnimation,
  AnimatePresence,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { Plus, Minus, MessageCircle, HelpCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@odis-ai/shared/util";
import { SectionBackground } from "../ui/section-background";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";

// Animation variants - consistent with hero
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

interface FAQItem {
  question: string;
  answer: string;
  category?: "technology" | "integration" | "setup" | "support";
}

const defaultFAQs: FAQItem[] = [
  {
    question: "How natural does the AI actually sound?",
    answer:
      "Listen to our demo calls—they're real, unscripted conversations with actual pet parents. Most callers don't realize they're talking to AI. The voice is warm, conversational, and trained specifically for veterinary contexts.",
    category: "technology",
  },
  {
    question: "What exactly can Odis do on a call?",
    answer:
      "For inbound: answer questions about your clinic, book appointments with real-time calendar sync, take messages, triage urgency, and route emergencies. For outbound: call every discharged patient, check on recovery, answer follow-up questions, and schedule rechecks.",
    category: "technology",
  },
  {
    question: "How does it connect to my PIMS?",
    answer:
      "We integrate directly with IDEXX Neo, ezyVet, and Cornerstone. Odis reads your schedule in real-time to book without conflicts, and logs call notes automatically. Setup takes about 30 minutes.",
    category: "integration",
  },
  {
    question: "What if a caller has a complex question or emergency?",
    answer:
      "Odis recognizes when to escalate. It can transfer to your on-call number, take a detailed message, or schedule an urgent callback—based on your rules. You stay in control.",
    category: "support",
  },
  {
    question: "How fast can we go live?",
    answer:
      "48 hours from signup to answering calls. We handle all technical setup, train the AI on your services and protocols, and test everything before going live. No IT work required from your team.",
    category: "setup",
  },
  {
    question: "What does it cost compared to hiring staff?",
    answer:
      "Most clinics see meaningful recovered revenue and saved time—far exceeding the cost. No benefits, no sick days, no training time. And Odis works nights and weekends without overtime.",
    category: "support",
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
  const sectionVisibilityRef = useSectionVisibility<HTMLElement>("faq");
  const localRef = useRef<HTMLElement>(null);
  const isInView = useInView(localRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Combine refs for both visibility tracking and animation
  const sectionRef = (el: HTMLElement | null) => {
    (localRef as React.MutableRefObject<HTMLElement | null>).current = el;
    (
      sectionVisibilityRef as React.MutableRefObject<HTMLElement | null>
    ).current = el;
  };

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <LazyMotion features={domAnimation} strict>
    <section
      ref={sectionRef as React.LegacyRef<HTMLElement>}
      id="faq"
      className="relative w-full overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32"
    >
      {/* Fade out background - gentle transition to footer */}
      <SectionBackground variant="fade-out" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <m.div
              variants={fadeUpVariant}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ ...transition, delay: 0.4 }}
              className="lg:sticky lg:top-32"
            >
              <span className="font-display text-primary mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
                <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
                Support
              </span>
              <h2 className="font-display mb-4 text-2xl font-medium tracking-tight text-slate-800 sm:text-3xl md:text-4xl">
                {title}
              </h2>
              <p className="text-muted-foreground mb-6">
                Can&apos;t find what you&apos;re looking for?{" "}
                <a
                  href="mailto:hello@odis.ai"
                  className="text-primary font-medium transition-colors hover:text-teal-700 hover:underline"
                >
                  Get in touch
                </a>
              </p>

              {/* Stats indicator */}
              <m.div
                variants={fadeUpVariant}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ ...transition, delay: 0.45 }}
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>{faqs.length} common questions</span>
                </div>
              </m.div>
            </m.div>
          </div>

          <div className="lg:col-span-8">
            <m.div
              variants={staggerContainer}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="space-y-3"
            >
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <m.div
                    key={index}
                    variants={itemVariant}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border transition-all duration-300",
                      isOpen
                        ? "border-teal-200 bg-white shadow-lg shadow-teal-500/10"
                        : "border-border/50 bg-background/60 backdrop-blur-sm hover:border-teal-200/50 hover:bg-white/80 hover:shadow-md",
                    )}
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="flex w-full items-center gap-4 p-5 text-left sm:p-6"
                      aria-expanded={isOpen}
                    >
                      {/* Question number */}
                      <span
                        className={cn(
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-300",
                          isOpen
                            ? "bg-teal-500 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-600",
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span
                        className={cn(
                          "flex-1 text-base font-medium transition-colors duration-200 sm:text-lg",
                          isOpen
                            ? "text-teal-700"
                            : "text-slate-800 group-hover:text-teal-700",
                        )}
                      >
                        {faq.question}
                      </span>

                      <m.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200",
                          isOpen
                            ? "bg-teal-100 text-teal-600"
                            : "bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-600",
                        )}
                      >
                        {isOpen ? (
                          <Minus className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </m.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <m.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: shouldReduceMotion ? 0 : 0.3,
                            ease: [0.25, 0.1, 0.25, 1],
                          }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-teal-100 px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
                            <div className="flex gap-4">
                              {/* Vertical accent line */}
                              <div className="hidden w-8 flex-shrink-0 sm:block" />
                              <div className="flex-1">
                                <p className="text-muted-foreground text-base leading-relaxed">
                                  {faq.answer}
                                </p>

                                {/* Category tag */}
                                {faq.category && (
                                  <div className="mt-4 flex items-center gap-2">
                                    <MessageCircle className="h-3.5 w-3.5 text-teal-500" />
                                    <span className="text-xs font-medium text-teal-600 capitalize">
                                      {faq.category}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </m.div>
                );
              })}
            </m.div>

            {/* Bottom CTA section */}
            <m.div
              variants={fadeUpVariant}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ ...transition, delay: 0.8 }}
              className="mt-10"
            >
              <div className="rounded-2xl border border-teal-200/50 bg-gradient-to-br from-white/90 to-teal-50/60 p-6 text-center backdrop-blur-sm sm:p-8">
                <p className="mb-4 text-sm font-medium text-slate-700">
                  Ready to see how OdisAI can transform your practice?
                </p>
                <Link
                  href="/demo"
                  className={cn(
                    "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full px-6 py-3",
                    "bg-gradient-to-r from-teal-600 to-emerald-600",
                    "text-sm font-semibold text-white shadow-lg shadow-teal-500/25",
                    "transition-all duration-300",
                    "hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/30",
                  )}
                >
                  {/* Shimmer effect */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <Calendar className="relative h-4 w-4" />
                  <span className="relative">Schedule a Demo</span>
                </Link>
                <p className="text-muted-foreground mt-4 text-sm">
                  Still have questions?{" "}
                  <a
                    href="mailto:hello@odis.ai"
                    className="text-primary font-medium hover:underline"
                  >
                    Contact our team
                  </a>{" "}
                  for personalized support.
                </p>
              </div>
            </m.div>
          </div>
        </div>
      </div>
    </section>
    </LazyMotion>
  );
};

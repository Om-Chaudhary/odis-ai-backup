"use client";

import { useState, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
} from "motion/react";
import { usePostHog } from "posthog-js/react";
import {
  Plus,
  Minus,
  Phone,
  MessageCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { SectionBackground } from "../ui/section-background";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";
import { trackDemoPhoneClick } from "../shared/landing-analytics";

const DEMO_PHONE_NUMBER = "(925) 678-5640";
const DEMO_PHONE_TEL = "tel:+19256785640";

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
    question: "How does OdisAI handle calls?",
    answer:
      "OdisAI uses advanced AI voice technology to answer calls naturally, just like a trained receptionist. It can schedule appointments, answer common questions about your clinic, take messages, and route urgent calls to your team.",
    category: "technology",
  },
  {
    question: "Will pet parents know they're talking to an AI?",
    answer:
      "Our AI is designed to sound natural and warm. Most callers don't realize they're speaking with AI—but we can configure transparent disclosure if your clinic prefers it.",
    category: "technology",
  },
  {
    question: "How does it integrate with my practice management system?",
    answer:
      "We currently offer deep integration with IDEXX Neo, with more PIMS integrations coming soon. The AI can check availability, book appointments, and log call notes directly in your system.",
    category: "integration",
  },
  {
    question: "What happens if the AI can't answer a question?",
    answer:
      "The AI gracefully routes complex or urgent calls to your team. It can take a message, schedule a callback, or transfer directly—whatever workflow you prefer.",
    category: "support",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most clinics are fully live within 48 hours. We handle the technical setup and train the AI on your clinic's specific information, services, and scheduling rules.",
    category: "setup",
  },
  {
    question: "Can it handle after-hours calls?",
    answer:
      "Absolutely. OdisAI works 24/7, so pet parents can schedule appointments or get answers even when your clinic is closed.",
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
  const posthog = usePostHog();
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

  const handleDemoPhoneClick = () => {
    trackDemoPhoneClick(posthog, "faq-sidebar", DEMO_PHONE_NUMBER);
  };

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
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
            <motion.div
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
              <motion.div
                variants={fadeUpVariant}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ ...transition, delay: 0.45 }}
                className="mb-6 flex items-center gap-3"
              >
                <div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>{faqs.length} common questions</span>
                </div>
              </motion.div>

              {/* Demo CTA Card */}
              <motion.div
                variants={fadeUpVariant}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ ...transition, delay: 0.5 }}
                className="glass-card group relative overflow-hidden rounded-2xl p-5"
              >
                {/* Decorative gradient */}
                <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-teal-500/10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-teal-500/20" />

                <div className="relative">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                      <Sparkles className="h-4 w-4 text-teal-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      Try it yourself
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Call our demo line to experience OdisAI firsthand
                  </p>
                  <a
                    href={DEMO_PHONE_TEL}
                    onClick={handleDemoPhoneClick}
                    className={cn(
                      "inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3",
                      "bg-gradient-to-r from-teal-600 to-emerald-600",
                      "text-sm font-semibold text-white shadow-lg shadow-teal-500/25",
                      "transition-all duration-300",
                      "hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/30",
                    )}
                  >
                    <Phone className="h-4 w-4" />
                    {DEMO_PHONE_NUMBER}
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="lg:col-span-8">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="space-y-3"
            >
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <motion.div
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

                      <motion.div
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
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Bottom help text */}
            <motion.div
              variants={fadeUpVariant}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ ...transition, delay: 0.8 }}
              className="mt-8 text-center"
            >
              <p className="text-muted-foreground text-sm">
                Still have questions?{" "}
                <a
                  href="mailto:hello@odis.ai"
                  className="text-primary font-medium hover:underline"
                >
                  Contact our team
                </a>{" "}
                for personalized support.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

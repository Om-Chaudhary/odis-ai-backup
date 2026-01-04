"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Phone, X } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { cn } from "@odis-ai/shared/util";

const DEMO_PHONE_NUMBER = "(925) 678-5640";
const DEMO_PHONE_TEL = "tel:+19256785640";

export function StickyMobileCTA() {
  const posthog = usePostHog();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the hero (approximately 600px)
      const shouldShow = window.scrollY > 600;
      setIsVisible(shouldShow && !isDismissed);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  const handleDemoClick = () => {
    posthog?.capture("schedule_demo_clicked", {
      location: "sticky_mobile_cta",
    });
  };

  const handlePhoneClick = () => {
    posthog?.capture("demo_phone_clicked", {
      location: "sticky_mobile_cta",
      phone_number: DEMO_PHONE_NUMBER,
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    posthog?.capture("sticky_cta_dismissed", {
      location: "sticky_mobile_cta",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-50 md:hidden"
        >
          {/* Gradient fade effect at top */}
          <div className="pointer-events-none h-6 bg-gradient-to-t from-white to-transparent" />

          {/* CTA Bar */}
          <div className="relative border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-8 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-sm transition-colors hover:bg-slate-200"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center gap-3">
              {/* Primary CTA - Schedule Demo */}
              <Link
                href="/demo"
                onClick={handleDemoClick}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3",
                  "bg-teal-600 text-white",
                  "text-sm font-medium",
                  "transition-all duration-200",
                  "active:scale-[0.98]",
                )}
              >
                <Calendar className="h-4 w-4" />
                <span>Schedule Demo</span>
              </Link>

              {/* Secondary CTA - Call */}
              <a
                href={DEMO_PHONE_TEL}
                onClick={handlePhoneClick}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-full px-4 py-3",
                  "bg-slate-100 text-slate-700",
                  "text-sm font-medium",
                  "transition-all duration-200",
                  "active:scale-[0.98]",
                )}
              >
                <Phone className="h-4 w-4" />
                <span>Call</span>
              </a>
            </div>

            {/* Trust message */}
            <p className="mt-2 text-center text-xs text-slate-500">
              No commitment required · See results in 48 hours
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

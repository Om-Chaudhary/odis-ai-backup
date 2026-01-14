"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, X } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { cn } from "@odis-ai/shared/util";

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

            <div className="flex justify-center">
              <Link
                href="/demo"
                onClick={handleDemoClick}
                className={cn(
                  "relative flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3",
                  "bg-gradient-to-r from-teal-600 to-emerald-600 text-white",
                  "text-sm font-semibold shadow-lg shadow-teal-500/25",
                  "transition-all duration-200",
                  "active:scale-[0.98]",
                )}
              >
                {/* Shimmer effect */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <Calendar className="relative h-4 w-4" />
                <span className="relative">Schedule Demo</span>
              </Link>
            </div>

            {/* Trust message with urgency */}
            <p className="mt-2 text-center text-xs text-slate-500">
              <span className="font-medium text-teal-600">Free demo</span> · No
              commitment · Results in 48 hours
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

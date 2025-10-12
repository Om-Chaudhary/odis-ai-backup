"use client";

import { useState, useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { EnhancedButton } from "~/components/ui/enhanced-button";
import { Logo } from "~/components/ui/Logo";
import WaitlistModal from "./WaitlistModal";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";

export default function Navigation() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleButtonClick = () => {
    posthog.capture("waitlist_cta_clicked", {
      location: "navigation",
      button_text: "Join Waitlist",
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
    });
    setIsModalOpen(true);
  };

  const handleButtonHover = () => {
    // Debounce hover events
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      posthog.capture("cta_button_hover", {
        location: "navigation",
        button_text: "Join Waitlist",
        device_type: deviceInfo.device_type,
      });
    }, 200);
  };

  const handleButtonLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 shadow-md backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600">
                <Logo size="md" />
              </div>
              <span
                className={`font-display text-xl font-bold transition-colors duration-300 ${
                  isScrolled
                    ? "text-[#1a202c]"
                    : "text-[#1a202c] drop-shadow-sm"
                }`}
              >
                OdisAI
              </span>
            </div>
            <EnhancedButton
              onClick={handleButtonClick}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
              variant="shimmer"
              size="sm"
              className="px-4 sm:px-6 md:px-8"
            >
              <span className="hidden sm:inline">Join Waitlist</span>
              <span className="sm:hidden">Join</span>
            </EnhancedButton>
          </div>
        </div>
      </nav>
      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        triggerLocation="navigation"
      />
    </>
  );
}

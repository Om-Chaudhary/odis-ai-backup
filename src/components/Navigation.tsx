"use client";

import { useState, useEffect } from "react";
import { EnhancedButton } from "~/components/ui/enhanced-button";
import { Logo } from "~/components/ui/Logo";
import WaitlistModal from "./WaitlistModal";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
              onClick={() => setIsModalOpen(true)}
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
      />
    </>
  );
}

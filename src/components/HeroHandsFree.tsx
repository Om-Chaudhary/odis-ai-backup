"use client";

import { useState, useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { EnhancedButton } from "~/components/ui/enhanced-button";
import WaitlistModal from "./WaitlistModal";
import { ArrowRight, Zap, Shield, Clock } from "lucide-react";
import { LightRays } from "~/components/ui/light-rays";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";

export default function HeroHandsFree() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showUnderline, setShowUnderline] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Start underline animation after text animations finish (2.2s delay)
    if (isVisible) {
      const underlineTimer = setTimeout(() => setShowUnderline(true), 2200);
      return () => clearTimeout(underlineTimer);
    }
  }, [isVisible]);

  const handleButtonClick = () => {
    posthog.capture("waitlist_cta_clicked", {
      location: "hero",
      button_text: "Experience Zero-Friction AI Scribing",
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
        location: "hero",
        button_text: "Experience Zero-Friction AI Scribing",
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
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50 via-emerald-100/40 to-emerald-50/30">
        {/* Subtle greenish teal gradient background with smooth transition */}
        <div className="pointer-events-none absolute inset-0">
          {/* Animated gradient overlay */}
          <div
            className="animate-gradient-move absolute inset-0 opacity-70 blur-sm"
            style={{
              background:
                "radial-gradient(circle at 30% 40%, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.06) 40%, transparent 70%)",
            }}
          />

          {/* Secondary moving gradient */}
          <div
            className="animate-gradient-move-reverse absolute inset-0 opacity-50 blur-sm"
            style={{
              background:
                "radial-gradient(circle at 70% 60%, rgba(16, 185, 129, 0.10) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 80%)",
            }}
          />

          {/* Floating accent orbs with enhanced animations */}
          <div
            className="animate-float-slow absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full opacity-40 blur-3xl transition-opacity duration-1000 hover:opacity-60"
            style={{
              background:
                "radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 60%)",
            }}
          />
          <div
            className="animate-float-slow-reverse absolute right-1/3 bottom-1/3 h-[300px] w-[300px] rounded-full opacity-35 blur-3xl transition-opacity duration-1000 hover:opacity-50"
            style={{
              background:
                "radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 60%)",
            }}
          />
          {/* Additional subtle floating element */}
          <div
            className="animate-float-gentle absolute top-1/2 right-1/4 h-[200px] w-[200px] rounded-full opacity-25 blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Subtle dot pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle, #31aba3 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Light Rays Effect */}
        <LightRays className="pointer-events-none absolute inset-0" />

        {/* Prominent animated radial gradient behind text */}
        <div
          className="animate-pulse-slow pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 1000px 700px at 50% 50%, rgba(49, 171, 163, 0.25) 0%, rgba(49, 171, 163, 0.15) 40%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        {/* Main content container */}
        <div className="relative mx-auto max-w-7xl px-4 pt-32 pb-32 sm:px-6">
          <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Column - Main Content */}
            <div className="relative space-y-12 text-center lg:text-left">
              {/* Floating badge with announcement */}
              <div
                className={`inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-100/30 px-4 py-2 shadow-sm backdrop-blur-sm transition-all duration-1200 ease-out hover:scale-105 hover:shadow-md sm:px-5 sm:py-2.5 ${
                  isVisible
                    ? "animate-fade-in-up opacity-100"
                    : "translate-y-2 opacity-0"
                }`}
              >
                <Zap className="h-4 w-4 animate-pulse text-[#31aba3]" />
                <span className="font-serif text-xs leading-tight font-medium text-slate-600 sm:text-sm">
                  🚀 The most hands-free AI scribe available
                </span>
              </div>

              {/* Main headline with enhanced animations */}
              <h1
                className={`font-display space-y-2 px-2 text-4xl leading-tight font-bold transition-all duration-1500 ease-out sm:px-0 sm:text-5xl md:text-6xl lg:text-7xl ${
                  isVisible
                    ? "animate-fade-in-up opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
              >
                {/* First line with subtle gradient effect */}
                <span
                  className="animate-gradient-subtle block bg-gradient-to-r from-slate-600 via-teal-600 to-slate-600 bg-clip-text text-transparent"
                  style={{ backgroundSize: "200% 200%" }}
                >
                  Zero-friction AI scribing.
                </span>

                {/* Second line with enhanced gradient and animated underline */}
                <span className="mt-1 block sm:mt-2">
                  <span
                    className="animate-gradient-subtle bg-gradient-to-r from-slate-600 via-teal-700 to-teal-600 bg-clip-text text-transparent"
                    style={{ backgroundSize: "200% 200%" }}
                  >
                    Maximum{" "}
                  </span>
                  <span className="group relative inline-block">
                    <span
                      className="animate-gradient-patient-care group-hover:animate-gradient-patient-care-hover relative z-10 bg-gradient-to-r from-teal-600 via-teal-500 to-teal-700 bg-clip-text text-transparent transition-all duration-300"
                      style={{
                        backgroundSize: "200% 200%",
                        filter:
                          "drop-shadow(0 0 12px rgba(49, 171, 163, 0.6)) drop-shadow(0 2px 8px rgba(49, 171, 163, 0.4))",
                      }}
                    >
                      efficiency.
                    </span>
                    {/* Enhanced SVG underline with drawing animation */}
                    <svg
                      className="absolute -bottom-3 left-0 w-full transition-all duration-300 group-hover:scale-105 sm:-bottom-3"
                      height="20"
                      viewBox="0 0 400 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="none"
                    >
                      {/* Main underline path */}
                      <path
                        d="M5 15C100 5 200 3 300 8C350 10 380 13 395 15"
                        stroke="url(#gradient-underline)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.8"
                        className="animate-draw-underline"
                        style={{
                          strokeDasharray: 400,
                          strokeDashoffset: showUnderline ? 0 : 400,
                          transition:
                            "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1) 0s",
                        }}
                      />
                      {/* Subtle glow effect */}
                      <path
                        d="M5 15C100 5 200 3 300 8C350 10 380 13 395 15"
                        stroke="url(#glow-underline)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.3"
                        className="animate-draw-underline-glow"
                        style={{
                          strokeDasharray: 400,
                          strokeDashoffset: showUnderline ? 0 : 400,
                          transition:
                            "stroke-dashoffset 1.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s",
                        }}
                      />
                      <defs>
                        <linearGradient
                          id="gradient-underline"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#31aba3" />
                          <stop offset="30%" stopColor="#0d9488" />
                          <stop offset="70%" stopColor="#14b8a6" />
                          <stop offset="100%" stopColor="#31aba3" />
                        </linearGradient>
                        <linearGradient
                          id="glow-underline"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#31aba3"
                            stopOpacity="0.4"
                          />
                          <stop
                            offset="50%"
                            stopColor="#0d9488"
                            stopOpacity="0.6"
                          />
                          <stop
                            offset="100%"
                            stopColor="#31aba3"
                            stopOpacity="0.4"
                          />
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                </span>
              </h1>

              {/* Description with enhanced animation */}
              <p
                className={`mx-auto max-w-3xl px-4 font-serif text-base leading-relaxed text-slate-700 transition-all duration-1300 ease-out sm:px-0 sm:text-lg md:text-xl ${
                  isVisible
                    ? "animate-fade-in-up opacity-100"
                    : "translate-y-3 opacity-0"
                }`}
                style={{ transitionDelay: "0.2s" }}
              >
                The most seamless and intuitive AI scribe that adds zero
                friction to your workflow. SOAP notes write themselves while you
                focus on what matters most - your patients.
              </p>

              {/* CTA Button with enhanced animation */}
              <div
                className={`flex flex-col items-center justify-center gap-4 pt-4 transition-all duration-1300 ease-out sm:flex-row lg:justify-start ${
                  isVisible
                    ? "animate-fade-in-up opacity-100"
                    : "translate-y-3 opacity-0"
                }`}
                style={{ transitionDelay: "0.4s" }}
              >
                <EnhancedButton
                  onClick={handleButtonClick}
                  onMouseEnter={handleButtonHover}
                  onMouseLeave={handleButtonLeave}
                  variant="gradient"
                  size="lg"
                  icon={
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  }
                  iconPosition="right"
                  className="group w-full transition-all duration-300 hover:scale-105 hover:shadow-lg sm:w-auto"
                >
                  Experience Zero-Friction AI Scribing
                </EnhancedButton>
              </div>
            </div>

            {/* Right Column - Visual/Feature Elements */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* Feature highlights in a more prominent layout */}
                <div
                  className={`space-y-6 transition-all duration-1300 ease-out ${
                    isVisible
                      ? "animate-fade-in-up opacity-100"
                      : "translate-y-3 opacity-0"
                  }`}
                  style={{ transitionDelay: "0.5s" }}
                >
                  <div className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#31aba3]/10">
                        <Shield className="h-6 w-6 text-[#31aba3]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          100% Hands-Free
                        </h3>
                        <p className="text-sm text-slate-600">
                          No manual input required
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#31aba3]/10">
                        <Zap className="h-6 w-6 text-[#31aba3]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          Zero Friction
                        </h3>
                        <p className="text-sm text-slate-600">
                          Seamless workflow integration
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#31aba3]/10">
                        <Clock className="h-6 w-6 text-[#31aba3]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          Instant Results
                        </h3>
                        <p className="text-sm text-slate-600">
                          Real-time SOAP note generation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        triggerLocation="hero"
      />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes draw-underline {
          from {
            stroke-dasharray: 400;
            stroke-dashoffset: 400;
          }
          to {
            stroke-dasharray: 400;
            stroke-dashoffset: 0;
          }
        }

        @keyframes draw-underline-glow {
          from {
            stroke-dasharray: 400;
            stroke-dashoffset: 400;
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          to {
            stroke-dasharray: 400;
            stroke-dashoffset: 0;
            opacity: 0.3;
          }
        }

        @keyframes gradient-move {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.8;
          }
          25% {
            transform: translate(20px, -30px) scale(1.1);
            opacity: 1;
          }
          50% {
            transform: translate(-10px, 20px) scale(0.9);
            opacity: 0.9;
          }
          75% {
            transform: translate(30px, 10px) scale(1.05);
            opacity: 0.95;
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.8;
          }
        }

        @keyframes gradient-move-reverse {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          25% {
            transform: translate(-25px, 15px) scale(0.95);
            opacity: 0.8;
          }
          50% {
            transform: translate(15px, -25px) scale(1.1);
            opacity: 0.7;
          }
          75% {
            transform: translate(-20px, -10px) scale(0.9);
            opacity: 0.85;
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translate(30px, -20px) scale(1.2);
            opacity: 0.6;
          }
        }

        @keyframes float-slow-reverse {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(-25px, 15px) scale(1.1);
            opacity: 0.5;
          }
        }

        @keyframes float-gentle {
          0%,
          100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.25;
          }
          33% {
            transform: translate(15px, -10px) scale(1.05) rotate(1deg);
            opacity: 0.35;
          }
          66% {
            transform: translate(-10px, 20px) scale(0.95) rotate(-1deg);
            opacity: 0.3;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-draw-underline {
          animation: draw-underline 1.2s ease-out 0.5s forwards;
        }

        .animate-draw-underline-glow {
          animation: draw-underline-glow 1.5s ease-out 0.7s forwards;
        }

        .animate-gradient-move {
          animation: gradient-move 15s ease-in-out infinite;
        }

        .animate-gradient-move-reverse {
          animation: gradient-move-reverse 18s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }

        .animate-float-slow-reverse {
          animation: float-slow-reverse 14s ease-in-out infinite;
        }

        .animate-float-gentle {
          animation: float-gentle 16s ease-in-out infinite;
        }

        @keyframes gradient-subtle {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes gradient-patient-care {
          0% {
            background-position: 0% 50%;
            filter: brightness(1);
          }
          25% {
            background-position: 25% 50%;
            filter: brightness(1.05);
          }
          50% {
            background-position: 50% 50%;
            filter: brightness(1.1);
          }
          75% {
            background-position: 75% 50%;
            filter: brightness(1.05);
          }
          100% {
            background-position: 100% 50%;
            filter: brightness(1);
          }
        }

        @keyframes gradient-patient-care-hover {
          0% {
            background-position: 0% 50%;
            filter: brightness(1.1);
          }
          50% {
            background-position: 100% 50%;
            filter: brightness(1.15);
          }
          100% {
            background-position: 0% 50%;
            filter: brightness(1.1);
          }
        }

        .animate-gradient-subtle {
          animation: gradient-subtle 8s ease-in-out infinite;
          background-size: 200% 200%;
        }

        .animate-gradient-patient-care {
          animation: gradient-patient-care 6s ease-in-out infinite;
          background-size: 200% 200%;
        }

        .animate-gradient-patient-care-hover {
          animation: gradient-patient-care-hover 3s ease-in-out infinite;
          background-size: 200% 200%;
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        .hero-light-bg {
          background: linear-gradient(
            to bottom,
            #ecfdf5,
            #f0fdfa,
            #f0fdfa
          ) !important;
        }
      `}</style>
    </>
  );
}

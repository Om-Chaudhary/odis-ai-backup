"use client";

import { useEffect, useState } from "react";
import { usePostHog } from "posthog-js/react";
import Navigation from "~/components/Navigation";
import { EnhancedButton } from "@odis/ui/enhanced-button";
import { LightRays } from "@odis/ui/light-rays";
import { Home, ArrowLeft } from "lucide-react";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";
import Link from "next/link";

export default function NotFound() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Track 404 page view
    posthog.capture("404_page_viewed", {
      timestamp: Date.now(),
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
      viewport_height: deviceInfo.viewport_height,
    });

    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [posthog, deviceInfo]);

  const handleHomeClick = () => {
    posthog.capture("404_home_button_clicked", {
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
    });
  };

  const handleBackClick = () => {
    posthog.capture("404_back_button_clicked", {
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
    });
    window.history.back();
  };

  return (
    <main className="relative min-h-screen">
      <div className="dotted-background" />
      <Navigation />

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50 via-emerald-100/40 to-emerald-50/30">
        {/* Background effects matching the hero */}
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

          {/* Floating accent orbs */}
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

        {/* Main content container */}
        <div className="relative mx-auto max-w-4xl px-4 pt-24 pb-16 sm:px-6">
          <div className="relative space-y-6 text-center">
            {/* Main headline */}
            <h1
              className={`font-display space-y-2 px-2 text-4xl leading-tight font-bold transition-all duration-1500 ease-out sm:px-0 sm:text-5xl md:text-6xl lg:text-7xl ${
                isVisible
                  ? "animate-fade-in-up opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
              style={{ transitionDelay: "0.1s" }}
            >
              <span
                className="animate-gradient-subtle block bg-gradient-to-r from-slate-600 via-teal-600 to-slate-600 bg-clip-text text-transparent"
                style={{ backgroundSize: "200% 200%" }}
              >
                Oops! This page
              </span>
              <span
                className="animate-gradient-subtle bg-gradient-to-r from-slate-600 via-teal-700 to-teal-600 bg-clip-text text-transparent"
                style={{ backgroundSize: "200% 200%" }}
              >
                got lost in the{" "}
                <span className="relative inline-block">
                  <span
                    className="animate-gradient-patient-care relative z-10 bg-gradient-to-r from-teal-600 via-teal-500 to-teal-700 bg-clip-text text-transparent transition-all duration-300"
                    style={{
                      backgroundSize: "200% 200%",
                      filter:
                        "drop-shadow(0 0 12px rgba(49, 171, 163, 0.6)) drop-shadow(0 2px 8px rgba(49, 171, 163, 0.4))",
                    }}
                  >
                    veterinary records.
                  </span>
                </span>
              </span>
            </h1>

            {/* Description */}
            <p
              className={`mx-auto max-w-3xl px-4 font-serif text-lg leading-relaxed text-slate-700 transition-all duration-1300 ease-out sm:px-0 sm:text-xl md:text-2xl ${
                isVisible
                  ? "animate-fade-in-up opacity-100"
                  : "translate-y-3 opacity-0"
              }`}
              style={{ transitionDelay: "0.2s" }}
            >
              Don&apos;t worry, even the best veterinarians sometimes misplace a
              file. Let&apos;s get you back to caring for your patients.
            </p>

            {/* Action buttons */}
            <div
              className={`flex flex-col items-center justify-center gap-4 pt-6 transition-all duration-1300 ease-out sm:flex-row ${
                isVisible
                  ? "animate-fade-in-up opacity-100"
                  : "translate-y-3 opacity-0"
              }`}
              style={{ transitionDelay: "0.3s" }}
            >
              <Link href="/" onClick={handleHomeClick}>
                <EnhancedButton
                  variant="gradient"
                  size="lg"
                  icon={
                    <Home className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  }
                  iconPosition="left"
                  className="group w-full transition-all duration-300 hover:scale-105 hover:shadow-lg sm:w-auto"
                >
                  Back to Home
                </EnhancedButton>
              </Link>

              <EnhancedButton
                onClick={handleBackClick}
                variant="outline"
                size="lg"
                icon={
                  <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
                }
                iconPosition="left"
                className="group w-full transition-all duration-300 hover:scale-105 hover:shadow-lg sm:w-auto"
              >
                Go Back
              </EnhancedButton>
            </div>

            {/* Fun veterinary-themed message */}
            <div
              className={`mx-auto max-w-lg px-4 pt-4 transition-all duration-1300 ease-out sm:px-0 ${
                isVisible
                  ? "animate-fade-in-up opacity-100"
                  : "translate-y-3 opacity-0"
              }`}
              style={{ transitionDelay: "0.4s" }}
            >
              <p className="font-serif text-base text-slate-500 italic">
                &quot;Even the most organized veterinary practice can have a
                missing file. The important thing is getting back to what
                matters most.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

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

        .animate-gradient-subtle {
          animation: gradient-subtle 8s ease-in-out infinite;
          background-size: 200% 200%;
        }

        .animate-gradient-patient-care {
          animation: gradient-patient-care 6s ease-in-out infinite;
          background-size: 200% 200%;
        }
      `}</style>
    </main>
  );
}

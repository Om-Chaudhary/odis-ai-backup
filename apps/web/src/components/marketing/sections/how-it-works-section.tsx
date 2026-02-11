"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  Circle,
  Phone,
  Clock,
  Shield,
  Zap,
  Heart,
  Bot,
  MessageSquare,
  AlertTriangle,
  Moon,
  ShieldCheck,
  FileText,
  ClipboardCheck,
  Plug,
  PhoneCall,
  BarChart3,
  PhoneForwarded,
  PhoneIncoming,
  Stethoscope,
  Siren,
  Users,
} from "lucide-react";
import { BlurFade } from "~/components/landing/ui/blur-fade";
import { cn } from "@odis-ai/shared/util";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Phone,
  Clock,
  Shield,
  Zap,
  Heart,
  Circle,
  ChevronRight,
  Bot,
  MessageSquare,
  AlertTriangle,
  Moon,
  ShieldCheck,
  FileText,
  ClipboardCheck,
  Plug,
  PhoneCall,
  BarChart3,
  PhoneForwarded,
  PhoneIncoming,
  Stethoscope,
  Siren,
  Users,
};

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
  iconName: string;
}

export interface HowItWorksSectionProps {
  steps: HowItWorksStep[];
  className?: string;
}

function getLucideIcon(name: string) {
  return iconMap[name] ?? Circle;
}

export function HowItWorksSection({
  steps,
  className,
}: HowItWorksSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {/* Desktop: horizontal */}
      <div className="hidden md:flex md:items-start md:justify-center md:gap-0">
        {steps.map((step, index) => {
          const Icon = getLucideIcon(step.iconName);
          return (
            <div key={step.step} className="flex items-start">
              <BlurFade delay={index * 0.15} inView={isInView}>
                <div className="flex w-56 flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 shadow-sm">
                      <Icon className="h-7 w-7 text-teal-600" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                      {step.step}
                    </span>
                  </div>
                  <h4 className="mb-2 text-base font-semibold text-slate-900">
                    {step.title}
                  </h4>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </div>
              </BlurFade>

              {index < steps.length - 1 && (
                <div className="mt-8 flex items-center px-4">
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={
                      isInView
                        ? { scaleX: 1, opacity: 1 }
                        : { scaleX: 0, opacity: 0 }
                    }
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.5,
                      delay: (index + 1) * 0.15 + 0.1,
                    }}
                    className="origin-left"
                  >
                    <div className="flex items-center">
                      <div className="h-0.5 w-12 bg-gradient-to-r from-teal-300 to-teal-500" />
                      <ChevronRight className="-ml-1 h-5 w-5 text-teal-500" />
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="flex flex-col gap-8 md:hidden">
        {steps.map((step, index) => {
          const Icon = getLucideIcon(step.iconName);
          return (
            <BlurFade key={step.step} delay={index * 0.15} inView={isInView}>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 shadow-sm">
                      <Icon className="h-6 w-6 text-teal-600" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                      {step.step}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="mt-2 h-full w-0.5 flex-1 bg-gradient-to-b from-teal-300 to-teal-100" />
                  )}
                </div>
                <div className="pt-2 pb-2">
                  <h4 className="mb-1 text-base font-semibold text-slate-900">
                    {step.title}
                  </h4>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </div>
              </div>
            </BlurFade>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Calendar, DollarSign, Moon } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface CounterAnimationProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

function AnimatedCounter({
  target,
  duration = 2000,
  prefix = "",
  suffix = "",
  className
}: CounterAnimationProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = current;
    const increment = target - startValue;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const value = Math.round(startValue + increment * easeOutQuart);

      setCurrent(value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [target, duration, current]);

  return (
    <span className={className}>
      {prefix}{current.toLocaleString()}{suffix}
    </span>
  );
}

export function AfterhourAgentStats() {
  return (
    <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/80 via-white to-purple-50/40 px-8 py-6">
      <div className="flex items-start gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100/80">
          <Moon className="h-6 w-6 text-purple-600" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">
            After-Hours Agent Impact
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Our AI assistant working around the clock for your practice
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Appointments Booked */}
            <div className="flex items-center gap-3 rounded-lg border border-purple-100/60 bg-white/60 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  <AnimatedCounter
                    target={31}
                    duration={2500}
                    className="text-purple-600"
                  />
                </div>
                <div className="text-xs font-medium text-slate-600">
                  Appointments Booked
                </div>
              </div>
            </div>

            {/* Revenue Generated */}
            <div className="flex items-center gap-3 rounded-lg border border-purple-100/60 bg-white/60 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  <AnimatedCounter
                    target={2902}
                    duration={3000}
                    prefix="$"
                    className="text-emerald-600"
                  />
                </div>
                <div className="text-xs font-medium text-slate-600">
                  Revenue Generated
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Working 24/7 to capture every opportunity while you're away
          </div>
        </div>
      </div>
    </div>
  );
}
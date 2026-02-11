"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, CheckCircle2, CalendarCheck } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

const MESSAGES = [
  {
    role: "ai" as const,
    name: "Odis",
    text: "Hi Sarah, calling from Valley Vet about Max's discharge today.",
  },
  {
    role: "client" as const,
    name: "Sarah",
    text: "Oh great, how did it go?",
  },
  {
    role: "ai" as const,
    name: "Odis",
    text: "Max did wonderfully! Sending his care instructions now.",
  },
];

const OUTCOMES = [
  { icon: CheckCircle2, text: "Discharge summary sent" },
  { icon: CalendarCheck, text: "Follow-up · Thu 2:00 PM" },
];

export function HeroCallCard({
  shouldAnimate,
}: {
  shouldAnimate: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showOutcomes, setShowOutcomes] = useState(false);
  const [elapsed, setElapsed] = useState(38);

  // Ticking timer
  useEffect(() => {
    if (!shouldAnimate) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [shouldAnimate]);

  // Sequenced message reveal
  useEffect(() => {
    if (!shouldAnimate) return;
    const t: ReturnType<typeof setTimeout>[] = [];

    // Message 1 — immediate
    t.push(setTimeout(() => setVisibleCount(1), 300));

    // Typing → Message 2
    t.push(setTimeout(() => setIsTyping(true), 1600));
    t.push(
      setTimeout(() => {
        setIsTyping(false);
        setVisibleCount(2);
      }, 2600),
    );

    // Typing → Message 3
    t.push(setTimeout(() => setIsTyping(true), 3600));
    t.push(
      setTimeout(() => {
        setIsTyping(false);
        setVisibleCount(3);
      }, 4800),
    );

    // Outcome notifications
    t.push(setTimeout(() => setShowOutcomes(true), 5800));

    return () => t.forEach(clearTimeout);
  }, [shouldAnimate]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const time = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="w-[300px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[hsl(185,25%,7%)]/70 shadow-2xl shadow-black/20 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15">
            <Phone className="h-3.5 w-3.5 text-teal-400" />
          </div>
          <div>
            <p className="text-[12px] font-medium leading-tight text-white/80">
              Discharge Call
            </p>
            <p className="text-[10px] leading-tight text-white/35">
              Sarah M. &middot; Max (Golden Retriever)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-[11px] tabular-nums text-white/40">
            {time}
          </span>
        </div>
      </div>

      {/* Transcript */}
      <div className="flex flex-col gap-2.5 overflow-hidden px-4 py-3">
        <AnimatePresence initial={false}>
          {MESSAGES.slice(0, visibleCount).map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className={cn(
                "flex flex-col gap-0.5",
                msg.role === "client" ? "items-end" : "items-start",
              )}
            >
              <span className="px-1 text-[10px] text-white/25">
                {msg.name}
              </span>
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed",
                  msg.role === "ai"
                    ? "rounded-tl-sm bg-teal-500/10 text-white/70"
                    : "rounded-tr-sm bg-white/[0.06] text-white/60",
                )}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1 px-1"
            >
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-teal-400/50" />
              <span
                className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-teal-400/50"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-teal-400/50"
                style={{ animationDelay: "0.4s" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Outcome notifications */}
      <AnimatePresence>
        {showOutcomes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="border-t border-white/[0.06] px-4 py-2.5"
          >
            <div className="flex flex-col gap-1.5">
              {OUTCOMES.map((outcome, i) => (
                <motion.div
                  key={outcome.text}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: i * 0.25,
                    duration: 0.3,
                    ease: EASE_OUT_EXPO,
                  }}
                  className="flex items-center gap-2"
                >
                  <outcome.icon className="h-3 w-3 text-teal-400" />
                  <span className="text-[11px] text-white/45">
                    {outcome.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

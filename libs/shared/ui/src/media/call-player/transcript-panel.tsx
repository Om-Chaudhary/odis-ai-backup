"use client";

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { formatTime } from "./utils";
import type { TranscriptPanelProps } from "./types";

export function TranscriptPanel({
  messages,
  currentTime,
  onMessageClick,
  className,
}: TranscriptPanelProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [userScrolled, setUserScrolled] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find active message
  const activeIndex = useMemo(() => {
    return messages.findIndex((msg, index) => {
      const nextMsg = messages[index + 1];
      const startTime = msg.time ?? msg.secondsFromStart ?? 0;
      const endTime = nextMsg?.time ?? nextMsg?.secondsFromStart ?? Infinity;
      return currentTime >= startTime && currentTime < endTime;
    });
  }, [messages, currentTime]);

  // Auto-scroll to active message
  useEffect(() => {
    if (activeIndex === -1 || userScrolled) return;

    const activeElement = messageRefs.current.get(activeIndex);
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex, userScrolled]);

  // Detect user scroll and reset after inactivity
  const handleScroll = useCallback(() => {
    setUserScrolled(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setUserScrolled(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "h-[280px] overflow-y-auto px-4 py-3",
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200",
        className
      )}
      onScroll={handleScroll}
    >
      <div className="flex flex-col gap-2">
        {messages.map((msg, index) => {
          const isActive = index === activeIndex;
          const isAssistant = msg.role === "assistant";
          const time = msg.time ?? msg.secondsFromStart ?? 0;

          return (
            <motion.div
              key={index}
              ref={(el) => {
                if (el) messageRefs.current.set(index, el);
                else messageRefs.current.delete(index);
              }}
              initial={false}
              animate={{
                backgroundColor: isActive
                  ? "rgba(20, 184, 166, 0.08)"
                  : "transparent",
                scale: isActive ? 1.005 : 1,
              }}
              transition={{ duration: 0.2 }}
              onClick={() => onMessageClick(time)}
              className={cn(
                "group flex gap-3 rounded-lg p-3 cursor-pointer",
                "transition-all duration-200",
                isActive
                  ? "ring-1 ring-teal-400/30 shadow-sm"
                  : "hover:bg-slate-50"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  "ring-1 transition-all duration-200",
                  isAssistant
                    ? isActive
                      ? "bg-teal-100 ring-teal-300 text-teal-700"
                      : "bg-teal-50 ring-teal-200 text-teal-600"
                    : isActive
                      ? "bg-blue-100 ring-blue-300 text-blue-700"
                      : "bg-blue-50 ring-blue-200 text-blue-600"
                )}
              >
                {isAssistant ? (
                  <Bot className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-xs font-semibold transition-colors duration-200",
                      isActive ? "text-slate-800" : "text-slate-500"
                    )}
                  >
                    {isAssistant ? "Assistant" : "User"}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium tabular-nums transition-colors duration-200",
                      isActive ? "text-teal-600" : "text-slate-400"
                    )}
                  >
                    {formatTime(time)}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-sm leading-relaxed transition-colors duration-200",
                    isActive ? "text-slate-800 font-medium" : "text-slate-600"
                  )}
                >
                  {msg.message}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRef, useEffect } from "react";
import { cn } from "~/lib/utils";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { TranscriptMessage } from "~/types/dashboard";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Bot, User } from "lucide-react";

interface SyncedTranscriptProps {
  messages: TranscriptMessage[];
  currentTime: number;
  onMessageClick?: (time: number) => void;
  className?: string;
}

export function SyncedTranscript({
  messages,
  currentTime,
  onMessageClick,
  className,
}: SyncedTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Find active message based on current time
  const activeIndex = messages.findIndex((msg, index) => {
    const nextMsg = messages[index + 1];
    const startTime = msg.time ?? msg.secondsFromStart ?? 0;
    const endTime = nextMsg?.time ?? nextMsg?.secondsFromStart ?? Infinity;
    return currentTime >= startTime && currentTime < endTime;
  });

  // Auto-scroll to active message
  useEffect(() => {
    if (activeIndex !== -1 && scrollRef.current) {
      const activeElement = messageRefs.current.get(activeIndex);
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [activeIndex]);

  return (
    <ScrollArea className={cn("h-[400px] pr-4", className)} ref={scrollRef}>
      <div className="flex flex-col gap-4">
        {messages.map((msg, index) => {
          const isActive = index === activeIndex;
          const isAssistant = msg.role === "assistant";
          const time = msg.time ?? msg.secondsFromStart ?? 0;

          return (
            <div
              key={index}
              ref={(el) => {
                if (el) messageRefs.current.set(index, el);
                else messageRefs.current.delete(index);
              }}
              onClick={() => onMessageClick?.(time)}
              className={cn(
                "group flex gap-3 rounded-lg p-3 transition-all duration-200",
                isActive
                  ? "bg-primary/5 ring-primary/20 ring-1"
                  : "hover:bg-muted/50 cursor-pointer",
              )}
            >
              <Avatar className="h-8 w-8 shrink-0 border">
                <AvatarFallback
                  className={cn(
                    isAssistant
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {isAssistant ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-900">
                    {isAssistant ? "Assistant" : "User"}
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {formatTime(time)}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {msg.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

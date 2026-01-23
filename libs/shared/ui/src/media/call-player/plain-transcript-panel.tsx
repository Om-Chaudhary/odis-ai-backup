"use client";

import { useMemo } from "react";
import { Bot, User } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { parseTranscript } from "./utils";
import type { PlainTranscriptPanelProps } from "./types";

export function PlainTranscriptPanel({
  transcript,
  className,
}: PlainTranscriptPanelProps): React.ReactElement {
  const lines = useMemo(() => parseTranscript(transcript), [transcript]);

  if (lines.length === 0) {
    return (
      <div className={cn("p-4 text-center text-sm text-slate-400", className)}>
        No transcript available
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-[280px] overflow-y-auto px-4 py-3",
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200",
        className
      )}
    >
      <div className="flex flex-col gap-3">
        {lines.map((line, index) => {
          const speakerLabel =
            line.speaker === "AI"
              ? "Assistant"
              : line.speaker === "User"
                ? "User"
                : "";

          return (
            <div key={index} className="flex gap-3">
              {/* Speaker badge */}
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  "ring-1",
                  line.speaker === "AI"
                    ? "bg-teal-50 ring-teal-200 text-teal-600"
                    : line.speaker === "User"
                      ? "bg-blue-50 ring-blue-200 text-blue-600"
                      : "bg-slate-50 ring-slate-200 text-slate-500"
                )}
              >
                {line.speaker === "AI" ? (
                  <Bot className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <span className="text-xs font-semibold text-slate-500">
                  {speakerLabel}
                </span>
                <p className="text-sm leading-relaxed text-slate-600">
                  {line.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

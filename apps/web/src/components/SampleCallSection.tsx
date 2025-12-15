"use client";

import { useState, useEffect, useRef } from "react";
import { BlurFade } from "~/components/ui/blur-fade";
import { Phone, Play, Pause, Mic } from "lucide-react";

// Animated Waveform Component
const AudioWaveform = ({ isPlaying }: { isPlaying: boolean }) => {
  const bars = 50;

  return (
    <div className="flex h-28 items-center justify-center gap-[3px] px-4">
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = Math.sin((i / bars) * Math.PI) * 0.5 + 0.5;
        const randomOffset = Math.sin(i * 0.7) * 0.2 + Math.cos(i * 0.3) * 0.15;

        return (
          <div
            key={i}
            className="rounded-full transition-all duration-200"
            style={{
              width: "3px",
              height: isPlaying
                ? `${(baseHeight + randomOffset) * 100}%`
                : `${baseHeight * 35}%`,
              background: isPlaying
                ? `linear-gradient(to top, #31aba3, #4fd1c5)`
                : `rgba(49, 171, 163, 0.3)`,
              boxShadow: isPlaying ? `0 0 8px rgba(49, 171, 163, 0.4)` : "none",
              animationDelay: `${i * 25}ms`,
              animation: isPlaying
                ? `waveform ${0.4 + Math.random() * 0.4}s ease-in-out infinite alternate`
                : "none",
            }}
          />
        );
      })}
    </div>
  );
};

export const SampleCallSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const totalDuration = 68;

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 100 / totalDuration;
        });
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentTime = (progress / 100) * totalDuration;

  return (
    <section
      id="sample-call"
      className="bg-background relative w-full py-24 lg:py-32"
    >
      <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
        {/* Section header */}
        <BlurFade delay={0.1} inView>
          <div className="mb-16 text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#31aba3]/30 bg-[#31aba3]/10 px-5 py-2 text-sm font-medium text-[#31aba3]">
              <Mic className="h-4 w-4" />
              Live Demo
            </span>
            <h2 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
              Experience a{" "}
              <span className="bg-gradient-to-r from-[#31aba3] to-[#4fd1c5] bg-clip-text text-transparent">
                Sample Call
              </span>
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Listen to how OdisAI naturally handles appointment booking and
              delights pet parents
            </p>
          </div>
        </BlurFade>

        {/* Main Audio Player Card */}
        <BlurFade delay={0.2} inView>
          <div className="relative mx-auto max-w-3xl">
            {/* Main card */}
            <div className="border-border bg-card relative overflow-hidden rounded-3xl border p-8 shadow-lg lg:p-10">
              {/* Call info header */}
              <div className="relative mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#31aba3] to-[#2da096] shadow-lg shadow-[#31aba3]/30">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Inbound Call Demo</p>
                    <p className="text-muted-foreground text-sm">
                      Appointment Scheduling • Bailey the Golden Retriever
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full bg-[#31aba3] ${isPlaying ? "animate-ping opacity-75" : "opacity-50"}`}
                    />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-[#31aba3]" />
                  </span>
                  <span className="text-sm font-medium text-[#31aba3]">
                    {isPlaying ? "Now Playing" : "Ready"}
                  </span>
                </div>
              </div>

              {/* Waveform visualization */}
              <div className="border-border bg-muted/50 relative mb-8 rounded-2xl border p-6">
                <AudioWaveform isPlaying={isPlaying} />
              </div>

              {/* Playback controls */}
              <div className="relative flex items-center gap-6">
                {/* Play button */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="group relative"
                >
                  <div className="absolute -inset-2 rounded-full bg-[#31aba3]/20 opacity-0 blur-lg transition-opacity group-hover:opacity-100" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#31aba3] to-[#2da096] shadow-lg shadow-[#31aba3]/30 transition-all group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-[#31aba3]/40">
                    {isPlaying ? (
                      <Pause
                        className="h-7 w-7 text-white"
                        fill="currentColor"
                      />
                    ) : (
                      <Play
                        className="ml-1 h-7 w-7 text-white"
                        fill="currentColor"
                      />
                    )}
                  </div>
                </button>

                <div className="flex-1 space-y-3">
                  {/* Progress bar */}
                  <div className="bg-muted relative h-2.5 overflow-hidden rounded-full">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#31aba3] to-[#4fd1c5] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                    {/* Playhead */}
                    <div
                      className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-[#31aba3] shadow-lg transition-all duration-300"
                      style={{ left: `calc(${progress}% - 10px)` }}
                    />
                  </div>
                  {/* Time display */}
                  <div className="flex justify-between text-sm">
                    <span className="font-mono">{formatTime(currentTime)}</span>
                    <span className="text-muted-foreground font-mono">
                      {formatTime(totalDuration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="border-border bg-muted/50 relative mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border p-5 sm:flex-row">
                <p className="text-muted-foreground text-center text-sm sm:text-left">
                  Want to hear more? Get a personalized demo for your clinic.
                </p>
                <a
                  href="mailto:hello@odis.ai?subject=Demo Request"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#31aba3] to-[#2da096] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#31aba3]/20 transition-all hover:shadow-xl hover:shadow-[#31aba3]/30"
                >
                  <span className="relative z-10">Book a Demo</span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform group-hover:translate-x-full" />
                </a>
              </div>
            </div>
          </div>
        </BlurFade>
      </div>

      {/* CSS for waveform animation */}
      <style jsx>{`
        @keyframes waveform {
          0% {
            transform: scaleY(0.4);
          }
          100% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </section>
  );
};

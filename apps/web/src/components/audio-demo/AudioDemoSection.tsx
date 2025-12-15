"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Mic, Phone, ArrowRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { AudioDemoCard, type DemoCardData } from "./AudioDemoCard";
import { SectionBackground } from "~/components/ui/section-background";

const DEMO_PHONE_NUMBER = "(925) 678-5640";
const DEMO_PHONE_TEL = "tel:+19256785640";

// Demo cards with pet avatars
const demoCards: DemoCardData[] = [
  {
    id: "appointment-booking",
    title: "Appointment Booking",
    duration: 68,
    audioUrl: "/audio/appointment-booking.mp3",
    petName: "Bailey",
    petImage:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: "after-hours",
    title: "After-Hours Call",
    duration: 54,
    audioUrl: "/audio/after-hours.mp3",
    petName: "Whiskers",
    petImage:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: "discharge-followup",
    title: "Discharge Follow-up",
    duration: 92,
    audioUrl: "/audio/discharge-followup.mp3",
    petName: "Luna",
    petImage:
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: "emergency-triage",
    title: "Emergency Triage",
    duration: 78,
    audioUrl: "/audio/emergency-triage.mp3",
    petName: "Cooper",
    petImage:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop&crop=face",
  },
];

// Balanced scattered positions - alternating up/down for even distribution
const scatteredPositions = [
  { offsetY: -12, rotation: -1.5 }, // Top-left: slight up
  { offsetY: 8, rotation: 1 }, // Top-right: slight down
  { offsetY: 6, rotation: 0.8 }, // Bottom-left: slight down
  { offsetY: -10, rotation: -0.8 }, // Bottom-right: slight up
];

// Animation variants
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function AudioDemoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  // Detect if mobile (for disabling animations)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Disable animations on mobile or if user prefers reduced motion
  const disableAnimations = isMobile || !!shouldReduceMotion;

  // Audio state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  // Hover state for blur effect
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Determine which card is "active" (playing or hovered)
  const activeCardId = playingId ?? hoveredId;

  // Initialize audio elements
  useEffect(() => {
    const currentAudioRefs = audioRefs.current;

    demoCards.forEach((card) => {
      if (!currentAudioRefs.has(card.id)) {
        const audio = new Audio(card.audioUrl);
        audio.preload = "metadata";
        currentAudioRefs.set(card.id, audio);
      }
    });

    return () => {
      // Cleanup audio elements
      currentAudioRefs.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      currentAudioRefs.clear();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update progress during playback
  useEffect(() => {
    const updateProgress = () => {
      if (playingId) {
        const audio = audioRefs.current.get(playingId);
        if (audio?.duration) {
          setProgress((prev) => ({
            ...prev,
            [playingId]: audio.currentTime / audio.duration,
          }));
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    if (playingId) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playingId]);

  // Handle audio end
  useEffect(() => {
    const currentAudioRefs = audioRefs.current;

    const handleEnded = (id: string) => {
      setPlayingId(null);
      setProgress((prev) => ({ ...prev, [id]: 0 }));
    };

    currentAudioRefs.forEach((audio, id) => {
      const onEnded = () => handleEnded(id);
      audio.addEventListener("ended", onEnded);
    });

    return () => {
      currentAudioRefs.forEach((audio, id) => {
        const onEnded = () => handleEnded(id);
        audio.removeEventListener("ended", onEnded);
      });
    };
  }, []);

  const handleTogglePlay = useCallback(
    (cardId: string) => {
      const audio = audioRefs.current.get(cardId);
      if (!audio) return;

      if (playingId === cardId) {
        // Pause current
        audio.pause();
        setPlayingId(null);
      } else {
        // Stop any playing audio
        if (playingId) {
          const currentAudio = audioRefs.current.get(playingId);
          currentAudio?.pause();
        }
        // Play new audio
        audio.play().catch(console.error);
        setPlayingId(cardId);
      }
    },
    [playingId],
  );

  // Base transition
  const transition = {
    duration: disableAnimations ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef}
      id="sample-calls"
      className="relative w-full overflow-hidden py-20 md:py-24 lg:py-32"
    >
      {/* Cohesive background */}
      <SectionBackground variant="transition" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          variants={disableAnimations ? {} : fadeUpVariant}
          initial={disableAnimations ? false : "hidden"}
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0 }}
          className="mb-12 text-center lg:mb-16"
        >
          {/* Pill badge */}
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/80 px-4 py-1.5 text-xs font-semibold tracking-widest text-teal-700 uppercase backdrop-blur-sm">
            <Mic className="h-4 w-4" />
            Live Demo
          </span>

          {/* Title */}
          <h2 className="font-display mb-4 text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Experience{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Sample Calls
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mx-auto max-w-xl text-base text-slate-600 sm:text-lg">
            Listen to how OdisAI naturally handles real conversations
          </p>
        </motion.div>

        {/* Balanced 2x2 Grid with Scattered Effect */}
        <div
          className={cn(
            // Even 2x2 grid at all breakpoints
            "mx-auto grid max-w-3xl grid-cols-2 gap-5",
            // Desktop: larger gaps for more breathing room
            "md:gap-8 lg:gap-10",
            // Vertical padding to accommodate scatter offsets
            "py-4 lg:py-6",
          )}
        >
          {demoCards.map((card, index) => {
            const position = scatteredPositions[index];
            const isActive = activeCardId === card.id;
            const shouldBlur = !isMobile && activeCardId !== null && !isActive;

            return (
              <AudioDemoCard
                key={card.id}
                card={card}
                index={index}
                isPlaying={playingId === card.id}
                progress={progress[card.id] ?? 0}
                onTogglePlay={() => handleTogglePlay(card.id)}
                // Only apply scattered positioning on desktop
                offsetY={isMobile ? 0 : (position?.offsetY ?? 0)}
                rotation={isMobile ? 0 : (position?.rotation ?? 0)}
                disableAnimations={disableAnimations}
                // Blur effect
                isBlurred={shouldBlur}
                onHoverStart={() => !isMobile && setHoveredId(card.id)}
                onHoverEnd={() => !isMobile && setHoveredId(null)}
              />
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          variants={disableAnimations ? {} : fadeUpVariant}
          initial={disableAnimations ? false : "hidden"}
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.6 }}
          className="mt-12 text-center lg:mt-16"
        >
          <p className="mb-4 text-sm text-slate-500">
            Want to hear how OdisAI handles your clinic&apos;s needs?
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            {/* Demo phone CTA */}
            <a
              href={DEMO_PHONE_TEL}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5",
                "border border-slate-200 bg-white/80 backdrop-blur-sm",
                "text-sm font-medium text-slate-700",
                "transition-all duration-200",
                "hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700",
              )}
            >
              <Phone className="h-4 w-4" />
              {DEMO_PHONE_NUMBER}
            </a>

            {/* Book demo CTA */}
            <a
              href="mailto:hello@odis.ai?subject=Demo Request"
              className={cn(
                "group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5",
                "bg-gradient-to-r from-teal-600 to-emerald-600",
                "text-sm font-medium text-white shadow-md shadow-teal-500/20",
                "transition-all duration-200",
                "hover:shadow-lg hover:shadow-teal-500/25",
              )}
            >
              Book a Demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

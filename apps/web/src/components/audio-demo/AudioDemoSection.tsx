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

// More dynamic scattered positions - asymmetric organic feel
const scatteredPositions = [
  { offsetY: 0, rotation: -2, translateX: 0 },
  { offsetY: 40, rotation: 1.5, translateX: 8 },
  { offsetY: 16, rotation: 0.8, translateX: -4 },
  { offsetY: 56, rotation: -1, translateX: 12 },
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

        {/* Dynamic Scattered Cards Layout */}
        <div
          className={cn(
            // Mobile: simple 2-col grid, no transforms
            "grid grid-cols-2 gap-4",
            // Tablet/Desktop: asymmetric layout with more breathing room
            "md:flex md:flex-wrap md:justify-center md:gap-6",
            // Extra bottom padding for scattered offsets
            "lg:gap-8 lg:pb-16",
          )}
        >
          {demoCards.map((card, index) => {
            const position = scatteredPositions[index];
            const isActive = activeCardId === card.id;
            const shouldBlur = !isMobile && activeCardId !== null && !isActive;

            return (
              <div
                key={card.id}
                className={cn(
                  // Mobile: auto width in grid
                  "w-full",
                  // Desktop: varied widths for organic feel
                  "md:w-[calc(50%-1rem)]",
                  "lg:w-[280px]",
                  // Horizontal offset for scattered effect
                  !isMobile && index === 1 && "lg:ml-8",
                  !isMobile && index === 2 && "lg:mr-4",
                  !isMobile && index === 3 && "lg:ml-12",
                )}
                style={{
                  // Additional horizontal shift on desktop
                  marginLeft: isMobile ? undefined : position?.translateX,
                }}
              >
                <AudioDemoCard
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
              </div>
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

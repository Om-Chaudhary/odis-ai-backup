"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Mic } from "lucide-react";
import { AudioDemoCard, type DemoCardData } from "./AudioDemoCard";
import { SectionBackground } from "~/components/ui/section-background";

// Demo cards with real VAPI call recordings - organized for 2-column staggered layout
const demoCards: DemoCardData[] = [
  // Real call: Chloe - Ear infection follow-up (61s)
  {
    id: "chloe-ear-followup",
    title: "Ear Infection Follow-up",
    description: "Checking on medication and ear cleaning",
    duration: 61,
    audioUrl:
      "https://storage.vapi.ai/019b0b35-9dfd-7eeb-8f84-827e9b9b1623-1765419709915-fa94c4a3-ab1a-4c9c-a33a-afc713b0494e-mono.wav",
    petName: "Chloe",
    petImage:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop&crop=face",
    callType: "outbound",
  },
  // Real call: Pishi - Deworming follow-up (60s)
  {
    id: "pishi-deworming-followup",
    title: "Deworming Follow-up",
    description: "Post-treatment check on scratching and stool",
    duration: 60,
    audioUrl:
      "https://storage.vapi.ai/019b0605-d8f5-7bb0-aaee-71af8165573c-1765332680243-7bf39c88-7600-44f3-9dd6-d53e78ed2773-mono.wav",
    petName: "Pishi",
    petImage:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop&crop=face",
    callType: "outbound",
  },
  // Real call: Lucy - Eye cleaning follow-up (38s)
  {
    id: "lucy-eye-followup",
    title: "Eye Cleaning Follow-up",
    description: "Quick check after eye crust removal",
    duration: 38,
    audioUrl:
      "https://storage.vapi.ai/019b0608-92cf-7660-90ab-217a1d8e8b28-1765332842717-615cc169-64c9-4123-b0bd-66fcc8479411-mono.wav",
    petName: "Lucy",
    petImage:
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop&crop=face",
    callType: "outbound",
  },
  // Real call: Missy - Nail trim follow-up (25s)
  {
    id: "missy-nail-followup",
    title: "Nail Trim Follow-up",
    description: "Brief check-in after grooming visit",
    duration: 25,
    audioUrl:
      "https://storage.vapi.ai/019b0608-a3d0-7006-893e-bb8780038c4a-1765332827998-573401b1-76ec-4db4-b9b0-12188db82df2-mono.wav",
    petName: "Missy",
    petImage:
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=100&h=100&fit=crop&crop=face",
    callType: "outbound",
  },
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
  const [speeds, setSpeeds] = useState<Record<string, number>>({});
  const [volumes, setVolumes] = useState<Record<string, number>>({});
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

  const handleSeek = useCallback((cardId: string, newProgress: number) => {
    const audio = audioRefs.current.get(cardId);
    if (!audio?.duration) return;

    audio.currentTime = newProgress * audio.duration;
    setProgress((prev) => ({ ...prev, [cardId]: newProgress }));
  }, []);

  const handleSpeedChange = useCallback((cardId: string, speed: number) => {
    const audio = audioRefs.current.get(cardId);
    if (audio) {
      audio.playbackRate = speed;
    }
    setSpeeds((prev) => ({ ...prev, [cardId]: speed }));
  }, []);

  const handleVolumeChange = useCallback((cardId: string, volume: number) => {
    const audio = audioRefs.current.get(cardId);
    if (audio) {
      audio.volume = volume;
    }
    setVolumes((prev) => ({ ...prev, [cardId]: volume }));
  }, []);

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

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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
            Hear{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Odis in Action
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mx-auto max-w-xl text-base text-slate-600 sm:text-lg">
            Real conversations. Real results. Listen to actual AI-handled calls.
          </p>
        </motion.div>

        {/* Two-column staggered grid with rotation */}
        <div className="grid grid-cols-1 gap-8 py-4 md:grid-cols-2 md:gap-10 lg:gap-12">
          {demoCards.map((card, index) => {
            const isActive = activeCardId === card.id;
            const shouldBlur = !isMobile && activeCardId !== null && !isActive;
            // Determine column: even indices = left (rotate left), odd = right (rotate right)
            const isLeftColumn = index % 2 === 0;
            const rotation = isMobile ? 0 : isLeftColumn ? -1.5 : 1.5;

            return (
              <AudioDemoCard
                key={card.id}
                card={card}
                index={index}
                isPlaying={playingId === card.id}
                progress={progress[card.id] ?? 0}
                onTogglePlay={() => handleTogglePlay(card.id)}
                onSeek={(p) => handleSeek(card.id, p)}
                onSpeedChange={(s) => handleSpeedChange(card.id, s)}
                onVolumeChange={(v) => handleVolumeChange(card.id, v)}
                currentSpeed={speeds[card.id] ?? 1}
                currentVolume={volumes[card.id] ?? 1}
                rotation={rotation}
                disableAnimations={disableAnimations}
                // Blur effect
                isBlurred={shouldBlur}
                onHoverStart={() => !isMobile && setHoveredId(card.id)}
                onHoverEnd={() => !isMobile && setHoveredId(null)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

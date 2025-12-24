"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@odis-ai/shared/util";

interface ParticleBackgroundProps {
  className?: string;
  particleCount?: number;
  color?: string;
  size?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

export function ParticleBackground({
  className,
  particleCount = 50,
  color = "white",
  size = 2,
}: ParticleBackgroundProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const generatedParticles = Array.from(
      { length: particleCount },
      (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 10,
      }),
    );
    setParticles(generatedParticles);
  }, [particleCount]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {isClient &&
        particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full opacity-30"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 8 - 4, 0],
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
    </div>
  );
}

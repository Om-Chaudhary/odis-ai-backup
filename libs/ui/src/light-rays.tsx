"use client";

import { cn } from "@odis-ai/utils";

interface LightRaysProps {
  className?: string;
}

export function LightRays({ className }: LightRaysProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
    >
      {/* Radial gradient for light rays effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(
              ellipse at top,
              rgba(255, 255, 255, 0.4) 0%,
              rgba(255, 255, 255, 0.2) 25%,
              rgba(255, 255, 255, 0.1) 50%,
              transparent 70%
            )
          `,
        }}
      />

      {/* Animated light rays */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Ray 1 */}
        <div
          className="animate-light-ray-1 absolute top-0 left-1/4 h-full w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent"
          style={{
            transform: "translateX(-50%)",
          }}
        />

        {/* Ray 2 */}
        <div
          className="animate-light-ray-2 absolute top-0 left-1/2 h-full w-px bg-gradient-to-b from-white/25 via-white/15 to-transparent"
          style={{
            transform: "translateX(-50%)",
          }}
        />

        {/* Ray 3 */}
        <div
          className="animate-light-ray-3 absolute top-0 left-3/4 h-full w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent"
          style={{
            transform: "translateX(-50%)",
          }}
        />

        {/* Ray 4 */}
        <div
          className="animate-light-ray-4 absolute top-0 left-1/6 h-full w-px bg-gradient-to-b from-white/15 via-white/8 to-transparent"
          style={{
            transform: "translateX(-50%)",
          }}
        />

        {/* Ray 5 */}
        <div
          className="animate-light-ray-5 absolute top-0 left-5/6 h-full w-px bg-gradient-to-b from-white/15 via-white/8 to-transparent"
          style={{
            transform: "translateX(-50%)",
          }}
        />
      </div>

      {/* Subtle glow overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(
              ellipse at center top,
              rgba(255, 255, 255, 0.1) 0%,
              transparent 60%
            )
          `,
        }}
      />
    </div>
  );
}

// Add the animations to the global styles
const lightRayStyles = `
  @keyframes light-ray-1 {
    0%, 100% {
      opacity: 0.2;
      transform: translateX(-50%) scaleY(1);
    }
    25% {
      opacity: 0.4;
      transform: translateX(-50%) scaleY(1.1);
    }
    50% {
      opacity: 0.3;
      transform: translateX(-50%) scaleY(0.9);
    }
    75% {
      opacity: 0.35;
      transform: translateX(-50%) scaleY(1.05);
    }
  }

  @keyframes light-ray-2 {
    0%, 100% {
      opacity: 0.25;
      transform: translateX(-50%) scaleY(1);
    }
    20% {
      opacity: 0.4;
      transform: translateX(-50%) scaleY(1.15);
    }
    40% {
      opacity: 0.3;
      transform: translateX(-50%) scaleY(0.85);
    }
    60% {
      opacity: 0.35;
      transform: translateX(-50%) scaleY(1.1);
    }
    80% {
      opacity: 0.2;
      transform: translateX(-50%) scaleY(0.95);
    }
  }

  @keyframes light-ray-3 {
    0%, 100% {
      opacity: 0.2;
      transform: translateX(-50%) scaleY(1);
    }
    30% {
      opacity: 0.35;
      transform: translateX(-50%) scaleY(1.2);
    }
    60% {
      opacity: 0.25;
      transform: translateX(-50%) scaleY(0.8);
    }
    90% {
      opacity: 0.3;
      transform: translateX(-50%) scaleY(1.1);
    }
  }

  @keyframes light-ray-4 {
    0%, 100% {
      opacity: 0.15;
      transform: translateX(-50%) scaleY(1);
    }
    35% {
      opacity: 0.3;
      transform: translateX(-50%) scaleY(1.25);
    }
    70% {
      opacity: 0.2;
      transform: translateX(-50%) scaleY(0.75);
    }
  }

  @keyframes light-ray-5 {
    0%, 100% {
      opacity: 0.15;
      transform: translateX(-50%) scaleY(1);
    }
    40% {
      opacity: 0.3;
      transform: translateX(-50%) scaleY(1.3);
    }
    80% {
      opacity: 0.2;
      transform: translateX(-50%) scaleY(0.7);
    }
  }

  .animate-light-ray-1 {
    animation: light-ray-1 8s ease-in-out infinite;
  }

  .animate-light-ray-2 {
    animation: light-ray-2 10s ease-in-out infinite;
  }

  .animate-light-ray-3 {
    animation: light-ray-3 12s ease-in-out infinite;
  }

  .animate-light-ray-4 {
    animation: light-ray-4 14s ease-in-out infinite;
  }

  .animate-light-ray-5 {
    animation: light-ray-5 16s ease-in-out infinite;
  }
`;

// Inject styles into the document
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = lightRayStyles;
  document.head.appendChild(styleSheet);
}

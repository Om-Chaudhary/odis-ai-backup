import { cn } from "~/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <svg
      className={cn("text-white", sizeClasses[size], className)}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Unified OdisAI Logo - Modern AI-inspired design */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Main circular element representing AI/neural network */}
      <circle cx="12" cy="12" r="8" fill="url(#logoGradient)" opacity="0.2" />

      {/* Central core */}
      <circle cx="12" cy="12" r="3" fill="currentColor" />

      {/* Neural network connections */}
      <path
        d="M12 5 L12 8 M12 16 L12 19 M5 12 L8 12 M16 12 L19 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Outer connection points */}
      <circle cx="12" cy="5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" />
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" />

      {/* Diagonal connections for more dynamic feel */}
      <path
        d="M8.5 8.5 L10.5 10.5 M15.5 8.5 L13.5 10.5 M8.5 15.5 L10.5 13.5 M15.5 15.5 L13.5 13.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

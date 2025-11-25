import Image from "next/image";
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
    <Image
      src="/icon-128.png"
      alt="Odis AI Logo"
      width={128}
      height={128}
      className={cn(sizeClasses[size], className)}
      priority
    />
  );
}

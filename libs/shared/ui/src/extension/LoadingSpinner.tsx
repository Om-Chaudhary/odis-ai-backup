import { cn } from "@odis-ai/shared/util";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  className,
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          sizeClasses[size],
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-500",
        )}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

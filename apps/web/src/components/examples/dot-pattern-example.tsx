import { DotPattern } from "@odis-ai/shared/ui";
import { cn } from "@odis-ai/shared/util";

export function DotPatternExample() {
  return (
    <div className="bg-background relative flex h-screen w-full items-center justify-center overflow-hidden rounded-lg border">
      {/* Subtle blue dots with radial gradient fade */}
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className={cn(
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
          // Subtle blue that complements teal - using slate-blue tones
          "fill-blue-500/10 dark:fill-blue-400/10",
        )}
      />

      <div className="relative z-10 text-center">
        <h1 className="text-4xl font-bold">Your Content Here</h1>
        <p className="text-muted-foreground">Subtle dot pattern background</p>
      </div>
    </div>
  );
}

// Example: Hero section with subtle dots
export function HeroWithDots() {
  return (
    <section className="relative min-h-[500px] w-full">
      {/* Very subtle dots - barely visible */}
      <DotPattern
        className={cn(
          "[mask-image:linear-gradient(to_bottom,white,transparent,transparent)]",
          "fill-blue-400/5 dark:fill-blue-300/5",
        )}
      />

      <div className="relative z-10 container mx-auto px-4 py-24">
        <h1 className="text-5xl font-bold">Welcome to ODIS AI</h1>
        <p className="text-muted-foreground mt-4 text-xl">
          Automated veterinary discharge calls
        </p>
      </div>
    </section>
  );
}

// Example: Card with subtle dots
export function CardWithDots({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card relative overflow-hidden rounded-lg border p-6">
      {/* Dots only in top-right corner */}
      <DotPattern
        width={16}
        height={16}
        cx={0.5}
        cy={0.5}
        cr={0.5}
        className={cn(
          "[mask-image:radial-gradient(300px_circle_at_top_right,white,transparent)]",
          "fill-blue-500/8",
        )}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Example: Dashboard background
export function DashboardWithDots({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Full-page subtle dots */}
      <DotPattern
        width={24}
        height={24}
        cx={1}
        cy={1}
        cr={0.8}
        className="fill-slate-400/5 dark:fill-slate-300/5"
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

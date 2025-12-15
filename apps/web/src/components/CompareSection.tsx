"use client";

import { Compare } from "~/components/ui/compare";
import { BlurFade } from "~/components/ui/blur-fade";
import { X, Check } from "lucide-react";

export const CompareSection = () => {
  const beforePoints = [
    "Missed calls during busy hours",
    "Overwhelmed front desk staff",
    "Lost appointment opportunities",
    "No after-hours coverage",
    "Manual discharge follow-ups",
  ];

  const afterPoints = [
    "Every call answered, 24/7",
    "Team focuses on in-clinic care",
    "Automated appointment booking",
    "Round-the-clock availability",
    "Automated follow-up calls",
  ];

  return (
    <section className="relative w-full py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <BlurFade delay={0.1} inView>
          <div className="mb-16 text-center">
            <span className="font-display text-primary mb-3 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
              <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
              The Difference
            </span>
            <h2 className="font-display text-foreground mb-4 text-4xl font-medium tracking-tight lg:text-5xl">
              Before & After OdisAI
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              See how veterinary clinics transform their phone operations
            </p>
          </div>
        </BlurFade>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Before/After comparison list */}
          <BlurFade delay={0.2} inView>
            <div className="space-y-8">
              <div>
                <h3 className="font-display text-foreground mb-6 flex items-center gap-3 text-2xl font-medium">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                    <X className="h-5 w-5 text-red-500" />
                  </span>
                  Without OdisAI
                </h3>
                <ul className="space-y-3">
                  {beforePoints.map((point, index) => (
                    <li
                      key={index}
                      className="text-muted-foreground flex items-start gap-3"
                    >
                      <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-display text-foreground mb-6 flex items-center gap-3 text-2xl font-medium">
                  <span className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                    <Check className="text-primary h-5 w-5" />
                  </span>
                  With OdisAI
                </h3>
                <ul className="space-y-3">
                  {afterPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#31aba3]" />
                      <span className="text-foreground font-medium">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </BlurFade>

          {/* Interactive compare slider */}
          <BlurFade delay={0.3} inView>
            <div className="glass-card rounded-2xl p-8">
              <Compare
                firstImage="/images/warm-veterinary-clinic-front-desk-with-phone-and-p.jpg"
                secondImage="/images/warm-veterinary-clinic-reception-with-phone-and-ha.jpg"
                firstImageClassName="object-cover object-center"
                secondImageClassname="object-cover object-center"
                className="h-[400px] w-full rounded-xl lg:h-[500px]"
                slideMode="hover"
                autoplay={true}
                autoplayDuration={8000}
              />
              <p className="text-muted-foreground mt-6 text-center text-sm">
                Hover to compare: Overwhelmed staff ← → Empowered team
              </p>
            </div>
          </BlurFade>
        </div>

        {/* ROI highlight */}
        <BlurFade delay={0.4} inView>
          <div className="mx-auto mt-16 max-w-3xl">
            <div className="glass-teal rounded-2xl p-8 text-center lg:p-10">
              <h3 className="font-display text-foreground mb-3 text-2xl font-medium lg:text-3xl">
                Average clinic recovers{" "}
                <span className="text-primary">$12,000/month</span>
              </h3>
              <p className="text-muted-foreground">
                in previously missed appointment revenue after implementing
                OdisAI
              </p>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
};

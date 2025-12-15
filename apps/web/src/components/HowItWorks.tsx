"use client";

import { Link2, Settings, Rocket } from "lucide-react";
import { BlurFade } from "~/components/ui/blur-fade";

export const HowItWorks = () => {
  const steps = [
    {
      icon: Link2,
      step: "01",
      title: "Connect",
      description: "Link OdisAI to your phone system and PIMS in minutes.",
    },
    {
      icon: Settings,
      step: "02",
      title: "Customize",
      description:
        "We train your AI on your clinic's services, hours, and scheduling rules.",
    },
    {
      icon: Rocket,
      step: "03",
      title: "Go Live",
      description:
        "Start answering calls and booking appointments automatically.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="from-background to-background relative w-full bg-gradient-to-b via-[#31aba3]/5 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <BlurFade delay={0.1} inView>
          <div className="mb-16 text-center">
            <span className="font-display text-primary mb-3 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
              <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
              Getting Started
            </span>
            <h2 className="font-display text-foreground mb-4 text-4xl font-medium tracking-tight lg:text-5xl">
              Up and Running in 3 Steps
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Get OdisAI answering calls for your clinic in days, not weeks
            </p>
          </div>
        </BlurFade>

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <BlurFade key={index} delay={0.2 + index * 0.1} inView>
              <div className="group relative h-full">
                <div className="glass-card h-full rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#31aba3]/10">
                  {/* Step number */}
                  <span className="font-display text-primary/10 absolute top-6 right-6 text-6xl font-bold">
                    {step.step}
                  </span>

                  {/* Icon */}
                  <div className="bg-primary/10 group-hover:bg-primary/15 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300">
                    <step.icon className="text-primary h-7 w-7" />
                  </div>

                  <h3 className="font-display text-foreground mb-3 text-2xl font-medium">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="from-primary/50 absolute top-1/2 -right-4 z-10 hidden h-px w-8 bg-gradient-to-r to-transparent md:block" />
                )}
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
};

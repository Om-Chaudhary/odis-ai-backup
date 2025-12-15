"use client";

import { NeonGradientCard } from "~/components/ui/neon-gradient-card";
import { BlurFade } from "~/components/ui/blur-fade";
import { ShimmerButton } from "~/components/ui/shimmer-button";
import { Calendar, ArrowRight } from "lucide-react";

export function PricingSection() {
  return (
    <section id="pricing" className="relative w-full py-24 lg:py-32">
      {/* Background gradient */}
      <div className="from-background to-background pointer-events-none absolute inset-0 bg-gradient-to-b via-[#31aba3]/5" />

      <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
        <BlurFade delay={0.1} inView>
          <div className="mb-16 text-center">
            <span className="font-display text-primary mb-3 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
              <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
              Get Started
            </span>
            <h2 className="font-display text-foreground mb-4 text-4xl font-medium tracking-tight lg:text-5xl">
              Let&apos;s Talk About Your Practice
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Every clinic is different. We&apos;ll create a custom plan that
              fits your call volume, integrations, and workflow.
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} inView>
          <NeonGradientCard className="mx-auto max-w-3xl">
            <div className="space-y-8 p-10 text-center lg:p-12">
              <div className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <Calendar className="text-primary h-8 w-8" />
              </div>

              <div>
                <h3 className="font-display text-foreground mb-3 text-3xl font-medium lg:text-4xl">
                  Book a 15-Minute Demo
                </h3>
                <p className="text-muted-foreground mx-auto max-w-xl text-lg">
                  See OdisAI in action. We&apos;ll walk through how it works for
                  your clinic and answer all your questions—no sales pitch.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 text-left sm:grid-cols-2">
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-foreground text-sm font-semibold">
                      ✓ See live call demo
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Hear how natural it sounds
                    </p>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-foreground text-sm font-semibold">
                      ✓ Discuss your PIMS
                    </p>
                    <p className="text-muted-foreground text-xs">
                      We integrate with major systems
                    </p>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-foreground text-sm font-semibold">
                      ✓ Custom pricing
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Based on your call volume
                    </p>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-foreground text-sm font-semibold">
                      ✓ Go live in days
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Not weeks or months
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                  <ShimmerButton
                    className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#31aba3] to-[#2da096] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:shadow-[#31aba3]/20"
                    onClick={() => {
                      window.location.href =
                        "mailto:hello@odis.ai?subject=Demo Request&body=Hi, I'd like to schedule a demo to learn more about OdisAI for my veterinary practice.";
                    }}
                  >
                    <span className="flex items-center gap-2">
                      Book Your Demo
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </ShimmerButton>

                  <a
                    href="tel:+1234567890"
                    className="border-border bg-background/50 inline-flex items-center justify-center gap-2 rounded-full border px-8 py-4 text-base font-medium backdrop-blur-sm transition-all hover:border-[#31aba3]/50 hover:bg-[#31aba3]/5"
                  >
                    Or call us directly
                  </a>
                </div>
              </div>

              <p className="text-muted-foreground text-sm">
                <strong className="text-foreground">
                  No commitment required.
                </strong>{" "}
                See if it&apos;s a good fit first.
              </p>
            </div>
          </NeonGradientCard>
        </BlurFade>

        {/* Trust signals */}
        <BlurFade delay={0.3} inView>
          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-6 text-sm font-medium">
              Trusted by 100+ veterinary clinics
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale">
              {/* Integration logos placeholder */}
              <div className="text-muted-foreground text-xs">IDEXX</div>
              <div className="text-muted-foreground text-xs">ezyVet</div>
              <div className="text-muted-foreground text-xs">Cornerstone</div>
              <div className="text-muted-foreground text-xs">Avimark</div>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}

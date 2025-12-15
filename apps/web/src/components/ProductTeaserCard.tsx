"use client";

import { PhoneCall, ArrowRight, Check } from "lucide-react";
import { BlurFade } from "~/components/ui/blur-fade";
import Image from "next/image";
import { usePostHog } from "posthog-js/react";

const DEMO_PHONE_NUMBER = "(925) 678-5640";
const DEMO_PHONE_TEL = "tel:+19256785640";

export const ProductTeaserCard = () => {
  const posthog = usePostHog();

  const handleDemoPhoneClick = () => {
    posthog?.capture("demo_phone_clicked", {
      location: "hero_primary_cta",
      phone_number: DEMO_PHONE_NUMBER,
    });
  };

  const handleBookDemoClick = () => {
    posthog?.capture("book_demo_clicked", {
      location: "hero_secondary_cta",
    });
  };

  return (
    <section className="relative w-full overflow-hidden bg-white px-6 pt-28 pb-20 lg:px-8 lg:pt-36 lg:pb-28">
      {/* Subtle gradient accent */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-0 h-[500px] w-[500px] rounded-full bg-[#31aba3]/[0.03] blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-[#31aba3]/[0.02] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
          {/* Left column - Content */}
          <div className="order-2 lg:order-1">
            {/* Eyebrow */}
            <BlurFade delay={0.1} inView>
              <p className="font-display text-primary mb-4 text-sm font-medium tracking-widest uppercase">
                AI-Powered Client Communications
              </p>
            </BlurFade>

            {/* Main headline */}
            <BlurFade delay={0.15} inView>
              <h1 className="font-display text-foreground text-4xl leading-[1.15] font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem]">
                Never miss another call.{" "}
                <span className="text-muted-foreground">
                  Your AI receptionist for every pet parent conversation.
                </span>
              </h1>
            </BlurFade>

            {/* Feature list */}
            <BlurFade delay={0.25} inView>
              <ul className="mt-8 space-y-3">
                {[
                  "Answer every call, day or night",
                  "Book appointments directly into your PIMS",
                  "Automate post-visit follow-up calls",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm text-slate-600"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#31aba3]/10">
                      <Check className="h-3 w-3 text-[#31aba3]" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </BlurFade>

            {/* CTA Buttons */}
            <BlurFade delay={0.3} inView>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Primary CTA - Demo Phone */}
                <a
                  href={DEMO_PHONE_TEL}
                  onClick={handleDemoPhoneClick}
                  className="group inline-flex items-center gap-3 rounded-full bg-[#31aba3] px-6 py-3.5 text-white transition-all duration-200 hover:bg-[#2a9690] hover:shadow-lg hover:shadow-[#31aba3]/20"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span className="font-medium">
                    Try Demo: {DEMO_PHONE_NUMBER}
                  </span>
                </a>

                {/* Secondary CTA */}
                <a
                  href="mailto:hello@odis.ai?subject=Demo Request"
                  onClick={handleBookDemoClick}
                  className="group inline-flex items-center gap-2 px-2 py-3.5 text-sm font-medium text-slate-700 transition-colors hover:text-[#31aba3]"
                >
                  Book a personalized demo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </BlurFade>

            {/* Trust line */}
            <BlurFade delay={0.35} inView>
              <p className="mt-8 text-sm text-slate-500">
                Trusted by 100+ veterinary clinics • IDEXX Neo integration
              </p>
            </BlurFade>
          </div>

          {/* Right column - Image */}
          <BlurFade delay={0.2} inView className="order-1 lg:order-2">
            <div className="relative">
              {/* Main image container */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                <Image
                  src="/images/warm-veterinary-clinic-reception-with-phone-and-ha.jpg"
                  alt="Veterinary clinic reception with staff helping pet parents"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Subtle overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              </div>

              {/* Floating card - stats */}
              <div className="absolute -bottom-6 -left-4 rounded-xl border border-slate-100 bg-white p-4 shadow-lg sm:-left-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                    <span className="text-sm font-bold text-emerald-600">
                      94%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      First-ring answer rate
                    </p>
                    <p className="text-xs text-slate-500">24/7 availability</p>
                  </div>
                </div>
              </div>

              {/* Floating card - time saved */}
              <div className="absolute top-6 -right-4 rounded-xl border border-slate-100 bg-white p-4 shadow-lg sm:-right-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#31aba3]/10">
                    <span className="text-sm font-bold text-[#31aba3]">
                      3h+
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Saved daily
                    </p>
                    <p className="text-xs text-slate-500">Per staff member</p>
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  );
};

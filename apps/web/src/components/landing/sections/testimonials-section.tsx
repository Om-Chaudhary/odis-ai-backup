"use client";

import { useRef } from "react";
import {
  m,
  LazyMotion,
  domAnimation,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { Star, Quote, Calendar, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@odis-ai/shared/util";
import { Marquee } from "../ui/marquee";
import { AvatarCircles } from "../ui/avatar-circles";
import { SectionBackground } from "../ui/section-background";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";

// Animation variants - consistent with hero
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const testimonials = [
  {
    quote:
      "Our front desk was drowning in calls. Now pet parents get instant answers after hours, and we're booking appointments we used to lose.",
    author: "Dr. Deepti Pal",
    role: "Veterinarian",
    clinic: "South Park Animal Hospital",
    location: "San Francisco, CA",
    metric: "15+ hrs/week saved",
    rating: 5,
    img: "/images/testimonials/dr-deepti-pal.webp",
    profileUrl: "#",
  },
  {
    quote:
      "Every discharged patient gets a follow-up call now—automatically. Clients tell us how impressed they are, and my techs finally have time for actual patient care.",
    author: "Dr. Tina Bath",
    role: "Practice Owner",
    clinic: "Alum Rock Animal Hospital",
    location: "San Jose, CA",
    metric: "94% reach rate",
    rating: 5,
    img: "/images/testimonials/dr-tais-perpetuo.webp",
    profileUrl: "#",
  },
  {
    quote:
      "We tracked our missed calls for a month. OdisAI recovered those appointments in the first week and keeps delivering.",
    author: "Jenn",
    role: "Practice Manager",
    clinic: "Del Valle Pet Hospital",
    location: "Livermore, CA",
    metric: "Calls recovered monthly",
    rating: 5,
    img: "/images/testimonials/jenn.webp",
    profileUrl: "#",
  },
];

// With only 3 testimonials, display all in one row

const ReviewCard = ({
  img,
  author,
  role,
  clinic,
  location,
  metric,
  quote,
  rating,
  featured = false,
}: {
  img: string;
  author: string;
  role: string;
  clinic: string;
  location?: string;
  metric?: string;
  quote: string;
  rating: number;
  featured?: boolean;
}) => {
  return (
    <figure
      className={cn(
        "group relative h-full w-80 cursor-pointer overflow-hidden rounded-2xl border p-6",
        "border-border/50 bg-background/60 backdrop-blur-sm",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/15",
        featured &&
          "border-teal-200/50 bg-gradient-to-br from-teal-50/80 to-white/80",
      )}
    >
      {/* Decorative quote mark */}
      <div className="absolute top-4 right-4 font-serif text-5xl text-teal-200/50 transition-colors group-hover:text-teal-300/60">
        &ldquo;
      </div>

      {/* Rating stars + Metric badge - top */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-0.5">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        {metric && (
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
            {metric}
          </span>
        )}
      </div>

      <blockquote className="relative z-10 mb-5 text-sm leading-relaxed text-slate-700">
        &quot;{quote}&quot;
      </blockquote>

      <div className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-4">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="h-11 w-11 rounded-full border-2 border-white object-cover shadow-md"
            width={44}
            height={44}
            alt={author}
            src={img}
          />
          <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] text-white shadow">
            ✓
          </div>
        </div>
        <div className="flex-1">
          <figcaption className="text-sm font-semibold text-slate-800">
            {author}
          </figcaption>
          <p className="text-muted-foreground text-xs">
            {role} · <span className="text-teal-600">{clinic}</span>
          </p>
          {location && (
            <p className="text-muted-foreground text-xs">{location}</p>
          )}
        </div>
      </div>
    </figure>
  );
};

export const TestimonialsSection = () => {
  const sectionVisibilityRef =
    useSectionVisibility<HTMLElement>("testimonials");
  const localRef = useRef<HTMLElement>(null);
  const isInView = useInView(localRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  // Combine refs for both visibility tracking and animation
  const sectionRef = (el: HTMLElement | null) => {
    (localRef as React.MutableRefObject<HTMLElement | null>).current = el;
    (
      sectionVisibilityRef as React.MutableRefObject<HTMLElement | null>
    ).current = el;
  };

  const avatarUrls = testimonials.map((t) => ({
    imageUrl: t.img,
    profileUrl: t.profileUrl,
  }));

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <LazyMotion features={domAnimation}>
    <section
      ref={sectionRef as React.LegacyRef<HTMLElement>}
      id="testimonials"
      className="relative w-full overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32"
    >
      {/* Warm mesh gradient - trustworthy, social proof emphasis */}
      <SectionBackground variant="mesh-warm" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <m.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.25 }}
          className="mb-12 text-center lg:mb-16"
        >
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/80 px-4 py-1.5 text-xs font-semibold tracking-widest text-teal-700 uppercase backdrop-blur-sm">
              <Quote className="h-3.5 w-3.5" />
              Testimonials
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50/80 px-3 py-1.5 text-xs font-medium text-amber-700">
              <BadgeCheck className="h-3 w-3" />
              Verified Reviews
            </span>
          </div>
          <h2 className="font-display mb-6 text-2xl font-medium tracking-tight text-slate-800 sm:text-3xl md:text-4xl lg:text-5xl">
            What Veterinary Teams Are{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Saying
            </span>
          </h2>
          <div className="mx-auto flex items-center justify-center gap-3">
            <AvatarCircles avatarUrls={avatarUrls} />
            <p className="text-muted-foreground text-lg">
              Trusted by leading veterinary practices
            </p>
          </div>
        </m.div>

        {/* Marquee testimonials */}
        <div className="relative mb-12 flex w-full flex-col items-center justify-center overflow-hidden lg:mb-16">
          <m.div
            variants={fadeUpVariant}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            transition={{ ...transition, delay: 0.35 }}
            className="w-full"
          >
            <Marquee pauseOnHover className="[--duration:30s]">
              {testimonials.map((review) => (
                <ReviewCard key={review.author} {...review} />
              ))}
            </Marquee>
          </m.div>

          {/* Gradient overlays */}
          <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r to-transparent" />
          <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l to-transparent" />
        </div>

        {/* Bottom CTA */}
        <m.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.45 }}
          className="text-center"
        >
          <div className="inline-flex flex-col items-center gap-4 rounded-2xl border border-teal-200/50 bg-gradient-to-br from-white/90 to-teal-50/60 px-8 py-6 backdrop-blur-sm sm:px-10 sm:py-7">
            <p className="text-sm font-medium text-slate-700">
              Join these veterinary teams transforming their practices
            </p>
            <Link
              href="/demo"
              className={cn(
                "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full px-7 py-3",
                "bg-gradient-to-r from-teal-600 to-emerald-600",
                "text-sm font-semibold text-white shadow-lg shadow-teal-500/25",
                "transition-all duration-300",
                "hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/30",
              )}
            >
              {/* Shimmer effect */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <Calendar className="relative h-4 w-4" />
              <span className="relative">Schedule Your Demo</span>
            </Link>
          </div>
        </m.div>
      </div>
    </section>
    </LazyMotion>
  );
};

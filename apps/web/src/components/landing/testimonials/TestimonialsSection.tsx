"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Star } from "lucide-react";
import { cn } from "~/lib/utils";
import { Marquee } from "~/components/ui/marquee";
import { AvatarCircles } from "~/components/ui/avatar-circles";
import { SectionBackground } from "~/components/ui/section-background";

// Animation variants - consistent with hero
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const testimonials = [
  {
    quote:
      "Before OdisAI, our front desk was drowning. Now pet parents get answers instantly, and we've seen a real bump in booked appointments.",
    author: "Dr. Deepti Pal",
    role: "Veterinarian",
    clinic: "Willow Creek Animal Hospital",
    rating: 5,
    img: "/images/testimonials/dr-deepti-pal.png",
    profileUrl: "#",
  },
  {
    quote:
      "The AI calls pet parents the day after discharge to check in. Our clients love it, and my techs finally have time to breathe.",
    author: "Dr. Tais Perpetuo",
    role: "Practice Owner",
    clinic: "Coastal Paws Veterinary",
    rating: 5,
    img: "/images/testimonials/dr-tais-perpetuo.png",
    profileUrl: "#",
  },
  {
    quote:
      "We calculated how many appointments we were losing from missed calls. OdisAI recovered them—and then some.",
    author: "Jenn",
    role: "Practice Manager",
    clinic: "Riverbend Pet Clinic",
    rating: 5,
    img: "/images/testimonials/jenn.png",
    profileUrl: "#",
  },
  {
    quote:
      "The voice sounds so natural that clients don't even realize it's AI until we tell them. It's honestly impressive.",
    author: "Kayla",
    role: "Veterinary Technician",
    clinic: "Maple Grove Vet",
    rating: 5,
    img: "/images/testimonials/kayla.png",
    profileUrl: "#",
  },
];

const firstRow = testimonials.slice(0, Math.ceil(testimonials.length / 2));
const secondRow = testimonials.slice(Math.ceil(testimonials.length / 2));

const ReviewCard = ({
  img,
  author,
  role,
  clinic,
  quote,
  rating,
  featured = false,
}: {
  img: string;
  author: string;
  role: string;
  clinic: string;
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

      {/* Rating stars - top */}
      <div className="mb-4 flex gap-0.5">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
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
        </div>
      </div>
    </figure>
  );
};

export const TestimonialsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const avatarUrls = testimonials.map((t) => ({
    imageUrl: t.img,
    profileUrl: t.profileUrl,
  }));

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="relative w-full overflow-hidden py-24 lg:py-32"
    >
      {/* Cohesive background */}
      <SectionBackground variant="transition" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.25 }}
          className="mb-12 text-center lg:mb-16"
        >
          <span className="font-display text-primary mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
            <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
            Testimonials
          </span>
          <h2 className="font-display mb-6 text-4xl font-medium tracking-tight text-slate-800 lg:text-5xl">
            What Veterinary Teams Are Saying
          </h2>
          <div className="mx-auto flex items-center justify-center gap-3">
            <AvatarCircles numPeople={100} avatarUrls={avatarUrls} />
            <p className="text-muted-foreground text-lg">
              Trusted by{" "}
              <span className="font-semibold text-slate-800">100+</span> clinics
            </p>
          </div>
        </motion.div>

        {/* Marquee testimonials */}
        <div className="relative mb-12 flex w-full flex-col items-center justify-center overflow-hidden lg:mb-16">
          <motion.div
            variants={fadeUpVariant}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            transition={{ ...transition, delay: 0.35 }}
            className="w-full"
          >
            <Marquee pauseOnHover className="[--duration:40s]">
              {firstRow.map((review) => (
                <ReviewCard key={review.author} {...review} />
              ))}
            </Marquee>
          </motion.div>

          <motion.div
            variants={fadeUpVariant}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            transition={{ ...transition, delay: 0.45 }}
            className="w-full"
          >
            <Marquee reverse pauseOnHover className="[--duration:40s]">
              {secondRow.map((review) => (
                <ReviewCard key={review.author} {...review} />
              ))}
            </Marquee>
          </motion.div>

          {/* Gradient overlays */}
          <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r to-transparent" />
          <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l to-transparent" />
        </div>
      </div>
    </section>
  );
};

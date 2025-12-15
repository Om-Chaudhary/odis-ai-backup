"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Star } from "lucide-react";
import { cn } from "~/lib/utils";
import { Marquee } from "~/components/ui/marquee";
import { AvatarCircles } from "~/components/ui/avatar-circles";
import { NumberTicker } from "~/components/ui/number-ticker";
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
}: {
  img: string;
  author: string;
  role: string;
  clinic: string;
  quote: string;
  rating: number;
}) => {
  return (
    <figure
      className={cn(
        "relative h-full w-80 cursor-pointer overflow-hidden rounded-2xl border p-6",
        "border-border/50 bg-background/50 hover:bg-background/80 backdrop-blur-sm",
        "transition-all duration-300 hover:shadow-xl hover:shadow-[#31aba3]/10",
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <img
          className="h-12 w-12 rounded-full border-2 border-[#31aba3]/20 object-cover"
          width={48}
          height={48}
          alt={author}
          src={img}
        />
        <div className="flex-1">
          <figcaption className="text-foreground text-sm font-semibold">
            {author}
          </figcaption>
          <p className="text-muted-foreground text-xs">
            {role} · {clinic}
          </p>
        </div>
      </div>

      {/* Rating stars */}
      <div className="mb-3 flex gap-0.5">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-[#31aba3] text-[#31aba3]" />
        ))}
      </div>

      <blockquote className="text-foreground/90 text-sm leading-relaxed">
        &quot;{quote}&quot;
      </blockquote>
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

  const impactStats = [
    { value: 847, label: "Calls handled", suffix: "" },
    { value: 126, label: "Appointments booked", suffix: "" },
    { value: 94, label: "Calls answered", suffix: "%" },
    { value: 4.9, label: "Client satisfaction", suffix: "/5", decimals: 1 },
  ];

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
          <h2 className="font-display text-foreground mb-6 text-4xl font-medium tracking-tight lg:text-5xl">
            What Veterinary Teams Are Saying
          </h2>
          <div className="mx-auto flex items-center justify-center gap-3">
            <AvatarCircles numPeople={100} avatarUrls={avatarUrls} />
            <p className="text-muted-foreground text-lg">
              Trusted by{" "}
              <span className="text-foreground font-semibold">100+</span>{" "}
              clinics
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

        {/* Impact stats */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.55 }}
        >
          <div className="glass-teal mx-auto max-w-4xl rounded-3xl p-6 sm:p-10 lg:p-12">
            <div className="mb-8 text-center lg:mb-10">
              <span className="font-display text-primary mb-2 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
                <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
                Last Week&apos;s Impact
              </span>
              <h3 className="font-display text-foreground text-2xl font-medium lg:text-3xl">
                Real results from real clinics
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
              {impactStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="font-display text-primary mb-2 flex items-baseline justify-center gap-1 text-4xl font-bold lg:text-5xl">
                    <NumberTicker
                      value={stat.value}
                      decimalPlaces={stat.decimals ?? 0}
                    />
                    <span className="text-2xl">{stat.suffix}</span>
                  </div>
                  <div className="text-muted-foreground text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

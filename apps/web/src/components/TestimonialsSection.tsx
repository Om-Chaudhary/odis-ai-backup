"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

export const TestimonialsSection = () => {
  const testimonials = [
    {
      quote:
        "Before OdisAI, our front desk was drowning. Now pet parents get answers instantly, and we've seen a real bump in booked appointments.",
      author: "Dr. Sarah Chen",
      role: "Owner",
      clinic: "Willow Creek Animal Hospital",
      rating: 5,
      delay: 0,
    },
    {
      quote:
        "The AI calls pet parents the day after discharge to check in. Our clients love it, and my techs finally have time to breathe.",
      author: "Maria Torres",
      role: "Practice Manager",
      clinic: "Coastal Paws Veterinary",
      rating: 5,
      delay: 0.1,
    },
    {
      quote:
        "We calculated how many appointments we were losing from missed calls. OdisAI recovered them—and then some.",
      author: "Dr. James Okonkwo",
      role: "DVM",
      clinic: "Riverbend Pet Clinic",
      rating: 5,
      delay: 0.2,
    },
  ];

  const impactStats = [
    { value: "847", label: "Calls handled" },
    { value: "126", label: "Appointments booked" },
    { value: "89", label: "Follow-ups completed" },
    { value: "64", label: "After-hours resolved" },
  ];

  return (
    <section
      id="case-studies"
      className="bg-secondary/40 w-full py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="text-primary mb-3 block text-xs font-medium tracking-widest uppercase">
            Testimonials
          </span>
          <h2 className="font-display text-foreground mb-4 text-3xl font-medium tracking-tight lg:text-4xl">
            What Veterinary Teams Are Saying
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-lg">
            See how clinics are reclaiming their time and never missing a pet
            parent call
          </p>
        </motion.div>

        <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: testimonial.delay }}
              className="glass-card flex h-full flex-col rounded-2xl p-8 transition-all duration-300 hover:shadow-xl"
            >
              {/* Rating stars */}
              <div className="mb-4 flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="fill-primary text-primary h-4 w-4" />
                ))}
              </div>

              <blockquote className="text-foreground/90 mb-6 flex-grow text-base leading-relaxed">
                &quot;{testimonial.quote}&quot;
              </blockquote>

              <div className="border-border border-t pt-4">
                <p className="text-foreground text-sm font-semibold">
                  {testimonial.author}
                </p>
                <p className="text-muted-foreground text-sm">
                  {testimonial.role}, {testimonial.clinic}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-teal mx-auto max-w-3xl rounded-2xl p-8 lg:p-10"
        >
          <div className="mb-8 text-center">
            <span className="text-primary mb-2 block text-xs font-medium tracking-widest uppercase">
              Last Week&apos;s Impact
            </span>
            <h3 className="text-foreground text-xl font-semibold">
              Real results from real clinics
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {impactStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-display text-primary mb-1 text-3xl font-bold lg:text-4xl">
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

"use client";

import { motion } from "framer-motion";
import { Link2, Settings, Rocket } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      icon: Link2,
      step: "01",
      title: "Connect",
      description: "Link OdisAI to your phone system and PIMS in minutes.",
      delay: 0,
    },
    {
      icon: Settings,
      step: "02",
      title: "Customize",
      description:
        "We train your AI on your clinic's services, hours, and scheduling rules.",
      delay: 0.15,
    },
    {
      icon: Rocket,
      step: "03",
      title: "Go Live",
      description:
        "Start answering calls and booking appointments automatically.",
      delay: 0.3,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="from-background via-secondary/30 to-background w-full bg-gradient-to-b py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="text-primary mb-3 block text-xs font-medium tracking-widest uppercase">
            Getting Started
          </span>
          <h2 className="font-display text-foreground mb-4 text-3xl font-medium tracking-tight lg:text-4xl">
            How It Works
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-lg">
            Get up and running with OdisAI in three simple steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: step.delay }}
              className="group relative"
            >
              <div className="glass-card h-full rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                {/* Step number */}
                <span className="font-display text-primary/8 absolute top-6 right-6 text-6xl font-bold">
                  {step.step}
                </span>

                {/* Icon */}
                <div className="bg-primary/8 group-hover:bg-primary/12 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300">
                  <step.icon className="text-primary h-6 w-6" />
                </div>

                <h3 className="text-foreground mb-3 text-xl font-semibold">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  {step.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="bg-border absolute top-1/2 -right-3 z-10 hidden h-px w-6 md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Clock, Phone, Zap } from "lucide-react";

type StatItem = {
  value: string;
  label: string;
  icon: typeof TrendingUp;
  delay: number;
};

const stats: StatItem[] = [
  {
    value: "94%",
    label: "Calls answered on first ring",
    icon: Phone,
    delay: 0,
  },
  {
    value: "3+ hrs",
    label: "Saved per staff member daily",
    icon: Clock,
    delay: 0.1,
  },
  {
    value: "40%",
    label: "Missed calls recovered",
    icon: TrendingUp,
    delay: 0.2,
  },
  { value: "24/7", label: "Always-on availability", icon: Zap, delay: 0.3 },
];

// @component: BankingScaleHero
export const BankingScaleHero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // @return
  return (
    <section className="bg-background w-full py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column - Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2"
            >
              <span className="bg-primary/8 text-primary flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium tracking-wider uppercase">
                <span className="bg-primary h-1 w-1 animate-pulse rounded-full" />
                Trusted by veterinary teams
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-foreground mb-5 text-3xl leading-tight font-medium tracking-tight text-balance lg:text-4xl"
            >
              Recovering revenue and saving hours for veterinary clinics{" "}
              <span className="text-muted-foreground">every day.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-muted-foreground mb-8 max-w-lg text-lg leading-relaxed"
            >
              Our AI voice agents handle the calls your team doesn&apos;t have
              time for—so you can focus on patient care.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <button className="group text-foreground hover:text-primary inline-flex items-center gap-2 text-sm font-medium transition-colors duration-200">
                Learn more about OdisAI
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>

          {/* Right column - Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                animate={
                  isVisible ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}
                }
                transition={{
                  duration: 0.6,
                  delay: stat.delay,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="glass-card rounded-2xl p-6 transition-shadow duration-300 hover:shadow-lg"
              >
                <div className="bg-primary/8 mb-4 flex h-10 w-10 items-center justify-center rounded-xl">
                  <stat.icon className="text-primary h-5 w-5" />
                </div>
                <div className="font-display text-foreground mb-1 text-3xl font-semibold tracking-tight">
                  {stat.value}
                </div>
                <p className="text-muted-foreground text-sm leading-snug">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

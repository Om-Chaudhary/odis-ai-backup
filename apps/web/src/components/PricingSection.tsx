"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "~/lib/utils";

type PlanLevel = "starter" | "growth" | "enterprise";

interface PricingPlan {
  name: string;
  level: PlanLevel;
  price: string;
  popular?: boolean;
  bestFor: string;
  features: string[];
}

const plans: PricingPlan[] = [
  {
    name: "Starter",
    price: "$199",
    level: "starter",
    bestFor: "Solo practitioners and small clinics",
    features: [
      "1 phone line",
      "Inbound call handling",
      "Appointment scheduling",
      "Basic PIMS integration",
      "Email support",
      "Unlimited AI voice minutes",
    ],
  },
  {
    name: "Growth",
    price: "$399",
    level: "growth",
    popular: true,
    bestFor: "Multi-vet practices ready to scale",
    features: [
      "3 phone lines",
      "Inbound + outbound calls",
      "Discharge follow-ups",
      "Priority PIMS integration",
      "Slack support + onboarding call",
      "Unlimited AI voice minutes",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    level: "enterprise",
    bestFor: "Multi-location and hospital groups",
    features: [
      "Unlimited phone lines",
      "Custom AI voice training",
      "Multi-location dashboard",
      "Dedicated account manager",
      "SLA guarantee",
      "Unlimited AI voice minutes",
    ],
  },
];

export function PricingSection() {
  const [selectedPlan, setSelectedPlan] = React.useState<PlanLevel>("growth");

  return (
    <section id="pricing" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="text-primary mb-3 block text-xs font-medium tracking-widest uppercase">
            Pricing
          </span>
          <h2 className="font-display text-foreground mb-4 text-3xl font-medium tracking-tight lg:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-lg">
            Start small and scale as you grow. All plans include unlimited AI
            voice minutes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => setSelectedPlan(plan.level)}
              className={cn(
                "relative cursor-pointer rounded-2xl p-8 transition-all duration-300",
                selectedPlan === plan.level
                  ? "glass-teal ring-primary scale-[1.02] shadow-xl ring-2"
                  : "glass-card hover:shadow-lg",
              )}
            >
              {/* Popular badge */}
              {plan.popular && (
                <span className="bg-foreground text-background absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-medium">
                  Most Popular
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-foreground mb-2 text-xl font-semibold">
                  {plan.name}
                </h3>
                <div className="mb-3 flex items-baseline gap-1">
                  <span className="font-display text-foreground text-4xl font-bold">
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className="text-muted-foreground text-base">
                      /month
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">{plan.bestFor}</p>
              </div>

              {/* Features list */}
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="text-foreground/80 flex items-center gap-3 text-sm"
                  >
                    <span className="bg-primary/10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                      <Check className="text-primary h-3 w-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <button
                className={cn(
                  "group flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300",
                  selectedPlan === plan.level
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-secondary text-foreground hover:bg-secondary/80",
                )}
              >
                {plan.level === "enterprise" ? "Contact Sales" : "Get Started"}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

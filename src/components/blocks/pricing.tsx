"use client";

import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
// import { useMediaQuery } from "~/hooks/use-media-query";
import { cn } from "~/lib/utils";
import { motion } from "framer-motion";
import { Check, Star, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import NumberFlow from "@number-flow/react";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Pricing({
  plans,
  title = "Pricing Plan",
  description = "Choose the plan that works for your veterinary practice\nAll plans include access to our AI-powered SOAP note generation and practice management tools.",
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = true; // Simplified for now

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    // Confetti animation can be added later if needed
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/20 via-emerald-50/30 to-emerald-50/20 py-20 sm:py-24 md:py-28 lg:py-32">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 h-16 w-16 animate-pulse rounded-full bg-[#31aba3]/20"></div>
        <div className="absolute top-32 right-20 h-12 w-12 animate-pulse rounded-full bg-[#31aba3]/20 delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 h-8 w-8 animate-pulse rounded-full bg-[#31aba3]/20 delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        <div className="mb-12 space-y-4 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl">
            {title}
          </h2>
          <p className="mx-auto max-w-3xl font-serif text-lg whitespace-pre-line text-slate-600">
            {description}
          </p>
        </div>

        <div className="mb-10 flex justify-center">
          <label className="relative inline-flex cursor-pointer items-center">
            <Label>
              <Switch
                checked={!isMonthly}
                onCheckedChange={handleToggle}
                className="relative"
              />
            </Label>
          </label>
          <span className="ml-2 font-semibold text-slate-700">
            Annual billing <span className="text-[#31aba3]">(Save 20%)</span>
          </span>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={
                isDesktop
                  ? {
                      y: plan.isPopular ? -20 : 0,
                      opacity: 1,
                      scale: plan.isPopular ? 1.05 : 1.0,
                    }
                  : { y: 0, opacity: 1 }
              }
              viewport={{ once: true }}
              transition={{
                duration: 1.6,
                type: "spring",
                stiffness: 100,
                damping: 30,
                delay: 0.4,
                opacity: { duration: 0.5 },
              }}
              className={cn(
                "relative overflow-hidden rounded-3xl border-2 p-8 text-center",
                plan.isPopular
                  ? "border-[#31aba3] bg-gradient-to-br from-[#31aba3]/5 via-[#2a9d96]/5 to-[#1f7a73]/5 shadow-2xl"
                  : "border-slate-200 bg-white/80 shadow-lg backdrop-blur-sm",
                "flex min-h-[500px] flex-col justify-between",
              )}
            >
              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#31aba3]/5 via-transparent to-[#2a9d96]/5 opacity-50"></div>

              {plan.isPopular && (
                <div className="absolute top-0 right-0 flex items-center rounded-tr-2xl rounded-bl-2xl bg-[#31aba3] px-3 py-1">
                  <Star className="h-4 w-4 fill-current text-white" />
                  <span className="ml-1 font-sans text-sm font-semibold text-white">
                    Popular
                  </span>
                </div>
              )}

              <div className="relative z-10 flex flex-1 flex-col">
                <div className="mb-6">
                  <h3 className="font-display mb-2 text-2xl font-bold text-slate-800">
                    {plan.name}
                  </h3>
                  <div className="mb-2 flex items-center justify-center gap-x-2">
                    <span className="text-5xl font-bold tracking-tight text-slate-800">
                      {plan.price === "Custom" ? (
                        plan.price
                      ) : (
                        <NumberFlow
                          value={
                            isMonthly
                              ? Number(plan.price)
                              : Number(plan.yearlyPrice)
                          }
                          format={{
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }}
                          transformTiming={{
                            duration: 500,
                            easing: "ease-out",
                          }}
                          willChange
                          className="font-variant-numeric: tabular-nums"
                        />
                      )}
                    </span>
                    <span className="text-lg leading-6 font-semibold tracking-wide text-slate-600">
                      / {plan.period}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {isMonthly ? "billed monthly" : "billed annually"}
                  </p>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#31aba3]" />
                      <span className="text-left font-medium text-slate-700">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Link
                    href={plan.href}
                    className={cn(
                      "group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-4 text-lg font-semibold transition-all duration-300",
                      plan.isPopular
                        ? "bg-[#31aba3] text-white shadow-lg hover:scale-105 hover:bg-[#2a9d96]"
                        : "border-2 border-[#31aba3] bg-white text-[#31aba3] shadow-md hover:scale-105 hover:bg-[#31aba3] hover:text-white",
                    )}
                  >
                    {plan.name === "Enterprise" && <Mail className="h-5 w-5" />}
                    <span className="relative z-10">{plan.buttonText}</span>
                    {plan.isPopular && (
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>
                    )}
                  </Link>
                  {plan.description && (
                    <p className="mt-4 text-sm text-slate-500">
                      {plan.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

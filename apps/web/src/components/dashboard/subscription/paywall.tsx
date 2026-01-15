"use client";

import { useState } from "react";
import { Check, Sparkles, Building2 } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import { cn } from "@odis-ai/shared/util";
import {
  SUBSCRIPTION_TIERS,
  TIER_DISPLAY_INFO,
  getPaymentLinkUrl,
  type SubscriptionTier,
} from "@odis-ai/shared/constants";
import { toast } from "sonner";

interface PaywallProps {
  clinicId: string;
  clinicName: string;
}

const PLAN_FEATURES: Record<Exclude<SubscriptionTier, "none">, string[]> = {
  inbound: [
    "After-hours call handling",
    "Intelligent message routing",
    "Voicemail transcription",
    "Emergency call detection",
    "Email notifications",
  ],
  professional: [
    "Everything in Inbound",
    "Automated discharge calls",
    "Batch call scheduling",
    "Appointment confirmations",
    "Call analytics dashboard",
    "Custom call scripts",
  ],
  enterprise: [
    "Everything in Professional",
    "Priority support",
    "Advanced analytics",
    "Custom integrations",
    "Dedicated account manager",
    "SLA guarantee",
  ],
};

export function Paywall({ clinicId, clinicName }: PaywallProps) {
  const [selectedTier, setSelectedTier] = useState<
    Exclude<SubscriptionTier, "none">
  >(SUBSCRIPTION_TIERS.PROFESSIONAL);

  const handleSelectPlan = (tier: Exclude<SubscriptionTier, "none">) => {
    const paymentUrl = getPaymentLinkUrl(tier, clinicId);
    if (!paymentUrl) {
      toast.error("Payment link not configured. Please contact support.");
      return;
    }

    setSelectedTier(tier);
    window.location.href = paymentUrl;
  };

  const tiers: Exclude<SubscriptionTier, "none">[] = [
    SUBSCRIPTION_TIERS.INBOUND,
    SUBSCRIPTION_TIERS.PROFESSIONAL,
    SUBSCRIPTION_TIERS.ENTERPRISE,
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30 px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-medium text-slate-600">
            {clinicName}
          </span>
        </div>
        <h1 className="mb-3 text-3xl font-bold text-slate-900 sm:text-4xl">
          Choose your plan
        </h1>
        <p className="mx-auto max-w-md text-lg text-slate-600">
          Select a subscription plan to access the Odis AI platform and start
          automating your clinic communications.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
        {tiers.map((tier) => {
          const info = TIER_DISPLAY_INFO[tier];
          const features = PLAN_FEATURES[tier];
          const isPopular = tier === SUBSCRIPTION_TIERS.PROFESSIONAL;
          const isSelected = selectedTier === tier;

          return (
            <Card
              key={tier}
              className={cn(
                "relative flex flex-col transition-all duration-200",
                isPopular &&
                  "border-teal-200 bg-gradient-to-b from-teal-50/50 to-white shadow-lg shadow-teal-100/50",
                isSelected && "ring-2 ring-teal-500",
              )}
            >
              {info.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white hover:bg-teal-600">
                  <Sparkles className="mr-1 h-3 w-3" />
                  {info.badge}
                </Badge>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{info.name}</CardTitle>
                <CardDescription>{info.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">
                    ${info.priceMonthly}
                  </span>
                  <span className="text-slate-500">/month</span>
                </div>

                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className={cn(
                    "w-full",
                    isPopular
                      ? "bg-teal-600 hover:bg-teal-700"
                      : "bg-slate-800 hover:bg-slate-900",
                  )}
                  onClick={() => handleSelectPlan(tier)}
                >
                  Get {info.name}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-sm text-slate-500">
          All plans include a 14-day money-back guarantee.
          <br />
          Need help choosing?{" "}
          <a
            href="mailto:support@odis.ai"
            className="text-teal-600 hover:underline"
          >
            Contact our team
          </a>
        </p>
      </div>
    </div>
  );
}

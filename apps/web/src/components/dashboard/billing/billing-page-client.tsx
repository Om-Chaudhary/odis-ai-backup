"use client";

import { useState } from "react";
import {
  CreditCard,
  Check,
  Sparkles,
  ArrowUpRight,
  Calendar,
  Shield,
  Zap,
  Headphones,
  BarChart3,
  Phone,
  PhoneOutgoing,
  MessageSquare,
  Crown,
  ChevronRight,
} from "lucide-react";
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
import { Skeleton } from "@odis-ai/shared/ui/skeleton";
import { cn } from "@odis-ai/shared/util";
import { api } from "~/trpc/client";
import {
  SUBSCRIPTION_TIERS,
  TIER_DISPLAY_INFO,
  STRIPE_BILLING_PORTAL_URL,
  getPaymentLinkUrl,
  type SubscriptionTier,
} from "@odis-ai/shared/constants";
import { toast } from "sonner";

const PLAN_FEATURES: Record<
  Exclude<SubscriptionTier, "none">,
  { icon: typeof Phone; label: string }[]
> = {
  inbound: [
    { icon: Phone, label: "After-hours call handling" },
    { icon: MessageSquare, label: "Intelligent message routing" },
    { icon: Headphones, label: "Voicemail transcription" },
    { icon: Shield, label: "Emergency call detection" },
    { icon: Zap, label: "Email notifications" },
  ],
  professional: [
    { icon: Phone, label: "Everything in Inbound" },
    { icon: PhoneOutgoing, label: "Automated discharge calls" },
    { icon: Calendar, label: "Batch call scheduling" },
    { icon: MessageSquare, label: "Appointment confirmations" },
    { icon: BarChart3, label: "Call analytics dashboard" },
    { icon: Zap, label: "Custom call scripts" },
  ],
  enterprise: [
    { icon: Crown, label: "Everything in Professional" },
    { icon: Headphones, label: "Priority support" },
    { icon: BarChart3, label: "Advanced analytics" },
    { icon: Zap, label: "Custom integrations" },
    { icon: Shield, label: "Dedicated account manager" },
    { icon: Check, label: "SLA guarantee" },
  ],
};

function CurrentPlanSkeleton() {
  return (
    <Card className="relative overflow-hidden border-slate-200/60">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-transparent to-transparent" />
      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function BillingPageClient() {
  const [selectedTier, setSelectedTier] = useState<Exclude<
    SubscriptionTier,
    "none"
  > | null>(null);

  const { data: status, isLoading: statusLoading } =
    api.subscription.getStatus.useQuery();

  const handleManageBilling = () => {
    window.open(STRIPE_BILLING_PORTAL_URL, "_blank");
  };

  const handleSelectPlan = (tier: Exclude<SubscriptionTier, "none">) => {
    if (!status?.clinicId) {
      toast.error("Unable to determine clinic ID");
      return;
    }

    const paymentUrl = getPaymentLinkUrl(
      tier,
      status.clinicId,
    );
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

  const currentTier = status?.tier ?? "none";
  const hasActiveSubscription = status?.hasActiveSubscription ?? false;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusDisplay = (statusValue: string | undefined) => {
    switch (statusValue) {
      case "active":
        return {
          label: "Active",
          className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        };
      case "trialing":
        return {
          label: "Trial",
          className: "bg-blue-100 text-blue-700 border-blue-200",
        };
      case "past_due":
        return {
          label: "Past Due",
          className: "bg-amber-100 text-amber-700 border-amber-200",
        };
      case "canceled":
        return {
          label: "Canceled",
          className: "bg-slate-100 text-slate-600 border-slate-200",
        };
      default:
        return {
          label: "No Plan",
          className: "bg-slate-100 text-slate-600 border-slate-200",
        };
    }
  };

  const statusDisplay = getStatusDisplay(status?.status);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-teal-50/20" />

      <div className="mx-auto max-w-5xl px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Billing
              </h1>
              <p className="text-sm text-slate-500">
                Manage your subscription and payment details
              </p>
            </div>
          </div>
        </div>

        {/* Current Plan Section */}
        <div className="mb-10">
          {statusLoading ? (
            <CurrentPlanSkeleton />
          ) : hasActiveSubscription ? (
            <Card className="relative overflow-hidden border-slate-200/60 shadow-sm">
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/60 via-transparent to-emerald-50/30" />
              <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-teal-100/40 blur-2xl" />

              <CardHeader className="relative pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2.5">
                      <CardDescription className="text-slate-500">
                        Current Plan
                      </CardDescription>
                      <Badge
                        className={cn(
                          "border text-xs font-medium",
                          statusDisplay.className,
                        )}
                      >
                        {statusDisplay.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-semibold text-slate-900">
                      {status?.tierName ?? "No Plan"}
                      {currentTier === SUBSCRIPTION_TIERS.PROFESSIONAL && (
                        <Sparkles className="ml-2 inline h-5 w-5 text-amber-500" />
                      )}
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      {TIER_DISPLAY_INFO[currentTier]?.description}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    className="shrink-0 gap-2 border-slate-200 bg-white/80 shadow-sm hover:border-slate-300 hover:bg-white"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Manage Billing
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="relative">
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">
                      Monthly Price
                    </p>
                    <p className="text-xl font-semibold text-slate-900">
                      ${status?.priceMonthly ?? 0}
                      <span className="text-sm font-normal text-slate-500">
                        /mo
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">
                      Next Billing Date
                    </p>
                    <p className="text-lg font-medium text-slate-900">
                      {formatDate(status?.currentPeriodEnd)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">
                      Payment Method
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-9 items-center justify-center rounded border border-slate-200 bg-white">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <span className="text-sm text-slate-600">
                        Manage in portal
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="relative overflow-hidden border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardDescription className="text-amber-700">
                      No Active Subscription
                    </CardDescription>
                    <CardTitle className="text-xl text-slate-900">
                      Choose a plan to get started
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-600">
                      Select a subscription plan below to unlock all features.
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Plans Section */}
        <div className="mb-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {hasActiveSubscription ? "Available Plans" : "Choose Your Plan"}
              </h2>
              <p className="text-sm text-slate-500">
                {hasActiveSubscription
                  ? "Upgrade or change your subscription anytime"
                  : "All plans include a 14-day money-back guarantee"}
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {tiers.map((tier) => {
              const info = TIER_DISPLAY_INFO[tier];
              const features = PLAN_FEATURES[tier];
              const isPopular = tier === SUBSCRIPTION_TIERS.PROFESSIONAL;
              const isCurrent = tier === currentTier;
              const isSelected = selectedTier === tier;
              const isUpgrade = hasActiveSubscription && !isCurrent;

              return (
                <Card
                  key={tier}
                  className={cn(
                    "relative flex flex-col transition-all duration-300",
                    isPopular
                      ? "border-teal-200 bg-gradient-to-b from-teal-50/60 to-white shadow-lg shadow-teal-100/50 md:-mt-2 md:mb-2"
                      : "border-slate-200/60 hover:border-slate-300 hover:shadow-md",
                    isCurrent && "ring-2 ring-teal-500 ring-offset-2",
                    isSelected && !isCurrent && "ring-2 ring-teal-400",
                  )}
                >
                  {/* Badge */}
                  {info.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="border-0 bg-gradient-to-r from-teal-500 to-teal-600 px-3 py-1 text-white shadow-md shadow-teal-500/30">
                        <Sparkles className="mr-1.5 h-3 w-3" />
                        {info.badge}
                      </Badge>
                    </div>
                  )}

                  {/* Current plan indicator */}
                  {isCurrent && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="border-0 bg-slate-900 px-2.5 py-1 text-xs text-white shadow-md">
                        Current
                      </Badge>
                    </div>
                  )}

                  <CardHeader className={cn("pb-4", info.badge && "pt-8")}>
                    <CardTitle className="text-xl font-semibold text-slate-900">
                      {info.name}
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                      {info.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 pb-6">
                    {/* Price */}
                    <div className="mb-6">
                      <span className="text-4xl font-bold tracking-tight text-slate-900">
                        ${info.priceMonthly}
                      </span>
                      <span className="text-slate-500">/month</span>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3">
                      {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                          <li key={index} className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                                isPopular
                                  ? "bg-teal-100 text-teal-600"
                                  : "bg-slate-100 text-slate-500",
                              )}
                            >
                              <Icon className="h-3 w-3" />
                            </div>
                            <span className="text-sm leading-tight text-slate-600">
                              {feature.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-0">
                    {isCurrent ? (
                      <Button
                        variant="outline"
                        className="w-full cursor-default border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-50"
                        disabled
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className={cn(
                          "w-full gap-2 transition-all",
                          isPopular
                            ? "bg-gradient-to-r from-teal-500 to-teal-600 shadow-md shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700"
                            : "bg-slate-900 hover:bg-slate-800",
                        )}
                        onClick={() => handleSelectPlan(tier)}
                      >
                        {isUpgrade ? "Switch to" : "Get"} {info.name}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-10 rounded-xl border border-slate-200/60 bg-slate-50/50 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 text-teal-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Secure billing powered by Stripe
                </p>
                <p className="text-xs text-slate-500">
                  Your payment information is encrypted and secure. Cancel
                  anytime.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <a
                href="mailto:support@odis.ai"
                className="transition-colors hover:text-teal-600"
              >
                Contact Support
              </a>
              <span className="text-slate-300">|</span>
              <a href="#" className="transition-colors hover:text-teal-600">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
